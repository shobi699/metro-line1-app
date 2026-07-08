'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  ArrowLeftRight,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Newspaper,
  LogOut,
  Settings,
  Bell,
  MessageSquare,
  ClipboardCheck,
  BookOpen,
  User,
  Trophy,
  Shield,
  Activity,
  BarChart3,
  Radio,
  Bot,
  ChevronDown,
  ChevronLeft,
  GraduationCap,
  HardDrive,
  UserCheck,
  Video,
  Award,
  Mic,
  Clock,
  TrendingUp,
  Vote,
  Menu,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

interface NavSubgroup {
  id: string
  label: string
  icon: React.ElementType
  items: NavItem[]
  roles?: string[]
}

interface NavSection {
  title: string
  roles?: string[]
  groups: NavSubgroup[]
}

// دسته‌بندی کامل و کاملاً طبقه‌بندی شده منوهای سوپراپ خط ۱ مترو تهران
const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'میز کار پرسنلی',
    groups: [
      {
        id: 'desk',
        label: 'امور کاربری',
        icon: LayoutDashboard,
        items: [
          { label: 'داشبورد اصلی', href: '/dashboard', icon: LayoutDashboard },
          { label: 'اعلانات سیستم', href: '/notifications', icon: Bell },
          { label: 'پروفایل کاربری', href: '/profile', icon: User },
          { label: 'رزرو وقت جلسه', href: '/meetings', icon: Calendar },
          { label: 'نظرسنجی‌ها', href: '/polls', icon: Vote },
          { label: 'ثبت ایده و پیشنهاد', href: '/ideas', icon: MessageSquare },
          { label: 'پایش خستگی و سلامت کاری', href: '/fatigue', icon: Activity },
          { label: 'جدول برترها (رتبه)', href: '/leaderboard', icon: Trophy },
          { label: 'کارنامه و ارزیابی عملکرد', href: '/performance', icon: Award },
          { label: 'ثبت بازخورد و پیام', href: '/feedback', icon: MessageSquare },
          { label: 'فرم‌ها و درخواست‌ها', href: '/forms', icon: FileText },
          { label: 'کارتابل تاییدات من', href: '/forms/inbox', icon: ShieldCheck },
        ]
      },
      {
        id: 'shifts-op',
        label: 'عملیات و شیفت‌ها',
        icon: Calendar,
        items: [
          { label: 'شیفت و تقویم من', href: '/shifts', icon: Calendar },
          { label: 'تقویم زندگی', href: '/calendar', icon: CalendarDays },
          { label: 'برنامه روزانه من', href: '/roster/my-day', icon: Clock },
          { label: 'لوحه اعزام روزانه خط ۱', href: '/roster', icon: Clock },
          { label: 'بورد لوحه', href: '/roster/board', icon: CalendarDays },
          { label: 'جابه‌جایی شیفت (Swap)', href: '/swap', icon: ArrowLeftRight },
          { label: 'درخواست تعویض شیفت', href: '/swap/inbox', icon: ArrowLeftRight },
          { label: 'حضور و غیاب هوشمند', href: '/attendance', icon: UserCheck },
          { label: 'چک‌لیست حرکت قطار', href: '/checklists', icon: ClipboardCheck },
          { label: 'ثبت خرابی و تیکتینگ', href: '/tickets', icon: AlertTriangle },
          { label: 'گزارش خرابی‌ها', href: '/reports/faults', icon: AlertTriangle },
          { label: 'تجهیزات انفرادی من', href: '/equipment', icon: HardDrive },
          { label: 'مرخصی و مأموریت‌ها', href: '/leaves', icon: Calendar },
        ]
      },
      {
        id: 'comms',
        label: 'ارتباطات و همیار',
        icon: MessageCircle,
        items: [
          { label: 'اتاق‌های گفت‌وگو', href: '/chat', icon: MessageCircle },
          { label: 'کنفرانس صوتی گروهی', href: '/comms/conference', icon: Mic },
          { label: 'شبیه‌ساز بی‌سیم تِترا', href: '/comms/radio', icon: Radio },
          { label: 'دفتر تلفن پرسنل', href: '/directory', icon: Users },
          { label: 'دستیار هوشمند AI', href: '/ai', icon: Bot },
        ]
      }
    ]
  },
  {
    title: 'مرکز کنترل و فرماندهی خط ۱',
    roles: ['admin', 'super_admin', 'operator'],
    groups: [
      {
        id: 'occ-menu',
        label: 'فرماندهی OCC',
        icon: Activity,
        roles: ['admin', 'super_admin', 'operator'],
        items: [
          { label: 'دیسپاچینگ و مانیتورینگ', href: '/occ', icon: Activity, roles: ['admin', 'super_admin', 'operator'] },
          { label: 'سامانه اعلام عمومی PA', href: '/pa', icon: Radio, roles: ['admin', 'super_admin'] },
          { label: 'مدیریت بحران و اضطرار', href: '/crisis', icon: Shield, roles: ['admin', 'super_admin'] },
        ]
      }
    ]
  },
  {
    title: 'سامانه آموزش پرسنل',
    groups: [
      {
        id: 'learning-menu',
        label: 'آموزش و آزمون‌ها',
        icon: GraduationCap,
        items: [
          { label: 'آموزش بدو خدمت (Onboarding)', href: '/onboarding', icon: GraduationCap },
          { label: 'داشبورد اصلی آموزش (LMS)', href: '/learning', icon: GraduationCap },
          { label: 'دوره‌ها و مقالات آموزشی', href: '/content', icon: Newspaper },
          { label: 'گالری ویدیوهای آموزشی', href: '/learning/gallery', icon: Video },
          { label: 'کارنامه و آزمون‌های من', href: '/learning/exams', icon: Award },
          { label: 'دستورالعمل‌ها و دانش‌نامه', href: '/knowledge', icon: BookOpen },
          { label: 'راهنمای جامع سوپراپ', href: '/docs', icon: FileText },
        ]
      }
    ]
  },
  {
    title: 'پنل مدیریت سامانه',
    roles: ['admin', 'super_admin'],
    groups: [
      {
        id: 'admin-users',
        label: 'کاربران و دسترسی',
        icon: Users,
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'پیشخوان رویدادهای زنده', href: '/admin/live-actions', icon: Activity },
          { label: 'مدیریت پرسنل و نقش‌ها', href: '/admin/users', icon: Users },
          { label: 'صف تایید مدارک', href: '/admin/documents-queue', icon: UserCheck },
          { label: 'تنظیمات بایومتریک', href: '/admin/biometrics', icon: ShieldCheck },
        ]
      },
      {
        id: 'admin',
        label: 'مدیریت کل',
        icon: Calendar,
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'مدیریت درخواست‌ها', href: '/admin/requests', icon: FileSpreadsheet },
          { label: 'مدیریت مرخصی‌ها', href: '/admin/leaves', icon: Calendar },
          { label: 'تنظیمات مرخصی', href: '/admin/settings/leaves', icon: Settings },
          { label: 'مدیریت شیفت‌ها', href: '/admin/shifts', icon: Calendar },
          { label: 'مدیریت تقویم', href: '/admin/calendar', icon: CalendarDays },
          { label: 'بارگذاری اکسل لوحه', href: '/roster/upload', icon: FileSpreadsheet },
          { label: 'نمای گانت لوحه', href: '/roster?view=gantt', icon: TrendingUp },
          { label: 'آمار و تحلیل اعزام‌ها', href: '/roster/analytics', icon: BarChart3 },
          { label: 'قوانین اعتبارسنجی لوحه', href: '/admin/roster/validation-rules', icon: Settings },
          { label: 'قوانین اصلاح لوحه', href: '/admin/roster/amendment-rules', icon: Settings },
          { label: 'ماتریس دیداری لوحه', href: '/admin/roster/visibility-matrix', icon: Settings },
          { label: 'مدیریت تابلوهای اعلانات', href: '/admin/signage', icon: Radio },
          { label: 'مدیریت چک‌لیست‌ها', href: '/admin/checklists', icon: ClipboardCheck },
        ]
      },
      {
        id: 'admin-training',
        label: 'آموزش و ابلاغیه‌ها',
        icon: GraduationCap,
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'مدیریت جامع آموزش', href: '/admin/learning', icon: GraduationCap },
          { label: 'مدیریت ایمنی (Safety)', href: '/admin/safety', icon: ShieldCheck },
          { label: 'مدیریت دانشنامه', href: '/admin/knowledge', icon: BookOpen },
          { label: 'بخشنامه‌های ایمنی', href: '/admin/bulletins', icon: ShieldCheck },
          { label: 'بانک سوالات و آزمون‌ها', href: '/admin/exams-editor', icon: Settings },
        ]
      },
      {
        id: 'admin-ai',
        label: 'هوش مصنوعی و RAG',
        icon: Bot,
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'مدیریت پروایدرها', href: '/admin/ai-providers', icon: Bot },
          { label: 'مدیریت کش معنایی', href: '/admin/ai-cache', icon: HardDrive },
        ]
      },
      {
        id: 'admin-reports',
        label: 'مانیتورینگ و گزارش‌ها',
        icon: BarChart3,
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'فرم‌ساز سازمانی', href: '/admin/form-builder', icon: Settings },
          { label: 'مدیریت نظرسنجی‌ها', href: '/admin/surveys', icon: Vote },
          { label: 'ویرایشگر UI', href: '/admin/ui-builder', icon: LayoutDashboard },
          { label: 'گزارشات جلسات', href: '/admin/meetings/reports', icon: BarChart3 },
          { label: 'مدیریت تیکت‌های خرابی', href: '/admin/tickets', icon: AlertTriangle },
          { label: 'داشبورد تحلیلی', href: '/admin/analytics', icon: BarChart3 },
          { label: 'پیکربندی کاتالوگ عملکرد', href: '/admin/performance-config', icon: Award },
          { label: 'درخواست تجدیدنظر عملکرد', href: '/admin/performance-appeals', icon: FileText },
          { label: 'ثبت و بررسی عملکرد', href: '/admin/performance', icon: FileSpreadsheet },
          { label: 'سیگنالینگ و شبکه برق', href: '/admin/infrastructure', icon: HardDrive },
          { label: 'ثبت خودروها و پلاک‌خوان', href: '/admin/license-plates', icon: Settings },
          { label: 'صلاحیت و گواهی راهبران', href: '/admin/operator-licenses', icon: ShieldCheck },
          { label: 'دفتر ثبت وقایع (Audit Log)', href: '/admin/audit-logs', icon: Shield },
          { label: 'تنظیمات سیستم', href: '/admin/settings', icon: Settings },
        ]
      }
    ]
  }
]

