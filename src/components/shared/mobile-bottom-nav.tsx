'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  AlertTriangle,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'خانه', icon: LayoutDashboard },
  { href: '/calendar', label: 'تقویم', icon: Calendar },
  { href: '/chat', label: 'گفتگو', icon: MessageCircle, elevated: true },
  { href: '/tickets', label: 'تیکت', icon: AlertTriangle },
  { href: '/profile', label: 'پروفایل', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 flex h-16 items-center border-t border-border-subtle bg-surface-container-low shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const isElevated = item.elevated

        if (isElevated) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center relative"
            >
              <div
                className={cn(
                  'absolute -top-6 flex size-12 items-center justify-center rounded-full border-4 border-background shadow-lg transition-all active:scale-95',
                  isActive
                    ? 'bg-accent text-accent-foreground pulse-live-border'
                    : 'bg-accent text-accent-foreground',
                )}
              >
                <item.icon className="size-5" />
              </div>
              <span
                className={cn(
                  'mt-6 text-[10px] font-label-md transition-colors',
                  isActive ? 'text-accent font-bold' : 'text-foreground-muted',
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-100 relative',
              isActive
                ? 'text-accent font-bold'
                : 'text-foreground-muted hover:bg-surface-container-highest',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-lg px-4 py-1 transition-colors',
                isActive && 'bg-secondary-container text-on-secondary-container',
              )}
            >
              <item.icon className="size-5" />
            </div>
            <span className="text-[10px] font-label-md">{item.label}</span>
            {isActive && (
              <div className="absolute bottom-0 w-8 h-1 bg-accent rounded-t-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
