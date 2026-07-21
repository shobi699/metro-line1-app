'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  submitted: 'ثبت شده',
  under_review: 'در حال بررسی',
  needs_info: 'نیاز به اطلاعات',
  rejected: 'رد شده',
  approved: 'تایید شده',
  in_repair: 'در حال تعمیر',
  repaired: 'تعمیر شده',
  verified_closed: 'بسته شده',
  deferred: 'ماندگار (Deferred)',
  reopened: 'بازگشایی شده',
}

const STATUS_CLASSES: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  under_review: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  needs_info: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  approved: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  in_repair: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  repaired: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  verified_closed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  deferred: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  reopened: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
}

export default function TrainProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { accessToken } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    setLoading(true)
    try {
      const res = await fetch(`/api/fault-reports/train/${id}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setProfile(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-foreground-muted animate-pulse">در حال بارگذاری شناسنامه سلامت قطار...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-red-400">شناسنامه قطار یافت نشد یا غیرفعال است.</span>
      </div>
    )
  }

  const { train, activeFaults, topWagonFaults, history } = profile

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            شناسنامه سلامت قطار {toFa(train.trainNumber)}
          </h1>
          <p className="text-sm text-foreground-muted">
            وضعیت واگن‌ها، لیست خرابی‌های فعال و سوابق تعمیراتی قطار {train.trainNumber} (سری {train.fleetSeries})
          </p>
        </div>
        <Button onClick={loadProfile} variant="outline" className="text-xs">
          به‌روزرسانی وضعیت
        </Button>
      </div>

      {/* Specifications and stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border bg-surface col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">مشخصات ناوگان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">شماره قطار:</span>
              <span className="font-bold text-foreground">{toFa(train.trainNumber)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">سری قطار:</span>
              <span className="font-bold text-foreground">{train.fleetSeries}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">شرکت سازنده:</span>
              <span className="font-bold text-foreground">{train.manufacturer || '—'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">تعداد واگن فعال:</span>
              <span className="font-bold text-foreground">{toFa(train.wagons.length)} واگن</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">وضعیت در شبکه:</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {train.status === 'active' ? 'فعال در خط ۱' : train.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Wagon health schema */}
        <Card className="border border-border bg-surface col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">نمای گرافیکی واگن‌ها و فالت‌های فعال</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {train.wagons.map((w: any) => {
                const wagonFaultsCount = activeFaults.filter((f: any) => f.wagonId === w.id).length
                return (
                  <div
                    key={w.id}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border h-20 text-center ${
                      wagonFaultsCount > 0
                        ? 'border-red-500/40 bg-red-950/20 text-red-400'
                        : 'border-border bg-zinc-900 text-foreground-muted'
                    }`}
                  >
                    <span className="text-xs font-bold block text-foreground">واگن {toFa(w.position)}</span>
                    <span className="text-[9px] block text-foreground-muted font-mono">{w.wagonCode}</span>
                    {wagonFaultsCount > 0 ? (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">
                        {toFa(wagonFaultsCount)} فالت فعال 🚨
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-500 mt-1 block">سالم</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Faults List */}
      <Card className="border border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">فالت‌های فعال در انتظار تعمیر یا بازبینی</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeFaults.length === 0 ? (
            <div className="text-center py-6 text-xs text-foreground-muted">هیچ فالت فعال یا به تعویق افتاده‌ای یافت نشد.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="text-right">شماره فالت</TableHead>
                  <TableHead className="text-right">واگن</TableHead>
                  <TableHead className="text-right">کد خطا</TableHead>
                  <TableHead className="text-right">شرح فالت</TableHead>
                  <TableHead className="text-right">اولویت</TableHead>
                  <TableHead className="text-right">وضعیت گردشکار</TableHead>
                  <TableHead className="text-right">تاریخ وقوع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeFaults.map((f: any) => (
                  <TableRow key={f.id} className="border-b border-border hover:bg-surface-hover">
                    <TableCell className="font-mono text-foreground font-bold">F-{f.faultNo}</TableCell>
                    <TableCell>{f.wagon ? `واگن ${toFa(f.wagon.position)}` : 'کادر قطار'}</TableCell>
                    <TableCell className="font-mono text-xs">{f.faultCode.code}</TableCell>
                    <TableCell className="text-xs text-foreground-muted">{f.description}</TableCell>
                    <TableCell>{f.priority}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_CLASSES[f.status]}>{STATUS_LABELS[f.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{jalali(f.occurredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* History Log */}
      <Card className="border border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">سوابق کامل خرابی‌ها و تعمیرات قطار (تاریخچه)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-foreground-muted">هیچ سابقه‌ای ثبت نشده است.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="text-right">شماره فالت</TableHead>
                  <TableHead className="text-right">کد خطا</TableHead>
                  <TableHead className="text-right">شرح خرابی</TableHead>
                  <TableHead className="text-right">ثبت‌کننده</TableHead>
                  <TableHead className="text-right">وضعیت نهایی</TableHead>
                  <TableHead className="text-right">تاریخ وقوع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => (
                  <TableRow key={h.id} className="border-b border-border hover:bg-surface-hover">
                    <TableCell className="font-mono text-foreground">F-{h.faultNo}</TableCell>
                    <TableCell className="font-mono text-xs">{h.faultCode.code}</TableCell>
                    <TableCell className="text-xs text-foreground-muted">{h.description}</TableCell>
                    <TableCell>{h.reporter.name}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_CLASSES[h.status]}>{STATUS_LABELS[h.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{jalali(h.occurredAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
