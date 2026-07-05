import { create } from 'zustand'
import { jdate, fromJalali, gregStr, dayjs } from '@/lib/dayjs'
import { calendarApi } from './api-client'
import type { CalendarDay, PersonalEventInput } from './types'

interface CalendarState {
  /** سال و ماه جلالی نمای جاری */
  jYear: number
  jMonth: number // 1..12
  days: CalendarDay[]
  loading: boolean
  error: string | null
  selectedDate: string | null // میلادی YYYY-MM-DD

  goToMonth: (jYear: number, jMonth: number) => void
  nextMonth: () => void
  prevMonth: () => void
  goToToday: () => void
  selectDay: (date: string | null) => void
  loadMonth: (accessToken: string) => Promise<void>
  addEvent: (accessToken: string, input: PersonalEventInput) => Promise<void>
  removeEvent: (accessToken: string, id: string) => Promise<void>
  toggleTask: (accessToken: string, id: string, isDone: boolean) => Promise<void>
}

function monthRange(jYear: number, jMonth: number): { from: string; to: string } {
  const first = fromJalali(jYear, jMonth, 1)
  const last = first.date(first.daysInMonth())
  return { from: gregStr(first), to: gregStr(last) }
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  jYear: jdate().year(),
  jMonth: jdate().month() + 1,
  days: [],
  loading: false,
  error: null,
  selectedDate: null,

  goToMonth: (jYear, jMonth) => set({ jYear, jMonth }),

  nextMonth: () => {
    const { jYear, jMonth } = get()
    if (jMonth === 12) set({ jYear: jYear + 1, jMonth: 1 })
    else set({ jMonth: jMonth + 1 })
  },

  prevMonth: () => {
    const { jYear, jMonth } = get()
    if (jMonth === 1) set({ jYear: jYear - 1, jMonth: 12 })
    else set({ jMonth: jMonth - 1 })
  },

  goToToday: () => {
    const now = jdate()
    set({
      jYear: now.year(),
      jMonth: now.month() + 1,
      selectedDate: dayjs().format('YYYY-MM-DD'),
    })
  },

  selectDay: (date) => set({ selectedDate: date }),

  loadMonth: async (accessToken) => {
    const { jYear, jMonth } = get()
    const { from, to } = monthRange(jYear, jMonth)
    set({ loading: true, error: null })
    try {
      const data = await calendarApi.getRange(accessToken, from, to)
      // در طول fetch ممکن است ماه عوض شده باشد — پاسخ کهنه را کنار بگذار
      const current = get()
      if (current.jYear === jYear && current.jMonth === jMonth) {
        set({ days: data.days, loading: false })
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'تقویم به‌روز نشد',
        loading: false,
      })
    }
  },

  addEvent: async (accessToken, input) => {
    await calendarApi.createEvent(accessToken, input)
    await get().loadMonth(accessToken)
  },

  removeEvent: async (accessToken, id) => {
    await calendarApi.deleteEvent(accessToken, id)
    await get().loadMonth(accessToken)
  },

  toggleTask: async (accessToken, id, isDone) => {
    // به‌روزرسانی خوش‌بینانه؛ در خطا ماه دوباره بارگذاری می‌شود
    set({
      days: get().days.map((d) => ({
        ...d,
        events: d.events.map((e) => (e.id === id ? { ...e, isDone } : e)),
      })),
    })
    try {
      await calendarApi.toggleDone(accessToken, id, isDone)
    } catch {
      await get().loadMonth(accessToken)
    }
  },
}))
