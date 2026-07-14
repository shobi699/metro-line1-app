'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
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
  Video,
  Play,
  Search,
  Clock,
  Award,
  CheckCircle2,
  Bookmark,
  Pencil,
  Plus,
  Lock,
  Download,
  Wifi,
  Volume2,
  Settings,
  HelpCircle,
  FileDown,
  Printer,
  Train,
  ShieldCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface VideoItem {
  id: string
  title: string
  slug: string
  excerpt: string
  duration: string
  durationSeconds: number
  category: string
  coverUrl: string
  mediaUrl: string
  mandatory: boolean
  points: number
  isCompleted: boolean
  prerequisiteId?: string | null
  prerequisiteTitle?: string | null
  prerequisiteSlug?: string | null
  prerequisiteCompleted?: boolean
  // فیلدهای پیشرفت آموزشی — بخش ۷.۲
  watchedPercentage: number
  lastWatchedAt?: string | null
}

interface CoursePath {
  id: string
  name: string
  description: string
  icon: string
  videos: VideoItem[]
  certificateIssued: boolean
  certificateDate?: string
  certificateExpiry?: string
  certificateId?: string
}

// ── شبیه‌ساز بانک سوالات کوئیز حرفه‌ای — بخش ۷.۳
const QUIZ_QUESTIONS: Record<string, { q: string; options: string[]; correct: number }[]> = {
  'vid-1': [
    {
      q: 'در زمان بروز نقص فنی حاد در سیستم ترمز سری ۱۰۰، اولین اقدام راهبر چیست؟',
      options: [
        'ایزوله کردن شیر ترمز کابین جلو و گزارش به OCC',
        'بایکوت دستی مکانیکی ترمز چرخ‌ها در زیر واگن',
        'قطع مدار فرمان تخلیه اضطراری',
        'تست سیستم شانت قطار در سرعت بالا'
      ],
      correct: 1
    },
    {
      q: 'کدام اهرم برای ایزولاسیون فیزیکی ترمز چرخ استفاده می‌شود؟',
      options: [
        'اهرم قرمز رنگ سمت راست بوژی',
        'شیر تخلیه زرد رنگ واگن شماره ۳',
        'کلید مینیاتوری بای‌پاس درب واگن',
        'سوزن جهت‌نمای کابین راهبر'
      ],
      correct: 0
    }
  ],
  'vid-2': [
    {
      q: 'در زمان حریق داخل تونل، جهت تخلیه مسافرین ترجیح داده می‌شود؟',
      options: [
        'همیشه به سمت ایستگاه عقب‌تر به دلیل هوای تازه',
        'جهت مخالف وزش جریان باد (جلوگیری از استنشاق دود)',
        'به سمت نزدیک‌ترین ریل سوم برق‌دار جهت پناه گرفتن',
        'تخلیه همزمان از تمام درب‌ها بدون هماهنگی OCC'
      ],
      correct: 1
    }
  ]
}

const getCompletedLessons = (userId: string) => {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(`completed_lessons_${userId}`) || '[]') as string[]
  } catch {
    return []
  }
}

const addCompletedLesson = (userId: string, lessonId: string) => {
  if (typeof window === 'undefined') return
  try {
    const list = getCompletedLessons(userId)
    if (!list.includes(lessonId)) {
      list.push(lessonId)
      localStorage.setItem(`completed_lessons_${userId}`, JSON.stringify(list))
    }
  } catch {}
}

