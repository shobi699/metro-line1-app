export type ShiftCodeValue = 'morning' | 'evening' | 'night' | 'off' | 'office'

export interface CycleShiftDetail {
  day: number
  code: ShiftCodeValue
  label: string
  hours: number
  startTime: string
  endTime: string
}

export interface ShiftTemplateData {
  id: string
  name: string
  type: 'rotational' | 'staff'
  length: number
  shifts: CycleShiftDetail[]
}

export interface ShiftAssignmentData {
  id: string
  templateId: string
  targetType: 'user' | 'group'
  targetId: string
  anchorDate: string
}

export interface ResolvedShift {
  shift: CycleShiftDetail | null
  group: string
  templateName: string
  dayOfCycle: number
  cycleLength: number
  source: 'cycle' | 'roster' | 'manual'
}

export const SHIFT_LABELS: Record<ShiftCodeValue, string> = {
  morning: 'صبح‌کار',
  evening: 'عصرکار',
  night: 'شب‌کار',
  off: 'استراحت (آف)',
  office: 'اداری',
}

export const SHIFT_HOURS: Record<ShiftCodeValue, number> = {
  morning: 9,
  evening: 9,
  night: 12,
  off: 0,
  office: 8.75,
}

export const SHIFT_TIMES: Record<ShiftCodeValue, { startTime: string; endTime: string }> = {
  morning: { startTime: '07:00', endTime: '16:00' },
  evening: { startTime: '16:00', endTime: '01:00' },
  night: { startTime: '19:00', endTime: '07:00' },
  off: { startTime: '', endTime: '' },
  office: { startTime: '07:30', endTime: '16:15' },
}
