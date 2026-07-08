'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShieldAlert, Save, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ValidationRule {
  id: string
  key: string
  label: string
  description: string | null
  isEnabled: boolean
  severity: 'warning' | 'error'
  params: string | null
  category: string
}

export default function ValidationRulesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [rules, setRules] = useState<ValidationRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchRules()
    }
  }, [accessToken])

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/roster/validation-rules', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (res.ok) {
        setRules(data.data)
      } else {
        toast.error(data.error || 'خطا در دریافت اطلاعات')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/roster/validation-rules', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ rules })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setIsSaving(false)
    }
  }

  const updateRule = (id: string, updates: Partial<ValidationRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/admin/roster" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              بازگشت به پنل لوحه
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            قواعد اعتبارسنجی لوحه
          </h1>
          <p className="text-muted-foreground mt-2">
            فعال‌سازی و مدیریت قوانین بررسی خودکار لوحه‌ها در هنگام انتشار
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          ذخیره تغییرات
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className={rule.isEnabled ? 'border-r-4 border-r-primary' : 'opacity-75'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-left" dir="rtl">{rule.label}</CardTitle>
                  <CardDescription className="text-left font-mono text-xs mt-1" dir="ltr">{rule.key}</CardDescription>
                  {rule.description && <CardDescription className="text-right">{rule.description}</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${rule.id}`}>{rule.isEnabled ? 'فعال' : 'غیرفعال'}</Label>
                  <Switch 
                    id={`active-${rule.id}`}
                    checked={rule.isEnabled}
                    onCheckedChange={(val) => updateRule(rule.id, { isEnabled: val })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="space-y-2">
                  <Label>شدت خطا (Severity)</Label>
                  <Select 
                    disabled={!rule.isEnabled}
                    value={rule.severity} 
                    onValueChange={(val: string | null) => val && updateRule(rule.id, { severity: val as 'warning' | 'error' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warning">هشدار (Warning)</SelectItem>
                      <SelectItem value="error">خطای بحرانی (Error - مانع انتشار)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>پارامترها (JSON اختیاری)</Label>
                  <Input 
                    disabled={!rule.isEnabled}
                    placeholder='مثال: {"min_hours": 8}'
                    value={rule.params || ''}
                    onChange={(e) => updateRule(rule.id, { params: e.target.value })}
                    className="font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {rules.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
              هیچ قاعده‌ای در سیستم ثبت نشده است.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
