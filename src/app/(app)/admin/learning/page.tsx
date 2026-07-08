'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Award, Users, Activity, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function AdminLearningDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, compRes] = await Promise.all([
          fetch('/api/admin/learning/reports'),
          fetch('/api/admin/learning/reports/compliance')
        ])
        
        const statsData = await statsRes.json()
        const compData = await compRes.json()

        if (statsData.data) setStats(statsData.data)
        if (compData.data) setCompliance(compData.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">داشبورد مدیریت آموزش</h1>
        <p className="text-muted-foreground">آمار کلی دوره‌ها، گواهینامه‌ها و گزارش‌های انطباق (Compliance)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">دوره‌های فعال</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coursesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">آزمون‌ها</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.examsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ثبت‌نام‌ها</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              نرخ اتمام: {stats?.completionRate || 0}٪
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">گواهی‌های صادر شده</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.certsCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>ماتریس انطباق (Compliance Summary)</CardTitle>
          </CardHeader>
          <CardContent>
            {compliance?.summary && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-secondary rounded-md">
                  <span>در حال انجام</span>
                  <Badge variant="outline">{compliance.summary.in_progress}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-success/10 text-success rounded-md">
                  <span>تکمیل شده (معتبر)</span>
                  <Badge className="bg-success">{compliance.summary.completed}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/10 text-destructive rounded-md">
                  <span>رد شده</span>
                  <Badge variant="destructive">{compliance.summary.failed}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-warning/10 text-warning rounded-md">
                  <span>منقضی شده</span>
                  <Badge variant="outline" className="text-warning border-warning">{compliance.summary.expired}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>لیست پرسنل و دوره‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="grid grid-cols-3 bg-muted p-3 font-medium text-sm">
                <div>شناسه کاربر</div>
                <div>نام دوره</div>
                <div>وضعیت</div>
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {compliance?.details?.length > 0 ? (
                  compliance.details.map((row: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 p-3 border-t text-sm items-center">
                      <div className="truncate pr-2">{row.userId.substring(0, 8)}...</div>
                      <div className="truncate pr-2">{row.courseTitle || row.courseId}</div>
                      <div>
                        {row.status === 'completed' && <Badge className="bg-success">تکمیل</Badge>}
                        {row.status === 'in_progress' && <Badge variant="outline">در حال انجام</Badge>}
                        {row.status === 'expired' && <Badge variant="destructive">منقضی</Badge>}
                        {row.status === 'failed' && <Badge variant="destructive">رد شده</Badge>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">داده‌ای موجود نیست</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
