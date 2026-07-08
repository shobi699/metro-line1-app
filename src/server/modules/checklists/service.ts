import { prisma } from '@/server/db'

export interface ChecklistTemplateData {
  id: string
  name: string
  trainType: string
  stationLocation: string
  description: string | null
  items: Array<{ label: string; required: boolean; requirePhoto?: boolean }>
  isActive: boolean
}

export interface ChecklistRecordData {
  id: string
  templateId: string
  userId: string
  trainId: string | null
  stationId: string | null
  items: Array<{ label: string; checked: boolean; note?: string; photoAttached?: boolean }>
  signedAt: Date
  geoLocation: string | null
  completionTimeSeconds: number
  autoTicketGenerated: boolean
  user?: { name: string }
  template?: { name: string; trainType: string }
}

export async function listTemplates(): Promise<ChecklistTemplateData[]> {
  const templates = await prisma.checklistTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      trainType: true,
      stationLocation: true,
      description: true,
      items: true,
      isActive: true,
    },
  })

  return templates.map((t) => ({
    ...t,
    items: (t.items as Array<{ label: string; required: boolean; requirePhoto?: boolean }>) ?? [],
  }))
}

export async function createTemplate(data: {
  name: string
  trainType?: string
  stationLocation?: string
  description?: string
  items: Array<{ label: string; required: boolean; requirePhoto?: boolean }>
}): Promise<ChecklistTemplateData> {
  const template = await prisma.checklistTemplate.create({
    data: {
      name: data.name,
      trainType: data.trainType,
      stationLocation: data.stationLocation,
      description: data.description,
      items: data.items,
    },
    select: {
      id: true,
      name: true,
      trainType: true,
      stationLocation: true,
      description: true,
      items: true,
      isActive: true,
    },
  })

  return {
    ...template,
    items: (template.items as Array<{ label: string; required: boolean; requirePhoto?: boolean }>) ?? [],
  }
}

export async function submitChecklist(data: {
  templateId: string
  userId: string
  trainId?: string
  stationId?: string
  items: Array<{ label: string; checked: boolean; note?: string; photoAttached?: boolean }>
  geoLocation?: string
  completionTimeSeconds?: number
  autoTicketGenerated?: boolean
}): Promise<ChecklistRecordData> {
  const defectiveItems = data.items.filter(item => !item.checked || (item.note && item.note.trim() !== ''))
  const hasDefects = defectiveItems.length > 0

  const template = await prisma.checklistTemplate.findUnique({
    where: { id: data.templateId },
    select: { name: true }
  })
  
  const templateName = template?.name || 'چک‌لیست ناشناس'

  const record = await prisma.checklistRecord.create({
    data: {
      templateId: data.templateId,
      userId: data.userId,
      trainId: data.trainId,
      stationId: data.stationId,
      items: data.items,
      geoLocation: data.geoLocation,
      completionTimeSeconds: data.completionTimeSeconds ?? 0,
      autoTicketGenerated: hasDefects, // Override with backend validation
    },
    include: {
      user: { select: { name: true } },
      template: { select: { name: true, trainType: true } },
    },
  })

  if (hasDefects) {
    const defectsText = defectiveItems.map(i => `- ${i.label}${i.note ? ` (نقص: ${i.note})` : ' (عدم تایید)'}`).join('\n')
    const description = `گزارش نقص ثبت شده از طریق چک‌لیست مکانیزه:\n\n${defectsText}\n\nموقعیت: ${data.geoLocation || 'نامشخص'}`

    await prisma.ticket.create({
      data: {
        title: `نقص ایمنی/فنی در چک‌لیست: ${templateName}`,
        description,
        priority: 'high',
        status: 'open',
        creatorId: data.userId,
        annotations: {
          source: 'checklist',
          checklistRecordId: record.id,
          trainId: data.trainId || null,
          stationId: data.stationId || null
        }
      }
    })
  }

  return {
    ...record,
    items: (record.items as Array<{ label: string; checked: boolean; note?: string; photoAttached?: boolean }>) ?? [],
  }
}

export async function getUserChecklistHistory(
  userId: string,
  limit?: number,
): Promise<ChecklistRecordData[]> {
  const records = await prisma.checklistRecord.findMany({
    where: { userId },
    include: {
      user: { select: { name: true } },
      template: { select: { name: true, trainType: true } },
    },
    orderBy: { signedAt: 'desc' },
    take: limit ?? 20,
  })

  return records.map((r) => ({
    ...r,
    items: (r.items as Array<{ label: string; checked: boolean; note?: string; photoAttached?: boolean }>) ?? [],
  }))
}
