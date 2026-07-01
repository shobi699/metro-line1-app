'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/features/auth/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import {
  Shield,
  Search,
  RefreshCw,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Filter,
  ArrowLeftRight,
} from 'lucide-react'

interface AuditActor {
  id: string
  name: string
  nationalId: string
  role?: { name: string }
}

interface AuditLogEntry {
  id: string
  actorId: string
  entity: string
  entityId: string
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
  ipAddress: string | null
  userAgent: string | null
  device: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  actor: AuditActor
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'ایجاد', color: 'bg-success/15 text-success border-success/20' },
  update: { label: 'ویرایش', color: 'bg-warning/15 text-warning border-warning/20' },
  delete: { label: 'حذف', color: 'bg-critical/15 text-critical border-critical/20' },
  login: { label: 'ورود', color: 'bg-accent/15 text-accent border-accent/20' },
  logout: { label: 'خروج', color: 'bg-foreground-muted/15 text-foreground-muted border-foreground-muted/20' },
  import: { label: 'ورود داده', color: 'bg-primary/15 text-primary border-primary/20' },
  export: { label: 'خروجی اکسل', color: 'bg-primary/15 text-primary border-primary/20' },
}

const ENTITY_LABELS: Record<string, string> = {
  User: 'کاربر',
  Setting: 'تنظیمات',
  Role: 'نقش',
  Shift: 'شیفت',
  Ticket: 'تیکت',
  Post: 'محتوا',
  SafetyBulletin: 'بخش‌نامه ایمنی',
  CrisisEvent: 'بحران',
  SwapRequest: 'جابه‌جایی شیفت',
  MeetingRequest: 'جلسه',
  ImportJob: 'ورود داده',
  Poll: 'نظرسنجی',
}

function DeviceIcon({ device }: { device: string | null }) {
  switch (device) {
    case 'mobile': return <Smartphone className="size-4" />
    case 'tablet': return <Tablet className="size-4" />
    case 'desktop': return <Monitor className="size-4" />
    default: return <Globe className="size-4" />
  }
}

function DeviceLabel(device: string | null): string {
  switch (device) {
    case 'mobile': return 'موبایل'
    case 'tablet': return 'تبلت'
    case 'desktop': return 'دسکتاپ'
    default: return 'نامشخص'
  }
}

