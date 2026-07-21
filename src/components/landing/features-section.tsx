'use client'

import {
  Calendar,
  Users,
  ShieldCheck,
  Wrench,
  MessageCircle,
  GraduationCap,
  Radio,
  MapPin,
  Bell,
  ClipboardCheck,
  BarChart3,
  Bot,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface LandingFeature {
  icon?: string | null
  title: string
  description: string
}

interface FeaturesSectionProps {
  title: string
  features: LandingFeature[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar,
  Users,
  ShieldCheck,
  Wrench,
  MessageCircle,
  GraduationCap,
  Radio,
  MapPin,
  Bell,
  ClipboardCheck,
  BarChart3,
  Bot,
}

export function FeaturesSection({ title, features }: FeaturesSectionProps) {
  if (features.length === 0) return null

  return (
    <section
      className="relative z-10 mx-auto max-w-6xl px-6 py-20"
      dir="rtl"
      aria-labelledby="landing-features-title"
    >
      {/* Section header */}
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
          <Sparkles className="size-3.5" aria-hidden />
          قابلیت‌ها
        </span>
        <h2
          id="landing-features-title"
          className="mt-4 text-2xl font-bold text-white md:text-3xl"
        >
          {title}
        </h2>
        <div className="mt-4 h-px w-24 bg-gradient-to-l from-transparent via-accent/60 to-transparent" />
      </div>

      {/* Cards */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = (f.icon && ICON_MAP[f.icon]) || ClipboardCheck
          return (
            <div
              key={`${f.title}-${i}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_12px_40px_-12px_rgba(229,57,53,0.35)]"
            >
              {/* hover glow */}
              <div className="pointer-events-none absolute -end-8 -top-8 size-24 rounded-full bg-accent/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex size-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="relative mt-5 text-base font-bold text-white">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/55">{f.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
