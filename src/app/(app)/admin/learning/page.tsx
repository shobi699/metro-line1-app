'use client'

import { useEffect, useState, Suspense, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  X,
  Eye,
  Save,
  FileText,
  Upload
} from 'lucide-react'
import { toFa, jalali } from '@/lib/fa'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { CourseList } from './components/CourseList'
import { StructureEditor } from './components/StructureEditor'
import { SmartEditorModal } from './components/SmartEditorModal'
import { useAuthStore } from '@/features/auth'
import { uploadFileWithProgress } from '@/lib/upload'

function AdminLearningContent() {
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<any>(null)
  const [compliance, setCompliance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [activeTab, setActiveTab] = useState<'compliance' | 'analysis' | 'enroll' | 'courses' | 'report'>('compliance')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedExamId, setSelectedExamId] = useState('')
  const [itemAnalysis, setItemAnalysis] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [enrollForm, setEnrollForm] = useState({
    userId: '',
    courseId: '',
    deadlineDays: '30'
  })
  const [enrollData, setEnrollData] = useState<{ users: any[], courses: any[] }>({ users: [], courses: [] })
  const [submittingEnroll, setSubmittingEnroll] = useState(false)

  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null)
  
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverUploadProgress, setCoverUploadProgress] = useState(0)
  
  const [courseForm, setCourseForm] = useState({
    id: '',
    key: '',
    title: '',
    category: 'عمومی',
    description: '',
    coverUrl: '',
    passScore: 70,
    recurrenceMonths: 12,
    estMinutes: 30,
    audience: '',
    status: 'draft',
    mandatoryFor: '',
    examQuestionCount: 10,
    examDurationMin: 20,
    examMaxAttempts: 3,
    examCooldownHrs: 24
  })

  const handleUploadCoverFile = async (file: File) => {
    setUploadingCover(true)
    setCoverUploadProgress(0)
    try {
      const url = await uploadFileWithProgress({
        file,
        token: useAuthStore.getState().accessToken || undefined,
        onProgress: (p) => setCoverUploadProgress(p)
      })
      setCourseForm(prev => ({ ...prev, coverUrl: url }))
      toast.success('تصویر کاور با موفقیت آپلود شد')
    } catch (err: any) {
      toast.error(err.message || 'خطا در آپلود تصویر کاور')
    } finally {
      setUploadingCover(false)
    }
  }

  const [chapters, setChapters] = useState<any[]>([])
  const [savingStructure, setSavingStructure] = useState(false)

  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<{ chapterIndex: number, lessonIndex: number, title: string, contentRef: string, kind?: string } | null>(null)

  const authFetch = (url: string, opts?: RequestInit) => {
    const token = useAuthStore.getState().accessToken
    const headers = new Headers(opts?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(url, { ...opts, headers })
  }

  const fetchData = async () => {
    try {
      const [statsRes, compRes, enrollRes, coursesRes] = await Promise.all([
        authFetch('/api/admin/learning/reports'),
        authFetch('/api/admin/learning/reports/compliance'),
        authFetch('/api/admin/learning/enroll'),
        authFetch('/api/admin/learning/courses')
      ])
      
      const statsData = await statsRes.json()
      const compData = await compRes.json()
      const enrollDataJson = await enrollRes.json()
      const coursesData = await coursesRes.json()

      if (statsData.data) {
        setStats(statsData.data)
        if (statsData.data.exams && statsData.data.exams.length > 0 && !selectedExamId) {
          setSelectedExamId(statsData.data.exams[0].id)
        }
      }
      if (compData.data) setCompliance(compData.data)
      if (enrollDataJson.data) setEnrollData(enrollDataJson.data)
      if (coursesData.data) setCourses(coursesData.data)
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

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'courses') {
      setActiveTab('courses')
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedExamId) return
    const fetchItems = async () => {
      setLoadingItems(true)
      try {
        const res = await authFetch(`/api/admin/learning/reports/items?examId=${selectedExamId}`)
        const json = await res.json()
        if (json.data) setItemAnalysis(json.data)
        else setItemAnalysis([])
      } catch (err) {
        console.error(err)
        toast.error('خطا در دریافت تحلیل سؤالات آزمون')
      } finally {
        setLoadingItems(false)
      }
    }
    fetchItems()
  }, [selectedExamId])

  const handleSeedData = async () => {
    setSeeding(true)
    try {
      const res = await authFetch('/api/admin/learning/seed', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.message || 'داده‌های نمونه با موفقیت ساخته شدند.')
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در ایجاد داده‌های فرضی')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطا در ایجاد داده‌های فرضی')
    } finally {
      setSeeding(false)
    }
  }

  const [enrollMode, setEnrollMode] = useState<'single' | 'role' | 'excel'>('single')
  const [enrollRoleKey, setEnrollRoleKey] = useState('')
  const [excelEnrollUsers, setExcelEnrollUsers] = useState<string[]>([])
  const [excelEnrollError, setExcelEnrollError] = useState<string | null>(null)

  const handleDownloadEnrollTemplate = () => {
    const headers = [['کد پرسنلی (personnelCode)', 'مهلت اتمام به روز (deadlineDays)']]
    const sampleData = [
      ['1001', '30'],
      ['1002', '15']
    ]
    const ws = XLSX.utils.sheet_add_aoa(XLSX.utils.json_to_sheet([]), [...headers, ...sampleData])
    const wb = XLSX.utils.book_new()
    ws['!views'] = [{ RTL: true }]
    XLSX.utils.book_append_sheet(wb, ws, 'الگوی ثبت‌نام گروهی')
    XLSX.writeFile(wb, 'Bulk-Enrollment-Template.xlsx')
    toast.success('الگوی فایل اکسل دانلود شد.')
  }

  const handleExcelEnrollUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        if (rows.length === 0) {
          toast.error('فایل اکسل خالی است یا ساختار درستی ندارد')
          return
        }

        const foundUserIds: string[] = []
        const skippedRows: number[] = []

        rows.forEach((row: any, idx: number) => {
          const keys = Object.keys(row)
          const pCode = String(row[keys[0]] || '').trim()
          
          const matchedUser = enrollData.users?.find(u => String(u.personnelCode).trim() === pCode)
          if (matchedUser) {
            foundUserIds.push(matchedUser.id)
          } else {
            skippedRows.push(idx + 2)
          }
        })

        if (foundUserIds.length === 0) {
          setExcelEnrollError('هیچ کاربر معتبری بر اساس کدهای پرسنلی فایل یافت نشد.')
          setExcelEnrollUsers([])
        } else {
          setExcelEnrollUsers(foundUserIds)
          setExcelEnrollError(skippedRows.length > 0 ? `کدهای پرسنلی ردیف‌های (${skippedRows.join(', ')}) در سیستم یافت نشدند.` : null)
          toast.success(`${toFa(foundUserIds.length)} پرسنل معتبر از فایل اکسل شناسایی شدند.`)
        }
      } catch (err) {
        toast.error('خطا در خواندن فایل اکسل')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollForm.courseId) {
      toast.error('انتخاب دوره الزامی است')
      return
    }

    const payload: any = {
      courseId: enrollForm.courseId,
      deadlineDays: enrollForm.deadlineDays
    }

    if (enrollMode === 'single') {
      if (!enrollForm.userId) {
        toast.error('انتخاب پرسنل الزامی است')
        return
      }
      payload.userId = enrollForm.userId
    } else if (enrollMode === 'role') {
      if (!enrollRoleKey) {
        toast.error('انتخاب نقش سازمانی الزامی است')
        return
      }
      payload.roleKey = enrollRoleKey
    } else if (enrollMode === 'excel') {
      if (excelEnrollUsers.length === 0) {
        toast.error('لطفاً ابتدا فایل اکسل حاوی پرسنل معتبر را آپلود کنید')
        return
      }
      payload.bulkUserIds = excelEnrollUsers
    }

    setSubmittingEnroll(true)
    try {
      const res = await authFetch('/api/admin/learning/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.data && json.data.success) {
        toast.success(json.data.message)
        setEnrollForm({ ...enrollForm, userId: '' })
        setExcelEnrollUsers([])
        setExcelEnrollError(null)
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در ثبت‌نام گروهی')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای ارتباط با سرور')
    } finally {
      setSubmittingEnroll(false)
    }
  }

  const [reportLogs, setReportLogs] = useState<any[]>([])
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportSearchTerm, setReportSearchTerm] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('all')
  const [reportSubTab, setReportSubTab] = useState<'summary' | 'detailed'>('summary')
  const [selectedReportCourseId, setSelectedReportCourseId] = useState<string>('all')

  const fetchReportLogs = async () => {
    setLoadingReport(true)
    try {
      const res = await authFetch('/api/admin/learning/reports/learning-logs')
      const json = await res.json()
      if (json.data) setReportLogs(json.data)
    } catch (err) {
      console.error(err)
      toast.error('خطا در بارگذاری گزارش‌های آموزشی')
    } finally {
      setLoadingReport(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'report') {
      void fetchReportLogs()
    }
  }, [activeTab])

  const courseSummaries = useMemo(() => {
    const summaryMap: Record<string, {
      courseId: string
      courseTitle: string
      courseCategory: string
      totalEnrolled: number
      completed: number
      failed: number
      inProgress: number
      expired: number
      scores: number[]
    }> = {}

    reportLogs.forEach((row) => {
      if (!summaryMap[row.courseId]) {
        summaryMap[row.courseId] = {
          courseId: row.courseId,
          courseTitle: row.courseTitle,
          courseCategory: row.courseCategory || 'عمومی',
          totalEnrolled: 0,
          completed: 0,
          failed: 0,
          inProgress: 0,
          expired: 0,
          scores: []
        }
      }

      const s = summaryMap[row.courseId]
      s.totalEnrolled++
      if (row.status === 'completed') s.completed++
      else if (row.status === 'failed') s.failed++
      else if (row.status === 'in_progress') s.inProgress++
      else if (row.status === 'expired') s.expired++

      if (row.maxScore !== null) {
        s.scores.push(row.maxScore)
      }
    })

    return Object.values(summaryMap)
  }, [reportLogs])

  const handleExportSummaryExcel = () => {
    if (courseSummaries.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد')
      return
    }

    const dataToExport = courseSummaries.map((row: any) => {
      const avgScore = row.scores.length > 0 
        ? Math.round(row.scores.reduce((a: number, b: number) => a + b, 0) / row.scores.length) 
        : 0

      return {
        'نام دوره ریلی': row.courseTitle,
        'دسته‌بندی': row.courseCategory,
        'تعداد کل ثبت‌نامی‌ها': toFa(row.totalEnrolled),
        'تعداد تکمیل شده (معتبر)': toFa(row.completed),
        'تعداد مردود در آزمون': toFa(row.failed),
        'تعداد در حال انجام': toFa(row.inProgress),
        'تعداد منقضی شده': toFa(row.expired),
        'میانگین نمرات قبولی (٪)': toFa(avgScore)
      }
    })

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    ws['!views'] = [{ RTL: true }]
    
    XLSX.utils.book_append_sheet(wb, ws, 'خلاصه آموزش دوره‌ها')
    XLSX.writeFile(wb, `Learning-Courses-Summary-Report-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('فایل اکسل خلاصه گزارش با موفقیت دانلود شد')
  }

  const handleExportDetailedExcel = () => {
    let filteredLogs = reportLogs
    let courseName = 'همه دوره‌ها'

    if (selectedReportCourseId !== 'all') {
      filteredLogs = reportLogs.filter(row => row.courseId === selectedReportCourseId)
      const matched = courseSummaries.find(c => c.courseId === selectedReportCourseId)
      if (matched) {
        courseName = matched.courseTitle
      }
    }

    if (filteredLogs.length === 0) {
      toast.error('داده‌ای برای خروجی وجود ندارد')
      return
    }

    const dataToExport = filteredLogs.map((row: any) => {
      let persianStatus = 'نامشخص'
      if (row.status === 'completed') persianStatus = 'تکمیل شده (معتبر)'
      if (row.status === 'in_progress') persianStatus = 'در حال انجام'
      if (row.status === 'expired') persianStatus = 'منقضی شده'
      if (row.status === 'failed') persianStatus = 'رد شده در آزمون'

      return {
        'نام پرسنل': row.userName,
        'کد پرسنلی': row.personnelCode,
        'نقش سازمانی': row.userRole,
        'نام دوره ریلی': row.courseTitle,
        'دسته‌بندی': row.courseCategory || 'عمومی',
        'وضعیت دوره': persianStatus,
        'پیشرفت (٪)': toFa(row.progressPct),
        'نمره آزمون (٪)': row.maxScore !== null ? toFa(row.maxScore) : 'شرکت نکرده',
        'حد نصاب قبولی (٪)': toFa(row.passScore),
        'زمان صرف‌شده (دقیقه)': toFa(row.timeSpentMin),
        'کیفیت عملکرد': row.qualityRating,
        'شماره سریال گواهینامه': row.certSerial || 'صادر نشده',
        'تاریخ صدور گواهینامه': row.certIssuedAt ? jalali(row.certIssuedAt) : '-',
        'تاریخ انقضای گواهینامه': row.certExpiresAt ? jalali(row.certExpiresAt) : '-'
      }
    })

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    ws['!views'] = [{ RTL: true }]
    
    XLSX.utils.book_append_sheet(wb, ws, `گزارش تفصیلی - ${courseName}`)
    XLSX.writeFile(wb, `Learning-Detailed-Report-${courseName}-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success(`گزارش اکسل دوره "${courseName}" با موفقیت دانلود شد`)
  }

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
    ws['!views'] = [{ RTL: true }]
    
    XLSX.utils.book_append_sheet(wb, ws, 'انطباق آموزش پرسنل')
    XLSX.writeFile(wb, `Learning-Compliance-Report-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('فایل اکسل با موفقیت دانلود شد')
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseForm.key || !courseForm.title) {
      toast.error('وارد کردن کلید و عنوان دوره ریلی الزامی است')
      return
    }
    setSavingCourse(true)
    try {
      const isEdit = !!courseForm.id
      const url = isEdit ? `/api/admin/learning/courses/${courseForm.id}` : `/api/admin/learning/courses`
      const method = isEdit ? 'PUT' : 'POST'
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      })
      const json = await res.json()
      if (json.data) {
        toast.success(isEdit ? 'دوره با موفقیت ویرایش شد' : 'دوره ریلی جدید با موفقیت ساخته شد')
        setIsCourseDialogOpen(false)
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در ذخیره‌سازی دوره')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای ارتباط با سرور')
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('آیا از حذف این دوره ریلی اطمینان دارید؟')) return
    try {
      const res = await authFetch(`/api/admin/learning/courses/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('دوره با موفقیت حذف شد')
        if (selectedCourse?.id === id) setSelectedCourse(null)
        await fetchData()
      } else {
        toast.error(json.error?.message || 'خطا در حذف دوره')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای ارتباط با سرور')
    }
  }

  const handleSaveStructure = async () => {
    if (!selectedCourse) return
    setSavingStructure(true)
    try {
      const res = await authFetch(`/api/admin/learning/courses/${selectedCourse.id}/structure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('ساختار کلی دوره ریلی با موفقیت بروزرسانی شد')
        await fetchData()
        const updated = courses.find(c => c.id === selectedCourse.id)
        if (updated) {
          setSelectedCourse(updated)
          setChapters(updated.chapters || [])
        }
      } else {
        toast.error(json.error?.message || 'خطا در ذخیره‌سازی ساختار دوره')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای سرور در ارتباط با ذخیره ساختار')
    } finally {
      setSavingStructure(false)
    }
  }

  const handleOpenVisualBuilder = (cIdx: number, lIdx: number) => {
    const lesson = chapters[cIdx].lessons[lIdx]
    setEditingLesson({
      chapterIndex: cIdx,
      lessonIndex: lIdx,
      title: lesson.title,
      contentRef: lesson.contentRef || '',
      kind: lesson.kind || 'text'
    })
    setIsVisualEditorOpen(true)
  }

  const handleSaveVisualBuilderContent = (contentString: string) => {
    if (!editingLesson) return
    const { chapterIndex, lessonIndex } = editingLesson
    const updated = [...chapters]
    updated[chapterIndex].lessons[lessonIndex].contentRef = contentString
    setChapters(updated)
    setIsVisualEditorOpen(false)
    setEditingLesson(null)
    toast.success('محتوای درس موقتاً ذخیره شد. برای اعمال نهایی دکمه «ذخیره نهایی ساختار دوره» را بزنید.')
  }

  const handleOpenStructure = (course: any) => {
    setSelectedCourse(course)
    setChapters(course.chapters || [])
  }

  const filteredDetails = compliance?.details?.filter((row: any) => {
    const matchedUser = enrollData.users?.find(u => u.id === row.userId)
    const userName = matchedUser ? matchedUser.name : ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || row.userId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>

  const compSummary = compliance?.summary || { completed: 0, in_progress: 0, expired: 0, failed: 0 }
  const totalComp = compSummary.completed + compSummary.in_progress + compSummary.expired + compSummary.failed
  const pctCompleted = totalComp > 0 ? Math.round((compSummary.completed / totalComp) * 100) : 0
  const pctInProgress = totalComp > 0 ? Math.round((compSummary.in_progress / totalComp) * 100) : 0
  const pctExpired = totalComp > 0 ? Math.round((compSummary.expired / totalComp) * 100) : 0
  const pctFailed = totalComp > 0 ? Math.round((compSummary.failed / totalComp) * 100) : 0

  return (
    <div className="container mx-auto p-6 space-y-8 select-none font-fa">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">داشبورد مدیریت آموزش و محتوای ریلی</h1>
          <p className="text-muted-foreground text-sm text-right">آمار کلی، انطباق گواهینامه‌ها و مدیریت ساختار دروس</p>
        </div>
        <button onClick={handleSeedData} disabled={seeding} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>ایجاد داده‌های نمونه</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card/40 border-border/40"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">دوره‌های فعال</CardTitle><BookOpen className="w-4 h-4 text-red-500" /></CardHeader><CardContent><div className="text-3xl font-bold text-white">{toFa(stats?.coursesCount || 0)}</div></CardContent></Card>
        <Card className="bg-card/40 border-border/40"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">آزمون‌های فعال</CardTitle><Activity className="w-4 h-4 text-red-500" /></CardHeader><CardContent><div className="text-3xl font-bold text-white">{toFa(stats?.examsCount || 0)}</div></CardContent></Card>
        <Card className="bg-card/40 border-border/40"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ثبت‌نام کل</CardTitle><Users className="w-4 h-4 text-red-500" /></CardHeader><CardContent><div className="text-3xl font-bold text-white">{toFa(stats?.totalEnrollments || 0)}</div></CardContent></Card>
        <Card className="bg-card/40 border-border/40"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">گواهینامه‌ها</CardTitle><Award className="w-4 h-4 text-red-500" /></CardHeader><CardContent><div className="text-3xl font-bold text-white">{toFa(stats?.certsCount || 0)}</div></CardContent></Card>
      </div>

      <div className="flex border-b border-border/40 gap-2">
        <button onClick={() => setActiveTab('compliance')} className={`px-5 py-3 border-b-2 ${activeTab === 'compliance' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'}`}>ماتریس انطباق</button>
        <button onClick={() => setActiveTab('courses')} className={`px-5 py-3 border-b-2 ${activeTab === 'courses' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'}`}>مدیریت دوره‌ها</button>
        <button onClick={() => setActiveTab('analysis')} className={`px-5 py-3 border-b-2 ${activeTab === 'analysis' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'}`}>تحلیل سؤالات</button>
        <button onClick={() => setActiveTab('enroll')} className={`px-5 py-3 border-b-2 ${activeTab === 'enroll' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'}`}>ثبت‌نام دستی</button>
        <button onClick={() => setActiveTab('report')} className={`px-5 py-3 border-b-2 ${activeTab === 'report' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'}`}>گزارش‌گیری</button>
      </div>

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
                      <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground font-medium font-fa">
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
                              <td className="p-4 font-fa">
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
              <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                <span>ثبت‌نام دستی و گروهی</span>
                {enrollMode === 'excel' && (
                  <button
                    type="button"
                    onClick={handleDownloadEnrollTemplate}
                    className="text-[9px] bg-muted/60 text-emerald-400 hover:text-white px-2 py-1 rounded border border-border/30 flex items-center gap-1 cursor-pointer font-fa"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>دانلود الگوی اکسل</span>
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enrollment Mode Toggle Buttons */}
              <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg border border-border/30">
                {[
                  { key: 'single', label: 'انفرادی' },
                  { key: 'role', label: 'نقش سازمانی' },
                  { key: 'excel', label: 'فایل اکسل' }
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => {
                      setEnrollMode(mode.key as 'single' | 'role' | 'excel')
                      setExcelEnrollUsers([])
                      setExcelEnrollError(null)
                    }}
                    className={`py-1 text-[10px] font-bold rounded transition cursor-pointer text-center ${
                      enrollMode === mode.key 
                        ? 'bg-primary text-white shadow' 
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEnrollSubmit} className="space-y-4">
                {/* 1. SINGLE USER SELECT */}
                {enrollMode === 'single' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">انتخاب راهبر / پرسنل:</label>
                    <select
                      value={enrollForm.userId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                      className="w-full p-2 bg-muted/50 border border-border/40 rounded-md text-xs text-white focus:outline-none focus:border-red-500 transition"
                    >
                      <option value="">-- انتخاب پرسنل --</option>
                      {enrollData.users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (کد پرسنلی: {toFa(u.personnelCode)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. ROLE BASED SELECT */}
                {enrollMode === 'role' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">انتخاب نقش گروه هدف:</label>
                    <select
                      value={enrollRoleKey}
                      onChange={(e) => setEnrollRoleKey(e.target.value)}
                      className="w-full p-2 bg-muted/50 border border-border/40 rounded-md text-xs text-white focus:outline-none focus:border-red-500 transition"
                    >
                      <option value="">-- انتخاب نقش سازمانی --</option>
                      <option value="driver">راهبران قطار (driver)</option>
                      <option value="occ_operator">دیسپچرهای OCC (occ_operator)</option>
                      <option value="shift_lead">سرپرستان / سرشیفت‌ها (shift_lead)</option>
                      <option value="station_agent">متصدیان ایستگاه (station_agent)</option>
                      <option value="operator">اپراتورهای عمومی (operator)</option>
                    </select>
                  </div>
                )}

                {/* 3. EXCEL UPLOAD */}
                {enrollMode === 'excel' && (
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-muted-foreground block">بارگذاری فایل اکسل پرسنل:</label>
                    <div className="border border-dashed border-border/40 rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-black/5 hover:bg-black/10 transition relative">
                      <input
                        type="file"
                        id="excel-enroll-file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={handleExcelEnrollUpload}
                      />
                      <label htmlFor="excel-enroll-file" className="flex flex-col items-center gap-1.5 cursor-pointer text-center w-full">
                        <Upload className="w-5 h-5 text-muted-foreground hover:text-white" />
                        <span className="text-[10px] text-muted-foreground font-fa">انتخاب و بارگذاری فایل اکسل پرسنل (.xlsx)</span>
                      </label>
                    </div>

                    {excelEnrollUsers.length > 0 && (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold font-fa flex items-center justify-between">
                        <span>تعداد پرسنل شناسایی‌شده معتبر:</span>
                        <span>{toFa(excelEnrollUsers.length)} نفر</span>
                      </div>
                    )}

                    {excelEnrollError && (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-fa leading-normal">
                        <strong>خطا در بررسی فایل:</strong> {excelEnrollError}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">انتخاب دوره آموزشی:</label>
                  <select
                    value={enrollForm.courseId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border/40 rounded-md text-xs text-white focus:outline-none focus:border-red-500 transition"
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
                  <label className="text-xs font-semibold text-muted-foreground">مهلت اتمام دوره (روز):</label>
                  <input
                    type="number"
                    min={1}
                    value={enrollForm.deadlineDays}
                    onChange={(e) => setEnrollForm({ ...enrollForm, deadlineDays: e.target.value })}
                    placeholder="مثال: ۳۰"
                    className="w-full p-2 bg-muted/50 border border-border/40 rounded-md text-xs text-white focus:outline-none focus:border-red-500 transition font-fa"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingEnroll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-md text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {submittingEnroll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ثبت‌نام گروهی...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ثبت‌نام پرسنل در دوره ریلی</span>
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

      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Sub-tabs Navigation */}
          <div className="flex border-b border-border/20 gap-2">
            <button
              onClick={() => setReportSubTab('summary')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                reportSubTab === 'summary' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'
              }`}
            >
              گزارش خلاصه دوره‌ها (دوره به دوره)
            </button>
            <button
              onClick={() => setReportSubTab('detailed')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                reportSubTab === 'detailed' ? 'border-primary text-white bg-primary/5' : 'border-transparent text-muted-foreground'
              }`}
            >
              گزارش تفصیلی پرسنل هر دوره
            </button>
          </div>

          {/* SUMMARY TAB */}
          {reportSubTab === 'summary' && (
            <Card className="bg-card/40 border-border/40 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-white">خلاصه وضعیت دوره‌های ریلی فعال</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">مشاهده آمار ثبت‌نام، درصد قبولی و وضعیت عمومی کل دوره‌ها به تفکیک</p>
                </div>
                <Button
                  onClick={handleExportSummaryExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>خروجی اکسل خلاصه دوره‌ها</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingReport ? (
                  <div className="flex justify-center py-20">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">در حال بارگذاری اطلاعات خلاصه...</p>
                    </div>
                  </div>
                ) : courseSummaries.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    هیچ داده‌ای برای نمایش یافت نشد. ابتدا دوره‌ای ثبت یا کاربری ثبت‌نام شود.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/30 text-white font-bold">
                          <th className="p-4">نام دوره ریلی</th>
                          <th className="p-4">دسته‌بندی</th>
                          <th className="p-4 text-center">تعداد کل ثبت‌نامی‌ها</th>
                          <th className="p-4 text-center">قبول شده (معتبر)</th>
                          <th className="p-4 text-center">مردود شده</th>
                          <th className="p-4 text-center">در حال مطالعه / منقضی</th>
                          <th className="p-4 text-center">میانگین نمرات قبولی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {courseSummaries.map((c) => {
                          const avgScore = c.scores.length > 0 
                            ? Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) 
                            : 0
                          
                          return (
                            <tr key={c.courseId} className="hover:bg-muted/10 transition">
                              <td className="p-4 font-bold text-white">{c.courseTitle}</td>
                              <td className="p-4 text-muted-foreground">{c.courseCategory}</td>
                              <td className="p-4 text-center font-fa text-white font-medium">{toFa(c.totalEnrolled)} نفر</td>
                              <td className="p-4 text-center font-fa text-emerald-400 font-semibold">{toFa(c.completed)} نفر</td>
                              <td className="p-4 text-center font-fa text-rose-500 font-medium">{toFa(c.failed)} نفر</td>
                              <td className="p-4 text-center font-fa text-yellow-500">{toFa(c.inProgress + c.expired)} نفر</td>
                              <td className="p-4 text-center font-fa text-white font-bold">{avgScore > 0 ? `${toFa(avgScore)}٪` : '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* DETAILED TAB */}
          {reportSubTab === 'detailed' && (
            <Card className="bg-card/40 border-border/40 shadow-sm">
              <CardHeader className="flex flex-col xl:flex-row xl:items-center xl:justify-between pb-4 gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-white">گزارش تفصیلی پرسنل به تفکیک دوره</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">مشاهده لیست پرسنل، پیشرفت، نمرات امتحانی و شماره سریال گواهی‌نامه‌های صادر شده هر دوره</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Select Course Dropdown */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">انتخاب دوره:</span>
                    <select
                      value={selectedReportCourseId}
                      onChange={(e) => setSelectedReportCourseId(e.target.value)}
                      className="px-2.5 py-1.5 bg-muted/60 border border-border/40 rounded-md text-xs text-white focus:outline-none focus:border-red-500 transition max-w-[200px]"
                    >
                      <option value="all">-- همه دوره‌ها --</option>
                      {courseSummaries.map((c) => (
                        <option key={c.courseId} value={c.courseId}>
                          {c.courseTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Search */}
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="جستجوی نام یا کد پرسنلی..."
                      value={reportSearchTerm}
                      onChange={(e) => setReportSearchTerm(e.target.value)}
                      className="w-full pl-2 pr-8 py-1.5 bg-muted/50 border border-border/40 rounded-md text-xs text-white placeholder-muted-foreground focus:outline-none"
                    />
                  </div>
                  {/* Filter Status */}
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="px-2 py-1.5 bg-muted/50 border border-border/40 rounded-md text-xs text-white focus:outline-none"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="completed">تکمیل شده (معتبر)</option>
                    <option value="in_progress">در حال انجام</option>
                    <option value="expired">منقضی شده</option>
                    <option value="failed">مردود در آزمون</option>
                  </select>
                  {/* Export */}
                  <Button
                    onClick={handleExportDetailedExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>خروجی اکسل این دوره</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingReport ? (
                  <div className="flex justify-center py-20">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-xs text-muted-foreground">در حال بارگذاری گزارش تفصیلی...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/30 text-white font-bold">
                          <th className="p-4">پرسنل</th>
                          <th className="p-4">دوره ریلی</th>
                          <th className="p-4 text-center">میزان پیشرفت</th>
                          <th className="p-4 text-center">نمره نهایی / قبولی</th>
                          <th className="p-4 text-center">زمان مطالعه</th>
                          <th className="p-4 text-center">کیفیت یادگیری</th>
                          <th className="p-4">جزئیات گواهینامه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {reportLogs
                          .filter((row) => {
                            const matchesCourse = selectedReportCourseId === 'all' || row.courseId === selectedReportCourseId
                            const matchesSearch = row.userName.toLowerCase().includes(reportSearchTerm.toLowerCase()) || 
                                                  row.courseTitle.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                                                  row.personnelCode.includes(reportSearchTerm)
                            const matchesStatus = reportStatusFilter === 'all' || row.status === reportStatusFilter
                            return matchesCourse && matchesSearch && matchesStatus
                          })
                          .map((row) => {
                            let ratingColor = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            if (row.qualityRating === 'عالی') ratingColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            if (row.qualityRating === 'خوب') ratingColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            if (row.qualityRating === 'نیاز به تلاش مجدد') ratingColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20'

                            return (
                              <tr key={row.id} className="hover:bg-muted/10 transition">
                                <td className="p-4">
                                  <span className="font-bold text-white block">{row.userName}</span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5 font-fa">
                                    {row.userRole} (کد: {toFa(row.personnelCode)})
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="font-medium text-white block">{row.courseTitle}</span>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5 font-fa">
                                    دسته: {row.courseCategory || 'عمومی'}
                                  </span>
                                </td>
                                <td className="p-4 font-fa text-center">
                                  <div className="space-y-1 max-w-[120px] mx-auto">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                      <span>پیشرفت:</span>
                                      <span>{toFa(row.progressPct)}٪</span>
                                    </div>
                                    <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${row.progressPct}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className="font-bold font-fa text-white text-xs">
                                      {row.maxScore !== null ? `${toFa(row.maxScore)}٪` : '-'}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground mt-0.5 font-fa">
                                      (حد نصاب: {toFa(row.passScore)}٪)
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-center font-fa text-white font-medium">
                                  {toFa(row.timeSpentMin)} دقیقه
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block py-0.5 px-2 rounded-full border text-[10px] font-bold ${ratingColor}`}>
                                    {row.qualityRating}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {row.certSerial ? (
                                    <div>
                                      <span className="font-mono text-white text-[10px] block">{row.certSerial}</span>
                                      <span className="text-[9px] text-muted-foreground block mt-0.5 font-fa">
                                        انقضا: {jalali(row.certExpiresAt)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-[10px] italic">صادر نشده</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        selectedCourse ? (
          <StructureEditor
            course={selectedCourse}
            chapters={chapters}
            saving={savingStructure}
            onChaptersChange={setChapters}
            onSave={handleSaveStructure}
            onCancel={() => setSelectedCourse(null)}
            onOpenVisualBuilder={handleOpenVisualBuilder}
          />
        ) : (
          <CourseList
            courses={courses}
            onEditStructure={handleOpenStructure}
            onEditSettings={(course) => {
              const finalExam = course.exams?.[0]
              setCourseForm({
                id: course.id,
                key: course.key,
                title: course.title,
                category: course.category || 'عمومی',
                description: course.description || '',
                coverUrl: course.coverUrl || '',
                passScore: course.passScore || 70,
                recurrenceMonths: course.recurrenceMonths || 12,
                estMinutes: course.estMinutes || 30,
                audience: course.audience || '',
                status: course.status || 'draft',
                mandatoryFor: course.mandatoryFor || '',
                examQuestionCount: finalExam?.questionCount || 10,
                examDurationMin: finalExam?.durationMin || 20,
                examMaxAttempts: finalExam?.maxAttempts || 3,
                examCooldownHrs: finalExam?.cooldownHrs || 24
              })
              setIsCourseDialogOpen(true)
            }}
            onDeleteCourse={handleDeleteCourse}
            onCreateNew={() => {
              setCourseForm({
                id: '',
                key: '',
                title: '',
                category: 'عمومی',
                description: '',
                coverUrl: '',
                passScore: 70,
                recurrenceMonths: 12,
                estMinutes: 30,
                audience: '',
                status: 'draft',
                mandatoryFor: '',
                examQuestionCount: 10,
                examDurationMin: 20,
                examMaxAttempts: 3,
                examCooldownHrs: 24
              })
              setIsCourseDialogOpen(true)
            }}
          />
        )
      )}

      {/* Course Settings Form dialog */}
      {isCourseDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-fa">
          <div className="bg-card border border-border/80 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {courseForm.id ? 'ویرایش تنظیمات دوره ریلی' : 'ایجاد دوره ریلی جدید'}
              </h3>
              <button onClick={() => setIsCourseDialogOpen(false)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-5 space-y-4 overflow-y-auto max-h-[85vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">شناسه/کلید یکتا (انگلیسی):</label>
                  <input
                    type="text"
                    required
                    disabled={!!courseForm.id}
                    value={courseForm.key}
                    onChange={(e) => setCourseForm({ ...courseForm, key: e.target.value })}
                    className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white font-mono focus:outline-none focus:border-primary"
                    placeholder="e.g. general_rules"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">عنوان دوره (فارسی):</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white focus:outline-none focus:border-primary"
                    placeholder="عنوان دوره..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground">دسته‌بندی ریلی:</label>
                  <div className="flex gap-1">
                    <select
                      value={['فنی', 'ایمنی و قوانین', 'عملیات و سیر و حرکت', 'عمومی'].includes(courseForm.category) ? courseForm.category : 'other'}
                      onChange={(e) => {
                        const val = e.target.value
                        setCourseForm({ ...courseForm, category: val === 'other' ? '' : val })
                      }}
                      className="p-2 bg-muted border border-border/40 rounded text-xs text-white focus:outline-none focus:border-primary flex-1"
                    >
                      <option value="عمومی">عمومی</option>
                      <option value="فنی">فنی</option>
                      <option value="ایمنی و قوانین">ایمنی و قوانین</option>
                      <option value="عملیات و سیر و حرکت">عملیات و سیر و حرکت</option>
                      <option value="other">سایر دسته‌ها...</option>
                    </select>
                    {!['فنی', 'ایمنی و قوانین', 'عملیات و سیر و حرکت', 'عمومی'].includes(courseForm.category) && (
                      <input
                        type="text"
                        required
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="p-2 bg-muted border border-border/40 rounded text-[10px] text-white focus:outline-none focus:border-primary w-24"
                        placeholder="نام دسته..."
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] text-muted-foreground">حد نصاب:</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={courseForm.passScore}
                      onChange={(e) => setCourseForm({ ...courseForm, passScore: parseInt(e.target.value) || 70 })}
                      className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white text-center font-fa focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] text-muted-foreground">تمدید (ماه):</label>
                    <input
                      type="number"
                      min={1}
                      value={courseForm.recurrenceMonths}
                      onChange={(e) => setCourseForm({ ...courseForm, recurrenceMonths: parseInt(e.target.value) || 12 })}
                      className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white text-center font-fa focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10px] text-muted-foreground">مدت (دقیقه):</label>
                    <input
                      type="number"
                      min={1}
                      value={courseForm.estMinutes}
                      onChange={(e) => setCourseForm({ ...courseForm, estMinutes: parseInt(e.target.value) || 30 })}
                      className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white text-center font-fa focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Roles and target audience */}
              <div className="space-y-2 border border-border/20 rounded-lg p-3 bg-black/10">
                <label className="text-[10px] text-white font-bold block mb-1">انتخاب نقش‌های مجاز و اجباری بودن دوره:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'driver', label: 'راهبر قطار' },
                    { key: 'occ_operator', label: 'دیسپچر OCC' },
                    { key: 'shift_lead', label: 'سرشیفت / سرپرست' },
                    { key: 'station_agent', label: 'متصدی ایستگاه' },
                    { key: 'operator', label: 'اپراتور عمومی' },
                    { key: 'admin', label: 'مدیر سیستم' }
                  ].map((role) => {
                    const isAllowed = courseForm.audience.split(',').map(s => s.trim()).includes(role.key)
                    const isMandatory = courseForm.mandatoryFor.split(',').map(s => s.trim()).includes(role.key)
                    return (
                      <div key={role.key} className="flex flex-col gap-1.5 p-2 bg-muted/40 border border-border/20 rounded-md">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id={`allow-${role.key}`}
                            checked={isAllowed}
                            onChange={(e) => {
                              const checked = e.target.checked
                              let current = courseForm.audience.split(',').map(s => s.trim()).filter(Boolean)
                              if (checked) {
                                if (!current.includes(role.key)) current.push(role.key)
                              } else {
                                current = current.filter(c => c !== role.key)
                                let mand = courseForm.mandatoryFor.split(',').map(s => s.trim()).filter(c => c !== role.key)
                                setCourseForm(prev => ({ ...prev, mandatoryFor: mand.join(',') }))
                              }
                              setCourseForm(prev => ({ ...prev, audience: current.join(',') }))
                            }}
                            className="accent-primary cursor-pointer w-3.5 h-3.5"
                          />
                          <label htmlFor={`allow-${role.key}`} className="text-[10px] text-white font-bold cursor-pointer select-none">
                            {role.label}
                          </label>
                        </div>
                        {isAllowed && (
                          <div className="flex items-center gap-1 mt-0.5 border-t border-border/10 pt-1 ps-1">
                            <input
                              type="checkbox"
                              id={`mand-${role.key}`}
                              checked={isMandatory}
                              onChange={(e) => {
                                const checked = e.target.checked
                                let current = courseForm.mandatoryFor.split(',').map(s => s.trim()).filter(Boolean)
                                if (checked) {
                                  if (!current.includes(role.key)) current.push(role.key)
                                } else {
                                  current = current.filter(c => c !== role.key)
                                }
                                setCourseForm(prev => ({ ...prev, mandatoryFor: current.join(',') }))
                              }}
                              className="accent-red-500 cursor-pointer w-3 h-3"
                            />
                            <label htmlFor={`mand-${role.key}`} className="text-[8px] text-red-400 cursor-pointer select-none font-bold">
                              گذراندن اجباری است
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cover URL with Upload and preview */}
              <div className="space-y-1.5 border border-border/20 rounded-lg p-3 bg-black/10">
                <label className="text-[10px] text-white font-bold block mb-1">تصویر کاور دوره ریلی:</label>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {courseForm.coverUrl ? (
                    <div className="relative w-28 h-16 rounded overflow-hidden border border-border/40 bg-black shrink-0">
                      <img src={courseForm.coverUrl} className="w-full h-full object-cover" alt="کاور دوره" />
                      <button
                        type="button"
                        onClick={() => setCourseForm({ ...courseForm, coverUrl: '' })}
                        className="absolute top-0.5 right-0.5 bg-black/60 p-0.5 rounded-full hover:bg-black text-red-500 hover:text-red-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-16 rounded border border-dashed border-border/40 flex items-center justify-center text-muted-foreground text-[9px] shrink-0 bg-muted/20 font-fa">
                      بدون تصویر کاور
                    </div>
                  )}
                  
                  <div className="flex-1 w-full space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={courseForm.coverUrl}
                        onChange={(e) => setCourseForm({ ...courseForm, coverUrl: e.target.value })}
                        className="flex-1 p-1.5 bg-muted border border-border/40 rounded text-[10px] text-white font-mono dir-ltr text-left focus:outline-none focus:border-primary"
                        placeholder="/uploads/cover.png"
                      />
                      <input
                        type="file"
                        id="cover-file-input"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) void handleUploadCoverFile(f)
                        }}
                      />
                      <label
                        htmlFor="cover-file-input"
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0"
                      >
                        <Upload className="w-3 h-3" />
                        <span>آپلود تصویر</span>
                      </label>
                    </div>
                    {uploadingCover && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] text-muted-foreground font-fa">
                          <span>در حال آپلود کاور...</span>
                          <span className="font-mono">{toFa(coverUploadProgress)}٪</span>
                        </div>
                        <div className="w-full bg-muted/40 h-1 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${coverUploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Customizable Final Exam settings */}
              <div className="space-y-2 border border-border/20 rounded-lg p-3 bg-black/10">
                <span className="text-[10px] text-white font-bold block border-b border-border/10 pb-1 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span>تنظیمات آزمون نهایی متصل به دوره:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">تعداد سؤالات آزمون:</label>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={courseForm.examQuestionCount}
                      onChange={(e) => setCourseForm({ ...courseForm, examQuestionCount: parseInt(e.target.value) || 10 })}
                      className="w-full p-1.5 bg-muted border border-border/40 rounded text-[10px] text-white text-center font-fa focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">مدت آزمون (دقیقه):</label>
                    <input
                      type="number"
                      min={1}
                      value={courseForm.examDurationMin}
                      onChange={(e) => setCourseForm({ ...courseForm, examDurationMin: parseInt(e.target.value) || 20 })}
                      className="w-full p-1.5 bg-muted border border-border/40 rounded text-[10px] text-white text-center font-fa focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">حداکثر دفعات تلاش:</label>
                    <input
                      type="number"
                      min={1}
                      value={courseForm.examMaxAttempts}
                      onChange={(e) => setCourseForm({ ...courseForm, examMaxAttempts: parseInt(e.target.value) || 3 })}
                      className="w-full p-1.5 bg-muted border border-border/40 rounded text-[10px] text-white text-center font-fa focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-muted-foreground">زمان خنک‌سازی (ساعت):</label>
                    <input
                      type="number"
                      min={0}
                      value={courseForm.examCooldownHrs}
                      onChange={(e) => setCourseForm({ ...courseForm, examCooldownHrs: parseInt(e.target.value) || 24 })}
                      className="w-full p-1.5 bg-muted border border-border/40 rounded text-[10px] text-white text-center font-fa focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">وضعیت انتشار:</label>
                <select
                  value={courseForm.status}
                  onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                  className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="draft">پیش‌نویس (غیرقابل مشاهده برای کاربران)</option>
                  <option value="published">منتشر شده (قابل مشاهده برای کاربران)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground">توضیحات دوره:</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white h-16 resize-none focus:outline-none focus:border-primary"
                  placeholder="شرح اهداف آموزشی و آیین‌نامه‌ای دوره..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                <Button type="button" variant="outline" onClick={() => setIsCourseDialogOpen(false)} className="text-xs">
                  انصراف
                </Button>
                <Button type="submit" disabled={savingCourse} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold">
                  {savingCourse ? 'در حال ثبت...' : 'ذخیره تنظیمات دوره'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SmartEditorModal
        isOpen={isVisualEditorOpen}
        onClose={() => {
          setIsVisualEditorOpen(false)
          setEditingLesson(null)
        }}
        lessonTitle={editingLesson?.title || ''}
        lessonKind={editingLesson?.kind || 'text'}
        contentRef={editingLesson?.contentRef || ''}
        onSave={handleSaveVisualBuilderContent}
      />
    </div>
  )
}

export default function AdminLearningDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری اطلاعات داشبورد آموزش...</p>
        </div>
      </div>
    }>
      <AdminLearningContent />
    </Suspense>
  )
}
