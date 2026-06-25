'use client'

import Link from 'next/link'
import { Bell, HelpCircle, User } from 'lucide-react'
import { SystemHealthPips } from './system-health-pips'

interface TopAppBarProps {
  title: string
  subtitle?: string
  showHealth?: boolean
}

export function TopAppBar({ title, subtitle, showHealth = true }: TopAppBarProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-12 items-center justify-between border-b border-border-subtle bg-surface-container px-4 md:left-64">
      <div className="flex items-center gap-3">
        <span className="font-label-md text-accent">{title}</span>
        {subtitle && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            <span className="text-xs text-foreground-muted">{subtitle}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {showHealth && <SystemHealthPips className="hidden md:flex" />}
        <button className="flex size-8 items-center justify-center rounded-md text-foreground-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95">
          <Bell className="size-4" />
        </button>
        <button className="flex size-8 items-center justify-center rounded-md text-foreground-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95">
          <HelpCircle className="size-4" />
        </button>
        <Link
          href="/profile"
          className="flex size-8 items-center justify-center rounded-md border border-border bg-surface-container-high text-foreground-muted transition-all hover:bg-surface-hover active:scale-95"
        >
          <User className="size-4" />
        </Link>
      </div>
    </header>
  )
}
