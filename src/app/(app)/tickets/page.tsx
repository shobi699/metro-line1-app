'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali, faTime } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ImageUploader } from '@/components/shared/image-uploader'

interface UserRef {
  id: string
  name: string
}

interface FaultReport {
  id: string
  faultNo: number
  trainId: string
  wagonId: string | null
  faultCodeId: string
  status: string
  priority: string
  reporterId: string
  reviewerId: string | null
  assigneeId: string | null
  verifierId: string | null
  description: string
  locationNote: string | null
  occurredAt: string
  serviceImpact: string
  photoUrls: string | null
  annotations: string | null
  slaDueAt: string
  slaBreached: boolean
  createdAt: string
  train: { trainNumber: string; fleetSeries: string }
  wagon: { wagonCode: string; position: number } | null
  faultCode: { code: string; title: string; category: { title: string }; operatorGuide: string | null; safetyCritical: boolean }
  reporter: UserRef
  assignee: UserRef | null
  reviewer: UserRef | null
  verifier: UserRef | null
  recurrenceOfId: string | null
  _count: { logs: number }
}

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

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  medium: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse',
}

const IMPACT_LABELS: Record<string, string> = {
  none: 'بدون اثر',
  delay: 'تاخیر در حرکت',
  evacuated: 'تخلیه مسافر',
  removed_from_service: 'خروج از سرویس',
}

