'use client'

import Link from 'next/link'
import {
  LogIn,
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  GraduationCap,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CtaData {
  id: string
  label: string
  href: string
  icon?: string | null
  variant: string
  authOnly: boolean
}

interface CtaRowProps {
  ctas: CtaData[]
  isAuthenticated: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  LogIn,
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  GraduationCap,
  ArrowLeftRight,
}

export function CtaRow({ ctas, isAuthenticated }: CtaRowProps) {
  const filtered = ctas.filter((c) => !c.authOnly || isAuthenticated)

  if (filtered.length === 0) return null

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 px-4 py-8"
      dir="rtl"
    >
      {filtered.map((cta) => {
        const Icon = cta.icon ? ICON_MAP[cta.icon] : null
        return (
          <Link
            key={cta.id}
            href={cta.href}
            className={cn(
              'group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-200 active:scale-95',
              cta.variant === 'primary' &&
                'bg-accent text-white shadow-[0_8px_30px_-8px_rgba(229,57,53,0.6)] hover:bg-accent-hover hover:shadow-[0_10px_40px_-8px_rgba(229,57,53,0.8)]',
              cta.variant === 'secondary' &&
                'border border-white/15 bg-white/[0.04] text-white backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.08]',
              cta.variant === 'ghost' &&
                'text-white/70 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            {Icon && <Icon className="size-4 transition-transform group-hover:-translate-x-0.5" />}
            {cta.label}
          </Link>
        )
      })}
    </div>
  )
}
