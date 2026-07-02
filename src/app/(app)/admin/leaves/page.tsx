'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { jdate } from '@/lib/dayjs'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
import { CheckCircle2, XCircle, Clock, Search, Sliders } from 'lucide-react'

interface LeaveRequest {
  id: string
  userId: string
  type: string
  fromDate: string
  toDate: string
  reason: string | null
  amount: number | null
  unit: string | null
  calculatedAmount: number | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  createdAt: string
  user: {
    name: string
    nationalId: string
  }
}

export default function AdminLeavesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number | ''>('')
  const [editCalcAmount, setEditCalcAmount] = useState<number | ''>('')

  async function fetchRequests() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/leaves?status=${statusFilter === 'all' ? '' : statusFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRequests(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [accessToken, statusFilter])

  async function handleAction(id: string, newStatus: 'approved' | 'rejected', overrideAmount?: number, overrideCalc?: number) {
    if (!accessToken) return
    try {
      const payload: any = { status: newStatus }
      if (overrideAmount !== undefined) payload.amount = overrideAmount
      if (overrideCalc !== undefined) payload.calculatedAmount = overrideCalc
      
      const res = await fetch(`/api/admin/leaves/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setEditingId(null)
        fetchRequests()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      annual: 'استحقاقی',
      sick: 'استعلاجی',
      mission: 'مأموریت',
      overtime: 'اضافه کار',
      oncall: 'کشیک'
    }
    return map[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-warning border-warning bg-warning/10"><Clock className="w-3 h-3 ms-1"/> در انتظار</Badge>
      case 'approved': return <Badge variant="outline" className="text-success border-success bg-success/10"><CheckCircle2 className="w-3 h-3 ms-1"/> تایید شده</Badge>
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive bg-destructive/10"><XCircle className="w-3 h-3 ms-1"/> رد شده</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت مرخصی و مأموریت</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            بررسی و تایید درخواست‌های مرخصی، مأموریت و اضافه‌کار پرسنل
          </p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-lg border">
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${statusFilter === 'pending' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            در انتظار بررسی
          </button>
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 text-sm rounded-md transition-all ${statusFilter === 'all' ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            همه موارد
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">در حال دریافت اطلاعات...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-card/30 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium">هیچ درخواستی یافت نشد</h3>
            <p className="text-muted-foreground text-sm mt-1">تمام درخواست‌ها بررسی شده‌اند یا هنوز درخواستی ثبت نشده است.</p>
          </div>
        ) : (
          requests.map(req => (
            <Card key={req.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{req.user.name}</span>
                    <span className="text-muted-foreground text-sm px-2 py-0.5 rounded bg-muted">کد: {toFa(req.user.nationalId)}</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-sm flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-muted-foreground">
                    <div className="flex items-center">
                      <span className="text-foreground/80 font-medium ms-1">نوع:</span> 
                      {getTypeLabel(req.type)}
                    </div>
                    <div className="flex items-center">
                      <span className="text-foreground/80 font-medium ms-1">از:</span> 
                      {toFa(jdate(req.fromDate).format('YYYY/MM/DD'))}
                    </div>
                    <div className="flex items-center">
                      <span className="text-foreground/80 font-medium ms-1">تا:</span> 
                      {toFa(jdate(req.toDate).format('YYYY/MM/DD'))}
                    </div>
                    {req.reason && (
                      <div className="flex items-center w-full mt-1">
                        <span className="text-foreground/80 font-medium ms-1">توضیحات:</span> 
                        <span className="truncate">{req.reason}</span>
                      </div>
                    )}
                    {req.amount && (
                      <div className="flex items-center w-full mt-1">
                        <span className="text-foreground/80 font-medium ms-1">مقدار درخواستی:</span> 
                        <span>{req.amount} {req.unit === 'hours' ? 'ساعت' : req.unit === 'days' ? 'روز' : req.unit === 'count' ? 'مورد' : req.unit}</span>
                      </div>
                    )}
                    {req.calculatedAmount && (
                      <div className="flex items-center w-full mt-1 text-primary">
                        <span className="font-medium ms-1">مقدار محاسبه شده نهایی:</span> 
                        <span>{req.calculatedAmount} {req.unit === 'hours' ? 'ساعت' : req.unit === 'days' ? 'روز' : req.unit === 'count' ? 'مورد' : req.unit}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {req.status === 'pending' && editingId !== req.id && (
                  <div className="flex shrink-0 gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <Button variant="default" className="flex-1 sm:flex-none bg-success hover:bg-success/90" onClick={() => {
                      if (req.amount != null) {
                        setEditingId(req.id)
                        setEditAmount(req.amount)
                        setEditCalcAmount(req.calculatedAmount || req.amount)
                      } else {
                        handleAction(req.id, 'approved')
                      }
                    }}>
                      <CheckCircle2 className="w-4 h-4 ms-2" />
                      تایید
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10" onClick={() => handleAction(req.id, 'rejected')}>
                      <XCircle className="w-4 h-4 ms-2" />
                      رد
                    </Button>
                  </div>
                )}
                
                {editingId === req.id && (
                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 bg-muted p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-1">تایید با مقادیر محاسباتی</div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-24">مقدار درخواستی:</label>
                      <input type="number" className="border p-1 rounded w-20 text-sm" value={editAmount} onChange={e => setEditAmount(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs w-24">مقدار نهایی:</label>
                      <input type="number" className="border p-1 rounded w-20 text-sm" value={editCalcAmount} onChange={e => setEditCalcAmount(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="default" className="flex-1 bg-success hover:bg-success/90" onClick={() => handleAction(req.id, 'approved', Number(editAmount) || undefined, Number(editCalcAmount) || undefined)}>
                        ثبت و تایید
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => setEditingId(null)}>انصراف</Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
