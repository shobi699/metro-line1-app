'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import { HardDrive, AlertTriangle, CheckCircle, RefreshCw, Eye, Plus, Send, XCircle, FileText } from 'lucide-react'

interface EquipmentItem {
  id: string
  name: string
  serialNo: string
  assignedDate: string
  status: 'active' | 'damaged' | 'lost'
  category: string
}

interface ActionHistory {
  id: string
  itemName: string
  action: 'assign' | 'return' | 'report_damaged' | 'report_lost'
  date: string
  signature: string | null
}

export default function EquipmentPage() {
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [history, setHistory] = useState<ActionHistory[]>([])
  const [activeTab, setActiveTab] = useState<'my-items' | 'request-item' | 'history'>('my-items')

  // Modals
  const [reportingItem, setReportingItem] = useState<EquipmentItem | null>(null)
  const [reportType, setReportType] = useState<'damaged' | 'lost' | null>(null)
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  // Request Form
  const [reqCategory, setReqCategory] = useState('uniform')
  const [reqName, setReqName] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqSubmitting, setReqSubmitting] = useState(false)
  const [reqSuccess, setReqSuccess] = useState('')

  // Signature box
  const [signatureText, setSignatureText] = useState('')
  const [showSignatureBlock, setShowSignatureBlock] = useState(false)
  const [pendingConfirmItem, setPendingConfirmItem] = useState<string | null>(null)

  const defaultItems: EquipmentItem[] = [
    { id: 'eq-1', name: 'بی‌سیم دستی تترا Hytera', serialNo: 'TETRA-908123', assignedDate: '۱۴۰۴/۰۵/۱۰', status: 'active', category: 'radio' },
    { id: 'eq-2', name: 'لباس فرم کامل زمستانه (سایز L)', serialNo: 'UNIF-2026-L', assignedDate: '۱۴۰۴/۰۸/۱۵', status: 'active', category: 'uniform' },
    { id: 'eq-3', name: 'چراغ قوه عملیاتی ضد انفجار', serialNo: 'FLSH-30219', assignedDate: '۱۴۰۴/۰۵/۱۰', status: 'active', category: 'safety' },
    { id: 'eq-4', name: 'کارت پرسنلی مگنتیک خط ۱', serialNo: 'ID-00901', assignedDate: '۱۴۰۳/۱۲/۰۱', status: 'active', category: 'id_card' },
  ]

  const defaultHistory: ActionHistory[] = [
    { id: 'hist-1', itemName: 'کارت پرسنلی مگنتیک خط ۱', action: 'assign', date: '۱۴۰۳/۱۲/۰۱', signature: 'امضا شده دیجیتال' },
    { id: 'hist-2', itemName: 'چراغ قوه عملیاتی ضد انفجار', action: 'assign', date: '۱۴۰۴/۰۵/۱۰', signature: 'امضا شده دیجیتال' },
    { id: 'hist-3', itemName: 'بی‌سیم دستی تترا Hytera', action: 'assign', date: '۱۴۰۴/۰۵/۱۰', signature: 'امضا شده دیجیتال' },
    { id: 'hist-4', itemName: 'لباس فرم کامل زمستانه (سایز L)', action: 'assign', date: '۱۴۰۴/۰۸/۱۵', signature: 'امضا شده دیجیتال' },
  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedItems = window.localStorage.getItem('metro_eq_items')
      const savedHistory = window.localStorage.getItem('metro_eq_hist')
      if (savedItems) setItems(JSON.parse(savedItems))
      else {
        setItems(defaultItems)
        window.localStorage.setItem('metro_eq_items', JSON.stringify(defaultItems))
      }

      if (savedHistory) setHistory(JSON.parse(savedHistory))
      else {
        setHistory(defaultHistory)
        window.localStorage.setItem('metro_eq_hist', JSON.stringify(defaultHistory))
      }
    }
  }, [])

  // Handle report submission
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingItem || !reportType) return
    setSubmittingReport(true)

    // Update item status
    const updatedItems = items.map(item => {
      if (item.id === reportingItem.id) {
        return { ...item, status: reportType }
      }
      return item
    })
    setItems(updatedItems)
    window.localStorage.setItem('metro_eq_items', JSON.stringify(updatedItems))

    // Add to history
    const newHist: ActionHistory = {
      id: `hist-${Date.now()}`,
      itemName: reportingItem.name,
      action: reportType === 'damaged' ? 'report_damaged' : 'report_lost',
      date: jalali(new Date().toISOString()),
      signature: null
    }
    const updatedHist = [newHist, ...history]
    setHistory(updatedHist)
    window.localStorage.setItem('metro_eq_hist', JSON.stringify(updatedHist))

    setTimeout(() => {
      setSubmittingReport(false)
      setReportingItem(null)
      setReportType(null)
      setReportDescription('')
    }, 800)
  }

  // Handle new equipment request
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqName.trim()) return
    setReqSubmitting(true)

    setTimeout(() => {
      setReqSuccess('درخواست شما با موفقیت ثبت شد و در صف بررسی واحد تدارکات و انبار خط ۱ قرار گرفت.')
      setReqName('')
      setReqReason('')
      setReqSubmitting(false)
      setTimeout(() => setReqSuccess(''), 4000)
    }, 1000)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return { label: 'در دست پرسنل', color: 'bg-success/15 text-success border-success/30' }
      case 'damaged': return { label: 'اعلام خرابی', color: 'bg-warning/15 text-warning border-warning/30' }
      case 'lost': return { label: 'گزارش مفقودی', color: 'bg-critical/15 text-critical border-critical/30' }
      default: return { label: 'نامشخص', color: 'bg-neutral-800 text-foreground-muted' }
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'assign': return 'تحویل اقلام'
      case 'return': return 'عودت اقلام'
      case 'report_damaged': return 'اعلام خرابی'
      case 'report_lost': return 'گزارش مفقودی'
      default: return action
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <HardDrive className="size-6 text-accent" />
          مدیریت تجهیزات انفرادی
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          رهگیری، درخواست تحویل، ثبت خرابی و مفقودی بی‌سیم، لباس فرم و تجهیزات عملیاتی خط ۱ مترو
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('my-items')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'my-items'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          اقلام در اختیار من
        </button>
        <button
          onClick={() => setActiveTab('request-item')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'request-item'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          درخواست تجهیزات جدید
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          تاریخچه تحویل و سوابق
        </button>
      </div>

      {/* MY ITEMS TAB */}
      {activeTab === 'my-items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const statusCfg = getStatusLabel(item.status)
            return (
              <Card key={item.id} className="flex flex-col justify-between border-accent/10">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{item.name}</span>
                    <Badge variant="outline" className={`text-[10px] border px-2 py-0.5 rounded ${statusCfg.color}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-foreground-muted space-y-1.5 font-data-mono">
                    <p>شماره سریال: <strong className="text-foreground">{item.serialNo}</strong></p>
                    <p>تاریخ تحویل: <strong className="text-foreground">{toFa(item.assignedDate)}</strong></p>
                  </div>
                </div>

                {item.status === 'active' && (
                  <div className="p-3 bg-surface-container-low border-t border-border/40 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReportingItem(item)
                        setReportType('damaged')
                      }}
                      className="h-7 text-[10px] font-bold border-warning/40 text-warning hover:bg-warning/10 cursor-pointer"
                    >
                      <AlertTriangle className="size-3.5 me-0.5" />
                      گزارش خرابی
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReportingItem(item)
                        setReportType('lost')
                      }}
                      className="h-7 text-[10px] font-bold border-critical/40 text-critical hover:bg-critical/10 cursor-pointer"
                    >
                      <XCircle className="size-3.5 me-0.5" />
                      گزارش مفقودی
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* REQUEST ITEM TAB */}
      {activeTab === 'request-item' && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold">درخواست تجهیزات جدید یا جایگزین</CardTitle>
            <CardDescription>فرم زیر را جهت ارجاع به واحد تدارکات و انبار خط ۱ پر کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            {reqSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-bold flex items-center gap-2">
                <CheckCircle className="size-4" />
                <span>{reqSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category" className="text-xs font-bold">دسته‌بندی تجهیزات</Label>
                <select
                  id="category"
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="uniform">لباس فرم و کفش کار</option>
                  <option value="radio">بی‌سیم تترا و باطری</option>
                  <option value="safety">تجهیزات ایمنی (جلیقه، کلاه، چراغ قوه)</option>
                  <option value="stationery">دفترچه‌ها و فرم‌های ثبت گزارش</option>
                </select>
              </div>

              <div>
                <Label htmlFor="item-name" className="text-xs font-bold">نام دقیق یا سایز قطعه مورد نیاز <span className="text-critical">*</span></Label>
                <Input
                  id="item-name"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="مثال: باتری زاپاس بی‌سیم تترا Hytera"
                  className="mt-1.5 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason" className="text-xs font-bold">علت درخواست</Label>
                <textarea
                  id="reason"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="دلیل نیاز به تجهیزات جدید یا جایگزین..."
                  rows={4}
                  className="mt-1.5 flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={reqSubmitting} className="font-bold text-xs h-8">
                  {reqSubmitting ? 'در حال ارسال...' : 'ثبت درخواست تحویل'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <FileText className="size-4.5 text-accent" />
              سوابق تحویل، عودت و حوادث تجهیزات
            </CardTitle>
            <CardDescription>تاریخچه کامل تراکنش‌های تجهیزاتی شما در خط ۱:</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {history.map((hist) => (
                <div
                  key={hist.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-lg border border-border/40 bg-surface-container-low gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-foreground block">{hist.itemName}</span>
                    <div className="flex items-center gap-2 text-[10px] text-foreground-muted font-data-mono">
                      <span>عملکرد: {getActionLabel(hist.action)}</span>
                      <span>تاریخ: {toFa(hist.date)}</span>
                    </div>
                  </div>
                  
                  <div>
                    {hist.signature ? (
                      <Badge className="bg-success/10 text-success border border-success/30 text-[9px] px-2 py-0.5 rounded font-bold">
                        {hist.signature}
                      </Badge>
                    ) : (
                      <Badge className="bg-neutral-800 text-foreground-muted text-[9px] px-2 py-0.5 rounded">
                        فاقد امضا
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* REPORT DAMAGE/LOST MODAL */}
      {reportingItem && reportType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
              <AlertTriangle className={`size-5 ${reportType === 'damaged' ? 'text-warning' : 'text-critical'}`} />
              <h3 className="font-bold text-base text-foreground">
                {reportType === 'damaged' ? 'ثبت گزارش خرابی تجهیزات' : 'ثبت گزارش مفقودی تجهیزات'}
              </h3>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed mb-3">
              شما در حال ثبت گزارش برای <strong className="text-foreground">{reportingItem.name}</strong> با شماره سریال <strong className="text-accent font-data-mono">{reportingItem.serialNo}</strong> هستید.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <Label htmlFor="report-desc" className="text-xs font-bold">توضیحات و شرح حادثه <span className="text-critical">*</span></Label>
                <textarea
                  id="report-desc"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={reportType === 'damaged' ? 'نحوه خرابی و آسیب‌های وارده را شرح دهید...' : 'مکان و نحوه مفقود شدن قطعه را شرح دهید...'}
                  rows={4}
                  className="mt-1.5 flex w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReportingItem(null)
                    setReportType(null)
                    setReportDescription('')
                  }}
                  className="h-8 text-xs font-bold"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReport}
                  variant={reportType === 'damaged' ? 'default' : 'destructive'}
                  className="h-8 text-xs font-bold"
                >
                  {submittingReport ? 'در حال ثبت...' : 'ثبت نهایی گزارش'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
