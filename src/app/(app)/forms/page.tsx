'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toFa, jalali, faTime } from '@/lib/fa'
import { FileText, Plus, RefreshCw, Printer, AlertTriangle, XCircle, Eye, CornerUpLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Submission {
  id: string
  submissionNo: number
  status: string
  currentStage: string | null
  createdAt: string
  closedAt: string | null
  amount: number | null
  template: { title: true; key: true }
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال شده',
  in_review: 'در حال بررسی',
  needs_changes: 'نیاز به اصلاح',
  approved: 'تایید نهایی',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  in_review: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  needs_changes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse',
  approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  cancelled: 'bg-zinc-700/10 text-zinc-500 border border-zinc-700/20',
}

export default function PersonnelFormsPage() {
  const { accessToken } = useAuthStore()
  const [templates, setTemplates] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Details Modal
  const [selectedSub, setSelectedSub] = useState<any | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Edit Resubmit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [resubmitting, setResubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // ۱. بارگذاری قالب‌ها
      const tRes = await fetch('/api/forms', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (tRes.ok) {
        const tJson = await tRes.json()
        setTemplates(tJson.data || [])
      }

      // ۲. بارگذاری درخواست‌های من
      const sRes = await fetch('/api/forms/submissions/my', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (sRes.ok) {
        const sJson = await sRes.json()
        setSubmissions(sJson.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelSubmission(id: string) {
    if (!confirm('آیا از لغو این درخواست اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/forms/submissions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        alert('درخواست شما با موفقیت لغو گردید.')
        loadData()
      } else {
        const err = await res.json()
        alert(err.error || 'عملیات لغو ناموفق بود.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleViewDetails(id: string) {
    setLoadingDetails(true)
    setShowDetailModal(true)
    try {
      const res = await fetch(`/api/forms/submissions/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSelectedSub(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleResubmit() {
    if (!selectedSub) return
    setResubmitting(true)
    try {
      const res = await fetch(`/api/forms/submissions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ data: editData }),
      })
      if (res.ok) {
        alert('درخواست اصلاح‌شده شما با موفقیت مجدداً ارسال گردید.')
        setShowEditModal(false)
        setShowDetailModal(false)
        loadData()
      } else {
        const json = await res.json()
        if (json.validationErrors) {
          alert('لطفا مقادیر ورودی را بررسی نمایید:\n' + Object.values(json.validationErrors).join('\n'))
        } else {
          alert(json.error || 'خطا در ثبت نهایی')
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setResubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-red-500" />
            فرم‌ها و درخواست‌های پرسنلی
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            ارسال فرم‌های دیجیتال اضافه کار، مرخصی، مأموریت و پیگیری زنده وضعیت تاییدات آن‌ها
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="h-8 text-xs cursor-pointer">
          <RefreshCw className="size-3.5 me-1" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Templates Gallery */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground">ثبت درخواست جدید</h3>
        {loading ? (
          <span className="text-xs text-foreground-muted">در حال بارگذاری فرم‌ها...</span>
        ) : templates.length === 0 ? (
          <div className="text-center py-6 bg-surface border border-border rounded-xl">
            <span className="text-xs text-foreground-muted">هیچ فرم فعالی در دسترسی نقش کاربری شما یافت نشد.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((form) => (
              <Link href={`/forms/${form.key}/submit`} key={form.id}>
                <Card className="border-border bg-surface hover:border-red-500/30 transition-all cursor-pointer h-full flex flex-col justify-between">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-xs font-bold text-foreground block">{form.title}</span>
                    <p className="text-[10px] text-foreground-muted leading-relaxed">{form.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="space-y-3 mt-4">
        <h3 className="text-xs font-bold text-foreground">تاریخچه درخواست‌های من</h3>
        {loading ? (
          <span className="text-xs text-foreground-muted">در حال بارگذاری درخواست‌ها...</span>
        ) : submissions.length === 0 ? (
          <div className="text-center py-10 bg-surface border border-border rounded-xl">
            <span className="text-xs text-foreground-muted">تاکنون درخواستی ثبت نکرده‌اید.</span>
          </div>
        ) : (
          <Card className="border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow className="text-xs font-bold text-foreground-muted">
                  <TableHead className="text-right">شماره درخواست</TableHead>
                  <TableHead className="text-right">عنوان فرم</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">مرحله فعلی</TableHead>
                  <TableHead className="text-right">تاریخ ثبت</TableHead>
                  <TableHead className="text-left">اقدامات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id} className="text-xs">
                    <TableCell className="font-mono font-bold">R-{sub.submissionNo}</TableCell>
                    <TableCell className="font-bold">{sub.template.title}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_CLASSES[sub.status]}>{STATUS_LABELS[sub.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-foreground-muted">
                      {sub.currentStage ? 'در انتظار تایید' : '-'}
                    </TableCell>
                    <TableCell className="text-foreground-muted">
                      {jalali(sub.createdAt)}
                    </TableCell>
                    <TableCell className="text-left flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(sub.id)}
                        className="h-7 text-[10px] font-bold cursor-pointer"
                      >
                        <Eye className="size-3.5 me-0.5" />
                        مشاهده روند
                      </Button>
                      
                      {(sub.status === 'submitted' || sub.status === 'in_review') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelSubmission(sub.id)}
                          className="h-7 text-[10px] font-bold border-critical/20 text-critical hover:bg-critical/10 cursor-pointer"
                        >
                          <XCircle className="size-3.5 me-0.5" />
                          لغو درخواست
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Details Timeline Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          {loadingDetails ? (
            <div className="p-10 text-center text-xs text-foreground-muted animate-pulse">در حال بارگذاری جزئیات درخواست...</div>
          ) : selectedSub && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground flex items-center gap-2">
                  درخواست R-{selectedSub.submissionNo} ({selectedSub.template.title})
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">جزئیات داده‌ها و تایم‌لاین مراحل تایید در گردش‌کار</DialogDescription>
              </DialogHeader>

              {/* Form Data */}
              <div className="space-y-2 border-b border-border/40 pb-4">
                <span className="text-xs font-bold text-foreground">پاسخ‌های ثبت شده:</span>
                <div className="grid grid-cols-1 gap-2 bg-background/50 p-3 rounded-lg border border-border/40 text-xs">
                  {selectedSub.version.schema.fields.map((f: any) => (
                    <div key={f.name} className="flex justify-between border-b border-border/20 py-1.5">
                      <span className="text-foreground-muted">{f.label}:</span>
                      <span className="font-bold text-foreground">
                        {selectedSub.data[f.name] === true ? 'بله' : selectedSub.data[f.name] === false ? 'خیر' : String(selectedSub.data[f.name] ?? '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3 pb-4">
                <span className="text-xs font-bold text-foreground">تایم‌لاین گردش‌کار و امضاها:</span>
                <div className="relative border-s border-zinc-800 ms-2 space-y-4">
                  {selectedSub.steps.map((step: any) => (
                    <div key={step.id} className="relative ps-5">
                      <span className={`absolute -start-[5px] top-1.5 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
                        step.decision === 'approve' ? 'bg-green-500' :
                        step.decision === 'reject' ? 'bg-red-500' :
                        step.decision === 'request_changes' ? 'bg-amber-500' : 'bg-zinc-700'
                      }`} />
                      <div className="text-xs flex justify-between">
                        <span className="font-bold text-foreground">{step.stageTitle}</span>
                        <span className="text-[10px] text-foreground-muted">{step.decidedAt ? jalali(step.decidedAt) : 'در انتظار اقدام'}</span>
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        بررسی‌کننده: {step.decidedBy?.name || step.assigneeId}
                      </div>
                      {step.note && (
                        <p className="text-[11px] text-foreground-muted bg-zinc-900 border border-zinc-800 p-2 rounded mt-1">{step.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button
                  onClick={() => window.open(`/api/forms/submissions/${selectedSub.id}/print`)}
                  variant="outline"
                  className="text-xs h-8 gap-1 cursor-pointer"
                >
                  <Printer className="size-4" />
                  چاپ رسمی
                </Button>
                
                {selectedSub.status === 'needs_changes' && (
                  <Button
                    onClick={() => {
                      setEditData(selectedSub.data)
                      setShowEditModal(true)
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8 font-semibold gap-1 cursor-pointer"
                  >
                    <CornerUpLeft className="size-4" />
                    اصلاح و ارسال مجدد
                  </Button>
                )}
                
                <Button variant="ghost" onClick={() => setShowDetailModal(false)} className="text-xs h-8 cursor-pointer">
                  بستن پنجره
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Form Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          {selectedSub && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground">اصلاح و تکمیل مجدد درخواست</DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">مقادیر فیلدها را اصلاح کرده و دکمه ارسال مجدد را بزنید.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs py-2">
                {selectedSub.version.schema.fields.map((f: any) => {
                  if (f.type === 'formula') return null; // فرمول اتوماتیک محاسبه می‌شود
                  
                  return (
                    <div key={f.name} className="space-y-1">
                      <label className="font-semibold text-foreground">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                      
                      {f.type === 'textarea' ? (
                        <Textarea
                          value={editData[f.name] ?? ''}
                          onChange={(e) => setEditData({ ...editData, [f.name]: e.target.value })}
                          className="min-h-16 text-xs"
                        />
                      ) : f.type === 'select' ? (
                        <Select
                          value={editData[f.name] ?? ''}
                          onValueChange={(val) => setEditData({ ...editData, [f.name]: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="انتخاب کنید..." />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options.map((opt: string) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={editData[f.name] ?? ''}
                          onChange={(e) => setEditData({ ...editData, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-xs h-8 cursor-pointer">انصراف</Button>
                <Button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-8 cursor-pointer"
                >
                  {resubmitting ? 'در حال ارسال...' : 'ارسال مجدد درخواست'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
