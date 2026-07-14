'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Award,
  Trophy,
  CheckCircle,
  Play,
  FileText,
  Clock,
  Printer,
  Train,
  ShieldCheck,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Lock,
  Smartphone,
  Check,
  Download,
  Wifi,
  Settings,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface Certificate {
  userName: string
  courseTitle: string
  score: number
  date: string
  expiryDate: string
  id: string
  isExpired: boolean
  daysToExpiry: number
}

interface ExamRecord {
  id: string
  title: string
  slug: string
  totalQuestions: number
  correctAnswers: number
  score: number // percentage
  status: 'passed' | 'failed'
  date: string
  retryAvailableAt?: string // تاریخ بازشدن مجدد آزمون
}

interface PendingExam {
  id: string
  title: string
  slug: string
  category: string
  questionCount: number
  mandatory: boolean
  dueDate?: string
  timeLimitMinutes?: number
}

// ── مسیرهای یادگیری — بخش ۷.۱ سند tosee.md
interface LearningPath {
  id: string
  title: string
  description: string
  coursesCount: number
  completedPercentage: number
  isUnlocked: boolean
  category: string
}

const getQuestionOptions = (q: any) => {
  if (!q) return []
  if (!q.options) return []
  try {
    const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    if (Array.isArray(parsed)) {
      return parsed.map((o: any) => ({ id: String(o.id), text: String(o.text) }))
    }
    return Object.entries(parsed).map(([id, text]) => ({ id, text: String(text) }))
  } catch {
    return []
  }
}

