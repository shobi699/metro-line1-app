'use client'

import { useEffect, useState } from 'react'
import { jdate } from '@/lib/dayjs'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Shift {
  id: string
  date: string
  code: string
  note: string | null
  user?: { id: string; name: string; personnelCode: string }
}

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-success/15 text-success border-success/30',
  evening: 'bg-info/15 text-info border-info/30',
  night: 'bg-surface-container-highest text-foreground-muted border-outline-variant',
  off: 'bg-background-subtle text-foreground-muted border-border-subtle',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت',
}

interface ShiftCalendarProps {
  userId?: string
  isAdmin?: boolean
}

export function ShiftCalendar({ userId, isAdmin }: ShiftCalendarProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const now = jdate()
  const [currentMonth, setCurrentMonth] = useState(() => now.month() + 1)
  const [currentYear, setCurrentYear] = useState(() => now.year())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const endpoint = userId ? '/api/shifts/me' : '/api/shifts'
        const params = new URLSearchParams({
          month: String(currentMonth),
          year: String(currentYear),
        })

        const res = await fetch(`${endpoint}?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (res.ok) {
          const data = await res.json()
          setShifts(data.data)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentMonth, currentYear, userId, accessToken])

  const firstDay = jdate()
    .year(currentYear)
    .month(currentMonth - 1)
    .date(1)
  const daysInMonth = firstDay.daysInMonth()
  const startWeekday = firstDay.day()

  const today = jdate()
  const todayStr = today.format('YYYY-MM-DD')

  const days: Array<{ day: number; dateStr: string; shifts: Shift[]; isToday: boolean; isFriday: boolean }> = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = firstDay.date(d)
    const dateStr = date.format('YYYY-MM-DD')
    const dayShifts = shifts.filter((s) => {
      const sDate = jdate(s.date).format('YYYY-MM-DD')
      return sDate === dateStr
    })
    days.push({
      day: d,
      dateStr,
      shifts: dayShifts,
      isToday: dateStr === todayStr,
      isFriday: date.day() === 5,
    })
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

  const shiftCounts = shifts.reduce(
    (acc, s) => {
      acc[s.code] = (acc[s.code] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-foreground">
          {toFa(firstDay.format('MMMM YYYY'))}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* Shift Legend */}
      {!loading && shifts.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(SHIFT_LABELS).map(([code, label]) => (
            <div key={code} className="flex items-center gap-1.5">
              <div className={cn('size-2.5 rounded-sm', SHIFT_COLORS[code]?.split(' ')[0])} />
              <span className="text-foreground-muted">{label}</span>
              {shiftCounts[code] !== undefined && (
                <span className="font-data-mono text-foreground-muted">
                  {toFa(shiftCounts[code])}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border-subtle bg-surface-container-low"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((wd, i) => (
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

          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(({ day, shifts: dayShifts, isToday, isFriday }) => (
            <div
              key={day}
              className={cn(
                'min-h-[4.5rem] rounded-lg border p-1 transition-colors',
                isToday
                  ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                  : 'border-border-subtle',
              )}
            >
              <div
                className={cn(
                  'mb-1 text-center text-xs font-data-mono',
                  isToday
                    ? 'font-bold text-accent'
                    : isFriday
                      ? 'text-critical'
                      : 'text-foreground-muted',
                )}
              >
                {toFa(day)}
              </div>
              <div className="space-y-0.5">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={cn(
                      'rounded border px-1 py-0.5 text-center text-[10px] font-medium',
                      SHIFT_COLORS[shift.code] ?? '',
                    )}
                    title={shift.note ?? undefined}
                  >
                    {isAdmin && shift.user && (
                      <div className="truncate">{shift.user.name}</div>
                    )}
                    <div>{SHIFT_LABELS[shift.code] ?? shift.code}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
