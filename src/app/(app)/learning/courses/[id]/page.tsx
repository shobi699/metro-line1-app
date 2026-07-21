'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, PlayCircle, FileText, CheckCircle2, Lock, Award, Loader2 } from 'lucide-react'

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: courseId } = use(params)
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const [course, setCourse] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  const handleEnroll = async () => {
    if (!accessToken) return
    setEnrolling(true)
    try {
      const res = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId,
          progressPct: 0,
        }),
      })
      if (res.ok) {
        const courseRes = await fetch(`/api/learning/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await courseRes.json()
        if (json.data) setCourse(json.data)
      } else {
        const json = await res.json()
        alert(json.error?.message || 'خطا در ثبت‌نام در دوره')
      }
    } catch (e) {
      console.error(e)
      alert('خطا در ارتباط با سرور')
    } finally {
      setEnrolling(false)
    }
  }

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
          // We can't fetch exam without a specific endpoint if it's not included in course
          // But our API /api/learning/courses/[id] already includes exam in some forms?
          // I will assume course response might include it, or we skip exam details for now
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

  if (loading || !course) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const enrollment = course.enrollments?.[0]
  const isEnrolled = !!enrollment
  const progressPct = enrollment?.progressPct || 0
  const isCompleted = enrollment?.status === 'completed'
  const hasCertificate = course.certificates?.length > 0

  const getCompletedLessons = (userId: string) => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(`completed_lessons_${userId}`) || '[]') as string[]
    } catch {
      return []
    }
  }

  const completedLessons = getCompletedLessons(user?.id || 'default')

  // Get all lessons in order
  const allLessons: any[] = []
  course.chapters?.forEach((chap: any) => {
    chap.lessons?.forEach((les: any) => {
      allLessons.push(les)
    })
  })

  return (
    <div className="container mx-auto p-4 space-y-8 max-w-5xl">
      {/* Course Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {course.coverUrl ? (
          <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden border border-border shrink-0">
            <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full md:w-1/3 aspect-video rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-border">
            <BookOpen className="w-20 h-20 opacity-50" />
          </div>
        )}
        
        <div className="flex-grow space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{course.category || 'عمومی'}</Badge>
            {hasCertificate && <Badge variant="default" className="bg-green-600 hover:bg-green-700">دارای گواهینامه</Badge>}
            {isCompleted && !hasCertificate && <Badge variant="outline" className="text-green-600 border-green-600">تکمیل شده</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {course.description || 'بدون توضیحات'}
          </p>

          {isEnrolled ? (
            <div className="space-y-2 pt-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">پیشرفت شما</span>
                <span className="font-bold text-primary">{progressPct}٪</span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>
          ) : (
            <div className="pt-4">
              <Button size="lg" className="w-full md:w-auto px-8 shadow-md" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'در حال ثبت‌نام...' : 'شروع یادگیری (ثبت‌نام)'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Chapters and Lessons */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            سرفصل‌های دوره
          </h2>
          
          <div className="space-y-4">
            {course.chapters?.length === 0 ? (
              <p className="text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">محتوایی برای این دوره ثبت نشده است.</p>
            ) : (
              course.chapters?.map((chapter: any, index: number) => (
                <Card key={chapter.id} className="overflow-hidden border-border/60 shadow-sm">
                  <CardHeader className="bg-muted/30 pb-3 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm shrink-0">
                        {index + 1}
                      </span>
                      {chapter.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {chapter.lessons?.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">بدون درس</div>
                      ) : (
                        chapter.lessons?.map((lesson: any) => {
                          const Icon = lesson.kind === 'video' ? PlayCircle : lesson.kind === 'pdf' ? FileText : BookOpen
                          
                          const lessonIndex = allLessons.findIndex(l => l.id === lesson.id)
                          const isLessonAccessible = isEnrolled && (
                            lessonIndex === 0 || 
                            completedLessons.includes(allLessons[lessonIndex - 1]?.id)
                          )
                          const isLessonCompleted = completedLessons.includes(lesson.id)
                          
                          return (
                            <div 
                              key={lesson.id} 
                              className={`flex items-center justify-between p-4 transition-colors ${isLessonAccessible ? 'hover:bg-muted/30' : 'opacity-60'}`}
                            >
                              <div className="flex items-center gap-3">
                                {isLessonAccessible ? (
                                  isLessonCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Icon className="w-5 h-5 text-primary/70 shrink-0" />
                                  )
                                ) : (
                                  <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                                )}
                                <span className={isLessonAccessible ? 'font-medium' : 'text-muted-foreground'}>
                                  {lesson.title}
                                </span>
                              </div>
                              
                              {isLessonAccessible && (
                                <Link 
                                  href={`/learning/courses/${course.id}/lessons/${lesson.id}`}
                                  className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer font-bold" })}
                                >
                                  مشاهده
                                </Link>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info & Exam */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">وضعیت و گواهینامه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">وضعیت</span>
                <span className="font-medium">{isCompleted ? 'تکمیل شده' : isEnrolled ? 'در حال یادگیری' : 'ثبت‌نام نشده'}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">گواهینامه</span>
                <span className="font-medium">{hasCertificate ? 'دارد' : 'ندارد'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">نمره قبولی</span>
                <span className="font-medium">{course.passScore}٪</span>
              </div>
            </CardContent>
          </Card>

          {course.exams?.[0] && (() => {
            const exam = course.exams[0]
            return (
              <Card className={`border-2 shadow-md ${isCompleted ? 'border-primary' : 'border-border'}`}>
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    آزمون پایانی
                  </CardTitle>
                  <CardDescription>برای دریافت گواهینامه، قبولی در این آزمون الزامی است.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="bg-muted p-2 rounded text-center">
                      <span className="block text-muted-foreground text-xs mb-1">تعداد سوال</span>
                      <span className="font-bold">{exam.questionCount}</span>
                    </div>
                    <div className="bg-muted p-2 rounded text-center">
                      <span className="block text-muted-foreground text-xs mb-1">زمان (دقیقه)</span>
                      <span className="font-bold">{exam.durationMin}</span>
                    </div>
                  </div>
                  
                  {isEnrolled ? (
                    progressPct >= 100 || isCompleted ? (
                      <Link 
                        href={`/learning/exams/${exam.id}`}
                        className={buttonVariants({ className: 'w-full cursor-pointer font-bold' })}
                      >
                        شروع آزمون
                      </Link>
                    ) : (
                      <Button className="w-full font-bold" variant="outline" disabled>
                        ابتدا دروس را تکمیل کنید
                      </Button>
                    )
                  ) : (
                    <Button className="w-full font-bold" variant="outline" disabled>
                      نیاز به ثبت‌نام
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
