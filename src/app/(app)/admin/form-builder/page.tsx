'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa } from '@/lib/fa'
import { FileText, Plus, Trash, Eye, Settings, ShieldCheck, MapPin, Upload, PenTool } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'file' | 'gps' | 'signature'
  placeholder?: string
  required: boolean
}

interface FormTemplate {
  id: string
  title: string
  description: string
  category: string
  fields: FormField[]
  isActive: boolean
}

export default function FormBuilderPage() {
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [activeTab, setActiveTab] = useState<'forms-list' | 'builder'>('forms-list')

  // Builder States
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('safety')
  const [fields, setFields] = useState<FormField[]>([])
  
  // Field Editor States
  const [fieldLabel, setFieldLabel] = useState('')
  const [fieldType, setFieldType] = useState<FormField['type']>('text')
  const [fieldPlaceholder, setFieldPlaceholder] = useState('')
  const [fieldRequired, setFieldRequired] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const defaultTemplates: FormTemplate[] = [
    {
      id: 'form-1',
      title: 'فرم گزارش سانحه و تخلفات ایمنی',
      description: 'ثبت و پیگیری تخلفات، خرابی‌های خط و حوادث حین حرکت قطارها.',
      category: 'safety',
      isActive: true,
      fields: [
        { id: 'f-1', label: 'عنوان حادثه', type: 'text', placeholder: 'عنوان رویداد...', required: true },
        { id: 'f-2', label: 'شرح کامل واقعه', type: 'textarea', placeholder: 'توضیحات تکمیلی...', required: true },
        { id: 'f-3', label: 'موقعیت GPS', type: 'gps', required: true },
      ]
    },
    {
      id: 'form-2',
      title: 'فرم تحویل و چک‌لیست تجهیزات انفرادی',
      description: 'ثبت تحویل اقلام تدارکاتی انبار به پرسنل سیر و حرکت.',
      category: 'logistics',
      isActive: true,
      fields: [
        { id: 'f-4', label: 'کد پرسنلی دریافت‌کننده', type: 'number', placeholder: 'کد ۶ رقمی...', required: true },
        { id: 'f-5', label: 'امضای الکترونیکی راهبر', type: 'signature', required: true },
      ]
    }
  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_custom_forms')
      if (saved) setForms(JSON.parse(saved))
      else {
        setForms(defaultTemplates)
        window.localStorage.setItem('metro_custom_forms', JSON.stringify(defaultTemplates))
      }
    }
  }, [])

  const handleAddField = () => {
    if (!fieldLabel.trim()) return
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: fieldLabel,
      type: fieldType,
      placeholder: fieldPlaceholder || undefined,
      required: fieldRequired
    }
    setFields([...fields, newField])
    setFieldLabel('')
    setFieldPlaceholder('')
    setFieldRequired(false)
  }

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const handlePublishForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || fields.length === 0) {
      alert('عنوان فرم و حداقل یک فیلد الزامی است.')
      return
    }
    setSubmitting(true)

    const newForm: FormTemplate = {
      id: `form-${Date.now()}`,
      title,
      description,
      category,
      fields,
      isActive: true
    }

    const updated = [newForm, ...forms]
    setForms(updated)
    window.localStorage.setItem('metro_custom_forms', JSON.stringify(updated))

    setTimeout(() => {
      setSuccessMsg('فرم جدید سازمانی با موفقیت منتشر گردید و در دسترس کارتابل‌های تابعه قرار گرفت.')
      setSubmitting(false)
      setTitle('')
      setDescription('')
      setFields([])
      setTimeout(() => {
        setSuccessMsg('')
        setActiveTab('forms-list')
      }, 1500)
    }, 1000)
  }

  const handleDeleteForm = (id: string) => {
    if (!confirm('آیا از حذف این فرم اطمینان دارید؟')) return
    const updated = forms.filter(f => f.id !== id)
    setForms(updated)
    window.localStorage.setItem('metro_custom_forms', JSON.stringify(updated))
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'safety': return 'ایمنی و سوانح'
      case 'logistics': return 'تدارکات و انبار'
      case 'training': return 'آموزشی'
      default: return 'عمومی'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Settings className="size-6 text-accent" />
          فرم‌ساز سازمانی
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          ایجاد و انتشار فرم‌های دیجیتال گزارش‌دهی، ارزیابی، تحویل تجهیزات و انبار خط ۱ مترو تهران
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('forms-list')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'forms-list'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          فرم‌های منتشر شده
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'builder'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          طراحی فرم جدید
        </button>
      </div>

      {/* LIST OF FORMS */}
      {activeTab === 'forms-list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col justify-between border-accent/10">
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-bold text-foreground">{form.title}</span>
                  <Badge variant="outline" className="text-[9px] bg-accent/5 text-accent">
                    {getCategoryLabel(form.category)}
                  </Badge>
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed">{form.description}</p>
                <div className="text-[10px] text-foreground-muted font-bold">
                  تعداد فیلدها: {toFa(form.fields.length)} مورد
                </div>
              </div>

              <div className="p-3 bg-surface-container-low border-t border-border/40 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteForm(form.id)}
                  className="h-7 text-[10px] font-bold border-critical/40 text-critical hover:bg-critical/10 cursor-pointer"
                >
                  <Trash className="size-3.5 me-0.5" />
                  حذف فرم
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* BUILDER TAB */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Builder controls */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold">تنظیمات و چیدمان فیلدهای فرم</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {successMsg && (
                <div className="p-3 rounded bg-success/15 border border-success/30 text-success text-xs font-bold">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handlePublishForm} className="space-y-4 text-xs">
                <div>
                  <Label htmlFor="form-title" className="font-bold">عنوان فرم <span className="text-critical">*</span></Label>
                  <Input
                    id="form-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: فرم ثبت گزارش تاخیرات حرکت"
                    className="mt-1 h-8 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form-category" className="font-bold">دسته‌بندی</Label>
                    <select
                      id="form-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 flex h-8 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="safety">ایمنی و سوانح</option>
                      <option value="logistics">تدارکات و انبار</option>
                      <option value="training">ارزیابی آموزشی</option>
                      <option value="general">عمومی</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="form-desc" className="font-bold">توضیحات کوتاه</Label>
                    <Input
                      id="form-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="هدف از پر کردن فرم..."
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Add Field controls */}
                <div className="p-3 border border-border/40 rounded-lg bg-surface-container-low space-y-3">
                  <span className="font-bold text-accent block">افزودن فیلد جدید به فرم:</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="field-lbl" className="text-[10px] font-bold">عنوان فیلد <span className="text-critical">*</span></Label>
                      <Input
                        id="field-lbl"
                        value={fieldLabel}
                        onChange={(e) => setFieldLabel(e.target.value)}
                        placeholder="مثال: شماره رام قطار"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="field-type" className="text-[10px] font-bold">نوع داده فیلد</Label>
                      <select
                        id="field-type"
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value as any)}
                        className="mt-1 flex h-8 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="text">متن کوتاه</option>
                        <option value="textarea">توضیحات متنی بلند</option>
                        <option value="number">عددی</option>
                        <option value="date">تاریخ شمسی</option>
                        <option value="file">پیوست عکس / فایل</option>
                        <option value="gps">موقعیت مکانی (GPS)</option>
                        <option value="signature">امضای الکترونیکی پرسنل</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="field-placeholder" className="text-[10px] font-bold">متن کمکی (Placeholder)</Label>
                      <Input
                        id="field-placeholder"
                        value={fieldPlaceholder}
                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                        placeholder="متن داخل فیلد..."
                        className="mt-1 h-8 text-xs"
                        disabled={fieldType === 'gps' || fieldType === 'signature'}
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldRequired}
                          onChange={(e) => setFieldRequired(e.target.checked)}
                          className="size-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-foreground-muted">پاسخ به فیلد اجباری است</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddField}
                    className="w-full h-8 text-xs font-bold"
                  >
                    <Plus className="size-3.5 me-0.5" />
                    افزودن فیلد به چیدمان
                  </Button>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={submitting} className="h-8 text-xs font-bold">
                    {submitting ? 'در حال ثبت...' : 'ذخیره و انتشار نهایی فرم'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Form Live Preview */}
          <Card className="border-accent/10">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Eye className="size-4.5 text-accent" />
                پیش‌نمایش زنده فرم در موبایل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="border border-border rounded-xl p-4 bg-neutral-950 max-w-sm mx-auto shadow-inner space-y-4 min-h-[300px]">
                <div className="text-center border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-foreground">{title || 'عنوان فرم آزمایشی'}</span>
                  <p className="text-[10px] text-foreground-muted mt-1">{description || 'توضیحات و ضرورت پر کردن این فرم...'}</p>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center text-[10px] text-foreground-muted/60 py-12">
                    فیلدی اضافه نشده است. از منوی سمت راست فیلدهای خود را بسازید.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((f, idx) => (
                      <div key={f.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] font-bold text-foreground">
                            {f.label} {f.required && <span className="text-critical">*</span>}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveField(f.id)}
                            className="h-5 w-5 p-0 text-critical hover:bg-critical/10 rounded cursor-pointer"
                          >
                            <Trash className="size-3" />
                          </Button>
                        </div>

                        {f.type === 'text' && (
                          <Input placeholder={f.placeholder} className="h-7 text-[10px] cursor-not-allowed" disabled />
                        )}
                        {f.type === 'textarea' && (
                          <textarea placeholder={f.placeholder} rows={2} className="w-full rounded bg-surface border border-border px-2 py-1 text-[10px] cursor-not-allowed" disabled />
                        )}
                        {f.type === 'number' && (
                          <Input type="number" placeholder={f.placeholder} className="h-7 text-[10px] cursor-not-allowed" disabled />
                        )}
                        {f.type === 'date' && (
                          <Input type="date" className="h-7 text-[10px] cursor-not-allowed text-foreground-muted" disabled />
                        )}
                        {f.type === 'file' && (
                          <div className="border border-dashed border-border rounded p-2 text-center text-[9px] text-foreground-muted flex items-center justify-center gap-1">
                            <Upload className="size-3" />
                            <span>بارگذاری فایل / عکس</span>
                          </div>
                        )}
                        {f.type === 'gps' && (
                          <div className="border border-border bg-surface-container-low rounded p-2 text-center text-[9px] text-foreground-muted flex items-center justify-between">
                            <span className="flex items-center gap-1"><MapPin className="size-3 text-accent" /> موقعیت مکانی GPS</span>
                            <span className="font-data-mono">۳۵.۷۲۱, ۵۱.۴۱۱</span>
                          </div>
                        )}
                        {f.type === 'signature' && (
                          <div className="border border-border bg-surface-container-low rounded p-2 text-center text-[9px] text-foreground-muted flex flex-col items-center justify-center gap-1.5 min-h-[50px]">
                            <PenTool className="size-3.5 text-accent" />
                            <span>محل درج امضای دیجیتال راهبر</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
