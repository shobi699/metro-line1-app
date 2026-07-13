'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Terminal,
  Search,
  RefreshCw,
  Copy,
  AlertCircle,
  Bug,
  Info,
  AlertTriangle,
  Play,
  User,
  Monitor,
  Phone,
  Server,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { jalali, faTime } from '@/lib/fa'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 30,
    pages: 1,
  })

  // فیلترها
  const [level, setLevel] = useState<string>('all')
  const [source, setSource] = useState<string>('all')
  const [category, setCategory] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)

  // لاگ انتخاب شده برای نمایش در سایدبار جزئیات
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()

  // بارگذاری لاگ‌ها
  const fetchLogs = async (currentPage = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        level,
        source,
        category,
        query,
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
      })
      const token = useAuthStore.getState().accessToken
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const json = await res.url ? await res.json() : null
      if (res.ok && json) {
        setLogs(json.data.logs || [])
        setPagination(json.data.pagination)
      } else {
        toast.error(json?.error || 'خطا در بارگذاری لاگ‌ها')
      }
    } catch (err: any) {
      toast.error('خطای ارتباط با سرور: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
    setPage(1)
  }, [level, source])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1)
    setPage(1)
  }

  // شبیه‌سازی خطای تست
  const handleSimulateError = async () => {
    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/admin/logs/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(json.message || 'خطای نمونه با موفقیت ثبت شد')
        fetchLogs(1)
        setPage(1)
      } else {
        toast.error(json.error || 'خطا در شبیه‌سازی خطا')
      }
    } catch (err: any) {
      toast.error('خطای ارتباط با سرور: ' + err.message)
    }
  }

  // کپی لاگ برای هوش مصنوعی (AI)
  const handleCopyForAi = (log: any) => {
    if (!log) return

    const formattedLog = `### 🚨 گزارش خطای سامانه مترو خط ۱ (جهت تحلیل هوش مصنوعی)

**شناسه لاگ:** \`${log.id}\`
**زمان ثبت:** ${jalali(log.createdAt)} ساعت ${faTime(log.createdAt)}
**سطح حساسیت:** ${log.level.toUpperCase()}
**منبع بروز خطا:** ${log.source.toUpperCase()}
**دسته‌بندی:** ${log.category}
**پیام اصلی:** ${log.message}
**کاربر عامل:** ${log.actor ? `${log.actor.name} (کد پرسنلی: ${log.actor.personnelCode})` : 'کاربر مهمان / نامشخص'}
**آدرس آی‌پی:** \`${log.ipAddress || 'نامشخص'}\`
**مشخصات مرورگر کلاینت (User Agent):** \`${log.userAgent || 'نامشخص'}\`

#### 📝 اطلاعات متاداده (Metadata):
\`\`\`json
${JSON.stringify(log.metadata || {}, null, 2)}
\`\`\`

#### 💻 کد رهگیری خطا (Stack Trace):
\`\`\`
${log.stack || 'فاقد اطلاعات فنی بیشتر (Stack Trace)'}
\`\`\`
`
    navigator.clipboard.writeText(formattedLog)
    toast.success('اطلاعات خطا با فرمت مارک‌داون مخصوص هوش مصنوعی کپی شد.')
  }

  // نمایش آیکون مناسب برای هر سطح
  const renderLevelBadge = (lvl: string) => {
    switch (lvl) {
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 flex items-center justify-center bg-critical/20 text-critical border-critical/30 hover:bg-critical/20 py-1 px-2.5 rounded-full font-medium">
            <AlertCircle className="size-3.5" />
            خطا
          </Badge>
        )
      case 'warn':
        return (
          <Badge className="gap-1 flex items-center justify-center bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10 py-1 px-2.5 rounded-full font-medium">
            <AlertTriangle className="size-3.5" />
            هشدار
          </Badge>
        )
      case 'info':
        return (
          <Badge className="gap-1 flex items-center justify-center bg-accent/20 text-accent border-accent/30 hover:bg-accent/20 py-1 px-2.5 rounded-full font-medium">
            <Info className="size-3.5" />
            اطلاعات
          </Badge>
        )
      case 'debug':
      default:
        return (
          <Badge className="gap-1 flex items-center justify-center bg-foreground-muted/15 text-foreground-muted border-outline-variant hover:bg-foreground-muted/15 py-1 px-2.5 rounded-full font-medium">
            <Bug className="size-3.5" />
            دیباگ
          </Badge>
        )
    }
  }

  const renderSourceIcon = (src: string) => {
    switch (src) {
      case 'server':
        return <Server className="size-4 text-accent" />
      case 'mobile':
        return <Phone className="size-4 text-emerald-500" />
      case 'client':
      default:
        return <Monitor className="size-4 text-indigo-500" />
    }
  }

  const renderSourceLabel = (src: string) => {
    switch (src) {
      case 'server':
        return 'سرور'
      case 'mobile':
        return 'اپلیکیشن موبایل'
      case 'client':
      default:
        return 'کلاینت وب'
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-[fadeInUp_0.4s_ease-out]">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline-md text-foreground flex items-center gap-2">
            <Terminal className="size-6 text-critical" />
            لاگ‌های سیستم و مانیتورینگ خطاها
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مشاهده، فیلتر و تحلیل خطاهای زنده سیستم، کلاینت وب و اپلیکیشن موبایل راهبران مترو خط ۱.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSimulateError}
            className="gap-2 border-outline-variant hover:bg-surface-container-low text-accent h-10 px-4"
          >
            <Play className="size-4" />
            شبیه‌سازی خطای تست
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="border-outline-variant hover:bg-surface-container-low size-10"
            title="بروزرسانی لاگ‌ها"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-border bg-surface-container">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
              {/* Level Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-foreground-muted font-medium">سطح حساسیت</label>
                <Select value={level} onValueChange={(val) => setLevel(val || 'all')}>
                  <SelectTrigger className="h-10 border-outline-variant bg-surface-container-low">
                    <SelectValue placeholder="همه سطوح" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-border">
                    <SelectItem value="all">همه سطوح</SelectItem>
                    <SelectItem value="error">خطا (Error)</SelectItem>
                    <SelectItem value="warn">هشدار (Warning)</SelectItem>
                    <SelectItem value="info">اطلاعات (Info)</SelectItem>
                    <SelectItem value="debug">دیباگ (Debug)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-foreground-muted font-medium">منبع خطا</label>
                <Select value={source} onValueChange={(val) => setSource(val || 'all')}>
                  <SelectTrigger className="h-10 border-outline-variant bg-surface-container-low">
                    <SelectValue placeholder="همه منابع" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container border-border">
                    <SelectItem value="all">همه منابع</SelectItem>
                    <SelectItem value="server">سرور (Server)</SelectItem>
                    <SelectItem value="client">کلاینت وب (Web Client)</SelectItem>
                    <SelectItem value="mobile">موبایل (Mobile App)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-foreground-muted font-medium">دسته‌بندی (مثال: auth)</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="جستجو در دسته‌بندی..."
                  className="h-10 border-outline-variant bg-surface-container-low"
                />
              </div>
            </div>

            {/* Query & Search Button */}
            <div className="flex gap-2 w-full md:w-auto md:min-w-[320px]">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در متن پیام یا خط کد..."
                  className="h-10 ps-10 border-outline-variant bg-surface-container-low"
                />
              </div>
              <Button type="submit" className="h-10 px-5 gap-2">
                فیلتر
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="border-border bg-surface-container overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-surface-container-high border-b border-border">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[120px] text-right">سطح</TableHead>
                  <TableHead className="w-[140px] text-right">منبع</TableHead>
                  <TableHead className="w-[120px] text-right">دسته‌بندی</TableHead>
                  <TableHead className="text-right">پیام خطا / شرح رویداد</TableHead>
                  <TableHead className="w-[150px] text-right">زمان ثبت</TableHead>
                  <TableHead className="w-[150px] text-right">کاربر عامل</TableHead>
                  <TableHead className="w-[100px] text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx} className="border-b border-border">
                      <TableCell className="h-14"><div className="h-6 w-20 bg-outline-variant animate-pulse rounded-full" /></TableCell>
                      <TableCell><div className="h-6 w-24 bg-outline-variant animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-outline-variant animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-4/5 bg-outline-variant animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-28 bg-outline-variant animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-outline-variant animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-8 w-16 bg-outline-variant animate-pulse rounded mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-foreground-muted font-body-sm">
                      هیچ لاگ یا خطایی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer hover:bg-surface-container-low border-b border-border transition-colors group"
                    >
                      <TableCell>{renderLevelBadge(log.level)}</TableCell>
                      <TableCell className="font-body-sm">
                        <div className="flex items-center gap-2">
                          {renderSourceIcon(log.source)}
                          <span>{renderSourceLabel(log.source)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-data-mono text-xs text-accent">
                        <Badge variant="outline" className="border-outline-variant font-data-mono font-normal">
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-body-sm text-foreground max-w-md truncate group-hover:text-critical transition-colors">
                        {log.message}
                      </TableCell>
                      <TableCell className="font-data-mono text-xs text-foreground-muted" dir="ltr">
                        {jalali(log.createdAt)} - {faTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-body-sm text-foreground-muted">
                        {log.actor ? (
                          <div className="flex items-center gap-1">
                            <User className="size-3.5 text-foreground-muted" />
                            <span>{log.actor.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground-muted/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyForAi(log)}
                          className="size-8 text-foreground-muted hover:text-accent hover:bg-surface-container-high"
                          title="کپی لاگ برای هوش مصنوعی (AI)"
                        >
                          <Copy className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-border bg-surface-container-high">
              <span className="text-xs text-foreground-muted">
                نمایش لاگ‌های {pagination.page} از کل {pagination.pages} صفحه
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || loading}
                  onClick={() => {
                    const prevPage = page - 1
                    setPage(prevPage)
                    fetchLogs(prevPage)
                  }}
                  className="h-8 border-outline-variant hover:bg-surface-container-low"
                >
                  صفحه قبل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pagination.pages || loading}
                  onClick={() => {
                    const nextPage = page + 1
                    setPage(nextPage)
                    fetchLogs(nextPage)
                  }}
                  className="h-8 border-outline-variant hover:bg-surface-container-low"
                >
                  صفحه بعد
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="bg-surface-container border-border text-right overflow-y-auto max-w-xl sm:max-w-2xl w-full">
          {selectedLog && (
            <div className="flex flex-col gap-6">
              <SheetHeader className="text-right border-b border-border pb-4">
                <div className="flex justify-between items-center w-full">
                  <SheetTitle className="font-headline-sm text-foreground flex items-center gap-2">
                    <Terminal className="size-5 text-critical" />
                    جزئیات لاگ خطای سیستم
                  </SheetTitle>
                  <Button
                    variant="outline"
                    className="gap-2 h-9 border-outline-variant text-accent hover:bg-surface-container-low"
                    onClick={() => handleCopyForAi(selectedLog)}
                  >
                    <Copy className="size-4" />
                    کپی برای هوش مصنوعی (AI)
                  </Button>
                </div>
                <SheetDescription className="text-foreground-muted font-body-sm mt-1">
                  شناسه لاگ: {selectedLog.id}
                </SheetDescription>
              </SheetHeader>

              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">سطح حساسیت</span>
                  <div className="mt-1">{renderLevelBadge(selectedLog.level)}</div>
                </div>

                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">منبع خطا</span>
                  <span className="text-sm font-semibold flex items-center gap-2 mt-1">
                    {renderSourceIcon(selectedLog.source)}
                    {renderSourceLabel(selectedLog.source)}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">دسته‌بندی (Category)</span>
                  <span className="text-sm font-data-mono text-accent font-semibold mt-1">
                    {selectedLog.category}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">زمان بروز خطا</span>
                  <span className="text-sm font-medium mt-1 flex items-center gap-1">
                    <Calendar className="size-4 text-foreground-muted" />
                    {jalali(selectedLog.createdAt)} ساعت {faTime(selectedLog.createdAt)}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">آدرس آی‌پی (IP Address)</span>
                  <span className="text-sm font-data-mono mt-1" dir="ltr">
                    {selectedLog.ipAddress || 'نامشخص'}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1">
                  <span className="text-xs text-foreground-muted">کاربر عامل</span>
                  <span className="text-sm font-semibold mt-1">
                    {selectedLog.actor ? `${selectedLog.actor.name} (${selectedLog.actor.personnelCode})` : 'نامشخص'}
                  </span>
                </div>
              </div>

              {/* User Agent */}
              <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1.5">
                <span className="text-xs text-foreground-muted">مشخصات مرورگر / دستگاه کلاینت (User Agent)</span>
                <span className="text-xs font-data-mono leading-relaxed" dir="ltr">
                  {selectedLog.userAgent || 'فاقد اطلاعات'}
                </span>
              </div>

              {/* Message */}
              <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-1.5">
                <span className="text-xs text-foreground-muted">پیام خطا</span>
                <p className="text-sm text-foreground font-semibold leading-relaxed font-body-sm">
                  {selectedLog.message}
                </p>
              </div>

              {/* Metadata JSON */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-2">
                  <span className="text-xs text-foreground-muted">اطلاعات اضافی (Metadata JSON)</span>
                  <pre className="font-data-mono text-xs bg-surface-container-high border border-border rounded-lg p-3 overflow-x-auto text-emerald-400" dir="ltr">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              <div className="rounded-xl border border-border bg-surface-container-low p-4 flex flex-col gap-2">
                <span className="text-xs text-foreground-muted">ردیابی کد خطا (Stack Trace)</span>
                <pre className="font-data-mono text-[11px] bg-neutral-950 text-neutral-200 border border-border rounded-lg p-4 overflow-x-auto leading-relaxed" dir="ltr">
                  {selectedLog.stack || 'فاقد Stack Trace'}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
