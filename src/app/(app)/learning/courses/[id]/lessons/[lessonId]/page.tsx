'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { ArrowRight, PlayCircle, BookOpen, FileText, Loader2, CheckCircle2, Lock, Clock, HelpCircle, X, XCircle } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import { Settings } from 'lucide-react'

function InlineQuizBlock({ block }: { block: any }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const questions = block.quizQuestions || []
  if (questions.length === 0) return null

  const handleCheckAnswers = () => {
    let correct = 0
    questions.forEach((q: any) => {
      const ans = answers[q.id]
      if (q.type === 'essay') {
        if (ans && ans.trim().length > 0) correct++
      } else {
        const correctOpt = q.options?.find((o: any) => o.isCorrect)
        if (correctOpt && String(ans) === String(correctOpt.id)) correct++
      }
    })
    setScore(Math.round((correct / questions.length) * 100))
    setSubmitted(true)
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
  }

  return (
    <div className="my-6 border border-border/40 rounded-xl bg-card/40 p-4 md:p-5 space-y-4 text-right font-fa shadow-lg">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="text-xs font-bold text-white">آزمونک خودارزیابی درون‌درسی</span>
        </div>
        {submitted && score !== null && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            امتیاز: {toFa(score)}٪
          </span>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q: any, idx: number) => {
          const ans = answers[q.id]
          const isEssay = q.type === 'essay'
          const correctOpt = q.options?.find((o: any) => o.isCorrect)

          return (
            <div key={q.id || idx} className="space-y-2 border-b border-border/10 last:border-0 pb-3 last:pb-0">
              <p className="text-xs font-semibold text-white leading-relaxed">{toFa(idx + 1)}. {q.text}</p>
              
              {isEssay ? (
                <div className="space-y-1">
                  <textarea
                    disabled={submitted}
                    value={ans || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="پاسخ تشریحی خود را اینجا وارد کنید..."
                    className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white h-16 resize-none focus:outline-none focus:border-primary disabled:opacity-60 font-fa"
                  />
                  {submitted && (
                    <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                      پاسخ ثبت شد. خودارزیابی تشریحی.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {q.options?.map((opt: any) => {
                    const isSelected = ans === String(opt.id)
                    let btnStyle = 'border-border/30 hover:border-border/50 text-muted-foreground bg-muted/10'
                    if (isSelected) {
                      btnStyle = 'border-primary bg-primary/10 text-white font-medium'
                    }
                    if (submitted) {
                      if (opt.isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold'
                      } else if (isSelected) {
                        btnStyle = 'border-rose-500 bg-rose-500/15 text-rose-400'
                      } else {
                        btnStyle = 'border-border/10 text-muted-foreground/40 bg-transparent'
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: String(opt.id) }))}
                        className={`w-full p-2 rounded border text-right text-[11px] transition flex items-center justify-between ${btnStyle} ${!submitted && 'cursor-pointer'}`}
                      >
                        <span>{opt.text}</span>
                        {submitted && opt.isCorrect && (
                          <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-bold">پاسخ صحیح</span>
                        )}
                        {submitted && isSelected && !opt.isCorrect && (
                          <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-400 font-bold">پاسخ شما</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
        {submitted ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="cursor-pointer text-[10px] px-3 py-1.5 h-auto font-semibold"
          >
            تلاش مجدد
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleCheckAnswers}
            disabled={questions.some((q: any) => !answers[q.id])}
            className="bg-primary hover:bg-primary-hover text-white cursor-pointer text-[10px] px-3 py-1.5 h-auto font-bold"
          >
            ثبت و بررسی پاسخ‌ها
          </Button>
        )}
      </div>
    </div>
  )
}

export default function LessonPage({ params }: { params: Promise<{ id: string, lessonId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, lessonId } = resolvedParams
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [secondsSpent, setSecondsSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Quiz States
  const [quizGraded, setQuizGraded] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizPassed, setQuizPassed] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0)

  const getCompletedLessons = (userId: string) => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(`completed_lessons_${userId}`) || '[]') as string[]
    } catch {
      return []
    }
  }

  const addCompletedLesson = (userId: string, targetId: string) => {
    if (typeof window === 'undefined') return
    try {
      const list = getCompletedLessons(userId)
      if (!list.includes(targetId)) {
        list.push(targetId)
        localStorage.setItem(`completed_lessons_${userId}`, JSON.stringify(list))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const completedList = getCompletedLessons(user?.id || 'default')

  // Collect all lessons in sequential order
  const allLessons: any[] = []
  course?.chapters?.forEach((chap: any) => {
    chap.lessons?.forEach((les: any) => {
      allLessons.push(les)
    })
  })

  const currentLessonIndex = allLessons.findIndex(l => l.id === lessonId)
  const isLocked = currentLessonIndex > 0 && !completedList.includes(allLessons[currentLessonIndex - 1]?.id)

  useEffect(() => {
    if (!accessToken) return
    const fetchCourseData = async () => {
      try {
        const res = await fetch(`/api/learning/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.data) {
          setCourse(json.data)
        } else {
          router.push('/learning')
        }
      } catch (e) {
        console.error(e)
        router.push('/learning')
      } finally {
        setLoading(false)
      }
    }
    fetchCourseData()
  }, [courseId, accessToken, router])

  // Enforce redirection if locked or not enrolled
  useEffect(() => {
    if (!loading && course) {
      const isEnrolled = course.enrollments?.length > 0
      if (!isEnrolled) {
        toast.error('ابتدا باید در این دوره ثبت‌نام کنید.')
        router.push(`/learning/courses/${courseId}`)
        return
      }
      if (isLocked) {
        toast.error('این درس هنوز قفل است. لطفاً ابتدا درس‌های قبلی را تکمیل کنید.')
        router.push(`/learning/courses/${courseId}`)
      }
    }
  }, [isLocked, loading, course, courseId, router])

  // Track completion state
  useEffect(() => {
    if (!user || !lessonId) return
    const completed = getCompletedLessons(user.id)
    if (completed.includes(lessonId)) {
      setIsCompleted(true)
    } else {
      setIsCompleted(false)
      setSecondsSpent(0)
    }
  }, [user, lessonId])

  // Mark lesson completed logic
  const markAsCompleted = async () => {
    if (!user || !lessonId || !course || !accessToken) return
    addCompletedLesson(user.id, lessonId)
    setIsCompleted(true)
    toast.success('درس با موفقیت تکمیل شد! پیشرفت شما ثبت گردید.')

    const completed = getCompletedLessons(user.id)
    const completedInThisCourse = allLessons.filter(l => completed.includes(l.id)).length
    const progressPct = allLessons.length > 0 
      ? Math.round((completedInThisCourse / allLessons.length) * 100) 
      : 0

    try {
      await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId,
          progressPct,
          completed: progressPct === 100 ? true : undefined,
        }),
      })

      setCourse((prev: any) => {
        if (!prev) return prev
        const nextEnrollments = prev.enrollments?.map((e: any) => ({
          ...e,
          progressPct,
          status: progressPct === 100 ? 'completed' : e.status
        })) || []
        return { ...prev, enrollments: nextEnrollments }
      })
    } catch (e) {
      console.error(e)
    }
  }

  // Timer for time spent
  useEffect(() => {
    if (isCompleted || !accessToken || !course || isLocked) return
 
    // Find current lesson
    let current: any = null
    for (const chap of course.chapters || []) {
      const foundL = chap.lessons?.find((l: any) => l.id === lessonId)
      if (foundL) {
        current = foundL
        break
      }
    }
    if (!current) return
    if (current.kind === 'quiz') return // Quizzes require passing questions
 
    const targetTime = current.minSeconds || 30 // fallback 30 seconds
 
    const interval = setInterval(() => {
      setSecondsSpent((prev) => {
        const next = prev + 1
        if (next >= targetTime) {
          clearInterval(interval)
          void markAsCompleted()
          return targetTime
        }
        return next
      })
    }, 1000)
 
    return () => clearInterval(interval)
  }, [isCompleted, accessToken, course, lessonId, isLocked])

  if (loading || !course) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Lock className="w-16 h-16 text-muted-foreground animate-bounce" />
        <h2 className="text-xl font-bold text-white">این درس قفل می‌باشد</h2>
        <p className="text-sm text-foreground-muted">لطفاً ابتدا درس قبلی را به طور کامل مطالعه و تکمیل فرمایید.</p>
        <Link href={`/learning/courses/${courseId}`} className={buttonVariants({ variant: 'outline' })}>
          بازگشت به سرفصل‌ها
        </Link>
      </div>
    )
  }

  // Find the lesson
  let currentLesson: any = null
  let currentChapter: any = null
  let nextLesson: any = null
  let found = false

  for (const chapter of course.chapters || []) {
    for (let i = 0; i < chapter.lessons?.length; i++) {
      if (found && !nextLesson) {
        nextLesson = chapter.lessons[i]
        break
      }
      if (chapter.lessons[i].id === lessonId) {
        currentLesson = chapter.lessons[i]
        currentChapter = chapter
        found = true
      }
    }
    if (nextLesson) break
  }

  if (!currentLesson && !loading) {
    router.push(`/learning/courses/${courseId}`)
    return null
  }

  let videoUrl = ''
  let fileUrl = ''
  let textContent = ''

  if (currentLesson.contentRef) {
    try {
      const parsed = JSON.parse(currentLesson.contentRef)
      if (parsed && typeof parsed === 'object') {
        videoUrl = parsed.videoUrl || parsed.fileUrl || parsed.url || ''
        fileUrl = parsed.fileUrl || parsed.videoUrl || parsed.url || ''
        textContent = parsed.content || parsed.text || ''
      } else {
        videoUrl = currentLesson.contentRef
        fileUrl = currentLesson.contentRef
        textContent = currentLesson.contentRef
      }
    } catch (e) {
      videoUrl = currentLesson.contentRef
      fileUrl = currentLesson.contentRef
      textContent = currentLesson.contentRef
    }
  }

  // Fallback checks
  if (!videoUrl && currentLesson.kind === 'video') videoUrl = currentLesson.contentRef
  if (!fileUrl && currentLesson.kind === 'pdf') fileUrl = currentLesson.contentRef
  if (!textContent && currentLesson.kind === 'text') textContent = currentLesson.contentRef
 
  const quizQuestions = (() => {
    if (!currentLesson || currentLesson.kind !== 'quiz') return []
    try {
      const parsed = JSON.parse(currentLesson.contentRef)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
 
  const handleGradeQuiz = () => {
    if (quizQuestions.length === 0) return
    let correctCount = 0
    quizQuestions.forEach(q => {
      const userAnswer = userAnswers[q.id]
      if (q.type === 'essay') {
        if (userAnswer && userAnswer.trim().length > 0) {
          correctCount++
        }
      } else {
        const correctOpt = q.options?.find((opt: any) => opt.isCorrect)
        if (correctOpt && String(userAnswer) === String(correctOpt.id)) {
          correctCount++
        }
      }
    })
 
    const score = Math.round((correctCount / quizQuestions.length) * 100)
    const passed = score >= 70
    setQuizScore(score)
    setQuizPassed(passed)
    setQuizGraded(true)
 
    if (passed) {
      void markAsCompleted()
    } else {
      toast.error(`شما نمره ${score}٪ را کسب کردید که کمتر از حد نصاب ۷۰٪ است. لطفا دوباره تلاش کنید.`)
    }
  }
 
  const handleRetryQuiz = () => {
    setUserAnswers({})
    setQuizGraded(false)
    setQuizScore(0)
    setQuizPassed(false)
    setQuizCurrentIdx(0)
  }
 
  const renderBlockPreview = (b: any) => {
    if (!b) return ''
    if (b.type === 'heading') {
      const Tag = b.headingLevel || 'h2'
      const className = Tag === 'h1' ? 'text-2xl font-extrabold text-white mt-6 mb-3 font-fa' : Tag === 'h2' ? 'text-xl font-bold text-white mt-5 mb-2.5 font-fa' : 'text-lg font-bold text-white mt-4 mb-2 font-fa'
      return `<${Tag} class="${className}">${b.headingText || ''}</${Tag}>`
    }
    if (b.type === 'paragraph') {
      return `<p class="text-sm text-muted-foreground leading-relaxed my-3 whitespace-pre-line font-fa text-right">${b.paragraphText || ''}</p>`
    }
    if (b.type === 'table') {
      const rows = b.tableRows || 3
      const cols = b.tableCols || 3
      const data = b.tableData || []
      let html = `<table class="w-full border-collapse border border-border/40 text-right text-xs my-4 font-fa">\n  <thead>\n    <tr class="bg-muted/40 text-white">\n`
      for (let c = 0; c < cols; c++) {
        html += `      <th class="border border-border/40 p-2">${data[0]?.[c] || ''}</th>\n`
      }
      html += `    </tr>\n  </thead>\n  <tbody>\n`
      for (let r = 1; r < rows; r++) {
        html += `    <tr>\n`
        for (let c = 0; c < cols; c++) {
          html += `      <td class="border border-border/40 p-2">${data[r]?.[c] || ''}</td>\n`
        }
        html += `    </tr>\n`
      }
      html += `  </tbody>\n</table>\n`
      return html
    }
    if (b.type === 'alert') {
      const colors = {
        warning: { bg: 'bg-yellow-950/20', border: 'border-yellow-500', text: 'text-yellow-500', icon: '⚠️' },
        danger: { bg: 'bg-red-950/20', border: 'border-red-500', text: 'text-red-500', icon: '🚨' },
        success: { bg: 'bg-emerald-950/20', border: 'border-emerald-500', text: 'text-emerald-500', icon: '✅' },
        info: { bg: 'bg-blue-950/20', border: 'border-blue-500', text: 'text-blue-500', icon: 'ℹ️' }
      }
      const style = colors[b.alertType as 'warning' | 'danger' | 'success' | 'info'] || colors.warning
      return `<div class="p-4 ${style.bg} border-r-4 ${style.border} rounded my-4 text-xs font-fa leading-relaxed text-right">\n  <strong class="${style.text} block mb-1">${style.icon} ${b.alertTitle || ''}:</strong>\n  ${b.alertText || ''}\n</div>\n`
    }
    if (b.type === 'chart') {
      const pts = b.chartPoints || []
      const maxVal = Math.max(...pts.map((p: any) => Number(p.value) || 1), 1)
      const width = 400
      const height = 150
      let svgContent = ''

      if (b.chartType === 'vertical') {
        const colWidth = Math.max(Math.floor((width - 40) / Math.max(pts.length, 1)), 10)
        pts.forEach((p: any, idx: number) => {
          const val = Number(p.value) || 0
          const barHeight = Math.floor((val / maxVal) * 100)
          const x = 30 + idx * colWidth
          const y = 120 - barHeight
          svgContent += `    <rect x="${x}" y="${y}" width="${Math.max(colWidth - 10, 5)}" height="${barHeight}" fill="#ef4444" rx="2" />\n`
          svgContent += `    <text x="${x + Math.max(colWidth - 10, 5)/2}" y="138" font-size="9" fill="#888" text-anchor="middle" class="font-fa">${p.label}</text>\n`
          svgContent += `    <text x="${x + Math.max(colWidth - 10, 5)/2}" y="${y - 5}" font-size="8" fill="#fff" text-anchor="middle" class="font-fa">${val}</text>\n`
        })
      } else {
        const rowHeight = Math.max(Math.floor((height - 30) / Math.max(pts.length, 1)), 10)
        pts.forEach((p: any, idx: number) => {
          const val = Number(p.value) || 0
          const barWidth = Math.floor((val / maxVal) * 250)
          const y = 15 + idx * rowHeight
          svgContent += `    <text x="5" y="${y + 12}" font-size="9" fill="#888" text-anchor="start" class="font-fa">${p.label}</text>\n`
          svgContent += `    <rect x="80" y="${y}" width="${barWidth}" height="${Math.max(rowHeight - 8, 4)}" fill="#ef4444" rx="2" />\n`
          svgContent += `    <text x="${85 + barWidth}" y="${y + 12}" font-size="8" fill="#fff" text-anchor="start" class="font-fa">${val}</text>\n`
        })
      }

      return `<div class="my-6 bg-card border border-border/30 rounded-lg p-4 flex flex-col items-center">\n  <span class="text-xs text-muted-foreground mb-3 font-fa">${b.chartTitle || ''}</span>\n  <svg viewBox="0 0 ${width} ${height}" class="w-full max-w-md h-auto">\n${svgContent}  </svg>\n</div>\n`
    }
    if (b.type === 'diagram') {
      const steps = b.diagramSteps || []
      const height = 80
      const boxWidth = 100
      const boxHeight = 35
      const gap = 30
      let svgContent = ''
      
      svgContent += `    <defs>\n      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />\n      </marker>\n    </defs>\n`

      steps.forEach((step: string, idx: number) => {
        const x = 10 + idx * (boxWidth + gap)
        const y = 20
        const isLast = idx === steps.length - 1
        const fillColor = isLast ? '#ef4444' : '#1e293b'
        const strokeColor = isLast ? 'none' : '#ef4444'
        
        svgContent += `    <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" rx="4" />\n`
        svgContent += `    <text x="${x + boxWidth/2}" y="${y + 21}" font-size="8" fill="#fff" text-anchor="middle" class="font-fa">${step}</text>\n`
        
        if (!isLast) {
          svgContent += `    <line x1="${x + boxWidth}" y1="${y + boxHeight/2}" x2="${x + boxWidth + gap}" y2="${y + boxHeight/2}" stroke="#ef4444" stroke-width="1.5" marker-end="url(#arrow)" />\n`
        }
      })

      const totalWidth = 20 + steps.length * boxWidth + (steps.length - 1) * gap
      return `<div class="my-6 bg-card border border-border/30 rounded-lg p-4 flex flex-col items-center">\n  <span class="text-xs text-muted-foreground mb-3 font-fa">دیاگرام توالی مراحل</span>\n  <svg viewBox="0 0 ${totalWidth} ${height}" class="w-full max-w-lg h-auto">\n${svgContent}  </svg>\n</div>\n`
    }
    if (b.type === 'media') {
      const url = b.mediaUrl || ''
      if (!url) return '<p class="text-xs text-muted-foreground italic text-center py-2">رسانه‌ای انتخاب نشده است.</p>'
      if (b.mediaType === 'video') {
        const finalUrl = (url.startsWith('http') || url.startsWith('/')) ? url : `/${url}`
        return `<div class="my-6 flex justify-center"><video controls class="w-full max-w-2xl rounded-lg shadow-md aspect-video bg-black" src="${finalUrl}"></video></div>`
      }
      if (b.mediaType === 'pdf') {
        const finalUrl = (url.startsWith('http') || url.startsWith('/')) ? url : `/${url}`
        const filename = finalUrl.split('/').pop() || 'file.pdf'
        return `
          <div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-lg my-6 gap-4">
            <div class="flex items-center gap-3">
              <span class="p-2 bg-red-500/10 text-red-500 rounded-md shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
              </span>
              <div class="text-right">
                <span class="text-sm font-medium text-white block">فایل ضمیمه PDF</span>
                <span class="text-xs text-muted-foreground block font-mono dir-ltr text-left">${filename}</span>
              </div>
            </div>
            <a href="${finalUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold transition shrink-0 cursor-pointer">
              دانلود و مشاهده فایل
            </a>
          </div>
        `
      }
      if (b.mediaType === 'word') {
        const finalUrl = (url.startsWith('http') || url.startsWith('/')) ? url : `/${url}`
        const filename = finalUrl.split('/').pop() || 'document.docx'
        return `
          <div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-lg my-6 gap-4">
            <div class="flex items-center gap-3">
              <span class="p-2 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8v8h2v-3h2v-2h-2V9Z"/></svg>
              </span>
              <div class="text-right">
                <span class="text-sm font-medium text-white block">سند ضمیمه Word (آیین‌نامه)</span>
                <span class="text-xs text-muted-foreground block font-mono dir-ltr text-left">${filename}</span>
              </div>
            </div>
            <a href="${finalUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold transition shrink-0 cursor-pointer">
              دانلود سند Word
            </a>
          </div>
        `
      }
    }
    if (b.type === 'image') {
      const url = b.imageUrl || ''
      if (!url) return '<p class="text-xs text-muted-foreground italic text-center py-2">تصویری انتخاب نشده است.</p>'
      return `
        <div class="my-6 flex flex-col items-center gap-2">
          <img src="${url}" class="rounded-lg max-w-full h-auto shadow-md border border-border/30" />
          ${b.imageCaption ? `<span class="text-xs text-muted-foreground font-fa">${b.imageCaption}</span>` : ''}
        </div>
      `
    }
    if (b.type === 'html') {
      return sanitizeHtml(b.htmlContent || '')
    }
    return ''
  }

  const renderLessonContent = (text: string) => {
    if (!text) return 'محتوای متنی یافت نشد.'

    const trimmed = text.trim()
    if (trimmed.startsWith('[')) {
      try {
        const blocks = JSON.parse(trimmed)
        if (Array.isArray(blocks)) {
          return blocks.map(b => renderBlockPreview(b)).join('\n')
        }
      } catch {
        // fallback
      }
    }

    // If the textContent itself is just a video path without shortcode (e.g. uploaded via dashboard)
    if (!trimmed.includes('[video]') && (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.ogg') || (trimmed.includes('/uploads/') && trimmed.includes('.mp4')))) {
      const finalUrl = (trimmed.startsWith('http') || trimmed.startsWith('/')) ? trimmed : `/${trimmed}`
      return `<div class="my-6 flex justify-center"><video controls class="w-full max-w-2xl rounded-lg shadow-md aspect-video bg-black" src="${finalUrl}"></video></div>`
    }

    // Sanitize first
    let processed = sanitizeHtml(trimmed)

    // Then replace [video]url[/video] with video player
    processed = processed.replace(/\[video\](.*?)\[\/video\]/gi, (match, url) => {
      const trimmedUrl = url.trim()
      const finalUrl = (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('/')) ? trimmedUrl : `/${trimmedUrl}`
      return `<div class="my-6 flex justify-center"><video controls class="w-full max-w-2xl rounded-lg shadow-md aspect-video bg-black" src="${finalUrl}"></video></div>`
    })

    // Then replace [pdf]url[/pdf] with PDF download block
    processed = processed.replace(/\[pdf\](.*?)\[\/pdf\]/gi, (match, url) => {
      const trimmedUrl = url.trim()
      const finalUrl = (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('/')) ? trimmedUrl : `/${trimmedUrl}`
      const filename = finalUrl.split('/').pop() || 'file.pdf'
      return `
        <div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-lg my-6 gap-4">
          <div class="flex items-center gap-3">
            <span class="p-2 bg-red-500/10 text-red-500 rounded-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            </span>
            <div class="text-right">
              <span class="text-sm font-medium text-white block">فایل ضمیمه PDF</span>
              <span class="text-xs text-muted-foreground block font-mono dir-ltr text-left">${filename}</span>
            </div>
          </div>
          <a href="${finalUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold transition shrink-0 cursor-pointer">
            دانلود و مشاهده فایل
          </a>
        </div>
      `
    })

    // Then replace [word]url[/word] with Word document download block
    processed = processed.replace(/\[word\](.*?)\[\/word\]/gi, (match, url) => {
      const trimmedUrl = url.trim()
      const finalUrl = (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('/')) ? trimmedUrl : `/${trimmedUrl}`
      const filename = finalUrl.split('/').pop() || 'document.docx'
      return `
        <div class="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-lg my-6 gap-4">
          <div class="flex items-center gap-3">
            <span class="p-2 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8v8h2v-3h2v-2h-2V9Z"/></svg>
            </span>
            <div class="text-right">
              <span class="text-sm font-medium text-white block">سند ضمیمه Word (آیین‌نامه)</span>
              <span class="text-xs text-muted-foreground block font-mono dir-ltr text-left">${filename}</span>
            </div>
          </div>
          <a href="${finalUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-xs font-semibold transition shrink-0 cursor-pointer">
            دانلود سند Word
          </a>
        </div>
      `
    })

    return processed
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/learning/courses/${courseId}`} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="text-muted-foreground flex gap-2 items-center text-sm">
          <Link href={`/learning/courses/${courseId}`} className="hover:text-primary transition-colors">
            {course.title}
          </Link>
          <span>/</span>
          <span>{currentChapter?.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {currentLesson.kind === 'video' ? (
            <Card className="overflow-hidden border-border/50 shadow-md">
              <div className="aspect-video w-full bg-black flex items-center justify-center text-white relative">
                {videoUrl ? (
                  <video 
                    controls 
                    className="w-full h-full object-contain"
                    src={videoUrl}
                    poster={course.coverUrl || undefined}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <PlayCircle className="w-16 h-16" />
                    <p>فایل ویدیویی یافت نشد</p>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{currentLesson.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {currentLesson.minSeconds ? `حداقل زمان مشاهده: ${Math.round(currentLesson.minSeconds / 60)} دقیقه` : 'حداقل زمان مشاهده: ۳۰ ثانیه'}
                      </CardDescription>
                      {isCompleted ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>درس تکمیل شده</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/5 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>در حال مطالعه ({Math.min(100, Math.round((secondsSpent / (currentLesson.minSeconds || 30)) * 100))}٪)</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : currentLesson.kind === 'pdf' ? (
            <Card className="overflow-hidden border-border/50 shadow-md">
              <div className="aspect-video w-full bg-black flex items-center justify-center text-white relative">
                <div className="flex flex-col items-center gap-4 bg-muted/20 w-full h-full justify-center text-foreground">
                  <FileText className="w-16 h-16 opacity-50 text-red-500" />
                  <a href={fileUrl || '#'} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                    دانلود فایل PDF
                  </a>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{currentLesson.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {currentLesson.minSeconds ? `حداقل زمان مطالعه: ${Math.round(currentLesson.minSeconds / 60)} دقیقه` : 'حداقل زمان مطالعه: ۳۰ ثانیه'}
                      </CardDescription>
                      {isCompleted ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>درس تکمیل شده</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/5 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>در حال مطالعه ({Math.min(100, Math.round((secondsSpent / (currentLesson.minSeconds || 30)) * 100))}٪)</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : currentLesson.kind === 'pdf' ? (
            <Card className="overflow-hidden border-border/50 shadow-md">
              <div className="aspect-video w-full bg-black flex items-center justify-center text-white relative">
                <div className="flex flex-col items-center gap-4 bg-muted/20 w-full h-full justify-center text-foreground">
                  <FileText className="w-16 h-16 opacity-50 text-red-500" />
                  <a href={fileUrl || '#'} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                    دانلود فایل PDF
                  </a>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{currentLesson.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {currentLesson.minSeconds ? `حداقل زمان مطالعه: ${Math.round(currentLesson.minSeconds / 60)} دقیقه` : 'حداقل زمان مطالعه: ۳۰ ثانیه'}
                      </CardDescription>
                      {isCompleted ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>درس تکمیل شده</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/5 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>در حال مطالعه ({Math.min(100, Math.round((secondsSpent / (currentLesson.minSeconds || 30)) * 100))}٪)</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : currentLesson.kind === 'quiz' ? (
            <Card className="overflow-hidden border-border/50 shadow-md">
              <div className="bg-card p-6 md:p-8 text-foreground shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border/40 justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-primary animate-pulse" />
                    <h3 className="text-xl font-bold">آزمونک آموزشی: {currentLesson.title}</h3>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20 py-1 px-3 rounded-full text-xs font-bold font-fa">
                    حد نصاب قبولی: ۷۰٪
                  </Badge>
                </div>

                {quizQuestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <HelpCircle className="w-12 h-12 mx-auto opacity-30" />
                    <p className="text-sm">سوالی برای این آزمون ثبت نشده است.</p>
                  </div>
                ) : !quizGraded ? (
                  /* Active Quiz Flow */
                  <div className="space-y-6">
                    {/* Stepper progress */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/20 pb-3 font-fa">
                      <span>سوال {toFa(quizCurrentIdx + 1)} از {toFa(quizQuestions.length)}</span>
                      <div className="w-32 bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${((quizCurrentIdx + 1) / quizQuestions.length) * 100}%` }} />
                      </div>
                    </div>

                    {/* Active Question Card */}
                    <div className="space-y-5">
                      <div className="p-4 bg-muted/10 border border-border/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-white leading-relaxed text-right font-fa">
                          {quizQuestions[quizCurrentIdx]?.text}
                        </h4>
                      </div>

                      {/* Options List */}
                      {quizQuestions[quizCurrentIdx]?.type === 'essay' ? (
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground font-semibold">پاسخ تشریحی خود را بنویسید:</label>
                          <textarea
                            value={userAnswers[quizQuestions[quizCurrentIdx].id] || ''}
                            onChange={(e) => setUserAnswers({ ...userAnswers, [quizQuestions[quizCurrentIdx].id]: e.target.value })}
                            placeholder="متن پاسخ تشریحی..."
                            className="w-full h-32 p-3 bg-muted/20 border border-border/40 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 resize-none font-fa"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {quizQuestions[quizCurrentIdx]?.options?.map((opt: any) => {
                            const isSelected = userAnswers[quizQuestions[quizCurrentIdx].id] === String(opt.id)
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setUserAnswers({ ...userAnswers, [quizQuestions[quizCurrentIdx].id]: String(opt.id) })}
                                className={`w-full p-4 rounded-lg border text-right text-xs transition duration-150 flex items-center justify-between cursor-pointer ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 text-white font-medium shadow-sm' 
                                    : 'border-border/60 hover:border-border hover:bg-muted/10 text-muted-foreground'
                                }`}
                              >
                                <span>{opt.text}</span>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary' : 'border-muted-foreground'}`}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step navigation buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-border/20">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={quizCurrentIdx === 0}
                        onClick={() => setQuizCurrentIdx(prev => prev - 1)}
                        className="cursor-pointer text-xs"
                      >
                        سوال قبلی
                      </Button>

                      {quizCurrentIdx === quizQuestions.length - 1 ? (
                        <Button
                          type="button"
                          onClick={handleGradeQuiz}
                          disabled={!userAnswers[quizQuestions[quizCurrentIdx]?.id]}
                          className="bg-primary hover:bg-primary-hover text-white cursor-pointer text-xs font-bold shadow-md shadow-red-950/20"
                        >
                          ثبت و تصحیح آزمونک
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          disabled={!userAnswers[quizQuestions[quizCurrentIdx]?.id]}
                          onClick={() => setQuizCurrentIdx(prev => prev + 1)}
                          className="cursor-pointer text-xs"
                        >
                          سوال بعدی
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Graded Results Overview */
                  <div className="space-y-6">
                    {/* Score Card */}
                    <div className="p-6 border border-border/40 rounded-xl bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-right">
                        <span className="text-xs text-muted-foreground font-semibold">نتیجه تصحیح آزمون:</span>
                        <h4 className="text-xl font-extrabold text-white font-fa">
                          امتیاز کسب شده: {toFa(quizScore)}٪
                        </h4>
                        <p className="text-xs text-muted-foreground font-fa">
                          {quizPassed 
                            ? 'تبریک! شما با موفقیت از حد نصاب عبور کردید.' 
                            : 'متاسفانه نمره شما کمتر از حد نصاب ۷۰٪ است. لطفا دوباره تلاش کنید.'}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {quizPassed ? (
                          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 py-2.5 px-5 rounded-lg text-sm font-bold shadow-sm shadow-emerald-950/10">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>قبول شده (ثبت در پرونده)</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 py-2 px-4 rounded-lg text-sm font-bold shadow-sm">
                              <XCircle className="w-5 h-5" />
                              <span>مردود (نیاز به آزمون مجدد)</span>
                            </div>
                            <Button
                              type="button"
                              onClick={handleRetryQuiz}
                              className="w-full bg-muted border border-border hover:bg-muted/80 text-white cursor-pointer text-xs font-semibold"
                            >
                              تلاش مجدد
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Review List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white border-b border-border/30 pb-2">مرور سوالات و پاسخ‌ها:</h4>
                      <div className="space-y-4">
                        {quizQuestions.map((q, idx) => {
                          const userAnswer = userAnswers[q.id]
                          const isEssay = q.type === 'essay'
                          const correctOpt = q.options?.find((opt: any) => opt.isCorrect)
                          
                          const isCorrect = isEssay 
                            ? (userAnswer && userAnswer.trim().length > 0)
                            : (correctOpt && String(userAnswer) === String(correctOpt.id))

                          return (
                            <div key={q.id} className={`p-4 border rounded-lg space-y-3 ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <div className="flex items-start justify-between gap-4">
                                <span className="font-bold text-xs font-fa text-white">سوال {toFa(idx + 1)}: {q.text}</span>
                                <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ${isCorrect ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                  {isCorrect ? 'صحیح' : 'غلط'}
                                </span>
                              </div>

                              <div className="text-xs space-y-1 text-muted-foreground leading-relaxed text-right font-fa">
                                {isEssay ? (
                                  <div>
                                    <span className="text-white font-semibold">پاسخ تشریحی شما:</span>
                                    <p className="mt-1 p-2 bg-muted/20 border border-border/20 rounded font-fa">{userAnswer || '(بدون پاسخ)'}</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div>
                                      <span>پاسخ شما: </span>
                                      <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                        {q.options?.find((o: any) => String(o.id) === String(userAnswer))?.text || '(بدون پاسخ)'}
                                      </span>
                                    </div>
                                    {!isCorrect && (
                                      <div>
                                        <span>پاسخ صحیح: </span>
                                        <span className="text-emerald-400 font-semibold">{correctOpt?.text}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {q.explanation && (
                                  <div className="mt-3 p-3 bg-muted/30 border border-border/30 rounded text-muted-foreground text-[11px] font-fa leading-normal">
                                    <strong className="text-white block mb-1">توضیح پاسخ:</strong>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden border-border/50 shadow-md">
              <div className="bg-card p-8 text-foreground shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">متن lesson: {currentLesson.title}</h3>
                </div>
                <div className="prose prose-base dark:prose-invert max-w-none text-right leading-relaxed space-y-4">
                  {(() => {
                    const trimmed = textContent.trim()
                    if (trimmed.startsWith('[')) {
                      try {
                        const blocks = JSON.parse(trimmed)
                        if (Array.isArray(blocks)) {
                          return blocks.map((b: any, idx: number) => {
                            if (b.type === 'quiz') {
                              return <InlineQuizBlock key={idx} block={b} />
                            }
                            return (
                              <div 
                                key={idx} 
                                dangerouslySetInnerHTML={{ __html: renderBlockPreview(b) }} 
                              />
                            )
                          })
                        }
                      } catch {
                        // fallback to raw HTML
                      }
                    }
                    return (
                      <div dangerouslySetInnerHTML={{ __html: renderLessonContent(textContent) }} />
                    )
                  })()}
                </div>
              </div>
              <CardHeader className="border-t border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {currentLesson.minSeconds ? `حداقل زمان مطالعه: ${Math.round(currentLesson.minSeconds / 60)} دقیقه` : 'حداقل زمان مطالعه: ۳۰ ثانیه'}
                      </CardDescription>
                      {isCompleted ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>درس تکمیل شده</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/5 py-0.5 px-2 rounded-full flex items-center gap-1 text-[10px]">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>در حال مطالعه ({Math.min(100, Math.round((secondsSpent / (currentLesson.minSeconds || 30)) * 100))}٪)</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
          
          <div className="flex justify-end pt-4 border-t border-border">
            {nextLesson ? (
              <Link href={`/learning/courses/${courseId}/lessons/${nextLesson.id}`} className={buttonVariants({ size: 'lg', className: 'min-w-32 shadow-md' })}>
                درس بعدی
              </Link>
            ) : (
              <Link href={`/learning/courses/${courseId}`} className={buttonVariants({ size: 'lg', variant: 'default', className: 'min-w-32 shadow-md bg-green-600 hover:bg-green-700' })}>
                بازگشت به منوی دوره
              </Link>
            )}
          </div>
        </div>
 
        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm sticky top-24">
            <CardHeader className="bg-muted/30 pb-3 border-b border-border/50">
              <CardTitle className="text-lg">فهرست محتوا</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-[60vh] overflow-y-auto">
                {course.chapters?.map((chapter: any) => (
                  <div key={chapter.id} className="border-b border-border/50 last:border-0">
                    <div className="p-3 bg-muted/10 font-medium text-sm text-muted-foreground">
                      {chapter.title}
                    </div>
                    <div className="flex flex-col">
                      {chapter.lessons?.map((lesson: any) => {
                        const isActive = lesson.id === lessonId
                        const Icon = lesson.kind === 'video' 
                          ? PlayCircle 
                          : lesson.kind === 'pdf' 
                          ? FileText 
                          : lesson.kind === 'quiz'
                          ? HelpCircle
                          : BookOpen
 
                        const lessonIndex = allLessons.findIndex(l => l.id === lesson.id)
                        const isLessonAccessible = lessonIndex === 0 || completedList.includes(allLessons[lessonIndex - 1]?.id)
                        const isLessonCompleted = completedList.includes(lesson.id)
 
                        if (!isLessonAccessible) {
                          return (
                            <div 
                              key={lesson.id} 
                              className="flex items-center gap-3 p-3 text-sm text-muted-foreground/60 border-l-2 border-transparent select-none cursor-not-allowed opacity-50"
                            >
                              <Lock className="w-4 h-4" />
                              <span className="line-clamp-1">{lesson.title}</span>
                            </div>
                          )
                        }
 
                        return (
                          <Link 
                            key={lesson.id} 
                            href={`/learning/courses/${courseId}/lessons/${lesson.id}`}
                            className={`flex items-center justify-between p-3 text-sm transition-colors border-l-2 ${
                              isActive 
                                ? 'bg-primary/5 border-primary text-foreground font-medium' 
                                : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isLessonCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'opacity-60'}`} />
                              )}
                              <span className="line-clamp-1">{lesson.title}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
