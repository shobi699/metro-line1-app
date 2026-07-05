export interface CalendarShiftEntry {
  code: string
  label: string
  startTime: string
  endTime: string
  source: 'cycle' | 'roster' | 'manual'
  forecast: boolean
}

export interface CalendarHolidayEntry {
  id: string
  title: string
  kind: string
  isOffDay: boolean
  color: string | null
}

export interface CalendarEventEntry {
  id: string
  type: 'event' | 'birthday' | 'task' | 'note'
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  color: string | null
  location: string | null
  isDone: boolean
  reminders: unknown
  recurrence: unknown
  occurrence: boolean
}

export interface CalendarOrgEventEntry {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  color: string | null
  mandatory: boolean
}

export interface CalendarDay {
  date: string
  jalali: string
  weekday: number
  shift: CalendarShiftEntry | null
  holidays: CalendarHolidayEntry[]
  events: CalendarEventEntry[]
  orgEvents: CalendarOrgEventEntry[]
}

export interface CalendarRangeResponse {
  from: string
  to: string
  days: CalendarDay[]
}

export interface PersonalEventInput {
  type?: 'event' | 'birthday' | 'task' | 'note'
  title: string
  description?: string
  startAt: string
  endAt?: string
  allDay?: boolean
  color?: string
  location?: string
  recurrence?: { freq: 'yearly' | 'monthly' | 'weekly' | 'daily'; interval?: number; jalali?: boolean }
  reminders?: { minutesBefore: number }[]
  isPrivate?: boolean
}

/** متادیتای نمایشی هر کد شیفت — رنگ از توکن‌های globals.css می‌آید نه این‌جا */
export interface ShiftMeta {
  label: string
  icon: string
  /** کلاس‌های Tailwind مبتنی بر توکن‌های shift-* */
  chipClass: string
  dotClass: string
}

export const SHIFT_META: Record<string, ShiftMeta> = {
  morning: {
    label: 'صبح',
    icon: '☀️',
    chipClass: 'bg-shift-morning-bg text-shift-morning border-shift-morning/30',
    dotClass: 'bg-shift-morning',
  },
  evening: {
    label: 'عصر',
    icon: '🌆',
    chipClass: 'bg-shift-evening-bg text-shift-evening border-shift-evening/30',
    dotClass: 'bg-shift-evening',
  },
  night: {
    label: 'شب',
    icon: '🌙',
    chipClass: 'bg-shift-night-bg text-shift-night border-shift-night/30',
    dotClass: 'bg-shift-night',
  },
  off: {
    label: 'آف',
    icon: '🏖',
    chipClass: 'bg-shift-off-bg text-shift-off border-shift-off/30',
    dotClass: 'bg-shift-off',
  },
  office: {
    label: 'اداری',
    icon: '🏢',
    chipClass: 'bg-shift-office-bg text-shift-office border-shift-office/30',
    dotClass: 'bg-shift-office',
  },
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

export const WEEKDAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
