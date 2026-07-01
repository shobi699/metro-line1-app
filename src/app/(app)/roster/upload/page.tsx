'use client'
// Force IDE diagnostics cache reload

import { useState, useEffect, useMemo } from 'react'
import { FileDrop } from '@/components/shared/file-drop'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
import { cn } from '@/lib/utils'
import { jdate, fromJalali, gregStr } from '@/lib/dayjs'
import {
  UploadCloud,
  Sparkles,
  FileText,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Check,
  HelpCircle,
  Clock,
  Loader2,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Calendar,
  Layers,
  Eye,
  GitCompare,
  CheckCircle,
  Bell,
  Edit3,
  ShieldAlert,
  Save,
  Plus,
  Trash,
  User,
  Train,
  Zap,
  Cpu
} from 'lucide-react'

interface TripAssignment {
  id: string
  tripId: string
  role: 'H1' | 'H2' | 'T' | 'R' | 'T_TYPE' | 'R_CHAR'
  rawName: string | null
  matchedUserId: string | null
  personnelNo: string | null
  matchScore: number | null
  matchStatus: 'AUTO_MATCHED' | 'NEEDS_REVIEW' | 'MANUAL_MATCHED' | 'UNMATCHED'
}

interface Trip {
  tempId?: string
  id?: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  operationalNote: string | null
  status: string
  assignments: TripAssignment[]
}

interface ValidationIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  type: string
  message: string
  affectedTripId?: string
  affectedUserId?: string
  suggestedAction?: string
}

interface RosterMeta {
  jalaliDate: string
  title: string
  schedulingTitle: string
  processingNumber: number
}

interface ImportResult {
  rosterDayId: string
  rosterVersionId: string
  versionNo: number
  meta: RosterMeta
  trips: Trip[]
  assignments: TripAssignment[]
  issues: ValidationIssue[]
}

interface RosterHistoryItem {
  id: string
  lineCode: string
  jalaliDate: string
  gregorianDate: string
  title: string
  schedulingTitle: string
  status: string
  createdAt: string
}

interface UserSummary {
  id: string
  name: string
  nationalId: string
}

