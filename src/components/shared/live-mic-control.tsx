'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LiveMicControl() {
  const [broadcasting, setBroadcasting] = useState(false)

  return (
    <div className="relative flex flex-col rounded-lg border border-border bg-surface p-4">
      {/* Active ring */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 border-2 transition-colors duration-300',
          broadcasting
            ? 'border-accent bg-accent/5'
            : 'border-transparent',
        )}
      />

      <div className="relative z-10 mb-4 flex items-center justify-between border-b border-border-subtle pb-2">
        <span className="text-sm font-semibold">کنترل پخش زنده</span>
        <Mic className="size-4 text-accent" />
      </div>

      {/* Audio Meter */}
      <div className="relative z-10 mb-4 flex items-end gap-1 rounded border border-border bg-inverse-surface p-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-full rounded-t transition-all',
              i < 4 ? 'bg-success' : i < 6 ? 'bg-warning' : 'bg-critical',
              broadcasting ? 'meter-bar' : 'meter-bar idle',
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      {/* PTT Button */}
      <button
        onMouseDown={() => setBroadcasting(true)}
        onMouseUp={() => setBroadcasting(false)}
        onMouseLeave={() => setBroadcasting(false)}
        className={cn(
          'relative z-10 flex w-full flex-col items-center justify-center rounded-lg py-6 text-sm font-bold uppercase tracking-wider transition-all',
          broadcasting
            ? 'bg-accent-hover shadow-[inset_0_2px_4px_oklch(0_0_0/0.3)]'
            : 'bg-accent shadow-[0_4px_0_oklch(0.41_0.18_27)] active:shadow-[0_0_0_oklch(0.41_0.18_27)] active:translate-y-1',
        )}
      >
        <Mic className="mb-1 size-8" />
        پوش-تو-تاک (PTT)
      </button>
      <p className="relative z-10 mt-2 text-center text-xs text-foreground-muted">
        نگه دارید تا به ایستگاه‌های انتخاب شده پخش شود
      </p>
    </div>
  )
}
