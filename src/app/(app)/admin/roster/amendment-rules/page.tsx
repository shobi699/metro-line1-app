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
import { PencilRuler, Save, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface AmendmentRule {
  id: string
  amendmentKind: string
  requireApproval: boolean
  approverRoleKey: string | null
  maxHoursAfterPublish: number | null
  standardReasons: string | null
}

const AMENDMENT_KINDS = [
  { key: 'trip_time', label: 'تغییر ساعت سفر' },
  { key: 'trip_status', label: 'تغییر وضعیت سفر' },
  { key: 'crew_replace', label: 'جابجایی هم‌خدمه' },
  { key: 'crew_add', label: 'افزودن هم‌خدمه' },
  { key: 'crew_remove', label: 'حذف هم‌خدمه' },
  { key: 'trip_add', label: 'افزودن سفر جدید' },
  { key: 'trip_remove', label: 'حذف سفر' },
  { key: 'note', label: 'افزودن/تغییر یادداشت عملیاتی' },
]

export default function AmendmentRulesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [rules, setRules] = useState<AmendmentRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchRules()
    }
  }, [accessToken])

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/roster/amendment-rules', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (res.ok) {
        let fetched = data.data as AmendmentRule[]
        const existingKinds = fetched.map(r => r.amendmentKind)
        const missingKinds = AMENDMENT_KINDS.filter(k => !existingKinds.includes(k.key))
        
        const newRules = missingKinds.map((kind, idx) => ({
          id: `new-${idx}`,
          amendmentKind: kind.key,
          requireApproval: true,
          approverRoleKey: 'admin',
          maxHoursAfterPublish: 24,
          standardReasons: '["خطای انسانی", "تغییر برنامه قطار", "درخواست مرخصی اورژانسی"]'
        }))
        
        setRules([...fetched, ...newRules])
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
      const res = await fetch('/api/admin/roster/amendment-rules', {
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
        fetchRules()
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setIsSaving(false)
    }
  }

  const updateRule = (id: string, updates: Partial<AmendmentRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const getLabel = (key: string) => AMENDMENT_KINDS.find(k => k.key === key)?.label || key

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
            <PencilRuler className="h-8 w-8 text-orange-500" />
            قواعد گردش کار اصلاحیه‌ها
          </h1>
          <p className="text-muted-foreground mt-2">
            تنظیم روند تایید، نقش‌های مجاز و دلایل پیش‌فرض برای انواع مختلف اصلاحیه
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          ذخیره تغییرات
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">
                  نوع اصلاحیه: <span className="text-primary">{getLabel(rule.amendmentKind)}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`req-${rule.id}`}>{rule.requireApproval ? 'نیازمند تایید' : 'تایید خودکار'}</Label>
                  <Switch 
                    id={`req-${rule.id}`}
                    checked={rule.requireApproval}
                    onCheckedChange={(val) => updateRule(rule.id, { requireApproval: val })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>نقش تایید‌کننده</Label>
                  <Select 
                    disabled={!rule.requireApproval}
                    value={rule.approverRoleKey || ''} 
                    onValueChange={(val) => updateRule(rule.id, { approverRoleKey: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نقش" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">ادمین سیستم (Admin)</SelectItem>
                      <SelectItem value="supervisor">سرشیفت (Supervisor)</SelectItem>
                      <SelectItem value="occ">مرکز فرمان (OCC)</SelectItem>
                      <SelectItem value="planner">برنامه‌ریز (Planner)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>مهلت ثبت (ساعت پس از انتشار)</Label>
                  <Input 
                    type="number"
                    value={rule.maxHoursAfterPublish || ''}
                    onChange={(e) => updateRule(rule.id, { maxHoursAfterPublish: parseInt(e.target.value) || null })}
                    placeholder="بدون محدودیت"
                  />
                </div>
                <div className="space-y-2">
                  <Label>دلایل استاندارد (آرایه JSON)</Label>
                  <Input 
                    value={rule.standardReasons || ''}
                    onChange={(e) => updateRule(rule.id, { standardReasons: e.target.value })}
                    className="font-mono text-left"
                    dir="ltr"
                    placeholder='["دلیل 1", "دلیل 2"]'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
