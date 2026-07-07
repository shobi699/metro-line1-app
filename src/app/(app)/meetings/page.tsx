'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  User,
  Settings,
  MessageSquare,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Phone,
  Video,
  FileSpreadsheet,
  Check,
  UserPlus,
  CalendarDays,
  Lightbulb,
  Info,
  FileCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string
  role: {
    key: string
    name: string
  }
}

interface Meeting {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  durationMinutes: number
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed'
  note: string | null
  meetingType: 'in-person' | 'phone' | 'online' | 'emergency' | 'confidential' | 'disciplinary' | 'training' | 'suggestion-review'
  priority: 'normal' | 'urgent'
  groupBooking: boolean
  alternativeTimeProposed?: string // زمان پیشنهادی جایگزین مدیر
  // مستندسازی صورت‌جلسه — بخش ۱۱.۴
  minutes?: {
    summary: string
    decisions: string[]
    tasks: { title: string; assignee: string }[]
  }
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'in-person': { label: 'ملاقات حضوری', icon: User, color: 'text-info' },
  'phone': { label: 'تماس تلفنی', icon: Phone, color: 'text-success' },
  'online': { label: 'جلسه آنلاین', icon: Video, color: 'text-accent' },
  'emergency': { label: 'جلسه اضطراری 🚨', icon: ShieldAlert, color: 'text-critical' },
  'confidential': { label: 'محرمانه 🔐', icon: AlertCircle, color: 'text-warning' },
  'disciplinary': { label: 'جلسه انضباطی', icon: XCircle, color: 'text-critical' },
  'training': { label: 'جلسه آموزشی', icon: GraduationCap, color: 'text-success' },
  'suggestion-review': { label: 'بررسی پیشنهاد', icon: Lightbulb, color: 'text-info' },
}

const SAMPLE_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'بررسی عدم تطابق کدهای پرسنلی در فایل لوحه شیفت ب',
    description: 'نیاز به هماهنگی با معاونت سیر و حرکت جهت تطابق کدهای ۱۰ رقمی ملی راهبران آماده‌باش.',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // فردا
    durationMinutes: 30,
    status: 'approved',
    note: 'در دفتر معاونت برگزار خواهد شد. لطفاً فایل اکسل لوحه را به همراه داشته باشید.',
    meetingType: 'in-person',
    priority: 'urgent',
    groupBooking: false,
    requester: { id: 'req-1', name: 'مهندس امین علوی (سوپروایزر خط ۱)' },
    targetManager: { id: 'mgr-1', name: 'جناب آقای عباسی (رئیس سیر و حرکت)' }
  },
  {
    id: 'meet-2',
    title: 'توجیه ایمنی راهبر جدید جهت اخذ صلاحیت فنی درب‌های سری ۳۰۰',
    description: 'بررسی انحرافات عملکرد راهبر در شبیه‌ساز کوئیز و بایکوت درب واگن.',
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    durationMinutes: 45,
    status: 'pending',
    note: null,
    meetingType: 'disciplinary',
    priority: 'normal',
    groupBooking: false,
    requester: { id: 'req-2', name: 'سهراب مرادی (راهبر پایه ۲)' },
    targetManager: { id: 'mgr-1', name: 'جناب آقای عباسی (رئیس سیر و حرکت)' }
  },
  {
    id: 'meet-3',
    title: 'صورت‌جلسه همفکری پیرامون زاویه نور سکوی ایستگاه شوش',
    description: 'جلسه آنلاین بررسی فنی تغییر زاویه تابش چراغ‌های ورودی جهت افزایش ایمنی دید.',
    scheduledAt: new Date(Date.now() - 172800000).toISOString(), // دیروز
    durationMinutes: 60,
    status: 'completed',
    note: 'جلسه با توافق کامل و تعریف اقدامات اصلاحی بسته شد.',
    meetingType: 'online',
    priority: 'urgent',
    groupBooking: true,
    minutes: {
      summary: 'طی بررسی فنی مشخص شد کوری موقت در ورودی ایستگاه شوش ناشی از توان بالای پروژکتورهای سقف است.',
      decisions: [
        'کاهش شدت تابش پروژکتور ورودی به نصف ظرفیت فعلی',
        'تغییر جهت فیزیکی چراغ‌ها به سمت بدنه واگن‌ها به جای زاویه مستقیم چشم راهبر'
      ],
      tasks: [
        { title: 'کاهش شدت نور چراغ ورودی شوش', assignee: 'تیم تاسیسات برق خط ۱' },
        { title: 'مانیتورینگ و گزارش وضعیت دید راهبران در شیفت بعد', assignee: 'سوپروایزر سیر و حرکت' }
      ]
    },
    requester: { id: 'req-3', name: 'امین سلیمانی (راهبر قطار)' },
    targetManager: { id: 'mgr-2', name: 'مهندس حسینی (مدیر تاسیسات)' }
  }
]

