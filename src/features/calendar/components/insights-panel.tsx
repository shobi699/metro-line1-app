'use client'

import { Plane } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { SHIFT_META, JALALI_MONTHS, type CalendarInsights, type HolidayBridge } from '../types'

function bridgeLabel(b: HolidayBridge): string {
  const [, fm, fd] = b.fromJalali.split('-').map(Number)
  const [, tm, td] = b.toJalali.split('-').map(Number)
  const range =
    fm === tm
      ? `${toFa(fd)}–${toFa(td)} ${JALALI_MONTHS[fm - 1]}`
      : `${toFa(fd)} ${JALALI_MONTHS[fm - 1]} تا ${toFa(td)} ${JALALI_MONTHS[tm - 1]}`
  return `${range} · ${toFa(b.length)} روز`
}

interface InsightsPanelProps {
  insights: CalendarInsights | null
  loading: boolean
  onSelectBridge: (fromDate: string) => void
}

export function InsightsPanel({ insights, loading, onSelectBridge }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="flex gap-2" aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface-container-low" />
        ))}
      </div>
    )
  }

  if (!insights) return null

  const codes = ['morning', 'evening', 'night', 'office', 'off'] as const
  const delta = (code: string) =>
    (insights.stats.counts[code] ?? 0) - (insights.prevStats.counts[code] ?? 0)

  return (
    <div className="space-y-3">
      {/* آمار ماه — رنگ همیشه با برچسب همراه است */}
      <div className="flex flex-wrap items-center gap-2">
        {codes.map((code) => {
          const meta = SHIFT_META[code]
          const count = insights.stats.counts[code] ?? 0
          if (count === 0) return null
          const d = delta(code)
          return (
            <span
              key={code}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
                meta.chipClass,
              )}
              title={
                d !== 0
                  ? `${d > 0 ? toFa(d) + ' بیشتر' : toFa(-d) + ' کمتر'} از ماه قبل`
                  : 'برابر با ماه قبل'
              }
            >
              <span aria-hidden>{meta.icon}</span>
              <span>
                {meta.label} {toFa(count)}
              </span>
              {d !== 0 && (
                <span className="text-[10px] opacity-70">{d > 0 ? `+${toFa(d)}` : `−${toFa(-d)}`}</span>
              )}
            </span>
          )
        })}
        {insights.stats.workHours > 0 || insights.stats.movazafiHours > 0 ? (
          <span className="text-xs text-foreground-muted bg-surface-container border rounded-full px-2 py-0.5">
            کارکرد: {toFa(insights.stats.workHours)} / موظفی: {toFa(insights.stats.movazafiHours)}
          </span>
        ) : null}
        
        {insights.stats.overtimeTotalHours > 0 && (
          <span className="text-xs text-info bg-info/10 border border-info/20 rounded-full px-2 py-0.5">
            اضافه‌کار: {toFa(insights.stats.overtimeTotalHours)}h
          </span>
        )}

        {insights.stats.workLogTotalAmount > 0 && (
          <span className="text-xs text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5" dir="ltr">
            {toFa(insights.stats.workLogTotalAmount.toLocaleString())} تومان
          </span>
        )}
      </div>

      {/* بنر پل تعطیلات */}
      {insights.bridges.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="list" aria-label="فرصت‌های استراحت">
          {insights.bridges.map((b) => (
            <button
              key={b.from}
              type="button"
              role="listitem"
              onClick={() => onSelectBridge(b.from)}
              title={b.parts.join(' + ')}
              className={cn(
                'flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-shift-off/40',
                'bg-shift-off-bg px-3 text-xs text-shift-off transition-colors',
                'hover:border-shift-off focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              )}
            >
              <Plane className="size-3.5" aria-hidden />
              <span>{bridgeLabel(b)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
