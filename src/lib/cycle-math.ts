import dayjs from 'dayjs'
import { CycleTemplate, ShiftAssignment } from '@/features/shifts'

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
  { id: 'current', name: 'مهندس حسینی (کاربر جاری)', group: 'A', nationalId: '0012345678', role: 'operator' },
  { id: 'user-ali', name: 'علی علوی', group: 'A', nationalId: '0023456789', role: 'operator' },
  { id: 'user-reza', name: 'رضا رضایی', group: 'B', nationalId: '0034567890', role: 'operator' },
  { id: 'user-mohammad', name: 'محمد محمدی', group: 'C', nationalId: '0045678901', role: 'operator' },
  { id: 'user-hossein', name: 'حسین حسینی (ستادی)', group: 'Staff', nationalId: '0056789012', role: 'operator' }
]

export const MOCK_GROUPS_LIST = [
  { key: 'A', name: 'گروه الف (A)' },
  { key: 'B', name: 'گروه ب (B)' },
  { key: 'C', name: 'گروه ج (C)' },
  { key: 'Staff', name: 'نیروهای ستادی (اداری)' }
]

export function getShiftForUserAndDate(
  userId: string,
  date: dayjs.Dayjs,
  assignments: ShiftAssignment[],
  templates: CycleTemplate[],
  usersList = MOCK_USERS_LIST,
  customGroup?: string
) {
  const user = usersList.find((u) => u.id === userId)
  const userGroup = customGroup || user?.group || 'A'
  
  // Try user-specific assignment first, fallback to group assignment
  let assignment = assignments.find((a) => a.targetType === 'user' && a.targetId === userId)
  if (!assignment) {
    assignment = assignments.find((a) => a.targetType === 'group' && a.targetId === userGroup)
  }
  
  if (!assignment) {
    return null
  }
  
  const template = templates.find((t) => t.id === assignment!.templateId)
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
      group: userGroup,
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
      group: userGroup,
      templateName: template.name,
      dayOfCycle: cycleIndex + 1,
      cycleLength
    }
  }
}
