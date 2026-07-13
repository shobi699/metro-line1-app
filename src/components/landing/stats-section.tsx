'use client'

import { toFa } from '@/lib/fa'

export interface LandingStat {
  value: string
  label: string
}

interface StatsSectionProps {
  stats: LandingStat[]
}

export function StatsSection({ stats }: StatsSectionProps) {
  if (stats.length === 0) return null

  return (
    <section className="relative z-10 border-y border-white/10 bg-white/[0.02]" dir="rtl" aria-label="آمار سامانه">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={`${s.label}-${i}`} className="text-center">
            <div className="text-3xl font-bold text-accent md:text-4xl">{toFa(s.value)}</div>
            <div className="mt-1.5 text-sm text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
