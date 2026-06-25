'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  X
} from 'lucide-react'

interface ChecklistItem {
  label: string
  required: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  items: ChecklistItem[]
}

interface ChecklistRecord {
  id: string
  templateId: string
  items: Array<{ label: string; checked: boolean; note?: string }>
  signedAt: string
  trainId: string | null
  stationId: string | null
  geoLocation: string | null
  template?: { name: string }
  user?: { name: string }
}

const LINE1_STATIONS = [
  'تجریش',
  'قلهک',
  'هفت تیر',
  'دروازه دولت',
  'امام خمینی',
  'شهر ری',
  'کهریزک',
  'دپوی کهریزک'
]

export default function ChecklistsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [history, setHistory] = useState<ChecklistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  
  // Checklist filling states
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({})
  const [trainId, setTrainId] = useState('')
  const [stationId, setStationId] = useState('کهریزک')
  const [submitting, setSubmitting] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'fill' | 'history' | 'admin'>('fill')
  const [isAdminSimulated, setIsAdminSimulated] = useState(true)

  // Template creation states (Admin)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateItems, setNewTemplateItems] = useState<ChecklistItem[]>([
    { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true },
    { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true },
    { label: 'کنترل سیستم رادیویی و خط ارتباط بی سیم با OCC', required: true },
    { label: 'کنترل کارکرد صحیح چراغ‌های سیگنال کابین راهبری', required: true },
    { label: 'تست باز و بسته شدن درب‌های قطار از هر دو سمت', required: true },
    { label: 'تست سیستم تهویه مطبوع کابین و سالن مسافران', required: false },
    { label: 'کنترل فیزیکی کپسول‌های اطفای حریق کابین راهبر', required: false }
  ])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [templatesRes, historyRes] = await Promise.all([
        fetch('/api/checklists', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/checklists?view=history', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.data ?? [])
      }
      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.data ?? [])
      }
    } catch (err) {
      console.error('Error loading checklist data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [accessToken])

  // Submit filled checklist (Operator)
  async function handleSubmitChecklist() {
    if (!accessToken || !activeTemplate) return
    setSubmitting(true)
    try {
      const items = activeTemplate.items.map((item, i) => ({
        label: item.label,
        checked: checkedItems[i] ?? false,
        note: itemNotes[i] || '',
      }))

      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          trainId: trainId.trim() ? trainId : null,
          stationId: stationId,
          items,
        }),
      })

      if (res.ok) {
        setActiveTemplate(null)
        setCheckedItems({})
        setItemNotes({})
        setTrainId('')
        setActiveTab('history')
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Create new checklist template (Admin)
  async function handleCreateTemplate() {
    if (!accessToken || !newTemplateName.trim()) return
    if (newTemplateItems.length === 0) return
    setCreatingTemplate(true)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_template',
          name: newTemplateName,
          description: newTemplateDescription,
          items: newTemplateItems,
        }),
      })

      if (res.ok) {
        setNewTemplateName('')
        setNewTemplateDescription('')
        setNewTemplateItems([
          { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true },
          { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true },
          { label: 'کنترل سیستم رادیویی و خط ارتباط بی سیم با OCC', required: true }
        ])
        setActiveTab('fill')
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreatingTemplate(false)
    }
  }

  function handleAddNewItem() {
    if (!newItemLabel.trim()) return
    setNewTemplateItems([
      ...newTemplateItems,
      { label: newItemLabel, required: newItemRequired }
    ])
    setNewItemLabel('')
    setNewItemRequired(true)
  }

  function handleRemoveItem(idx: number) {
    setNewTemplateItems(newTemplateItems.filter((_, i) => i !== idx))
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 text-foreground antialiased selection:bg-accent selection:text-accent-foreground">
      {/* Header and Simulator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg flex items-center gap-2">
            <ClipboardCheck className="size-8 text-accent" />
            چک‌لیست قبل از حرکت قطار (Pre-Departure)
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            سامانه یکپارچه فنی ثبت و بازرسی سلامت قطار پیش از حرکت در خط ۱ مترو تهران
          </p>
        </div>

        {/* Admin Simulation Toggle */}
        <div className="flex items-center gap-2 bg-surface-container-low border border-border-subtle p-2 rounded-lg">
          <Shield className={cn("size-5", isAdminSimulated ? "text-accent animate-pulse" : "text-foreground-muted")} />
          <span className="text-xs font-semibold">شبیه‌ساز نقش مدیریت:</span>
          <Button
            size="sm"
            variant={isAdminSimulated ? "default" : "outline"}
            onClick={() => {
              const target = !isAdminSimulated
              setIsAdminSimulated(target)
              if (!target && activeTab === 'admin') {
                setActiveTab('fill')
              }
            }}
            className="h-8 text-xs"
          >
            {isAdminSimulated ? "ادمین / مدیر سیستم (فعال)" : "کاربر عادی / راهبر قطار"}
          </Button>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('fill')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
            activeTab === 'fill'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <ClipboardCheck className="size-4" />
          تکمیل چک‌لیست قبل از حرکت
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
            activeTab === 'history'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <History className="size-4" />
          تاریخچه و آرشیو گزارشات
        </button>
        {isAdminSimulated && (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
              activeTab === 'admin'
                ? "border-accent text-accent"
                : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            <Lock className="size-4" />
            قالب‌ساز و مدیریت تسک‌ها (ادمین)
          </button>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: FILL CHECKLIST */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'fill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Workspace Area (lg: col-span-8) */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-neutral-900/30" />
                ))}
              </div>
            ) : activeTemplate ? (
              <Card className="border-accent/20 bg-surface-container-low/60 backdrop-blur">
                <CardHeader className="border-b border-border-subtle/30 bg-accent/5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <ClipboardCheck className="size-5 text-accent" />
                        {activeTemplate.name}
                      </CardTitle>
                      {activeTemplate.description && (
                        <CardDescription className="text-xs mt-1">
                          {activeTemplate.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTemplate(null)
                        setCheckedItems({})
                        setItemNotes({})
                        setTrainId('')
                      }}
                      className="text-foreground-muted hover:text-foreground text-xs"
                    >
                      انصراف و بازگشت
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  {/* Train and Station Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/40 p-4 rounded-lg border border-border-subtle">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Train className="size-4 text-accent" />
                        شماره رام قطار / واگن:
                      </Label>
                      <Input
                        placeholder="مثال: ۱۰۴"
                        value={trainId}
                        onChange={(e) => setTrainId(e.target.value)}
                        className="h-9 text-xs bg-neutral-950/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <MapPin className="size-4 text-accent" />
                        ایستگاه مبدا سیر:
                      </Label>
                      <Select value={stationId} onValueChange={(val) => setStationId(val ?? '')}>
                        <SelectTrigger className="h-9 text-xs bg-neutral-950/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LINE1_STATIONS.map((st) => (
                            <SelectItem key={st} value={st} className="text-xs">
                              ایستگاه {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Checklist Items list */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-foreground">تسک‌ها و بررسی‌های ایمنی قطار:</Label>
                    
                    {activeTemplate.items.map((item, i) => {
                      const isChecked = checkedItems[i] ?? false
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3 transition-all",
                            isChecked 
                              ? "bg-success/5 border-success/30" 
                              : item.required 
                              ? "bg-critical/5 border-critical/20"
                              : "bg-neutral-950/20 border-border-subtle"
                          )}
                        >
                          {/* Checkbox and Label */}
                          <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                setCheckedItems({ ...checkedItems, [i]: e.target.checked })
                              }
                              className="size-4.5 accent-accent shrink-0 rounded border-border-subtle bg-neutral-950"
                            />
                            <div className="space-y-0.5">
                              <span className={cn("text-xs font-medium", isChecked && "line-through text-foreground-muted")}>
                                {item.label}
                              </span>
                              <div className="flex gap-2">
                                <Badge className={cn(
                                  "text-[9px] px-1 py-0.5",
                                  item.required 
                                    ? "bg-critical/15 text-critical border-critical/20" 
                                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                )}>
                                  {item.required ? 'اجباری' : 'اختیاری'}
                                </Badge>
                              </div>
                            </div>
                          </label>

                          {/* Technical Defect Note Input */}
                          <div className="w-full sm:w-60 flex items-center gap-1.5 bg-neutral-950/30 border border-border-subtle/50 px-2 rounded-md h-8.5">
                            <Wrench className="size-3.5 text-foreground-muted shrink-0" />
                            <input
                              placeholder="گزارش نقص فنی / توضیح..."
                              value={itemNotes[i] || ''}
                              onChange={(e) => setItemNotes({ ...itemNotes, [i]: e.target.value })}
                              className="bg-transparent border-0 outline-none text-[11px] text-foreground flex-1 h-full w-full"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border-subtle/20 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-950/20 rounded-b-lg">
                  <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
                    <Info className="size-4 text-accent shrink-0" />
                    <span>تایید تمامی موارد <span className="text-critical font-bold">اجباری</span> برای فعال شدن کلید ثبت الزامی است.</span>
                  </div>
                  
                  <Button
                    onClick={handleSubmitChecklist}
                    disabled={
                      submitting ||
                      activeTemplate.items
                        .filter((item) => item.required)
                        .some((_, i) => !checkedItems[
                          activeTemplate.items.findIndex(
                            (origItem, origIdx) => origItem.label === activeTemplate.items.filter(item => item.required)[i].label
                          )
                        ])
                    }
                    className="w-full sm:w-auto h-9 text-xs"
                  >
                    <CheckCircle className="size-4 me-1.5" />
                    ثبت و ارسال چک‌لیست قبل از حرکت
                  </Button>
                </CardFooter>
              </Card>
            ) : templates.length === 0 ? (
              <Card className="border-dashed border-border-subtle bg-neutral-950/10">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ClipboardCheck className="mb-3 size-12 text-foreground-muted" />
                  <p className="text-sm font-semibold text-foreground-muted">
                    هیچ قالب چک‌لیست فعالی در سیستم ثبت نشده است.
                  </p>
                  {isAdminSimulated && (
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('admin')} className="mt-3">
                      ساخت اولین قالب
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className="cursor-pointer transition-all hover:bg-neutral-900/40 border border-border-subtle hover:border-accent/30 bg-surface-container-low/50"
                    onClick={() => setActiveTemplate(t)}
                  >
                    <CardContent className="flex items-center justify-between p-4.5">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <ClipboardCheck className="size-4.5 text-accent" />
                          {t.name}
                        </div>
                        {t.description && (
                          <div className="text-xs text-foreground-muted">
                            {t.description}
                          </div>
                        )}
                        <div className="text-[10px] text-foreground-muted flex gap-2 pt-1">
                          <Badge variant="outline" className="text-[9px] bg-neutral-950/20">
                            {toFa(t.items.length)} آیتم بازرسی
                          </Badge>
                          <Badge variant="outline" className="text-[9px] bg-critical/5 text-critical border-critical/10">
                            {toFa(t.items.filter(i => i.required).length)} آیتم الزامی
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-foreground-muted shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel (lg: col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="border border-border-subtle bg-surface-container-low/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Info className="size-4 text-accent" />
                  راهنمای ایمنی پیش از سیر
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-muted space-y-2 leading-6 text-right">
                <p>
                  مطابق بند ۴-۱۲ آیین‌نامه فنی خط ۱ مترو تهران، راهبران موظفند قبل از خروج از خط دپو یا تعویض شیفت در ایستگاه‌های تبادلی (همچون دروازه دولت و امام خمینی)، تمامی موارد ایمنی مندرج در چک‌لیست را بررسی و ثبت نمایند.
                </p>
                <p className="border-t border-border-subtle/50 pt-2 font-semibold text-critical">
                  نکات حیاتی:
                </p>
                <ul className="list-disc pr-4 space-y-1 text-[11px]">
                  <li>بررسی ترمزهای اضطراری قطار بدون استثنا الزامی است.</li>
                  <li>فشار مخازن باد اصلی باید حداقل روی ۷.۵ بار باشد.</li>
                  <li>در صورت بروز هرگونه نقص فنی در المان‌های الزامی، مراتب را فوراً با کادر فنی دپو هماهنگ کرده و در فیلد نقص گزارش کنید.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: HISTORY ARCHIVE */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-neutral-900/30" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <Card className="border-dashed border-border-subtle bg-neutral-950/10">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <History className="mb-3 size-12 text-foreground-muted" />
                <p className="text-sm font-semibold text-foreground-muted">
                  هیچ سابقه گزارشی تا کنون در سیستم ثبت نشده است.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((record) => {
                const totalItems = record.items.length
                const checkedCount = record.items.filter(i => i.checked).length
                const defectCount = record.items.filter(i => i.note && i.note.trim()).length

                return (
                  <Card key={record.id} className="border border-border-subtle bg-surface-container-low/50">
                    <CardContent className="p-4.5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle/30 pb-2">
                        <div className="space-y-0.5 text-right">
                          <div className="text-sm font-bold text-foreground">
                            {record.template?.name ?? 'قالب نامشخص'}
                          </div>
                          <div className="text-[11px] text-foreground-muted flex flex-wrap gap-x-3 gap-y-1">
                            <span>راهبر: {record.user?.name ?? 'نامشخص'}</span>
                            <span>•</span>
                            <span>زمان ثبت: {toFa(jalali(record.signedAt))}</span>
                            {record.trainId && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-accent">رام قطار: {toFa(record.trainId)}</span>
                              </>
                            )}
                            {record.stationId && (
                              <>
                                <span>•</span>
                                <span>ایستگاه شروع: {record.stationId}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {defectCount > 0 && (
                            <Badge className="bg-warning/15 text-warning border-warning/20">
                              {toFa(defectCount)} نقص ثبت شده
                            </Badge>
                          )}
                          <Badge className="bg-success/15 text-success border-success/20">
                            تکمیل شده ({toFa(checkedCount)} از {toFa(totalItems)})
                          </Badge>
                        </div>
                      </div>

                      {/* Items grid details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {record.items.map((item, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-2.5 rounded-md border flex flex-col gap-1.5 justify-center",
                              item.checked 
                                ? "bg-success/5 border-success/10" 
                                : "bg-critical/5 border-critical/10"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[11px]">
                                {item.label}
                              </span>
                              <span className={cn(
                                "size-4.5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                                item.checked ? "bg-success/20 text-success" : "bg-critical/20 text-critical"
                              )}>
                                {item.checked ? <Check className="size-3" /> : <X className="size-3" />}
                              </span>
                            </div>
                            {item.note && item.note.trim() ? (
                              <div className="bg-warning/10 border border-warning/20 p-1.5 rounded text-[10px] text-warning flex items-start gap-1">
                                <Wrench className="size-3 mt-0.5 shrink-0" />
                                <span>گزارش نقص: {item.note}</span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: ADMIN TEMPLATE BUILDER */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'admin' && isAdminSimulated && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Editor Form (lg: col-span-7) */}
          <div className="lg:col-span-7">
            <Card className="border border-border-subtle bg-surface-container-low/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="size-5 text-accent" />
                  قالب‌ساز چک‌لیست قبل از حرکت
                </CardTitle>
                <CardDescription className="text-xs">
                  یک قالب بازرسی جدید حاوی تسک‌های الزامی یا اختیاری قطار تعریف کنید.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meta details */}
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-semibold">عنوان قالب چک‌لیست قبل از حرکت:</Label>
                  <Input
                    placeholder="مثال: چک‌لیست فنی سیستم تعلیق و ترمزهای رام"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="h-10 text-sm bg-neutral-950/20"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-xs font-semibold">توضیحات و دستورالعمل راهبری (اختیاری):</Label>
                  <Textarea
                    placeholder="دستورالعمل کلی برای این چک‌لیست..."
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    className="min-h-16 text-xs bg-neutral-950/20"
                  />
                </div>

                {/* Subtask list */}
                <div className="space-y-3 border-t border-border-subtle/50 pt-4">
                  <Label className="text-xs font-bold text-accent block">لیست تسک‌های قالب:</Label>
                  
                  {newTemplateItems.length === 0 ? (
                    <p className="text-xs text-foreground-muted text-center py-4 bg-neutral-950/10 rounded border border-dashed border-border-subtle">
                      تسکی در این قالب تعریف نشده است. از فرم زیر اضافه کنید.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {newTemplateItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-950/30 border border-border-subtle rounded-md text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground-muted text-[10px]">{toFa(idx + 1)}.</span>
                            <span className="font-medium text-foreground">{item.label}</span>
                            <Badge className={cn(
                              "text-[8px] px-1 py-0",
                              item.required 
                                ? "bg-critical/15 text-critical border-critical/20" 
                                : "bg-neutral-800 text-neutral-400 border-neutral-700"
                            )}>
                              {item.required ? 'الزامی' : 'اختیاری'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-foreground-muted hover:text-critical size-7"
                          >
                            <Trash className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item creator input */}
                <div className="bg-neutral-950/40 p-3 rounded-lg border border-border-subtle space-y-3">
                  <span className="text-xs font-bold text-foreground block">افزودن تسک جدید به لیست قالب:</span>
                  <Input
                    placeholder="مثال: بررسی عملکرد بوق اضطراری (سوت قطار)"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    className="h-8.5 text-xs bg-neutral-950/20"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newItemRequired}
                        onChange={(e) => setNewItemRequired(e.target.checked)}
                        className="size-4"
                      />
                      <span className="text-xs text-foreground-muted font-medium">مورد بازرسی الزامی (Required) است</span>
                    </label>
                    <Button type="button" size="sm" onClick={handleAddNewItem} className="h-8 text-xs">
                      <Plus className="size-3.5 me-1" />
                      افزودن به لیست
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border-subtle/20 pt-4 flex justify-end">
                <Button
                  onClick={handleCreateTemplate}
                  disabled={creatingTemplate || !newTemplateName.trim() || newTemplateItems.length === 0}
                  className="w-full sm:w-auto h-9 text-xs"
                >
                  ثبت و ایجاد قالب جدید چک‌لیست
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick templates info (lg: col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-border-subtle bg-surface-container-low/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="size-4 text-accent" />
                  اطلاعات نظارت و ممیزی ایمنی
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-foreground-muted space-y-2 leading-6 text-right">
                <p>
                  قالب‌های چک‌لیست ایجاد شده در این بخش فوراً برای تمام راهبران فعال در خط ۱ مترو تهران قابل نمایش و اجرا خواهد بود.
                </p>
                <p>
                  هر زمان راهبر چک‌لیستی را ارسال کند، اطلاعات ثبت‌شده شامل رام قطار، نقایص احتمالی و آی‌دی راهبر در سرور لاگ ممیزی (`AuditLog`) ثبت شده و برای ناظرین OCC قابل استخراج است.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
