import { prisma } from '@/server/db'
import type { Prisma } from '@/generated/prisma/client'
import { z } from 'zod'
import { shiftTemplateSchema, shiftAssignmentSchema } from '@/lib/zod/roster'
import { groupKeyFor, parseTargetId } from '@/lib/shift-grouping'

export { shiftTemplateSchema, shiftAssignmentSchema } from '@/lib/zod/roster'

export async function listTemplates() {
  return prisma.shiftTemplate.findMany({
    where: { isActive: true },
    include: { assignments: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createTemplate(data: z.infer<typeof shiftTemplateSchema>, actorId: string) {
  const [template] = await prisma.$transaction([
    prisma.shiftTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        length: data.length,
        shifts: data.shifts as unknown as Prisma.InputJsonValue,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'ShiftTemplate',
        entityId: 'pending',
        action: 'create',
        after: { name: data.name, type: data.type, length: data.length },
      },
    }),
  ])
  return template
}

export async function updateTemplate(
  id: string,
  data: Partial<z.infer<typeof shiftTemplateSchema>>,
  actorId: string,
) {
  const existing = await prisma.shiftTemplate.findUnique({ where: { id } })
  if (!existing) throw new Error('قالب یافت نشد')

  const [template] = await prisma.$transaction([
    prisma.shiftTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type }),
        ...(data.length && { length: data.length }),
        ...(data.shifts && { shifts: data.shifts as unknown as Prisma.InputJsonValue }),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'ShiftTemplate',
        entityId: id,
        action: 'update',
        before: { name: existing.name, type: existing.type },
        after: data,
      },
    }),
  ])
  return template
}

export async function deleteTemplate(id: string, actorId: string) {
  const [template] = await prisma.$transaction([
    prisma.shiftTemplate.update({
      where: { id },
      data: { isActive: false },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'ShiftTemplate',
        entityId: id,
        action: 'delete',
      },
    }),
  ])
  return template
}

export async function listAssignments() {
  return prisma.shiftAssignment.findMany({
    include: { template: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAssignment(data: z.infer<typeof shiftAssignmentSchema>, actorId: string) {
  const template = await prisma.shiftTemplate.findUnique({ where: { id: data.templateId } })
  if (!template) throw new Error('قالب یافت نشد')

  // حذف تخصیص قبلی برای همین target
  await prisma.shiftAssignment.deleteMany({
    where: { targetType: data.targetType, targetId: data.targetId },
  })

  const anchorDate = new Date(data.anchorDate)
  anchorDate.setHours(0, 0, 0, 0)

  // پاکسازی شیفت‌های اوراید در آینده (بعد از لنگرگاه) تا الگوی جدید بتواند بدون تداخل کار کند
  if (data.targetType === 'user') {
    await prisma.shift.deleteMany({
      where: {
        userId: data.targetId,
        date: { gte: anchorDate },
      },
    })
  } else if (data.targetType === 'group') {
    const users = await prisma.user.findMany({ select: { id: true, customFields: true } })
    const { group: targetGroup } = parseTargetId(data.targetId)
    
    const matchedUserIds = users.filter((u) => {
      const cf = u.customFields as Record<string, unknown> | null
      const key = groupKeyFor(cf)
      return data.targetId.includes(':') 
        ? key.compositeKey === data.targetId
        : key.group === targetGroup
    }).map((u) => u.id)

    if (matchedUserIds.length > 0) {
      await prisma.shift.deleteMany({
        where: {
          userId: { in: matchedUserIds },
          date: { gte: anchorDate },
        },
      })
    }
  }

  const [assignment] = await prisma.$transaction([
    prisma.shiftAssignment.create({
      data: {
        templateId: data.templateId,
        targetType: data.targetType,
        targetId: data.targetId,
        anchorDate,
      },
      include: { template: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'ShiftAssignment',
        entityId: 'pending',
        action: 'create',
        after: data,
      },
    }),
  ])
  return assignment
}

export async function deleteAssignment(id: string, actorId: string) {
  const [assignment] = await prisma.$transaction([
    prisma.shiftAssignment.delete({ where: { id } }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'ShiftAssignment',
        entityId: id,
        action: 'delete',
      },
    }),
  ])
  return assignment
}
