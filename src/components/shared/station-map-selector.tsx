'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Station {
  id: string
  name: string
}

interface StationMapSelectorProps {
  stations?: Station[]
  onSelect?: (selected: string[]) => void
}

const defaultStations: Station[] = [
  { id: 'tajrish', name: 'تجریش' },
  { id: 'qeytariyeh', name: 'قیطریه' },
  { id: 'shahid-sadr', name: 'شهید صدر' },
  { id: 'gholhak', name: 'گل‌حکم' },
  { id: 'shariati', name: 'دکتر شریعتی' },
  { id: 'mirdamad', name: 'میرداماد' },
]

export function StationMapSelector({
  stations = defaultStations,
  onSelect,
}: StationMapSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['tajrish', 'shahid-sadr']),
  )

  const toggleStation = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
    onSelect?.(Array.from(next))
  }

  const selectAll = () => {
    const all = new Set(stations.map((s) => s.id))
    setSelected(all)
    onSelect?.(Array.from(all))
  }

  const clearAll = () => {
    setSelected(new Set())
    onSelect?.([])
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-2">
        <span className="text-sm font-semibold">انتخاب ایستگاه</span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="rounded border border-border px-3 py-1 text-xs transition-colors hover:bg-surface-hover"
          >
            انتخاب همه
          </button>
          <button
            onClick={clearAll}
            className="rounded border border-border px-3 py-1 text-xs transition-colors hover:bg-surface-hover"
          >
            پاک کردن
          </button>
        </div>
      </div>

      {/* Station Map */}
      <div className="relative flex min-h-[120px] items-center justify-center rounded border border-border-subtle bg-background-subtle px-4">
        {/* Track Line */}
        <div className="absolute left-[10%] right-[10%] top-1/2 h-1 -translate-y-1/2 bg-outline-variant" />

        {/* Stations */}
        <div className="relative z-10 flex w-[80%] justify-between">
          {stations.map((station) => {
            const isSelected = selected.has(station.id)
            return (
              <button
                key={station.id}
                onClick={() => toggleStation(station.id)}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className={cn(
                    'size-6 rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-accent bg-accent/20'
                      : 'border-border bg-surface group-hover:border-accent',
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto mt-1 size-2 rounded-full transition-colors',
                      isSelected ? 'bg-accent' : 'bg-transparent',
                    )}
                  />
                </div>
                <span className="text-[10px] text-foreground-muted">
                  {station.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-2 text-start">
        <span className="font-mono text-xs text-foreground-muted">
          ایستگاه‌های انتخاب شده:{' '}
          <span className="font-bold text-accent">{toFa(selected.size)}</span>{' '}
          / {toFa(stations.length)}
        </span>
      </div>
    </div>
  )
}

function toFa(n: number): string {
  return n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}
