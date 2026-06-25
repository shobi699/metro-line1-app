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
  Loader2
} from 'lucide-react'

interface ImportResult {
  rosterFileId: string
  successCount: number
  errorCount: number
  totalRows: number
  errors: Array<{ row: number; nationalId: string; reason: string }>
  needsReview: boolean
  rows?: Array<{ nationalId: string; name: string; date: string; code: string }>
}

interface RosterHistoryItem {
  id: string
  fileName: string
  period: string
  createdAt: string
  uploader: {
    name: string
  }
}

export default function RosterUploadPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [loading, setLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [rosterFileId, setRosterFileId] = useState<string | null>(null)
  const [history, setHistory] = useState<RosterHistoryItem[]>([])
  
  // Roster Metadata fields
  const [directiveNumber, setDirectiveNumber] = useState('DIR-1403-04-01')
  const [directiveSubject, setDirectiveSubject] = useState('')
  const [mandatoryReceipt, setMandatoryReceipt] = useState(true)

  // Notification status
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  async function loadHistory() {
    try {
      const res = await fetch('/api/roster/upload', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.data || [])
      }
    } catch {
      // silent
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (accessToken) {
      void loadHistory()
    }
  }, [accessToken])

  async function handleUpload(file: File) {
    setLoading(true)
    setResult(null)
    setRosterFileId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('directiveNumber', directiveNumber)
      formData.append('directiveSubject', directiveSubject)
      formData.append('mandatoryReceipt', String(mandatoryReceipt))

      const res = await fetch('/api/roster/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.data) {
        setResult(data.data)
        setRosterFileId(data.data.rosterFileId)
        setNotification({
          type: 'success',
          text: 'فایل با موفقیت استخراج و پیش‌نویس گردید. لطفاً برای نهایی شدن دکمه «تأیید و انتشار» را بزنید.',
        })
        loadHistory()
      } else {
        setResult({
          rosterFileId: '',
          successCount: 0,
          errorCount: 1,
          totalRows: 0,
          errors: [{ row: 0, nationalId: '', reason: data.error || 'خطا در بارگذاری فایل' }],
          needsReview: false,
          rows: [],
        })
      }
    } catch {
      setResult({
        rosterFileId: '',
        successCount: 0,
        errorCount: 1,
        totalRows: 0,
        errors: [{ row: 0, nationalId: '', reason: 'خطای سیستمی در آپلود فایل' }],
        needsReview: false,
        rows: [],
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle Roster Confirmation
  async function handleConfirmRoster() {
    if (!accessToken || !rosterFileId) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/roster/upload/${rosterFileId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: data.message || 'برنامه شیفت‌ها با موفقیت تأیید و منتشر گردید.',
        })
        setResult(null)
        setRosterFileId(null)
        loadHistory()
      } else {
        setNotification({
          type: 'error',
          text: data.error || 'خطا در انتشار لوحه شیفت',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور',
      })
    } finally {
      setConfirmLoading(false)
    }
  }

  const shiftLabels: Record<string, string> = {
    morning: 'صبح',
    evening: 'عصر',
    night: 'شب',
    off: 'استراحت',
  }

  const shiftColors: Record<string, string> = {
    morning: 'bg-success/15 text-success border-success/30',
    evening: 'bg-info/15 text-info border-info/30',
    night: 'bg-surface-container-highest text-foreground-muted border-outline-variant',
    off: 'bg-background-subtle text-foreground-muted border-border-subtle border-dashed',
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full" dir="rtl">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <UploadCloud className="size-6 text-accent" />
            مدیریت لوحه‌ها و ابلاغیه‌ها
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            بارگذاری، بررسی و انتشار برنامه شیفت پرسنل خط ۱ مترو
          </p>
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

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Directive Details */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* File Upload Zone */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <UploadCloud className="size-5 text-accent" />
              بارگذاری فایل لوحه
            </h2>
            
            <FileDrop
              accept=".xlsx,.xls"
              onFile={handleUpload}
              disabled={loading || confirmLoading}
            />

            <button
              onClick={() => {}}
              disabled={loading || confirmLoading}
              className="w-full mt-4 bg-accent text-accent-foreground font-medium text-sm py-2.5 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="size-4 animate-pulse" />
              استخراج هوشمند
            </button>
          </div>

          {/* Directive Details */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="size-5 text-critical" />
              جزئیات ابلاغیه
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">شماره ابلاغیه</label>
                <input
                  type="text"
                  value={directiveNumber}
                  onChange={(e) => setDirectiveNumber(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground-muted mb-1.5">موضوع ابلاغیه</label>
                <input
                  type="text"
                  placeholder="مثال: لوحه شیفت هفته سوم آذر"
                  value={directiveSubject}
                  onChange={(e) => setDirectiveSubject(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between mt-4 p-3 bg-surface-container-low/50 border border-outline-variant/80 rounded-lg">
                <span className="text-xs font-semibold text-foreground">تأیید رؤیت اجباری</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mandatoryReceipt}
                    onChange={(e) => setMandatoryReceipt(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-surface-container-low after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-foreground-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-accent-foreground"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Extraction Preview & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Extraction Preview */}
          <div className="bg-surface-container border border-outline-variant rounded-xl flex flex-col shadow-sm overflow-hidden min-h-[300px]">
            <div className="p-4 border-b border-outline-variant bg-surface-container/60 flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-foreground">پیش‌نمایش استخراج</h2>
                <p className="text-xs text-foreground-muted mt-0.5">بررسی ردیف‌های پردازش شده پیش از انتشار نهایی</p>
              </div>
              
              {result && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setResult(null)
                      setRosterFileId(null)
                    }}
                    disabled={confirmLoading}
                    className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs text-foreground hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    پاک کردن
                  </button>
                  <button 
                    onClick={handleConfirmRoster}
                    disabled={confirmLoading}
                    className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    {confirmLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                    تأیید و انتشار نهایی
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="size-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-foreground-muted font-medium">در حال پردازش فایل لوحه...</p>
                <p className="text-xs text-foreground-muted mt-1">تطبیق کدهای پرسنلی و کدهای شیفت با پایگاه‌داده</p>
              </div>
            ) : result ? (
              <div className="flex-1 flex flex-col">
                {/* Result Statistics */}
                <div className="grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant border-b border-outline-variant bg-surface-container-low/20">
                  <div className="p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{toFa(result.totalRows)}</div>
                    <div className="text-[10px] text-foreground-muted font-medium mt-0.5">کل ردیف‌ها</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-lg font-bold text-success">{toFa(result.successCount)}</div>
                    <div className="text-[10px] text-foreground-muted font-medium mt-0.5">پیش‌نویس موفق</div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="text-lg font-bold text-critical">{toFa(result.errorCount)}</div>
                    <div className="text-[10px] text-foreground-muted font-medium mt-0.5">دارای خطا</div>
                  </div>
                </div>

                {/* Successful Rows Table */}
                {result.rows && result.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead className="bg-surface-container-low/40 border-b border-outline-variant">
                        <tr>
                          <th className="px-4 py-2 text-xs font-semibold text-foreground-muted">کد ملی</th>
                          <th className="px-4 py-2 text-xs font-semibold text-foreground-muted">نام</th>
                          <th className="px-4 py-2 text-xs font-semibold text-foreground-muted">تاریخ</th>
                          <th className="px-4 py-2 text-xs font-semibold text-foreground-muted">کد شیفت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant bg-surface-container/10">
                        {result.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-foreground font-mono">{toFa(row.nationalId)}</td>
                            <td className="px-4 py-2.5 text-xs text-foreground">{row.name || 'نامشخص'}</td>
                            <td className="px-4 py-2.5 text-xs text-foreground font-mono">{toFa(row.date)}</td>
                            <td className="px-4 py-2.5 text-xs">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border rounded-sm ${shiftColors[row.code] ?? ''}`}>
                                {shiftLabels[row.code] || row.code}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Error Rows Report */}
                {result.errors.length > 0 && (
                  <div className="p-4 bg-critical/5 border-t border-outline-variant">
                    <h3 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="size-4" />
                      گزارش خطاهای استخراج (ردیف‌ها متعهد به پایگاه‌داده نشدند)
                    </h3>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-critical/10 border border-critical/20 rounded-lg p-2.5 text-xs text-critical">
                          <span className="font-mono bg-critical/10 border border-critical/30 px-1.5 py-0.5 rounded text-[10px]">
                            ردیف {toFa(err.row)}
                          </span>
                          <span className="flex-1 leading-relaxed">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="size-12 rounded-full bg-surface-container-low flex items-center justify-center border border-outline-variant text-foreground-muted mb-3">
                  <HelpCircle className="size-6" />
                </div>
                <p className="text-sm text-foreground-muted font-medium">فایلی بارگذاری نشده است</p>
                <p className="text-xs text-foreground-muted mt-1">یک فایل اکسل برنامه شیفت‌ها را در پنل سمت چپ بکشید یا انتخاب کنید</p>
              </div>
            )}
          </div>

          {/* History/Archive */}
          <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-critical" />
                تاریخچه لوحه‌های بارگذاری شده
              </h2>
            </div>
            
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-surface-container-high rounded flex items-center justify-center text-foreground-muted border border-outline-variant/50">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.fileName}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-foreground-muted">
                          <span>بارگذار: {item.uploader.name}</span>
                          <span>•</span>
                          <span className="font-mono">{toFa(new Date(item.createdAt).toLocaleDateString('fa-IR'))}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {idx === 0 ? (
                        <span className="px-2 py-0.5 bg-success/15 text-success border border-success/30 rounded text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> منتشر شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-surface-container-high text-foreground-muted border border-outline-variant rounded text-[10px] font-bold flex items-center gap-1">
                          <Archive className="size-3" /> بایگانی
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-foreground-muted text-center py-4">هیچ لوحه‌ای قبلاً بارگذاری نشده است.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
