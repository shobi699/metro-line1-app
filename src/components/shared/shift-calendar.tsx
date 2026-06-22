'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import jalaliPlugin from 'dayjs-jalali'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import { ChevronLeft, ChevronRight } from 'lucide-react'

dayjs.extend(jalaliPlugin as Parameters<typeof dayjs.extend>[0])

interface Shift {
  id: string
  date: string
  code: string
  note: string | null
  user?: { id: string; name: string; nationalId: string }
}

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-success/10 text-success border-success/20',
  evening: 'bg-info/10 text-info border-info/20',
  night: 'bg-neutral-700 text-foreground-muted border-neutral-600',
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

// Use a typed helper for jalali methods
function jalaliMonth(d: dayjs.Dayjs): number {
  return (d as unknown as { jMonth(): number }).jMonth() + 1
}

function jalaliYear(d: dayjs.Dayjs): number {
  return (d as unknown as { jYear(): number }).jYear()
}

function jalaliDaysInMonth(d: dayjs.Dayjs): number {
  return (d as unknown as { jDaysInMonth(): number }).jDaysInMonth()
}

function jalaliDate(d: dayjs.Dayjs, day: number): dayjs.Dayjs {
  return (d as unknown as { jDate(n: number): dayjs.Dayjs }).jDate(day)
}

export function ShiftCalendar({ userId, isAdmin }: ShiftCalendarProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const now = dayjs()
  const [currentMonth, setCurrentMonth] = useState(() => jalaliMonth(now))
  const [currentYear, setCurrentYear] = useState(() => jalaliYear(now))
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

  const firstDay = dayjs(
    `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
    'jYYYY-jMM-jDD',
  )
  const daysInMonth = jalaliDaysInMonth(firstDay)
  const startWeekday = firstDay.day()

  const days: Array<{ day: number; shifts: Shift[] }> = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = jalaliDate(firstDay, d).format('YYYY-MM-DD')
    const dayShifts = shifts.filter((s) => {
      const sDate = dayjs(s.date).format('YYYY-MM-DD')
      return sDate === dateStr
    })
    days.push({ day: d, shifts: dayShifts })
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {toFa(currentYear)}/{toFa(String(currentMonth).padStart(2, '0'))}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((wd) => (
            <div
              key={wd}
              className="p-1 text-center text-xs font-medium text-foreground-muted"
            >
              {wd}
            </div>
          ))}

          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map(({ day, shifts: dayShifts }) => (
            <div
              key={day}
              className="min-h-[4rem] rounded-lg border border-border-subtle p-1"
            >
              <div className="mb-1 text-center text-xs font-mono text-foreground-muted">
                {toFa(day)}
              </div>
              <div className="space-y-0.5">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`rounded-sm border px-1 py-0.5 text-center text-[10px] font-medium ${SHIFT_COLORS[shift.code] ?? ''}`}
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
