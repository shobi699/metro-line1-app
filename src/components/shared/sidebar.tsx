'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دفتر تلفن', href: '/directory', icon: Users },
  { label: 'شیفت من', href: '/shifts', icon: Calendar },
  { label: 'تعویض شیفت', href: '/swap/inbox', icon: ArrowLeftRight },
  { label: 'تیکت‌ها', href: '/tickets', icon: AlertTriangle },
  {
    label: 'مدیریت شیفت',
    href: '/admin/shifts',
    icon: Calendar,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'بخشنامه‌ها',
    href: '/admin/bulletins',
    icon: ShieldCheck,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'آپلود لیست شیفت',
    href: '/roster/upload',
    icon: FileSpreadsheet,
    roles: ['admin', 'super_admin'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.roleKey ?? ''),
  )

  return (
    <aside className="hidden w-56 shrink-0 border-s border-border bg-background-subtle lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="text-sm font-semibold tracking-tight">
          مترو خط ۱
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="منوی اصلی">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground',
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="max-w-[140px] truncate text-xs text-foreground-muted">
            {user?.name}
          </span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => {
            logout()
            window.location.href = '/login'
          }}
        >
          <LogOut className="size-4" />
          خروج
        </Button>
      </div>
    </aside>
  )
}

export function MobileHeader() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
      <span className="text-sm font-semibold tracking-tight"> метро خط ۱ </span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="max-w-[80px] truncate text-xs text-foreground-muted">
          {user?.name}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="خروج"
          onClick={() => {
            logout()
            window.location.href = '/login'
          }}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  )
}
