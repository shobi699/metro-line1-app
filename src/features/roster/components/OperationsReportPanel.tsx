'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Activity, Users, AlertCircle } from 'lucide-react'

export function OperationsReportPanel({ jalaliDate }: { jalaliDate: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real scenario we'd fetch from a reporting API endpoint
    // For now, we mock the operational data based on the date
    setTimeout(() => {
      setData({
        totalTrips: 184,
        completedTrips: 45,
        cancelledTrips: 2,
        amendments: 5,
        activeCrew: 42,
        incidents: 1
      })
      setLoading(false)
    }, 1000)
  }, [jalaliDate])

  if (loading) return <div className="p-4 text-center">در حال بارگذاری گزارش عملیاتی...</div>
  if (!data) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">کل سفرهای برنامه‌ای</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{data.totalTrips}</div>
          <p className="text-xs text-muted-foreground">تا این لحظه {data.completedTrips} سفر انجام شده</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اصلاحیه‌های زنده</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{data.amendments}</div>
          <p className="text-xs text-muted-foreground">تغییر در برنامه اصلی (ثبت توسط ناظر)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نیروی انسانی (راهبران)</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{data.activeCrew}</div>
          <p className="text-xs text-muted-foreground">نفر در حال خدمت در خط</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">لغوی / تأخیر بحرانی</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{data.cancelledTrips + data.incidents}</div>
          <p className="text-xs text-muted-foreground">نیازمند توجه مرکز فرمان (OCC)</p>
        </CardContent>
      </Card>
    </div>
  )
}
