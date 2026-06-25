'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Award, Trophy, CheckCircle, XCircle, Play, AlertCircle, FileText, HelpCircle, Clock, Printer, Train, ShieldCheck } from 'lucide-react'
import { toFa } from '@/lib/fa'

interface Certificate {
  userName: string
  courseTitle: string
  score: number
  date: string
  id: string
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
}

interface PendingExam {
  id: string
  title: string
  slug: string
  category: string
  questionCount: number
  mandatory: boolean
  dueDate?: string
}

const COMPLETED_EXAMS: ExamRecord[] = [
  {
    id: 'ex-1',
    title: 'مقررات عمومی سیر و حرکت خط ۱ (سیگنال‌ها)',
    slug: 'مقررات-عمومی-سیر-و-حرکت-خط-۱-سیگنال‌ها',
    totalQuestions: 3,
    correctAnswers: 3,
    score: 100,
    status: 'passed',
    date: '۱۴۰۵/۰۲/۱۵',
  },
  {
    id: 'ex-2',
    title: 'عیب‌یابی سیستم مکانیزم درب قطارهای سری ۱۰۰',
    slug: 'عیب‌یابی-سیستم-مکانیزم-درب-قطارهای-سری-۱۰۰',
    totalQuestions: 4,
    correctAnswers: 3,
    score: 75,
    status: 'passed',
    date: '۱۴۰۵/۰۳/۰۱',
  },
]

const PENDING_EXAMS: PendingExam[] = [
  {
    id: 'ex-p1',
    title: 'پروتکل ایمنی تخلیه مسافرین در داخل تونل مترو',
    slug: 'پروتکل-ایمنی-تخلیه-مسافرین-در-داخل-تونل-مترو',
    category: 'ایمنی و بحران',
    questionCount: 3,
    mandatory: true,
    dueDate: '۱۴۰۵/۰۴/۱۵',
  },
  {
    id: 'ex-p2',
    title: 'سیستم‌های مکانیکی کلاچ و بوژی قطارهای درون‌شهری',
    slug: 'سیستم‌های-مکانیکی-کلاچ-و-بوژی',
    category: 'عیب‌یابی فنی',
    questionCount: 4,
    mandatory: false,
  },
]

