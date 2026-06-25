'use client'

import { AlertTriangle } from 'lucide-react'

interface TsrEntry {
  section: string
  speedLimit: string
  reason: string
}

interface TsrPanelProps {
  entries?: TsrEntry[]
}

const defaultEntries: TsrEntry[] = [
  { section: 'T-104 (شمال)', speedLimit: '15 km/h', reason: 'تعمیرات خط' },
  { section: 'T-088 (جنوب)', speedLimit: '20 km/h', reason: 'نقص سیگنال' },
]

export function TsrPanel({ entries = defaultEntries }: TsrPanelProps) {
  return (
    <div className="flex flex-col rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-warning" />
        <span className="font-label-md text-foreground">
          محدودیت‌های سرعت موقت (TSR)
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-inverse-surface text-inverse-on-surface">
              <th className="p-2.5 text-start text-xs font-medium font-label-md">قطعه</th>
              <th className="p-2.5 text-start text-xs font-medium font-label-md">حد سرعت</th>
              <th className="p-2.5 text-start text-xs font-medium font-label-md">دلیل</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={i}
                className={`border-b border-outline-variant last:border-0 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low'}`}
              >
                <td className="p-2.5 font-data-mono text-xs">{entry.section}</td>
                <td className="p-2.5 font-data-mono text-xs font-bold text-accent">
                  {entry.speedLimit}
                </td>
                <td className="p-2.5 text-xs text-foreground-muted">{entry.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
