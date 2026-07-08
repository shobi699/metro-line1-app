'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { ArrowRight, PlayCircle, BookOpen, FileText, Loader2 } from 'lucide-react'

export default function LessonPage({ params }: { params: Promise<{ id: string, lessonId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: courseId, lessonId } = resolvedParams
  const accessToken = useAuthStore((s) => s.accessToken)

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading || !course) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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

  let contentObj: any = {}
  try {
    contentObj = typeof currentLesson.contentRef === 'string' 
      ? JSON.parse(currentLesson.contentRef) 
      : currentLesson.contentRef
  } catch (e) {}

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
          <Card className="overflow-hidden border-border/50 shadow-md">
            {/* Player / Content Area */}
            <div className="aspect-video w-full bg-black flex items-center justify-center text-white relative">
              {currentLesson.kind === 'video' ? (
                contentObj?.videoUrl ? (
                  <video 
                    controls 
                    className="w-full h-full object-contain"
                    src={contentObj.videoUrl}
                    poster={course.coverUrl || undefined}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <PlayCircle className="w-16 h-16" />
                    <p>فایل ویدیویی یافت نشد</p>
                  </div>
                )
              ) : currentLesson.kind === 'pdf' ? (
                <div className="flex flex-col items-center gap-4 bg-muted/20 w-full h-full justify-center text-foreground">
                  <FileText className="w-16 h-16 opacity-50 text-red-500" />
                  <a href={contentObj?.fileUrl || '#'} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                    دانلود فایل PDF
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 bg-muted/20 w-full h-full justify-center text-foreground p-8 overflow-y-auto">
                  <BookOpen className="w-12 h-12 opacity-50 text-primary mb-2" />
                  <div className="prose prose-sm dark:prose-invert max-w-none text-right w-full" dangerouslySetInnerHTML={{ __html: contentObj?.content || 'محتوای متنی یافت نشد.' }} />
                </div>
              )}
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{currentLesson.title}</CardTitle>
                  <CardDescription>
                    {currentLesson.kind === 'video' ? 'ویدیو آموزشی' : currentLesson.kind === 'pdf' ? 'فایل متنی PDF' : 'مقاله آموزشی'}
                    {currentLesson.minSeconds ? ` • حداقل زمان: ${Math.round(currentLesson.minSeconds / 60)} دقیقه` : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
          
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
                        const Icon = lesson.kind === 'video' ? PlayCircle : lesson.kind === 'pdf' ? FileText : BookOpen
                        return (
                          <Link 
                            key={lesson.id} 
                            href={`/learning/courses/${courseId}/lessons/${lesson.id}`}
                            className={`flex items-center gap-3 p-3 text-sm transition-colors border-l-2 ${
                              isActive 
                                ? 'bg-primary/5 border-primary text-foreground font-medium' 
                                : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'opacity-60'}`} />
                            <span className="line-clamp-1">{lesson.title}</span>
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