function DiffViewer({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  if (!before && !after) return <p className="text-xs text-foreground-muted">بدون اطلاعات تغییرات</p>

  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ])

  const changedKeys: { key: string; from: unknown; to: unknown }[] = []
  for (const key of allKeys) {
    const oldVal = before?.[key]
    const newVal = after?.[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changedKeys.push({ key, from: oldVal, to: newVal })
    }
  }

  if (changedKeys.length === 0) {
    return <p className="text-xs text-foreground-muted">هیچ تغییری شناسایی نشد</p>
  }

  return (
    <div className="space-y-1.5">
      {changedKeys.map(({ key, from, to }) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 text-[11px] font-mono leading-relaxed">
          <span className="font-bold text-foreground shrink-0 min-w-[100px]">{key}:</span>
          <div className="flex items-start gap-1.5 flex-wrap">
            {from !== undefined && (
              <span className="bg-critical/10 text-critical px-1.5 py-0.5 rounded line-through">
                {String(from)}
              </span>
            )}
            <ArrowLeftRight className="size-3 text-foreground-muted shrink-0 mt-0.5" />
            {to !== undefined && (
              <span className="bg-success/10 text-success px-1.5 py-0.5 rounded">
                {String(to)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AuditLogsPage() {
  const { accessToken } = useAuthStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (entityFilter) params.set('entity', entityFilter)
      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setLogs(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [accessToken, search, actionFilter, entityFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const jalali = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } catch { return iso }
  }
  const faTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          دفتر ثبت وقایع سیستمی (Audit Log)
        </h1>
        <p className="text-xs text-foreground-muted leading-relaxed">
          گزارش کامل و حرفه‌ای عملیات حساس: چه کسی، چه زمانی، از چه دستگاهی، با چه IP، مقدار قبل و بعد تغییر، و دلیل تغییر.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-primary font-data-mono">{toFa(logs.length)}</p>
            <p className="text-[10px] text-foreground-muted">تعداد رویدادها</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-success font-data-mono">{toFa(logs.filter(l => l.action === 'create').length)}</p>
            <p className="text-[10px] text-foreground-muted">ایجاد</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-warning font-data-mono">{toFa(logs.filter(l => l.action === 'update').length)}</p>
            <p className="text-[10px] text-foreground-muted">ویرایش</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-extrabold text-critical font-data-mono">{toFa(logs.filter(l => l.action === 'delete').length)}</p>
            <p className="text-[10px] text-foreground-muted">حذف</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            فیلتر و جستجوی پیشرفته
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground-muted" />
              <Input
                placeholder="جستجو نام، کدملی یا شناسه رکورد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-9 text-xs h-9"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground cursor-pointer"
            >
              <option value="">همه عملیات‌ها</option>
              {Object.entries(ACTION_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground cursor-pointer"
            >
              <option value="">همه موجودیت‌ها</option>
              {Object.entries(ENTITY_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="h-9 gap-1.5 cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries List */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-bold">رویدادهای ثبت‌شده</CardTitle>
          <CardDescription className="text-[10px] text-foreground-muted">
            آخرین {toFa(100)} رکورد. برای مشاهده جزئیات هر رکورد روی آن کلیک کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-foreground-muted gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs">در حال دریافت لاگ‌های ممیزی...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-foreground-muted gap-2 border border-dashed border-border/60 rounded-lg">
              <Shield className="size-10 opacity-30" />
              <span className="text-xs font-medium">هیچ رکوردی مطابق فیلتر یافت نشد</span>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const isExpanded = expandedId === log.id
                const actionMeta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-surface text-foreground' }

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "border rounded-lg transition-all",
                      isExpanded ? "border-primary/30 bg-surface-container-low/50 shadow-sm" : "border-border/40 bg-surface-container-low/20 hover:bg-surface-container-low/40"
                    )}
                  >
                    {/* Summary Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 text-right cursor-pointer"
                    >
                      <div className="flex items-start sm:items-center gap-2.5">
                        <Badge className={cn("text-[9px] px-1.5 py-0 border shrink-0", actionMeta.color)}>
                          {actionMeta.label}
                        </Badge>
                        <div className="space-y-0.5 text-right">
                          <p className="text-xs font-bold text-foreground">
                            <span className="text-foreground-muted">توسط </span>
                            {log.actor.name}
                            <span className="text-foreground-muted"> — </span>
                            <span className="text-foreground">{ENTITY_LABELS[log.entity] || log.entity}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-foreground-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {jalali(log.createdAt)} — {faTime(log.createdAt)}
                            </span>
                            {log.device && (
                              <span className="flex items-center gap-1">
                                <DeviceIcon device={log.device} />
                                {DeviceLabel(log.device)}
                              </span>
                            )}
                            {log.ipAddress && (
                              <span className="flex items-center gap-1 font-mono">
                                <Globe className="size-3" />
                                {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-[9px] font-mono text-foreground-muted bg-surface px-1.5 py-0.5 rounded border border-border/40">
                          {log.id.slice(0, 10)}
                        </span>
                        {isExpanded ? <ChevronUp className="size-4 text-foreground-muted" /> : <ChevronDown className="size-4 text-foreground-muted" />}
                      </div>
                    </button>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="border-t border-border/30 p-4 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                        {/* Actor Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-surface/50 rounded-lg border border-border/30 p-2.5 space-y-1">
                            <p className="text-[10px] text-foreground-muted flex items-center gap-1"><User className="size-3" /> چه کسی؟</p>
                            <p className="text-xs font-bold">{log.actor.name}</p>
                            <p className="text-[10px] font-mono text-foreground-muted">
                              {toFa(log.actor.nationalId)} — {log.actor.role?.name || '—'}
                            </p>
                          </div>
                          <div className="bg-surface/50 rounded-lg border border-border/30 p-2.5 space-y-1">
                            <p className="text-[10px] text-foreground-muted flex items-center gap-1"><Clock className="size-3" /> چه زمانی؟</p>
                            <p className="text-xs font-bold">{jalali(log.createdAt)}</p>
                            <p className="text-[10px] font-mono text-foreground-muted">{faTime(log.createdAt)}</p>
                          </div>
                          <div className="bg-surface/50 rounded-lg border border-border/30 p-2.5 space-y-1">
                            <p className="text-[10px] text-foreground-muted flex items-center gap-1"><DeviceIcon device={log.device} /> از چه دستگاهی؟</p>
                            <p className="text-xs font-bold">{DeviceLabel(log.device)}</p>
                            <p className="text-[10px] font-mono text-foreground-muted leading-tight truncate" title={log.userAgent || ''}>
                              {log.userAgent?.slice(0, 60) || '—'}
                            </p>
                          </div>
                          <div className="bg-surface/50 rounded-lg border border-border/30 p-2.5 space-y-1">
                            <p className="text-[10px] text-foreground-muted flex items-center gap-1"><Globe className="size-3" /> با چه IP؟</p>
                            <p className="text-xs font-bold font-mono">{log.ipAddress || '—'}</p>
                            <p className="text-[10px] text-foreground-muted">
                              موجودیت: {ENTITY_LABELS[log.entity] || log.entity} ({log.entityId.slice(0, 10)})
                            </p>
                          </div>
                        </div>

                        {/* Reason */}
                        {log.reason && (
                          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-warning font-bold">دلیل تغییر:</p>
                              <p className="text-xs text-foreground">{log.reason}</p>
                            </div>
                          </div>
                        )}

                        {/* Before / After Diff */}
                        {(log.before || log.after) && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-foreground-muted flex items-center gap-1">
                              <FileText className="size-3" /> تغییرات (مقدار قبل ← مقدار بعد):
                            </p>
                            <div className="bg-surface/50 border border-border/30 rounded-lg p-3 overflow-x-auto">
                              <DiffViewer before={log.before} after={log.after} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
