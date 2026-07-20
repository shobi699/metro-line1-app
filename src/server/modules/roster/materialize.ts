import dayjs from 'dayjs'
import { prisma } from '@/server/db'
import type { ShiftCode } from '@/generated/prisma/client'
import type { CycleShiftDetail, ShiftTemplateData, ShiftAssignmentData, ShiftCodeValue } from '@/features/shifts/types'
import { groupKeyFor } from '@/lib/shift-grouping'

/**
 * زنجیره‌ی یافتن انتساب برای یک کاربر بر اساس customFields:
 * کاربر-محور → کلید ترکیبی {نوع}:{گروه} → گروه ساده → پیش‌فرض A.
 */
function findAssignment<T extends { targetType: string; targetId: string }>(
  userId: string,
  customFields: Record<string, unknown> | null,
  assignments: T[],
): T | undefined {
  const { group, compositeKey } = groupKeyFor(customFields)
  return (
    assignments.find((a) => a.targetType === 'user' && a.targetId === userId) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === compositeKey) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === group) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === 'A')
  )
}

/**
 * محاسبه شیفت یک تاریخ بر اساس قالب چرخه و anchor date
 * برای چرخه‌های نوبتی: Day of Cycle = (Current Date - Anchor Date) mod CycleLength
 * برای چرخه‌های ستادی: هماهنگ با هفته جلالی (شنبه = روز ۱، جمعه = روز ۷)
 */
export function calculateShiftForDate(
  date: dayjs.Dayjs,
  assignment: ShiftAssignmentData,
  template: ShiftTemplateData,
): CycleShiftDetail | null {
  const current = date.startOf('day')
  const anchor = dayjs(assignment.anchorDate).startOf('day')

  if (template.type === 'staff') {
    const jsDay = current.day()
    const persianIndex = (jsDay + 1) % 7
    return template.shifts.find((s) => s.day === persianIndex + 1) ?? null
  }

  const cycleLength = template.length || 6
  const diffDays = Math.round(current.diff(anchor, 'hour') / 24)
  const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength
  return template.shifts.find((s) => s.day === cycleIndex + 1) ?? null
}

/**
 * resolve یک شیفت برای کاربر و تاریخ مشخص — merge کردن چرخه + override دیتابیس
 * اولویت: manual > roster > cycle
 */
export async function resolveShiftForUser(
  userId: string,
  date: dayjs.Dayjs,
  customFields?: Record<string, unknown> | null,
): Promise<{ shift: CycleShiftDetail | null; source: 'cycle' | 'roster' | 'manual'; templateName: string }> {
  const dateStr = date.format('YYYY-MM-DD')
  const dateObj = new Date(dateStr)
  dateObj.setHours(0, 0, 0, 0)

  // 1. DB override (manual یا roster)
  const dbShift = await prisma.shift.findUnique({
    where: { userId_date: { userId, date: dateObj } },
  })

  if (dbShift) {
    const code = dbShift.code as ShiftCodeValue
    return {
      shift: {
        day: date.day() + 1,
        code,
        label: code,
        hours: code === 'morning' || code === 'evening' ? 9 : code === 'night' ? 12 : code === 'office' ? 8.75 : 0,
        startTime: code === 'morning' ? '07:00' : code === 'evening' ? '16:00' : code === 'night' ? '19:00' : code === 'office' ? '07:30' : '',
        endTime: code === 'morning' ? '16:00' : code === 'evening' ? '01:00' : code === 'night' ? '07:00' : code === 'office' ? '16:15' : '',
      },
      source: (dbShift.source as 'cycle' | 'roster' | 'manual') ?? 'manual',
      templateName: 'مدیریت دستی',
    }
  }

  // 2. Cycle template
  const assignments = await prisma.shiftAssignment.findMany({
    include: { template: true },
  })

  const assignment = findAssignment(userId, customFields ?? null, assignments)

  if (!assignment || !assignment.template) {
    return { shift: null, source: 'cycle', templateName: 'بدون قالب' }
  }

  const templateData: ShiftTemplateData = {
    id: assignment.template.id,
    name: assignment.template.name,
    type: assignment.template.type as 'rotational' | 'staff',
    length: assignment.template.length,
    shifts: assignment.template.shifts as unknown as CycleShiftDetail[],
  }

  const assignmentData: ShiftAssignmentData = {
    id: assignment.id,
    templateId: assignment.templateId,
    targetType: assignment.targetType as 'user' | 'group',
    targetId: assignment.targetId,
    anchorDate: dayjs(assignment.anchorDate).format('YYYY-MM-DD'),
  }

  const shift = calculateShiftForDate(date, assignmentData, templateData)
  return {
    shift,
    source: 'cycle',
    templateName: templateData.name,
  }
}

/**
 * Materialize یک دوره: چرخه‌ها رو برای بازه مشخص در DB ذخیره می‌کنه
 * فقط شیفت‌های source="cycle" رو بازنویسی می‌کنه (manual و roster دست‌نخورده می‌مونن)
 */
export async function materializePeriod(
  startDate: Date,
  endDate: Date,
  actorId: string,
): Promise<{ created: number; updated: number; skipped: number }> {
  const assignments = await prisma.shiftAssignment.findMany({
    include: { template: true },
  })

  if (assignments.length === 0) {
    return { created: 0, updated: 0, skipped: 0 }
  }

  // همه کاربران + گروه‌شون
  const users = await prisma.user.findMany({
    select: { id: true, customFields: true },
  })

  let created = 0
  let updated = 0
  let skipped = 0

  const start = dayjs(startDate)
  const end = dayjs(endDate)
  const totalDays = end.diff(start, 'day') + 1

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      // تخصیص بر اساس کلید ترکیبی گروه×نوع از customFields، با عقب‌نشینی به گروه ساده و A
      const assignment = findAssignment(user.id, user.customFields as Record<string, unknown> | null, assignments)
      if (!assignment) continue

      const templateData: ShiftTemplateData = {
        id: assignment.template.id,
        name: assignment.template.name,
        type: assignment.template.type as 'rotational' | 'staff',
        length: assignment.template.length,
        shifts: assignment.template.shifts as unknown as CycleShiftDetail[],
      }
      const assignmentData: ShiftAssignmentData = {
        id: assignment.id,
        templateId: assignment.templateId,
        targetType: assignment.targetType as 'user' | 'group',
        targetId: assignment.targetId,
        anchorDate: dayjs(assignment.anchorDate).format('YYYY-MM-DD'),
      }

      for (let i = 0; i < totalDays; i++) {
        const date = start.add(i, 'day')
        const shift = calculateShiftForDate(date, assignmentData, templateData)
        if (!shift) {
          skipped++
          continue
        }

        const dateObj = new Date(date.format('YYYY-MM-DD'))
        dateObj.setHours(0, 0, 0, 0)

        // فقط اگه شیفت موجود manual یا roster نباشه، cycle رو بنویس
        const existing = await tx.shift.findUnique({
          where: { userId_date: { userId: user.id, date: dateObj } },
        })

        if (existing && (existing.source === 'manual' || existing.source === 'roster')) {
          skipped++
          continue
        }

        const code = shift.code as ShiftCode
        if (existing) {
          await tx.shift.update({
            where: { id: existing.id },
            data: { code, source: 'cycle' },
          })
          updated++
        } else {
          await tx.shift.create({
            data: { userId: user.id, date: dateObj, code, source: 'cycle' },
          })
          created++
        }
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        entity: 'Shift',
        entityId: `materialize_${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`,
        action: 'create',
        after: { created, updated, skipped, period: { start: startDate, end: endDate } },
      },
    })
  })

  return { created, updated, skipped }
}
