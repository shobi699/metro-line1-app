'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  totalBulletins: number
  readBulletins: number
  totalShifts: number
  totalFeedback: number
  respondedFeedback: number
  totalChecklists: number
}

export default function AnalyticsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  async function loadAnalytics() {
    if (!accessToken) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [usersRes, ticketsRes, bulletinsRes, feedbackRes] = await Promise.all([
        fetch('/api/users?pageSize=1', { headers }),
        fetch('/api/tickets', { headers }),
        fetch('/api/bulletins', { headers }),
        fetch('/api/feedback', { headers }),
      ])

      const [usersData, ticketsData, bulletinsData, feedbackData] = await Promise.all([
        usersRes.ok ? usersRes.json() : { data: { total: 0, active: 0, pending: 0 } },
        ticketsRes.ok ? ticketsRes.json() : { data: { stats: { total: 0, open: 0, resolved: 0 } } },
        bulletinsRes.ok ? bulletinsRes.json() : { data: [] },
        feedbackRes.ok ? feedbackRes.json() : { data: { total: 0, responded: 0 } },
      ])

      setData({
        totalUsers: usersData.data?.total ?? 0,
        activeUsers: usersData.data?.active ?? 0,
        pendingUsers: usersData.data?.pending ?? 0,
        totalTickets: ticketsData.data?.stats?.total ?? 0,
        openTickets: ticketsData.data?.stats?.open ?? 0,
        resolvedTickets: ticketsData.data?.stats?.resolved ?? 0,
        totalBulletins: Array.isArray(bulletinsData.data) ? bulletinsData.data.length : 0,
        readBulletins: 0,
        totalShifts: 0,
        totalFeedback: feedbackData.data?.total ?? 0,
        respondedFeedback: feedbackData.data?.responded ?? 0,
        totalChecklists: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isAdmin) return
    void loadAnalytics()
  }, [accessToken, isAdmin])

  const metrics = data
    ? [
        {
          title: 'کل پرسنل',
          value: data.totalUsers,
          icon: Users,
          color: 'text-info',
          bgColor: 'bg-info/10',
          detail: `${toFa(data.activeUsers)} فعال / ${toFa(data.pendingUsers)} در انتظار`,
        },
        {
          title: 'تیکت‌ها',
          value: data.totalTickets,
          icon: AlertTriangle,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          detail: `${toFa(data.openTickets)} باز / ${toFa(data.resolvedTickets)} حل شده`,
        },
        {
          title: 'بخشنامه‌ها',
          value: data.totalBulletins,
          icon: Activity,
          color: 'text-accent',
          bgColor: 'bg-accent/10',
          detail: `${toFa(data.readBulletins)} خوانده شده`,
        },
        {
          title: 'بازخوردها',
          value: data.totalFeedback,
          icon: CheckCircle,
          color: 'text-success',
          bgColor: 'bg-success/10',
          detail: `${toFa(data.respondedFeedback)} پاسخ داده شده`,
        },
      ]
    : []

  const kpis = data
    ? [
        {
          label: 'نرخ پاسخ‌گویی به بازخوردها',
          value: data.totalFeedback > 0 ? Math.round((data.respondedFeedback / data.totalFeedback) * 100) : 0,
          color: '#34c759',
        },
        {
          label: 'نرخ حل تیکت‌ها',
          value: data.totalTickets > 0 ? Math.round((data.resolvedTickets / data.totalTickets) * 100) : 0,
          color: '#007aff',
        },
        {
          label: 'نرخ مطالعه بخشنامه‌ها',
          value: data.totalBulletins > 0 ? Math.round((data.readBulletins / data.totalBulletins) * 100) : 0,
          color: '#ff9500',
        },
      ]
    : []

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-foreground-muted">شما دسترسی به این بخش را ندارید</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <BarChart3 className="size-6 text-accent" />
          داشبورد تحلیلی
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          آمار و شاخص‌های کلیدی عملکرد سیستم
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-background-subtle" />
          ))}
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`rounded-lg ${m.bgColor} p-2.5 ${m.color}`}>
                    <m.icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">{toFa(m.value)}</div>
                    <div className="text-xs text-foreground-muted">{m.title}</div>
                    <div className="mt-1 text-[10px] text-foreground-muted">{m.detail}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4" />
                شاخص‌های کلیدی عملکرد (KPI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpis.map((kpi, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{kpi.label}</span>
                      <span className="font-mono">{toFa(kpi.value)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background-subtle">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${kpi.value}%`, backgroundColor: kpi.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">وضعیت پرسنل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">فعال</span>
                  <Badge className="bg-success/15 text-success">{toFa(data?.activeUsers ?? 0)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">در انتظار تأیید</span>
                  <Badge className="bg-warning/15 text-warning">{toFa(data?.pendingUsers ?? 0)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">تیکت‌های باز</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">باز</span>
                  <Badge className="bg-critical/15 text-critical">{toFa(data?.openTickets ?? 0)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">حل شده</span>
                  <Badge className="bg-success/15 text-success">{toFa(data?.resolvedTickets ?? 0)}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">بازخوردها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">کل</span>
                  <Badge className="bg-info/15 text-info">{toFa(data?.totalFeedback ?? 0)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">پاسخ داده شده</span>
                  <Badge className="bg-success/15 text-success">{toFa(data?.respondedFeedback ?? 0)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
