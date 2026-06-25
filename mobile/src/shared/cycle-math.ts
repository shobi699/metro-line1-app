import { CycleTemplate, ShiftAssignment } from '../stores/shifts'

export function calculateShiftForDate(
  date: Date,
  assignment: ShiftAssignment,
  template: CycleTemplate
) {
  const current = new Date(date)
  current.setHours(0, 0, 0, 0)
  
  const anchor = new Date(assignment.anchorDate)
  anchor.setHours(0, 0, 0, 0)
  
  if (template.type === 'staff') {
    const jsDay = current.getDay() // Sunday=0, Monday=1, ..., Saturday=6
    // Persian week order: Saturday=0, Sunday=1, ..., Friday=6
    const persianIndex = (jsDay + 1) % 7
    return template.shifts.find((s) => s.day === persianIndex + 1)
  } else {
    const cycleLength = template.length || 6
    const diffTime = current.getTime() - anchor.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const cycleIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength
    
    return template.shifts.find((s) => s.day === cycleIndex + 1)
  }
}

export function getShiftForUserAndDate(
  userId: string,
  date: Date,
  assignments: ShiftAssignment[],
  templates: CycleTemplate[],
  customGroup?: string
) {
  const userGroup = customGroup || 'A'
  
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
  
  const shift = calculateShiftForDate(date, assignment, template)
  
  const current = new Date(date)
  current.setHours(0, 0, 0, 0)
  const anchor = new Date(assignment.anchorDate)
  anchor.setHours(0, 0, 0, 0)
  
  let dayOfCycle = 1
  if (template.type === 'staff') {
    dayOfCycle = ((current.getDay() + 1) % 7) + 1
  } else {
    const diffTime = current.getTime() - anchor.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    dayOfCycle = (((diffDays % template.length) + template.length) % template.length) + 1
  }

  return {
    shift,
    group: userGroup,
    templateName: template.name,
    dayOfCycle,
    cycleLength: template.length
  }
}
