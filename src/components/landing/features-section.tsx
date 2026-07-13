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
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-16" dir="rtl" aria-labelledby="landing-features-title">
      <h2 id="landing-features-title" className="text-center text-2xl font-bold text-white md:text-3xl">
        {title}
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = (f.icon && ICON_MAP[f.icon]) || ClipboardCheck
          return (
            <div
              key={`${f.title}-${i}`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-white/[0.06]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
