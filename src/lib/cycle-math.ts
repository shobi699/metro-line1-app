import dayjs from 'dayjs'
import { CycleTemplate, ShiftAssignment } from '@/features/shifts'
import type { ShiftTemplateDto, ShiftAssignmentDto } from '@/features/shifts/api-client'
import { groupKeyFor, GROUPS_LIST } from '@/lib/shift-grouping'

/**
 * Calculates the specific shift details for a target date based on template assignments.
 * 
 * Formula:
 * For rotational shifts: Day of Cycle = (Current Date - Anchor Date) mod CycleLength
 * For staff shifts: Aligned with the Jalali calendar weekly cycle (Saturday = Day 1, Friday = Day 7)
 */
export function calculateShiftForDate(
  date: dayjs.Dayjs,
  assignment: ShiftAssignment,
  template: CycleTemplate
) {
  const current = date.startOf('day')
  const anchor = dayjs(assignment.anchorDate).startOf('day')
  
  if (template.type === 'staff') {
    // Jalali week structure:
    // Saturday -> Day 1
    // Sunday -> Day 2
    // Monday -> Day 3
    // Tuesday -> Day 4
    // Wednesday -> Day 5
    // Thursday -> Day 6
    // Friday -> Day 7
    // In JavaScript/Dayjs: Sunday = 0, Monday = 1, ..., Saturday = 6
    const jsDay = current.day()
    // Map jsDay to Persian week index (0-indexed: Saturday=0, Sunday=1, ..., Friday=6)
    const persianIndex = (jsDay + 1) % 7
    
    return template.shifts.find((s) => s.day === persianIndex + 1)
  } else {
    const cycleLength = template.length || 6
    const diffDays = current.diff(anchor, 'day')
    const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength
    
    return template.shifts.find((s) => s.day === cycleIndex + 1)
  }
}

export const MOCK_USERS_LIST = [
  { id: 'current', name: 'مهندس حسینی (کاربر جاری)', group: 'A', shiftType: '9-15', nationalId: '0012345678', role: 'operator' },
  { id: 'user-ali', name: 'علی علوی', group: 'A', shiftType: '9-15', nationalId: '0023456789', role: 'operator' },
  { id: 'user-reza', name: 'رضا رضایی', group: 'B', shiftType: '12-24', nationalId: '0034567890', role: 'operator' },
  { id: 'user-mohammad', name: 'محمد محمدی', group: 'C', shiftType: '12-24', nationalId: '0045678901', role: 'operator' },
  { id: 'user-hossein', name: 'حسین حسینی (ستادی)', group: 'ستادی', shiftType: 'ستادی', nationalId: '0056789012', role: 'operator' }
]

export const MOCK_GROUPS_LIST = GROUPS_LIST

/**
 * زنجیره‌ی یافتن انتساب برای یک کاربر:
 * (۱) انتساب کاربر-محور → (۲) کلید ترکیبی {نوع}:{گروه} → (۳) گروه ساده → (۴) پیش‌فرض A.
 * روی هر دو نوع ShiftAssignment و ShiftAssignmentDto کار می‌کند چون فقط فیلدهای مشترک را می‌خواند.
 */
function findAssignmentForUser<
  T extends { targetType: string; targetId: string },
>(userId: string, assignments: T[], group: string, compositeKey: string): T | undefined {
  return (
    assignments.find((a) => a.targetType === 'user' && a.targetId === userId) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === compositeKey) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === group) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === 'A')
  )
}

export function getShiftForUserAndDate(
  userId: string,
  date: dayjs.Dayjs,
  assignments: ShiftAssignment[],
  templates: CycleTemplate[],
  usersList = MOCK_USERS_LIST,
  customGroup?: string
) {
  const user = usersList.find((u) => u.id === userId)
  const { group, compositeKey } = groupKeyFor({
    shift: customGroup || user?.group,
    shiftType: user?.shiftType,
  })

  const assignment = findAssignmentForUser(userId, assignments, group, compositeKey)
  if (!assignment) {
    return null
  }

  const template = templates.find((t) => t.id === assignment.templateId)
  if (!template) {
    return null
  }

  const current = date.startOf('day')
  const anchor = dayjs(assignment.anchorDate).startOf('day')

  if (template.type === 'staff') {
    const jsDay = current.day()
    const persianIndex = (jsDay + 1) % 7
    const shift = template.shifts.find((s) => s.day === persianIndex + 1)

    return {
      shift,
      group,
      templateName: template.name,
      dayOfCycle: persianIndex + 1,
      cycleLength: 7
    }
  } else {
    const cycleLength = template.length || 6
    const diffDays = current.diff(anchor, 'day')
    const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength
    const shift = template.shifts.find((s) => s.day === cycleIndex + 1)

    return {
      shift,
      group,
      templateName: template.name,
      dayOfCycle: cycleIndex + 1,
      cycleLength
    }
  }
}

/**
 * Same logic as getShiftForUserAndDate but works with DB DTO types.
 * Used when templates/assignments come from the database API instead of Zustand.
 * `customFields` کامل کاربر را می‌گیرد تا گروه (shift) و نوع (shiftType) با هم برای کلید ترکیبی استفاده شوند.
 */
export function getShiftForUserAndDateFromDb(
  userId: string,
  date: dayjs.Dayjs,
  assignments: ShiftAssignmentDto[],
  templates: ShiftTemplateDto[],
  customFields?: Record<string, unknown> | null
) {
  const { group, compositeKey } = groupKeyFor(customFields)

  const assignment = findAssignmentForUser(userId, assignments, group, compositeKey)
  if (!assignment) {
    return null
  }

  const template = templates.find((t) => t.id === assignment.templateId)
  if (!template) {
    return null
  }

  const current = date.startOf('day')
  const anchor = dayjs(assignment.anchorDate).startOf('day')

  if (template.type === 'staff') {
    const jsDay = current.day()
    const persianIndex = (jsDay + 1) % 7
    const shift = template.shifts.find((s) => s.day === persianIndex + 1)

    return {
      shift,
      group,
      templateName: template.name,
      dayOfCycle: persianIndex + 1,
      cycleLength: 7,
    }
  } else {
    const cycleLength = template.length || 6
    const diffDays = current.diff(anchor, 'day')
    const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength
    const shift = template.shifts.find((s) => s.day === cycleIndex + 1)

    return {
      shift,
      group,
      templateName: template.name,
      dayOfCycle: cycleIndex + 1,
      cycleLength,
    }
  }
}
