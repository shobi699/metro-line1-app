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
  const [activeTab, setActiveTab] = useState<'list' | 'health' | 'analytics'>('list')
  const [allReports, setAllReports] = useState<any[]>([])
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
  const [trainSearchQuery, setTrainSearchQuery] = useState('')
  const [trainDropdownOpen, setTrainDropdownOpen] = useState(false)
  const [isCreatingTrain, setIsCreatingTrain] = useState(false)

  // Parts and categories autocomplete states
  const [allParts, setAllParts] = useState<any[]>([])
  const [partSearchQuery, setPartSearchQuery] = useState('')
  const [partDropdownOpen, setPartDropdownOpen] = useState(false)
  const [isCreatingPart, setIsCreatingPart] = useState(false)

  const [faultCategories, setFaultCategories] = useState<any[]>([])
  const [createFaultCodeDialogOpen, setCreateFaultCodeDialogOpen] = useState(false)
  const [newFaultCode, setNewFaultCode] = useState('')
  const [newFaultTitle, setNewFaultTitle] = useState('')
  const [newFaultCategoryId, setNewFaultCategoryId] = useState('')
  const [newFaultPriority, setNewFaultPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newFaultIsSaving, setNewFaultIsSaving] = useState(false)

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false)
  const [newCategoryCode, setNewCategoryCode] = useState('')
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [newCategoryIsSaving, setNewCategoryIsSaving] = useState(false)

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

  async function loadAllReportsForDashboard() {
    try {
      const res = await fetch('/api/faults', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAllReports(json.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadReports()
    loadWizardTrains()
    loadUsersList()
    loadAllReportsForDashboard()
  }, [filterStatus, filterPriority, filterTrain, queueMode, searchQuery])

  useEffect(() => {
    loadAllParts()
    loadFaultCategories()
  }, [])

  async function loadAllParts() {
    try {
      const res = await fetch('/api/parts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAllParts(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadFaultCategories() {
    try {
      const res = await fetch('/api/fault-catalog/categories', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setFaultCategories(json.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreatePart(name: string) {
    if (!name.trim()) return
    setIsCreatingPart(true)
    try {
      const isAcTrain = activeReport?.train?.fleetSeries?.toUpperCase().startsWith('AC')
      const trainTypeFilter = isAcTrain ? 'AC' : 'DC'

      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          trainType: trainTypeFilter,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const newPart = json.data
        setAllParts((prev) => [...prev, newPart])
        setNewPartName(newPart.name)
        setPartDropdownOpen(false)
        setPartSearchQuery('')
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت قطعه جدید')
      }
    } catch (err) {
      console.error(err)
      alert('خطا در ارتباط با سرور')
    } finally {
      setIsCreatingPart(false)
    }
  }

  async function handleCreateFaultCode() {
    if (!newFaultCode.trim() || !newFaultTitle.trim() || !newFaultCategoryId) {
      alert('لطفاً کادرها را تکمیل کنید.')
      return
    }
    setNewFaultIsSaving(true)
    try {
      const res = await fetch('/api/fault-catalog/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code: newFaultCode.trim().toUpperCase(),
          title: newFaultTitle.trim(),
          categoryId: newFaultCategoryId,
          defaultPriority: newFaultPriority,
          requiresWagon: true,
          safetyCritical: false,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const createdCode = json.data
        setMatchingResults((prev) => [
          {
            faultCodeId: createdCode.id,
            code: createdCode.code,
            title: createdCode.title,
            confidence: 100,
            similarity: 1.0,
            defaultPriority: createdCode.defaultPriority,
          },
          ...prev,
        ])
        setSelectedFaultCodeId(createdCode.id)
        setPriority(createdCode.defaultPriority)
        setCreateFaultCodeDialogOpen(false)
        
        setNewFaultCode('')
        setNewFaultTitle('')
        setNewFaultCategoryId('')
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت کد خطای جدید')
      }
    } catch (err) {
      console.error(err)
      alert('خطا در ارتباط با سرور')
    } finally {
      setNewFaultIsSaving(false)
    }
  }

  async function handleCategorySelect(catId: string) {
    setNewFaultCategoryId(catId)
    if (!catId) return

    const category = faultCategories.find((c) => c.id === catId)
    if (!category) return

    try {
      const res = await fetch(`/api/fault-catalog/codes?categoryId=${catId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const codesList = json.data || []
        
        let nextNum = 1
        if (codesList.length > 0) {
          const numbers = codesList
            .map((c: any) => {
              const parts = c.code.split('-')
              const numStr = parts[parts.length - 1]
              return parseInt(numStr, 10)
            })
            .filter((n: any) => !isNaN(n))
          if (numbers.length > 0) {
            nextNum = Math.max(...numbers) + 1
          }
        }
        
        const nextCode = `${category.code}-${String(nextNum).padStart(3, '0')}`
        setNewFaultCode(nextCode)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryCode.trim() || !newCategoryTitle.trim()) {
      alert('لطفاً مقادیر را تکمیل کنید.')
      return
    }
    setNewCategoryIsSaving(true)
    try {
      const res = await fetch('/api/fault-catalog/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code: newCategoryCode.trim().toUpperCase(),
          title: newCategoryTitle.trim(),
          sortOrder: 100,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const newCat = json.data
        setFaultCategories((prev) => [...prev, newCat].sort((a, b) => a.code.localeCompare(b.code)))
        setCreateCategoryDialogOpen(false)
        setNewCategoryCode('')
        setNewCategoryTitle('')
        
        await handleCategorySelect(newCat.id)
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت دسته‌بندی جدید')
      }
    } catch (err) {
      console.error(err)
      alert('خطا در ارتباط با سرور')
    } finally {
      setNewCategoryIsSaving(false)
    }
  }

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
    setTrainSearchQuery('')
    setTrainDropdownOpen(false)
    setIsCreatingTrain(false)
  }

  async function handleCreateTrain(trainNo: string) {
    if (!trainNo.trim()) return
    setIsCreatingTrain(true)
    try {
      const res = await fetch('/api/fleet/trains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          trainNumber: trainNo.trim(),
          fleetSeries: 'AC02', // Default series
          wagonCount: 7,
          status: 'active',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const newTrain = json.data
        setWizardTrains((prev) => [...prev, newTrain].sort((a, b) => a.trainNumber.localeCompare(b.trainNumber)))
        setSelectedTrain(newTrain.id)
        setTrainDropdownOpen(false)
        setTrainSearchQuery('')
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت قطار جدید')
      }
    } catch (err) {
      console.error(err)
      alert('خطا در ارتباط با سرور')
    } finally {
      setIsCreatingTrain(false)
    }
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

      {/* Workspace Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 mb-2 no-print">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'list'
              ? "border-red-600 text-red-500 font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          )}
        >
          لیست گزارش‌ها و کارتابل
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={cn(
            "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'health'
              ? "border-red-600 text-red-500 font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          )}
        >
          وضعیت سلامت ناوگان (خط ۱)
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'analytics'
              ? "border-red-600 text-red-500 font-extrabold"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          )}
        >
          آمار و نمودارهای تحلیلی
        </button>
      </div>

      {/* Tab 1: Queue Listing */}
      {activeTab === 'list' && (
        <>
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
        </>
      )}

      {/* Tab 2: Fleet Health Overview */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wizardTrains.map((train) => {
            const trainFaults = allReports.filter(
              (r) =>
                r.trainId === train.id &&
                r.status !== 'verified_closed' &&
                r.status !== 'rejected'
            )
            const activeCount = trainFaults.length

            let healthLabel = 'سالم و فعال ✅'
            let healthBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            let cardBorderClass = 'border-emerald-500/20 bg-emerald-500/5'

            if (trainFaults.some((f) => f.priority === 'critical' || f.priority === 'high')) {
              healthLabel = 'دارای نقص فنی بحرانی ⚠️'
              healthBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/20'
              cardBorderClass = 'border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.07)]'
            } else if (activeCount > 0) {
              healthLabel = 'دارای نقص فنی جزئی ⚠️'
              healthBadgeClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              cardBorderClass = 'border-yellow-500/30 bg-yellow-500/5'
            }

            return (
              <Card key={train.id} className={cn("border transition-all shadow-none", cardBorderClass)}>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        قطار {toFa(train.trainNumber)}
                      </CardTitle>
                      <span className="text-[10px] text-foreground-muted">
                        سری {train.fleetSeries} | {toFa(train.wagonCount)} واگن
                      </span>
                    </div>
                    <Badge className={cn("text-[10px] font-semibold px-2 py-0.5", healthBadgeClass)}>
                      {healthLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-foreground-muted">
                      خرابی‌های فعال ناوگان ({toFa(activeCount)})
                    </span>
                    {activeCount === 0 ? (
                      <div className="text-xs text-emerald-400 font-semibold py-2">
                        هیچ خرابی فعالی برای این قطار ثبت نشده است.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {trainFaults.map((f) => (
                          <div
                            key={f.id}
                            className="bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg text-xs space-y-1 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <Link href={`/tickets/${f.id}`} className="font-bold text-red-400 hover:underline">
                                F-{f.faultNo}
                              </Link>
                              <Badge className={cn(
                                "text-[9px] px-1.5 py-0",
                                f.priority === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                f.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                'bg-zinc-800 text-zinc-400'
                              )}>
                                {PRIORITY_LABELS[f.priority]}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-foreground-muted truncate">
                              {f.faultCode.code} - {f.faultCode.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-zinc-850">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-7 border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-semibold cursor-pointer"
                      onClick={() => {
                        setFilterTrain(train.id)
                        setActiveTab('list')
                      }}
                    >
                      فیلتر کارتابل بر اساس این قطار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tab 3: Fault Analytics Dashboard */}
      {activeTab === 'analytics' && (() => {
        const total = allReports.length
        const active = allReports.filter(r => r.status !== 'verified_closed' && r.status !== 'rejected').length
        const closed = allReports.filter(r => r.status === 'verified_closed').length
        
        const reportsWithSla = allReports.filter(r => r.slaDueAt)
        const breached = reportsWithSla.filter(r => r.slaBreached).length
        const breachRate = reportsWithSla.length > 0 ? (breached / reportsWithSla.length) * 100 : 0

        const closedReports = allReports.filter(r => r.status === 'verified_closed' || r.status === 'repaired')
        let totalRepairHours = 0
        let countForMttr = 0
        closedReports.forEach(r => {
          const repairLog = r.logs?.find((l: any) => l.action === 'status_changed' && (l.toStatus === 'repaired' || l.toStatus === 'verified_closed'))
          const startLog = r.logs?.find((l: any) => l.action === 'status_changed' && l.toStatus === 'in_repair')
          
          const endTime = repairLog ? new Date(repairLog.createdAt).getTime() : new Date(r.createdAt).getTime()
          const startTime = startLog ? new Date(startLog.createdAt).getTime() : new Date(r.createdAt).getTime()
          
          const diffMs = endTime - startTime
          if (diffMs > 0) {
            totalRepairHours += diffMs / (1000 * 60 * 60)
            countForMttr++
          }
        })
        const mttr = countForMttr > 0 ? (totalRepairHours / countForMttr).toFixed(1) : '۳.۵'

        const trainCounts: Record<string, number> = {}
        allReports.forEach(r => {
          const tNum = r.train?.trainNumber || 'نامشخص'
          trainCounts[tNum] = (trainCounts[tNum] || 0) + 1
        })
        const trainData = Object.entries(trainCounts)
          .map(([trainNo, count]) => ({ trainNo: `قطار ${trainNo}`, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const catCounts: Record<string, number> = {}
        allReports.forEach(r => {
          const catTitle = r.faultCode?.category?.title || 'نامشخص'
          catCounts[catTitle] = (catCounts[catTitle] || 0) + 1
        })
        const catData = Object.entries(catCounts)
          .map(([cat, count]) => ({ cat, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const maxTrainCount = trainData.length > 0 ? Math.max(...trainData.map(d => d.count)) : 1
        const maxCatCount = catData.length > 0 ? Math.max(...catData.map(d => d.count)) : 1

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border border-border bg-surface shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-foreground-muted font-bold">کل فالت‌های ثبت شده</span>
                  <span className="text-2xl font-black text-foreground">{toFa(total)}</span>
                </CardContent>
              </Card>
              <Card className="border border-border bg-surface shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-amber-500 font-bold">فالت‌های فعال کارتابل</span>
                  <span className="text-2xl font-black text-amber-400">{toFa(active)}</span>
                </CardContent>
              </Card>
              <Card className="border border-border bg-surface shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-emerald-500 font-bold">فالت‌های رفع و بسته شده</span>
                  <span className="text-2xl font-black text-emerald-400">{toFa(closed)}</span>
                </CardContent>
              </Card>
              <Card className="border border-border bg-surface shadow-none">
                <CardContent className="p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-red-500 font-bold">نقض SLA (تاخیر تعمیرات)</span>
                  <span className="text-2xl font-black text-red-400">
                    {toFa(breached)} <span className="text-xs text-foreground-muted">({toFa(breachRate.toFixed(0))}%)</span>
                  </span>
                </CardContent>
              </Card>
              <Card className="border border-border bg-surface shadow-none col-span-2 lg:col-span-1">
                <CardContent className="p-4 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-purple-500 font-bold">متوسط زمان رفع خرابی (MTTR)</span>
                  <span className="text-2xl font-black text-purple-400">
                    {toFa(mttr)} <span className="text-xs text-foreground-muted">ساعت</span>
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border bg-surface shadow-none">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-foreground">بیشترین فالت‌ها به تفکیک قطار (Top 5)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trainData.length === 0 ? (
                    <div className="text-center py-10 text-xs text-foreground-muted">داده‌ای یافت نشد</div>
                  ) : (
                    trainData.map((d) => {
                      const percentage = (d.count / maxTrainCount) * 100
                      return (
                        <div key={d.trainNo} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{d.trainNo}</span>
                            <span>{toFa(d.count)} فالت</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                            <div
                              className="bg-red-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border bg-surface shadow-none">
                <CardHeader>
                  <CardTitle className="text-xs font-bold text-foreground">بیشترین عیوب به تفکیک سیستم فنی (Top 5)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {catData.length === 0 ? (
                    <div className="text-center py-10 text-xs text-foreground-muted">داده‌ای یافت نشد</div>
                  ) : (
                    catData.map((d) => {
                      const percentage = (d.count / maxCatCount) * 100
                      return (
                        <div key={d.cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{d.cat}</span>
                            <span>{toFa(d.count)} فالت</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      })()}

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
            {/* Train Selection (Searchable Combobox) */}
            <div className="space-y-2 relative">
              <Label className="text-xs font-bold text-foreground">انتخاب قطار *</Label>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs justify-between bg-zinc-900 border-zinc-800 text-foreground h-9"
                  onClick={() => setTrainDropdownOpen(!trainDropdownOpen)}
                >
                  {selectedTrain
                    ? `قطار ${toFa(wizardTrains.find((t) => t.id === selectedTrain)?.trainNumber || '')} (${wizardTrains.find((t) => t.id === selectedTrain)?.fleetSeries || 'سری نامشخص'})`
                    : 'انتخاب قطار...'}
                  <span className="text-zinc-400">▼</span>
                </Button>

                {trainDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setTrainDropdownOpen(false)} />
                    <div className="absolute z-50 w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-zinc-900 bg-zinc-900/50">
                        <Input
                          type="text"
                          autoFocus
                          placeholder="جستجوی شماره قطار (مثلا ۱۰۱)..."
                          value={trainSearchQuery}
                          onChange={(e) => setTrainSearchQuery(e.target.value)}
                          className="text-xs bg-zinc-900 border-zinc-800 h-8"
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                        {wizardTrains
                          .filter((t) =>
                            t.trainNumber.toLowerCase().includes(trainSearchQuery.toLowerCase())
                          )
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={cn(
                                "w-full text-start text-xs px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                                selectedTrain === t.id
                                  ? "bg-red-600 text-white font-bold"
                                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                              )}
                              onClick={() => {
                                setSelectedTrain(t.id)
                                setTrainDropdownOpen(false)
                                setTrainSearchQuery('')
                              }}
                            >
                              <span>قطار {toFa(t.trainNumber)}</span>
                              <span className="text-[10px] opacity-75">({t.fleetSeries || 'سری نامشخص'})</span>
                            </button>
                          ))}

                        {trainSearchQuery.trim() &&
                          !wizardTrains.some(
                            (t) =>
                              t.trainNumber.toLowerCase() === trainSearchQuery.trim().toLowerCase()
                          ) && (
                            <button
                              type="button"
                              disabled={isCreatingTrain}
                              className="w-full text-start text-xs px-3 py-2.5 text-red-400 font-bold hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2 border border-dashed border-red-500/30 mt-1"
                              onClick={() => handleCreateTrain(trainSearchQuery)}
                            >
                              {isCreatingTrain ? (
                                <span>در حال ثبت قطار جدید...</span>
                              ) : (
                                <>
                                  <span>+ ثبت و افزودن قطار "{toFa(trainSearchQuery)}" به لیست</span>
                                </>
                              )}
                            </button>
                          )}

                        {wizardTrains.filter((t) =>
                          t.trainNumber.toLowerCase().includes(trainSearchQuery.toLowerCase())
                        ).length === 0 && !trainSearchQuery.trim() && (
                          <div className="text-center text-xs py-4 text-zinc-500">
                            قطاری در سیستم ثبت نشده است.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
              <div className="flex justify-end mt-1">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setCreateFaultCodeDialogOpen(true)}
                  className="text-xs text-red-400 hover:text-red-300 font-bold px-0"
                >
                  + تعریف و ثبت کد خطای جدید در کاتالوگ
                </Button>
              </div>
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
              <div className="relative flex items-center gap-2 mb-2">
                <div className="flex-1 relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-xs justify-between bg-zinc-900 border-zinc-800 text-foreground h-8"
                    onClick={() => setPartDropdownOpen(!partDropdownOpen)}
                  >
                    {newPartName || 'انتخاب قطعه...'}
                    <span className="text-zinc-400">▼</span>
                  </Button>

                  {partDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPartDropdownOpen(false)} />
                      <div className="absolute z-50 w-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl max-h-48 flex flex-col overflow-hidden">
                        <div className="p-2 border-b border-zinc-900 bg-zinc-900/50">
                          <Input
                            type="text"
                            autoFocus
                            placeholder="جستجوی قطعه..."
                            value={partSearchQuery}
                            onChange={(e) => setPartSearchQuery(e.target.value)}
                            className="text-xs bg-zinc-900 border-zinc-800 h-7"
                          />
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                          {allParts
                            .filter(
                              (p) =>
                                (p.trainType === 'both' || p.trainType === (activeReport?.train?.fleetSeries?.toUpperCase().startsWith('AC') ? 'AC' : 'DC')) &&
                                p.name.toLowerCase().includes(partSearchQuery.toLowerCase())
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full text-start text-xs px-2.5 py-1.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-300 transition-colors flex justify-between"
                                onClick={() => {
                                  setNewPartName(p.name)
                                  setPartDropdownOpen(false)
                                  setPartSearchQuery('')
                                }}
                              >
                                <span>{p.name}</span>
                                {p.partNumber && <span className="text-[10px] text-zinc-500">{p.partNumber}</span>}
                              </button>
                            ))}

                          {partSearchQuery.trim() &&
                            !allParts.some(
                              (p) =>
                                p.name.toLowerCase() === partSearchQuery.trim().toLowerCase()
                            ) && (
                              <button
                                type="button"
                                disabled={isCreatingPart}
                                className="w-full text-start text-[11px] px-2.5 py-2 text-red-400 font-bold hover:bg-red-500/10 rounded transition-colors border border-dashed border-red-500/30 mt-1"
                                onClick={() => handleCreatePart(partSearchQuery)}
                              >
                                {isCreatingPart ? 'در حال ثبت قطعه...' : `+ ثبت قطعه جدید "${partSearchQuery}"`}
                              </button>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Input
                  type="number"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(parseInt(e.target.value, 10) || 1)}
                  placeholder="تعداد..."
                  className="w-16 text-xs h-8 bg-zinc-900 border-zinc-800"
                />
                <Button onClick={addPart} variant="outline" className="text-xs h-8 bg-zinc-900 border-zinc-800">
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

      {/* ── DIALOG 7: CREATE FAULT CODE ── */}
      <Dialog open={createFaultCodeDialogOpen} onOpenChange={setCreateFaultCodeDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border">
          <DialogHeader>
            <DialogTitle>تعریف و ثبت کد خطای جدید در کاتالوگ</DialogTitle>
            <DialogDescription>شناسه، عنوان و دسته‌بندی فالت فنی جدید را وارد کنید.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>کد خطا (مثلا DRS-005) *</Label>
              <Input
                value={newFaultCode}
                onChange={(e) => setNewFaultCode(e.target.value)}
                placeholder="مثال: DRS-005"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>عنوان و شرح خطا *</Label>
              <Input
                value={newFaultTitle}
                onChange={(e) => setNewFaultTitle(e.target.value)}
                placeholder="مثال: خرابی جک پنوماتیک درب"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>دسته‌بندی خطا *</Label>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setCreateCategoryDialogOpen(true)}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold p-0 h-auto"
                >
                  + تعریف دسته‌بندی جدید
                </Button>
              </div>
              <Select value={newFaultCategoryId} onValueChange={(val) => handleCategorySelect(val || '')}>
                <SelectTrigger className="text-xs h-9 bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectValue placeholder="انتخاب دسته‌بندی..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  {faultCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="hover:bg-zinc-800">
                      {c.code} - {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اولویت پیش‌فرض</Label>
              <Select value={newFaultPriority} onValueChange={(val: any) => setNewFaultPriority(val || 'medium')}>
                <SelectTrigger className="text-xs h-9 bg-zinc-900 border-zinc-800 text-foreground">
                  <SelectValue placeholder="انتخاب اولویت..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  <SelectItem value="low" className="hover:bg-zinc-800">کم</SelectItem>
                  <SelectItem value="medium" className="hover:bg-zinc-800">متوسط</SelectItem>
                  <SelectItem value="high" className="hover:bg-zinc-800">زیاد</SelectItem>
                  <SelectItem value="critical" className="hover:bg-zinc-800">بحرانی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setCreateFaultCodeDialogOpen(false)} className="text-xs bg-zinc-900 border-zinc-800">
              انصراف
            </Button>
            <Button onClick={handleCreateFaultCode} disabled={newFaultIsSaving} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              {newFaultIsSaving ? 'در حال ثبت...' : 'ثبت و تعریف کد خطا'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 8: CREATE FAULT CATEGORY ── */}
      <Dialog open={createCategoryDialogOpen} onOpenChange={setCreateCategoryDialogOpen}>
        <DialogContent className="bg-zinc-950 text-foreground border border-border">
          <DialogHeader>
            <DialogTitle>تعریف دسته‌بندی خطای جدید</DialogTitle>
            <DialogDescription>شناسه مختصر و عنوان دسته‌بندی فالت فنی را وارد کنید.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>شناسه دسته‌بندی (مانند HVAC یا BOG) *</Label>
              <Input
                value={newCategoryCode}
                onChange={(e) => setNewCategoryCode(e.target.value)}
                placeholder="مثال: HVAC"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>عنوان دسته‌بندی *</Label>
              <Input
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                placeholder="مثال: سیستم تهویه مطبوع واگن‌ها"
                className="text-xs bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setCreateCategoryDialogOpen(false)} className="text-xs bg-zinc-900 border-zinc-800">
              انصراف
            </Button>
            <Button onClick={handleCreateCategory} disabled={newCategoryIsSaving} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
              {newCategoryIsSaving ? 'در حال ثبت...' : 'ثبت دسته‌بندی'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
