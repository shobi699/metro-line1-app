import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const [rules, templates] = await Promise.all([
      prisma.notificationRule.findMany(),
      prisma.notificationTemplate.findMany(),
    ])

    return NextResponse.json({ data: { rules, templates } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const { action, eventKey, ruleData, templateData } = body

    if (!eventKey) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'کلید رویداد الزامی است' } }, { status: 400 })
    }

    if (action === 'saveRule' && ruleData) {
      const rule = await prisma.notificationRule.upsert({
        where: { eventKey },
        update: {
          severity: ruleData.severity,
          channels: ruleData.channels,
          audience: ruleData.audience,
          smsIfUnseenMinutes: ruleData.smsIfUnseenMinutes,
          respectQuietHours: ruleData.respectQuietHours,
          isActive: ruleData.isActive,
        },
        create: {
          eventKey,
          severity: ruleData.severity || 'normal',
          channels: ruleData.channels || ['inapp'],
          audience: ruleData.audience,
          smsIfUnseenMinutes: ruleData.smsIfUnseenMinutes,
          respectQuietHours: ruleData.respectQuietHours !== false,
          isActive: ruleData.isActive !== false,
        },
      })

      // Write audit log
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'NotificationRule',
          entityId: rule.id,
          action: 'update',
          after: ruleData,
          reason: `بروزرسانی قوانین رویداد ${eventKey}`,
        },
      })

      return NextResponse.json({ data: { rule } })
    } else if (action === 'saveTemplate' && templateData) {
      // Find actor name
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      const actorName = dbUser?.name || user.id

      const template = await prisma.notificationTemplate.upsert({
        where: { eventKey },
        update: {
          title: templateData.title,
          body: templateData.body,
          smsText: templateData.smsText,
          link: templateData.link,
          isActive: templateData.isActive,
          updatedBy: actorName,
        },
        create: {
          eventKey,
          title: templateData.title,
          body: templateData.body,
          smsText: templateData.smsText,
          link: templateData.link,
          isActive: templateData.isActive !== false,
          updatedBy: actorName,
        },
      })

      // Write audit log
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'NotificationTemplate',
          entityId: template.id,
          action: 'update',
          after: templateData,
          reason: `بروزرسانی قالب رویداد ${eventKey}`,
        },
      })

      return NextResponse.json({ data: { template } })
    }

    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'عملیات نامعتبر است' } }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
