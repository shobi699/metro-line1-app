'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toFa } from '@/lib/fa'
import { FileText, Plus, Trash, Eye, Settings, ShieldCheck, Play, ArrowLeft, ArrowRight, HelpCircle, CheckCircle, Edit, Layers } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'jalali_date' | 'time' | 'select' | 'checkbox' | 'file' | 'signature' | 'formula'
  required: boolean
  options?: string[]
  formula?: string
}

interface FormTemplate {
  id: string
  key: string
  title: string
  description: string | null
  category: string | null
  icon: string | null
  isActive: boolean
  isPublished: boolean
  activeVersionId: string | null
  versions: { id: string; version: number; isActive: boolean; schema: any; workflow: any }[]
}

const FIELD_TYPES = [
  { value: 'text', label: 'متن کوتاه' },
  { value: 'textarea', label: 'متن بلند' },
  { value: 'number', label: 'عدد' },
  { value: 'jalali_date', label: 'تاریخ جلالی' },
  { value: 'time', label: 'ساعت' },
  { value: 'select', label: 'لیست کشویی' },
  { value: 'checkbox', label: 'باکس تایید (چک‌باکس)' },
  { value: 'file', label: 'بارگذاری فایل/عکس' },
  { value: 'signature', label: 'امضای الکترونیکی' },
  { value: 'formula', label: 'فیلد محاسباتی (فرمول)' },
]

