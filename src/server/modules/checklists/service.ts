import { prisma } from '@/server/db'

export interface ChecklistTemplateData {
  id: string
  name: string
  description: string | null
  items: Array<{ label: string; required: boolean }>
  isActive: boolean
}

export interface ChecklistRecordData {
  id: string
  templateId: string
  userId: string
  trainId: string | null
  stationId: string | null
  items: Array<{ label: string; checked: boolean; note?: string }>
  signedAt: Date
  geoLocation: string | null
  user?: { name: string }
  template?: { name: string }
}

export async function listTemplates(): Promise<ChecklistTemplateData[]> {
  const templates = await prisma.checklistTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      items: true,
      isActive: true,
    },
  })

  return templates.map((t) => ({
    ...t,
    items: (t.items as Array<{ label: string; required: boolean }>) ?? [],
  }))
}

export async function createTemplate(data: {
  name: string
  description?: string
  items: Array<{ label: string; required: boolean }>
}): Promise<ChecklistTemplateData> {
  const template = await prisma.checklistTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      items: data.items,
    },
    select: {
      id: true,
      name: true,
      description: true,
      items: true,
      isActive: true,
    },
  })

  return {
    ...template,
    items: (template.items as Array<{ label: string; required: boolean }>) ?? [],
  }
}

export async function submitChecklist(data: {
  templateId: string
  userId: string
  trainId?: string
  stationId?: string
  items: Array<{ label: string; checked: boolean; note?: string }>
  geoLocation?: string
}): Promise<ChecklistRecordData> {
  const record = await prisma.checklistRecord.create({
    data: {
      templateId: data.templateId,
      userId: data.userId,
      trainId: data.trainId,
      stationId: data.stationId,
      items: data.items,
      geoLocation: data.geoLocation,
    },
    include: {
      user: { select: { name: true } },
      template: { select: { name: true } },
    },
  })

  return {
    ...record,
    items: (record.items as Array<{ label: string; checked: boolean; note?: string }>) ?? [],
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
      template: { select: { name: true } },
    },
    orderBy: { signedAt: 'desc' },
    take: limit ?? 20,
  })

  return records.map((r) => ({
    ...r,
    items: (r.items as Array<{ label: string; checked: boolean; note?: string }>) ?? [],
  }))
}
