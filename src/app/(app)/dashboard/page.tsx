'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toFa } from '@/lib/fa'
import {
  Users,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react'

interface DashboardStats {
  users: number
  shifts: number
  pendingSwaps: number
  openTickets: number
}

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    shifts: 0,
    pendingSwaps: 0,
    openTickets: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [usersRes, swapsRes, ticketsRes] = await Promise.all([
          fetch('/api/users?pageSize=1', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch('/api/swap-requests/inbox', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch('/api/tickets', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ])

        const [usersData, swapsData, ticketsData] = await Promise.all([
          usersRes.ok ? usersRes.json() : { data: { total: 0 } },
          swapsRes.ok ? swapsRes.json() : { data: [] },
          ticketsRes.ok ? ticketsRes.json() : { data: { stats: { open: 0 } } },
        ])

        if (!cancelled) {
          setStats({
            users: usersData.data?.total ?? 0,
            shifts: 0,
            pendingSwaps: Array.isArray(swapsData.data) ? swapsData.data.length : 0,
            openTickets: ticketsData.data?.stats?.open ?? 0,
          })
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [accessToken])

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  const cards = [
    {
      title: 'دفتر تلفن',
      value: stats.users,
      icon: Users,
      href: '/directory',
      color: 'text-info',
    },
    {
      title: 'تعویض شیفت',
      value: stats.pendingSwaps,
      icon: ArrowLeftRight,
      href: '/swap/inbox',
      color: 'text-warning',
    },
    {
      title: 'تیکت‌های باز',
      value: stats.openTickets,
      icon: AlertTriangle,
      href: '/tickets',
      color: 'text-destructive',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          خوش آمدید، {user?.name}
        </h1>
        <p className="text-sm text-foreground-muted">
          سیستم مدیریت خط ۱ مترو تهران
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border border-border bg-background-subtle"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card className="transition-colors hover:bg-surface-hover">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg bg-background-subtle p-3 ${card.color}`}>
                    <card.icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold">
                      {toFa(card.value)}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {card.title}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">دسترسی‌های مدیریت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/shifts"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <Calendar className="size-4" />
                مدیریت شیفت
              </Link>
              <Link
                href="/admin/bulletins"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <AlertTriangle className="size-4" />
                بخشنامه‌ها
              </Link>
              <Link
                href="/roster/upload"
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <FileSpreadsheet className="size-4" />
                آپلود لیست شیفت
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
