'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import {
  Plus,
  Award,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface ActionType {
  id: string
  title: string
  defaultScore: number
  maxSeverity: string
}

interface Competency {
  id: string
  name: string
  weight: number
  direction: string
  actionTypes: ActionType[]
}

const DIRECTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  positive: { label: 'پاداشی', color: 'text-success', icon: TrendingUp },
  negative: { label: 'جریمه‌ای', color: 'text-critical', icon: TrendingDown },
  both: { label: 'دوطرفه', color: 'text-info', icon: Minus },
}

const SEVERITY_LABELS: Record<string, string> = {
  L1: 'سطح ۱ (پایه)',
  L2: 'سطح ۲ (متوسط)',
  L3: 'سطح ۳ (بحرانی)',
}

export default function PerformanceConfigPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState<string | null>(null) // competency id for which form is open

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formScore, setFormScore] = useState<string>('10')
  const [formSeverity, setFormSeverity] = useState<'L1' | 'L2' | 'L3'>('L1')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  async function load() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/performance/logs', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCompetencies(json.data?.competencies ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [accessToken])

  async function handleAddActionType(competencyId: string) {
    const score = parseFloat(formScore)
    if (!formTitle.trim()) { setFormError('عنوان نوع عملکرد الزامی است'); return }
    if (isNaN(score)) { setFormError('امتیاز باید عدد باشد'); return }

    setFormLoading(true)
    setFormError('')
    setFormSuccess('')
    try {
      const res = await fetch('/api/admin/performance/action-types', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competencyId,
          title: formTitle.trim(),
          defaultScore: score,
          maxSeverity: formSeverity,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? 'خطا در ثبت نوع عملکرد')
      } else {
        setFormSuccess('نوع عملکرد جدید با موفقیت افزوده شد')
        setFormTitle('')
        setFormScore('10')
        setFormSeverity('L1')
        setShowForm(null)
        await load()
      }
    } catch {
      setFormError('خطای شبکه')
    } finally {
      setFormLoading(false)
    }
  }

  function openForm(competencyId: string) {
    setShowForm(showForm === competencyId ? null : competencyId)
    setFormError('')
    setFormSuccess('')
    setFormTitle('')
    setFormScore('10')
    setFormSeverity('L1')
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="size-6 text-accent" />
          پیکربندی کاتالوگ عملکرد
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          مدیریت شایستگی‌ها و انواع عملکرد قابل ثبت برای پرسنل
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container-low border border-border" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {competencies.map((competency) => {
            const dirCfg = DIRECTION_CONFIG[competency.direction] ?? DIRECTION_CONFIG.both
            const DirIcon = dirCfg.icon
            const isExpanded = expandedId === competency.id
            const isFormOpen = showForm === competency.id

            return (
              <Card key={competency.id} className="overflow-hidden">
                {/* Competency Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : competency.id)}
                  className="w-full text-start"
                >
                  <CardHeader className="pb-2 hover:bg-surface-container-low/50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                          <Award className="size-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-semibold text-foreground">
                            {competency.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${dirCfg.color} border-current/30`}
                            >
                              <DirIcon className="size-3 me-1 inline" />
                              {dirCfg.label}
                            </Badge>
                            <span className="text-[10px] text-foreground-muted">
                              ضریب: {toFa(competency.weight)}
                            </span>
                            <span className="text-[10px] text-foreground-muted">
                              {toFa(competency.actionTypes.length)} نوع عملکرد
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-foreground-muted shrink-0" />
                      ) : (
                        <ChevronDown className="size-4 text-foreground-muted shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <CardContent className="pt-0 pb-4 space-y-2">
                    {/* Action Types list */}
                    <div className="space-y-1.5 mb-3">
                      {competency.actionTypes.length === 0 ? (
                        <p className="text-xs text-foreground-muted text-center py-4">
                          هیچ نوع عملکردی تعریف نشده است
                        </p>
                      ) : (
                        competency.actionTypes.map((at) => (
                          <div
                            key={at.id}
                            className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-container/40 px-3 py-2"
                          >
                            <div className={`flex size-6 shrink-0 items-center justify-center rounded text-xs font-bold ${at.defaultScore >= 0 ? 'bg-success/10 text-success' : 'bg-critical/10 text-critical'}`}>
                              {at.defaultScore >= 0 ? '+' : ''}
                              {toFa(at.defaultScore)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{at.title}</p>
                              <p className="text-[10px] text-foreground-muted">{SEVERITY_LABELS[at.maxSeverity]}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[9px] shrink-0 ${at.id.startsWith('c-') ? 'border-accent/30 text-accent' : 'border-border text-foreground-muted'}`}
                            >
                              {at.id.startsWith('c-') ? 'سفارشی' : 'پیش‌فرض'}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new action type form */}
                    {isFormOpen ? (
                      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
                        <p className="text-xs font-semibold text-accent">افزودن نوع عملکرد جدید به «{competency.name}»</p>

                        <div className="space-y-2">
                          <Label className="text-xs text-foreground-muted">عنوان عملکرد</Label>
                          <Input
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="مثلاً: مدیریت بهینه انرژی در شیفت"
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs text-foreground-muted">
                              امتیاز پایه
                              <span className="text-[10px] text-foreground-muted/60 ms-1">(منفی = جریمه)</span>
                            </Label>
                            <Input
                              type="number"
                              value={formScore}
                              onChange={(e) => setFormScore(e.target.value)}
                              placeholder="مثلاً ۱۰ یا ۱۵-"
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-foreground-muted">حداکثر سطح اعمال</Label>
                            <select
                              value={formSeverity}
                              onChange={(e) => setFormSeverity(e.target.value as 'L1' | 'L2' | 'L3')}
                              className="flex h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                            >
                              <option value="L1">سطح ۱ (پایه)</option>
                              <option value="L2">سطح ۲ (متوسط)</option>
                              <option value="L3">سطح ۳ (بحرانی)</option>
                            </select>
                          </div>
                        </div>

                        {formError && (
                          <div className="flex items-center gap-2 text-xs text-critical">
                            <AlertCircle className="size-3.5 shrink-0" />
                            {formError}
                          </div>
                        )}
                        {formSuccess && (
                          <div className="flex items-center gap-2 text-xs text-success">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            {formSuccess}
                          </div>
                        )}

                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openForm(competency.id)}
                            className="text-xs"
                          >
                            انصراف
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddActionType(competency.id)}
                            disabled={formLoading}
                            className="text-xs"
                          >
                            {formLoading ? 'در حال ثبت...' : 'ثبت نوع عملکرد'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openForm(competency.id)}
                        className="w-full text-xs border-dashed border-accent/40 text-accent hover:bg-accent/5"
                      >
                        <Plus className="size-3.5 me-1" />
                        افزودن نوع عملکرد جدید به این شایستگی
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="bg-surface-container-low/50">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-foreground mb-2">راهنمای سطوح اعمال</p>
          <div className="grid grid-cols-1 gap-1.5">
            {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-foreground-muted">
                <Badge variant="outline" className="text-[9px] px-1.5">{key}</Badge>
                <span>{label}</span>
                <span className="text-foreground-muted/60">
                  {key === 'L1' ? '— ضریب ۱×' : key === 'L2' ? '— ضریب ۱.۵×' : '— ضریب ۲×'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
