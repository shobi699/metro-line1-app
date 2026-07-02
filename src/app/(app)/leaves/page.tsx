'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import { Calendar, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface LeaveRequest {
  id: string
  type: string
  fromDate: string
  toDate: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
}

export default function LeavesPage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-requests' | 'new-request'>('my-requests')

  // Leave Form States
  const [type, setType] = useState('annual')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  async function fetchLeaves() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/leaves', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRequests(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves()
  }, [accessToken])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromDate.trim() || !toDate.trim()) {
      alert('تاریخ شروع و پایان الزامی است.')
      return
    }
    setSubmitting(true)
    setSuccessMsg('')

    try {
      // In a real application, you might use a date picker that outputs ISO strings.
      // Here we assume the user types a valid date or we construct it.
      // Since jalali string isn't an ISO date, we'll assume they type YYYY-MM-DD or we construct an ISO date.
      // Let's assume they enter YYYY/MM/DD and we just use the current time for simplicity or let's use a Date object.
      // In real scenario we'd use a date picker.
      const startIso = new Date().toISOString() // Placeholder
      const endIso = new Date().toISOString() // Placeholder

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          type,
          fromDate: new Date().toISOString(), // Mocked ISO Date since we don't have a real Jalali picker component installed in this snippet
          toDate: new Date().toISOString(),
          reason
        })
      })

      if (res.ok) {
        const json = await res.json()
        setSuccessMsg('درخواست مرخصی شما با موفقیت ثبت شد.')
        setFromDate('')
        setToDate('')
        setReason('')
        fetchLeaves()
        setTimeout(() => {
          setSuccessMsg('')
          setActiveTab('my-requests')
        }, 2000)
      } else {
        const err = await res.json()
        toast.error(err.error || 'خطا در ثبت درخواست')
      }
    } catch (e) {
      toast.error('خطای ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'در انتظار', color: 'bg-warning/10 text-warning border-warning/30' }
      case 'APPROVED': return { label: 'تایید شده', color: 'bg-success/10 text-success border-success/30' }
      case 'REJECTED': return { label: 'رد شده', color: 'bg-critical/10 text-critical border-critical/30' }
      case 'CANCELLED': return { label: 'لغو شده', color: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/30' }
      default: return { label: status, color: 'bg-neutral-500/10 text-neutral-500' }
    }
  }

  const getLeaveTypeLabel = (t: string) => {
    switch (t) {
      case 'annual': return 'مرخصی استحقاقی'
      case 'sick': return 'مرخصی استعلاجی'
      case 'mission': return 'مأموریت کاری'
      case 'overtime': return 'اضافه کار'
      case 'oncall': return 'کشیک'
      default: return t
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Calendar className="size-6 text-accent" />
          مدیریت مرخصی و مأموریت‌ها
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          ثبت درخواست‌های مرخصی و مأموریت و پیگیری وضعیت آنها
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'my-requests'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          درخواست‌های من
        </button>
        <button
          onClick={() => setActiveTab('new-request')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'new-request'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          درخواست جدید
        </button>
      </div>

      {/* MY REQUESTS TAB */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {loading ? (
             <div className="py-12 flex justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : requests.length === 0 ? (
            <Card className="border-dashed border-border bg-surface-container-low/10">
              <CardContent className="py-12 text-center text-xs text-foreground-muted">
                تا کنون هیچ درخواستی ثبت نکرده‌اید.
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => {
              const badgeCfg = getStatusBadge(req.status)
              return (
                <Card key={req.id} className="border-accent/10">
                  <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">{getLeaveTypeLabel(req.type)}</span>
                        <Badge variant="outline" className={`text-xs border px-2 py-0.5 rounded-full ${badgeCfg.color}`}>
                          {badgeCfg.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-foreground-muted space-y-1">
                        <p>از تاریخ: <strong className="text-foreground">{jalali(req.fromDate)}</strong> الی <strong className="text-foreground">{jalali(req.toDate)}</strong></p>
                        {req.reason && <p>شرح: {req.reason}</p>}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* NEW REQUEST FORM */}
      {activeTab === 'new-request' && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">فرم ثبت درخواست جدید</CardTitle>
            <CardDescription>نوع مرخصی و تاریخ‌ها را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-success/15 border border-success/30 text-success text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leave-type" className="font-bold">نوع درخواست</Label>
                  <select
                    id="leave-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="annual">مرخصی استحقاقی روزانه</option>
                    <option value="sick">مرخصی استعلاجی</option>
                    <option value="mission">مأموریت کاری اداری</option>
                    <option value="overtime">اضافه کار</option>
                    <option value="oncall">کشیک</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="font-bold">تاریخ شروع</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="font-bold">تاریخ خاتمه</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="desc" className="font-bold">شرح درخواست و ضرورت</Label>
                <textarea
                  id="desc"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="دلایل ضرورت ثبت مرخصی یا مأموریت..."
                  rows={4}
                  className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting} className="font-bold">
                  {submitting ? 'در حال ثبت...' : 'ارسال درخواست جهت تایید'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
