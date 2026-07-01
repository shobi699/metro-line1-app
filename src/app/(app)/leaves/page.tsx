'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import { Calendar, CheckCircle2, Clock, FileText, UserCheck, AlertCircle, Upload, Check, X } from 'lucide-react'

interface LeaveRequest {
  id: string
  type: 'daily' | 'hourly' | 'sick' | 'mission'
  startDate: string
  endDate: string
  duration: string
  colleagueName: string
  colleagueApproved: 'pending' | 'approved' | 'rejected'
  managerApproved: 'pending' | 'approved' | 'rejected'
  description: string
  hasAttachment: boolean
  requesterName: string
}

export default function LeavesPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roleKey === 'super_admin' || user?.roleKey === 'admin'

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [activeTab, setActiveTab] = useState<'my-requests' | 'new-request' | 'replacements' | 'manager-approvals'>('my-requests')

  // Leave Form States
  const [type, setType] = useState<'daily' | 'hourly' | 'sick' | 'mission'>('daily')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState('')
  const [colleagueName, setColleagueName] = useState('')
  const [description, setDescription] = useState('')
  const [hasAttachment, setHasAttachment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const defaultRequests: LeaveRequest[] = [
    {
      id: 'lv-1',
      type: 'daily',
      startDate: '۱۴۰۵/۰۴/۱۵',
      endDate: '۱۴۰۵/۰۴/۱۷',
      duration: '۳ روز',
      colleagueName: 'محمد احمدی (راهبر خط ۱)',
      colleagueApproved: 'approved',
      managerApproved: 'approved',
      description: 'مرخصی سالانه جهت امور شخصی خانوادگی.',
      hasAttachment: false,
      requesterName: 'سهراب مرادی'
    },
    {
      id: 'lv-2',
      type: 'sick',
      startDate: '۱۴۰۵/۰۴/۰۲',
      endDate: '۱۴۰۵/۰۴/۰۳',
      duration: '۱ روز',
      colleagueName: 'جواد رضایی (راهبر خط ۱)',
      colleagueApproved: 'approved',
      managerApproved: 'approved',
      description: 'مرخصی استعلاجی به علت بیماری آنفولانزا با دستور پزشک.',
      hasAttachment: true,
      requesterName: 'سهراب مرادی'
    },
    {
      id: 'lv-3',
      type: 'daily',
      startDate: '۱۴۰۵/۰۵/۱۰',
      endDate: '۱۴۰۵/۰۵/۱۲',
      duration: '۲ روز',
      colleagueName: 'حمید ابراهیمی (راهبر خط ۱)',
      colleagueApproved: 'pending',
      managerApproved: 'pending',
      description: 'مرخصی به علت سفر شخصی.',
      hasAttachment: false,
      requesterName: 'سهراب مرادی'
    }
  ]

  // Colleagues awaiting replacement approval from the active user
  const [replacementReqs, setReplacementReqs] = useState<LeaveRequest[]>([
    {
      id: 'lv-mock-4',
      type: 'daily',
      startDate: '۱۴۰۵/۰۵/۰۵',
      endDate: '۱۴۰۵/۰۵/۰۶',
      duration: '۱ روز',
      colleagueName: 'سهراب مرادی',
      colleagueApproved: 'pending',
      managerApproved: 'pending',
      description: 'درخواست جانشینی شیفت صبح توسط رضا عباسی.',
      hasAttachment: false,
      requesterName: 'رضا عباسی (راهبر خط ۱)'
    }
  ])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_leave_requests')
      if (saved) setRequests(JSON.parse(saved))
      else {
        setRequests(defaultRequests)
        window.localStorage.setItem('metro_leave_requests', JSON.stringify(defaultRequests))
      }
    }
  }, [])

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate.trim() || !colleagueName.trim()) {
      alert('تاریخ و همکار جانشین الزامی است.')
      return
    }
    setSubmitting(true)

    const newReq: LeaveRequest = {
      id: `lv-${Date.now()}`,
      type,
      startDate,
      endDate: endDate || startDate,
      duration: duration || '۱ روز',
      colleagueName,
      colleagueApproved: 'pending',
      managerApproved: 'pending',
      description,
      hasAttachment,
      requesterName: user?.name || 'راهبر سیستم'
    }

    const updated = [newReq, ...requests]
    setRequests(updated)
    window.localStorage.setItem('metro_leave_requests', JSON.stringify(updated))

    setTimeout(() => {
      setSuccessMsg('درخواست مرخصی شما با موفقیت ثبت شد و جهت تأیید جانشینی برای همکار انتخاب‌شده ارسال گردید.')
      setSubmitting(false)
      setStartDate('')
      setEndDate('')
      setDuration('')
      setColleagueName('')
      setDescription('')
      setHasAttachment(false)
      setTimeout(() => {
        setSuccessMsg('')
        setActiveTab('my-requests')
      }, 2000)
    }, 1000)
  }

  const handleReplacementConfirm = (id: string, approve: boolean) => {
    const updated = replacementReqs.map(req => {
      if (req.id === id) {
        return { ...req, colleagueApproved: approve ? 'approved' as const : 'rejected' as const }
      }
      return req
    })
    setReplacementReqs(updated)
    // If approved, sync to general requests for managers to review
    if (approve) {
      const approvedReq = replacementReqs.find(req => req.id === id)
      if (approvedReq) {
        const syncedReq: LeaveRequest = {
          ...approvedReq,
          colleagueApproved: 'approved',
        }
        const updatedAll = [syncedReq, ...requests]
        setRequests(updatedAll)
        window.localStorage.setItem('metro_leave_requests', JSON.stringify(updatedAll))
      }
    }
    // Remove from the pending replacement list
    setReplacementReqs(replacementReqs.filter(r => r.id !== id))
  }

  const handleManagerConfirm = (id: string, approve: boolean) => {
    const updated = requests.map(req => {
      if (req.id === id) {
        return { ...req, managerApproved: approve ? 'approved' as const : 'rejected' as const }
      }
      return req
    })
    setRequests(updated)
    window.localStorage.setItem('metro_leave_requests', JSON.stringify(updated))
  }

  const getStatusBadge = (colleague: string, manager: string) => {
    if (colleague === 'pending') return { label: 'منتظر تأیید جانشین', color: 'bg-warning/10 text-warning border-warning/30' }
    if (colleague === 'rejected') return { label: 'رد توسط جانشین', color: 'bg-critical/10 text-critical border-critical/30' }
    if (manager === 'pending') return { label: 'منتظر تأیید مدیریت', color: 'bg-info/10 text-info border-info/30' }
    if (manager === 'rejected') return { label: 'رد شده توسط مدیریت', color: 'bg-critical/10 text-critical border-critical/30' }
    return { label: 'تأیید نهایی شده', color: 'bg-success/10 text-success border-success/30' }
  }

  const getLeaveTypeLabel = (t: string) => {
    switch (t) {
      case 'daily': return 'مرخصی روزانه'
      case 'hourly': return 'مرخصی ساعتی'
      case 'sick': return 'مرخصی استعلاجی'
      case 'mission': return 'مأموریت کاری'
      default: return t
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Calendar className="size-6 text-accent" />
          مدیریت مرخصی و مأموریت‌ها
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          ثبت درخواست‌های مرخصی و مأموریت، تعیین همکار جانشین و پایش وضعیت مانده بودجه مرخصی
        </p>
      </div>

      {/* Leave Balance Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-foreground-muted font-bold block">مرخصی استحقاقی مانده</span>
              <span className="text-xl font-black text-foreground">{toFa(14)} روز</span>
            </div>
            <Calendar className="size-7 text-accent" />
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-container-low">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-foreground-muted font-bold block">مرخصی استعلاجی مصرف شده</span>
              <span className="text-xl font-black text-foreground">{toFa(3)} روز</span>
            </div>
            <AlertCircle className="size-7 text-warning" />
          </CardContent>
        </Card>
        <Card className="border-border bg-surface-container-low">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-foreground-muted font-bold block">مأموریت‌های اداری فصل</span>
              <span className="text-xl font-black text-foreground">{toFa(5)} مورد</span>
            </div>
            <Clock className="size-7 text-success" />
          </CardContent>
        </Card>
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
          درخواست مرخصی/مأموریت جدید
        </button>
        <button
          onClick={() => setActiveTab('replacements')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer relative ${
            activeTab === 'replacements'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          کارتابل جانشینی
          {replacementReqs.length > 0 && (
            <span className="absolute top-1.5 left-0 size-1.5 rounded-full bg-accent" />
          )}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('manager-approvals')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manager-approvals'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            کارتابل تاییدات مدیریت
          </button>
        )}
      </div>

      {/* MY REQUESTS TAB */}
      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {requests.map((req) => {
            const badgeCfg = getStatusBadge(req.colleagueApproved, req.managerApproved)
            return (
              <Card key={req.id} className="border-accent/10">
                <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">{getLeaveTypeLabel(req.type)}</span>
                      <Badge variant="outline" className={`text-[9px] border px-1.5 py-0.5 rounded ${badgeCfg.color}`}>
                        {badgeCfg.label}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-foreground-muted space-y-1">
                      <p>مدت زمان: <strong className="text-foreground">{req.duration}</strong> از تاریخ {toFa(req.startDate)} الی {toFa(req.endDate)}</p>
                      <p>همکار جانشین: <strong className="text-foreground">{req.colleagueName}</strong></p>
                      <p>شرح: {req.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* NEW REQUEST FORM */}
      {activeTab === 'new-request' && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold">فرم ثبت درخواست جدید</CardTitle>
            <CardDescription>جزئیات مرخصی یا ماموریت خود را در کادرهای زیر وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leave-type" className="font-bold">نوع درخواست</Label>
                  <select
                    id="leave-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="daily">مرخصی استحقاقی روزانه</option>
                    <option value="hourly">مرخصی ساعتی</option>
                    <option value="sick">مرخصی استعلاجی (نیازمند پیوست)</option>
                    <option value="mission">مأموریت کاری اداری</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="colleague" className="font-bold">انتخاب همکار جانشین <span className="text-critical">*</span></Label>
                  <Input
                    id="colleague"
                    value={colleagueName}
                    onChange={(e) => setColleagueName(e.target.value)}
                    placeholder="مثال: رضا کریمی (راهبر خط ۱)"
                    className="mt-1.5 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-date" className="font-bold">تاریخ شروع</Label>
                  <Input
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۵/۰۵/۱۰"
                    className="mt-1.5 h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="font-bold">تاریخ خاتمه</Label>
                  <Input
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۵/۰۵/۱۲"
                    className="mt-1.5 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="font-bold">مدت زمان کل (روز یا ساعت)</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="مثال: ۲ روز یا ۴ ساعت"
                    className="mt-1.5 h-9 text-xs"
                  />
                </div>
              </div>

              {type === 'sick' && (
                <div className="p-3 border border-dashed border-border/60 rounded-lg flex items-center justify-between">
                  <span className="text-[10px] text-foreground-muted">بارگذاری تصویر گواهی استعلاجی پزشک</span>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-border rounded cursor-pointer hover:bg-neutral-800 transition-all">
                    <Upload className="size-3.5 text-accent" />
                    <span>انتخاب فایل</span>
                    <input type="checkbox" checked={hasAttachment} onChange={(e) => setHasAttachment(e.target.checked)} className="hidden" />
                  </label>
                </div>
              )}

              <div>
                <Label htmlFor="desc" className="font-bold">شرح درخواست و ضرورت</Label>
                <textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="دلایل ضرورت ثبت مرخصی یا مأموریت..."
                  rows={4}
                  className="mt-1.5 flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting} className="font-bold text-xs h-8">
                  {submitting ? 'در حال ثبت...' : 'ارسال درخواست جهت تایید'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* REPLACEMENTS TAB */}
      {activeTab === 'replacements' && (
        <div className="space-y-4">
          {replacementReqs.length === 0 ? (
            <Card className="border-dashed border-border bg-surface-container-low/10">
              <CardContent className="py-12 text-center text-xs text-foreground-muted">
                هیچ درخواست جانشینی برای شما ارسال نشده است.
              </CardContent>
            </Card>
          ) : (
            replacementReqs.map((req) => (
              <Card key={req.id} className="border-warning/30 bg-warning/5">
                <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-foreground">
                      درخواست جانشینی توسط: {req.requesterName}
                    </span>
                    <p className="text-[10px] text-foreground-muted">
                      نوع مرخصی: {getLeaveTypeLabel(req.type)} | تاریخ: {toFa(req.startDate)} الی {toFa(req.endDate)} ({req.duration})
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReplacementConfirm(req.id, false)}
                      className="h-7 text-[10px] font-bold bg-critical hover:bg-critical/90 text-white cursor-pointer"
                    >
                      <X className="size-3.5 me-0.5" />
                      رد جانشینی
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReplacementConfirm(req.id, true)}
                      className="h-7 text-[10px] font-bold bg-success hover:bg-success/90 text-white cursor-pointer"
                    >
                      <Check className="size-3.5 me-0.5" />
                      تأیید جانشینی
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MANAGER APPROVALS */}
      {activeTab === 'manager-approvals' && (
        <div className="space-y-4">
          {requests.filter(r => r.colleagueApproved === 'approved' && r.managerApproved === 'pending').length === 0 ? (
            <Card className="border-dashed border-border bg-surface-container-low/10">
              <CardContent className="py-12 text-center text-xs text-foreground-muted">
                در حال حاضر هیچ درخواست تأیید شده توسط جانشینی در کارتابل مدیریت شما وجود ندارد.
              </CardContent>
            </Card>
          ) : (
            requests.filter(r => r.colleagueApproved === 'approved' && r.managerApproved === 'pending').map((req) => (
              <Card key={req.id} className="border-accent/20">
                <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground">{req.requesterName}</span>
                      <Badge variant="outline" className="text-[9px] bg-accent/5 text-accent">{getLeaveTypeLabel(req.type)}</Badge>
                    </div>
                    <p className="text-[10px] text-foreground-muted leading-relaxed">
                      مدت: {req.duration} ({toFa(req.startDate)} الی {toFa(req.endDate)}) | جانشین: {req.colleagueName}
                    </p>
                    <p className="text-[10px] text-foreground-muted">توضیح: {req.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleManagerConfirm(req.id, false)}
                      className="h-7 text-[10px] font-bold bg-critical hover:bg-critical/90 text-white cursor-pointer"
                    >
                      مخالفت مدیر
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleManagerConfirm(req.id, true)}
                      className="h-7 text-[10px] font-bold bg-success hover:bg-success/90 text-white cursor-pointer"
                    >
                      تأیید نهایی
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
