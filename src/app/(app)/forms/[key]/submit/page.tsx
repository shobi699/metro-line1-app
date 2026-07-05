'use client'

import { use, useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toFa } from '@/lib/fa'
import { ArrowRight, Save, Send, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FormField {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
  formula?: string
  visibleWhen?: { field: string; equals: any }
}

export default function SubmitFormPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params)
  const { accessToken } = useAuthStore()
  const router = useRouter()

  const [formSpec, setFormSpec] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Form responses
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function evaluateLiveFormula(formula: string, data: Record<string, any>): number {
    try {
      let expression = formula
      const fieldPattern = /\[([a-zA-Z0-9_-]+)\]/g
      let match
      while ((match = fieldPattern.exec(formula)) !== null) {
        const fieldName = match[1]
        const val = Number(data[fieldName] ?? 0)
        expression = expression.replace(match[0], String(val))
      }
      expression = expression.replace(/[^0-9+\-*/().\s]/g, '')
      const fn = new Function(`return (${expression})`)
      const result = fn()
      return isNaN(result) || !isFinite(result) ? 0 : result
    } catch {
      return 0
    }
  }

  async function loadFormSpec() {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${key}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setFormSpec(json.data)
        
        // مقداردهی اولیه فیلدها
        const initial: Record<string, any> = {}
        json.data.schema.fields.forEach((f: FormField) => {
          if (f.type === 'checkbox') initial[f.name] = false
          else if (f.type === 'number') initial[f.name] = 0
          else initial[f.name] = ''
        })
        setFormData(initial)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFormSpec()
  }, [key])

  // ارزیابی زنده فیلدهای محاسباتی در فرانت‌اند
  useEffect(() => {
    if (!formSpec || !formSpec.schema?.fields) return

    let dataChanged = false
    const updatedData = { ...formData }

    for (const field of formSpec.schema.fields) {
      if (field.type === 'formula' && field.formula) {
        // محاسبه فرمول زنده
        const newVal = evaluateLiveFormula(field.formula, updatedData)
        if (updatedData[field.name] !== newVal) {
          updatedData[field.name] = newVal
          dataChanged = true
        }
      }
    }

    if (dataChanged) {
      setFormData(updatedData)
    }
  }, [formData, formSpec])

  // بررسی شرط نمایش فیلد
  function isFieldVisible(field: FormField): boolean {
    if (!field.visibleWhen) return true
    const depVal = formData[field.visibleWhen.field]
    return depVal === field.visibleWhen.equals
  }

  async function handleSubmit(isDraft = false) {
    setSubmitting(true)
    setValidationErrors({})
    try {
      const res = await fetch(`/api/forms/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(isDraft && { 'x-draft': 'true' }),
        },
        body: JSON.stringify({ data: formData }),
      })

      if (res.ok) {
        alert(isDraft ? 'پیش‌نویس با موفقیت ذخیره شد.' : 'درخواست شما با موفقیت ثبت و به جریان افتاد.')
        router.push('/forms')
      } else {
        const json = await res.json()
        if (json.validationErrors) {
          setValidationErrors(json.validationErrors)
        } else {
          alert(json.error || 'خطا در ثبت نهایی فرم')
        }
      }
    } catch (err) {
      console.error(err)
      alert('خطای سیستمی رخ داد.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-foreground-muted animate-pulse">در حال دریافت ساختار فرم...</span>
      </div>
    )
  }

  if (!formSpec) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-red-400">قالب فرم یافت نشد یا دسترسی شما مسدود است.</span>
      </div>
    )
  }

  const fields: FormField[] = formSpec.schema.fields
  const sections = formSpec.schema.layout || [
    { section: 'اطلاعات عمومی درخواست', fields: fields.map((f) => f.name) }
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-2xl mx-auto" dir="rtl">
      {/* Header breadcrumb & controls */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/forms" className="hover:text-foreground">فرم‌های پرسنلی</Link>
            <span>/</span>
            <span>ثبت {formSpec.title}</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{formSpec.title}</h1>
        </div>
        <Link href="/forms">
          <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer gap-1">
            <ArrowRight className="size-3.5" />
            بازگشت
          </Button>
        </Link>
      </div>

      <div className="space-y-6 text-xs">
        {/* Render sections and layout */}
        {sections.map((sec: any, secIdx: number) => {
          // فیلتر کردن فیلدهای این بخش که مرئی هستند
          const visibleSectionFields = fields.filter(
            (f) => sec.fields.includes(f.name) && isFieldVisible(f)
          )

          if (visibleSectionFields.length === 0) return null

          return (
            <Card key={secIdx} className="border-border bg-surface">
              <CardHeader className="p-4 pb-2 border-b border-border/40">
                <CardTitle className="text-xs font-bold text-foreground">{sec.section}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {visibleSectionFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label className="font-semibold text-foreground flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500 font-bold">*</span>}
                    </Label>

                    {field.type === 'textarea' ? (
                      <Textarea
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        placeholder="متن خود را بنویسید..."
                        className="min-h-16 text-xs"
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={formData[field.name] ?? ''}
                        onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="انتخاب گزینه..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          id={field.name}
                          checked={!!formData[field.name]}
                          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                          className="size-4 rounded accent-red-600"
                        />
                        <Label htmlFor={field.name} className="cursor-pointer text-[11px] text-foreground-muted">تایید می‌کنم</Label>
                      </div>
                    ) : field.type === 'formula' ? (
                      <div className="h-8 px-3 flex items-center justify-between bg-background border border-border rounded-lg font-mono font-bold text-red-400">
                        <span>{toFa(formData[field.name] ?? 0)}</span>
                        <span className="text-[9px] text-foreground-muted font-sans font-normal">فیلد محاسباتی خودکار</span>
                      </div>
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[field.name] ?? ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="h-8 text-xs"
                      />
                    )}

                    {validationErrors[field.name] && (
                      <span className="text-[10px] text-red-400 font-bold block mt-1">
                        {validationErrors[field.name]}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="text-xs h-8 gap-1 cursor-pointer font-bold border-zinc-800 hover:bg-zinc-900"
          >
            <Save className="size-3.5" />
            ذخیره پیش‌نویس
          </Button>

          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="text-xs h-8 gap-1 cursor-pointer font-bold bg-red-600 hover:bg-red-700 text-white"
          >
            <Send className="size-3.5" />
            ارسال و جریان تایید
          </Button>
        </div>
      </div>
    </div>
  )
}
