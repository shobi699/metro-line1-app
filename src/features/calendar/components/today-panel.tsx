'use client'

import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SHIFT_META, type CalendarDay } from '../types'

interface TodayPanelProps {
  today: CalendarDay | null
  /** روزهای آینده ماه جاری برای شمارش معکوس تا آف بعدی */
  upcomingDays: CalendarDay[]
  loading: boolean
  onToggleTask: (id: string, isDone: boolean) => void
}

function daysUntilNextOff(upcomingDays: CalendarDay[]): number | null {
  const idx = upcomingDays.findIndex(
    (d) => d.shift?.code === 'off' || d.holidays.some((h) => h.isOffDay),
  )
  return idx === -1 ? null : idx + 1
}

export function TodayPanel({ today, upcomingDays, loading, onToggleTask }: TodayPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-surface-container-low" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!today) return null

  const meta = today.shift ? SHIFT_META[today.shift.code] : null
  const nextOff = daysUntilNextOff(upcomingDays)
  const tasks = today.events.filter((e) => e.type === 'task')
  const events = today.events.filter((e) => e.type !== 'task')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">امروز</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {meta && today.shift ? (
          <div className={cn('rounded-lg border p-3', meta.chipClass)}>
            <div className="flex items-center gap-2 text-base font-semibold">
              <span aria-hidden className="text-xl">
                {meta.icon}
              </span>
              <span>شیفت {meta.label}</span>
            </div>
            {today.shift.startTime && (
              <div className="mt-1 font-data-mono text-sm" dir="ltr">
                {toFa(today.shift.startTime)}–{toFa(today.shift.endTime)}
              </div>
            )}
            {today.shift.forecast && (
              <div className="mt-1 text-xs opacity-80">
                بر اساس سیکل — لوحه هنوز منتشر نشده
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle p-3 text-sm text-foreground-muted">
            شیفتی برای امروز ثبت نشده است
          </div>
        )}

        {today.holidays.length > 0 && (
          <div className="text-sm text-critical">
            {today.holidays.map((h) => h.title).join('، ')}
          </div>
        )}

        {events.length > 0 && (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm">
                <span className="size-2 rounded-full bg-evt-personal" aria-hidden />
                <span className="truncate">{e.title}</span>
              </li>
            ))}
          </ul>
        )}

        {tasks.length > 0 && (
          <ul className="space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={t.isDone}
                    onChange={(e) => onToggleTask(t.id, e.target.checked)}
                    className="size-4 accent-[var(--evt-task)]"
                  />
                  <span className={cn('truncate', t.isDone && 'text-foreground-muted line-through')}>
                    {t.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {events.length === 0 && tasks.length === 0 && (
          <p className="text-sm text-foreground-muted">رویدادی برای امروز ندارید ✨</p>
        )}

        {nextOff !== null && nextOff > 0 && (
          <div className="border-t border-border-subtle pt-3 text-sm text-foreground-muted">
            {toFa(nextOff)} روز تا آف بعدی 🎉
          </div>
        )}
      </CardContent>
    </Card>
  )
}
