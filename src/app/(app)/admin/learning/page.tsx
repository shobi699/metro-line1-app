'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Award, 
  Users, 
  Activity, 
  Loader2, 
  Search, 
  Download, 
  UserPlus, 
  BarChart3, 
  Settings, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { toFa, jalali } from '@/lib/fa'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function AdminLearningDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [activeTab, setActiveTab] = useState<'compliance' | 'analysis' | 'enroll'>('compliance')

  // Search & Filter state for Compliance Matrix
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Exam Item Analysis state
  const [selectedExamId, setSelectedExamId] = useState('')
  const [itemAnalysis, setItemAnalysis] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Enrollment Form state
  const [enrollForm, setEnrollForm] = useState({
    userId: '',
    courseId: '',
    deadlineDays: '30'
  })
  const [enrollData, setEnrollData] = useState<{ users: any[], courses: any[] }>({ users: [], courses: [] })
  const [submittingEnroll, setSubmittingEnroll] = useState(false)

  const fetchData = async () => {
    try {
      const [statsRes, compRes, enrollRes] = await Promise.all([
        fetch('/api/admin/learning/reports'),
        fetch('/api/admin/learning/reports/compliance'),
        fetch('/api/admin/learning/enroll')
      ])
      
      const statsData = await statsRes.json()
      const compData = await compRes.json()
      const enrollDataJson = await enrollRes.json()

      if (statsData.data) {
        setStats(statsData.data)
        // Select first exam if available for item analysis
        if (statsData.data.exams && statsData.data.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(statsData.data.exams[0].id)
        }
      }
      if (compData.data) setCompliance(compData.data)
      if (enrollDataJson.data) setEnrollData(enrollDataJson.data)
    } catch (err) {
      console.error(err)
      toast.error('خطا در دریافت اطلاعات داشبورد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch Item Analysis when selected exam changes
  useEffect(() => {
    if (!selectedExamId) return
    const fetchItems = async () => {
      setLoadingItems(true)
      try {
        const res = await fetch(`/api/admin/learning/reports/items?examId=${selectedExamId}`)
        const json = await res.json()
        if (json.data) {
          setItemAnalysis(json.data)
        } else {
          setItemAnalysis([])
        }
      } catch (err) {
        console.error(err)
        toast.error('خطا در دریافت تحلیل سؤالات آزمون')
      } finally {
        setLoadingItems(false)
      }
    }
    fetchItems()
  }, [selectedExamId])

  // Seeding trigger
  const handleSeedData = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/admin/learning/seed', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || 'داده‌های نمونه با موفقیت ساخته شدند.')
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در ایجاد داده‌های نمونه')
      }
    } catch (err) {
      console.error(err)
      toast.error('ارتباط با سرور برقرار نشد')
    } finally {
      setSeeding(false)
    }
  }

  // Enrollment Submission
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollForm.userId || !enrollForm.courseId) {
      toast.error('لطفاً پرسنل و دوره آموزشی را انتخاب کنید')
      return
    }
    setSubmittingEnroll(true)
    try {
      const res = await fetch('/api/admin/learning/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: enrollForm.userId,
          courseId: enrollForm.courseId,
          deadlineDays: enrollForm.deadlineDays ? parseInt(enrollForm.deadlineDays) : undefined
        })
      })
      const json = await res.json()
      if (json.data) {
        toast.success('پرسنل با موفقیت در دوره ثبت‌نام شد')
        setEnrollForm({ ...enrollForm, userId: '', courseId: '' })
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در ثبت‌نام')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای ارتباط با سرور')
    } finally {
      setSubmittingEnroll(false)
    }
  }

  // Export to Excel using SheetJS
  const handleExportExcel = () => {
    if (!compliance?.details || compliance.details.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد')
      return
    }

    const dataToExport = compliance.details.map((row: any) => {
      const matchedUser = enrollData.users?.find(u => u.id === row.userId)
      const userDisplayName = matchedUser ? matchedUser.name : row.userId

      let persianStatus = 'نامشخص'
      if (row.status === 'completed') persianStatus = 'تکمیل شده (معتبر)'
      if (row.status === 'in_progress') persianStatus = 'در حال انجام'
      if (row.status === 'expired') persianStatus = 'منقضی شده'
      if (row.status === 'failed') persianStatus = 'رد شده در آزمون'

      return {
        'پرسنل': userDisplayName,
        'نام دوره': row.courseTitle || row.courseId,
        'وضعیت انطباق': persianStatus,
        'مهلت اتمام': row.deadlineAt ? jalali(row.deadlineAt) : 'نامحدود'
      }
    })

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    
    // Set RTL sheet view properties
    ws['!views'] = [{ RTL: true }]
    
    XLSX.utils.book_append_sheet(wb, ws, 'انطباق آموزش پرسنل')
    XLSX.writeFile(wb, `Learning-Compliance-Report-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('فایل اکسل با موفقیت دانلود شد')
  }

  // Filter compliance list
  const filteredDetails = compliance?.details?.filter((row: any) => {
    const matchedUser = enrollData.users?.find(u => u.id === row.userId)
    const userName = matchedUser ? matchedUser.name : ''
    const courseTitle = row.courseTitle || ''
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      courseTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || row.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری اطلاعات داشبورد آموزش...</p>
        </div>
      </div>
    )
  }

  // Calculate percentages for custom progress chart
  const compSummary = compliance?.summary || { completed: 0, in_progress: 0, expired: 0, failed: 0 }
  const totalComp = compSummary.completed + compSummary.in_progress + compSummary.expired + compSummary.failed
  const pctCompleted = totalComp > 0 ? Math.round((compSummary.completed / totalComp) * 100) : 0
  const pctInProgress = totalComp > 0 ? Math.round((compSummary.in_progress / totalComp) * 100) : 0
  const pctExpired = totalComp > 0 ? Math.round((compSummary.expired / totalComp) * 100) : 0
  const pctFailed = totalComp > 0 ? Math.round((compSummary.failed / totalComp) * 100) : 0

  return (
    <div className="container mx-auto p-6 space-y-8 select-none">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">داشبورد مدیریت آموزش</h1>
          <p className="text-muted-foreground text-sm">آمار کلی دوره‌های راهبران خط ۱، گواهی‌ها و تحلیل انطباق ریلی</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-md text-sm font-medium transition shadow-md shadow-red-950/20 disabled:opacity-50 cursor-pointer"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ساخت داده‌ها...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ایجاد داده‌های نمونه</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/40 border-border/40 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">دوره‌های فعال</CardTitle>
            <div className="p-2 bg-muted/60 rounded-md text-red-500"><BookOpen className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mt-1">{toFa(stats?.coursesCount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">دوره‌های تعریف شده در پرتال</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">آزمون‌های فعال</CardTitle>
            <div className="p-2 bg-muted/60 rounded-md text-red-500"><Activity className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mt-1">{toFa(stats?.examsCount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-fa">آزمون‌های دوره‌ای و پایانی</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ثبت‌نام کل پرسنل</CardTitle>
            <div className="p-2 bg-muted/60 rounded-md text-red-500"><Users className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold text-white mt-1">{toFa(stats?.totalEnrollments || 0)}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>نرخ اتمام:</span>
              <span className="font-bold text-emerald-500">{toFa(stats?.completionRate || 0)}٪</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats?.completionRate || 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">گواهینامه‌های صادر شده</CardTitle>
            <div className="p-2 bg-muted/60 rounded-md text-red-500"><Award className="w-4 h-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mt-1">{toFa(stats?.certsCount || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">گواهینامه‌های معتبر راهبری قطار</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border/40 gap-2">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition cursor-pointer ${
            activeTab === 'compliance'
              ? 'border-primary text-white bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-white hover:bg-muted/30'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>ماتریس انطباق پرسنل</span>
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-primary text-white bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-white hover:bg-muted/30'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحلیل سوالات آزمون</span>
        </button>
        <button
          onClick={() => setActiveTab('enroll')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition cursor-pointer ${
            activeTab === 'enroll'
              ? 'border-primary text-white bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-white hover:bg-muted/30'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>ثبت‌نام دستی پرسنل</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Compliance List / Table */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="bg-card/40 border-border/40 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
                <CardTitle className="text-lg font-bold text-white">لیست وضعیت انطباق راهبران</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative w-64">
                    <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="جستجوی پرسنل یا دوره..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-9 py-1.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="completed">تکمیل شده</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="expired">منقضی شده</option>
                    <option value="failed">رد شده</option>
                  </select>
                  {/* Export Button */}
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-muted text-white rounded-md text-sm transition border border-border/40 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>خروجی اکسل</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-right text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-medium">
                        <th className="p-4">پرسنل</th>
                        <th className="p-4">نام دوره آموزشی</th>
                        <th className="p-4">وضعیت</th>
                        <th className="p-4">مهلت اتمام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDetails.length > 0 ? (
                        filteredDetails.map((row: any, i: number) => {
                          const matchedUser = enrollData.users?.find(u => u.id === row.userId)
                          const userDisplayName = matchedUser ? matchedUser.name : `شناسه: ${row.userId.substring(0, 8)}...`
                          return (
                            <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-all">
                              <td className="p-4 font-medium text-white">{userDisplayName}</td>
                              <td className="p-4 text-muted-foreground">{row.courseTitle || row.courseId}</td>
                              <td className="p-4">
                                {row.status === 'completed' && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 py-1 px-2.5 rounded-full flex items-center gap-1.5 w-fit">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>تکمیل شده (معتبر)</span>
                                  </Badge>
                                )}
                                {row.status === 'in_progress' && (
                                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/5 py-1 px-2.5 rounded-full flex items-center gap-1.5 w-fit">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>در حال انجام ({toFa(row.progressPct || 0)}٪)</span>
                                  </Badge>
                                )}
                                {row.status === 'expired' && (
                                  <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/10 border-rose-500/20 py-1 px-2.5 rounded-full flex items-center gap-1.5 w-fit">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>منقضی شده</span>
                                  </Badge>
                                )}
                                {row.status === 'failed' && (
                                  <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 border-orange-500/20 py-1 px-2.5 rounded-full flex items-center gap-1.5 w-fit">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>رد شده در آزمون</span>
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 text-muted-foreground font-fa">
                                {row.deadlineAt ? jalali(row.deadlineAt) : 'نامحدود'}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            موردی مطابق با فیلتر یا جستجوی شما یافت نشد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphical Summary Cards on the Side */}
          <div className="space-y-6">
            <Card className="bg-card/40 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">خلاصه وضعیت انطباق (Compliance Matrix)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Stacked Bar Chart representing ratios */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>توزیع آماری وضعیت پرسنل:</span>
                    <span>{toFa(totalComp)} ثبت‌نام کل</span>
                  </div>
                  <div className="w-full h-4 bg-muted/40 rounded-full flex overflow-hidden">
                    <div style={{ width: `${pctCompleted}%` }} className="bg-emerald-500 transition-all" title={`تکمیل شده: ${pctCompleted}%`} />
                    <div style={{ width: `${pctInProgress}%` }} className="bg-yellow-500 transition-all" title={`در حال انجام: ${pctInProgress}%`} />
                    <div style={{ width: `${pctExpired}%` }} className="bg-rose-500 transition-all" title={`منقضی شده: ${pctExpired}%`} />
                    <div style={{ width: `${pctFailed}%` }} className="bg-orange-500 transition-all" title={`رد شده: ${pctFailed}%`} />
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/5 text-emerald-400 rounded-md border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span className="text-sm font-medium">تکمیل شده (معتبر)</span>
                    </div>
                    <span className="text-base font-bold font-fa">{toFa(compSummary.completed)} ({toFa(pctCompleted)}٪)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/5 text-yellow-400 rounded-md border border-yellow-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <span className="text-sm font-medium">در حال انجام</span>
                    </div>
                    <span className="text-base font-bold font-fa">{toFa(compSummary.in_progress)} ({toFa(pctInProgress)}٪)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-rose-500/5 text-rose-400 rounded-md border border-rose-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <span className="text-sm font-medium">منقضی شده</span>
                    </div>
                    <span className="text-base font-bold font-fa">{toFa(compSummary.expired)} ({toFa(pctExpired)}٪)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-500/5 text-orange-400 rounded-md border border-orange-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                      <span className="text-sm font-medium">رد شده در آزمون</span>
                    </div>
                    <span className="text-base font-bold font-fa">{toFa(compSummary.failed)} ({toFa(pctFailed)}٪)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <Card className="bg-card/40 border-border/40 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
              <div>
                <CardTitle className="text-lg font-bold text-white">تحلیل سؤالات آزمون (Item Analysis)</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">بررسی درصد پاسخ‌های صحیح به تفکیک سوالات در تلاش‌های پرسنل</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">انتخاب آزمون:</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white focus:outline-none focus:border-red-500 transition max-w-xs"
                >
                  {stats?.exams?.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.courseTitle})
                    </option>
                  )) || <option>هیچ آزمونی یافت نشد</option>}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="flex justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">در حال بارگذاری تحلیل سوالات...</p>
                  </div>
                </div>
              ) : itemAnalysis.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {itemAnalysis.map((item: any, idx: number) => {
                    // Set color based on correct rate
                    let barColor = 'bg-emerald-500'
                    let textColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    if (item.correctRate < 50) {
                      barColor = 'bg-rose-500'
                      textColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    } else if (item.correctRate < 75) {
                      barColor = 'bg-yellow-500'
                      textColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                    }

                    return (
                      <Card key={idx} className="bg-muted/20 border-border/30 hover:border-border/60 transition">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-sm font-semibold text-white leading-relaxed">
                              {toFa(idx + 1)}. {item.text}
                            </span>
                            <Badge className={`shrink-0 font-fa py-1 border ${textColor}`}>
                              {toFa(item.correctRate)}٪ صحیح
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>نرخ پاسخ صحیح:</span>
                              <span className="font-fa">تعداد تلاش: {toFa(item.totalAttempts)} بار</span>
                            </div>
                            <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`${barColor} h-full rounded-full transition-all duration-500`} 
                                style={{ width: `${item.correctRate}%` }} 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-lg bg-muted/5">
                  <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-sm">داده‌های تلاش آزمون برای این آزمون وجود ندارد.</p>
                  <p className="text-xs text-muted-foreground mt-1">ابتدا با دکمه بالا داده‌های تستی ایجاد کنید.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'enroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Manual Enrollment Form */}
          <Card className="bg-card/40 border-border/40 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">ثبت‌نام دستی پرسنل</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnrollSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">انتخاب راهبر / پرسنل:</label>
                  <select
                    value={enrollForm.userId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                    className="w-full p-2.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">-- انتخاب پرسنل --</option>
                    {enrollData.users?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (کد ملی: {toFa(u.nationalId)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">انتخاب دوره آموزشی:</label>
                  <select
                    value={enrollForm.courseId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                    className="w-full p-2.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">-- انتخاب دوره --</option>
                    {enrollData.courses?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">مهلت اتمام دوره (روز):</label>
                  <input
                    type="number"
                    value={enrollForm.deadlineDays}
                    onChange={(e) => setEnrollForm({ ...enrollForm, deadlineDays: e.target.value })}
                    placeholder="مثال: ۳۰"
                    className="w-full p-2.5 bg-muted/50 border border-border/40 rounded-md text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-red-500 transition font-fa"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingEnroll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {submittingEnroll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>ثبت‌نام پرسنل در دوره</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Quick instructions / Help */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/40 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">راهنمای مدیریت انطباق و آموزش ریلی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  در این پنل، مدیر سیستم می‌تواند انطباق کلی دوره‌های راهبران قطار خط ۱ تهران را پایش کند:
                </p>
                <ul className="list-disc list-inside space-y-2.5 ps-2">
                  <li>
                    <strong className="text-white">دوران تمدید دوره‌ای:</strong> دوره‌هایی که به اتمام می‌رسند، بر اساس فیلد تکرارپذیری تعریف شده در قالب دوره، بعد از مدت مشخص نیاز به آزمون مجدد دارند.
                  </li>
                  <li>
                    <strong className="text-white">قوانین انطباق:</strong> راهبری که دوره برایش اجباری شده اما آن را در مهلت معین تمام نکند، با برچسب قرمز رنگ <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 py-0 px-2 rounded-full inline-block text-xs">منقضی شده</Badge> نشان داده می‌شود.
                  </li>
                  <li>
                    <strong className="text-white">تحلیل سؤالات:</strong> با تحلیل دقیق پاسخ‌های کاربران به سوالات آزمون‌ها می‌توانید بخش‌های آیین‌نامه‌ای که راهبران در آن با مشکل مواجه هستند را پیدا کرده و کلاس‌های توجیهی مناسب برگزار کنید.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
