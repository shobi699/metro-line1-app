'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, GraduationCap, Clock, Award, Loader2 } from 'lucide-react'

export default function LearningDashboardPage() {
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/learning/courses', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.data) setCourses(json.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [accessToken])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">مرکز آموزش و توسعه مهارت‌ها</h1>
          <p className="text-muted-foreground">دوره‌های مرتبط با نقش سازمانی خود را مشاهده و ثبت‌نام کنید.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
            {course.coverUrl ? (
              <div className="h-40 w-full overflow-hidden">
                <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-40 w-full bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="w-16 h-16 opacity-50" />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.category || 'عمومی'}
                </Badge>
                {course.passScore > 0 && (
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Award className="w-3 h-3" />
                    حدنصاب: {course.passScore}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-3 mt-2">
                {course.description || 'بدون توضیحات'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.chapters?.length || 0} فصل</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/learning/courses/${course.id}`} className={buttonVariants({ className: 'w-full group' })}>
                مشاهده دوره
              </Link>
            </CardFooter>
          </Card>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg border-muted">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">هیچ دوره‌ای یافت نشد</h3>
            <p className="text-muted-foreground">در حال حاضر دوره آموزشی مختص نقش شما تعریف نشده است.</p>
          </div>
        )}
      </div>
    </div>
  )
}
