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
    <section
      className="relative z-10 border-y border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
      dir="rtl"
      aria-label="آمار سامانه"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 divide-white/10 px-6 py-12 md:grid-cols-4 md:divide-x md:divide-x-reverse">
        {stats.map((s, i) => (
          <div key={`${s.label}-${i}`} className="px-2 py-4 text-center">
            <div className="bg-gradient-to-b from-accent to-accent-hover bg-clip-text text-4xl font-black text-transparent md:text-5xl">
              {toFa(s.value)}
            </div>
            <div className="mt-2 text-sm font-medium text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
