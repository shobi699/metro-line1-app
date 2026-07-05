'use client'

import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { SHIFT_META, WEEKDAY_LABELS, type CalendarDay } from '../types'

interface DayCellProps {
  day: CalendarDay
  isToday: boolean
  isSelected: boolean
  onSelect: (date: string) => void
}

function DayCell({ day, isToday, isSelected, onSelect }: DayCellProps) {
  const jDayNum = Number(day.jalali.slice(8))
  const isFriday = day.weekday === 6
  const isOffHoliday = day.holidays.some((h) => h.isOffDay)
  const meta = day.shift ? SHIFT_META[day.shift.code] : null
  const dotEvents = day.events.filter((e) => e.type !== 'task')
  const tasks = day.events.filter((e) => e.type === 'task')
  const extraCount = Math.max(0, dotEvents.length - 2)
  const holidayTitle = day.holidays.map((h) => h.title).join('، ')

  const ariaParts = [
    toFa(jDayNum),
    day.shift ? `شیفت ${meta?.label ?? day.shift.code}` : '',
    holidayTitle,
    day.events.length > 0 ? `${toFa(day.events.length)} رویداد` : '',
  ].filter(Boolean)

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      aria-label={ariaParts.join('، ')}
      aria-pressed={isSelected}
      className={cn(
        'flex min-h-[4.5rem] flex-col rounded-lg border p-1 text-start transition-colors',
        'hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isToday ? 'border-accent ring-1 ring-accent/40' : 'border-border-subtle',
        isSelected && !isToday && 'border-outline bg-surface-hover',
      )}
    >
      <div className="mb-1 flex items-start justify-between">
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold',
            isToday
              ? 'bg-accent text-accent-foreground'
              : isFriday || isOffHoliday
                ? 'text-critical'
                : 'text-foreground',
          )}
        >
          {toFa(jDayNum)}
        </span>
        {day.orgEvents.length > 0 && (
          <span className="text-[10px] text-evt-org" title="رویداد سازمانی">
            ◆
          </span>
        )}
      </div>

      {meta && day.shift && (
        <div
          className={cn(
            'flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] font-medium',
            meta.chipClass,
            day.shift.forecast && 'border-dashed opacity-60',
          )}
          title={day.shift.forecast ? 'پیش‌بینی سیکل — لوحه هنوز منتشر نشده' : undefined}
        >
          <span aria-hidden>{meta.icon}</span>
          <span className="truncate">{meta.label}</span>
        </div>
      )}

      {holidayTitle && (
        <div className="mt-0.5 truncate text-[9px] text-critical" title={holidayTitle}>
          {holidayTitle}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 pt-0.5">
        {dotEvents.slice(0, 2).map((e) => (
          <span
            key={e.id}
            className="size-1.5 rounded-full bg-evt-personal"
            title={e.title}
          />
        ))}
        {extraCount > 0 && (
          <span className="text-[9px] text-foreground-muted">+{toFa(extraCount)}</span>
        )}
        {tasks.length > 0 && (
          <span
            className={cn(
              'text-[10px]',
              tasks.every((t) => t.isDone) ? 'text-success' : 'text-evt-task',
            )}
            title={tasks.map((t) => t.title).join('، ')}
          >
            {tasks.every((t) => t.isDone) ? '☑' : '☐'}
          </span>
        )}
      </div>
    </button>
  )
}

interface MonthGridProps {
  days: CalendarDay[]
  loading: boolean
  todayStr: string
  selectedDate: string | null
  onSelectDay: (date: string) => void
}

export function MonthGrid({ days, loading, todayStr, selectedDate, onSelectDay }: MonthGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1" aria-busy>
        {WEEKDAY_LABELS.map((wd) => (
          <div key={wd} className="p-1 text-center text-xs font-medium text-foreground-muted">
            {wd}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse rounded-lg border border-border-subtle bg-surface-container-low"
          />
        ))}
      </div>
    )
  }

  const startOffset = days.length > 0 ? days[0].weekday : 0

  return (
    <div className="grid grid-cols-7 gap-1" role="grid" aria-label="تقویم ماهانه">
      {WEEKDAY_LABELS.map((wd, i) => (
        <div
          key={wd}
          className={cn(
            'p-1 text-center text-xs font-medium',
            i === 6 ? 'text-critical' : 'text-foreground-muted',
          )}
        >
          {wd}
        </div>
      ))}

      {Array.from({ length: startOffset }).map((_, i) => (
        <div key={`empty-${i}`} aria-hidden />
      ))}

      {days.map((day) => (
        <DayCell
          key={day.date}
          day={day}
          isToday={day.date === todayStr}
          isSelected={day.date === selectedDate}
          onSelect={onSelectDay}
        />
      ))}
    </div>
  )
}
