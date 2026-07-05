import { create } from 'zustand'
import { cachedFetch } from '../shared/cached-fetch'
import { syncWidgetAndReminders } from '../shared/widget-sync'
import { gregorianToJalali, jalaliToGregorian, getJalaliMonthLength } from '../shared/jalali'

// ── انواع — آینه‌ی پاسخ GET /api/calendar (سرور) ──────

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

interface CalendarRangeResponse {
  from: string
  to: string
  days: CalendarDay[]
}

export interface NewEventInput {
  type: 'event' | 'task'
  title: string
  startAt: string
  allDay: boolean
  reminders?: { minutesBefore: number }[]
}

function toGregStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CalendarState {
  jYear: number
  jMonth: number
  days: CalendarDay[]
  isLoading: boolean
  error: string | null
  selectedDate: string | null

  nextMonth: () => void
  prevMonth: () => void
  goToToday: () => void
  selectDay: (date: string | null) => void
  loadMonth: () => Promise<void>
  addEvent: (input: NewEventInput) => Promise<boolean>
  deleteEvent: (id: string) => Promise<void>
  toggleTask: (id: string, isDone: boolean) => Promise<void>
}

const now = new Date()
const [initJy, initJm] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())

export const useCalendarStore = create<CalendarState>((set, get) => ({
  jYear: initJy,
  jMonth: initJm,
  days: [],
  isLoading: false,
  error: null,
  selectedDate: null,

  nextMonth: () => {
    const { jYear, jMonth } = get()
    if (jMonth === 12) set({ jYear: jYear + 1, jMonth: 1 })
    else set({ jMonth: jMonth + 1 })
    void get().loadMonth()
  },

  prevMonth: () => {
    const { jYear, jMonth } = get()
    if (jMonth === 1) set({ jYear: jYear - 1, jMonth: 12 })
    else set({ jMonth: jMonth - 1 })
    void get().loadMonth()
  },

  goToToday: () => {
    const today = new Date()
    const [jy, jm] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())
    set({ jYear: jy, jMonth: jm, selectedDate: toGregStr(today) })
    void get().loadMonth()
  },

  selectDay: (date) => set({ selectedDate: date }),

  async loadMonth() {
    const { jYear, jMonth } = get()
    const from = toGregStr(jalaliToGregorian(jYear, jMonth, 1))
    const to = toGregStr(jalaliToGregorian(jYear, jMonth, getJalaliMonthLength(jYear, jMonth)))
    set({ isLoading: true, error: null })

    const data = await cachedFetch<CalendarRangeResponse>(`/calendar?from=${from}&to=${to}`)

    // پاسخ ماهی که هنوز نمایش داده می‌شود را اعمال کن (نه پاسخ کهنه)
    const current = get()
    if (current.jYear !== jYear || current.jMonth !== jMonth) return

    if (data) {
      set({ days: data.days, isLoading: false })
    } else {
      set({
        isLoading: false,
        error: current.days.length > 0 ? null : 'تقویم به‌روز نشد — اتصال را بررسی کنید',
      })
    }
  },

  async addEvent(input) {
    const data = await cachedFetch<{ id: string }>(`/calendar/events`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    if (data) {
      await get().loadMonth()
      void syncWidgetAndReminders()
      return true
    }
    return false
  },

  async deleteEvent(id) {
    await cachedFetch(`/calendar/events/${id}`, { method: 'DELETE' })
    await get().loadMonth()
    void syncWidgetAndReminders()
  },

  async toggleTask(id, isDone) {
    // به‌روزرسانی خوش‌بینانه
    set({
      days: get().days.map((d) => ({
        ...d,
        events: d.events.map((e) => (e.id === id ? { ...e, isDone } : e)),
      })),
    })
    const res = await cachedFetch(`/calendar/events/${id}/done`, {
      method: 'POST',
      body: JSON.stringify({ isDone }),
    })
    if (!res) await get().loadMonth()
  },
}))
