'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toFa } from '@/lib/fa'

export default function MeetingsReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/meetings/reports')
      .then(res => res.json())
      .then(resData => {
        setData(resData.data)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  if (loading) return <div className="p-8 text-center text-foreground-muted animate-pulse">در حال دریافت آمار...</div>
  if (!data) return <div className="p-8 text-center text-critical">خطا در دریافت اطلاعات</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">داشبورد و گزارشات جلسات</h1>
          <p className="text-sm text-foreground-muted mt-1">آمار کلی استفاده از سامانه رزرو وقت</p>
        </div>
        <Button onClick={() => window.open('/api/admin/meetings/reports/export', '_blank')}>
          <Download className="size-4 ml-2" />
          دانلود اکسل کل جلسات
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">کل درخواست‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toFa(data.stats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">جلسات تایید شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{toFa(data.stats.approved)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">جلسات انجام شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-500">{toFa(data.stats.completed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground-muted">نرخ لغو (٪)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-critical">{toFa(data.stats.cancelRate)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>توزیع بار جلسات مدیران</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.stats.hostLoads.length === 0 ? (
                <p className="text-sm text-foreground-muted">داده‌ای موجود نیست</p>
              ) : (
                data.stats.hostLoads.map((hl: any) => (
                  <div key={hl.name} className="flex items-center justify-between text-sm">
                    <span>{hl.name}</span>
                    <span className="font-bold bg-surface-container-low px-2 py-1 rounded">{toFa(hl.count)} جلسه</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