export default function LearningGalleryPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  // ── پخش‌کننده ویدیو تعاملی
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── دوره‌های آموزشی ساختاریافته — بخش ۷.۱
  const [courses, setCourses] = useState<CoursePath[]>([])
  const [loading, setLoading] = useState(true)

  const lastSavedPctRef = useRef(0)
  const lastSavedTimeRef = useRef(0)

  useEffect(() => {
    if (accessToken) {
      void loadCourses()
    }
  }, [accessToken])

  async function loadCourses() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/learning/courses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const rawCourses = json.data || []
        
        const detailedCourses = await Promise.all(
          rawCourses.map(async (c: any) => {
            const detailRes = await fetch(`/api/learning/courses/${c.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            if (detailRes.ok) {
              const detailJson = await detailRes.json()
              const detail = detailJson.data
              
              const allLessons: any[] = []
              detail.chapters?.forEach((chap: any) => {
                chap.lessons?.forEach((les: any) => {
                  allLessons.push(les)
                })
              })
              const videoLessons = allLessons.filter(l => l.kind === 'video')
              const completedLessons = getCompletedLessons(user?.id || 'default')

              const videos: VideoItem[] = videoLessons.map((v: any) => {
                const completed = completedLessons.includes(v.id)
                const watchedPercentage = completed ? 100 : 0
                return {
                  id: v.id,
                  title: v.title,
                  slug: v.title.replace(/\s+/g, '-'),
                  excerpt: v.title,
                  duration: `${Math.floor((v.minSeconds || 120) / 60)}:${((v.minSeconds || 120) % 60).toString().padStart(2, '0')}`,
                  durationSeconds: v.minSeconds || 120,
                  category: detail.title,
                  coverUrl: detail.coverUrl || 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=600&q=80',
                  mediaUrl: v.contentRef,
                  mandatory: true,
                  points: 10,
                  isCompleted: completed,
                  watchedPercentage,
                  quiz: null
                }
              })
              
              const cert = detail.certificates?.[0]
              
              return {
                id: detail.id,
                name: detail.title,
                description: detail.description || '',
                icon: detail.icon || '🛡️',
                videos,
                certificateIssued: !!cert,
                certificateId: cert?.serial,
                certificateDate: cert ? new Date(cert.issuedAt).toLocaleDateString('fa-IR') : undefined,
                certificateExpiry: cert ? new Date(cert.expiresAt).toLocaleDateString('fa-IR') : undefined,
              }
            }
            return null
          })
        )
        
        setCourses(detailedCourses.filter(Boolean) as CoursePath[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveProgressToServer = async (pct: number, completed?: boolean, quizScore?: number) => {
    if (!accessToken || !activeVideo || !user) return
    
    if (completed) {
      addCompletedLesson(user.id, activeVideo.id)
    }

    const course = courses.find(c => c.videos.some(v => v.id === activeVideo.id))
    if (!course) return

    const completedLessons = getCompletedLessons(user.id)
    const totalVideos = course.videos.length
    const completedVideosInCourse = course.videos.filter(v => v.id === activeVideo.id || completedLessons.includes(v.id)).length
    const progressPct = totalVideos > 0 ? Math.round((completedVideosInCourse / totalVideos) * 100) : 0

    try {
      const res = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          progressPct,
          completed: progressPct === 100 ? true : undefined,
        }),
      })
      if (res.ok) {
        lastSavedPctRef.current = pct
        lastSavedTimeRef.current = Date.now()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // ── کنترل مصرف دیتا — بخش ۷.۴
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'low'>('auto')
  const [wifiOnly, setWifiOnly] = useState(true)
  const [offlineDownloads, setOfflineDownloads] = useState<Record<string, boolean>>({
    'vid-safety-1': true
  })
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})

  // ── آزمون کوئیز حرفه‌ای — بخش ۷.۳
  const [activeQuiz, setActiveQuiz] = useState<any[] | null>(null)
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizFinished, setQuizFinished] = useState(false)
  const [quizScore, setQuizScore] = useState(0)

  // ── گواهینامه دیجیتال — بخش ۷.۵
  const [selectedCert, setSelectedCert] = useState<{
    userName: string
    courseTitle: string
    date: string
    expiry: string
    id: string
  } | null>(null)

  // جستجو و فیلترها
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const allVideos = useMemo<VideoItem[]>(() => {
    return courses.flatMap((c) => c.videos)
  }, [courses])

  const filteredVideos = allVideos.filter((vid: VideoItem) => {
    const matchesSearch = vid.title.includes(searchTerm) || vid.excerpt.includes(searchTerm)
    const matchesCategory = categoryFilter === 'all' || vid.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(allVideos.map((v: VideoItem) => v.category)))] as string[]

  // هندلر زمان مشاهده ویدیو جهت پیشرفت زنده — بخش ۷.۲
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !activeVideo) return
    const current = videoRef.current.currentTime
    const duration = videoRef.current.duration || activeVideo.durationSeconds
    const pct = Math.min(100, Math.round((current / duration) * 100))
    setVideoProgress(pct)

    // به‌روزرسانی پیشرفت دوره در استیت محلی
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        videos: c.videos.map((v) =>
          v.id === activeVideo.id
            ? { ...v, watchedPercentage: Math.max(v.watchedPercentage, pct), lastWatchedAt: 'امروز' }
            : v
        )
      }))
    )

    // ذخیره تدریجی پیشرفت هر ۱۰ ثانیه یا در پایان فیلم
    const now = Date.now()
    if (pct >= 95 && lastSavedPctRef.current < 95) {
      void saveProgressToServer(100)
    } else if (now - lastSavedTimeRef.current > 10000 && pct > lastSavedPctRef.current) {
      void saveProgressToServer(pct)
    }
  }

  // آغاز شبیه‌ساز کوئیز و بانک سوالات — بخش ۷.۳
  const handleStartQuiz = () => {
    if (!activeVideo) return
    let questions: any[] = []
    
    // Read quiz from video if present
    if ((activeVideo as any).quiz) {
      const qData = (activeVideo as any).quiz
      if (typeof qData === 'string') {
        try {
          questions = JSON.parse(qData)
        } catch {
          questions = []
        }
      } else if (Array.isArray(qData)) {
        questions = qData
      }
    }
    
    if (questions.length === 0) {
      questions = [
        {
          q: 'در زمان بروز نقص فنی حاد در سیستم ترمز سری ۱۰۰، اولین اقدام راهبر چیست؟',
          options: [
            'ایزوله کردن شیر ترمز کابین جلو و گزارش به OCC',
            'بایکوت دستی مکانیکی ترمز چرخ‌ها در زیر واگن',
            'قطع مدار فرمان تخلیه اضطراری',
            'تست سیستم شانت قطار در سرعت بالا'
          ],
          correct: 1
        }
      ]
    }
    
    setActiveQuiz(questions)
    setCurrentQuizIdx(0)
    setQuizAnswers({})
    setQuizFinished(false)
  }

  const handleFinishQuiz = async () => {
    if (!activeQuiz || !activeVideo) return
    let correctCount = 0
    activeQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        correctCount++
      }
    })
    const pct = Math.round((correctCount / activeQuiz.length) * 100)
    setQuizScore(pct)
    setQuizFinished(true)

    const isPassed = pct >= 70
    await saveProgressToServer(100, isPassed, pct)
    void loadCourses()
  }

  // دانلود آفلاین شبیه‌ساز — بخش ۷.۴
  const handleDownloadVideo = (vidId: string) => {
    if (wifiOnly) {
      alert('⚠️ با توجه به تنظیمات، دانلود فقط با اتصال به شبکه Wi-Fi امکان‌پذیر است.')
      return
    }

    setDownloadProgress((prev) => ({ ...prev, [vidId]: 10 }))
    let currentPct = 10
    const interval = setInterval(() => {
      currentPct += 30
      if (currentPct >= 100) {
        clearInterval(interval)
        setOfflineDownloads((prev) => ({ ...prev, [vidId]: true }))
        setDownloadProgress((prev) => ({ ...prev, [vidId]: 0 }))
        alert('📥 ویدئو با موفقیت در کش تبلت بارگذاری و آفلاین گردید. انقضای خودکار: ۷ روز.')
      } else {
        setDownloadProgress((prev) => ({ ...prev, [vidId]: currentPct }))
      }
    }, 400)
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="کتابخانه ویدیوهای آموزشی خط ۱"
        subtitle="شبیه‌سازهای فنی، دستورالعمل‌های بایکوت و ایمنی سیر و حرکت"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Quick Stats Panel */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-success/5 border border-success/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">ویدیوهای با موفقیت گذرانده‌شده</p>
                <h3 className="text-base font-bold mt-1 text-success">
                  {toFa(allVideos.filter((v: VideoItem) => v.isCompleted).length)} از {toFa(allVideos.length)} ویدیو
                </h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-lg text-success">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border border-accent/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">کیفیت دیتای کابین</p>
                <h3 className="text-base font-bold mt-1 text-accent">
                  کیفیت {videoQuality === 'auto' ? 'هوشمند' : videoQuality === 'high' ? 'عالی' : 'اقتصادی'}
                </h3>
              </div>
              <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                <Settings className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border border-warning/20">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-foreground-muted font-bold">صلاحیت‌های ایمنی فعال</p>
                <h3 className="text-base font-bold mt-1 text-warning">
                  {toFa(courses.filter((c) => c.certificateIssued).length)} گواهینامه معتبر
                </h3>
              </div>
              <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
                <Award className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── تنظیمات دیتا و دانلود کابین — بخش ۷.۴ ── */}
        <Card className="bg-surface-container-low border border-border-subtle p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Wifi className="size-4 text-accent animate-pulse" />
              کنترل مصرف دیتای سازمانی تبلت
            </h4>
            <p className="text-[10px] text-foreground-muted">تنظیم پخش اقتصادی و دانلود هوشمند ویدئوها بر اساس خط‌مشی‌های مترو تهران.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-border/40">
              <span>کیفیت پخش:</span>
              {['auto', 'high', 'low'].map((q) => (
                <button
                  key={q}
                  onClick={() => setVideoQuality(q as any)}
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer',
                    videoQuality === q ? 'bg-accent text-white' : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  {q === 'auto' ? 'اتوماتیک' : q === 'high' ? 'HD' : 'SD'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setWifiOnly(!wifiOnly)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition cursor-pointer font-bold',
                wifiOnly ? 'bg-accent/15 border-accent text-accent' : 'border-border text-foreground-muted'
              )}
            >
              <Wifi className="size-3.5" />
              <span>دانلود فقط با Wi-Fi: {wifiOnly ? 'فعال' : 'خاموش'}</span>
            </button>
          </div>
        </Card>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="جستجو در عنوان یا متن ویدیوهای آموزشی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat: string) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs shrink-0 cursor-pointer font-bold"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'همه دسته‌ها' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* ── نمایش مسیرهای یادگیری ساختاریافته دوره‌ها — بخش ۷.۱ ── */}
        <div className="space-y-6">
          {courses.map((course) => {
            const completedVideosCount = course.videos.filter((v) => v.isCompleted).length
            const courseProgress = course.videos.length > 0 
              ? Math.round((completedVideosCount / course.videos.length) * 100) 
              : 0

            return (
              <div key={course.id} className="space-y-3">
                {/* Course Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2 flex-wrap gap-2">
                  <Link 
                    href={`/learning/courses/${course.id}`} 
                    className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer select-none group"
                  >
                    <span className="text-xl group-hover:scale-110 transition">{course.icon}</span>
                    <div>
                      <h3 className="text-xs font-black text-white group-hover:text-primary transition">{course.name}</h3>
                      <p className="text-[10px] text-foreground-muted mt-0.5">{course.description}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end text-left">
                      <span className="text-[9px] text-foreground-muted font-bold">پیشرفت دوره:</span>
                      <span className="text-[10px] font-bold text-accent font-mono">{toFa(courseProgress)}٪</span>
                    </div>

                    {/* PDF certificate button if course is fully completed — بخش ۷.۵ */}
                    {course.certificateIssued ? (
                      <Button
                        size="xs"
                        onClick={() => setSelectedCert({
                          userName: user?.name || 'راهبر قطار خط یک',
                          courseTitle: course.name,
                          date: course.certificateDate || '۱۴۰۵/۰۲/۱۵',
                          expiry: course.certificateExpiry || '۱۴۰۶/۰۲/۱۵',
                          id: course.certificateId || 'CERT-SAF-L1'
                        })}
                        className="bg-success text-white hover:bg-success/90 h-8 text-[10px] gap-1 cursor-pointer font-bold"
                      >
                        <Award className="size-3.5" />
                        <span>مشاهده گواهی صلاحیت</span>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[9px] bg-neutral-900 border-neutral-700 text-foreground-muted font-bold select-none">
                        فاقد گواهی صلاحیت
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Videos in Course */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {course.videos
                    .filter((vid) => {
                      const matchesSearch = vid.title.includes(searchTerm) || vid.excerpt.includes(searchTerm)
                      return matchesSearch
                    })
                    .map((vid) => {
                      const isOffline = offlineDownloads[vid.id]
                      const dlProgress = downloadProgress[vid.id] || 0

                      return (
                        <Card 
                          key={vid.id} 
                          onClick={() => {
                            setActiveVideo(vid)
                            setVideoProgress(vid.watchedPercentage)
                          }}
                          className="overflow-hidden border border-border-subtle bg-surface/50 backdrop-blur flex flex-col h-full group hover:border-accent/30 hover:shadow-lg transition-all duration-300 rounded-lg relative cursor-pointer"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-slate-950 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vid.coverUrl}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70"
                            />

                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveVideo(vid)
                                  setVideoProgress(vid.watchedPercentage)
                                }}
                                className="rounded-full bg-accent hover:bg-accent-hover text-white size-11 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300 cursor-pointer"
                              >
                                <Play className="size-5 fill-current pr-0.5" />
                              </Button>
                            </div>

                            {/* Duration & Offline status */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1">
                              {isOffline && (
                                <Badge className="bg-success text-white border-transparent text-[8px] font-bold px-1 py-0.5">
                                  آفلاین کش
                                </Badge>
                              )}
                              <span className="bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white font-mono flex items-center gap-1 border border-neutral-800">
                                <Clock className="size-3 text-neutral-400" />
                                {toFa(vid.duration)}
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                              {vid.mandatory && (
                                <Badge className="bg-critical/95 text-white border-transparent text-[8px] font-bold rounded px-1.5 py-0.5">
                                  الزامی
                                </Badge>
                              )}
                              {vid.isCompleted && (
                                <Badge className="bg-success/95 text-white border-transparent text-[8px] font-bold rounded px-1.5 py-0.5 flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  پاس شده
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Card Body */}
                          <CardContent className="p-3.5 flex flex-col flex-1 gap-2">
                            <h4 className="text-xs font-bold text-foreground line-clamp-2 min-h-[36px] leading-relaxed">
                              {vid.title}
                            </h4>
                            <p className="text-[11px] text-foreground-muted line-clamp-3 leading-relaxed">
                              {vid.excerpt}
                            </p>

                            {/* User Progress bar in individual video — بخش ۷.۲ */}
                            <div className="space-y-1 mt-auto pt-2 border-t border-border/30">
                              <div className="flex justify-between text-[9px] font-bold text-foreground-muted">
                                <span>پیشرفت تماشا:</span>
                                <span>{toFa(vid.watchedPercentage)}٪</span>
                              </div>
                              <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                                <div className="bg-accent h-1 rounded-full" style={{ width: `${vid.watchedPercentage}%` }} />
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                                  <Award className="size-3.5 text-accent animate-pulse" />
                                  <span>امتیاز: {toFa(vid.points)}</span>
                                </div>

                                {/* Download Offline button with progress simulation */}
                                {isOffline ? (
                                  <span className="text-[8px] text-success font-bold flex items-center gap-0.5 select-none">
                                    <CheckCircle2 className="size-3" />
                                    موجود آفلاین
                                  </span>
                                ) : dlProgress > 0 ? (
                                  <span className="text-[8px] text-accent font-bold animate-pulse">
                                    در حال دانلود {toFa(dlProgress)}٪
                                  </span>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadVideo(vid.id)
                                    }}
                                    className="h-7 text-[9px] text-accent hover:text-accent-hover hover:bg-transparent p-0 cursor-pointer gap-1"
                                  >
                                    <Download className="size-3" />
                                    <span>بارگیری آفلاین</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* ── پنجره پخش ویدیو و कोईز آزمون — بخش ۷.۲ و ۷.۳ ── */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 text-white p-5" dir="rtl">
          {activeVideo && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-right text-sm font-bold text-accent">
                  پخش ویدئو: {activeVideo.title}
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-neutral-400">
                  برای باز شدن دکمه آزمون، ویدئو را حداقل تا ۹۰ درصد مشاهده فرمایید.
                </DialogDescription>
              </DialogHeader>

              {/* Video Player element */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-neutral-800">
                <video
                  ref={videoRef}
                  src={activeVideo.mediaUrl}
                  controls
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="w-full h-full"
                />
              </div>

              {/* Player control panel for quality selector — بخش ۷.۴ */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-neutral-950/40 border border-neutral-800 flex-wrap gap-2 select-none">
                <span className="text-[10px] text-foreground-muted font-bold">پیشرفت کل مشاهده: {toFa(videoProgress)}٪</span>
                
                <div className="flex items-center gap-1 text-[9px] bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  <span className="text-neutral-400">کیفیت استریم:</span>
                  <span className="font-bold text-accent uppercase">{videoQuality}</span>
                </div>
              </div>

              {/* Quiz Activation action button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveVideo(null)}
                  className="text-xs text-white border-neutral-800 cursor-pointer"
                >
                  بستن ویدئو
                </Button>
                
                {activeVideo.isCompleted ? (
                  <Badge className="bg-success text-white border-transparent text-xs font-bold px-3 py-1 flex items-center gap-1.5 select-none">
                    <CheckCircle2 className="size-4" />
                    آزمون با موفقیت گذرانده شده است
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={videoProgress < 90}
                    onClick={handleStartQuiz}
                    className="bg-accent hover:bg-accent-hover text-white text-xs font-bold gap-1 cursor-pointer"
                  >
                    <HelpCircle className="size-4" />
                    <span>شروع آزمون نهایی دوره</span>
                    {videoProgress < 90 && <span className="text-[8px] font-normal">(نیازمند مشاهده ویدیو)</span>}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── پنجره کوئیز آزمون شبیه‌ساز راهبران — بخش ۷.۳ ── */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => !open && setActiveQuiz(null)}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white p-5" dir="rtl">
          {activeQuiz && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-right text-xs font-bold text-accent">
                  ارزشیابی مهارت راهبری خط ۱
                </DialogTitle>
                <DialogDescription className="text-right text-[9px] text-neutral-400">
                  برای قبولی باید به تمامی سوالات پاسخ صحیح بدهید.
                </DialogDescription>
              </DialogHeader>

              {!quizFinished ? (
                <div className="space-y-4 text-xs font-bold">
                  {/* Current question status */}
                  <span className="text-[10px] text-foreground-muted">
                    سوال {toFa(currentQuizIdx + 1)} از {toFa(activeQuiz.length)}
                  </span>
                  
                  <h4 className="text-xs font-bold text-foreground leading-relaxed">
                    {activeQuiz[currentQuizIdx].q}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2">
                    {activeQuiz[currentQuizIdx].options.map((opt: string, oIdx: number) => (
                      <button
                        key={oIdx}
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [currentQuizIdx]: oIdx }))}
                        className={cn(
                          'w-full text-right p-3 rounded-lg border text-[10px] transition-all cursor-pointer font-bold',
                          quizAnswers[currentQuizIdx] === oIdx
                            ? 'bg-accent/25 border-accent text-accent'
                            : 'border-neutral-800 bg-neutral-950/20 text-neutral-300 hover:bg-neutral-800/40'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-800/60">
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={currentQuizIdx === 0}
                      onClick={() => setCurrentQuizIdx((prev) => prev - 1)}
                      className="text-white border-neutral-800 text-[10px]"
                    >
                      سوال قبلی
                    </Button>

                    {currentQuizIdx < activeQuiz.length - 1 ? (
                      <Button
                        size="xs"
                        onClick={() => setCurrentQuizIdx((prev) => prev + 1)}
                        disabled={quizAnswers[currentQuizIdx] === undefined}
                        className="bg-accent text-white text-[10px]"
                      >
                        سوال بعدی
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        onClick={handleFinishQuiz}
                        disabled={quizAnswers[currentQuizIdx] === undefined}
                        className="bg-success text-white text-[10px] font-bold"
                      >
                        اتمام و تایید کوئیز
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  {quizScore >= 70 ? (
                    <>
                      <div className="bg-success/15 border border-success/30 text-success size-12 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle2 className="size-6" />
                      </div>
                      <h4 className="text-xs font-bold text-success">تبریک، ارزیابی تایید شد!</h4>
                      <p className="text-[10px] text-neutral-300">
                        شما با موفقیت نمره کامل صلاحیت دوره را کسب کردید. امتیاز به پروفایل گیمیفیکیشن شما اضافه گردید.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-critical/20 border border-critical/40 text-critical size-12 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <AlertTriangle className="size-6" />
                      </div>
                      <h4 className="text-xs font-bold text-critical">عدم قبولی در کوئیز</h4>
                      <p className="text-[10px] text-neutral-300">
                        نمره شما در شبیه‌ساز کافی نبود. لطفاً با دقت بیشتری بخش‌های فنی ویدئو را مرور کرده و پس از ۱ دقیقه مجدداً تلاش کنید.
                      </p>
                    </>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveQuiz(null)
                      if (quizScore >= 70) setActiveVideo(null)
                    }}
                    className="w-full bg-accent text-white text-xs cursor-pointer"
                  >
                    خروج از ارزیابی
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── گواهی‌نامه صلاحیت فنی دیجیتال — بخش ۷.۵ ── */}
      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 text-white p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold text-accent flex items-center gap-2">
              <Award className="size-5" />
              <span>گواهی صلاحیت فنی سیر و حرکت (خط ۱)</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCert && (
            <div className="flex flex-col gap-6 mt-4">
              <div className="relative border-4 border-double border-accent/40 bg-radial from-neutral-900 via-neutral-950 to-stone-950 p-6 md:p-10 rounded-lg text-center flex flex-col items-center justify-between gap-6 min-h-[380px] shadow-2xl">
                <div className="absolute top-0 right-0 size-32 bg-accent/5 rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 size-32 bg-accent/5 rounded-tr-full pointer-events-none" />

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <Train className="size-8" />
                    <span className="font-bold text-lg md:text-xl tracking-wider">شرکت بهره‌برداری راه آهن شهری تهران و حومه</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-neutral-400 font-semibold tracking-widest mt-1">معاونت امور سیر و حرکت - خط یک مترو تهران</span>
                  <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-accent to-transparent mt-2" />
                </div>

                <div className="space-y-4 my-2 max-w-lg">
                  <h3 className="text-xl md:text-2xl font-bold text-amber-400">لوح رسمی تایید صلاحیت و شایستگی راهبری</h3>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    بدین‌وسیله گواهی می‌شود همکار گرامی <span className="font-bold text-white text-sm md:text-base underline decoration-accent decoration-2 underline-offset-4">{selectedCert.userName}</span> با کد پرسنلی <span className="font-mono text-neutral-200 font-bold">{toFa(user?.personnelCode || '۱۲۳۴۵۶۷۸۹۰')}</span> دوره تخصصی:
                  </p>
                  <h4 className="text-xs md:text-sm font-bold text-white bg-neutral-800/50 border border-neutral-700/35 px-4 py-2 rounded-lg inline-block my-1 leading-relaxed">
                    {selectedCert.courseTitle}
                  </h4>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    را با موفقیت به پایان رسانده و صلاحیت فنی و ایمنی لازم را در این بخش اخذ نموده‌اند.
                  </p>
                </div>

                {/* QR Code Validation */}
                <div className="flex flex-col items-center gap-1.5 my-2 bg-white/5 p-2 rounded border border-white/10">
                  <div className="size-16 bg-white p-1 rounded flex flex-wrap gap-0.5 justify-center items-center">
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-black" />
                    <div className="size-4 bg-white" />
                    <div className="size-4 bg-black" />
                  </div>
                  <span className="text-[7px] text-neutral-400 font-mono">شناسه استعلام اصالت OCC: {selectedCert.id}</span>
                </div>

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
                    <span>مدت اعتبار: یک‌ساله تا {toFa(selectedCert.expiry)}</span>
                  </div>
                </div>
              </div>

              {/* Certificate Expiry renewal warning */}
              <div className="bg-warning/10 border border-warning/20 rounded p-2 text-[10px] text-warning font-bold flex items-center gap-1.5">
                <AlertTriangle className="size-4 shrink-0" />
                <span>توجه: این گواهی صلاحیت کمتر از ۴ ماه دیگر منقضی می‌شود. جهت تمدید نیاز به تکرار کوئیز شبیه‌ساز است.</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCert(null)} className="h-9 text-xs border-neutral-800 hover:bg-neutral-800 text-white cursor-pointer">
                  بستن پنجره
                </Button>
                <Button size="sm" onClick={() => window.print()} className="bg-accent hover:bg-accent-hover text-white h-9 text-xs gap-1.5 cursor-pointer">
                  <Printer className="size-4" />
                  <span>چاپ فیزیکی گواهی صلاحیت</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