export default function MeetingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'inbox' | 'minutes'>('list')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [managers, setManagers] = useState<UserProfile[]>([])
  const [meetingTypes, setMeetingTypes] = useState<any[]>([])
  const [meetingRooms, setMeetingRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Form State — بخش ۱۱.۱ و ۱۱.۲
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetManagerId, setTargetManagerId] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('09:00')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [meetingType, setMeetingType] = useState<Meeting['meetingType']>('in-person')
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  const [groupBooking, setGroupBooking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // مدیریت اقدامات ادمین / سوپروایزر — بخش ۱۱.۳
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [altProposedDate, setAltProposedDate] = useState('')
  const [altProposedTime, setAltProposedTime] = useState('')
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'reschedule' | null>(null)

  // مستندسازی صورت‌جلسات — بخش ۱۱.۴
  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null)
  const [minutesSummary, setMinutesSummary] = useState('')
  const [minutesDecisions, setMinutesDecisions] = useState('')
  const [minutesTasks, setMinutesTasks] = useState<{ title: string; assignee: string }[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')

  const isManager = currentUser?.roleKey === 'super_admin' ||
                    currentUser?.roleKey === 'admin' ||
                    currentUser?.roleKey === 'manager' ||
                    currentUser?.roleKey === 'chief' ||
                    currentUser?.roleKey === 'supervisor'

  async function loadMeetings() {
    if (!accessToken) return
    setLoading(true)
    try {
      const url = isManager && activeTab === 'inbox' ? '/api/meetings?view=manager' : '/api/meetings?view=mine'
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setMeetings(json.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMeetingTypesAndRooms() {
    if (!accessToken) return
    try {
      const [resTypes, resRooms] = await Promise.all([
        fetch('/api/meetings/types', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/meetings/rooms', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      if (resTypes.ok) {
        const json = await resTypes.json()
        setMeetingTypes(json.data || [])
      }
      if (resRooms.ok) {
        const json = await resRooms.json()
        setMeetingRooms(json.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function loadManagers() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/users?pageSize=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const usersList: UserProfile[] = json.data?.users || []
        const filteredManagers = usersList.filter(u =>
          u.role.key === 'super_admin' ||
          u.role.key === 'admin' ||
          u.role.key === 'manager' ||
          u.role.key === 'chief' ||
          u.role.key === 'supervisor'
        )
        setManagers(filteredManagers)
        if (filteredManagers.length > 0) {
          setTargetManagerId(filteredManagers[0].id)
        }
      }
    } catch {
      // safe fallback
    }
  }

  useEffect(() => {
    void loadManagers()
    void loadMeetings()
    void loadMeetingTypesAndRooms()
  }, [accessToken, activeTab])

  // ثبت رزرو جلسه جدید — بخش ۱۱.۱
  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !meetingDate || !meetingTime) {
      alert('لطفاً فیلدهای الزامی را تکمیل کنید.')
      return
    }

    setSubmitting(true)
    const scheduledAt = `${meetingDate}T${meetingTime}:00`

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetManagerId,
          title,
          description: description.trim() || undefined,
          scheduledAt,
          durationMinutes,
          typeId: meetingTypes.find(t => t.key === meetingType)?.id,
          roomId: meetingRooms[0]?.id,
        }),
      })

      if (res.ok) {
        alert('درخواست ملاقات شما با موفقیت ثبت شد و در نوبت تایید قرار گرفت.')
        setTitle('')
        setDescription('')
        void loadMeetings()
        setActiveTab('list')
      } else {
        const json = await res.json()
        alert(json.error?.message || json.error || 'خطا در ثبت درخواست')
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  // گردش کار جلسه (تایید / رد / پیشنهاد زمان جایگزین) — بخش ۱۱.۳
  const handleReviewMeeting = async (meetingId: string, action: 'approved' | 'rejected' | 'rescheduled') => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          meetingId,
          status: action,
          note: reviewNote.trim() || (action === 'approved' ? 'تایید شد.' : 'رد شد.'),
        }),
      })

      if (res.ok) {
        alert('اقدام مدیریتی با موفقیت اعمال گردید.')
        setReviewNote('')
        setAltProposedDate('')
        setAltProposedTime('')
        setReviewAction(null)
        setReviewingId(null)
        void loadMeetings()
      } else {
        const json = await res.json()
        alert(json.error?.message || json.error || 'خطا در ثبت تغییرات')
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور')
    }
  }

  // مستندسازی صورت‌جلسه پس از پایان — بخش ۱۱.۴
  const handleSaveMinutes = () => {
    if (!minutesMeetingId || !minutesSummary) return
    setMeetings(prev =>
      prev.map(m => {
        if (m.id === minutesMeetingId) {
          return {
            ...m,
            status: 'completed',
            minutes: {
              summary: minutesSummary,
              decisions: minutesDecisions.split('\n').filter(d => d.trim()),
              tasks: minutesTasks
            }
          }
        }
        return m
      })
    )
    alert('صورت‌جلسه رسمی و تکالیف تعیین‌شده با موفقیت مستند و ثبت نهایی شد.')
    setMinutesMeetingId(null)
    setMinutesSummary('')
    setMinutesDecisions('')
    setMinutesTasks([])
  }

  const addMinutesTask = () => {
    if (!newTaskTitle || !newTaskAssignee) return
    setMinutesTasks(prev => [...prev, { title: newTaskTitle, assignee: newTaskAssignee }])
    setNewTaskTitle('')
    setNewTaskAssignee('')
  }

  const statusLabel: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    rescheduled: 'زمان پیشنهادی جایگزین',
    completed: 'پایان‌یافته و مستند شده'
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    approved: 'bg-success/15 text-success border-success/30',
    rejected: 'bg-critical/15 text-critical border-critical/30',
    rescheduled: 'bg-info/15 text-info border-info/30',
    completed: 'bg-accent/15 text-accent border-accent/30 font-bold'
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2 select-none">
            <Calendar className="size-6 text-accent animate-pulse" />
            سیستم رزرواسیون ملاقات و جلسات هماهنگی خط ۱
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            گردش کار رسمی درخواست جلسات حضوری، تلفنی و انضباطی با مدیریت سیر و حرکت
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "pb-2 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'list' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          ملاقات‌های من ({toFa(meetings.length)})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            "pb-2 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'new' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          رزرو جلسه جدید (بخش ۱۱.۱)
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "pb-2 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'inbox' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            کارتابل بررسی و تایید مدیریت ({toFa(meetings.filter(m => m.status === 'pending').length)})
          </button>
        )}
        <button
          onClick={() => setActiveTab('minutes')}
          className={cn(
            "pb-2 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'minutes' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          مستندات و تصمیمات جلسات (بخش ۱۱.۴)
        </button>
      </div>

      {/* Tab 1: Meetings List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">لیست ملاقات‌های تنظیم شده</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const typeCfg = TYPE_CONFIG[m.meetingType] || TYPE_CONFIG['in-person']
              const TypeIcon = typeCfg.icon

              return (
                <Card key={m.id} className="transition-all hover:border-accent/30 flex flex-col justify-between bg-surface-container-low">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className={cn('size-4', typeCfg.color)} />
                        <span className="text-xs font-black text-foreground">{m.title}</span>
                      </div>
                      <Badge variant="outline" className={cn('text-[9px] font-extrabold', statusColor[m.status])}>
                        {statusLabel[m.status]}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="mt-2 text-[11px] text-foreground-muted leading-relaxed font-bold">
                        {m.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-0 mt-auto">
                    <div className="border-t border-border/30 my-3" />
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-foreground-muted font-bold font-mono">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3 text-accent" />
                        {jalali(m.scheduledAt)}
                      </span>
                      <span>ساعت: {toFa(new Date(m.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</span>
                      <span>مدت: {toFa(m.durationMinutes)} دقیقه</span>
                    </div>

                    {/* Group booking indicator */}
                    {m.groupBooking && (
                      <div className="mt-2 text-[9px] bg-accent/10 border border-accent/20 text-accent p-1 rounded font-bold inline-block">
                        👥 جلسه گروهی پرسنل
                      </div>
                    )}

                    {m.alternativeTimeProposed && (
                      <div className="mt-2 bg-info/10 border border-info/20 text-info p-2 rounded text-[10px] font-bold">
                         پیشنهاد زمان جایگزین مدیر: {jalali(m.alternativeTimeProposed)}
                      </div>
                    )}

                    {m.note && (
                      <div className="mt-3.5 rounded bg-surface/55 border border-border/40 p-2.5 text-xs text-foreground font-bold">
                        <span className="text-accent text-[9px] block mb-1">یادداشت مدیر:</span>
                        {m.note}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: New Meeting Form */}
      {activeTab === 'new' && (
        <Card className="max-w-2xl bg-surface-container-low border-border/50">
          <CardHeader>
            <CardTitle className="text-xs font-black">رزرو وقت ملاقات جدید</CardTitle>
            <CardDescription className="text-[10px]">درخواست برگزاری جلسه را با مدیران خط ۱ ارسال فرمایید. (قوانین زمان تنفس و اولویت‌دهی هوشمند اعمال می‌گردد)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBookMeeting} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px]">موضوع جلسه <span className="text-critical">*</span></Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: هماهنگی تایید تعویض شیفت"
                    className="bg-neutral-950/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">مخاطب جلسه <span className="text-critical">*</span></Label>
                  <select
                    value={targetManagerId}
                    onChange={(e) => setTargetManagerId(e.target.value)}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                    required
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Types of meeting selection — بخش ۱۱.۲ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px]">نوع ملاقات (بخش ۱۱.۲):</Label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as any)}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="in-person">حضوری (دفتر کار)</option>
                    <option value="phone">تلفنی</option>
                    <option value="online">آنلاین (فرستنده تصویر)</option>
                    <option value="emergency">جلسه اضطراری 🚨</option>
                    <option value="confidential">محرمانه 🔐</option>
                    <option value="disciplinary">انضباطی</option>
                    <option value="training">آموزشی</option>
                    <option value="suggestion-review">بررسی پیشنهاد</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">اولویت زمانی:</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری و اضطراری</option>
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-neutral-950/20 cursor-pointer w-full justify-between select-none">
                    <span>ثبت به عنوان جلسه گروهی:</span>
                    <input
                      type="checkbox"
                      checked={groupBooking}
                      onChange={(e) => setGroupBooking(e.target.checked)}
                      className="size-4"
                    />
                  </label>
                </div>
              </div>

              {/* Date, Time & Buffer Limits — بخش ۱۱.۱ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px]">تاریخ پیشنهادی:</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">ساعت برگزاری:</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">مدت جلسه (دقیقه):</Label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value={15}>۱۵ دقیقه</option>
                    <option value={30}>۳۰ دقیقه (پیش‌فرض)</option>
                    <option value={45}>۴۵ دقیقه</option>
                    <option value={60}>۶۰ دقیقه</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">شرح موضوع و ضرورت برگزاری:</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="دلایل لزوم برگزاری ملاقات را شرح دهید..."
                  rows={4}
                  className="w-full bg-neutral-950/40 border border-border rounded-lg p-3 outline-none focus:border-accent text-xs resize-none"
                />
              </div>

              {/* Buffer Warning */}
              <div className="bg-neutral-950/30 border border-border/40 p-2.5 rounded text-[10px] text-foreground-muted font-normal flex items-start gap-1">
                <Info className="size-4 shrink-0 mt-0.5 text-accent" />
                <span>بر اساس آیین‌نامه، به منظور کارایی تقویم، بین جلسات ادمین‌ها حداقل ۱۵ دقیقه زمان تنفس (Buffer Time) لحاظ شده است.</span>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting} className="bg-accent hover:bg-accent-hover text-white text-xs cursor-pointer">
                  {submitting ? 'در حال ثبت...' : 'ارسال درخواست جلسه هماهنگی'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Manager Inbox */}
      {activeTab === 'inbox' && isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List pending */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-foreground">پرونده‌های ملاقات معلق</h4>

            {meetings.filter(m => m.status === 'pending').length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low border border-border/30 rounded-lg text-foreground-muted text-xs">
                درخواست جلسه‌ای در انتظار تایید شما نیست.
              </div>
            ) : (
              meetings.filter(m => m.status === 'pending').map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setReviewingId(item.id)
                    setReviewAction(null)
                  }}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition text-right space-y-1.5',
                    reviewingId === item.id ? 'bg-accent/15 border-accent' : 'bg-surface-container-low border-border hover:border-accent/40'
                  )}
                >
                  <div className="flex justify-between items-center text-[9px] text-foreground-muted">
                    <span>{jalali(item.scheduledAt)}</span>
                    <span className="text-critical">{item.priority === 'urgent' ? 'فوری' : 'عادی'}</span>
                  </div>
                  <h5 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h5>
                  <span className="text-[9px] text-foreground-muted font-bold block">درخواست‌دهنده: {item.requester?.name}</span>
                </div>
              ))
            )}
          </div>

          {/* Form details & Action Conversion — بخش ۱۱.۳ */}
          <div className="lg:col-span-2">
            {reviewingId && meetings.find(m => m.id === reviewingId) ? (
              (() => {
                const item = meetings.find(m => m.id === reviewingId)!
                return (
                  <Card className="bg-surface-container-low border border-accent/25">
                    <CardHeader className="pb-3 border-b border-border/30">
                      <CardTitle className="text-xs font-black">{item.title}</CardTitle>
                      <CardDescription className="text-[9px]">درخواست‌دهنده: {item.requester?.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 text-xs">
                      <p className="p-3 bg-neutral-950/20 border border-border/40 rounded-lg font-bold">
                        {item.description || 'توضیحی ثبت نشده است.'}
                      </p>

                      {reviewAction === null ? (
                        <div className="flex gap-2 justify-end pt-2 border-t border-border/20">
                          <Button
                            variant="outline"
                            className="text-xs border-success/30 text-success hover:bg-success/5 cursor-pointer"
                            onClick={() => setReviewAction('approved')}
                          >
                            تایید ملاقات
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs border-info/30 text-info hover:bg-info/5 cursor-pointer"
                            onClick={() => setReviewAction('reschedule')}
                          >
                            پیشنهاد زمان جایگزین
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs border-critical/30 text-critical hover:bg-critical/5 cursor-pointer"
                            onClick={() => setReviewAction('rejected')}
                          >
                            رد درخواست
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-3 border-t border-border/20">
                          <h4 className="font-bold text-accent">
                            {reviewAction === 'approved' ? 'تایید و تثبیت ملاقات' : reviewAction === 'rejected' ? 'رد درخواست ملاقات' : 'پیشنهاد زمان جایگزین'}
                          </h4>

                          {reviewAction === 'reschedule' && (
                            <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-950/20 border border-border/50 rounded-xl">
                              <div className="space-y-1">
                                <label className="font-bold text-[10px] text-foreground-muted block">تاریخ جایگزین:</label>
                                <Input
                                  type="date"
                                  value={altProposedDate}
                                  onChange={(e) => setAltProposedDate(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-[10px] text-foreground-muted block">ساعت جایگزین:</label>
                                <Input
                                  type="time"
                                  value={altProposedTime}
                                  onChange={(e) => setAltProposedTime(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1 font-bold">
                            <label className="text-[10px] text-foreground-muted block">یادداشت برای پرسنل:</label>
                            <Input
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="توضیحات و ملزومات جلسه..."
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="xs" onClick={() => setReviewAction(null)}>
                              بازگشت
                            </Button>
                            <Button
                              size="xs"
                              className="bg-accent hover:bg-accent-hover text-white font-bold cursor-pointer"
                              onClick={() => handleReviewMeeting(item.id, reviewAction === 'reschedule' ? 'rescheduled' : reviewAction)}
                            >
                              ثبت نهایی تصمیم
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()
            ) : (
              <div className="h-full flex items-center justify-center p-8 border border-dashed border-border rounded-lg text-foreground-muted text-xs select-none">
                💡 درخواستی را جهت بازخوانی گردش کار انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Minutes & Decisions */}
      {activeTab === 'minutes' && (
        <div className="space-y-6">
          {/* Form to log minutes */}
          {isManager && (
            <Card className="bg-surface-container-low border-border/50">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-xs font-black">ثبت صورت‌جلسه و تکالیف اجرایی (بخش ۱۱.۴)</CardTitle>
                <CardDescription className="text-[10px]">ثبت تصمیمات رسمی اتخاذ شده در ملاقات و انتساب اقدامات اصلاحی به پرسنل.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs font-bold space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px]">انتخاب ملاقات انجام شده:</label>
                  <select
                    value={minutesMeetingId || ''}
                    onChange={(e) => setMinutesMeetingId(e.target.value || null)}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="">انتخاب کنید...</option>
                    {meetings.filter(m => m.status === 'approved').map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.requester?.name})</option>
                    ))}
                  </select>
                </div>

                {minutesMeetingId && (
                  <div className="space-y-4 border-t border-border/20 pt-3 animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px]">خلاصه و نتایج جلسه:</label>
                      <textarea
                        value={minutesSummary}
                        onChange={(e) => setMinutesSummary(e.target.value)}
                        placeholder="شرح کوتاه نتایج گفتگو..."
                        rows={3}
                        className="w-full bg-neutral-950/40 border border-border rounded-lg p-2.5 outline-none focus:border-accent text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px]">تصمیمات اتخاذ شده (هر خط یک تصمیم):</label>
                      <textarea
                        value={minutesDecisions}
                        onChange={(e) => setMinutesDecisions(e.target.value)}
                        placeholder="تصمیم اول&#10;تصمیم دوم..."
                        rows={3}
                        className="w-full bg-neutral-950/40 border border-border rounded-lg p-2.5 outline-none focus:border-accent text-xs resize-none font-sans"
                      />
                    </div>

                    {/* Actions and tasks assignment */}
                    <div className="space-y-2 border-t border-border/20 pt-3">
                      <label className="text-[11px] text-accent block">تعریف اقدامات و مسئول مربوطه:</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="عنوان کار روزانه..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="bg-neutral-950/40 h-9"
                        />
                        <Input
                          placeholder="مسئول اقدام..."
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className="bg-neutral-950/40 h-9 w-44"
                        />
                        <Button type="button" size="sm" onClick={addMinutesTask} className="h-9 shrink-0 cursor-pointer">
                          <Plus className="size-4" />
                        </Button>
                      </div>

                      {/* Display added tasks */}
                      {minutesTasks.length > 0 && (
                        <div className="bg-neutral-950/30 p-2.5 rounded border border-border/40 space-y-1.5 mt-2">
                          {minutesTasks.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] bg-neutral-900 p-1.5 rounded">
                              <span>عنوان: {t.title}</span>
                              <span className="text-accent">مسئول: {t.assignee}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
                      <Button variant="ghost" size="xs" onClick={() => setMinutesMeetingId(null)}>انصراف</Button>
                      <Button size="xs" onClick={handleSaveMinutes} className="bg-accent text-white cursor-pointer">ذخیره و اتمام پرونده</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Archive minutes list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground">آرشیو تصمیمات و صورت‌جلسات رسمی</h4>
            
            {meetings.filter(m => m.status === 'completed' && m.minutes).map(item => (
              <Card key={item.id} className="bg-surface-container-low border border-success/20">
                <CardHeader className="pb-2 border-b border-border/20 p-4">
                  <CardTitle className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <FileCheck className="size-4 text-success" />
                    <span>خلاصه و صورت‌جلسه: {item.title}</span>
                  </CardTitle>
                  <span className="text-[9px] text-foreground-muted mt-1 block">مخاطب جلسه: {item.targetManager?.name} | تاریخ: {jalali(item.scheduledAt)}</span>
                </CardHeader>
                <CardContent className="p-4 text-xs font-bold space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-foreground-muted block">خلاصه مذاکرات:</span>
                    <p className="text-foreground leading-relaxed p-2.5 bg-neutral-950/20 rounded border border-border/40">{item.minutes?.summary}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-foreground-muted block">تصمیمات رسمی اتخاذ شده:</span>
                    <ul className="list-disc list-inside space-y-1 text-foreground-muted">
                      {item.minutes?.decisions.map((d, idx) => (
                        <li key={idx} className="ps-2">{d}</li>
                      ))}
                    </ul>
                  </div>

                  {item.minutes?.tasks && item.minutes.tasks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-accent block">اقدامات و مسئولین اجرا (تکالیف):</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.minutes.tasks.map((task, idx) => (
                          <div key={idx} className="bg-neutral-900 border border-border/40 p-2 rounded flex justify-between items-center text-[10px]">
                            <span>🎯 {task.title}</span>
                            <span className="text-accent font-semibold">{task.assignee}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