export default function MyExamsPage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [activeTab, setActiveTab] = useState<'paths' | 'exams' | 'certificates' | 'settings'>('paths')
  const [completedList, setCompletedList] = useState<ExamRecord[]>([])
  const [pendingList, setPendingList] = useState<PendingExam[]>([])
  const [points, setPoints] = useState(180) 
  const [rank] = useState(8) 
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

  // تنظیمات مصرف دیتا — بخش ۷.۴
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'low'>('auto')
  const [wifiOnly, setWifiOnly] = useState(true)
  const [cacheExpiryDays, setCacheExpiryDays] = useState(7)
  const [downloadLimitRole, setDownloadLimitRole] = useState('unrestricted')

  // بانک سوالات امتحانی تعاملی — بخش ۷.۳
  const [activeExam, setActiveExam] = useState<PendingExam | null>(null)
  const [examStarted, setExamStarted] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [examTimer, setExamTimer] = useState(0)
  const [examFinished, setExamFinished] = useState(false)
  const [examResultScore, setExamResultScore] = useState(0)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentAttempt, setCurrentAttempt] = useState<any>(null)

  // بانک فرضی سوالات برای آزمون شبیه‌ساز راهبران خط ۱ مترو
  const SAMPLE_QUESTIONS = [
    {
      q: 'در زمان افت فشار هوای فشرده به زیر ۵.۵ بار، راهبر در بلاک ورودی ایستگاه تجریش چه اقدامی باید انجام دهد؟',
      options: [
        'بلافاصله ترمز اضطراری زده و قطار را متوقف کند.',
        'ایزولاسیون مکانیکی ترمز (بایکوت درب‌ها) را انجام دهد.',
        'دکمه تخلیه اضطراری را زده و به OCC گزارش دهد.',
        'تست ایزولاسیون شیر پارکینگ را اجرا کند.'
      ],
      correct: 0,
      image: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=600&q=80'
    },
    {
      q: 'در پروتکل تخلیه اضطراری مسافرین در تونل مترو، کدام سمت قطار جهت هدایت ترجیح داده می‌شود؟',
      options: [
        'سمت خط گرم (ریل سوم)',
        'سمت مخالف ریل سوم برق‌دار (سمت فرار ایمن)',
        'هر دو سمت تفاوتی ندارد.',
        'تخلیه فقط از کابین عقب قطار انجام می‌شود.'
      ],
      correct: 1
    },
    {
      q: 'حداکثر سرعت مجاز در عبور از روی سوزن‌های شانت پایانه شهر ری چقدر است؟',
      options: [
        '۱۵ کیلومتر بر ساعت',
        '۳۰ کیلومتر بر ساعت',
        '۵ کیلومتر بر ساعت',
        '۴۵ کیلومتر بر ساعت'
      ],
      correct: 0
    }
  ]

  // مسیرهای یادگیری تعریف شده — بخش ۷.۱
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([
    {
      id: 'path-1',
      title: 'دوره ایمنی پایه و خودمراقبتی',
      description: 'ضوابط ایمنی تردد در حریم ریل، ولتاژ ریل سوم و پروتکل‌های خودمراقبتی راهبران.',
      coursesCount: 4,
      completedPercentage: 100,
      isUnlocked: true,
      category: 'ایمنی'
    },
    {
      id: 'path-2',
      title: 'دوره مقررات عمومی سیر و حرکت خط ۱',
      description: 'سیگنال‌های ثابت، بلاک‌های حفاظتی، سرعت‌های مجاز و ضوابط شانت در ایستگاه‌ها.',
      coursesCount: 6,
      completedPercentage: 50,
      isUnlocked: true,
      category: 'مقررات'
    },
    {
      id: 'path-3',
      title: 'دوره عیب‌یابی فوری و بایکوت قطار سری ۱۰۰',
      description: 'مهارت‌های تخصصی ایزوله کردن نقص ترمزها، عیب‌یابی درب واگن‌ها و برطرف کردن ترمزگیرهای کاذب.',
      coursesCount: 5,
      completedPercentage: 20,
      isUnlocked: true,
      category: 'فنی'
    },
    {
      id: 'path-4',
      title: 'دوره مدیریت بحران و سناریوهای حادثه',
      description: 'پروتکل‌های خروج اضطراری، حریق در تونل، سانحه در سکو و قطع برق سراسری OCC.',
      coursesCount: 8,
      completedPercentage: 0,
      isUnlocked: false, // قفل شده تا پیش‌نیاز گذرانده شود
      category: 'بحران'
    }
  ])

  const loadExams = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/learning/exams', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCompletedList(json.data.completed || [])
        setPendingList(json.data.pending || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [accessToken])

  useEffect(() => {
    void loadExams()
  }, [loadExams])

  const handleFinishExam = useCallback(async (isTimeout = false) => {
    if (!accessToken || !currentAttempt) return
    
    setExamStarted(false)
    setExamFinished(true)

    try {
      const res = await fetch(`/api/learning/exams/attempt/${currentAttempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          answers: selectedAnswers,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const attempt = json.data
        setExamResultScore(attempt.score || 0)
        await loadExams()
      } else {
        const json = await res.json()
        alert(json.error?.message || 'خطا در ثبت نتایج آزمون')
      }
    } catch (e) {
      console.error(e)
      alert('خطا در ارتباط با سرور هنگام ثبت آزمون')
    }
  }, [accessToken, currentAttempt, selectedAnswers, loadExams])

  const handleStartExam = async (exam: PendingExam) => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/learning/exams/${exam.id}/attempt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const attempt = json.data
        setCurrentAttempt(attempt)
        
        const parsedQuestions = JSON.parse(attempt.snapshot)
        setQuestions(parsedQuestions)
        
        setActiveExam(exam)
        setExamStarted(true)
        setCurrentQuestionIdx(0)
        setSelectedAnswers({})
        setExamTimer(exam.timeLimitMinutes ? exam.timeLimitMinutes * 60 : 600)
        setExamFinished(false)
      } else {
        const json = await res.json()
        alert(json.error?.message || 'خطا در شروع آزمون')
      }
    } catch (e) {
      console.error(e)
      alert('خطا در ارتباط با سرور')
    }
  }

  // تایمر امتحان
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (examStarted && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            handleFinishExam(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [examStarted, examTimer, handleFinishExam])

  const passingRate = (completedList.filter((e) => e.status === 'passed').length / (completedList.length || 1)) * 100

  // تولید لود مدارک گواهی پرسنلی — بخش ۷.۵
  const myCertificates: Certificate[] = completedList
    .filter(e => e.status === 'passed')
    .map((e, idx) => {
      // شبیه‌ساز اعتبار ۱ ساله گواهی
      const dateParts = e.date.split('/')
      const expiryYear = Number(dateParts[0] || 1405) + 1
      const expiryDate = `${expiryYear}/${dateParts[1] || '01'}/${dateParts[2] || '01'}`
      
      return {
        id: `CERT-L1-${idx + 104}-${e.id.substring(0, 4).toUpperCase()}`,
        userName: user?.name || 'راهبر قطار خط یک',
        courseTitle: e.title,
        score: e.score,
        date: e.date,
        expiryDate,
        isExpired: false, // گواهی فعال است
        daysToExpiry: 120 // فرضی
      }
    })

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="مرکز آموزش و آزمون راهبران خط ۱"
        subtitle="مسیرهای یادگیری، کارنامه الکترونیکی، آزمون‌های شبیه‌ساز و صدور گواهی صلاحیت فنی"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Top Widgets / Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="bg-success/5 border border-success/20 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">مجموع دوره‌های پاس شده</p>
                <h3 className="text-base font-bold mt-1 text-success">
                  {toFa(completedList.filter((e) => e.status === 'passed').length)} دوره
                </h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-lg text-success">
                <CheckCircle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-info/5 border border-info/20 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">درصد کل قبولی آزمون‌ها</p>
                <h3 className="text-base font-bold mt-1 text-info">
                  {toFa(Math.round(passingRate))}٪
                </h3>
              </div>
              <div className="bg-info/10 p-2.5 rounded-lg text-info">
                <Award className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border border-accent/20 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">امتیاز کل گیمیفیکیشن</p>
                <h3 className="text-base font-bold mt-1 text-accent">
                  {toFa(points)} امتیاز
                </h3>
              </div>
              <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                <Trophy className="size-5 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border border-warning/20 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">رتبه شما در خط ۱</p>
                <h3 className="text-base font-bold mt-1 text-warning">
                  رتبه {toFa(rank)} پرسنل
                </h3>
              </div>
              <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
                <TrendingUp className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex gap-2 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('paths')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'paths' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            مسیرهای یادگیری ({toFa(learningPaths.length)})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'exams' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            آزمون‌ها و کوئیزها ({toFa(pendingList.length + completedList.length)})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'certificates' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            گواهی‌نامه‌های من ({toFa(myCertificates.length)})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'settings' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            کیفیت و کنترل مصرف دیتا
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'paths' && (
          <div className="space-y-4">
            <div className="text-right space-y-1 select-none">
              <h3 className="text-sm font-bold">سیستم دوره‌ها و مسیرهای تخصصی راهبران</h3>
              <p className="text-xs text-foreground-muted">برای اخذ صلاحیت رانندگی در بخش‌های مختلف، گذراندن دوره‌های پیش‌نیاز الزامی است.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPaths.map((path) => (
                <Card key={path.id} className={cn(
                  "bg-surface-container-low border border-border/50 relative overflow-hidden transition-all duration-200",
                  !path.isUnlocked && "opacity-75"
                )}>
                  {!path.isUnlocked && (
                    <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10 select-none">
                      <Lock className="size-6 text-critical" />
                      <span className="text-[10px] text-white font-extrabold">این مسیر آموزشی قفل است — پیش‌نیاز پاس نشده است</span>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px] bg-accent/15 text-accent border-accent/20">
                        {path.category}
                      </Badge>
                      <span className="text-[10px] text-foreground-muted font-bold font-mono">
                        {toFa(path.coursesCount)} درس مصوب
                      </span>
                    </div>
                    <CardTitle className="text-xs font-bold text-foreground mt-2">{path.title}</CardTitle>
                    <CardDescription className="text-[11px] leading-relaxed line-clamp-2">{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-foreground-muted">میزان پیشرفت دوره:</span>
                      <span className="font-bold font-mono text-accent">{toFa(path.completedPercentage)}٪</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${path.completedPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <Link href="/learning/gallery">
                        <Button size="xs" variant="outline" disabled={!path.isUnlocked} className="text-[10px] cursor-pointer">
                          <span>ورود به کارگاه درس</span>
                          <span>←</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Exams */}
            <div className="lg:col-span-1 space-y-4">
              <div className="text-right pb-1">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="size-4 text-warning" />
                  کوئیزهای در انتظار شرکت
                </h4>
              </div>

              {pendingList.length === 0 ? (
                <div className="text-center py-8 bg-surface-container-low border border-border/40 rounded-lg text-foreground-muted text-xs">
                  💡 کوئیز معلقی ندارید! تمامی دوره‌ها با موفقیت انجام شده‌اند.
                </div>
              ) : (
                pendingList.map((p) => (
                  <div key={p.id} className="p-3.5 border border-border bg-surface-container-low rounded-lg flex flex-col gap-2 relative hover:border-accent/40 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-foreground leading-relaxed pe-14">{p.title}</h4>
                        <span className="text-[10px] text-foreground-muted font-semibold mt-0.5 block">{p.category}</span>
                      </div>
                      {p.mandatory && (
                        <Badge className="bg-critical/15 text-critical border-transparent text-[8px] font-bold absolute top-3.5 left-3.5">
                          اجباری
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-foreground-muted font-bold">
                      <span>تعداد سوالات: {toFa(p.questionCount)} سوال</span>
                      <span>مدت آزمون: {toFa(p.timeLimitMinutes || 10)} دقیقه</span>
                    </div>

                    <Button
                      size="xs"
                      onClick={() => handleStartExam(p)}
                      className="mt-2 text-[10px] gap-1 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded"
                    >
                      <Play className="size-3 fill-current" />
                      <span>شروع آزمون هوشمند</span>
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Completed Exams */}
            <div className="lg:col-span-2 space-y-4">
              <div className="text-right pb-1">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle className="size-4 text-success" />
                  آرشیو و نتایج آزمون‌های گذشته
                </h4>
              </div>

              <Card className="border-border/40 bg-surface-container-low">
                <CardContent className="p-0">
                  {completedList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-foreground-muted">
                      <FileText className="size-10 mb-2 opacity-50" />
                      <p className="text-xs">هنوز در هیچ آزمونی شرکت نکرده‌اید.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="border-b border-border/50 bg-neutral-950/20 text-foreground-muted text-[10px] font-bold">
                            <th className="p-3">عنوان دوره آموزشی</th>
                            <th className="p-3">پاسخ صحیح</th>
                            <th className="p-3">نمره</th>
                            <th className="p-3">تاریخ ثبت</th>
                            <th className="p-3 text-center">وضعیت</th>
                            <th className="p-3 text-left">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {completedList.map((exam) => (
                            <tr key={exam.id} className="hover:bg-neutral-900/10">
                              <td className="p-3 font-semibold text-foreground max-w-[200px] truncate">
                                {exam.title}
                              </td>
                              <td className="p-3 font-mono text-[10px]">
                                {toFa(exam.correctAnswers)} از {toFa(exam.totalQuestions)}
                              </td>
                              <td className="p-3 font-mono font-bold">
                                {toFa(exam.score)}٪
                              </td>
                              <td className="p-3 font-mono text-[10px]">{exam.date}</td>
                              <td className="p-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[9px] font-semibold rounded-md px-1.5 py-0.5',
                                    exam.status === 'passed'
                                      ? 'bg-success/10 text-success border-success/30'
                                      : 'bg-critical/10 text-critical border-critical/30'
                                  )}
                                >
                                  {exam.status === 'passed' ? 'قبول شده' : 'رد شده'}
                                </Badge>
                              </td>
                              <td className="p-3 text-left">
                                {exam.status === 'passed' ? (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => setSelectedCert({
                                      userName: user?.name || 'راهبر قطار خط ۱',
                                      courseTitle: exam.title,
                                      score: exam.score,
                                      date: exam.date,
                                      expiryDate: '۱۴۰۶/۰۴/۰۹',
                                      id: `CERT-${exam.id.toUpperCase()}-${user?.personnelCode || '123'}`,
                                      isExpired: false,
                                      daysToExpiry: 120
                                    })}
                                    className="h-7 text-[9px] border-accent/30 text-accent hover:bg-accent/5 font-bold cursor-pointer"
                                  >
                                    مشاهده گواهی
                                  </Button>
                                ) : (
                                  <div className="flex flex-col items-start gap-1">
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      disabled
                                      className="h-7 text-[9px] text-foreground-muted gap-1 border border-dashed border-border"
                                    >
                                      <RotateCcw className="size-3" />
                                      <span>قفل بازآمادگی</span>
                                    </Button>
                                    <span className="text-[8px] text-critical/80 font-bold">بازگشایی در {toFa(exam.retryAvailableAt || '')}</span>
                                  </div>
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
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="text-right space-y-1 select-none pb-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-accent">
                <ShieldCheck className="size-4" />
                گواهی‌نامه‌های دیجیتال شایستگی راهبری
              </h3>
              <p className="text-xs text-foreground-muted">سند صلاحیت ایمنی و رانندگی شما صادر شده توسط معاونت امور سیر و حرکت مترو تهران.</p>
            </div>

            {myCertificates.length === 0 ? (
              <Card className="border-border/40 bg-surface-container-low p-8 text-center text-foreground-muted text-xs">
                صلاحیت فنی در هیچ دوره‌ای تاکنون تایید نگردیده است. لطفاً آزمون‌های الزامی را تکمیل کنید.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCertificates.map((cert) => (
                  <Card key={cert.id} className="bg-surface-container-low border border-border/50 rounded-lg p-4 flex flex-col justify-between h-44 hover:border-accent/40 transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-accent font-extrabold tracking-widest">{cert.id}</span>
                        <Badge variant="outline" className="text-[9px] bg-success/15 text-success border-success/30 font-bold">
                          دارای اعتبار
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">{cert.courseTitle}</h4>
                      <div className="flex justify-between items-center text-[10px] text-foreground-muted font-bold">
                        <span>تاریخ صدور: {toFa(cert.date)}</span>
                        <span className="text-warning">تاریخ انقضا: {toFa(cert.expiryDate)}</span>
                      </div>
                    </div>

                    {/* Expiry Warning banner inside card if near to expiry */}
                    <div className="bg-warning/10 border border-warning/20 rounded p-1.5 text-[9px] text-warning font-bold flex items-center gap-1 my-1 animate-pulse">
                      <AlertTriangle className="size-3" />
                      این گواهی صلاحیت کمتر از ۴ ماه دیگر منقضی می‌شود. جهت تمدید اقدام کنید.
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/30">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setSelectedCert(cert)}
                        className="text-[10px] gap-1 border-accent/40 text-accent hover:bg-accent/5 cursor-pointer"
                      >
                        <Award className="size-3.5" />
                        <span>نمایش جزئیات سند</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-surface-container-low border border-border/50 rounded-lg p-6 space-y-6 text-right">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Settings className="size-4 text-accent" />
                تنظیمات بهینه‌سازی و کیفیت ویدئوهای آموزشی
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">کنترل مصرف پهنای باند شبکه و حجم تبلت‌های سازمانی — بخش ۷.۴ سند tosee.md</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quality Settings */}
              <div className="space-y-2">
                <label className="font-bold block text-foreground">کیفیت پیش‌فرض پخش ویدئو:</label>
                <div className="flex gap-2">
                  {['auto', 'high', 'low'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q as any)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer',
                        videoQuality === q
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'border-border text-foreground-muted hover:border-foreground-muted'
                      )}
                    >
                      {q === 'auto' ? 'کیفیت خودکار (انطباقی)' : q === 'high' ? 'عالی (1080p)' : 'اقتصادی (480p)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wifi Only Checkbox */}
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-surface/30">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block">دانلود آفلاین فقط با اتصال Wi-Fi:</span>
                  <span className="text-[10px] text-foreground-muted">جلوگیری از اتمام بسته دیتای سیمکارت تبلت صنعتی کابین.</span>
                </div>
                <button
                  onClick={() => setWifiOnly(!wifiOnly)}
                  className={cn(
                    'w-10 h-6 rounded-full transition relative',
                    wifiOnly ? 'bg-accent' : 'bg-neutral-800'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 size-4 rounded-full bg-white transition-all',
                    wifiOnly ? 'left-1' : 'left-5'
                  )} />
                </button>
              </div>

              {/* Offline Cache Expiry */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <label className="text-foreground">انقضای خودکار فایل‌های آفلاین:</label>
                  <span className="text-accent font-mono">{toFa(cacheExpiryDays)} روز</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={cacheExpiryDays}
                  onChange={(e) => setCacheExpiryDays(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-foreground-muted block mt-1">پس از اتمام مهلت، جهت بهینه‌سازی دیسک تبلت فایل‌های دانلودشده حذف می‌شوند.</span>
              </div>

              {/* Role Download Restrictions */}
              <div className="space-y-2">
                <label className="font-bold block text-foreground">محدودیت دانلود بر اساس نقش کاربری:</label>
                <select
                  value={downloadLimitRole}
                  onChange={(e) => setDownloadLimitRole(e.target.value)}
                  className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-foreground focus:outline-none"
                >
                  <option value="unrestricted">بدون محدودیت برای تمام پرسنل</option>
                  <option value="operators-only">فقط راهبران ارشد و سوپروایزرها</option>
                  <option value="restricted-all">محدودیت ترافیک روزانه ۵۰۰ مگابایت برای همه</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/30">
              <Button size="xs" onClick={() => alert('تنظیمات با موفقیت ذخیره شدند')} className="bg-accent text-white font-bold cursor-pointer">
                ذخیره تغییرات مصرف دیتا
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── شبیه‌ساز بانک سوالات و آزمون تعاملی — بخش ۷.۳ ── */}
      <Dialog open={examStarted} onOpenChange={(open) => !open && setExamStarted(false)}>
        <DialogContent className="sm:max-w-xl bg-neutral-900 border-neutral-800 text-white p-6" dir="rtl">
          {(() => {
            const activeQuestions = questions.length > 0 ? questions : SAMPLE_QUESTIONS
            const currentQuestion = activeQuestions[currentQuestionIdx]
            
            const getActiveOptions = () => {
              if (!currentQuestion) return []
              if (questions.length > 0) {
                return getQuestionOptions(currentQuestion)
              }
              return (currentQuestion.options as string[]).map((opt, oIdx) => ({
                id: String(oIdx),
                text: opt
              }))
            }

            const currentQuestionKey = questions.length > 0 ? String(currentQuestion?.id) : String(currentQuestionIdx)
            const isOptionSelected = (optId: string) => selectedAnswers[currentQuestionKey] === optId
            const handleSelectOption = (optId: string) => {
              setSelectedAnswers(prev => ({ ...prev, [currentQuestionKey]: optId }))
            }
            const isCurrentQuestionAnswered = selectedAnswers[currentQuestionKey] !== undefined

            const activeOptions = getActiveOptions()
            const questionImage = currentQuestion ? (currentQuestion.mediaUrl || currentQuestion.image) : ''
            const questionText = currentQuestion ? (currentQuestion.text || currentQuestion.q) : ''

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-right text-base font-bold text-accent flex items-center gap-2">
                    <HelpCircle className="size-5" />
                    <span>ارزشیابی ایمنی و شبیه‌ساز راهبری: {activeExam?.title}</span>
                  </DialogTitle>
                  <DialogDescription className="text-right text-xs text-neutral-400">
                    ارزیابی تصادفی از بانک سوالات. برای قبولی باید به حدنصاب تعیین شده پاسخ صحیح بدهید.
                  </DialogDescription>
                </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Timer and Progress */}
                <div className="flex justify-between items-center bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800">
                  <span className="text-xs font-bold text-neutral-300">
                    سوال {toFa(currentQuestionIdx + 1)} از {toFa(activeQuestions.length)}
                  </span>
                  <span className={cn(
                    "text-xs font-mono font-bold flex items-center gap-1.5",
                    examTimer < 30 ? "text-critical animate-pulse" : "text-warning"
                  )}>
                    <Clock className="size-4" />
                    زمان باقیمانده: {toFa(Math.floor(examTimer / 60))}:{toFa(examTimer % 60).padStart(2, '۰')}
                  </span>
                </div>

                {/* Question visual/image indicator if present */}
                {questionImage && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={questionImage}
                      alt="تصویر سوال آزمون"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Question Title */}
                <h4 className="text-sm font-bold leading-relaxed">
                  {questionText}
                </h4>

                {/* Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  {activeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={cn(
                        'w-full text-right p-3 rounded-lg border text-xs transition-all cursor-pointer font-bold flex items-center justify-between',
                        isOptionSelected(opt.id)
                          ? 'bg-accent/25 border-accent text-accent'
                          : 'border-neutral-800 bg-neutral-950/20 text-neutral-300 hover:bg-neutral-800/40'
                      )}
                    >
                      <span>{opt.text}</span>
                      {isOptionSelected(opt.id) && <Check className="size-4" />}
                    </button>
                  ))}
                </div>

                {/* Nav buttons */}
                <div className="flex justify-between items-center border-t border-neutral-800/60 pt-4 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="text-xs text-white border-neutral-800"
                  >
                    سوال قبلی
                  </Button>

                  {currentQuestionIdx < activeQuestions.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      disabled={!isCurrentQuestionAnswered}
                      className="bg-accent hover:bg-accent-hover text-white text-xs"
                    >
                      سوال بعدی
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => void handleFinishExam()}
                      disabled={!isCurrentQuestionAnswered}
                      className="bg-success hover:bg-success/90 text-white text-xs font-bold"
                    >
                      ثبت نهایی و اتمام آزمون
                    </Button>
                  )}
                </div>
              </div>
            </>
          )
        })()}
        </DialogContent>
      </Dialog>

      {/* Result Dialog Modal */}
      <Dialog open={examFinished} onOpenChange={setExamFinished}>
        <DialogContent className="sm:max-w-sm bg-neutral-900 border-neutral-800 text-white p-6 text-center" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-base font-bold text-accent">
              کارنامه ارزیابی صلاحیت فنی
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-4 flex flex-col items-center">
            {examResultScore >= 70 ? (
              <>
                <div className="bg-success/15 border border-success/30 text-success size-14 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="size-8" />
                </div>
                <h3 className="text-base font-bold text-success mt-2">قبولی در ارزیابی شبیه‌ساز!</h3>
                <p className="text-xs text-neutral-300">
                  شما نمره ممتاز <span className="font-bold text-white font-mono text-sm">{toFa(examResultScore)}٪</span> را کسب کردید. گواهی‌نامه شایستگی دیجیتال برای شما صادر و به کارنامه‌تان اضافه شد.
                </p>
              </>
            ) : (
              <>
                <div className="bg-critical/20 border border-critical/40 text-critical size-14 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="size-8" />
                </div>
                <h3 className="text-base font-bold text-critical mt-2">عدم کسب حدنصاب قبولی</h3>
                <p className="text-xs text-neutral-300">
                  نمره شما <span className="font-bold text-white font-mono text-sm">{toFa(examResultScore)}٪</span> شد (حداقل مجاز ۷۰٪). جهت افزایش ضریب ایمنی، شرکت در مجدد آزمون نیاز به مطالعه مجدد ویدیوهای آموزشی و ۲ دقیقه فاصله دارد.
                </p>
              </>
            )
            }
          </div>

          <Button onClick={() => setExamFinished(false)} className="w-full bg-accent hover:bg-accent-hover text-white text-xs">
            متوجه شدم
          </Button>
        </DialogContent>
      </Dialog>

      {/* Certificate Viewer Modal Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 text-white p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold text-accent flex items-center gap-2">
              <Award className="size-5" />
              <span>گواهی‌نامه صلاحیت فنی الکترونیکی (بخش ۷.۵)</span>
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-neutral-400">
              این سند رسمی صلاحیت ایمنی و راهبری خط یک مترو بر اساس ثبت نمره قبولی در بانک سوالات صادر گردیده است.
            </DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="flex flex-col gap-6 mt-4">
              {/* Certificate Template Styling Container */}
              <div className="relative border-4 border-double border-accent/40 bg-radial from-neutral-900 via-neutral-950 to-stone-950 p-6 md:p-10 rounded-lg overflow-hidden text-center flex flex-col items-center justify-between gap-6 min-h-[380px] shadow-2xl">
                {/* Background watermarks */}
                <div className="absolute top-0 right-0 size-32 bg-accent/5 rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 size-32 bg-accent/5 rounded-tr-full pointer-events-none" />
                
                {/* Certificate Header */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <Train className="size-8" />
                    <span className="font-bold text-lg md:text-xl tracking-wider">شرکت بهره‌برداری راه آهن شهری تهران و حومه</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-neutral-400 font-semibold tracking-widest mt-1">معاونت امور سیر و حرکت - خط یک مترو تهران</span>
                  <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-accent to-transparent mt-2" />
                </div>

                {/* Certificate Body */}
                <div className="space-y-4 my-2 max-w-lg">
                  <h3 className="text-xl md:text-2xl font-bold text-amber-400">گواهی‌نامه رسمی صلاحیت فنی راهبری</h3>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    بدین‌وسیله گواهی می‌شود همکار گرامی جناب آقای/سرکار خانم <span className="font-bold text-white text-sm md:text-base underline decoration-accent decoration-2 underline-offset-4">{selectedCert.userName}</span> با کد پرسنلی <span className="font-mono text-neutral-200 font-bold">{toFa(user?.personnelCode || '۱۲۳۴۵۶۷۸۹۰')}</span> دوره تخصصی و ارزیابی الکترونیکی:
                  </p>
                  <h4 className="text-xs md:text-sm font-bold text-white bg-neutral-800/50 border border-neutral-700/35 px-4 py-2 rounded-lg inline-block my-1 leading-relaxed">
                    {selectedCert.courseTitle}
                  </h4>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    را با موفقیت و کسب نمره ممتاز <span className="font-bold text-success font-mono text-sm md:text-base">{toFa(selectedCert.score)}٪</span> به پایان رسانده و صلاحیت فنی و ایمنی لازم را در این ماژول اخذ نموده‌اند.
                  </p>
                </div>

                {/* Verification QR Code Section — بخش ۷.۵ */}
                <div className="flex flex-col items-center gap-1.5 my-2 bg-white/5 p-2 rounded border border-white/10">
                  {/* Fake QR code representation in styled canvas/css */}
                  <div className="size-16 bg-white p-1 rounded flex flex-wrap gap-0.5 justify-center items-center">
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                  </div>
                  <span className="text-[7px] text-neutral-400 font-mono">اسکن جهت استعلام صلاحیت در پرتال OCC</span>
                </div>

                {/* Certificate Footer */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-neutral-800/60 mt-4 text-[10px]">
                  <div className="flex flex-col items-center md:items-start gap-1 text-neutral-400">
                    <span>شناسه اصالت گواهی:</span>
                    <span className="font-mono text-neutral-300 select-all font-semibold uppercase">{selectedCert.id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-success font-semibold">
                    <ShieldCheck className="size-4" />
                    <span>تایید صلاحیت رسمی خط ۱</span>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-1 text-neutral-400">
                    <span>مدت اعتبار: یک‌ساله تا {toFa(selectedCert.expiryDate)}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCert(null)} className="h-9 text-xs border-neutral-800 hover:bg-neutral-800 text-white cursor-pointer">
                  بستن پنجره
                </Button>
                <Button size="sm" onClick={() => window.print()} className="bg-accent hover:bg-accent-hover text-white h-9 text-xs gap-1.5 cursor-pointer">
                  <Printer className="size-4" />
                  <span>چاپ گواهی‌نامه پرسنلی</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