const roleLabels: Record<string, string> = {
  super_admin: 'مدیر ارشد',
  admin: 'مدیر',
  operator: 'اپراتور',
  user: 'راهبر / پرسنل',
}

export function SidebarContent() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [webVersion, setWebVersion] = useState<string>('v0.1.1')

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.webVersion) setWebVersion(json.data.webVersion)
      })
      .catch(() => {})
  }, [])

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NAVIGATION_SECTIONS.forEach((section) => {
      section.groups.forEach((group) => {
        const hasActiveChild = group.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
        )
        if (hasActiveChild) {
          initial[group.id] = true
        }
      })
    })
    return initial
  })

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // فیلتر نقش‌ها
  const checkRole = (roles?: string[]) => {
    if (!roles) return true
    return roles.includes(user?.roleKey ?? '')
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* User Profile Section */}
      <div className="flex flex-col items-center gap-3 border-b border-border-subtle px-5 py-5">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-accent bg-surface-container-high overflow-hidden">
          {user?.customFields?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.customFields.avatar} alt={user.name} className="size-full object-cover" />
          ) : (
            <User className="size-7 text-foreground-muted" />
          )}
        </div>
        <div className="text-center">
          <div className="truncate text-sm font-semibold text-foreground">
            {user?.name ?? 'کاربر'}
          </div>
          <div className="truncate text-xs text-foreground-muted mt-0.5">
            {roleLabels[user?.roleKey ?? ''] ?? user?.roleKey}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="منوی اصلی">
        {NAVIGATION_SECTIONS.map((section, idx) => {
          // بررسی نقش در سطح بخش
          if (section.roles && !section.roles.includes(user?.roleKey ?? '')) {
            return null
          }

          // فیلتر گروه‌های مجاز بر اساس نقش کاربر
          const visibleGroups = section.groups.filter((group) => checkRole(group.roles))
          if (visibleGroups.length === 0) return null

          return (
            <div key={idx} className="space-y-1.5">
              {/* عنوان دسته‌بندی */}
              <div className="text-[10px] font-bold text-foreground-muted/65 px-3 uppercase tracking-wider">
                {section.title}
              </div>

              {/* گروه‌های تاشو */}
              <div className="space-y-1">
                {visibleGroups.map((group) => {
                  const isExpanded = !!expandedGroups[group.id]
                  const groupHasActiveChild = group.items.some(
                    (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
                  )

                  // فیلتر آیتم‌های مجاز
                  const visibleItems = group.items.filter((item) => checkRole(item.roles))
                  if (visibleItems.length === 0) return null

                  return (
                    <div key={group.id} className="rounded-lg overflow-hidden">
                      {/* دکمه هدر گروه تاشو */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          'flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-all scale-[0.98] active:scale-95',
                          groupHasActiveChild
                            ? 'text-foreground font-semibold bg-surface-container-high/40'
                            : 'text-foreground-muted hover:bg-surface-container-highest hover:text-foreground',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <group.icon className="size-4 shrink-0" />
                          <span>{group.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 text-foreground-muted" />
                        ) : (
                          <ChevronLeft className="size-3.5 text-foreground-muted" />
                        )}
                      </button>

                      {/* لیست زیرمنوهای گروه */}
                      {isExpanded && (
                        <div className="mr-3 mt-0.5 border-r border-border-subtle/50 pr-2.5 space-y-0.5 transition-all">
                          {visibleItems.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all scale-[0.98] active:scale-95',
                                  active
                                    ? 'bg-accent/10 text-accent font-bold'
                                    : 'text-foreground-muted hover:bg-surface-container-highest hover:text-foreground',
                                )}
                              >
                                <item.icon className="size-3.5 shrink-0" />
                                <span>{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle p-3">
        <div className="mb-2 flex items-center justify-between">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
          >
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>
        {/* Web Version Badge */}
        <div className="flex items-center justify-center gap-1.5 rounded-md bg-surface-container-high/50 px-2 py-1.5">
          <span className="text-[10px] text-foreground-muted/60">نسخه پنل وب:</span>
          <span className="font-mono text-[10px] font-semibold text-accent/80 tracking-wide">{webVersion}</span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-s border-border-subtle bg-surface-container-low lg:flex lg:flex-col" dir="rtl">
      <div className="flex h-16 items-center gap-2.5 border-b border-border-subtle px-6 select-none">
        <img src="/logo.png" className="size-8 object-contain rounded-full bg-background p-0.5 border border-border" alt="Logo" />
        <span className="font-headline-md text-headline-md font-bold text-accent">
          مترو خط ۱
        </span>
      </div>
      <SidebarContent />
    </aside>
  )
}

export function MobileHeader() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)

  // بستن سایدبار پس از تغییر مسیر
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface-container px-4 lg:hidden" dir="rtl">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="active:scale-95 transition-all text-foreground-muted hover:text-foreground"
                aria-label="منوی کاربری"
              >
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent side="right" className="w-64 p-0 bg-surface-container-low border-s border-border-subtle flex flex-col h-full">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <img src="/logo.png" className="size-8 object-contain rounded-full bg-background p-0.5 border border-border" alt="Logo" />
        <span className="font-headline-md text-headline-md font-bold text-accent">
          مترو خط ۱
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative rounded-md p-2 text-foreground-muted hover:bg-surface-hover active:scale-95 transition-all duration-150"
        >
          <Bell className="size-5" />
        </Link>
        <ThemeToggle />
        <span className="max-w-[80px] truncate text-xs text-foreground-muted">
          {user?.name}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="خروج"
          className="active:scale-95 transition-all duration-150"
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
