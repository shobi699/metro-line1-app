'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import { Vote, CheckCircle, Plus, Trash, Clock, AlertCircle, ClipboardList } from 'lucide-react'

interface PollOption {
  id: string
  label: string
  _count: { votes: number }
}

interface Poll {
  id: string
  title: string
  description: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  options: PollOption[]
  creator?: { name: string }
  totalVotes: number
  userVote?: string | null
}

export default function PollsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  
  const [activeTab, setActiveTab] = useState<'polls' | 'surveys'>('polls')
  const [polls, setPolls] = useState<Poll[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Creation Form State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const isManager = currentUser?.roleKey === 'super_admin' || 
                    currentUser?.roleKey === 'admin' || 
                    currentUser?.roleKey === 'manager' || 
                    currentUser?.roleKey === 'chief' || 
                    currentUser?.roleKey === 'supervisor'

  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      await Promise.all([loadPolls(), loadSurveys()])
    } finally {
      setLoading(false)
    }
  }

  async function loadPolls() {
    try {
      const res = await fetch('/api/polls', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPolls(data.data ?? [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadSurveys() {
    try {
      const res = await fetch('/api/surveys/my-pending', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.data ?? [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    void loadData()
  }, [accessToken])

  async function handleVote(pollId: string, optionId: string) {
    if (!accessToken) return
    const res = await fetch('/api/polls', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pollId, optionId }),
    })
    if (res.ok) {
      void loadPolls()
    }
  }

  // Handle Poll creation
  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    const filteredOptions = options.filter(opt => opt.trim() !== '')
    if (!title.trim() || filteredOptions.length < 2) {
      setFormError('عنوان نظرسنجی و حداقل ۲ گزینه الزامی است.')
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
          options: filteredOptions,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        setTitle('')
        setDescription('')
        setOptions(['', ''])
        setExpiresAt('')
        void loadPolls()
      } else {
        const errJson = await res.json()
        setFormError(errJson.error || 'خطا در ثبت نظرسنجی')
      }
    } catch {
      setFormError('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddOptionField = () => {
    setOptions([...options, ''])
  }

  const handleRemoveOptionField = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, idx) => idx !== index)
    setOptions(newOptions)
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options]
    newOptions[index] = val
    setOptions(newOptions)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Vote className="size-6 text-accent" />
            نظرسنجی و پیمایش‌ها
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مشارکت در نظرسنجی‌های سریع و پیمایش‌های سازمانی سیر و حرکت خط ۱ مترو
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <Link href="/admin/surveys">
              <Button variant="outline" className="font-bold text-xs">
                <span>پنل مدیریت پیمایش</span>
              </Button>
            </Link>
          )}
          {isManager && (
            <Button onClick={() => setShowCreateModal(true)} className="font-bold gap-1.5 text-xs">
              <Plus className="size-4" />
              <span>نظرسنجی جدید</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-2">
        <button
          onClick={() => setActiveTab('polls')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'polls' ? 'border-accent text-accent' : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          نظرسنجی‌های سریع ({toFa(polls.length)})
        </button>
        <button
          onClick={() => setActiveTab('surveys')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'surveys' ? 'border-accent text-accent' : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          پیمایش‌های سازمانی ({toFa(surveys.length)})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-background-subtle" />
          ))}
        </div>
      ) : activeTab === 'surveys' ? (
        surveys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ClipboardList className="mb-3 size-10 text-foreground-muted animate-pulse" />
              <p className="text-sm text-foreground-muted font-bold">هیچ پیمایش فعالی یافت نشد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map((survey) => (
              <Card key={survey.id} className="flex flex-col justify-between border-accent/10">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <CardTitle className="text-sm font-bold text-foreground">{survey.title}</CardTitle>
                    {survey.isMandatory && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">الزامی</Badge>
                    )}
                  </div>
                  {survey.description && (
                    <p className="text-xs text-foreground-muted leading-relaxed">{survey.description}</p>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-4 mt-auto">
                  <div className="flex justify-between items-center text-[10px] text-foreground-muted">
                    <span>سازنده: {survey.creator?.name || 'سیستم'}</span>
                    {survey.isAnonymous && (
                      <Badge variant="secondary" className="text-[9px] bg-accent/5 text-accent border-accent/10">ناشناس</Badge>
                    )}
                  </div>
                  <Link href={`/surveys/${survey.key}`} className="block w-full">
                    <Button className="w-full text-xs font-bold py-1.5">شروع پاسخ‌دهی</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Vote className="mb-3 size-10 text-foreground-muted animate-pulse" />
            <p className="text-sm text-foreground-muted font-bold">هیچ نظرسنجی فعالی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls.map((poll) => (
            <Card key={poll.id} className="flex flex-col justify-between border-accent/10">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">{poll.title}</CardTitle>
                {poll.description && (
                  <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{poll.description}</p>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 mt-auto">
                {poll.options.map((opt) => {
                  const percentage =
                    poll.totalVotes > 0
                      ? Math.round((opt._count.votes / poll.totalVotes) * 100)
                      : 0
                  const isSelected = poll.userVote === opt.id

                  return (
                    <div key={opt.id}>
                      <button
                        onClick={() => !poll.userVote && handleVote(poll.id, opt.id)}
                        disabled={!!poll.userVote}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-accent font-bold'
                            : 'border-outline-variant hover:bg-surface-hover text-foreground-muted hover:text-foreground'
                        } ${poll.userVote ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                      >
                        <div className="flex-1 text-start">{opt.label}</div>
                        {poll.userVote && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-container-high shrink-0">
                              <div
                                className="h-full rounded-full bg-accent transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-center font-data-mono text-[10px] text-foreground-muted">
                              {toFa(percentage)}%
                            </span>
                            {isSelected && (
                              <CheckCircle className="size-3.5 text-accent shrink-0" />
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
                <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[10px] text-foreground-muted font-data-mono">
                  <span>آرای ثبت شده: {toFa(poll.totalVotes)} رای</span>
                  {poll.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 text-accent" />
                      پایان: {jalali(poll.expiresAt)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border">
              <Vote className="size-5 text-accent" />
              <h3 className="font-bold text-base text-foreground">ایجاد نظرسنجی جدید</h3>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-critical/15 border border-critical/30 text-critical text-xs font-bold flex items-center gap-2">
                <AlertCircle className="size-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <Label htmlFor="poll-title" className="text-xs font-bold">عنوان نظرسنجی <span className="text-critical">*</span></Label>
                <Input
                  id="poll-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="موضوع رای‌گیری چیست؟"
                  className="mt-1.5 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="poll-desc" className="text-xs font-bold">توضیحات تکمیلی (اختیاری)</Label>
                <Input
                  id="poll-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="جزئیات بیشتر درباره نظرسنجی..."
                  className="mt-1.5 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="poll-expiry" className="text-xs font-bold">تاریخ پایان نظرسنجی (اختیاری)</Label>
                <Input
                  id="poll-expiry"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-1.5 text-xs text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold flex justify-between items-center">
                  <span>گزینه‌های نظرسنجی <span className="text-critical">*</span></span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOptionField}
                    className="h-6 text-[10px] text-accent font-bold hover:bg-accent/10 cursor-pointer"
                  >
                    <Plus className="size-3 me-0.5" />
                    افزودن گزینه
                  </Button>
                </Label>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {options.map((opt, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`گزینه ${toFa(index + 1)}`}
                        className="text-xs h-8"
                        required={index < 2}
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOptionField(index)}
                          className="h-8 w-8 text-critical hover:bg-critical/10 shrink-0 cursor-pointer"
                        >
                          <Trash className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormError('')
                  }}
                  className="h-8 text-xs font-bold"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-8 text-xs font-bold"
                >
                  {submitting ? 'در حال ثبت...' : 'انتشار نظرسنجی'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
