'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import {
  ClipboardCheck,
  CheckCircle,
  History,
  Shield,
  Plus,
  Trash,
  Info,
  AlertTriangle,
  Train,
  Wrench,
  Lock,
  ChevronRight,
  MapPin,
  Check,
  X,
  Camera,
  Signature,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react'

interface ChecklistItem {
  label: string
  required: boolean
  requirePhoto?: boolean // آیا ثبت عکس برای این المان الزامی است؟
}

interface Template {
  id: string
  name: string
  trainType: 'سری ۱۰۰' | 'سری ۳۰۰' | 'AC/DC' // چک‌لیست وابسته به نوع قطار — بخش ۱۲.۳
  stationLocation: string // چک‌لیست وابسته به ایستگاه/دپو — بخش ۱۲.۳
  description: string | null
  items: ChecklistItem[]
}

interface ChecklistRecord {
  id: string
  templateId: string
  templateName: string
  trainType: string
  items: Array<{ label: string; checked: boolean; note?: string; photoAttached?: boolean }>
  signedAt: string
  trainId: string
  stationId: string
  geoLocation: string
  completionTimeSeconds: number // زمان تکمیل جهت رد گیری پر کردن صوری
  digitalSignaturePin: string
  reporterName: string
  autoTicketGenerated?: boolean // آیا تیکت خرابی خودکار ایجاد شد؟
}

const LINE1_STATIONS = [
  'دپوی کهریزک',
  'تجریش',
  'قلهک',
  'دروازه دولت',
  'امام خمینی',
  'شهر ری',
  'کهریزک'
]

const SAMPLE_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    name: 'چک‌لیست پیش از حرکت واگن‌های قدیمی سری ۱۰۰',
    trainType: 'سری ۱۰۰',
    stationLocation: 'دپوی کهریزک',
    description: 'بازرسی‌های هیدرولیکی، فشار مخازن باد اصلی و تست کمپرسورهای مکانیکی سری ۱۰۰.',
    items: [
      { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true, requirePhoto: false },
      { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true, requirePhoto: true },
      { label: 'کنترل کارکرد صحیح چراغ‌های سیگنال کابین راهبری', required: true, requirePhoto: false },
      { label: 'تست فیزیکی بایکوت درب واگن شماره ۲', required: false, requirePhoto: true }
    ]
  },
  {
    id: 'tpl-2',
    name: 'چک‌لیست شبیه‌ساز قطارهای هوشمند سری ۳۰۰',
    trainType: 'سری ۳۰۰',
    stationLocation: 'تجریش',
    description: 'کالیبره مانیتورهای کابین و ارتباط بی‌سیم دیسپاچینگ سری ۳۰۰.',
    items: [
      { label: 'تست مانیتورینگ سیگنال خط کابین جلو', required: true, requirePhoto: false },
      { label: 'تست سیستم تتا (بی‌سیم هماهنگی OCC)', required: true, requirePhoto: false },
      { label: 'کنترل فیزیکی کپسول‌های اطفای حریق کابین', required: false, requirePhoto: true }
    ]
  }
]

