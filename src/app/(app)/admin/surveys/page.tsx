'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toFa, jalali } from '@/lib/fa'
import { ClipboardList, Plus, Trash, ArrowRight, ShieldCheck, BarChart3, Users, Clock, Loader2 } from 'lucide-react'

export default function SurveysAdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Creation Form State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isMandatory, setIsMandatory] = useState(false)
  const [questions, setQuestions] = useState<any[]>([
    { id: 'q1', q: 'رضایت شما از وضعیت شیفت‌های گردشی چقدر است؟', type: 'rating', required: true }
  ])
  
  // Targeting
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [targetStations, setTargetStations] = useState<string[]>([])
  const [targetGroups, setTargetGroups] = useState<string[]>([])

  // Analytics View State
  const [viewAnalyticsSurvey, setViewAnalyticsSurvey] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Options helpers
  const rolesList = ['operator', 'admin', 'supervisor', 'manager']
  const stationsList = ['depot-north', 'tajrish', 'darvazeh-dowlat', 'shahr-e-rey']
  const groupsList = ['A', 'B', 'C', 'D']

  useEffect(() => {
    if (accessToken) {
      void loadSurveys()
    }
  }, [accessToken])

  async function loadSurveys() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/surveys', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSurveys(json.data ?? [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    const nextId = `q${questions.length + 1}`
    setQuestions([...questions, { id: nextId, q: '', type: 'multiple_choice', options: ['', ''], required: true }])
  }

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const handleQuestionChange = (idx: number, field: string, val: any) => {
    const updated = [...questions]
    updated[idx] = { ...updated[idx], [field]: val }
    setQuestions(updated)
  }

  const handleAddChoiceOption = (qIdx: number) => {
    const q = questions[qIdx]
    const opts = (q.options as string[]) || []
    handleQuestionChange(qIdx, 'options', [...opts, ''])
  }

  const handleRemoveChoiceOption = (qIdx: number, oIdx: number) => {
    const q = questions[qIdx]
    const opts = (q.options as string[]) || []
    if (opts.length <= 2) return
    handleQuestionChange(qIdx, 'options', opts.filter((_, idx: number) => idx !== oIdx))
  }

  const handleOptionValChange = (qIdx: number, oIdx: number, val: string) => {
    const q = questions[qIdx]
    const opts = [...(q.options || [])]
    opts[oIdx] = val
    handleQuestionChange(qIdx, 'options', opts)
  }

  const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  async function handleCreateSurvey(e: React.FormEvent) {
    e.preventDefault()
    if (!key.trim() || !title.trim() || questions.length === 0) {
      alert('لطفاً عنوان، کلید پیمایش و حداقل یک سوال وارد کنید.')
      return
    }

    try {
      const audience = {
        roles: targetRoles.length > 0 ? targetRoles : undefined,
        stations: targetStations.length > 0 ? targetStations : undefined,
        groups: targetGroups.length > 0 ? targetGroups : undefined,
      }

      const res = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          key,
          title,
          description,
          schema: questions,
          audience: Object.values(audience).some(Boolean) ? audience : undefined,
          isAnonymous,
          isMandatory,
        }),
      })

      if (res.ok) {
        setShowCreateForm(false)
        setKey('')
        setTitle('')
        setDescription('')
        setQuestions([{ id: 'q1', q: 'رضایت شما از وضعیت شیفت‌های گردشی چقدر است؟', type: 'rating', required: true }])
        setTargetRoles([])
        setTargetStations([])
        setTargetGroups([])
        void loadSurveys()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ایجاد پیمایش')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  async function handleCloseSurvey(surveyId: string) {
    if (!confirm('آیا مایل به بستن این پیمایش هستید؟')) return
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'closed' }),
      })
      if (res.ok) {
        void loadSurveys()
        if (viewAnalyticsSurvey?.id === surveyId) {
          void loadAnalytics(surveyId)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadAnalytics(surveyId: string) {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/analytics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAnalytics(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const renderAnalyticsForSurvey = () => {
    if (!analytics) return null

    const questionsList = typeof analytics.survey.schema === 'string'
      ? JSON.parse(analytics.survey.schema)
      : analytics.survey.schema

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex justify-between items-center bg-background border p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <div>
              <h2 className="font-bold text-sm text-foreground">{analytics.survey.title}</h2>
              <p className="text-[10px] text-foreground-muted mt-1 leading-relaxed">
                نتایج ثبت شده پیمایش (ناشناس: {analytics.survey.isAnonymous ? 'بله' : 'خیر'})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="font-data-mono text-[10px]">
              مشارکت: {toFa(analytics.stats.participationRate)}% ({toFa(analytics.stats.respondedCount)} پاسخ از {toFa(analytics.stats.totalInvitees)})
            </Badge>
            {analytics.survey.status === 'published' && (
              <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => handleCloseSurvey(analytics.survey.id)}>
                بستن پیمایش
              </Button>
            )}
          </div>
        </div>

        {/* Questions Summary */}
        <div className="space-y-4">
          {questionsList.map((q: any) => {
            const answersForQ = analytics.responses.map((r: any) => r.answers[q.id]).filter((a: any) => a !== undefined)
            
            return (
              <Card key={q.id} className="border-accent/10">
                <CardHeader className="p-4 pb-2">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span className="text-accent">{toFa(q.id.replace('q', ''))}.</span>
                    <span>{q.q}</span>
                    <Badge variant="outline" className="text-[9px] scale-90">{q.type}</Badge>
                  </h4>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-xs space-y-2">
                  {q.type === 'rating' && answersForQ.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-foreground-muted">
                        <span>میانگین امتیاز:</span>
                        <span className="font-bold text-accent font-data-mono">
                          {toFa((answersForQ.reduce((s: number, a: number) => s + a, 0) / answersForQ.length).toFixed(1))} / ۵
                        </span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-foreground-muted">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const count = answersForQ.filter((a: any) => a === i + 1).length
                          return (
                            <span key={i} className="bg-muted px-2 py-0.5 rounded font-data-mono">
                              ستاره {toFa(i + 1)}: {toFa(count)} پاسخ
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {q.type === 'boolean' && answersForQ.length > 0 && (
                    <div className="flex gap-4">
                      <span className="bg-success/5 border border-success/20 text-success px-3 py-1 rounded font-data-mono">
                        بله: {toFa(answersForQ.filter((a: any) => a === true).length)} نفر
                      </span>
                      <span className="bg-destructive/5 border border-destructive/20 text-destructive px-3 py-1 rounded font-data-mono">
                        خیر: {toFa(answersForQ.filter((a: any) => a === false).length)} نفر
                      </span>
                    </div>
                  )}

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2.5">
                      {q.options.map((opt: string, i: number) => {
                        const count = answersForQ.filter((a: any) => a === opt).length
                        const pct = answersForQ.length > 0 ? Math.round((count / answersForQ.length) * 100) : 0
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-foreground-muted">
                              <span>{opt}</span>
                              <span className="font-data-mono">{toFa(count)} پاسخ ({toFa(pct)}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-foreground-muted">آخرین پاسخ‌ها:</span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {answersForQ.slice(-5).map((a: string, i: number) => (
                          <div key={i} className="p-2 bg-muted/40 rounded border border-border/30 text-[11px] leading-relaxed">
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Responses with masked segment check */}
        <Card className="border-accent/10">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>پاسخ‌های ثبت‌شده با رعایت حریم خصوصی (دسته کمتر از ۵ نفر ادغام شده‌اند)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-3 text-start">ردیف</th>
                    <th className="p-3 text-start">نقش</th>
                    <th className="p-3 text-start">ایستگاه</th>
                    <th className="p-3 text-start">گروه</th>
                    <th className="p-3 text-start">تعداد پاسخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {analytics.responses.slice(0, 10).map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="p-3 font-data-mono">{toFa(idx + 1)}</td>
                      <td className="p-3">{r.segment.role}</td>
                      <td className="p-3">{r.segment.station}</td>
                      <td className="p-3">{r.segment.group}</td>
                      <td className="p-3 font-data-mono">{toFa(Object.keys(r.answers).length)} سوال</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewAnalyticsSurvey && (
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => { setViewAnalyticsSurvey(null); setAnalytics(null); }}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
              <ClipboardList className="size-6 text-accent" />
              <span>{viewAnalyticsSurvey ? 'تحلیل پیمایش' : 'مدیریت پیمایش‌های سازمانی'}</span>
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              {viewAnalyticsSurvey ? 'مشاهده نرخ مشارکت و آمار فراوانی آرا' : 'ساخت و انتشار پیمایش‌های چندسوالی per مخاطب هدف'}
            </p>
          </div>
        </div>
        {!viewAnalyticsSurvey && !showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="font-bold gap-1.5 text-xs">
            <Plus className="size-4" />
            <span>پیمایش جدید</span>
          </Button>
        )}
      </div>

      {viewAnalyticsSurvey ? (
        analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-xs text-foreground-muted">در حال واکشی نتایج...</span>
          </div>
        ) : (
          renderAnalyticsForSurvey()
        )
      ) : showCreateForm ? (
        <form onSubmit={handleCreateSurvey} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-foreground border-b pb-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-accent" /> ایجاد پیمایش جدید
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="key" className="text-xs font-bold">کلید یکتا (Slug - انگلیسی) <span className="text-critical">*</span></Label>
              <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="مثال: job-satisfaction-1405" className="mt-1.5 text-xs font-mono" required />
            </div>
            <div>
              <Label htmlFor="title" className="text-xs font-bold">عنوان پیمایش <span className="text-critical">*</span></Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ارزیابی رضایت شغلی سال ۱۴۰۵" className="mt-1.5 text-xs" required />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-xs font-bold">توضیحات تکمیلی</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مقصود و مخاطب این پیمایش چیست..." className="mt-1.5 text-xs" />
          </div>

          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <Switch id="isAnonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <Label htmlFor="isAnonymous" className="text-xs font-bold cursor-pointer">ناشناس واقعی (حفاظت از اطلاعات هویت)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isMandatory" checked={isMandatory} onCheckedChange={setIsMandatory} />
              <Label htmlFor="isMandatory" className="text-xs font-bold cursor-pointer">الزامی (قفل داشبورد تا پاسخ‌دهی)</Label>
            </div>
          </div>

          {/* Targeting */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" /> هدف‌گیری مخاطبین (آزاد گذاشتن = همه پرسنل)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-foreground-muted">نقش‌ها:</span>
                <div className="flex flex-wrap gap-1.5">
                  {rolesList.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleSelection(targetRoles, setTargetRoles, r)}
                      className={`px-2 py-1 rounded border transition-colors ${targetRoles.includes(r) ? 'bg-accent/10 border-accent text-accent' : 'bg-background hover:bg-muted'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground-muted">ایستگاه‌ها/دپوها:</span>
                <div className="flex flex-wrap gap-1.5">
                  {stationsList.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSelection(targetStations, setTargetStations, s)}
                      className={`px-2 py-1 rounded border transition-colors ${targetStations.includes(s) ? 'bg-accent/10 border-accent text-accent' : 'bg-background hover:bg-muted'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground-muted">گروه‌ها/شیفت‌ها:</span>
                <div className="flex flex-wrap gap-1.5">
                  {groupsList.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleSelection(targetGroups, setTargetGroups, g)}
                      className={`px-2 py-1 rounded border transition-colors ${targetGroups.includes(g) ? 'bg-accent/10 border-accent text-accent' : 'bg-background hover:bg-muted'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Question Builder */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-accent" /> سوالات پیمایش ({toFa(questions.length)})
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="h-7 text-[10px] gap-1 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> افزودن سوال
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="p-4 bg-muted/30 border rounded-lg space-y-3 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="absolute top-2 left-2 text-critical hover:bg-critical/10 h-7 w-7 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label className="text-[10px] font-bold">متن سوال {toFa(qIdx + 1)}</Label>
                      <Input
                        value={q.q}
                        onChange={(e) => handleQuestionChange(qIdx, 'q', e.target.value)}
                        placeholder="متن سوال خود را وارد کنید..."
                        className="text-xs mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold">نوع فیلد سوال</Label>
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(qIdx, 'type', e.target.value)}
                        className="w-full bg-background border rounded-md p-2 text-xs mt-1"
                      >
                        <option value="multiple_choice">چندگزینه‌ای</option>
                        <option value="rating">طیف لیکرت (۱–۵)</option>
                        <option value="boolean">بله/خیر</option>
                        <option value="text">تشریحی (متن باز)</option>
                      </select>
                    </div>
                  </div>

                  {q.type === 'multiple_choice' && (
                    <div className="space-y-1.5 pl-6 border-r border-border/60 pr-4 mt-2">
                      <Label className="text-[10px] font-bold flex justify-between items-center">
                        <span>گزینه‌های پاسخ:</span>
                        <Button type="button" variant="ghost" className="h-5 text-[9px] text-accent p-0 hover:bg-transparent" onClick={() => handleAddChoiceOption(qIdx)}>
                          <Plus className="w-3 h-3 me-0.5" /> افزودن گزینه
                        </Button>
                      </Label>
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex gap-2 items-center">
                            <Input
                              value={opt}
                              onChange={(e) => handleOptionValChange(qIdx, oIdx, e.target.value)}
                              placeholder={`گزینه ${toFa(oIdx + 1)}`}
                              className="text-xs h-7"
                              required
                            />
                            {(q.options || []).length > 2 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChoiceOption(qIdx, oIdx)} className="h-7 w-7 text-critical hover:bg-critical/10">
                                <Trash className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="text-xs font-bold">انصراف</Button>
            <Button type="submit" className="text-xs font-bold">انتشار رسمی پیمایش</Button>
          </div>
        </form>
      ) : (
        <Card className="border-accent/10">
          <CardHeader className="p-4 pb-2 border-b">
            <CardTitle className="text-xs font-bold text-foreground">لیست کل پیمایش‌های سازمان</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse text-xs">در حال بارگذاری...</div>
            ) : surveys.length === 0 ? (
              <div className="p-12 text-center text-foreground-muted text-xs">هیچ پیمایشی یافت نشد.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-muted/40 border-b text-foreground-muted">
                    <tr>
                      <th className="p-3 text-start">عنوان پیمایش</th>
                      <th className="p-3 text-start">نوع</th>
                      <th className="p-3 text-start">وضعیت</th>
                      <th className="p-3 text-start">مشارکت</th>
                      <th className="p-3 text-start">تاریخ ایجاد</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {surveys.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="p-3 font-bold">{s.title}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {s.isAnonymous && <Badge variant="secondary" className="text-[9px] bg-accent/5 text-accent">ناشناس</Badge>}
                            {s.isMandatory && <Badge variant="destructive" className="text-[9px]">الزامی</Badge>}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={s.status === 'published' ? 'default' : 'secondary'} className="text-[9px]">
                            {s.status === 'published' ? 'در حال اجرا' : 'بسته شده'}
                          </Badge>
                        </td>
                        <td className="p-3 font-data-mono">
                          {toFa(s.totalResponded)} از {toFa(s.totalInvited)} ({toFa(s.totalInvited > 0 ? Math.round((s.totalResponded / s.totalInvited) * 100) : 0)}%)
                        </td>
                        <td className="p-3 text-foreground-muted">{jalali(s.createdAt)}</td>
                        <td className="p-3 text-center flex justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 cursor-pointer font-bold"
                            onClick={() => {
                              setViewAnalyticsSurvey(s)
                              void loadAnalytics(s.id)
                            }}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>نتایج</span>
                          </Button>
                          {s.status === 'published' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-[10px] cursor-pointer font-bold"
                              onClick={() => handleCloseSurvey(s.id)}
                            >
                              بستن
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Zustand store import mockup for compilation
import { useShiftsStore } from '@/features/shifts'
