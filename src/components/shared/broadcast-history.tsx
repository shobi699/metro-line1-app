'use client'

import { cn } from '@/lib/utils'
import { Radio } from 'lucide-react'

interface BroadcastEntry {
  timestamp: string
  type: string
  target: string
  operator: string
  status: 'completed' | 'active' | 'failed'
}

interface BroadcastHistoryProps {
  entries?: BroadcastEntry[]
}

const defaultEntries: BroadcastEntry[] = [
  { timestamp: '۱۴:۰۲:۱۵', type: 'مایک زنده', target: 'تجریش', operator: 'OP-402', status: 'completed' },
  { timestamp: '۱۳:۴۵:۰۰', type: 'از پیش ضبط شده: تأخیر', target: 'خط ۱ (همه)', operator: 'سیستم', status: 'completed' },
  { timestamp: '۱۳:۳۰:۲۲', type: 'از پیش ضبط شده: آتش‌نشانی', target: 'شهید صدر', operator: 'OP-402', status: 'active' },
  { timestamp: '۱۲:۱۵:۰۵', type: 'مایک زنده', target: 'میرداماد', operator: 'OP-311', status: 'completed' },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: 'انجام شده', className: 'text-success' },
  active: { label: 'در حال پخش', className: 'text-critical font-bold live-cell' },
  failed: { label: 'ناموفق', className: 'text-critical' },
}

export function BroadcastHistory({ entries = defaultEntries }: BroadcastHistoryProps) {
  return (
    <div className="flex flex-1 flex-col rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-outline-variant pb-2">
        <Radio className="size-4 text-accent" />
        <span className="font-label-md text-foreground">تاریخچه پخش</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="sticky top-0 bg-inverse-surface text-inverse-on-surface">
              <th className="p-2 text-start text-xs font-medium font-label-md">زمان</th>
              <th className="p-2 text-start text-xs font-medium font-label-md">نوع</th>
              <th className="p-2 text-start text-xs font-medium font-label-md">هدف</th>
              <th className="p-2 text-start text-xs font-medium font-label-md">اپراتور</th>
              <th className="p-2 text-start text-xs font-medium font-label-md">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const status = statusConfig[entry.status]
              return (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-outline-variant transition-colors hover:bg-surface-hover',
                    i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low',
                  )}
                >
                  <td className="p-2 font-data-mono text-xs">{entry.timestamp}</td>
                  <td className="p-2 text-xs">{entry.type}</td>
                  <td className="p-2 text-xs">{entry.target}</td>
                  <td className="p-2 font-data-mono text-xs">{entry.operator}</td>
                  <td className={cn('p-2 text-xs', status.className)}>
                    {status.label}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