export default function FormBuilderPage() {
  const { accessToken } = useAuthStore()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list')

  // Selected Template & Version
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  
  // Template Form Info
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('منابع انسانی')
  const [newIcon, setNewIcon] = useState('FileText')
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  // Version Schema States
  const [fields, setFields] = useState<FormField[]>([])
  
  // Field Editor States
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldName, setFieldName] = useState('')
  const [fieldType, setFieldType] = useState<FormField['type']>('text')
  const [fieldRequired, setFieldRequired] = useState(false)
  const [fieldOptions, setFieldOptions] = useState('')
  const [fieldFormula, setFieldFormula] = useState('')

  // Workflow Editor States
  const [stages, setStages] = useState<any[]>([
    { key: 'supervisor', title: 'تایید سرپرست کشیک', assignBy: 'role', assignTo: 'supervisor', actions: ['approve', 'reject', 'request_changes'], sla: { hours: 24 } }
  ])
  const [transitions, setTransitions] = useState<any[]>([
    { on: 'submit', to: 'supervisor' },
    { from: 'supervisor', on: 'approve', to: 'END_APPROVED' },
    { from: 'supervisor', on: 'reject', to: 'END_REJECTED' },
    { from: 'supervisor', on: 'request_changes', to: 'BACK_TO_SUBMITTER' },
  ])

  // Presets
  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    loadTemplates()
    loadPresets()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/forms', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTemplates(json.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadPresets() {
    try {
      const res = await fetch('/api/admin/forms/presets', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPresets(json.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCreateTemplate(presetData?: any) {
    setCreatingTemplate(true)
    try {
      const payload = presetData ? {
        key: presetData.key,
        title: presetData.title,
        description: presetData.description,
        category: presetData.category,
        icon: presetData.icon,
        allowMobile: true
      } : {
        key: newKey,
        title: newTitle,
        description: newDesc,
        category: newCategory,
        icon: newIcon,
        allowMobile: true
      }

      const res = await fetch('/api/admin/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        const created = json.data

        // اگر از پریست استفاده شده، نسخه را هم بسازیم و مستقیماً فعال کنیم
        if (presetData) {
          const vRes = await fetch(`/api/admin/forms/${created.id}/versions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              schema: presetData.schema,
              workflow: presetData.workflow,
              access: presetData.access,
            }),
          })
          if (vRes.ok) {
            const vJson = await vRes.json()
            await fetch(`/api/admin/forms/${created.id}/publish`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ versionId: vJson.data.id }),
            })
          }
        }

        setShowCreateModal(false)
        setNewKey('')
        setNewTitle('')
        setNewDesc('')
        loadTemplates()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ثبت قالب')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleAddField = () => {
    if (!fieldLabel.trim() || !fieldName.trim()) return
    const optionsList = fieldOptions.trim() ? fieldOptions.split(',').map((o) => o.trim()) : undefined
    const newField: FormField = {
      name: fieldName.trim(),
      label: fieldLabel.trim(),
      type: fieldType,
      required: fieldRequired,
      options: optionsList,
      formula: fieldFormula.trim() || undefined,
    }
    setFields([...fields, newField])
    setFieldLabel('')
    setFieldName('')
    setFieldOptions('')
    setFieldFormula('')
    setFieldRequired(false)
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  async function handlePublishVersion() {
    if (!selectedTemplate) return
    if (fields.length === 0) {
      alert('لطفا حداقل یک فیلد برای فرم تعریف کنید.')
      return
    }

    try {
      const versionPayload = {
        schema: { fields },
        workflow: { stages, transitions },
        access: {
          whoCanSubmit: ['*'],
          whoCanView: ['supervisor', 'manager', 'admin'],
        },
      }

      // ۱. ثبت نسخه جدید
      const res = await fetch(`/api/admin/forms/${selectedTemplate.id}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(versionPayload),
      })

      if (res.ok) {
        const json = await res.json()
        const newVersion = json.data

        // ۲. انتشار نسخه
        const pubRes = await fetch(`/api/admin/forms/${selectedTemplate.id}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ versionId: newVersion.id }),
        })

        if (pubRes.ok) {
          alert('نسخه جدید فرم با موفقیت بازنویسی و در سراسر سامانه منتشر گردید.')
          setActiveTab('list')
          loadTemplates()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="size-5 text-red-500" />
            پنل ادمین طراحی و پیکربندی فرم‌ساز
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            طراحی قالب فیلدها، مهلت‌های SLA، مسیر گردش‌کار و قوانین شرطی تایید درخواست‌ها
          </p>
        </div>
        {activeTab === 'editor' ? (
          <Button variant="outline" size="sm" onClick={() => setActiveTab('list')} className="text-xs">
            بازگشت به لیست قالب‌ها
          </Button>
        ) : (
          <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1">
            <Plus className="size-4" />
            قالب فرم جدید
          </Button>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          {/* Preset options */}
          {presets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground">قالب‌های آماده جهت فعال‌سازی سریع (Presets)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <Card key={preset.key} className="border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all">
                    <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                      <div>
                        <span className="text-xs font-bold text-foreground block">{preset.title}</span>
                        <p className="text-[10px] text-foreground-muted mt-1 leading-relaxed">{preset.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateTemplate(preset)}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] w-full font-bold h-7"
                      >
                        فعال‌سازی فوری قالب
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active templates list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-foreground">فرم‌های طراحی‌شده سازمان</h3>
            {loading ? (
              <span className="text-xs text-foreground-muted">در حال بارگذاری...</span>
            ) : templates.length === 0 ? (
              <div className="text-center py-10 bg-surface border border-border rounded-xl">
                <span className="text-xs text-foreground-muted">هیچ فرم سفارشی در سیستم ثبت نشده است.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((form) => (
                  <Card key={form.id} className="flex flex-col justify-between border-border bg-surface hover:border-border-subtle transition-all">
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-foreground">{form.title}</span>
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px]">
                          {form.category || 'عمومی'}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted leading-relaxed">{form.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-foreground-muted font-semibold">
                        <span>شناسه فرم: <code className="bg-background px-1.5 py-0.5 rounded font-mono">{form.key}</code></span>
                        <span>وضعیت انتشار: {form.isPublished ? 'منتشر شده نسخه ' + toFa(form.versions[0]?.version || 1) : 'پیش‌نویس'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-surface-container-low border-t border-border/40 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemplate(form)
                          const activeV = form.versions.find((v) => v.isActive)
                          if (activeV) {
                            setFields(activeV.schema.fields || [])
                            setStages(activeV.workflow.stages || [])
                            setTransitions(activeV.workflow.transitions || [])
                          } else {
                            setFields([])
                          }
                          setActiveTab('editor')
                        }}
                        className="h-7 text-[10px] font-bold cursor-pointer"
                      >
                        <Edit className="size-3.5 me-0.5" />
                        طراحی و ویرایش فیلدها
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visual Editor Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Visual Fields & layout builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-surface">
              <CardHeader className="p-4 pb-2 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-foreground">طراحی فیلدهای سفارشی (فرم‌ساز)</CardTitle>
                <CardDescription className="text-[10px] text-foreground-muted">فیلدهای فرم را تعریف، تغییر و ویرایش نمایید.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <Label className="font-semibold text-foreground">عنوان فیلد (نمایش به پرسنل) *</Label>
                    <Input
                      value={fieldLabel}
                      onChange={(e) => {
                        setFieldLabel(e.target.value)
                        // Auto generate field name code
                        if (!fieldName) {
                          setFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
                        }
                      }}
                      placeholder="مثال: ساعت شروع اضافه کار"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-foreground">کد سیستم فیلد (انگلیسی یکتا) *</Label>
                    <Input
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      placeholder="مثال: startTime"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold text-foreground">نوع فیلد ورودی *</Label>
                    <Select value={fieldType} onValueChange={(val: any) => setFieldType(val)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="نوع فیلد" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {fieldType === 'select' && (
                  <div className="space-y-1 text-xs">
                    <Label className="font-semibold text-foreground">گزینه‌های انتخاب (جداشده با ویرگول انگلیسی) *</Label>
                    <Input
                      value={fieldOptions}
                      onChange={(e) => setFieldOptions(e.target.value)}
                      placeholder="گزینه ۱, گزینه ۲, گزینه ۳"
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {fieldType === 'formula' && (
                  <div className="space-y-1 text-xs bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <Label className="font-semibold text-foreground">فرمول محاسباتی ریاضی</Label>
                    <Input
                      value={fieldFormula}
                      onChange={(e) => setFieldFormula(e.target.value)}
                      placeholder="مثال: [hours] * [multiplier]"
                      className="h-8 text-xs font-mono text-left"
                      dir="ltr"
                    />
                    <span className="text-[10px] text-foreground-muted block mt-1">نام فیلدهای عددی دیگر را داخل براکت قرار دهید تا به صورت داینامیک ارزیابی شود.</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <Checkbox
                    id="required"
                    checked={fieldRequired}
                    onCheckedChange={(checked: boolean) => setFieldRequired(checked)}
                  />
                  <Label htmlFor="required" className="font-semibold text-foreground cursor-pointer">پر کردن این فیلد اجباری است</Label>
                </div>

                <Button onClick={handleAddField} className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8">
                  افزودن فیلد به فرم
                </Button>
              </CardContent>
            </Card>

            {/* Preview and Order */}
            <Card className="border-border bg-surface">
              <CardHeader className="p-4 pb-2 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-foreground">پیش‌نمایش چیدمان فرم</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {fields.length === 0 ? (
                  <span className="text-xs text-foreground-muted block py-6 text-center">هیچ فیلدی اضافه نشده است. فیلدهای خود را از بالا بسازید.</span>
                ) : (
                  <div className="space-y-2">
                    {fields.map((f, i) => (
                      <div key={i} className="flex justify-between items-center bg-background border border-border p-3 rounded-lg text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-foreground">{f.label} {f.required && <span className="text-red-500">*</span>}</span>
                          <span className="text-[10px] text-foreground-muted block">کد: <code className="font-mono">{f.name}</code> | نوع: {FIELD_TYPES.find((t) => t.value === f.type)?.label}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(i)}
                          className="h-6 text-red-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar workflow config */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border bg-surface">
              <CardHeader className="p-4 pb-2 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-foreground">پیکربندی گردش‌کار</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-3">
                  <div className="bg-background border border-border p-3 rounded-lg space-y-2">
                    <span className="font-bold text-foreground block">مرحله ۱: تایید سرشیفت کشیک</span>
                    <span className="text-[10px] text-foreground-muted block">مسئول بررسی: نقش supervisor | مهلت اقدام: ۲۴ ساعت</span>
                  </div>

                  <div className="bg-background border border-border p-3 rounded-lg space-y-2">
                    <span className="font-bold text-foreground block">مرحله ۲: تایید رئیس منابع انسانی</span>
                    <span className="text-[10px] text-foreground-muted block">مسئول بررسی: نقش manager/HR</span>
                  </div>
                </div>

                <div className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-relaxed">
                  قوانین گردش‌کار پیش‌فرض مرجع (تایید سرشیفت &larr; تایید منابع انسانی) به نسخه قفل و اعمال می‌شود. شما می‌توانید قوانین شرطی و مراحل اختصاصی را برای فرم‌های پیچیده سفارشی کنید.
                </div>

                <Button
                  onClick={handlePublishVersion}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                >
                  <CheckCircle className="size-4 me-1.5" />
                  انتشار و فعال‌سازی نهایی فرم
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-right text-foreground">ایجاد قالب فرم جدید</DialogTitle>
            <DialogDescription className="text-right text-[11px] text-foreground-muted mt-1">مشخصات اولیه فرم را ثبت کنید. فیلدها و گردش‌کار را در مرحله بعد طراحی خواهید کرد.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div className="space-y-1">
              <Label htmlFor="key" className="font-semibold text-foreground">کد یکتا فرم (فقط حروف کوچک انگلیسی و خط تیره) *</Label>
              <Input
                id="key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="مثال: overtime-request"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="title" className="font-semibold text-foreground">عنوان فرم (فارسی) *</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: درخواست اضافه کاری ماهیانه"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="desc" className="font-semibold text-foreground">توضیح کوتاه کارکرد فرم</Label>
              <Textarea
                id="desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="این فرم جهت ثبت و تایید اضافه کاری پرسنل سیر و حرکت..."
                className="min-h-16 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="text-xs h-8 cursor-pointer"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={() => handleCreateTemplate()}
              disabled={creatingTemplate || !newKey || !newTitle}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8"
            >
              {creatingTemplate ? 'در حال ثبت...' : 'ثبت و ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
