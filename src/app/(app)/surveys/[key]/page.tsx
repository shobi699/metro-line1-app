'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import { ClipboardList, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface Question {
  id: string
  q: string
  type: 'multiple_choice' | 'rating' | 'text' | 'boolean'
  options?: string[]
  required?: boolean
}

export default function SurveyResponsePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const params = useParams()
  const router = useRouter()
  const key = params?.key as string

  const [survey, setSurvey] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [duration, setDuration] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const timerRef = useRef<any>(null)

  async function fetchSurvey() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/surveys/${key}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const { survey: s, invitee } = json.data
        if (invitee?.respondedAt) {
          setError('شما قبلاً به این پیمایش پاسخ داده‌اید.')
          setSurvey(s)
        } else {
          setSurvey(s)
          // Parse schema questions
          const parsedQuestions = typeof s.schema === 'string' ? JSON.parse(s.schema) : s.schema
          setQuestions(parsedQuestions || [])
        }
      } else {
        const err = await res.json()
        setError(err.error || 'پیمایش مورد نظر یافت نشد.')
      }
    } catch {
      setError('خطا در دریافت اطلاعات پیمایش')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken && key) {
      void fetchSurvey()
    }
  }, [accessToken, key])

  useEffect(() => {
    if (survey && !completed) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [survey, completed])

  const handleSelectOption = (qId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
  }

  const handleNext = () => {
    const activeQ = questions[currentIdx]
    if (activeQ.required && !answers[activeQ.id]) {
      alert('لطفاً به این سوال پاسخ دهید')
      return
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      void handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/surveys/${key}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          answers,
          durationSec: duration,
        }),
      })

      if (res.ok) {
        setCompleted(true)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ثبت پاسخ‌ها')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <span className="text-sm text-foreground-muted">در حال بارگذاری پیمایش...</span>
      </div>
    )
  }

  if (error && !completed) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6" dir="rtl">
        <Card className="border-critical/30 bg-critical/5">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-critical mx-auto mb-2" />
            <CardTitle className="text-base font-bold text-foreground">خطا در دسترسی</CardTitle>
            <CardDescription className="text-xs text-foreground-muted mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Button onClick={() => router.push('/polls')} className="text-xs font-bold">بازگشت به نظرسنجی‌ها</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 text-center" dir="rtl">
        <Card className="border-success/30 bg-success/5 p-4">
          <CardContent className="space-y-4 pt-6">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto animate-bounce" />
            <h2 className="text-lg font-bold text-foreground">پاسخ‌های شما با موفقیت ثبت شد</h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              با تشکر از همکاری شما. نظر و پاسخ‌های شما به ما در ارتقای کیفیت ایمنی و بهبود کاربری خط ۱ مترو کمک خواهد کرد.
            </p>
            {survey?.isAnonymous && (
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-[10px]">
                پاسخ شما به صورت کاملاً ناشناس ثبت شد
              </Badge>
            )}
            <div className="pt-4">
              <Button onClick={() => router.push('/polls')} className="w-full text-xs font-bold">
                بازگشت به صفحه نظرسنجی‌ها
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-foreground-muted font-bold">این پیمایش فاقد سوال است.</p>
            <Button onClick={() => router.push('/polls')} className="mt-4 text-xs font-bold">بازگشت</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeQ = questions[currentIdx]
  const pct = Math.round(((currentIdx + 1) / questions.length) * 100)

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6" dir="rtl">
      {/* Top Header Card */}
      <Card className="border-accent/15 bg-background-subtle/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-foreground">{survey.title}</h2>
              <p className="text-[10px] text-foreground-muted">
                {survey.isAnonymous ? 'پیمایش ناشناس سازمانی' : 'پیمایش شناس و ارزیابی'}
              </p>
            </div>
          </div>
          {survey.isAnonymous && (
            <Badge className="bg-accent/5 text-accent border border-accent/20 text-[10px] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>حفظ هویت</span>
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] text-foreground-muted font-data-mono">
          <span>سوال {toFa(currentIdx + 1)} از {toFa(questions.length)}</span>
          <span>{toFa(pct)}% تکمیل شده</span>
        </div>
        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <Card className="min-h-[250px] flex flex-col justify-between border-accent/10 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex gap-2">
            <span className="text-sm font-bold text-accent font-data-mono">{toFa(currentIdx + 1)}.</span>
            <h3 className="text-sm font-bold text-foreground leading-relaxed">{activeQ.q}</h3>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          {/* Answer Fields depending on type */}
          {activeQ.type === 'multiple_choice' && activeQ.options && (
            <div className="space-y-2">
              {activeQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption(activeQ.id, opt)}
                  className={`w-full text-start p-3 text-xs rounded-lg border transition-all ${
                    answers[activeQ.id] === opt
                      ? 'border-accent bg-accent/5 text-accent font-bold shadow-sm'
                      : 'border-border hover:bg-muted text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {activeQ.type === 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              {['بله', 'خیر'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(activeQ.id, opt === 'بله')}
                  className={`p-4 text-center text-xs font-bold rounded-lg border transition-all ${
                    answers[activeQ.id] === (opt === 'بله')
                      ? 'border-accent bg-accent/5 text-accent font-bold shadow-sm'
                      : 'border-border hover:bg-muted text-foreground-muted'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {activeQ.type === 'rating' && (
            <div className="flex justify-between items-center gap-1 pt-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleSelectOption(activeQ.id, num)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold font-data-mono transition-all ${
                    answers[activeQ.id] === num
                      ? 'border-accent bg-accent/10 text-accent font-bold shadow-sm scale-110'
                      : 'border-border hover:bg-muted text-foreground-muted'
                  }`}
                >
                  {toFa(num)}
                </button>
              ))}
            </div>
          )}

          {activeQ.type === 'text' && (
            <Textarea
              value={answers[activeQ.id] || ''}
              onChange={(e) => handleSelectOption(activeQ.id, e.target.value)}
              placeholder="پاسخ خود را در این بخش بنویسید..."
              className="text-xs h-28 leading-relaxed resize-none bg-background border"
              required={activeQ.required}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="text-xs font-bold gap-1.5 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>قبلی</span>
        </Button>
        <Button
          onClick={handleNext}
          disabled={submitting}
          className="text-xs font-bold gap-1.5 cursor-pointer"
        >
          <span>{currentIdx === questions.length - 1 ? 'ثبت و ارسال پاسخ‌ها' : 'بعدی'}</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
