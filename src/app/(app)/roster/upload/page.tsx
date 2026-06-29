'use client'

import { useState, useEffect } from 'react'
import { FileDrop } from '@/components/shared/file-drop'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
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
  ArrowRightLeft,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

interface TripAssignment {
  id: string
  tripId: string
  role: 'H1' | 'H2' | 'T' | 'R'
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
  const [jalaliDate, setJalaliDate] = useState('1404/07/16')
  const [rosterTitle, setRosterTitle] = useState('گزارش لوحه اعزام روزانه')
  const [schedulingTitle, setSchedulingTitle] = useState('روز عادی (پیک شلوغی)')
  const [processingNumber, setProcessingNumber] = useState(7)
  const [activeDirectionTab, setActiveDirectionTab] = useState<'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'>('SHAHRREY_TO_TAJRISH')
  
  // Visual Mapper Settings state
  const [showMapperSettings, setShowMapperSettings] = useState(false)
  
  // Right block mapper indexes (SHAHRREY_TO_TAJRISH)
  const [rightRowIdx, setRightRowIdx] = useState(0)
  const [rightTrainIdx, setRightTrainIdx] = useState(1)
  const [rightRIdx, setRightRIdx] = useState(2)
  const [rightTIdx, setRightTIdx] = useState(3)
  const [rightH1Idx, setRightH1Idx] = useState(4)
  const [rightH2Idx, setRightH2Idx] = useState(7)
  const [rightDepIdx, setRightDepIdx] = useState(8)
  const [rightArrIdx, setRightArrIdx] = useState(9)