export default function MyExamsPage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)

  const [completedList, setCompletedList] = useState<ExamRecord[]>([])
  const [pendingList, setPendingList] = useState<PendingExam[]>([])
  const [points, setPoints] = useState(150) // امتیازهای گیمیفیکیشن آموزشی
  const [rank, setRank] = useState(12) // رتبه در میان پرسنل خط ۱
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)

  // تلاش برای لود از دیتابیس در صورت لزوم
  useEffect(() => {
    if (!accessToken) return
    async function loadExams() {
      try {
        const profRes = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (profRes.ok) {
          const data = await profRes.json()
          if (data.data && data.data.customFields?.points) {
            setPoints(Number(data.data.customFields.points))
          }
        }

        const postsRes = await fetch('/api/posts', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (postsRes.ok) {
          const data = await postsRes.json()
          const allPosts = data.data as any[]

          // فیلتر کردن پست‌هایی که دارای آزمون هستند (آموزشی و چندرسانه‌ای)
          const quizPosts = allPosts.filter((p) => p.hasQuiz === true)

          // نقشه‌نگاری دوره‌های پاس شده
          const completed = quizPosts
            .filter((p) => p.isCompleted === true)
            .map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              totalQuestions: 3, // فرضی برای تعداد سوالات
              correctAnswers: 3,
              score: 100,
              status: 'passed' as const,
              date: p.createdAt.substring(0, 10).replace(/-/g, '/'),
            }))

          // نقشه‌نگاری دوره‌های معلق در انتظار آزمون
          const pending = quizPosts
            .filter((p) => p.isCompleted === false)
            .map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              category: p.category || (p.type === 'gallery' ? 'گالری چندرسانه‌ای' : 'آموزش تخصصی'),
              questionCount: 3,
              mandatory: p.mandatory,
            }))

          setCompletedList(completed)
          setPendingList(pending)
        }
      } catch (err) {
        console.error('Failed to load dynamic exams:', err)
      }
    }
    loadExams()
  }, [accessToken])

  const passingRate = (completedList.filter((e) => e.status === 'passed').length / (completedList.length || 1)) * 100

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="کارنامه و آزمون‌های من"
        subtitle="سوابق کوئیزها، نتایج ارزشیابی‌های دوره‌ای و رتبه گیمیفیکیشن آموزشی"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6">
        {/* Top Widgets / Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">مجموع کوئیزهای موفق</p>
                <h3 className="text-lg font-bold mt-1 text-success">
                  {toFa(completedList.filter((e) => e.status === 'passed').length)} آزمون
                </h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-lg text-success">
                <CheckCircle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">درصد قبولی آزمون‌ها</p>
                <h3 className="text-lg font-bold mt-1 text-foreground">
                  {toFa(Math.round(passingRate))} درصد
                </h3>
              </div>
              <div className="bg-info/10 p-2.5 rounded-lg text-info">
                <Award className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">امتیاز کل گیمیفیکیشن</p>
                <h3 className="text-lg font-bold mt-1 text-accent">
                  {toFa(points)} امتیاز
                </h3>
              </div>
              <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                <Trophy className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container-low border-border-subtle">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">رتبه شما در خط ۱</p>
                <h3 className="text-lg font-bold mt-1 text-amber-500">
                  رتبه {toFa(rank)}
                </h3>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-lg text-amber-500">
                <Trophy className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main: Completed Exams Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="size-4 text-success" />
                  لیست آزمون‌ها و کوئیزهای تکمیل شده پرسنلی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-foreground-muted">
                    <FileText className="size-10 mb-2 opacity-50" />
                    <p className="text-sm">هنوز در هیچ آزمونی شرکت نکرده‌اید.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-border-subtle bg-surface-container text-foreground-muted text-xs font-semibold">
                          <th className="p-3">عنوان دوره آموزشی</th>
                          <th className="p-3">پاسخ صحیح</th>
                          <th className="p-3">نمره ارزشیابی</th>
                          <th className="p-3">تاریخ ثبت</th>
                          <th className="p-3 text-center">وضعیت</th>
                          <th className="p-3 text-left">گواهی‌نامه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-sm">
                        {completedList.map((exam) => (
                          <tr key={exam.id} className="hover:bg-surface-hover">
                            <td className="p-3 font-semibold text-foreground">
                              <Link href={`/content/${exam.slug}`} className="hover:underline hover:text-accent">
                                {exam.title}
                              </Link>
                            </td>
                            <td className="p-3 font-mono text-xs">
                              {toFa(exam.correctAnswers)} از {toFa(exam.totalQuestions)}
                            </td>
                            <td className="p-3 font-mono font-bold">
                              {toFa(exam.score)}٪
                            </td>
                            <td className="p-3 font-mono text-xs">{exam.date}</td>
                            <td className="p-3 text-center">
                              <Badge
                                variant="outline"
                                className={
                                  exam.status === 'passed'
                                    ? 'bg-success/15 text-success border-success/30'
                                    : 'bg-critical/10 text-critical border-critical/20'
                                }
                              >
                                {exam.status === 'passed' ? 'قبول شده' : 'نیاز به تلاش مجدد'}
                              </Badge>
                            </td>
                            <td className="p-3 text-left">
                              {exam.status === 'passed' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedCert({
                                    userName: user?.name || 'راهبر قطار خط ۱',
                                    courseTitle: exam.title,
                                    score: exam.score,
                                    date: exam.date,
                                    id: `CERT-${exam.id.toUpperCase()}-${user?.nationalId || '123'}`
                                  })}
                                  className="h-8 text-xs border-accent/25 hover:bg-accent/5 text-accent gap-1 cursor-pointer"
                                >
                                  <Award className="size-3.5" />
                                  <span>مشاهده گواهی</span>
                                </Button>
                              ) : (
                                <span className="text-xs text-foreground-muted">-</span>
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

          {/* Sidebar Area: Pending Exams & Gamification */}
          <div className="space-y-6">
            {/* Pending Exams */}
            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-warning" />
                  آزمون‌های در انتظار شرکت
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {pendingList.length === 0 ? (
                  <div className="text-center py-6 text-foreground-muted text-xs">
                    💡 آزمون معلقی ندارید! تمامی دوره‌ها با موفقیت انجام شده‌اند.
                  </div>
                ) : (
                  pendingList.map((p) => (
                    <div key={p.id} className="p-3 border border-border rounded-lg bg-surface flex flex-col gap-2 relative">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground leading-relaxed pe-14">{p.title}</h4>
                          <span className="text-[10px] text-foreground-muted font-semibold mt-0.5 block">{p.category}</span>
                        </div>
                        <div className="absolute top-3 left-3 flex flex-col items-end gap-1">
                          {p.mandatory && (
                            <Badge className="bg-critical/15 text-critical border-transparent text-[8px] font-bold">
                              الزامی
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-foreground-muted">
                        <span>تعداد سوالات: {toFa(p.questionCount)} سوال</span>
                        {p.dueDate && <span className="text-critical font-bold">مهلت: {p.dueDate}</span>}
                      </div>

                      <Link href={`/content/${p.slug}`} className="mt-2">
                        <Button size="sm" className="w-full h-8 gap-1 text-xs">
                          <Play className="size-3.5 fill-current" />
                          <span>شروع ویدیو و آزمون</span>
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Summary (Gamification) */}
            <Card className="border-border-subtle bg-surface-container-low">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  برترین‌های آموزش این ماه خط ۱
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">۱.</span>
                    <span>سید رسول عباسی (راهبر ارشد)</span>
                  </div>
                  <span className="font-mono">۳۵۰ امتیاز</span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">۲.</span>
                    <span>محمود رمضانی</span>
                  </div>
                  <span className="font-mono">۳۰۰ امتیاز</span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">۳.</span>
                    <span>امیرحسین زارعی</span>
                  </div>
                  <span className="font-mono">۲۸۰ امتیاز</span>
                </div>

                <div className="text-center pt-2">
                  <Link href="/leaderboard">
                    <Button variant="ghost" size="sm" className="text-xs text-accent">
                      مشاهده رتبه‌بندی کل پرسنل ←
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Certificate Viewer Modal Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 text-white p-6 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold text-accent flex items-center gap-2">
              <Award className="size-5" />
              <span>گواهی‌نامه پایان دوره آموزشی الکترونیکی</span>
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-neutral-400">
              این گواهی‌نامه بر اساس ثبت نمره قبولی در بانک سوالات و تایید مرکز فرماندهی (OCC) صادر گردیده است.
            </DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="flex flex-col gap-6 mt-4">
              {/* Certificate Template Styling Container */}
              <div className="relative border-4 border-double border-accent/40 bg-radial from-neutral-900 via-neutral-950 to-stone-950 p-6 md:p-10 rounded-lg overflow-hidden text-center flex flex-col items-center justify-between gap-6 min-h-[360px] shadow-2xl">
                {/* Background watermarks & borders */}
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
                  <h3 className="text-xl md:text-2xl font-bold text-amber-400 font-headline-lg">گواهی‌نامه رسمی شایستگی فنی</h3>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    بدین‌وسیله گواهی می‌شود همکار گرامی جناب آقای/سرکار خانم <span className="font-bold text-white text-sm md:text-base underline decoration-accent decoration-2 underline-offset-4">{selectedCert.userName}</span> با کد ملی <span className="font-mono text-neutral-200 font-bold">{toFa(user?.nationalId || '۱۲۳۴۵۶۷۸۹۰')}</span> دوره تخصصی و ارزیابی الکترونیکی:
                  </p>
                  <h4 className="text-sm md:text-base font-bold text-white bg-neutral-800/50 border border-neutral-700/35 px-4 py-2 rounded-lg inline-block my-1 leading-relaxed">
                    {selectedCert.courseTitle}
                  </h4>
                  <p className="text-xs md:text-sm text-neutral-300 leading-8">
                    را با موفقیت و کسب نمره ممتاز <span className="font-bold text-success font-mono text-sm md:text-base">{toFa(selectedCert.score)}٪</span> به پایان رسانده و صلاحیت فنی و ایمنی لازم را در این ماژول اخذ نموده‌اند.
                  </p>
                </div>

                {/* Certificate Footer */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-neutral-800/60 mt-4 text-xs">
                  <div className="flex flex-col items-center md:items-start gap-1 text-[10px] text-neutral-400">
                    <span>شناسه اصالت گواهی:</span>
                    <span className="font-mono text-neutral-300 select-all font-semibold uppercase">{selectedCert.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-success font-semibold">
                    <ShieldCheck className="size-4" />
                    <span>صلاحیت فنی تایید شده OCC</span>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-1 text-[10px] text-neutral-400">
                    <span>تاریخ صدور گواهی‌نامه:</span>
                    <span className="font-mono text-neutral-200 font-bold">{toFa(selectedCert.date)}</span>
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
