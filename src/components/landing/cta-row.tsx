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
      className="flex flex-wrap items-center justify-center gap-3 px-4 py-6"
      dir="rtl"
    >
      {filtered.map((cta) => {
        const Icon = cta.icon ? ICON_MAP[cta.icon] : null
        return (
          <Link
            key={cta.id}
            href={cta.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all active:scale-95',
              cta.variant === 'primary' &&
                'bg-accent text-accent-foreground hover:bg-accent-hover shadow-md',
              cta.variant === 'secondary' &&
                'border border-border bg-surface-container text-foreground hover:bg-surface-hover',
              cta.variant === 'ghost' &&
                'text-foreground-muted hover:bg-surface-container-high hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-4" />}
            {cta.label}
          </Link>
        )
      })}
    </div>
  )
}