export default function RosterUploadPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Data states
  const [result, setResult] = useState<ImportResult | null>(null)
  const [history, setHistory] = useState<RosterHistoryItem[]>([])
  const [allUsers, setAllUsers] = useState<UserSummary[]>([])

  // Roster Metadata fields
  const [jalaliDate, setJalaliDate] = useState(() => {
    return jdate().add(1, 'day').format('YYYY/MM/DD')
  })
  const [rosterTitle, setRosterTitle] = useState('گزارش لوحه اعزام روزانه')
  const [schedulingTitle, setSchedulingTitle] = useState('روز عادی (پیک شلوغی)')
  const [processingNumber, setProcessingNumber] = useState(7)

  // Custom Jalali Date Picker states
  const [pickerYear, setPickerYear] = useState(() => jdate().add(1, 'day').year())
  const [pickerMonth, setPickerMonth] = useState(() => jdate().add(1, 'day').month() + 1)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Version Comparison & Highlighting states
  const [activeRosterTrips, setActiveRosterTrips] = useState<any[]>([])
  const [compareTab, setCompareTab] = useState<'preview' | 'diff'>('preview')
  const [highlightedTripId, setHighlightedTripId] = useState<string | null>(null)

  const jalaliMonthNames = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ]

  const pickerFirstDay = jdate()
    .year(pickerYear)
    .month(pickerMonth - 1)
    .date(1)
  const pickerDaysInMonth = pickerFirstDay.daysInMonth()
  const pickerStartWeekday = (pickerFirstDay.day() + 1) % 7

  function prevPickerMonth() {
    if (pickerMonth === 1) {
      setPickerYear(pickerYear - 1)
      setPickerMonth(12)
    } else {
      setPickerMonth(pickerMonth - 1)
    }
  }

  function nextPickerMonth() {
    if (pickerMonth === 12) {
      setPickerYear(pickerYear + 1)
      setPickerMonth(1)
    } else {
      setPickerMonth(pickerMonth + 1)
    }
  }

  // Fetch published/active roster to compare
  async function fetchActiveRosterForCompare(dateStr: string) {
    if (!accessToken) return
    try {
      const parts = dateStr.split('/').map(Number)
      if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return
      const greg = gregStr(fromJalali(parts[0], parts[1], parts[2]))
      const res = await fetch(`/api/supervisor/roster/today?date=${greg}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.trips) {
          setActiveRosterTrips(json.data.trips)
        } else {
          setActiveRosterTrips([])
        }
      } else {
        setActiveRosterTrips([])
      }
    } catch {
      setActiveRosterTrips([])
    }
  }

  // Sync picker states if jalaliDate changes
  useEffect(() => {
    try {
      const parts = jalaliDate.split('/').map(Number)
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setPickerYear(parts[0])
        setPickerMonth(parts[1])
      }
    } catch {
      // silent
    }
  }, [jalaliDate])

  // Fetch comparison data when draft result is loaded or date changes
  useEffect(() => {
    if (result && jalaliDate) {
      void fetchActiveRosterForCompare(jalaliDate)
    }
  }, [result, jalaliDate])


  // Main active tab
  const [activeMainTab, setActiveMainTab] = useState<'upload' | 'templates'>('upload')

  // Custom Processing Parameters
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [autoMatchThreshold, setAutoMatchThreshold] = useState(85)
  const [reviewMatchThreshold, setReviewMatchThreshold] = useState(70)

  // Visual Mapper Settings state
  const [showMapperSettings, setShowMapperSettings] = useState(false)

  // Template Management States
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')

  // Edit Template details states (§۱۳.۷)
  const [editingTemplateId, setEditingTemplateId] = useState<string>('')
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSourceType, setEditSourceType] = useState<'EXCEL' | 'PDF'>('EXCEL')
  const [editRightMapping, setEditRightMapping] = useState<any>({
    rowNoIndex: 0,
    trainNumberIndex: 1,
    rIndex: 2,
    tIndex: 3,
    h1Index: 4,
    assistantTIndex: 5,
    assistantRIndex: 6,
    h2Index: 7,
    departureTimeIndex: 8,
    arrivalTimeIndex: 9,
  })
  const [editLeftMapping, setEditLeftMapping] = useState<any>({
    rowNoIndex: 10,
    trainNumberIndex: 11,
    rIndex: 12,
    tIndex: 13,
    h1Index: 14,
    assistantTIndex: 15,
    assistantRIndex: 16,
    h2Index: 17,
    departureTimeIndex: 18,
    arrivalTimeIndex: 19,
  })
  const [editPageWidth, setEditPageWidth] = useState<number>(0)
  const [editPageHeight, setEditPageHeight] = useState<number>(0)
  const [editRightBlock, setEditRightBlock] = useState<any>({ x: 0, y: 0, width: 0, height: 0 })
  const [editLeftBlock, setEditLeftBlock] = useState<any>({ x: 0, y: 0, width: 0, height: 0 })
  const [editHeaderZones, setEditHeaderZones] = useState<string>('[]')
  const [editPdfColumns, setEditPdfColumns] = useState<string>('[]')

  // Roster Parser Simulator states
  const [simRawLine, setSimRawLine] = useState<string>('')
  const [simDelimiter, setSimDelimiter] = useState<'tab' | 'comma' | 'space'>('tab')

  // Safety Config states
  const [safetyRestBetweenTrips, setSafetyRestBetweenTrips] = useState(5)
  const [safetyDailyDrivingHours, setSafetyDailyDrivingHours] = useState(8)
  const [safetyConsecutiveTrips, setSafetyConsecutiveTrips] = useState(4)
  const [safetyInterdayRestHours, setSafetyInterdayRestHours] = useState(11)
  const [safetyWarningsEnabled, setSafetyWarningsEnabled] = useState(true)

  // Right block mapper indexes (SHAHRREY_TO_TAJRISH)
  const [rightRowIdx, setRightRowIdx] = useState(0)
  const [rightTrainIdx, setRightTrainIdx] = useState(1)
  const [rightRIdx, setRightRIdx] = useState(2)
  const [rightTIdx, setRightTIdx] = useState(3)
  const [rightH1Idx, setRightH1Idx] = useState(4)
  const [rightAssistTIdx, setRightAssistTIdx] = useState(5)
  const [rightAssistRIdx, setRightAssistRIdx] = useState(6)
  const [rightH2Idx, setRightH2Idx] = useState(7)
  const [rightDepIdx, setRightDepIdx] = useState(8)
  const [rightArrIdx, setRightArrIdx] = useState(9)

  // Left block mapper indexes (TAJRISH_TO_SHAHRREY)
  const [leftRowIdx, setLeftRowIdx] = useState(10)
  const [leftTrainIdx, setLeftTrainIdx] = useState(11)
  const [leftRIdx, setLeftRIdx] = useState(12)
  const [leftTIdx, setLeftTIdx] = useState(13)
  const [leftH1Idx, setLeftH1Idx] = useState(14)
  const [leftAssistTIdx, setLeftAssistTIdx] = useState(15)
  const [leftAssistRIdx, setLeftAssistRIdx] = useState(16)
  const [leftH2Idx, setLeftH2Idx] = useState(17)
  const [leftDepIdx, setLeftDepIdx] = useState(18)
  const [leftArrIdx, setLeftArrIdx] = useState(19)

  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Interactive Parser Simulator Engine
  const simParsedResult = useMemo(() => {
    if (!simRawLine.trim()) return null
    let parts: string[] = []
    if (simDelimiter === 'tab') {
      parts = simRawLine.split('\t')
    } else if (simDelimiter === 'comma') {
      parts = simRawLine.split(',')
    } else {
      parts = simRawLine.split(/\s+/)
    }
    parts = parts.map(p => p.trim())

    const mapRight = {
      rowNoIndex: rightRowIdx,
      trainNumberIndex: rightTrainIdx,
      rIndex: rightRIdx,
      tIndex: rightTIdx,
      h1Index: rightH1Idx,
      assistantTIndex: rightAssistTIdx,
      assistantRIndex: rightAssistRIdx,
      h2Index: rightH2Idx,
      departureTimeIndex: rightDepIdx,
      arrivalTimeIndex: rightArrIdx,
    }

    const mapLeft = {
      rowNoIndex: leftRowIdx,
      trainNumberIndex: leftTrainIdx,
      rIndex: leftRIdx,
      tIndex: leftTIdx,
      h1Index: leftH1Idx,
      assistantTIndex: leftAssistTIdx,
      assistantRIndex: leftAssistRIdx,
      h2Index: leftH2Idx,
      departureTimeIndex: leftDepIdx,
      arrivalTimeIndex: leftArrIdx,
    }

    const parseBlock = (mapping: any) => {
      const getVal = (idx: number) => parts[idx] !== undefined ? parts[idx] : '—'
      return {
        rowNo: getVal(mapping.rowNoIndex),
        trainNumber: getVal(mapping.trainNumberIndex),
        r: getVal(mapping.rIndex),
        t: getVal(mapping.tIndex),
        h1: getVal(mapping.h1Index),
        assistantT: getVal(mapping.assistantTIndex),
        assistantR: getVal(mapping.assistantRIndex),
        h2: getVal(mapping.h2Index),
        departureTime: getVal(mapping.departureTimeIndex),
        arrivalTime: getVal(mapping.arrivalTimeIndex),
      }
    }

    return {
      parts,
      right: parseBlock(mapRight),
      left: parseBlock(mapLeft),
    }
  }, [
    simRawLine,
    simDelimiter,
    rightRowIdx,
    rightTrainIdx,
    rightRIdx,
    rightTIdx,
    rightH1Idx,
    rightAssistTIdx,
    rightAssistRIdx,
    rightH2Idx,
    rightDepIdx,
    rightArrIdx,
    leftRowIdx,
    leftTrainIdx,
    leftRIdx,
    leftTIdx,
    leftH1Idx,
    leftAssistTIdx,
    leftAssistRIdx,
    leftH2Idx,
    leftDepIdx,
    leftArrIdx
  ])


  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load history of uploads
  async function loadHistory() {
    if (!accessToken) return
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/roster/upload', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setHistory(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }

  // Load active directory users for re-assignment dropdowns
  async function loadUsers() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/users?pageSize=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAllUsers(json.data?.users || [])
      }
    } catch {
      // silent
    }
  }

  // Load roster templates list
  async function loadTemplates() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/rosters/templates', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTemplates(json.data || [])
      }
    } catch {
      // silent
    }
  }

  // Load and fetch safety rules config (§۷.۱, §۷.۲, §۷.۳)
  async function loadSafetySettings() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const list = json.data || []
        const rest = list.find((s: any) => s.key === 'roster.minRestTimeBetweenTrips')
        const daily = list.find((s: any) => s.key === 'roster.maxDailyDrivingHours')
        const consec = list.find((s: any) => s.key === 'roster.maxConsecutiveTrips')
        const inter = list.find((s: any) => s.key === 'roster.minInterdayRestHours')
        const warn = list.find((s: any) => s.key === 'roster.enableFatigueWarnings')

        if (rest) setSafetyRestBetweenTrips(JSON.parse(rest.value))
        if (daily) setSafetyDailyDrivingHours(JSON.parse(daily.value))
        if (consec) setSafetyConsecutiveTrips(JSON.parse(consec.value))
        if (inter) setSafetyInterdayRestHours(JSON.parse(inter.value))
        if (warn) setSafetyWarningsEnabled(JSON.parse(warn.value))
      }
    } catch { }
  }

  // Update existing template details (§۱۳.۷)
  async function handleUpdateTemplate(templateId: string) {
    if (!accessToken || !editName.trim()) return
    try {
      const target = templates.find(t => t.id === templateId)
      const res = await fetch(`/api/rosters/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          sourceType: editSourceType,
          rightMapping: editRightMapping,
          leftMapping: editLeftMapping,
          pageWidth: editPageWidth || null,
          pageHeight: editPageHeight || null,
          rightBlock: editRightBlock,
          leftBlock: editLeftBlock,
          headerZones: (() => {
            try { return JSON.parse(editHeaderZones) } catch { return [] }
          })(),
          pdfColumns: (() => {
            try { return JSON.parse(editPdfColumns) } catch { return [] }
          })(),
        })
      })

      if (res.ok) {
        setNotification({ type: 'success', text: 'الگوی نگاشت با موفقیت ویرایش شد.' })
        setEditingTemplateId('')
        await loadTemplates()
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در ویرایش الگو' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ذخیره‌سازی اطلاعات.' })
    }
  }

  // Delete a mapping template (§۱۳.۷)
  async function handleDeleteTemplate(templateId: string) {
    if (!accessToken) return
    if (!window.confirm('آیا از حذف این الگوی نگاشت مطمئن هستید؟')) return

    try {
      const res = await fetch(`/api/rosters/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (res.ok) {
        setNotification({ type: 'success', text: 'الگو با موفقیت حذف شد.' })
        if (selectedTemplateId === templateId) setSelectedTemplateId('')
        await loadTemplates()
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در حذف الگو' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط.' })
    }
  }

  // Toggle template active status (§۱۳.۷)
  async function handleToggleTemplateActive(templateId: string, currentActive: boolean) {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/rosters/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          isActive: !currentActive
        })
      })

      if (res.ok) {
        setNotification({ type: 'success', text: 'وضعیت الگو با موفقیت به‌روزرسانی شد.' })
        await loadTemplates()
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در تغییر وضعیت الگو' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط.' })
    }
  }

  // Save current safety fatigue rules config variables (§۷.۳)
  async function handleSaveSafetyConfig() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          updates: [
            { key: 'roster.minRestTimeBetweenTrips', value: String(safetyRestBetweenTrips) },
            { key: 'roster.maxDailyDrivingHours', value: String(safetyDailyDrivingHours) },
            { key: 'roster.maxConsecutiveTrips', value: String(safetyConsecutiveTrips) },
            { key: 'roster.minInterdayRestHours', value: String(safetyInterdayRestHours) },
            { key: 'roster.enableFatigueWarnings', value: String(safetyWarningsEnabled) }
          ]
        })
      })
      if (res.ok) {
        setNotification({ type: 'success', text: 'قوانین و محدودیت‌های خستگی با موفقیت به‌روزرسانی شدند.' })
      } else {
        const err = await res.json()
        setNotification({ type: 'error', text: err.error || 'خطا در ثبت تنظیمات' })
      }
    } catch {
      setNotification({ type: 'error', text: 'عدم ارتباط با سرور.' })
    }
  }

  // Handle template selection and apply indexes to states
  function handleSelectTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return

    // Apply mappings to right block states
    const right = tpl.rightMapping
    if (right) {
      setRightRowIdx(right.rowNoIndex ?? 0)
      setRightTrainIdx(right.trainNumberIndex ?? 1)
      setRightRIdx(right.rIndex ?? 2)
      setRightTIdx(right.tIndex ?? 3)
      setRightH1Idx(right.h1Index ?? 4)
      setRightAssistTIdx(right.assistantTIndex ?? 5)
      setRightAssistRIdx(right.assistantRIndex ?? 6)
      setRightH2Idx(right.h2Index ?? 7)
      setRightDepIdx(right.departureTimeIndex ?? 8)
      setRightArrIdx(right.arrivalTimeIndex ?? 9)
    }

    // Apply mappings to left block states
    const left = tpl.leftMapping
    if (left) {
      setLeftRowIdx(left.rowNoIndex ?? 10)
      setLeftTrainIdx(left.trainNumberIndex ?? 11)
      setLeftRIdx(left.rIndex ?? 12)
      setLeftTIdx(left.tIndex ?? 13)
      setLeftH1Idx(left.h1Index ?? 14)
      setLeftAssistTIdx(left.assistantTIndex ?? 15)
      setLeftAssistRIdx(left.assistantRIndex ?? 16)
      setLeftH2Idx(left.h2Index ?? 17)
      setLeftDepIdx(left.departureTimeIndex ?? 18)
      setLeftArrIdx(left.arrivalTimeIndex ?? 19)
    }

    setNotification({
      type: 'success',
      text: `الگوی «${tpl.name}» با موفقیت بارگذاری و اعمال شد.`
    })
  }

  // Save current mapper states as a template
  async function handleSaveTemplate() {
    if (!accessToken || !newTemplateName.trim()) return
    try {
      const res = await fetch('/api/rosters/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim() || null,
          rightMapping: {
            block: 'RIGHT',
            rowNoIndex: rightRowIdx,
            trainNumberIndex: rightTrainIdx,
            rIndex: rightRIdx,
            tIndex: rightTIdx,
            h1Index: rightH1Idx,
            assistantTIndex: rightAssistTIdx,
            assistantRIndex: rightAssistRIdx,
            h2Index: rightH2Idx,
            departureTimeIndex: rightDepIdx,
            arrivalTimeIndex: rightArrIdx,
          },
          leftMapping: {
            block: 'LEFT',
            rowNoIndex: leftRowIdx,
            trainNumberIndex: leftTrainIdx,
            rIndex: leftRIdx,
            tIndex: leftTIdx,
            h1Index: leftH1Idx,
            assistantTIndex: leftAssistTIdx,
            assistantRIndex: leftAssistRIdx,
            h2Index: leftH2Idx,
            departureTimeIndex: leftDepIdx,
            arrivalTimeIndex: leftArrIdx,
          }
        })
      })

      if (res.ok) {
        setSaveTemplateModalOpen(false)
        setNewTemplateName('')
        setNewTemplateDesc('')
        setNotification({
          type: 'success',
          text: 'الگوی نگاشت جدید با موفقیت ذخیره گردید.'
        })
        await loadTemplates()
      } else {
        const json = await res.json()
        setNotification({
          type: 'error',
          text: json.error || 'خطا در ذخیره‌سازی الگو'
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در اتصال به سرور'
      })
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadHistory()
      void loadUsers()
      void loadTemplates()
      void loadSafetySettings()
    }
  }, [accessToken])

  // Handle uploading and parsing
  async function handleUpload(file: File) {
    setSelectedFile(file)
    await runProcessing(file)
  }

  async function runProcessing(file: File) {
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jalaliDate', jalaliDate)
      formData.append('title', rosterTitle)
      formData.append('schedulingTitle', schedulingTitle)
      formData.append('processingNumber', String(processingNumber))
      formData.append('autoMatchThreshold', String(autoMatchThreshold))
      formData.append('reviewMatchThreshold', String(reviewMatchThreshold))

      // Custom column mappings
      formData.append('rightRowIndex', String(rightRowIdx))
      formData.append('rightTrainIndex', String(rightTrainIdx))
      formData.append('rightRIndex', String(rightRIdx))
      formData.append('rightTIndex', String(rightTIdx))
      formData.append('rightH1Index', String(rightH1Idx))
      formData.append('rightAssistTIndex', String(rightAssistTIdx))
      formData.append('rightAssistRIndex', String(rightAssistRIdx))
      formData.append('rightH2Index', String(rightH2Idx))
      formData.append('rightDepartureTimeIndex', String(rightDepIdx))
      formData.append('rightArrivalTimeIndex', String(rightArrIdx))

      formData.append('leftRowIndex', String(leftRowIdx))
      formData.append('leftTrainIndex', String(leftTrainIdx))
      formData.append('leftRIndex', String(leftRIdx))
      formData.append('leftTIndex', String(leftTIdx))
      formData.append('leftH1Index', String(leftH1Idx))
      formData.append('leftAssistTIndex', String(leftAssistTIdx))
      formData.append('leftAssistRIndex', String(leftAssistRIdx))
      formData.append('leftH2Index', String(leftH2Idx))
      formData.append('leftDepartureTimeIndex', String(leftDepIdx))
      formData.append('leftArrivalTimeIndex', String(leftArrIdx))

      const res = await fetch('/api/rosters/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const json = await res.json()
      if (res.ok && json.data) {
        // Map assignments to trips for easy UI rendering
        const tripsWithAssignments = json.data.trips.map((trip: Trip) => {
          const tripAss = json.data.assignments.filter(
            (a: any) => a.tripTempId === trip.tempId
          )
          return { ...trip, assignments: tripAss }
        })

        setResult({
          ...json.data,
          trips: tripsWithAssignments
        })

        setNotification({
          type: 'success',
          text: 'فایل لوحه با موفقیت استخراج و پیش‌نویس گردید. لطفاً مغایرت‌ها را بررسی کرده و دکمه انتشار نهایی را بزنید.',
        })
        loadHistory()
      } else {
        setNotification({
          type: 'error',
          text: json.error || 'خطا در بارگذاری و پردازش فایل لوحه',
        })
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: 'خطا در بارگذاری فایل: ' + err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle re-assigning driver manually during review
  async function handleReassignDriver(assignmentId: string, matchedUserId: string) {
    if (!accessToken || !result) return
    try {
      const res = await fetch(`/api/trips/${assignmentId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ matchedUserId })
      })

      if (res.ok) {
        const json = await res.json()
        setNotification({
          type: 'success',
          text: 'تخصیص راهبر با موفقیت تغییر کرد.'
        })

        // Update local result state
        const updatedTrips = result.trips.map(trip => {
          const updatedAss = trip.assignments.map(ass => {
            if (ass.id === assignmentId || (ass.tripId === trip.id && ass.role === json.data.role)) {
              return {
                ...ass,
                matchedUserId: json.data.matchedUserId,
                personnelNo: json.data.personnelNo,
                matchStatus: json.data.matchStatus,
                rawName: json.data.rawName
              }
            }
            return ass
          })
          return { ...trip, assignments: updatedAss }
        })

        setResult({ ...result, trips: updatedTrips })

        // Re-validate roster locally to clear warnings
        // Normally, a backend re-validation or refresh is cleaner, but we can do a quick check
      } else {
        const errJson = await res.json()
        setNotification({ type: 'error', text: errJson.error || 'خطا در تخصیص مجدد راننده' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' })
    }
  }

  // Handle publishing roster
  async function handlePublish() {
    if (!accessToken || !result) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/rosters/${result.rosterVersionId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: 'لوحه عملیاتی روزانه با موفقیت تایید و در تقویم رانندگان منتشر گردید.'
        })
        setResult(null)
        loadHistory()
      } else {
        setNotification({
          type: 'error',
          text: json.error || 'خطا در تایید و انتشار لوحه'
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور'
      })
    } finally {
      setConfirmLoading(false)
    }
  }

  // Helper to determine row color coding for the Staging Area
  const getTripRowStyles = (trip: Trip, resultIssues: ValidationIssue[]) => {
    const tripIssues = resultIssues.filter(
      (issue) => issue.affectedTripId === trip.tempId || issue.affectedTripId === trip.id
    )
    const hasCriticalOrError = tripIssues.some(
      (issue) => issue.severity === 'CRITICAL' || issue.severity === 'ERROR'
    )
    const hasWarning = tripIssues.some((issue) => issue.severity === 'WARNING')

    const assignments = trip.assignments || []
    const hasUnmatched = assignments.some((a) => a.role !== 'T_TYPE' && a.role !== 'R_CHAR' && a.matchStatus === 'UNMATCHED')
    const hasNeedsReview = assignments.some((a) => a.role !== 'T_TYPE' && a.role !== 'R_CHAR' && a.matchStatus === 'NEEDS_REVIEW')

    const isNonOperational = trip.status !== 'NORMAL' || trip.operationalNote?.includes('شانت')
    const isHighlighted = highlightedTripId === trip.tempId || highlightedTripId === trip.id

    let bgClass = 'hover:bg-surface-container-high/30'
    let borderClass = 'border-l-4 border-l-transparent'
    let statusLabel = 'تأیید شده'
    let statusColor = 'text-success bg-success/10 border-success/20'

    if (isHighlighted) {
      bgClass = 'bg-accent/15 hover:bg-accent/20 border-l-4 border-l-accent'
      borderClass = 'border-l-4 border-l-accent'
    } else if (hasCriticalOrError || hasUnmatched) {
      bgClass = 'bg-critical/5 hover:bg-critical/10'
      borderClass = 'border-l-4 border-l-critical'
      statusLabel = 'خطای ایمنی / فاقد راهبر'
      statusColor = 'text-critical bg-critical/10 border-critical/20 font-bold'
    } else if (hasNeedsReview || hasWarning) {
      bgClass = 'bg-warning/5 hover:bg-warning/10'
      borderClass = 'border-l-4 border-l-warning'
      statusLabel = 'نیازمند بررسی دستی'
      statusColor = 'text-warning bg-warning/10 border-warning/20 font-bold'
    } else if (isNonOperational) {
      bgClass = 'bg-surface-container-low/40 hover:bg-surface-container-low/60 opacity-80'
      borderClass = 'border-l-4 border-l-outline-variant'
      statusLabel = trip.operationalNote || 'غیرعملیاتی'
      statusColor = 'text-foreground-muted bg-surface-container border-outline-variant'
    } else {
      bgClass = 'bg-success/5 hover:bg-success/10'
      borderClass = 'border-l-4 border-l-success'
      statusLabel = 'تأیید شده'
      statusColor = 'text-success bg-success/10 border-success/20'
    }

    return { bgClass, borderClass, statusLabel, statusColor }
  }

  const getTripCellStyles = (trip: Trip | undefined, issues: ValidationIssue[]) => {
    if (!trip) return { bgClass: 'bg-surface-container-low/10 opacity-40', borderClass: 'border-outline-variant', statusLabel: '—', statusColor: 'text-foreground-muted/30' }
    return getTripRowStyles(trip, issues)
  }

  const renderStagingAssignmentCell = (assignment: any, role: 'H1' | 'H2' | 'T' | 'R') => {
    if (!assignment) {
      return (
        <span className="text-foreground-muted/40 italic text-[9px] block text-center">
          {role === 'H1' ? 'فاقد راهبر' : '—'}
        </span>
      )
    }

    const shortLabels: Record<string, string> = {
      AUTO_MATCHED: 'خودکار',
      MANUAL_MATCHED: 'دستی',
      NEEDS_REVIEW: 'بررسی',
      UNMATCHED: 'خطا',
    }

    return (
      <div className="flex flex-col gap-0.5 min-w-[90px] text-right">
        <span className="font-semibold text-foreground text-[10px] truncate max-w-[95px] block" title={assignment.rawName || ''}>
          {assignment.rawName}
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <select
            value={assignment.matchedUserId || ''}
            onChange={(e) => handleReassignDriver(assignment.id, e.target.value)}
            className="bg-surface-container border border-outline-variant rounded px-1 py-0.5 text-[8px] text-foreground outline-none cursor-pointer scale-90 origin-right"
          >
            <option value="">تخصیص...</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <span className={cn(
            "inline-block px-1 py-0.2 text-[7px] font-bold border rounded-sm scale-90",
            matchStatusColors[assignment.matchStatus]
          )}>
            {shortLabels[assignment.matchStatus] || '—'}
          </span>
        </div>
      </div>
    )
  }

  // Highlight and scroll to a trip row when warning is clicked
  function handleHighlightTrip(tripId?: string) {
    if (!tripId) return
    setCompareTab('preview')
    setHighlightedTripId(tripId)
    setTimeout(() => {
      const el = document.getElementById(`trip-row-${tripId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    setTimeout(() => {
      setHighlightedTripId(null)
    }, 4000)
  }

  // Generate visual diff comparing draft against active roster
  const getRosterDifferences = () => {
    const diffs: {
      type: 'add' | 'delete' | 'change'
      message: string
    }[] = []

    if (!result) return diffs

    // 1. Check for additions and reassignments
    result.trips.forEach((draftTrip) => {
      const activeTrip = activeRosterTrips.find(
        (t) => t.rowNo === draftTrip.rowNo && t.direction === draftTrip.direction
      )
      const dirLabel = draftTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'مسیر رفت (شهرری ← تجریش)' : 'مسیر برگشت (تجریش ← شهرری)'

      if (!activeTrip) {
        diffs.push({
          type: 'add',
          message: `سفر جدید ردیف ${toFa(draftTrip.rowNo)}: قطار ${toFa(draftTrip.trainNumber || '—')} با ساعت خروج ${toFa(draftTrip.departureTime || '—')} در ${dirLabel} اضافه شده است.`
        })
      } else {
        const changes: string[] = []

        if (draftTrip.trainNumber !== activeTrip.trainNumber) {
          changes.push(`شماره قطار از "${toFa(activeTrip.trainNumber || '—')}" به "${toFa(draftTrip.trainNumber || '—')}"`)
        }
        if (draftTrip.departureTime !== activeTrip.departureTime) {
          changes.push(`زمان حرکت از ${toFa(activeTrip.departureTime || '—')} به ${toFa(draftTrip.departureTime || '—')}`)
        }
        if (draftTrip.arrivalTime !== activeTrip.arrivalTime) {
          changes.push(`زمان رسیدن از ${toFa(activeTrip.arrivalTime || '—')} به ${toFa(draftTrip.arrivalTime || '—')}`)
        }

        const draftH1 = draftTrip.assignments.find((a) => a.role === 'H1')
        const activeH1 = activeTrip.assignments.find((a: any) => a.role === 'H1')
        const draftH1Name = draftH1?.rawName || '—'
        const activeH1Name = activeH1?.rawName || '—'

        if (draftH1Name !== activeH1Name) {
          changes.push(`راهبر H1 از "${activeH1Name}" به "${draftH1Name}"`)
        }

        const draftH2 = draftTrip.assignments.find((a) => a.role === 'H2')
        const activeH2 = activeTrip.assignments.find((a: any) => a.role === 'H2')
        const draftH2Name = draftH2?.rawName || '—'
        const activeH2Name = activeH2?.rawName || '—'

        if (draftH2Name !== activeH2Name) {
          changes.push(`راهبر H2 از "${activeH2Name}" به "${draftH2Name}"`)
        }

        const draftT = draftTrip.assignments.find((a) => a.role === 'T')
        const activeT = activeTrip.assignments.find((a: any) => a.role === 'T')
        const draftTName = draftT?.rawName || '—'
        const activeTName = activeT?.rawName || '—'

        if (draftTName !== activeTName) {
          changes.push(`راهبر کمکی T از "${activeTName}" به "${draftTName}"`)
        }

        const draftR = draftTrip.assignments.find((a) => a.role === 'R')
        const activeR = activeTrip.assignments.find((a: any) => a.role === 'R')
        const draftRName = draftR?.rawName || '—'
        const activeRName = activeR?.rawName || '—'

        if (draftRName !== activeRName) {
          changes.push(`راهبر کمکی R از "${activeRName}" به "${draftRName}"`)
        }

        if (changes.length > 0) {
          diffs.push({
            type: 'change',
            message: `تغییرات در سفر ردیف ${toFa(draftTrip.rowNo)} (${dirLabel}): ${changes.join(' | ')}`
          })
        }
      }
    })

    // 2. Check for deletions
    activeRosterTrips.forEach((activeTrip) => {
      const draftTrip = result.trips.find(
        (t) => t.rowNo === activeTrip.rowNo && t.direction === activeTrip.direction
      )
      const dirLabel = activeTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'مسیر رفت (شهرری ← تجریش)' : 'مسیر برگشت (تجریش ← شهرری)'

      if (!draftTrip) {
        diffs.push({
          type: 'delete',
          message: `سفر ردیف ${toFa(activeTrip.rowNo)}: قطار ${toFa(activeTrip.trainNumber || '—')} با ساعت خروج ${toFa(activeTrip.departureTime || '—')} در ${dirLabel} حذف شده است.`
        })
      }
    })

    return diffs
  }

  const matchStatusColors: Record<string, string> = {
    AUTO_MATCHED: 'bg-success/15 text-success border-success/30',
    MANUAL_MATCHED: 'bg-info/15 text-info border-info/30',
    NEEDS_REVIEW: 'bg-warning/15 text-warning border-warning/30',
    UNMATCHED: 'bg-critical/15 text-critical border-critical/30',
  }

  const matchStatusLabels: Record<string, string> = {
    AUTO_MATCHED: 'انطباق خودکار',
    MANUAL_MATCHED: 'تایید دستی',
    NEEDS_REVIEW: 'نیازمند بررسی',
    UNMATCHED: 'تطبیق نیافته',
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Layers className="size-6 text-accent" />
            سیستم پردازش و اعزام لوحه روزانه خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            آپلود لوحه، تطبیق راهبران، کنترل خستگی (Anti-Fatigue) و مدیریت زنده نوبت اعزام
          </p>
        </div>

        {/* Action controls */}
        <div className="flex gap-2">
          {activeMainTab === 'upload' && (
            <button
              onClick={() => setShowMapperSettings(!showMapperSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-xs text-foreground hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <Settings className="size-4" />
              نگاشت ستون‌ها (Visual Mapper)
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Selectors (§۱۳.۷) */}
      <div className="flex border-b border-outline-variant mb-2 gap-4">
        <button
          onClick={() => setActiveMainTab('upload')}
          className={cn(
            "pb-3 text-sm font-bold border-b-2 px-4 transition-all flex items-center gap-2 cursor-pointer",
            activeMainTab === 'upload'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <UploadCloud className="size-4" />
          بارگذاری و پردازش لوحه روزانه
        </button>
        <button
          onClick={() => setActiveMainTab('templates')}
          className={cn(
            "pb-3 text-sm font-bold border-b-2 px-4 transition-all flex items-center gap-2 cursor-pointer",
            activeMainTab === 'templates'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <Settings className="size-4" />
          مدیریت الگوها و قوانین خستگی
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm animate-in fade-in duration-200 ${notification.type === 'success'
            ? 'bg-success/15 border-success/30 text-success'
            : 'bg-critical/15 border-critical/30 text-critical'
            }`}
        >
          {notification.text}
        </div>
      )}

      {activeMainTab === 'upload' ? (
        <>
          {/* Visual Column Mapper Drawer / Panel */}
          {showMapperSettings && (
            <div className="bg-surface border border-accent/20 rounded-xl p-5 shadow-lg animate-in slide-in-from-top duration-300">
              <h2 className="text-sm font-bold text-accent mb-4 flex items-center gap-1.5 border-b border-border pb-2">
                <Settings className="size-4" />
                تنظیمات نگاشت ستون‌های جدول اکسل (قالب لوحه اعزام)
              </h2>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-container/30 border border-outline-variant/60 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <label htmlFor="templateSelect" className="text-xs font-semibold text-foreground whitespace-nowrap">انتخاب قالب لوحه:</label>
                  <select
                    id="templateSelect"
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-foreground outline-none cursor-pointer"
                  >
                    <option value="">-- انتخاب الگوی نگاشت --</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setSaveTemplateModalOpen(true)}
                  className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  ذخیره قالب فعلی به عنوان الگوی جدید
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Right Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                    <ArrowRightLeft className="size-3.5 text-accent" />
                    بلوک راست: جهت تجریش ← شهرری (شماره ستون در اکسل از 0)
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries({
                      'ردیف': [rightRowIdx, setRightRowIdx],
                      'شماره قطار': [rightTrainIdx, setRightTrainIdx],
                      'مشخصه حرکت (R)': [rightRIdx, setRightRIdx],
                      'شماره قطار (T)': [rightTIdx, setRightTIdx],
                      'راهبر H1': [rightH1Idx, setRightH1Idx],
                      'راهبر H2': [rightH2Idx, setRightH2Idx],
                      'کمکی T': [rightAssistTIdx, setRightAssistTIdx],
                      'کمکی R': [rightAssistRIdx, setRightAssistRIdx],
                      'زمان حرکت': [rightDepIdx, setRightDepIdx],
                      'زمان رسیدن': [rightArrIdx, setRightArrIdx]
                    }).map(([label, [val, setVal]]) => (
                      <div key={label}>
                        <label className="block text-[10px] text-foreground-muted mb-1">{label}</label>
                        <input
                          type="number"
                          value={val as number}
                          onChange={(e) => (setVal as any)(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Left Block */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                    <ArrowRightLeft className="size-3.5 text-accent" />
                    بلوک چپ: جهت شهرری ← تجریش (شماره ستون در اکسل از 0)
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries({
                      'ردیف': [leftRowIdx, setLeftRowIdx],
                      'شماره قطار': [leftTrainIdx, setLeftTrainIdx],
                      'مشخصه حرکت (R)': [leftRIdx, setLeftRIdx],
                      'شماره قطار (T)': [leftTIdx, setLeftTIdx],
                      'راهبر H1': [leftH1Idx, setLeftH1Idx],
                      'راهبر H2': [leftH2Idx, setLeftH2Idx],
                      'کمکی T': [leftAssistTIdx, setLeftAssistTIdx],
                      'کمکی R': [leftAssistRIdx, setLeftAssistRIdx],
                      'زمان حرکت': [leftDepIdx, setLeftDepIdx],
                      'زمان رسیدن': [leftArrIdx, setLeftArrIdx]
                    }).map(([label, [val, setVal]]) => (
                      <div key={label}>
                        <label className="block text-[10px] text-foreground-muted mb-1">{label}</label>
                        <input
                          type="number"
                          value={val as number}
                          onChange={(e) => (setVal as any)(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Sidebar Inputs */}
            <div className="lg:col-span-3 space-y-6">

              {/* File Upload card */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <UploadCloud className="size-4 text-accent" />
                  بارگذاری فایل لوحه (اکسل روزانه)
                </h2>

                <FileDrop
                  accept=".xlsx,.xls"
                  onFile={handleUpload}
                  onClear={() => {
                    setSelectedFile(null)
                    setResult(null)
                  }}
                  disabled={loading || confirmLoading}
                />
              </div>

              {/* Roster Metadata settings */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Calendar className="size-4 text-critical" />
                  پارامترهای پردازش لوحه
                </h2>

                <div className="relative">
                  <label className="block text-xs text-foreground-muted mb-1">تاریخ لوحه (شمسی)</label>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none flex items-center justify-between cursor-pointer hover:bg-surface-container-low/80 transition-colors"
                  >
                    <span className="font-bold text-accent font-mono">{toFa(jalaliDate)}</span>
                    <Calendar className="size-4 text-foreground-muted" />
                  </button>

                  {showDatePicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDatePicker(false)}
                      />
                      <div className="absolute right-0 mt-1 w-72 bg-surface-container-high border border-outline-variant rounded-xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200" dir="rtl">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={nextPickerMonth}
                            className="p-1 hover:bg-surface-container-highest rounded text-foreground cursor-pointer"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                          <span className="text-xs font-bold text-foreground">
                            {jalaliMonthNames[pickerMonth - 1]} {toFa(pickerYear)}
                          </span>
                          <button
                            type="button"
                            onClick={prevPickerMonth}
                            className="p-1 hover:bg-surface-container-highest rounded text-foreground cursor-pointer"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-foreground-muted mb-2">
                          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((wd, i) => (
                            <span key={wd} className={i === 6 ? 'text-critical font-bold' : ''}>
                              {wd}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: pickerStartWeekday }).map((_, i) => (
                            <span key={`empty-${i}`} />
                          ))}

                          {Array.from({ length: pickerDaysInMonth }).map((_, i) => {
                            const dayNo = i + 1
                            const formattedDay = String(dayNo).padStart(2, '0')
                            const formattedMonth = String(pickerMonth).padStart(2, '0')
                            const currentStr = `${pickerYear}/${formattedMonth}/${formattedDay}`
                            const isSelected = currentStr === jalaliDate
                            const isToday = currentStr === jdate().format('YYYY/MM/DD')

                            return (
                              <button
                                key={dayNo}
                                type="button"
                                onClick={() => {
                                  setJalaliDate(currentStr)
                                  setShowDatePicker(false)
                                }}
                                className={cn(
                                  "h-8 w-8 text-xs rounded-full flex items-center justify-center font-data-mono cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-accent text-accent-foreground font-bold"
                                    : isToday
                                      ? "border border-accent text-accent font-bold"
                                      : "hover:bg-surface-container-highest text-foreground"
                                )}
                              >
                                {toFa(dayNo)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              {result ? (
                <>
                  {/* Warnings and Issues notification box */}
                  {result.issues && result.issues.length > 0 && (
                    <div className="bg-surface border border-critical/30 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-critical flex items-center gap-1.5 border-b border-border pb-2">
                        <AlertTriangle className="size-4 animate-bounce" />
                        <span>تداخل‌ها و خطاهای شناسایی‌شده در لوحه روزانه ({toFa(result.issues.length)} مورد)</span>
                      </h3>

                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {result.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between text-xs p-2.5 rounded-lg border ${issue.severity === 'CRITICAL'
                              ? 'bg-critical/10 border-critical/30 text-critical'
                              : 'bg-warning/10 border-warning/30 text-warning'
                              }`}
                          >
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  {issue.severity}
                                </span>
                                <span className="font-medium">{issue.message}</span>
                              </div>
                              {issue.suggestedAction && (
                                <span className="text-[10px] text-foreground-muted mr-12 italic">
                                  پیشنهاد: {issue.suggestedAction}
                                </span>
                              )}
                            </div>
                            {issue.affectedTripId && (
                              <button
                                type="button"
                                onClick={() => handleHighlightTrip(issue.affectedTripId)}
                                className="mr-3 shrink-0 flex items-center gap-1 text-[10px] bg-accent/20 hover:bg-accent/30 text-accent font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                                title="مشاهده سطر خطا در جدول"
                              >
                                <Eye className="size-3" />
                                <span>مشاهده در جدول</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Roster Preview */}
                  <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">

                    {/* Header of preview card */}
                    <div className="p-4 border-b border-outline-variant bg-surface-container/30 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">پیش‌نویس استخراج لوحه اعزام</h2>
                        <p className="text-[10px] text-foreground-muted mt-1">
                          روز: {result.meta.jalaliDate} | عنوان: {result.meta.title} | نسخه لوحه: {toFa(result.versionNo)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setResult(null)}
                          className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs text-foreground hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          پاک کردن پیش‌نویس
                        </button>
                        <button
                          onClick={handlePublish}
                          disabled={confirmLoading}
                          className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {confirmLoading ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                          تایید و انتشار نهایی لوحه
                        </button>
                      </div>
                    </div>

                    {/* Outer Tabs: Preview Table vs Version Diff */}
                    <div className="px-4 pt-3 border-b border-outline-variant bg-surface-container/20 flex items-center justify-between no-print">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCompareTab('preview')}
                          className={cn(
                            "pb-3 text-xs font-bold border-b-2 px-4 transition-all flex items-center gap-1.5 cursor-pointer",
                            compareTab === 'preview'
                              ? "border-accent text-accent"
                              : "border-transparent text-foreground-muted hover:text-foreground"
                          )}
                        >
                          <Eye className="size-4" />
                          نمای جدول پیش‌نویس
                        </button>
                        <button
                          onClick={() => setCompareTab('diff')}
                          className={cn(
                            "pb-3 text-xs font-bold border-b-2 px-4 transition-all flex items-center gap-1.5 cursor-pointer relative",
                            compareTab === 'diff'
                              ? "border-accent text-accent"
                              : "border-transparent text-foreground-muted hover:text-foreground"
                          )}
                        >
                          <GitCompare className="size-4" />
                          <span>مقایسه با نسخه قبلی (Diff)</span>
                          {activeRosterTrips.length > 0 && (
                            <span className="absolute -top-1.5 -left-1 px-1.5 py-0.5 bg-accent text-[9px] text-accent-foreground rounded-full font-bold">
                              {toFa(activeRosterTrips.length)} سفر فعال
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {compareTab === 'diff' ? (
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <GitCompare className="size-5 text-accent animate-spin-slow" />
                            <h3 className="text-sm font-bold text-foreground">گزارش مقایسه تغییرات لوحه نسبت به نسخه فعال دیتابیس</h3>
                          </div>
                          <span className="text-[10px] text-foreground-muted">
                            تاریخ مقایسه: {toFa(result.meta.jalaliDate)}
                          </span>
                        </div>

                        {activeRosterTrips.length === 0 ? (
                          <div className="flex flex-col justify-center items-center py-10 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant text-center">
                            <Layers className="size-8 text-foreground-muted mb-2 animate-bounce" />
                            <p className="text-xs font-semibold text-foreground">نخستین انتشار لوحه روزانه</p>
                            <p className="text-[10px] text-foreground-muted mt-1 max-w-xs leading-relaxed">
                              هیچ نسخه منتشرشده‌ای برای این روز یافت نشد. تایید نهایی این پیش‌نویس، نسخه اول لوحه این تاریخ را ایجاد خواهد کرد.
                            </p>
                          </div>
                        ) : (() => {
                          const diffList = getRosterDifferences()
                          if (diffList.length === 0) {
                            return (
                              <div className="flex flex-col justify-center items-center py-10 bg-success/5 rounded-xl border border-dashed border-success/30 text-center">
                                <CheckCircle className="size-8 text-success mb-2" />
                                <p className="text-xs font-semibold text-success">هیچ تغییری یافت نشد</p>
                                <p className="text-[10px] text-foreground-muted mt-1 max-w-xs">
                                  پیش‌نویس بارگذاری شده کاملاً با نسخه فعال دیتابیس منطبق است.
                                </p>
                              </div>
                            )
                          }

                          return (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {diffList.map((diff, index) => {
                                let diffIcon = <ArrowRightLeft className="size-4" />
                                let diffColor = 'text-warning bg-warning/5 border-warning/20'

                                if (diff.type === 'add') {
                                  diffIcon = <CheckCircle className="size-4" />
                                  diffColor = 'text-success bg-success/5 border-success/20 font-bold'
                                } else if (diff.type === 'delete') {
                                  diffIcon = <AlertTriangle className="size-4" />
                                  diffColor = 'text-critical bg-critical/5 border-critical/20 font-bold'
                                }

                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-start gap-3 p-3 rounded-lg border text-xs leading-relaxed transition-all hover:bg-surface-container-high/20",
                                      diffColor
                                    )}
                                  >
                                    <span className="p-1 rounded-full bg-neutral-900 shadow-inner">
                                      {diffIcon}
                                    </span>
                                    <span>{diff.message}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}

                        {/* Notification Preview Panel (§۸.۳, §۱۳.۴) */}
                        {(() => {
                          const affected = (() => {
                            const set = new Set<string>()
                            if (!result) return []
                            result.trips.forEach((draftTrip) => {
                              const activeTrip = activeRosterTrips.find(
                                (t) => t.rowNo === draftTrip.rowNo && t.direction === draftTrip.direction
                              )
                              if (!activeTrip) {
                                draftTrip.assignments.forEach((a: any) => {
                                  if (a.rawName) set.add(a.rawName)
                                })
                              } else {
                                let hasChange = false
                                if (draftTrip.trainNumber !== activeTrip.trainNumber ||
                                  draftTrip.departureTime !== activeTrip.departureTime ||
                                  draftTrip.arrivalTime !== activeTrip.arrivalTime) {
                                  hasChange = true
                                }
                                ['H1', 'H2', 'T', 'R'].forEach((role) => {
                                  const draftName = draftTrip.assignments.find((a: any) => a.role === role)?.rawName || ''
                                  const activeName = activeTrip.assignments.find((a: any) => a.role === role)?.rawName || ''
                                  if (draftName !== activeName) {
                                    hasChange = true
                                    if (draftName) set.add(draftName)
                                    if (activeName) set.add(activeName)
                                  }
                                })
                                if (hasChange) {
                                  draftTrip.assignments.forEach((a: any) => {
                                    if (a.rawName) set.add(a.rawName)
                                  })
                                  activeTrip.assignments.forEach((a: any) => {
                                    if (a.rawName) set.add(a.rawName)
                                  })
                                }
                              }
                            })
                            activeRosterTrips.forEach((activeTrip) => {
                              const draftTrip = result.trips.find(
                                (t) => t.rowNo === activeTrip.rowNo && t.direction === activeTrip.direction
                              )
                              if (!draftTrip) {
                                activeTrip.assignments.forEach((a: any) => {
                                  if (a.rawName) set.add(a.rawName)
                                })
                              }
                            })
                            return Array.from(set)
                          })()

                          const diffList = getRosterDifferences()
                          const isFirstPublish = activeRosterTrips.length === 0
                          const hasChanges = diffList.length > 0

                          if (!isFirstPublish && !hasChanges) return null

                          return (
                            <div className="mt-6 border-t border-outline-variant pt-5 space-y-3">
                              <h4 className="text-xs font-bold text-accent flex items-center gap-1.5">
                                <Bell className="size-4" />
                                پیش‌نمایش اعلان‌های انتشار لوحه
                              </h4>

                              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">نوع اعلان:</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    isFirstPublish
                                      ? "bg-info/10 text-info border border-info/20"
                                      : "bg-warning/10 text-warning border border-warning/20"
                                  )}>
                                    {isFirstPublish ? 'همگانی (Bulk) - تمامی راهبران شیفت امروز' : 'هدفمند (Targeted) - فقط راهبران تغییریافته'}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-semibold text-foreground block mb-1">عنوان پیام:</span>
                                  <div className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg font-mono text-foreground">
                                    {isFirstPublish
                                      ? `لوحه اعزام ${result.meta.jalaliDate} منتشر شد`
                                      : `تغییر لوحه ${result.meta.jalaliDate} (نسخه ${result.versionNo})`
                                    }
                                  </div>
                                </div>

                                <div>
                                  <span className="font-semibold text-foreground block mb-1">متن پیام:</span>
                                  <div className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-foreground-muted">
                                    {isFirstPublish
                                      ? `لوحه اعزام روزانه نسخه ${result.versionNo} منتشر شد. لطفاً سفرهای خود را مشاهده و تأیید رؤیت کنید.`
                                      : `لوحه اعزام به‌روزرسانی شد: ${[
                                        diffList.filter(d => d.type === 'add').length > 0 ? `${toFa(diffList.filter(d => d.type === 'add').length)} سفر جدید` : '',
                                        diffList.filter(d => d.type === 'delete').length > 0 ? `${toFa(diffList.filter(d => d.type === 'delete').length)} سفر حذف شده` : '',
                                        diffList.filter(d => d.type === 'change').length > 0 ? `${toFa(diffList.filter(d => d.type === 'change').length)} سفر تغییریافته` : '',
                                      ].filter(Boolean).join('، ')}. لطفاً سفرهای خود را بررسی کنید.`
                                    }
                                  </div>
                                </div>

                                {!isFirstPublish && (
                                  <div>
                                    <span className="font-semibold text-foreground block mb-1">
                                      گیرندگان پیش‌بینی‌شده ({toFa(affected.length)} نفر):
                                    </span>
                                    <div className="flex flex-wrap gap-1 bg-surface border border-outline-variant p-2.5 rounded-lg max-h-24 overflow-y-auto">
                                      {affected.length === 0 ? (
                                        <span className="text-foreground-muted/50 italic text-[10px]">هیچ راهبری تغییر نکرده است.</span>
                                      ) : (
                                        affected.map(name => (
                                          <span key={name} className="px-2 py-0.5 bg-surface-container-highest text-foreground rounded text-[10px] border border-outline-variant">
                                            {name}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    ) : (
                      (() => {
                        const rowNos = Array.from(new Set(result.trips.map(t => t.rowNo))).sort((a, b) => a - b)
                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse text-[10px] print-table">
                              <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-foreground-muted text-[10px]">
                                  <th className="px-1.5 py-2 border border-outline-variant font-bold text-center" rowSpan={2}>ردیف</th>
                                  <th className="px-2 py-2 border border-outline-variant font-bold text-center bg-accent/5 text-accent" colSpan={10}>مسیر رفت: تجریش ← شهرری</th>
                                  <th className="px-2 py-2 border border-outline-variant font-bold text-center bg-info/5 text-info" colSpan={10}>مسیر برگشت: شهرری ← تجریش</th>
                                </tr>
                                <tr className="bg-surface-container-low border-b border-outline-variant text-foreground-muted text-[9px]">
                                  {/* Outbound Headers */}
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">شماره قطار</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">مشخصه حرکت</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">شماره قطار</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">H1</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">H2</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">T</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">R</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">زمان حرکت</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">زمان رسیدن</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">وضعیت</th>

                                  {/* Inbound Headers */}
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">شماره قطار</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">مشخصه حرکت</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">شماره قطار</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">H1</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">H2</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">T</th>
                                  <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">R</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">زمان حرکت</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">زمان رسیدن</th>
                                  <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">وضعیت</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-outline-variant">
                                {rowNos.map((rowNo) => {
                                  const rightTrip = result.trips.find(t => t.rowNo === rowNo && t.direction === 'TAJRISH_TO_SHAHRREY')
                                  const leftTrip = result.trips.find(t => t.rowNo === rowNo && t.direction === 'SHAHRREY_TO_TAJRISH')

                                  const rH1 = rightTrip?.assignments.find(a => a.role === 'H1')
                                  const rH2 = rightTrip?.assignments.find(a => a.role === 'H2')
                                  const rT = rightTrip?.assignments.find(a => a.role === 'T_TYPE')
                                  const rR = rightTrip?.assignments.find(a => a.role === 'R_CHAR')
                                  const rAssistT = rightTrip?.assignments.find(a => a.role === 'T')
                                  const rAssistR = rightTrip?.assignments.find(a => a.role === 'R')

                                  const lH1 = leftTrip?.assignments.find(a => a.role === 'H1')
                                  const lH2 = leftTrip?.assignments.find(a => a.role === 'H2')
                                  const lT = leftTrip?.assignments.find(a => a.role === 'T_TYPE')
                                  const lR = leftTrip?.assignments.find(a => a.role === 'R_CHAR')
                                  const lAssistT = leftTrip?.assignments.find(a => a.role === 'T')
                                  const lAssistR = leftTrip?.assignments.find(a => a.role === 'R')

                                  const rightStyles = getTripCellStyles(rightTrip, result.issues || [])
                                  const leftStyles = getTripCellStyles(leftTrip, result.issues || [])

                                  return (
                                    <tr key={rowNo} className="hover:bg-surface-container-high/10 transition-colors">
                                      <td className="px-1.5 py-1.5 text-center font-mono font-bold text-foreground-muted border border-outline-variant">{toFa(rowNo)}</td>

                                      {/* Outbound Trip cells */}
                                      <td className={cn("px-1 py-1.5 text-center font-bold font-mono text-accent border border-outline-variant", rightStyles.bgClass)}>
                                        {rightTrip ? toFa(rightTrip.trainNumber || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center border border-outline-variant", rightStyles.bgClass)}>
                                        {rightTrip ? (rR?.rawName || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center border border-outline-variant", rightStyles.bgClass)}>
                                        {rightTrip ? (rT?.rawName || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", rightStyles.bgClass)}>
                                        {rightTrip ? renderStagingAssignmentCell(rH1, 'H1') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", rightStyles.bgClass)}>
                                        {rightTrip ? renderStagingAssignmentCell(rH2, 'H2') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", rightStyles.bgClass)}>
                                        {rightTrip ? renderStagingAssignmentCell(rAssistT, 'T') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", rightStyles.bgClass)}>
                                        {rightTrip ? renderStagingAssignmentCell(rAssistR, 'R') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center font-mono border border-outline-variant", rightStyles.bgClass)}>
                                        {rightTrip?.departureTime ? (
                                          <span className="text-success font-bold text-[9px]">{toFa(rightTrip.departureTime.slice(0, 5))}</span>
                                        ) : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center font-mono border border-outline-variant", rightStyles.bgClass)}>
                                        {rightTrip?.arrivalTime ? (
                                          <span className="text-foreground-muted text-[9px]">{toFa(rightTrip.arrivalTime.slice(0, 5))}</span>
                                        ) : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-center", rightStyles.bgClass)}>
                                        {rightTrip ? (
                                          <div className="flex flex-wrap items-center justify-center gap-1">
                                            <span className={cn("px-1 py-0.2 border rounded-full text-[8px] font-bold shadow-sm", rightStyles.statusColor)}>
                                              {rightStyles.statusLabel}
                                            </span>
                                          </div>
                                        ) : '—'}
                                      </td>

                                      {/* Inbound Trip cells */}
                                      <td className={cn("px-1 py-1.5 text-center font-bold font-mono text-info border border-outline-variant", leftStyles.bgClass)}>
                                        {leftTrip ? toFa(leftTrip.trainNumber || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center border border-outline-variant", leftStyles.bgClass)}>
                                        {leftTrip ? (lR?.rawName || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center border border-outline-variant", leftStyles.bgClass)}>
                                        {leftTrip ? (lT?.rawName || '—') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", leftStyles.bgClass)}>
                                        {leftTrip ? renderStagingAssignmentCell(lH1, 'H1') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", leftStyles.bgClass)}>
                                        {leftTrip ? renderStagingAssignmentCell(lH2, 'H2') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", leftStyles.bgClass)}>
                                        {leftTrip ? renderStagingAssignmentCell(lAssistT, 'T') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-start", leftStyles.bgClass)}>
                                        {leftTrip ? renderStagingAssignmentCell(lAssistR, 'R') : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center font-mono border border-outline-variant", leftStyles.bgClass)}>
                                        {leftTrip?.departureTime ? (
                                          <span className="text-success font-bold text-[9px]">{toFa(leftTrip.departureTime.slice(0, 5))}</span>
                                        ) : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1.5 text-center font-mono border border-outline-variant", leftStyles.bgClass)}>
                                        {leftTrip?.arrivalTime ? (
                                          <span className="text-foreground-muted text-[9px]">{toFa(leftTrip.arrivalTime.slice(0, 5))}</span>
                                        ) : '—'}
                                      </td>
                                      <td className={cn("px-1 py-1 border border-outline-variant text-center", leftStyles.bgClass)}>
                                        {leftTrip ? (
                                          <div className="flex flex-wrap items-center justify-center gap-1">
                                            <span className={cn("px-1 py-0.2 border rounded-full text-[8px] font-bold shadow-sm", leftStyles.statusColor)}>
                                              {leftStyles.statusLabel}
                                            </span>
                                          </div>
                                        ) : '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </>
              ) : (
                /* Upload Prompt view */
                <div className="bg-surface border border-outline-variant rounded-xl flex flex-col justify-center items-center p-12 text-center min-h-[400px]">
                  <div className="size-16 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant text-foreground-muted mb-4 shadow-inner">
                    <FileText className="size-8 text-accent" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">لوحه‌ای برای پیش‌نمایش وجود ندارد</h3>
                  <p className="text-xs text-foreground-muted max-w-sm mt-2 leading-relaxed">
                    لطفاً ابتدا فایل اکسل لوحه روزانه را در بخش بارگذاری بکشید تا سیستم سفرها و نوبت‌ها را استخراج کند.
                  </p>
                </div>
              )}

              {/* History List */}
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="size-4 text-accent" />
                  تاریخچه لوحه‌های اعزام بارگذاری شده
                </h2>

                {historyLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="size-6 animate-spin text-accent" />
                  </div>
                ) : history.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 border border-outline-variant rounded-lg bg-surface-container-low/40"
                      >
                        <div>
                          <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                          <p className="text-[10px] text-foreground-muted mt-1">
                            تاریخ: {item.jalaliDate} | وضعیت سناریو: {item.schedulingTitle}
                          </p>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/15 border border-success/30 text-success">
                          منتشر شده
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted text-center py-4">هیچ لوحه‌ای قبلاً بارگذاری نشده است.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Template & Safety Rules Config Panel Tab (§۷, §۱۳.۷) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Right/Sidebar: Fatigue and Safety constraints config (§۷.۳) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="size-4 text-accent animate-pulse" />
                  حدود مرزی و قوانین خستگی (Anti-Fatigue)
                </h2>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  مقادیر پیش‌فرض بررسی خستگی راهبران مترو در زمان پردازش و آماده‌باش
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/60 rounded-lg p-2.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground">کنترل قوانین خستگی</label>
                    <span className="text-[9px] text-foreground-muted">بررسی تداخل‌ها و تکرارهای متوالی در زمان رندر</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={safetyWarningsEnabled}
                    onChange={(e) => setSafetyWarningsEnabled(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1">حداقل زمان استراحت بین سفرها (دقیقه)</label>
                  <input
                    type="number"
                    value={safetyRestBetweenTrips}
                    onChange={(e) => setSafetyRestBetweenTrips(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1">حداقل استراحت بین دو شیفت کاری (ساعت)</label>
                  <input
                    type="number"
                    value={safetyInterdayRestHours}
                    onChange={(e) => setSafetyInterdayRestHours(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1">حداکثر ساعت رانندگی روزانه مجاز (ساعت)</label>
                  <input
                    type="number"
                    value={safetyDailyDrivingHours}
                    onChange={(e) => setSafetyDailyDrivingHours(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1">حداکثر تعداد سفرهای متوالی بدون استراحت</label>
                  <input
                    type="number"
                    value={safetyConsecutiveTrips}
                    onChange={(e) => setSafetyConsecutiveTrips(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSafetyConfig}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <Save className="size-4" />
                  ثبت و اعمال قوانین خستگی
                </button>
              </div>
            </div>
          </div>

          {/* Left/Content: Templates list and Inline Editing panel (§۱۳.۷) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Roster Templates Manager Table */}
            <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
                <Settings className="size-4 text-accent" />
                الگوهای استخراج لوحه اعزام (Roster Templates)
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant text-foreground-muted font-bold">
                      <th className="py-2.5 px-3">نام الگو</th>
                      <th className="py-2.5 px-3">نوع فایل</th>
                      <th className="py-2.5 px-3">توضیحات</th>
                      <th className="py-2.5 px-3">وضعیت</th>
                      <th className="py-2.5 px-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tpl) => (
                      <tr key={tpl.id} className="border-b border-outline-variant/40 hover:bg-surface-container-low/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-foreground">{tpl.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold",
                            tpl.sourceType === 'PDF' ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "bg-success/15 text-success border border-success/30"
                          )}>
                            {tpl.sourceType || 'EXCEL'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-foreground-muted max-w-[200px] truncate">{tpl.description || '—'}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleTemplateActive(tpl.id, tpl.isActive !== false)}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border",
                              tpl.isActive !== false
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                                : "bg-neutral-800 text-foreground-muted border-outline-variant hover:bg-neutral-700"
                            )}
                          >
                            {tpl.isActive !== false ? 'فعال' : 'غیرفعال'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-left flex gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditingTemplateId(tpl.id)
                              setEditName(tpl.name)
                              setEditDesc(tpl.description || '')
                              setEditSourceType(tpl.sourceType || 'EXCEL')
                              setEditRightMapping(tpl.rightMapping || {
                                rowNoIndex: 0,
                                trainNumberIndex: 1,
                                rIndex: 2,
                                tIndex: 3,
                                h1Index: 4,
                                assistantTIndex: 5,
                                assistantRIndex: 6,
                                h2Index: 7,
                                departureTimeIndex: 8,
                                arrivalTimeIndex: 9,
                              })
                              setEditLeftMapping(tpl.leftMapping || {
                                rowNoIndex: 10,
                                trainNumberIndex: 11,
                                rIndex: 12,
                                tIndex: 13,
                                h1Index: 14,
                                assistantTIndex: 15,
                                assistantRIndex: 16,
                                h2Index: 17,
                                departureTimeIndex: 18,
                                arrivalTimeIndex: 19,
                              })
                              setEditPageWidth(tpl.pageWidth ?? 0)
                              setEditPageHeight(tpl.pageHeight ?? 0)
                              setEditRightBlock(tpl.rightBlock || { x: 0, y: 0, width: 0, height: 0 })
                              setEditLeftBlock(tpl.leftBlock || { x: 0, y: 0, width: 0, height: 0 })
                              setEditHeaderZones(tpl.headerZones ? JSON.stringify(tpl.headerZones, null, 2) : '[]')
                              setEditPdfColumns(tpl.pdfColumns ? JSON.stringify(tpl.pdfColumns, null, 2) : '[]')
                            }}
                            className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-foreground hover:bg-surface-container-high transition-colors cursor-pointer"
                          >
                            ویرایش الگو
                          </button>
                          {tpl.name !== 'الگوی استاندارد خط ۱' && (
                            <button
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="px-2.5 py-1 rounded bg-critical/10 border border-critical/20 text-critical hover:bg-critical/20 transition-colors cursor-pointer"
                            >
                              حذف الگو
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Template edit panel */}
            {editingTemplateId && (
              <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-5 animate-in slide-in-from-bottom duration-300">
                <h3 className="text-xs font-bold text-accent flex items-center gap-1.5 border-b border-border pb-2.5">
                  <Edit3 className="size-4" />
                  ویرایش جزئیات و نقشه نگاشت الگو: {editName}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-foreground-muted mb-1 font-semibold">نام الگو</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-foreground-muted mb-1 font-semibold">نوع قالب لوحه</label>
                    <select
                      value={editSourceType}
                      onChange={(e) => setEditSourceType(e.target.value as 'EXCEL' | 'PDF')}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
                    >
                      <option value="EXCEL">فایل اکسل (Excel)</option>
                      <option value="PDF">نقشه مختصاتی PDF</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-foreground-muted mb-1 font-semibold">توضیحات</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                    />
                  </div>
                </div>

                {/* Excel column mappings editor block */}
                {editSourceType === 'EXCEL' && (
                  <div className="border-t border-border-subtle/25 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-foreground">تنظیمات شاخص ستون‌های اکسل (شروع از 0)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Right Block mappings */}
                      <div className="bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/60 space-y-3">
                        <div className="text-[11px] font-bold text-accent">بلوک راست (تجریش ← شهرری)</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries({
                            'ردیف': 'rowNoIndex',
                            'شماره قطار': 'trainNumberIndex',
                            'مشخصه R': 'rIndex',
                            'قطار T': 'tIndex',
                            'راهبر H1': 'h1Index',
                            'راهبر H2': 'h2Index',
                            'کمکی T': 'assistantTIndex',
                            'کمکی R': 'assistantRIndex',
                            'زمان حرکت': 'departureTimeIndex',
                            'زمان رسیدن': 'arrivalTimeIndex'
                          }).map(([label, key]) => (
                            <div key={key}>
                              <label className="block text-[9px] text-foreground-muted mb-0.5">{label}</label>
                              <input
                                type="number"
                                value={editRightMapping[key] ?? 0}
                                onChange={(e) => setEditRightMapping({
                                  ...editRightMapping,
                                  [key]: parseInt(e.target.value, 10) || 0
                                })}
                                className="w-full bg-background border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Left Block mappings */}
                      <div className="bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/60 space-y-3">
                        <div className="text-[11px] font-bold text-accent">بلوک چپ (شهرری ← تجریش)</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries({
                            'ردیف': 'rowNoIndex',
                            'شماره قطار': 'trainNumberIndex',
                            'مشخصه R': 'rIndex',
                            'قطار T': 'tIndex',
                            'راهبر H1': 'h1Index',
                            'راهبر H2': 'h2Index',
                            'کمکی T': 'assistantTIndex',
                            'کمکی R': 'assistantRIndex',
                            'زمان حرکت': 'departureTimeIndex',
                            'زمان رسیدن': 'arrivalTimeIndex'
                          }).map(([label, key]) => (
                            <div key={key}>
                              <label className="block text-[9px] text-foreground-muted mb-0.5">{label}</label>
                              <input
                                type="number"
                                value={editLeftMapping[key] ?? 0}
                                onChange={(e) => setEditLeftMapping({
                                  ...editLeftMapping,
                                  [key]: parseInt(e.target.value, 10) || 0
                                })}
                                className="w-full bg-background border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF coordinate extraction editor block */}
                {editSourceType === 'PDF' && (
                  <div className="border-t border-border-subtle/25 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-foreground">تنظیمات مختصاتی استخراج PDF</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/60">
                      <div>
                        <label className="block text-[10px] text-foreground-muted mb-1">عرض کل صفحه (پیکسل)</label>
                        <input
                          type="number"
                          value={editPageWidth}
                          onChange={(e) => setEditPageWidth(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-background border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-foreground-muted mb-1">ارتفاع کل صفحه (پیکسل)</label>
                        <input
                          type="number"
                          value={editPageHeight}
                          onChange={(e) => setEditPageHeight(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-background border border-outline-variant rounded px-2 py-1 text-xs text-center text-foreground outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Right Block coordinates */}
                      <div className="bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/60 space-y-2">
                        <div className="text-[11px] font-bold text-accent">مختصات کادر راست &#123;x, y, w, h&#125;</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['x', 'y', 'width', 'height'].map((coord) => (
                            <div key={coord}>
                              <label className="block text-[9px] text-foreground-muted mb-0.5">{coord}</label>
                              <input
                                type="number"
                                value={editRightBlock[coord] ?? 0}
                                onChange={(e) => setEditRightBlock({
                                  ...editRightBlock,
                                  [coord]: parseInt(e.target.value, 10) || 0
                                })}
                                className="w-full bg-background border border-outline-variant rounded px-1.5 py-1 text-xs text-center text-foreground outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Left Block coordinates */}
                      <div className="bg-surface-container-low/50 p-3 rounded-lg border border-outline-variant/60 space-y-2">
                        <div className="text-[11px] font-bold text-accent">مختصات کادر چپ &#123;x, y, w, h&#125;</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['x', 'y', 'width', 'height'].map((coord) => (
                            <div key={coord}>
                              <label className="block text-[9px] text-foreground-muted mb-0.5">{coord}</label>
                              <input
                                type="number"
                                value={editLeftBlock[coord] ?? 0}
                                onChange={(e) => setEditLeftBlock({
                                  ...editLeftBlock,
                                  [coord]: parseInt(e.target.value, 10) || 0
                                })}
                                className="w-full bg-background border border-outline-variant rounded px-1.5 py-1 text-xs text-center text-foreground outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Header metadata zones JSON */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs text-foreground-muted font-semibold">محدوده‌های فراداده هدر (Header Zones JSON)</label>
                        <textarea
                          value={editHeaderZones}
                          onChange={(e) => setEditHeaderZones(e.target.value)}
                          rows={2}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2 text-xs text-foreground outline-none font-mono text-left font-data-mono"
                          placeholder="[{ label: 'date', box: {x: 10, y: 15, width: 80, height: 25} }]"
                        />
                      </div>

                      {/* PDF columns coordinates JSON */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-xs text-foreground-muted font-semibold">نقشه ستون‌های متنی PDF (PDF Columns Coordinates JSON)</label>
                        <textarea
                          value={editPdfColumns}
                          onChange={(e) => setEditPdfColumns(e.target.value)}
                          rows={2}
                          className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2 text-xs text-foreground outline-none font-mono text-left font-data-mono"
                          placeholder="[{ index: 0, xStart: 25, xEnd: 65, label: 'trainNumber' }]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => handleUpdateTemplate(editingTemplateId)}
                    disabled={!editName.trim()}

                    className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    ذخیره تغییرات الگو
                  </button>
                  <button
                    onClick={() => setEditingTemplateId('')}
                    className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Roster Parser Simulator */}
            <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2">
                <GitCompare className="size-4 text-accent animate-pulse" />
                شبیه‌ساز و تست زنده ستون‌های لوحه (Interactive Simulator)
              </h3>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                می‌توانید یک سطر کامل را از فایل اکسل کپی کرده و در کادر زیر بچسبانید تا نحوه خواندن آن با ساختار ستون‌های انتخابی را به‌صورت آنی مشاهده کنید:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-foreground-muted mb-1 font-bold">جداکننده ستون‌ها (Delimiter)</label>
                  <div className="flex gap-2">
                    {[
                      { key: 'tab', label: 'تب (Tab)' },
                      { key: 'comma', label: 'کاما (Comma)' },
                      { key: 'space', label: 'فضای خالی (Space)' }
                    ].map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setSimDelimiter(d.key as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors flex-1",
                          simDelimiter === d.key
                            ? "bg-accent/15 text-accent border-accent/40"
                            : "bg-surface-container border-outline-variant text-foreground-muted hover:bg-neutral-800"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-foreground-muted font-bold">سطر نمونه لوحه اکسل</label>
                <input
                  type="text"
                  value={simRawLine}
                  onChange={(e) => setSimRawLine(e.target.value)}
                  placeholder="مثال: 104  12  H1_User  T_User  ..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none font-mono text-left font-data-mono"
                />
              </div>

              {simParsedResult && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                  {/* Warning banner if array is too small */}
                  {simParsedResult.parts.length < Math.max(rightArrIdx, leftArrIdx) + 1 && (
                    <div className="p-3 bg-warning/15 border border-warning/35 rounded-lg text-warning text-xs flex items-start gap-2">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">تعداد ستون‌های سطر نمونه کمتر از حد نگاشت است!</p>
                        <p className="text-[10px] opacity-90 mt-0.5">
                          تعداد ستون‌های استخراج شده از سطر نمونه {toFa(simParsedResult.parts.length)} است، در حالی که بزرگترین شاخص ستون در نقشه شما {toFa(Math.max(rightArrIdx, leftArrIdx))} می‌باشد. لطفاً جداکننده یا مقادیر ورودی را بازبینی کنید.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Raw Parts parsed list */}
                  <div className="p-3 bg-neutral-950/40 rounded-lg border border-outline-variant/40 space-y-2">
                    <div className="text-[10px] font-bold text-foreground-muted">ستون‌های خام شناسایی شده (از چپ به راست):</div>
                    <div className="flex flex-wrap gap-1 font-data-mono text-[10px]">
                      {simParsedResult.parts.map((part, i) => (
                        <span key={i} className="bg-neutral-900 border border-border px-2 py-0.5 rounded text-foreground font-semibold">
                          [{toFa(i)}]: <span className="text-accent">{part || 'خالی'}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Simulated Right Block */}
                    <div className="bg-surface-container-low/60 border border-outline-variant rounded-lg p-3 space-y-2">
                      <div className="text-xs font-bold text-accent border-b border-border pb-1.5">خروجی تفکیک‌شده کادر راست (تجریش ← شهرری)</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                        {Object.entries({
                          'ردیف': [simParsedResult.right.rowNo, rightRowIdx],
                          'شماره قطار': [simParsedResult.right.trainNumber, rightTrainIdx],
                          'مشخصه R': [simParsedResult.right.r, rightRIdx],
                          'قطار T': [simParsedResult.right.t, rightTIdx],
                          'راهبر H1': [simParsedResult.right.h1, rightH1Idx],
                          'راهبر H2': [simParsedResult.right.h2, rightH2Idx],
                          'کمکی T': [simParsedResult.right.assistantT, rightAssistTIdx],
                          'کمکی R': [simParsedResult.right.assistantR, rightAssistRIdx],
                          'ساعت حرکت': [simParsedResult.right.departureTime, rightDepIdx],
                          'ساعت رسیدن': [simParsedResult.right.arrivalTime, rightArrIdx]
                        }).map(([label, [val, idx]]) => (
                          <div key={label} className="flex justify-between items-center py-1 border-b border-border/10">
                            <span className="text-foreground-muted">{label} (ستون {toFa(idx)}):</span>
                            <span className={cn(
                              "font-semibold font-data-mono",
                              val === '—' ? "text-foreground-muted/40" : "text-foreground"
                            )}>
                              {toFa(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Simulated Left Block */}
                    <div className="bg-surface-container-low/60 border border-outline-variant rounded-lg p-3 space-y-2">
                      <div className="text-xs font-bold text-accent border-b border-border pb-1.5">خروجی تفکیک‌شده کادر چپ (شهرری ← تجریش)</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                        {Object.entries({
                          'ردیف': [simParsedResult.left.rowNo, leftRowIdx],
                          'شماره قطار': [simParsedResult.left.trainNumber, leftTrainIdx],
                          'مشخصه R': [simParsedResult.left.r, leftRIdx],
                          'قطار T': [simParsedResult.left.t, leftTIdx],
                          'راهبر H1': [simParsedResult.left.h1, leftH1Idx],
                          'راهبر H2': [simParsedResult.left.h2, leftH2Idx],
                          'کمکی T': [simParsedResult.left.assistantT, leftAssistTIdx],
                          'کمکی R': [simParsedResult.left.assistantR, leftAssistRIdx],
                          'ساعت حرکت': [simParsedResult.left.departureTime, leftDepIdx],
                          'ساعت رسیدن': [simParsedResult.left.arrivalTime, leftArrIdx]
                        }).map(([label, [val, idx]]) => (
                          <div key={label} className="flex justify-between items-center py-1 border-b border-border/10">
                            <span className="text-foreground-muted">{label} (ستون {toFa(idx)}):</span>
                            <span className={cn(
                              "font-semibold font-data-mono",
                              val === '—' ? "text-foreground-muted/40" : "text-foreground"
                            )}>
                              {toFa(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {saveTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-96 shadow-xl animate-in zoom-in duration-200" dir="rtl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Settings className="size-4 text-accent" />
              ذخیره الگو به عنوان قالب جدید
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="tplName" className="block text-xs text-foreground-muted mb-1">نام الگوی جدید *</label>
                <input
                  type="text"
                  id="tplName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none"
                  placeholder="مثال: لوحه روزهای بارانی خط ۱"
                  maxLength={55}
                />
              </div>

              <div>
                <label htmlFor="tplDesc" className="block text-xs text-foreground-muted mb-1">توضیحات (اختیاری)</label>
                <textarea
                  id="tplDesc"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-xs text-foreground outline-none resize-none"
                  placeholder="توضیحات خلاصه در خصوص این قالب نگاشت..."
                  maxLength={250}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!newTemplateName.trim()}
                  className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ذخیره قالب
                </button>
                <button
                  onClick={() => {
                    setSaveTemplateModalOpen(false)
                    setNewTemplateName('')
                    setNewTemplateDesc('')
                  }}
                  className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
