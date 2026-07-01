'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import {
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  Radio,
  FileSpreadsheet,
  Clock,
  Zap,
  ShieldAlert
} from 'lucide-react'

interface AuditLogRow {
  id: string
  operatorName: string
  role: string
  action: string
  dateTime: string
  module: string
}

export default function AnalyticsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'kpis' | 'audit-logs' | 'telemetry'>('kpis')

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])

  const defaultAuditLogs: AuditLogRow[] = [
    { id: 'log-1', operatorName: 'سهراب مرادی', role: 'مدیر شیفت OCC', action: 'اعلام وضعیت بحران قرمز در بلاک ۷ شمالی', dateTime: '۱۴۰۵/۰۴/۰۲ - ۱۲:۳۰', module: 'مدیریت بحران' },
    { id: 'log-2', operatorName: 'علیرضا کریمی', role: 'سرپرست ایستگاه تجریش', action: 'تأیید درخواست تعویض شیفت راهبر حمیدی', dateTime: '۱۴۰۵/۰۴/۰۲ - ۱۱:۱۵', module: 'لوحه و شیفت‌ها' },
    { id: 'log-3', operatorName: 'جواد رضایی', role: 'مسئول تدارکات دپو', action: 'تحویل بی‌سیم دستی تترا به راهبر سلیمی', dateTime: '۱۴۰۵/۰۴/۰۲ - ۰۹:۴۰', module: 'تجهیزات انفرادی' },
    { id: 'log-4', operatorName: 'سهراب مرادی', role: 'مدیر شیفت OCC', action: 'انتشار فرم جدید گزارش سوانح سیگنالینگ', dateTime: '۱۴۰۵/۰۴/۰۱ - ۱۵:۲۰', module: 'فرم‌ساز سازمانی' },
    { id: 'log-5', operatorName: 'خانم دکتر هاشمی', role: 'سرپرست آموزش', action: 'بارگذاری مستند جدید آیین‌نامه رانندگی قطار', dateTime: '۱۴۰۵/۰۴/۰۱ - ۱۰:۰۵', module: 'مدیریت اسناد' },
  ]

  useEffect(() => {
    if (!isAdmin) return
    
    // Load audit logs from localStorage or mock
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_audit_logs')
      if (saved) setAuditLogs(JSON.parse(saved))
      else {
        setAuditLogs(defaultAuditLogs)
        window.localStorage.setItem('metro_audit_logs', JSON.stringify(defaultAuditLogs))
      }
    }
    
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [accessToken, isAdmin])

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-4" dir="rtl">
        <p className="text-sm text-foreground-muted">شما دسترسی به این بخش را ندارید</p>
      </div>
    )
  }

  // Telemetry Mock Data
  const telemetry = {
    activeRadios: 48,
    signalingLatency: '۱۸ میلی‌ثانیه',
    lineVoltage: '۷۵۰ ولت DC (پایدار)',
    blockStatus: '۳۲ بلاک سبز / ۱ بلاک زرد احتیاط',
    activeCrisisCount: 0
  }

  // KPI Mock Data
  const kpiStats = [
    { label: 'نرخ انحراف از زمان‌بندی لوحه (سیر و حرکت)', value: 98.4, color: '#34c759', desc: 'دقت اعزام و تخلیه سر وقت قطارها در بلاک‌ها' },
    { label: 'میانگین ضریب خستگی راهبران حاضر در خط', value: 24, color: '#007aff', desc: 'محاسبه شده بر اساس خوداظهاری فیزیکی و ساعات خواب' },
    { label: 'نرخ پاسخ و رفع سانحه تیکت‌های خرابی واگن', value: 91.2, color: '#ff9500', desc: 'زمان طلایی رفع نقص هیدرولیک و ترمز قطارها' }
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <BarChart3 className="size-6 text-accent" />
          پیشخوان تحلیلی و لایه مدیریتی OCC
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          گزارش‌های نظارتی، شاخص‌های کلیدی عملکرد (KPI)، پایش تله‌متری خط ۱ و دفتر ثبت وقایع سیستمی (Audit Log)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'kpis'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          شاخص‌های عملکردی (KPI)
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'telemetry'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          تله‌متری و وضعیت زنده خط ۱
        </button>
        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'audit-logs'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          دفتر ثبت وقایع (Audit Log)
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-background-subtle" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: KPIS */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Activity className="size-4.5 text-accent" />
                    شاخص‌های کلیدی عملکرد سیر و حرکت (KPI)
                  </CardTitle>
                  <CardDescription>ارزیابی آماری اهداف کیفی و زمان‌بندی عملیاتی خط ۱ مترو:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {kpiStats.map((kpi, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <span className="font-bold text-foreground block">{kpi.label}</span>
                          <span className="text-[10px] text-foreground-muted block mt-0.5">{kpi.desc}</span>
                        </div>
                        <span className="font-data-mono font-bold text-base text-accent">{toFa(kpi.value)}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${kpi.value}%`, backgroundColor: kpi.color }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-success/20 bg-success/5">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-[10px] text-foreground-muted font-bold block">دقت و تطابق زمانی حرکت قطارها</span>
                    <span className="text-xl font-black text-success">تطابق کامل (بدون تأخیر بحرانی)</span>
                    <p className="text-[10px] text-foreground-muted leading-relaxed">تردد تمامی واگن‌های خط ۱ در بلاک‌های مسافربری بر اساس لوحه مصوب انطباق کامل دارد.</p>
                  </CardContent>
                </Card>

                <Card className="border-warning/20 bg-warning/5">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-[10px] text-foreground-muted font-bold block">میانگین ضریب خستگی راهبران شیفت</span>
                    <span className="text-xl font-black text-warning">خستگی کم (آماده به کار ایمن)</span>
                    <p className="text-[10px] text-foreground-muted leading-relaxed">شاخص خوداظهاری راهبران و زمان استراحت بین شیفت‌ها در محدوده ریسک سبز (پایین) قرار دارد.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Radio className="size-4.5 text-accent" />
                    ارتباطات رادیویی و بی‌سیم تترا
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-foreground-muted">تعداد دستگاه‌های آنلاین در شبکه بی‌سیم</span>
                    <strong className="text-foreground font-data-mono">{toFa(telemetry.activeRadios)} دستگاه</strong>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-foreground-muted">تاخیر سیگنالینگ بلاک‌ها</span>
                    <strong className="text-success font-data-mono">{telemetry.signalingLatency}</strong>
                  </div>
                  <p className="text-[10px] text-foreground-muted leading-relaxed">
                    سیستم مانیتورینگ آنلاین دیسپاچینگ شبکه، پایداری اتصالات فرکانسی راهبران کابین را ۹۹.۸٪ ارزیابی کرده است.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Zap className="size-4.5 text-accent" />
                    تغذیه و انرژی شبکه بالاسری
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-foreground-muted">ولتاژ برق شبکه ریل سوم</span>
                    <strong className="text-foreground font-data-mono">{telemetry.lineVoltage}</strong>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/40">
                    <span className="text-foreground-muted">وضعیت پایداری بلاک‌ها</span>
                    <strong className="text-success">{telemetry.blockStatus}</strong>
                  </div>
                  <p className="text-[10px] text-foreground-muted leading-relaxed">
                    سیستم برق‌رسانی و پست‌های تراکشن جنوبی و شمالی بدون اضافه بار یا افت ولتاژ ناگهانی در حال سرویس‌دهی هستند.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: AUDIT LOGS */}
          {activeTab === 'audit-logs' && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <ShieldAlert className="size-4.5 text-accent" />
                  دفتر ثبت وقایع امنیتی و سیستمی (Audit Log)
                </CardTitle>
                <CardDescription>ریزفعالیت‌های ثبت شده مدیران خط ۱ مترو تهران:</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="divide-y divide-border/40">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                      <div className="space-y-1.5 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">{log.action}</span>
                          <Badge variant="outline" className="text-[9px] px-1 bg-accent/5 text-accent">
                            {log.module}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-foreground-muted">
                          توسط: <strong className="text-foreground">{log.operatorName}</strong> ({log.role})
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-foreground-muted font-data-mono shrink-0 sm:text-left">
                        {toFa(log.dateTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
