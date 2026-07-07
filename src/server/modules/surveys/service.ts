import { prisma } from '@/server/db'

export interface SurveyInput {
  key: string
  title: string
  description?: string
  schema: any // Array of questions or structured JSON
  audience?: any // Targeting: { roles?: string[], groups?: string[], stations?: string[] }
  isAnonymous?: boolean
  isMandatory?: boolean
  opensAt?: Date
  closesAt?: Date
  remindDays?: any
  quotaPercent?: number
  createdBy: string
}

export async function createSurvey(data: SurveyInput) {
  const survey = await prisma.survey.create({
    data: {
      key: data.key,
      title: data.title,
      description: data.description || null,
      status: 'published', // default published for test/usage simplicity
      schema: data.schema,
      audience: data.audience || null,
      isAnonymous: data.isAnonymous !== undefined ? data.isAnonymous : true,
      isMandatory: data.isMandatory !== undefined ? data.isMandatory : false,
      opensAt: data.opensAt || null,
      closesAt: data.closesAt || null,
      remindDays: data.remindDays || null,
      quotaPercent: data.quotaPercent || null,
      createdBy: data.createdBy,
    },
  })

  // Find all active users matching the audience filters
  const allUsers = await prisma.user.findMany({
    where: { status: 'active' },
    include: { role: true },
  })

  const targetedUsers = allUsers.filter((u) => {
    if (!data.audience) return true
    const aud = data.audience

    if (aud.roles && aud.roles.length > 0) {
      if (!aud.roles.includes(u.role.key)) return false
    }

    const uFields = (u.customFields as Record<string, any>) || {}
    if (aud.stations && aud.stations.length > 0) {
      if (!aud.stations.includes(uFields.station)) return false
    }

    if (aud.groups && aud.groups.length > 0) {
      const uGroup = uFields.shift || uFields.group
      if (!aud.groups.includes(uGroup)) return false
    }

    return true
  })

  // Create invitees
  if (targetedUsers.length > 0) {
    await prisma.surveyInvitee.createMany({
      data: targetedUsers.map((u) => ({
        surveyId: survey.id,
        userId: u.id,
      })),
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.createdBy,
      action: 'create',
      entity: 'Survey',
      entityId: survey.id,
      metadata: { key: survey.key },
    },
  })

  return survey
}

export async function listActiveSurveys(userId: string, roleKey: string) {
  // Find all published surveys where user is invited and hasn't responded yet
  const invitees = await prisma.surveyInvitee.findMany({
    where: {
      userId,
      respondedAt: null,
      survey: {
        status: 'published',
        OR: [
          { closesAt: null },
          { closesAt: { gt: new Date() } },
        ],
      },
    },
    include: {
      survey: {
        include: {
          creator: { select: { name: true } },
        },
      },
    },
    orderBy: { survey: { createdAt: 'desc' } },
  })

  return invitees.map((i) => i.survey)
}

export async function getSurveyByKey(key: string, userId: string) {
  const survey = await prisma.survey.findUnique({
    where: { key },
    include: {
      creator: { select: { name: true } },
    },
  })

  if (!survey) return null

  const invitee = await prisma.surveyInvitee.findUnique({
    where: { surveyId_userId: { surveyId: survey.id, userId } },
  })

  return { survey, invitee }
}

export async function submitSurveyResponse(
  key: string,
  userId: string,
  answers: any,
  durationSec?: number,
) {
  const survey = await prisma.survey.findUnique({
    where: { key },
  })

  if (!survey) throw new Error('پیمایش یافت نشد')

  const invitee = await prisma.surveyInvitee.findUnique({
    where: { surveyId_userId: { surveyId: survey.id, userId } },
  })

  if (!invitee) throw new Error('شما به این پیمایش دعوت نشده‌اید')
  if (invitee.respondedAt) throw new Error('شما قبلاً به این پیمایش پاسخ داده‌اید')

  // Get user details for segments
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  const uFields = (user?.customFields as Record<string, any>) || {}
  const segment = {
    role: user?.role?.key || 'unknown',
    station: uFields.station || 'unknown',
    group: uFields.shift || uFields.group || 'unknown',
  }

  // Transaction to record response & update invitee safely
  await prisma.$transaction([
    prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        userId: survey.isAnonymous ? null : userId,
        segment,
        answers,
        durationSec,
      },
    }),
    prisma.surveyInvitee.update({
      where: { id: invitee.id },
      data: { respondedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'create',
        entity: 'SurveyResponse',
        entityId: survey.id,
        metadata: { isAnonymous: survey.isAnonymous },
      },
    }),
  ])

  return { success: true }
}

export async function getSurveyAnalytics(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
  })

  if (!survey) return null

  const totalInvitees = await prisma.surveyInvitee.count({
    where: { surveyId },
  })

  const respondedCount = await prisma.surveyInvitee.count({
    where: { surveyId, respondedAt: { not: null } },
  })

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId },
  })

  // Privacy protection rule:
  // Group segments (role, station, group). If any group has < 5 responses, mask or merge it.
  const segmentCounts: Record<string, Record<string, number>> = {
    role: {},
    station: {},
    group: {},
  }

  responses.forEach((res) => {
    const seg = (res.segment as Record<string, string>) || {}
    for (const key of ['role', 'station', 'group']) {
      const val = seg[key] || 'unknown'
      segmentCounts[key][val] = (segmentCounts[key][val] || 0) + 1
    }
  })

  // Determine which values are allowed (>= 5 count)
  const allowedSegments: Record<string, string[]> = {
    role: [],
    station: [],
    group: [],
  }

  for (const key of ['role', 'station', 'group']) {
    for (const [val, count] of Object.entries(segmentCounts[key])) {
      if (count >= 5) {
        allowedSegments[key].push(val)
      }
    }
  }

  // Process answers with masked segments
  const processedResponses = responses.map((res) => {
    const seg = (res.segment as Record<string, string>) || {}
    const maskedSegment: Record<string, string> = {}
    for (const key of ['role', 'station', 'group']) {
      const val = seg[key] || 'unknown'
      if (allowedSegments[key].includes(val)) {
        maskedSegment[key] = val
      } else {
        maskedSegment[key] = 'سایر (حفظ حریم خصوصی)'
      }
    }
    return {
      answers: res.answers,
      segment: maskedSegment,
    }
  })

  return {
    survey,
    stats: {
      totalInvitees,
      respondedCount,
      participationRate: totalInvitees > 0 ? Math.round((respondedCount / totalInvitees) * 100) : 0,
    },
    responses: processedResponses,
  }
}

export async function listAllSurveysAdmin() {
  const surveys = await prisma.survey.findMany({
    include: {
      creator: { select: { name: true } },
      _count: {
        select: {
          responses: true,
          invitees: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return surveys.map((s) => ({
    id: s.id,
    key: s.key,
    title: s.title,
    description: s.description,
    status: s.status,
    isAnonymous: s.isAnonymous,
    isMandatory: s.isMandatory,
    createdAt: s.createdAt,
    creatorName: s.creator.name,
    totalInvited: s._count.invitees,
    totalResponded: s._count.responses,
  }))
}

export async function updateSurveyStatus(id: string, status: string, userId: string) {
  const survey = await prisma.survey.update({
    where: { id },
    data: { status },
  })

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      action: 'update',
      entity: 'Survey',
      entityId: id,
      metadata: { status },
    },
  })

  return survey
}