  // Left block mapper indexes (TAJRISH_TO_SHAHRREY)
  const [leftRowIdx, setLeftRowIdx] = useState(10)
  const [leftTrainIdx, setLeftTrainIdx] = useState(11)
  const [leftRIdx, setLeftRIdx] = useState(12)
  const [leftTIdx, setLeftTIdx] = useState(13)
  const [leftH1Idx, setLeftH1Idx] = useState(14)
  const [leftH2Idx, setLeftH2Idx] = useState(17)
  const [leftDepIdx, setLeftDepIdx] = useState(18)
  const [leftArrIdx, setLeftArrIdx] = useState(19)

  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

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
      const res = await fetch('/api/users?pageSize=200', {
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

  useEffect(() => {
    if (accessToken) {
      void loadHistory()
      void loadUsers()
    }
  }, [accessToken])

  // Handle uploading and parsing
  async function handleUpload(file: File) {
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jalaliDate', jalaliDate)
      formData.append('title', rosterTitle)
      formData.append('schedulingTitle', schedulingTitle)
      formData.append('processingNumber', String(processingNumber))

      // Custom column mappings
      formData.append('rightRowIndex', String(rightRowIdx))
      formData.append('rightTrainIndex', String(rightTrainIdx))
      formData.append('rightRIndex', String(rightRIdx))
      formData.append('rightTIndex', String(rightTIdx))
      formData.append('rightH1Index', String(rightH1Idx))
      formData.append('rightH2Index', String(rightH2Idx))
      formData.append('rightDepartureTimeIndex', String(rightDepIdx))
      formData.append('rightArrivalTimeIndex', String(rightArrIdx))

      formData.append('leftRowIndex', String(leftRowIdx))
      formData.append('leftTrainIndex', String(leftTrainIdx))
      formData.append('leftRIndex', String(leftRIdx))
      formData.append('leftTIndex', String(leftTIdx))
      formData.append('leftH1Index', String(leftH1Idx))
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
            <Layers className="size-6 text-accent animate-pulse" />
            سیستم پردازش و اعزام لوحه روزانه خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            آپلود لوحه، تطبیق راهبران، کنترل خستگی (Anti-Fatigue) و مدیریت زنده نوبت اعزام
          </p>
        </div>

        {/* Action controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowMapperSettings(!showMapperSettings)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high border border-outline-variant rounded-lg text-xs text-foreground hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <Settings className="size-4" />
            نگاشت ستون‌ها (Visual Mapper)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-success/15 border-success/30 text-success'
              : 'bg-critical/15 border-critical/30 text-critical'
          }`}
        >
          {notification.text}
        </div>
      )}

      {/* Visual Column Mapper Drawer / Panel */}
      {showMapperSettings && (
        <div className="bg-surface border border-accent/20 rounded-xl p-5 shadow-lg animate-in slide-in-from-top duration-300">
          <h2 className="text-sm font-bold text-accent mb-4 flex items-center gap-1.5 border-b border-border pb-2">
            <Settings className="size-4" />
            تنظیمات نگاشت ستون‌های جدول اکسل (قالب لوحه اعزام)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Right Block */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                <ArrowRightLeft className="size-3.5 text-accent" />
                بلوک راست: جهت شهرری ← تجریش (شماره ستون در اکسل از 0)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries({
                  'ردیف': [rightRowIdx, setRightRowIdx],
                  'شماره قطار': [rightTrainIdx, setRightTrainIdx],
                  'کمکی R': [rightRIdx, setRightRIdx],
                  'توضیح T': [rightTIdx, setRightTIdx],
                  'راهبر H1': [rightH1Idx, setRightH1Idx],
                  'راهبر H2': [rightH2Idx, setRightH2Idx],
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
                بلوک چپ: جهت تجریش ← شهرری (شماره ستون در اکسل از 0)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries({
                  'ردیف': [leftRowIdx, setLeftRowIdx],
                  'شماره قطار': [leftTrainIdx, setLeftTrainIdx],
                  'کمکی R': [leftRIdx, setLeftRIdx],
                  'توضیح T': [leftTIdx, setLeftTIdx],
                  'راهبر H1': [leftH1Idx, setLeftH1Idx],
                  'راهبر H2': [leftH2Idx, setLeftH2Idx],
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
              disabled={loading || confirmLoading}
            />
          </div>

          {/* Roster Metadata settings */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Calendar className="size-4 text-critical" />
              پارامترهای پردازش لوحه
            </h2>
            
            <div>
              <label className="block text-xs text-foreground-muted mb-1">تاریخ لوحه (شمسی)</label>
              <input
                type="text"
                value={jalaliDate}
                onChange={(e) => setJalaliDate(e.target.value)}
                placeholder="1404/07/16"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-foreground-muted mb-1">عنوان لوحه</label>
              <input
                type="text"
                value={rosterTitle}
                onChange={(e) => setRosterTitle(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-foreground-muted mb-1">نوع جدول زمان‌بندی (سناریو)</label>
              <input
                type="text"
                value={schedulingTitle}
                onChange={(e) => setSchedulingTitle(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-foreground-muted mb-1">شماره پردازش نوبت</label>
              <input
                type="number"
                value={processingNumber}
                onChange={(e) => setProcessingNumber(parseInt(e.target.value, 10) || 7)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-foreground font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Preview and Issues Pane */}
        <div className="lg:col-span-9 space-y-6">
          
          {loading ? (
            <div className="bg-surface-container border border-outline-variant rounded-xl flex flex-col justify-center items-center p-12 text-center min-h-[400px]">
              <Loader2 className="size-8 animate-spin text-accent mb-4" />
              <p className="text-sm font-semibold text-foreground">در حال استخراج هوشمند و پردازش لوحه قطارها...</p>
              <p className="text-xs text-foreground-muted mt-2">تطبیق فازی اسامی راهبران، اعتبارسنجی تداخل‌های زمانی و قوانین ایمنی خستگی</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              
              {/* Validation Warnings (Anti-Fatigue / Overlaps) */}
              {result.issues && result.issues.length > 0 && (
                <div className="bg-critical/5 border border-critical/20 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-critical flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="size-4" />
                    هشدارهای امنیتی و خستگی پرسنل (لوحه نهایی متعهد نخواهد شد تا رفع موارد بحرانی)
                  </h3>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {result.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start justify-between text-xs p-2.5 rounded-lg border ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-critical/10 border-critical/30 text-critical'
                            : 'bg-warning/10 border-warning/30 text-warning'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-[10px]">
                            {issue.severity}
                          </span>
                          <span>{issue.message}</span>
                        </div>
                        {issue.suggestedAction && (
                          <span className="text-[10px] text-foreground-muted italic">
                            پیشنهاد: {issue.suggestedAction}
                          </span>
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

                {/* Tab layout for direction */}
                <div className="flex border-b border-outline-variant bg-surface-container/10">
                  <button
                    onClick={() => setActiveDirectionTab('SHAHRREY_TO_TAJRISH')}
                    className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeDirectionTab === 'SHAHRREY_TO_TAJRISH'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <ArrowUpRight className="size-4" />
                    سمت راست: شهرری ← تجریش
                  </button>
                  <button
                    onClick={() => setActiveDirectionTab('TAJRISH_TO_SHAHRREY')}
                    className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeDirectionTab === 'TAJRISH_TO_SHAHRREY'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    <ArrowDownLeft className="size-4" />
                    سمت چپ: تجریش ← شهرری
                  </button>
                </div>

                {/* Trips Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-surface-container-low border-b border-outline-variant text-foreground-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">ردیف</th>
                        <th className="px-4 py-2.5 font-bold">شماره قطار</th>
                        <th className="px-4 py-2.5 font-bold">حرکت / رسیدن</th>
                        <th className="px-4 py-2.5 font-bold">راهبر اول (H1)</th>
                        <th className="px-4 py-2.5 font-bold">راهبر دوم (H2)</th>
                        <th className="px-4 py-2.5 font-bold">وضعیت عملیاتی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {result.trips
                        .filter(t => t.direction === activeDirectionTab)
                        .map((trip, idx) => {
                          const h1 = trip.assignments.find(a => a.role === 'H1')
                          const h2 = trip.assignments.find(a => a.role === 'H2')
                          
                          return (
                            <tr key={idx} className="hover:bg-surface-container-high/35 transition-colors">
                              <td className="px-4 py-3 font-mono text-foreground-muted">{toFa(trip.rowNo)}</td>
                              <td className="px-4 py-3 font-bold font-mono text-accent">{toFa(trip.trainNumber || '—')}</td>
                              <td className="px-4 py-3 font-mono">
                                <span className="text-success font-semibold">{toFa(trip.departureTime || '')}</span>
                                <span className="text-foreground-muted mx-1">←</span>
                                <span className="text-foreground-muted">{toFa(trip.arrivalTime || '')}</span>
                              </td>
                              
                              {/* H1 Driver matching column */}
                              <td className="px-4 py-2.5">
                                {h1 ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-foreground">{h1.rawName}</span>
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={h1.matchedUserId || ''}
                                        onChange={(e) => handleReassignDriver(h1.id, e.target.value)}
                                        className="bg-surface-container border border-outline-variant rounded px-1.5 py-0.5 text-[10px] text-foreground outline-none cursor-pointer"
                                      >
                                        <option value="">تخصیص دستی...</option>
                                        {allUsers.map(u => (
                                          <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                      </select>
                                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold border rounded-sm ${matchStatusColors[h1.matchStatus]}`}>
                                        {matchStatusLabels[h1.matchStatus]}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-foreground-muted italic text-[10px]">تخصیص نیافته</span>
                                )}
                              </td>

                              {/* H2 Driver matching column */}
                              <td className="px-4 py-2.5">
                                {h2 ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-foreground">{h2.rawName}</span>
                                    <div className="flex items-center gap-1.5">
                                      <select
                                        value={h2.matchedUserId || ''}
                                        onChange={(e) => handleReassignDriver(h2.id, e.target.value)}
                                        className="bg-surface-container border border-outline-variant rounded px-1.5 py-0.5 text-[10px] text-foreground outline-none cursor-pointer"
                                      >
                                        <option value="">تخصیص دستی...</option>
                                        {allUsers.map(u => (
                                          <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                      </select>
                                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold border rounded-sm ${matchStatusColors[h2.matchStatus]}`}>
                                        {matchStatusLabels[h2.matchStatus]}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-foreground-muted italic text-[10px]">کابین تک راهبر</span>
                                )}
                              </td>

                              <td className="px-4 py-3">
                                {trip.operationalNote ? (
                                  <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] text-accent">
                                    {trip.operationalNote}
                                  </span>
                                ) : (
                                  <span className="text-foreground-muted">نرمال</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
    </div>
  )
}