const SAMPLE_HISTORY: ChecklistRecord[] = [
  {
    id: 'rec-1',
    templateId: 'tpl-1',
    templateName: 'چک‌لیست پیش از حرکت واگن‌های قدیمی سری ۱۰۰',
    trainType: 'سری ۱۰۰',
    items: [
      { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', checked: true },
      { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', checked: true, photoAttached: true },
      { label: 'کنترل کارکرد صحیح چراغ‌های سیگنال کابین راهبری', checked: true }
    ],
    signedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    trainId: '۱۰۴',
    stationId: 'دپوی کهریزک',
    geoLocation: '۳۵.۵۲۱۲° N, ۵۱.۳۹۰۸° E (حریم دپو)',
    completionTimeSeconds: 120,
    digitalSignaturePin: '****',
    reporterName: 'امین سلیمانی (راهبر قطار)'
  }
]

export default function ChecklistsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [templates, setTemplates] = useState<Template[]>(SAMPLE_TEMPLATES)
  const [history, setHistory] = useState<ChecklistRecord[]>(SAMPLE_HISTORY)
  const [loading, setLoading] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)

  const [activeTab, setActiveTab] = useState<'fill' | 'history' | 'admin'>('fill')

  // Checklist filling states — بخش ۱۲.۳
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({})
  const [itemPhotos, setItemPhotos] = useState<Record<number, boolean>>({}) // شبیه‌ساز آپلود عکس
  const [trainId, setTrainId] = useState('')
  const [stationId, setStationId] = useState('دپوی کهریزک')
  const [digitalSignaturePin, setDigitalSignaturePin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // سیستم جلوگیری از پر کردن صوری با تایمر تکمیل — بخش ۱۲.۳
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // ادمین
  const isRealAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateTrainType, setNewTemplateTrainType] = useState<'سری ۱۰۰' | 'سری ۳۰۰' | 'AC/DC'>('سری ۱۰۰')
  const [newTemplateStation, setNewTemplateStation] = useState('دپوی کهریزک')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateItems, setNewTemplateItems] = useState<ChecklistItem[]>([
    { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true, requirePhoto: false },
    { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true, requirePhoto: true }
  ])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)
  const [newItemRequirePhoto, setNewItemRequirePhoto] = useState(false)

  // شروع تایمر با باز شدن چک‌لیست
  useEffect(() => {
    if (activeTemplate) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeTemplate])

  // ارسال چک‌لیست قبل از حرکت — بخش ۱۲.۳
  const handleSubmitChecklist = () => {
    if (!activeTemplate || !trainId) {
      alert('لطفاً شماره رام قطار را وارد کنید.')
      return
    }

    // ۱. جلوگیری از پر کردن صوری (حداقل ۳۰ ثانیه برای تست واقعی زمان نیاز است)
    if (elapsedSeconds < 30) {
      alert(`⚠️ زمان سپری شده: ${toFa(elapsedSeconds)} ثانیه. بررسی‌های ایمنی قبل از حرکت به حداقل ۳۰ ثانیه زمان نیاز دارند. از ثبت صوری و بدون بازرسی خودداری کنید!`)
      return
    }

    // ۲. بررسی امضای دیجیتال
    if (!digitalSignaturePin.trim()) {
      alert('لطفاً پین امضای دیجیتال خود را وارد نمایید.')
      return
    }

    setSubmitting(true)
    
    // شبیه‌ساز چک کردن آیتم‌های مشکل‌دار جهت ثبت تیکت خودکار
    let hasDefects = false
    const parsedItems = activeTemplate.items.map((item, idx) => {
      const isOk = checkedItems[idx] ?? false
      const note = itemNotes[idx] || ''
      if (!isOk || note.trim()) {
        hasDefects = true
      }
      return {
        label: item.label,
        checked: isOk,
        note,
        photoAttached: itemPhotos[idx] || false
      }
    })

    const newRecord: ChecklistRecord = {
      id: `chk-rec-${Date.now()}`,
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      trainType: activeTemplate.trainType,
      items: parsedItems,
      signedAt: new Date().toISOString(),
      trainId,
      stationId,
      geoLocation: '۳۵.۷۴۱۵° N, ۵۱.۴۰۸۸° E (موقعیت GPS ثبت شده)',
      completionTimeSeconds: elapsedSeconds,
      digitalSignaturePin: '****',
      reporterName: user?.name || 'راهبر قطار خط ۱',
      autoTicketGenerated: hasDefects
    }

    setHistory(prev => [newRecord, ...prev])
    setActiveTemplate(null)
    setCheckedItems({})
    setItemNotes({})
    setItemPhotos({})
    setTrainId('')
    setDigitalSignaturePin('')
    
    if (hasDefects) {
      alert('⚠️ چک‌لیست با موفقیت ثبت شد. به دلیل گزارش نقص یا عدم تایید برخی تسک‌ها، یک تیکت خرابی خودکار در بخش تیکتینگ OCC صادر شد.')
    } else {
      alert('✅ چک‌لیست ایمنی قبل از حرکت با موفقیت امضا و در پرونده لوحه پرسنلی ذخیره شد.')
    }
    setSubmitting(false)
    setActiveTab('history')
  }

  // ثبت قالب جدید توسط ادمین
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || newTemplateItems.length === 0) return
    const newTpl: Template = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName,
      trainType: newTemplateTrainType,
      stationLocation: newTemplateStation,
      description: newTemplateDescription.trim() || null,
      items: newTemplateItems
    }
    setTemplates(prev => [...prev, newTpl])
    setNewTemplateName('')
    setNewTemplateDescription('')
    setNewTemplateItems([])
    alert('قالب چک‌لیست جدید با موفقیت به بانک اطلاعاتی خط ۱ اضافه شد.')
    setActiveTab('fill')
  }

  const handleAddNewItem = () => {
    if (!newItemLabel.trim()) return
    setNewTemplateItems(prev => [
      ...prev,
      { label: newItemLabel, required: newItemRequired, requirePhoto: newItemRequirePhoto }
    ])
    setNewItemLabel('')
    setNewItemRequired(true)
    setNewItemRequirePhoto(false)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 text-foreground antialiased" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 gap-4">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2 select-none">
            <ClipboardCheck className="size-6 text-accent animate-pulse" />
            چک‌لیست هوشمند دیجیتال قبل از حرکت قطار (بخش ۱۲.۳)
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            کنترل فیزیکی سیستم ترمز، درب‌ها و ابزار ایمنی کابین وابسته به نوع رام و ایستگاه مبدا
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('fill')}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'fill' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          انتخاب و تکمیل چک‌لیست
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'history' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          آرشیو گزارشات ممیزی ({toFa(history.length)})
        </button>
        {isRealAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'admin' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            قالب‌ساز مدیریت (ادمین)
          </button>
        )}
      </div>

      {/* TAB 1: Fill checklist */}
      {activeTab === 'fill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main workspace */}
          <div className="lg:col-span-8 space-y-4">
            {activeTemplate ? (
              <Card className="border-accent/25 bg-surface-container-low/70 backdrop-blur">
                <CardHeader className="border-b border-border/30 bg-accent/5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-black text-foreground">{activeTemplate.name}</CardTitle>
                      <CardDescription className="text-[10px] mt-1">
                        نوع رام هدف: {activeTemplate.trainType} | ایستگاه مجاز: {activeTemplate.stationLocation}
                      </CardDescription>
                    </div>
                    
                    {/* Live Timer */}
                    <div className="flex items-center gap-1.5 text-xs bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800 text-warning font-mono">
                      <Clock className="size-4 animate-pulse" />
                      <span>زمان سپری شده: {toFa(elapsedSeconds)} ثانیه</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4 text-xs font-bold text-right">
                  {/* Train and Station settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/40 p-4 rounded-lg border border-border/40">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-foreground">شماره رام قطار / واگن:</Label>
                      <Input
                        placeholder="مثال: ۱۰۴"
                        value={trainId}
                        onChange={(e) => setTrainId(e.target.value)}
                        className="bg-neutral-900"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-foreground">ایستگاه مبدا شروع سیر:</Label>
                      <select
                        value={stationId}
                        onChange={(e) => setStationId(e.target.value)}
                        className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs focus:outline-none"
                      >
                        {LINE1_STATIONS.map((st) => (
                          <option key={st} value={st}>ایستگاه {st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold text-foreground">المان‌های ایمنی و بازرسی فنی:</Label>
                    
                    {activeTemplate.items.map((item, idx) => {
                      const isChecked = checkedItems[idx] ?? false
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border gap-3 transition-all duration-150",
                            isChecked ? "bg-success/5 border-success/30" : "bg-neutral-950/20 border-border/50"
                          )}
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setCheckedItems(prev => ({ ...prev, [idx]: e.target.checked }))}
                              className="size-4.5 accent-accent"
                            />
                            <div className="space-y-0.5">
                              <span className={cn("text-xs font-bold", isChecked && "line-through text-foreground-muted")}>
                                {item.label}
                              </span>
                              <div className="flex gap-1.5 pt-1">
                                <Badge className={cn('text-[8px] font-bold px-1.5 py-0.5', item.required ? 'bg-critical/15 text-critical' : 'bg-neutral-800 text-neutral-400')}>
                                  {item.required ? 'الزامی' : 'اختیاری'}
                                </Badge>
                                {item.requirePhoto && (
                                  <Badge className="bg-info/10 text-info border-transparent text-[8px] font-bold px-1.5 py-0.5">
                                    پیوست تصویر الزامی 📸
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </label>

                          {/* Detail Note and Photo upload simulation */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Photo button */}
                            {item.requirePhoto && (
                              <button
                                type="button"
                                onClick={() => {
                                  setItemPhotos(prev => ({ ...prev, [idx]: !prev[idx] }))
                                  alert('عکس با موفقیت از دوربین تبلت پیوست شد.')
                                }}
                                className={cn(
                                  'h-8 px-2 rounded-lg border text-[9px] font-bold flex items-center gap-1 cursor-pointer',
                                  itemPhotos[idx] ? 'bg-success/15 border-success text-success' : 'border-border text-foreground-muted'
                                )}
                              >
                                <Camera className="size-3.5" />
                                <span>{itemPhotos[idx] ? 'عکس پیوست شد' : 'ثبت عکس پیوست'}</span>
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 bg-neutral-950/40 border border-border/50 px-2 rounded h-8 w-44">
                              <Wrench className="size-3.5 text-foreground-muted shrink-0" />
                              <input
                                placeholder="گزارش نقص فنی..."
                                value={itemNotes[idx] || ''}
                                onChange={(e) => setItemNotes(prev => ({ ...prev, [idx]: e.target.value }))}
                                className="bg-transparent border-0 outline-none text-[10px] text-foreground w-full h-full"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Digital Signature Pin input — بخش ۱۲.۳ */}
                  <div className="border-t border-border/30 pt-4 space-y-2">
                    <Label className="text-[11px] font-bold text-accent flex items-center gap-1">
                      <Signature className="size-4" />
                      امضای دیجیتال و تایید نهایی راهبر قطار:
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="password"
                        placeholder="پین امضای دیجیتال پرسنلی..."
                        value={digitalSignaturePin}
                        onChange={(e) => setDigitalSignaturePin(e.target.value)}
                        className="bg-neutral-950/40 font-mono"
                      />
                      <div className="text-[10px] text-foreground-muted font-normal leading-relaxed">
                        با وارد کردن پین امضا، گواهی موقعیت مکانی ماهواره‌ای شما به صورت قانونی ثبت و تایید نهایی در دیتابیس قفل می‌شود.
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950/20 rounded-b-lg">
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                    <Info className="size-4 text-accent shrink-0" />
                    <span>سیستم جلوگیری از ثبت صوری و تصادفی فعال است.</span>
                  </div>
                  
                  <Button
                    onClick={handleSubmitChecklist}
                    disabled={
                      submitting ||
                      activeTemplate.items.some((item, idx) => item.required && !checkedItems[idx]) ||
                      activeTemplate.items.some((item, idx) => item.requirePhoto && !itemPhotos[idx])
                    }
                    className="w-full sm:w-auto h-9 text-xs font-bold cursor-pointer bg-accent hover:bg-accent-hover text-white"
                  >
                    <CheckCircle className="size-4 me-1.5" />
                    ثبت و امضای دیجیتال قبل از حرکت
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className="cursor-pointer transition hover:bg-neutral-900/10 border border-border/50 bg-surface-container-low"
                    onClick={() => setActiveTemplate(t)}
                  >
                    <CardContent className="flex items-center justify-between p-4 text-right">
                      <div className="space-y-1">
                        <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <ClipboardCheck className="size-4 text-accent" />
                          {t.name}
                        </div>
                        {t.description && <div className="text-[11px] text-foreground-muted">{t.description}</div>}
                        
                        <div className="flex gap-2 pt-1.5 text-[9px] font-bold">
                          <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent">{t.trainType}</Badge>
                          <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-foreground-muted">مکان مجاز: {t.stationLocation}</Badge>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-foreground-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Side Panel */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-border/50 bg-surface-container-low/40 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                  <Shield className="size-4 text-accent animate-pulse" />
                  آیین‌نامه و الزامات ۱۲.۳
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-muted space-y-3 leading-6">
                <p>
                  در صورت تایید نکردن هر یک از تسک‌های چک‌لیست قبل از حرکت یا ثبت گزارش نقص فنی، سیستم دیسپاچینگ خط ۱ مترو به طور خودکار نسبت به صدور تیکت خرابی با ارجاع به تعمیرگاه اقدام خواهد نمود.
                </p>
                <div className="bg-warning/10 border border-warning/20 p-2.5 rounded text-[10px] text-warning font-bold">
                  ⚠️ ثبت صوری و بدون زمان‌بندی بازرسی، تخلف ایمنی تلقی شده و در گزارش ممیزی ثبت می‌گردد.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: History Audit */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">تاریخچه چک‌لیست‌های ثبت شده</h4>
          </div>

          <div className="space-y-4">
            {history.map((record) => (
              <Card key={record.id} className="bg-surface-container-low border border-border/50">
                <CardContent className="p-4 space-y-3 text-right text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2 flex-wrap">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-foreground">{record.templateName}</h4>
                      <div className="text-[10px] text-foreground-muted flex gap-2 font-bold font-mono">
                        <span>راهبر: {record.reporterName}</span>
                        <span>•</span>
                        <span>ثبت: {jalali(record.signedAt)}</span>
                        <span>•</span>
                        <span className="text-accent">رام قطار: {toFa(record.trainId)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className="bg-neutral-800 border-neutral-700 text-neutral-300 font-bold text-[9px] font-mono">
                         مدت زمان بازرسی: {toFa(record.completionTimeSeconds)} ثانیه
                      </Badge>
                      {record.autoTicketGenerated && (
                        <Badge className="bg-critical/15 text-critical border-transparent font-bold text-[9px] animate-pulse">
                          تیکت خرابی خودکار صادر شد
                        </Badge>
                      )}
                      <Badge className="bg-success/15 text-success border-success/30 font-bold text-[9px]">
                        امضا شده و معتبر
                      </Badge>
                    </div>
                  </div>

                  {/* Satellite Geo Location */}
                  <div className="flex items-center gap-1 text-[9px] text-foreground-muted font-bold font-mono">
                    <MapPin className="size-3.5 text-accent" />
                    <span>موقعیت GPS تایید امضا: {record.geoLocation}</span>
                  </div>

                  {/* Items summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {record.items.map((item, idx) => (
                      <div key={idx} className="p-2 border border-border/30 bg-surface/30 rounded flex justify-between items-center text-[10px] font-bold">
                        <span>{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {item.note && <span className="text-[8px] bg-warning/10 text-warning px-1.5 py-0.5 rounded border border-warning/20">نقص: {item.note}</span>}
                          {item.photoAttached && <span className="text-[8px] text-info font-bold">📸 عکس دارد</span>}
                          {item.checked ? <Check className="size-4 text-success" /> : <X className="size-4 text-critical" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Admin Template Builder */}
      {activeTab === 'admin' && isRealAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
          <div className="lg:col-span-7">
            <Card className="bg-surface-container-low border border-border/50 p-6 space-y-4">
              <div>
                <h3 className="text-xs font-black text-foreground">قالب‌ساز چک‌لیست قبل از حرکت</h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">افزودن و انتساب چک‌لیست جدید بر اساس نوع قطار و موقعیت مکانی دپو.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-1">
                  <Label>عنوان قالب چک‌لیست:</Label>
                  <Input
                    placeholder="مثال: چک‌لیست فنی ترمز و چرخ قطار"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="bg-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label>موقعیت مکانی مجاز (ایستگاه/دپو):</Label>
                  <select
                    value={newTemplateStation}
                    onChange={(e) => setNewTemplateStation(e.target.value)}
                    className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs focus:outline-none"
                  >
                    {LINE1_STATIONS.map((st) => (
                      <option key={st} value={st}>ایستگاه {st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-1">
                  <Label>نوع قطار هدف (بخش ۱۱۲.۳):</Label>
                  <select
                    value={newTemplateTrainType}
                    onChange={(e) => setNewTemplateTrainType(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs focus:outline-none"
                  >
                    <option value="سری ۱۰۰">سری ۱۰۰ (واگن‌های قدیمی)</option>
                    <option value="سری ۳۰۰">سری ۳۰۰ (واگن‌های نسل جدید)</option>
                    <option value="AC/DC">AC / DC (دو حالته)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>توضیحات و اهداف دستورالعمل:</Label>
                  <Input
                    placeholder="شرح کوتاه..."
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    className="bg-neutral-900"
                  />
                </div>
              </div>

              {/* Subtask list */}
              <div className="space-y-2.5 border-t border-border/20 pt-3">
                <span className="font-bold text-[10px] text-foreground-muted block">آیتم‌های افزوده شده به قالب جدید:</span>
                {newTemplateItems.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-border/30 rounded text-[10px] text-foreground-muted">
                    آیتمی ثبت نشده است. از فرم زیر اضافه کنید.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {newTemplateItems.map((item, idx) => (
                      <div key={idx} className="p-2 border border-border/40 bg-surface/30 rounded flex justify-between items-center text-[10px] font-bold">
                        <span className="flex items-center gap-1.5">
                          <span>{toFa(idx + 1)}.</span>
                          <span>{item.label}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[8px] bg-neutral-800 text-neutral-300">{item.required ? 'الزامی' : 'اختیاری'}</Badge>
                          {item.requirePhoto && <Badge variant="outline" className="text-[8px] bg-info/10 text-info">الزام عکس 📸</Badge>}
                          <Button size="icon" variant="ghost" onClick={() => setNewTemplateItems(prev => prev.filter((_, i) => i !== idx))} className="size-6 text-critical hover:bg-transparent">
                            <Trash className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item form input */}
              <div className="bg-neutral-950/20 border border-border/40 p-3 rounded-lg space-y-3 text-xs font-bold">
                <span className="text-[10px] text-accent block">افزودن آیتم بازرسی جدید:</span>
                <Input
                  placeholder="عنوان تست یا بازرسی فیزیکی..."
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  className="bg-neutral-900 h-9"
                />
                
                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newItemRequired}
                      onChange={(e) => setNewItemRequired(e.target.checked)}
                      className="size-4"
                    />
                    <span>المان بازرسی الزامی (Required) است.</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newItemRequirePhoto}
                      onChange={(e) => setNewItemRequirePhoto(e.target.checked)}
                      className="size-4"
                    />
                    <span>الزام راهبر به بارگذاری عکس نقص فیزیکی 📸</span>
                  </label>

                  <Button type="button" size="xs" onClick={handleAddNewItem} className="h-7 text-[10px] cursor-pointer">
                    افزودن آیتم
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/20">
                <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim() || newTemplateItems.length === 0} className="bg-accent text-white font-bold cursor-pointer text-xs">
                  ثبت و ایجاد قالب جدید
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