export default function TicketsPage() {
  const { accessToken, user } = useAuthStore()
  const isSupervisorOrAbove = user?.roleKey === 'super_admin' || user?.roleKey === 'admin' || user?.roleKey === 'manager' || user?.roleKey === 'supervisor'
  const [reports, setReports] = useState<FaultReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTrain, setFilterTrain] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [queueMode, setQueueMode] = useState<'my' | 'all'>('all')

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardTrains, setWizardTrains] = useState<any[]>([])
  const [selectedTrain, setSelectedTrain] = useState<string>('')
  const [selectedWagon, setSelectedWagon] = useState<string>('')
  const [wizardWagons, setWizardWagons] = useState<any[]>([])
  const [nlpText, setNlpText] = useState('')
  const [matchingResults, setMatchingResults] = useState<any[]>([])
  const [selectedFaultCodeId, setSelectedFaultCodeId] = useState('')
  const [faultLocation, setFaultLocation] = useState('')
  const [faultDesc, setFaultDesc] = useState('')
  const [serviceImpact, setServiceImpact] = useState('none')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [faultPhoto, setFaultPhoto] = useState<string>('')
  const [nlpMatching, setNlpMatching] = useState(false)

  // Dialog Action states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [repairDialogOpen, setRepairDialogOpen] = useState(false)
  const [deferDialogOpen, setDeferDialogOpen] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [activeReport, setActiveReport] = useState<FaultReport | null>(null)

  // Actions payloads
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'needs_info'>('approve')
  const [reviewNote, setReviewNote] = useState('')
  const [reviewPriority, setReviewPriority] = useState<string>('')
  const [reviewAssignee, setReviewAssignee] = useState<string>('')
  const [usersList, setUsersList] = useState<any[]>([])

  const [actionsTaken, setActionsTaken] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [partsUsed, setPartsUsed] = useState<{ name: string; qty: number }[]>([])
  const [newPartName, setNewPartName] = useState('')
  const [newPartQty, setNewPartQty] = useState(1)

  const [deferReason, setDeferReason] = useState('')
  const [deferUntil, setDeferUntil] = useState('')

  const [reopenReason, setReopenReason] = useState('')

  // Excel Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadReports()
    loadWizardTrains()
    loadUsersList()
  }, [filterStatus, filterPriority, filterTrain, queueMode, searchQuery])

  async function loadReports() {
    setLoading(true)
    try {
      const endpoint = queueMode === 'my' ? '/api/faults/my-queue' : '/api/faults'
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterPriority && filterPriority !== 'all') params.append('priority', filterPriority)
      if (filterTrain && filterTrain !== 'all') params.append('trainId', filterTrain)
      if (searchQuery) params.append('q', searchQuery)

      const url = `${endpoint}?${params.toString()}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setReports(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadWizardTrains() {
    try {
      const res = await fetch('/api/fleet/trains', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setWizardTrains(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadUsersList() {
    try {
      const res = await fetch('/api/directory', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setUsersList(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Wagon layouts on train select
  useEffect(() => {
    if (selectedTrain) {
      const t = wizardTrains.find((x) => x.id === selectedTrain)
      if (t) {
        setWizardWagons(t.wagons || [])
      }
    } else {
      setWizardWagons([])
    }
    setSelectedWagon('')
  }, [selectedTrain, wizardTrains])

  // NLP matcher triggering
  async function triggerNlpMatch() {
    if (!nlpText.trim()) return
    setNlpMatching(true)
    try {
      const res = await fetch('/api/fault-catalog/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: nlpText }),
      })
      if (res.ok) {
        const json = await res.json()
        setMatchingResults(json.data)
        if (json.data && json.data.length > 0) {
          setSelectedFaultCodeId(json.data[0].faultCodeId)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setNlpMatching(false)
    }
  }

  // Save fault creation
  async function submitNewFault() {
    if (!selectedTrain || !selectedFaultCodeId || !faultDesc.trim()) return
    try {
      const res = await fetch('/api/faults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trainId: selectedTrain,
          wagonId: selectedWagon || null,
          faultCodeId: selectedFaultCodeId,
          description: faultDesc.trim(),
          locationNote: faultLocation || null,
          occurredAt: new Date().toISOString(),
          serviceImpact,
          priority,
          photoUrls: faultPhoto ? [faultPhoto] : [],
        }),
      })

      if (res.ok) {
        setWizardOpen(false)
        resetWizard()
        loadReports()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت فالت')
      }
    } catch (err) {
      console.error(err)
    }
  }

  function resetWizard() {
    setWizardStep(1)
    setSelectedTrain('')
    setSelectedWagon('')
    setNlpText('')
    setMatchingResults([])
    setSelectedFaultCodeId('')
    setFaultLocation('')
    setFaultDesc('')
    setServiceImpact('none')
    setPriority('medium')
    setFaultPhoto('')
  }

  // Workflows action execution
  async function handleTransitionSubmit(action: string, payload?: any) {
    if (!activeReport) return
    try {
      const res = await fetch(`/api/faults/${activeReport.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
          payload,
        }),
      })

      if (res.ok) {
        setReviewDialogOpen(false)
        setRepairDialogOpen(false)
        setDeferDialogOpen(false)
        setReopenDialogOpen(false)
        loadReports()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در تغییر وضعیت گردشکار')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Add Part helper
  function addPart() {
    if (!newPartName.trim() || newPartQty <= 0) return
    setPartsUsed([...partsUsed, { name: newPartName.trim(), qty: newPartQty }])
    setNewPartName('')
    setNewPartQty(1)
  }

  // Excel handlers
  async function handleImportValidate() {
    if (!importFile) return
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/faults/import?mode=validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setImportPreview(json.data)
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در بررسی فایل')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  async function handleImportCommit() {
    if (!importPreview || importPreview.validRows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/faults/import?mode=commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          validRows: importPreview.validRows,
          batchId: importPreview.batchId,
        }),
      })
      if (res.ok) {
        alert('بارگذاری اکسل با موفقیت انجام شد')
        setImportDialogOpen(false)
        setImportFile(null)
        setImportPreview(null)
        loadReports()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ایمپورت نهایی')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
            سامانه مدیریت فالت قطارها (خرابی ناوگان)
          </h1>
          <p className="text-sm text-foreground-muted">پیگیری چرخه عمر خرابی‌ها، بازبینی فنی، اقدامات نگهداری و تایید کیفی</p>
        </div>
        <div className="flex items-center gap-3">
          {isSupervisorOrAbove && (
            <>
              <Button onClick={() => window.open('/api/fault-reports/export?type=all', '_blank')} variant="outline" className="text-xs border-zinc-800 hover:bg-zinc-800">
                خروجی اکسل
              </Button>
              <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="text-xs border-zinc-800 hover:bg-zinc-800">
                وارد کردن اکسل
              </Button>
            </>
          )}
          <Button onClick={() => setWizardOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
            + ثبت فالت جدید
          </Button>
        </div>
      </div>

      {/* Queue selection and filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Button
            variant={queueMode === 'all' ? 'default' : 'outline'}
            className="text-xs h-9"
            onClick={() => setQueueMode('all')}
          >
            همه فالت‌ها
          </Button>
          <Button
            variant={queueMode === 'my' ? 'default' : 'outline'}
            className="text-xs h-9"
            onClick={() => setQueueMode('my')}
          >
            صف کارهای من
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          <Input
            placeholder="جستجو در شرح فالت یا کدهای خطا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 text-xs h-9"
          />

          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || '')}>
            <SelectTrigger className="w-40 text-xs h-9">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(val) => setFilterPriority(val || '')}>
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue placeholder="اولویت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه اولویت‌ها</SelectItem>
              <SelectItem value="low">کم</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">زیاد</SelectItem>
              <SelectItem value="critical">بحرانی</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Listing */}
      {loading ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <div className="animate-pulse text-sm text-foreground-muted">در حال بارگذاری فالت‌ها...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-xl">
          <div className="text-sm text-foreground-muted">هیچ فالت خرابی یافت نشد.</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="border border-border bg-surface hover:bg-surface-hover hover:border-border-subtle transition-all shadow-none">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href={`/tickets/${report.id}`}>
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 font-mono text-xs hover:bg-red-500/20 cursor-pointer transition-all">
                          F-{report.faultNo}
                        </Badge>
                      </Link>
                      <h3 className="text-sm font-bold text-foreground">
                        قطار {toFa(report.train.trainNumber)}
                        {report.wagon && ` | واگن ${toFa(report.wagon.position)} (${report.wagon.wagonCode})`}
                      </h3>
                      <span className="text-xs text-foreground-muted font-semibold bg-background-subtle border border-border-subtle rounded px-2 py-0.5">
                        {report.faultCode.code} - {report.faultCode.title}
                      </span>
                      {report.recurrenceOfId && (
                        <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs">
                          فالت تکراری ⚠️
                        </Badge>
                      )}
                      {report.faultCode.safetyCritical && (
                        <Badge className="bg-red-600 text-white border border-red-700 text-xs font-semibold animate-pulse">
                          ایمنی‌محور 🚨
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-foreground-muted leading-relaxed max-w-4xl">
                      {report.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
                      <span>ثبت‌کننده: {report.reporter.name}</span>
                      {report.assignee && <span>ارجاع به: {report.assignee.name}</span>}
                      <span>زمان ثبت: {jalali(report.createdAt)} ساعت {faTime(report.createdAt)}</span>
                      
                      {/* SLA Warning */}
                      {report.slaDueAt && (
                        <span className={`flex items-center gap-1 ${report.slaBreached ? 'text-red-400 font-bold' : ''}`}>
                          مهلت اقدام: {jalali(report.slaDueAt)} {faTime(report.slaDueAt)}
                          {report.slaBreached && ' (نقض شده ⚠️)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_CLASSES[report.priority]}`}>
                      اولویت {PRIORITY_LABELS[report.priority]}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>

                    {/* Actions Panel */}
                    <div className="flex items-center gap-2">
                      {/* Supervisor Approval */}
                      {(report.status === 'submitted' || report.status === 'under_review') &&
                        (user?.roleKey === 'super_admin' || user?.roleKey === 'admin' || user?.roleKey === 'supervisor' || user?.roleKey === 'shift_lead') && (
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
                            onClick={() => {
                              setActiveReport(report)
                              setReviewPriority(report.priority)
                              setReviewNote('')
                              setReviewDialogOpen(true)
                            }}
                          >
                            بررسی و تایید
                          </Button>
                        )}

                      {/* Specialist start repair */}
                      {(report.status === 'approved' || report.status === 'deferred') && (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                          onClick={() => {
                            setActiveReport(report)
                            handleTransitionSubmit('start_repair')
                          }}
                        >
                          شروع تعمیر
                        </Button>
                      )}

                      {/* Specialist complete repair */}
                      {report.status === 'in_repair' && (
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
                          onClick={() => {
                            setActiveReport(report)
                            setActionsTaken('')
                            setRootCause('')
                            setPartsUsed([])
                            setRepairDialogOpen(true)
                          }}
                        >
                          ثبت تعمیرات
                        </Button>
                      )}

                      {/* Defer capability */}
                      {(report.status === 'approved' || report.status === 'in_repair') &&
                        (user?.roleKey === 'super_admin' || user?.roleKey === 'admin' || user?.roleKey === 'manager') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => {
                              setActiveReport(report)
                              setDeferReason('')
                              setDeferUntil('')
                              setDeferDialogOpen(true)
                            }}
                          >
                            ماندگار سازی
                          </Button>
                        )}

                      {/* Final close */}
                      {report.status === 'repaired' &&
                        (user?.roleKey === 'super_admin' || user?.roleKey === 'admin' || user?.roleKey === 'supervisor' || user?.roleKey === 'manager') && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            onClick={() => {
                              setActiveReport(report)
                              handleTransitionSubmit('verify')
                            }}
                          >
                            تایید نهایی و بستن
                          </Button>
                        )}

                      {/* Reopen within 30 days */}
                      {(report.status === 'verified_closed' || report.status === 'rejected') &&
                        (user?.roleKey === 'super_admin' || user?.roleKey === 'admin' || user?.roleKey === 'supervisor') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => {
                              setActiveReport(report)
                              setReopenReason('')
                              setReopenDialogOpen(true)
                            }}
                          >
                            بازگشایی مجدد
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── DIALOG 1: FAULT CREATION FORM ── */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { setWizardOpen(open); if (!open) resetWizard() }}>
        <DialogContent className="max-w-2xl bg-zinc-950 text-foreground border border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">گزارش نقص فنی ناوگان (ثبت فالت)</DialogTitle>
            <DialogDescription className="text-center text-xs text-foreground-muted">
              لطفاً مشخصات قطار، واگن، کد خطا و سایر اطلاعات فالت را وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Train Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">انتخاب قطار *</Label>
              <div className="flex flex-wrap gap-2">
                {wizardTrains.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant={selectedTrain === t.id ? 'default' : 'outline'}
                    className={cn(
                      "text-xs px-3 py-1.5 h-auto transition-all active:scale-[0.97]",
                      selectedTrain === t.id ? "bg-accent text-accent-foreground font-bold" : "hover:border-accent hover:bg-accent/10"
                    )}
                    onClick={() => setSelectedTrain(t.id)}
                  >
                    قطار {toFa(t.trainNumber)} ({t.fleetSeries || 'سری نامشخص'})
                  </Button>
                ))}
              </div>
            </div>

            {/* Wagon Selection */}
            {selectedTrain && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">انتخاب واگن (اختیاری)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={selectedWagon === '' ? 'default' : 'outline'}
                    className={cn(
                      "text-xs px-3 py-1.5 h-auto transition-all active:scale-[0.97]",
                      selectedWagon === '' ? "bg-accent text-accent-foreground font-bold" : "hover:border-accent hover:bg-accent/10"
                    )}
                    onClick={() => setSelectedWagon('')}
                  >
                    کل قطار
                  </Button>
                  {wizardWagons.map((w) => (
                    <Button
                      key={w.id}
                      type="button"
                      variant={selectedWagon === w.id ? 'default' : 'outline'}
                      className={cn(
                        "text-xs px-3 py-1.5 h-auto flex flex-col items-center justify-center transition-all active:scale-[0.97] min-w-[70px]",
                        selectedWagon === w.id ? "bg-accent text-accent-foreground font-bold" : "hover:border-accent hover:bg-accent/10"
                      )}
                      onClick={() => setSelectedWagon(w.id)}
                    >
                      <span className="font-bold">واگن {toFa(w.position)}</span>
                      <span className="text-[9px] opacity-75">{w.wagonCode}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Location */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">شرح و اثر خرابی *</Label>
                <Textarea
                  value={faultDesc}
                  onChange={(e) => {
                    setFaultDesc(e.target.value)
                    setNlpText(e.target.value)
                  }}
                  placeholder="شرح جزئیات، صدا یا علائم عیب..."
                  className="text-xs h-20 bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">موقعیت وقوع فالت</Label>
                <Input
                  value={faultLocation}
                  onChange={(e) => setFaultLocation(e.target.value)}
                  placeholder="مثال: ایستگاه طالقانی، سوزن خروجی"
                  className="text-xs bg-zinc-900 border-zinc-800 h-9"
                />
              </div>
            </div>

            {/* AI Code Matching */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={triggerNlpMatch}
                disabled={nlpMatching || !nlpText.trim()}
                className="w-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {nlpMatching ? 'در حال تحلیل هوشمند کاتالوگ...' : 'تشخیص و انطباق هوشمند کد خطا'}
              </Button>

              {matchingResults.length > 0 && (
                <div className="space-y-2 border border-border/50 p-3 rounded-lg bg-zinc-900/50">
                  <span className="text-[11px] font-bold text-foreground-muted block mb-1">کدهای پیشنهادی کاتالوگ:</span>
                  <div className="space-y-2">
                    {matchingResults.map((r) => (
                      <div
                        key={r.faultCodeId}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-all",
                          selectedFaultCodeId === r.faultCodeId
                            ? 'border-accent bg-accent/10 shadow-sm'
                            : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                        )}
                        onClick={() => {
                          setSelectedFaultCodeId(r.faultCodeId)
                          if (r.defaultPriority) {
                            setPriority(r.defaultPriority)
                          }
                        }}
                      >
                        <div>
                          <span className="font-bold text-foreground block">{r.code} - {r.title}</span>
                          {r.reason && <span className="text-[10px] text-accent block mt-0.5">{r.reason}</span>}
                        </div>
                        <Badge variant="outline" className="border-accent text-accent text-[10px] font-bold">
                          {Math.round(r.confidence || r.similarity * 100)}% تطبیق
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">اولویت گزارش فالت</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'low', label: 'کم' },
                  { key: 'medium', label: 'متوسط' },
                  { key: 'high', label: 'زیاد' },
                  { key: 'critical', label: 'بحرانی' },
                ].map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    variant={priority === p.key ? 'default' : 'outline'}
                    className={cn(
                      "text-xs py-1.5 h-auto transition-all active:scale-[0.97]",
                      priority === p.key ? "bg-accent text-accent-foreground font-bold" : "hover:border-accent hover:bg-accent/10"
                    )}
                    onClick={() => setPriority(p.key as any)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Service Impact Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">اثر بر سیر قطار</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'none', label: 'بدون اثر' },
                  { key: 'delay', label: 'تاخیر در سیر' },
                  { key: 'evacuated', label: 'تخلیه مسافر' },
                  { key: 'removed_from_service', label: 'خروج از سرویس' },
                ].map((imp) => (
                  <Button
                    key={imp.key}
                    type="button"
                    variant={serviceImpact === imp.key ? 'default' : 'outline'}
                    className={cn(
                      "text-xs py-1.5 h-auto transition-all active:scale-[0.97]",
                      serviceImpact === imp.key ? "bg-accent text-accent-foreground font-bold" : "hover:border-accent hover:bg-accent/10"
                    )}
                    onClick={() => setServiceImpact(imp.key)}
                  >
                    {imp.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Photo Attachment Uploader */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">افزودن تصویر خرابی</Label>
              <ImageUploader
                value={faultPhoto}
                onChange={setFaultPhoto}
                placeholder="تصویری از خرابی بارگذاری کنید..."
                accept="image/*"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setWizardOpen(false)
                resetWizard()
              }}
              className="text-xs"
            >
              انصراف
            </Button>
            <Button
              disabled={!selectedTrain || !selectedFaultCodeId || !faultDesc.trim()}
              onClick={submitNewFault}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold active:scale-[0.98]"
            >
              ثبت گزارش خرابی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: REVIEW & APPROVE ── */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-md">
          <DialogHeader>
            <DialogTitle>بررسی و تعیین تکلیف اولیه فالت</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>تصمیم بازبینی:</Label>
              <Select value={reviewAction} onValueChange={(val: any) => setReviewAction(val)}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="انتخاب اقدام..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">تایید و ارجاع کار فنی</SelectItem>
                  <SelectItem value="reject">رد فالت (نامعتبر / تکراری)</SelectItem>
                  <SelectItem value="needs_info">برگشت جهت تکمیل اطلاعات راهبر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reviewAction === 'approve' && (
              <>
                <div className="space-y-2">
                  <Label>اولویت فالت قطار:</Label>
                  <Select value={reviewPriority} onValueChange={(val) => setReviewPriority(val || '')}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="اولویت را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">کم</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="high">زیاد</SelectItem>
                      <SelectItem value="critical">بحرانی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ارجاع مستقیم به کارشناس تعمیرات (اختیاری):</Label>
                  <Select value={reviewAssignee} onValueChange={(val) => setReviewAssignee(val || '')}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="انتخاب کارشناس..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-assign">بدون تخصیص (تخصیص خودکار سیستم)</SelectItem>
                      {usersList.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role?.label || 'پرسنل'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>توضیحات بازبینی و اقدامات:</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="یادداشت‌های فنی سرشیفت یا دلیل رد فالت..."
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button
              onClick={() =>
                handleTransitionSubmit(reviewAction, {
                  priority: reviewAction === 'approve' ? reviewPriority : undefined,
                  assigneeId: reviewAction === 'approve' && reviewAssignee !== 'no-assign' ? reviewAssignee : undefined,
                  reviewNote,
                })
              }
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              ثبت بازبینی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: REPAIR ACTIONS ── */}
      <Dialog open={repairDialogOpen} onOpenChange={setRepairDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>ثبت اقدامات تعمیراتی و رفع خرابی</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>شرح اقدامات فنی انجام‌شده:</Label>
              <Textarea
                value={actionsTaken}
                onChange={(e) => setActionsTaken(e.target.value)}
                placeholder="توضیح دهید چه کارهایی برای رفع فالت قطار انجام شد..."
                className="text-xs h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>علت ریشه‌ای خرابی (Root Cause):</Label>
              <Input
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="علت اصلی خرابی قطعه یا بروز حادثه..."
                className="text-xs"
              />
            </div>

            <div className="space-y-3 border border-border p-3 rounded-lg bg-zinc-900">
              <Label className="text-xs font-semibold">قطعات مصرف شده:</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="نام قطعه..."
                  className="flex-1 text-xs h-8"
                />
                <Input
                  type="number"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(parseInt(e.target.value, 10))}
                  placeholder="تعداد..."
                  className="w-20 text-xs h-8"
                />
                <Button onClick={addPart} variant="outline" className="text-xs h-8">
                  افزودن
                </Button>
              </div>

              {partsUsed.length > 0 ? (
                <div className="space-y-1 text-xs">
                  {partsUsed.map((p, idx) => (
                    <div key={idx} className="flex justify-between bg-zinc-950 p-1.5 rounded border border-zinc-800">
                      <span>{p.name}</span>
                      <span className="font-bold">{toFa(p.qty)} عدد</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-foreground-muted text-center">قطعه‌ای مصرف نشده است.</div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setRepairDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button
              disabled={!actionsTaken.trim() || !rootCause.trim()}
              onClick={() =>
                handleTransitionSubmit('complete_repair', {
                  actionsTaken,
                  rootCause,
                  partsUsed,
                })
              }
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              ثبت نهایی تعمیرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 4: DEFER FAULT ── */}
      <Dialog open={deferDialogOpen} onOpenChange={setDeferDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-md">
          <DialogHeader>
            <DialogTitle>ماندگار کردن فالت قطار (Defer Fault)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>علت ماندگاری و عدم رفع فوری فالت:</Label>
              <Textarea
                value={deferReason}
                onChange={(e) => setDeferReason(e.target.value)}
                placeholder="توضیح دهید چرا رفع فالت به تعویق می‌افتد..."
                className="text-xs h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>مهلت بازبینی و رفع نهایی (تاریخ میلادی):</Label>
              <Input
                type="date"
                value={deferUntil}
                onChange={(e) => setDeferUntil(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setDeferDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button
              disabled={!deferReason.trim() || !deferUntil}
              onClick={() =>
                handleTransitionSubmit('defer', {
                  deferReason,
                  deferUntil,
                })
              }
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              تایید ماندگار سازی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 5: REOPEN FAULT ── */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-md">
          <DialogHeader>
            <DialogTitle>بازگشایی مجدد فالت قطار</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>علت بازگشایی فالت:</Label>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="چرا خرابی همچنان پابرجاست؟ جزئیات را یادداشت کنید..."
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)} className="text-xs">
              انصراف
            </Button>
            <Button
              disabled={!reopenReason.trim()}
              onClick={() =>
                handleTransitionSubmit('reopen', {
                  note: reopenReason,
                })
              }
              className="text-xs bg-pink-600 hover:bg-pink-700 text-white"
            >
              تایید و بازگشایی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 6: EXCEL IMPORT ── */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border max-w-xl">
          <DialogHeader>
            <DialogTitle>وارد کردن گروهی فالت‌ها از اکسل</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>انتخاب فایل اکسل:</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            {importFile && !importPreview && (
              <Button onClick={handleImportValidate} disabled={importing} className="w-full text-xs">
                {importing ? 'در حال تحلیل...' : 'بارگذاری و پیش‌نمایش فایل'}
              </Button>
            )}

            {importPreview && (
              <div className="space-y-3 border border-border p-4 rounded-lg bg-zinc-900 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-400">تعداد ردیف‌های معتبر: {toFa(importPreview.validCount)}</span>
                  <span className="text-red-400">تعداد خطاها: {toFa(importPreview.errorCount)}</span>
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2 p-2 bg-zinc-950 rounded border border-zinc-800 text-[11px]">
                    {importPreview.errors.map((e: any, idx: number) => (
                      <div key={idx} className="text-red-400">
                        ردیف {toFa(e.row)} ({e.keyIdentifier}): {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false)
                setImportFile(null)
                setImportPreview(null)
              }}
              className="text-xs"
            >
              انصراف
            </Button>
            {importPreview && importPreview.validRows.length > 0 && (
              <Button
                onClick={handleImportCommit}
                disabled={importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {importing ? 'در حال ثبت...' : `ثبت نهایی ${toFa(importPreview.validCount)} ردیف`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
