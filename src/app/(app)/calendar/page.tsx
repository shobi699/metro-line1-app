'use client'

import { useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarCheck } from 'lucide-react'
import { dayjs } from '@/lib/dayjs'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth'
import {
  useCalendarStore,
  MonthGrid,
  TodayPanel,
  DayDrawer,
  JALALI_MONTHS,
  type PersonalEventInput,
} from '@/features/calendar'

export default function CalendarPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const {
    jYear,
    jMonth,
    days,
    loading,
    error,
    selectedDate,
    nextMonth,
    prevMonth,
    goToToday,
    selectDay,
    loadMonth,
    addEvent,
    removeEvent,
    toggleTask,
  } = useCalendarStore()

  useEffect(() => {
    if (accessToken) loadMonth(accessToken)
  }, [accessToken, jYear, jMonth, loadMonth])

  const todayStr = dayjs().format('YYYY-MM-DD')
  const today = useMemo(() => days.find((d) => d.date === todayStr) ?? null, [days, todayStr])
  const upcomingDays = useMemo(
    () => days.filter((d) => d.date > todayStr),
    [days, todayStr],
  )
  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  )

  async function handleAddEvent(input: PersonalEventInput) {
    if (!accessToken) return
    await addEvent(accessToken, input)
  }

  async function handleDeleteEvent(id: string) {
    if (!accessToken) return
    await removeEvent(accessToken, id)
  }

  function handleToggleTask(id: string, isDone: boolean) {
    if (!accessToken) return
    toggleTask(accessToken, id, isDone)
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-md text-foreground">
            {JALALI_MONTHS[jMonth - 1]} {toFa(jYear)}
          </h1>
          <p className="text-xs text-foreground-muted">تقویم زندگی شیفت‌محور</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarCheck className="size-4" />
            امروز
          </Button>
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="ماه قبل">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="ماه بعد">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
        >
          <span>تقویم به‌روز نشد — {error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => accessToken && loadMonth(accessToken)}
          >
            تلاش دوباره
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <MonthGrid
          days={days}
          loading={loading}
          todayStr={todayStr}
          selectedDate={selectedDate}
          onSelectDay={selectDay}
        />
        <div className="order-first lg:order-none">
          <TodayPanel
            today={today}
            upcomingDays={upcomingDays}
            loading={loading}
            onToggleTask={handleToggleTask}
          />
        </div>
      </div>

      <DayDrawer
        day={selectedDay}
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) selectDay(null)
        }}
        onAddEvent={handleAddEvent}
        onDeleteEvent={handleDeleteEvent}
        onToggleTask={handleToggleTask}
      />
    </div>
  )
}
