'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function AdminRequestsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [requests, setRequests] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    if (!accessToken) return
    try {
      const [resReq, resTypes] = await Promise.all([
        fetch('/api/requests', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/requests/types', { headers: { Authorization: `Bearer ${accessToken}` } })
      ])
      if (resReq.ok) setRequests((await resReq.json()).data)
      if (resTypes.ok) setTypes((await resTypes.json()).data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [accessToken])

  async function handleReview(id: string, status: 'approved' | 'rejected') {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/requests/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        loadData()
      } else {
        alert('خطا در بررسی درخواست')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  const getTypeLabel = (typeId: string) => {
    const t = types.find((t) => t.id === typeId)
    return t ? t.label : typeId
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مدیریت درخواست‌های پرسنلی</h1>
        <p className="text-foreground-muted">بررسی و تایید/رد مرخصی، اضافه‌کار، کشیک و ماموریت پرسنل</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map(req => (
          <Card key={req.id}>
            <CardHeader className="pb-2 border-b border-border/40 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{req.user?.name}</CardTitle>
                  <CardDescription>کد پرسنلی: {toFa(req.user?.personnelCode)}</CardDescription>
                </div>
                <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}
                       className={req.status === 'approved' ? 'bg-green-600' : ''}>
                  {req.status === 'pending' ? 'در انتظار تایید' : req.status === 'approved' ? 'تایید شده' : 'رد شده'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-muted">نوع درخواست:</span>
                <span className="font-semibold">{getTypeLabel(req.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">تاریخ شروع:</span>
                <span className="font-mono">{toFa(new Date(req.fromDate).toLocaleDateString('fa-IR'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">تاریخ پایان:</span>
                <span className="font-mono">{toFa(new Date(req.toDate).toLocaleDateString('fa-IR'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">مقدار ({req.unit === 'hours' ? 'ساعت' : req.unit === 'days' ? 'روز' : 'تعداد'}):</span>
                <span className="font-bold">{toFa(req.amount)}</span>
              </div>
              {req.calculatedAmount !== null && (
                <div className="flex justify-between bg-accent/10 p-2 rounded-md">
                  <span className="text-accent">مقدار محاسبه شده نهایی:</span>
                  <span className="font-bold text-accent">{toFa(req.calculatedAmount)}</span>
                </div>
              )}
              {req.reason && (
                <div className="bg-surface-container p-2 rounded-md border border-border">
                  <p className="text-xs text-foreground-muted mb-1">توضیحات پرسنل:</p>
                  <p>{req.reason}</p>
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-border/40 mt-4">
                  <Button onClick={() => handleReview(req.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="ml-2 size-4" /> تایید
                  </Button>
                  <Button onClick={() => handleReview(req.id, 'rejected')} variant="destructive" className="flex-1">
                    <XCircle className="ml-2 size-4" /> رد
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
