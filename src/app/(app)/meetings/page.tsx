'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { jdate } from '@/lib/dayjs'
import { toFa, jalali, faTime } from '@/lib/fa'
import { cn } from '@/lib/utils'
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
  ShieldAlert,
  GraduationCap,
  Phone,
  Video,
  FileSpreadsheet,
  Check,
  CalendarDays,
  Lightbulb,
  Info,
  FileCheck,
  MapPin,
  Users,
  Search,
  Printer,
  Trash2,
  Sliders,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

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
  meetingType: { id: string; key: string; title: string } | null
  roomId: string | null
  cancelReason: string | null
  rescheduleOf: string | null
  outcomeNote: string | null
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
  room?: { id: string; name: string } | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  'public_visit': { label: 'ملاقات مردمی', icon: User, color: 'text-sky-400 border-sky-400/20', bg: 'bg-sky-500/10' },
  'technical': { label: 'جلسه فنی', icon: Sliders, color: 'text-emerald-400 border-emerald-400/20', bg: 'bg-emerald-500/10' },
  'online': { label: 'جلسه آنلاین', icon: Video, color: 'text-violet-400 border-violet-400/20', bg: 'bg-violet-500/10' },
  'emergency': { label: 'جلسه اضطراری', icon: ShieldAlert, color: 'text-rose-400 border-rose-400/20', bg: 'bg-rose-500/10' },
  'phone': { label: 'تماس تلفنی', icon: Phone, color: 'text-amber-400 border-amber-400/20', bg: 'bg-amber-500/10' },
  'disciplinary': { label: 'جلسه انضباطی', icon: XCircle, color: 'text-red-400 border-red-400/20', bg: 'bg-red-500/10' },
  'training': { label: 'جلسه آموزشی', icon: GraduationCap, color: 'text-teal-400 border-teal-400/20', bg: 'bg-teal-500/10' },
}

export default function MeetingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'list' | 'new' | 'inbox' | 'minutes' | 'admin'>('list')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [managers, setManagers] = useState<UserProfile[]>([])
  const [meetingTypes, setMeetingTypes] = useState<any[]>([])
  const [meetingRooms, setMeetingRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Booking Form State
  const [selectedType, setSelectedType] = useState<any>(null)
  const [selectedHostId, setSelectedHostId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({})
  const [attendeesInput, setAttendeesInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Date & Slot states for booking
  const nowCalendar = jdate()
  const [currentMonth, setCurrentMonth] = useState(() => nowCalendar.month() + 1)
  const [currentYear, setCurrentYear] = useState(() => nowCalendar.year())
  const [selectedDateStr, setSelectedDateStr] = useState('')
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([])
  const [selectedSlotTime, setSelectedSlotTime] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Manager Review Inbox
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'reschedule' | null>(null)
  const [altProposedDate, setAltProposedDate] = useState('')
  const [altProposedTime, setAltProposedTime] = useState('')

  // Outcome Minutes
  const [minutesMeetingId, setMinutesMeetingId] = useState<string | null>(null)
  const [minutesOutcomeNote, setMinutesOutcomeNote] = useState('')

  // Admin Console States
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'types' | 'rooms' | 'availability' | 'reports'>('dashboard')
  const [reports, setReports] = useState<any>({ meetings: [], stats: { total: 0, approved: 0, pending: 0, completed: 0, rescheduled: 0, cancelled: 0, cancelRate: 0, hostLoads: [] } })
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportTypeFilter, setReportTypeFilter] = useState('')
  const [reportFromFilter, setReportFromFilter] = useState('')
  const [reportToFilter, setReportToFilter] = useState('')

  // Admin CRUD temp forms
  const [editingType, setEditingType] = useState<any>(null)
  const [editingRoom, setEditingRoom] = useState<any>(null)

  // Visual Availability Editor
  const [selectedAvailHost, setSelectedAvailHost] = useState('')
  const [availRules, setAvailRules] = useState<any[]>([])
  const [availExceptions, setAvailExceptions] = useState<any[]>([])
  const [newRuleWeekday, setNewRuleWeekday] = useState(0)
  const [newRuleFrom, setNewRuleFrom] = useState('09:00')
  const [newRuleTo, setNewRuleTo] = useState('12:00')
  const [newExceptionDate, setNewExceptionDate] = useState('')
  const [newExceptionReason, setNewExceptionReason] = useState('')

  const isManager = currentUser?.roleKey === 'super_admin' ||
                    currentUser?.roleKey === 'admin' ||
                    currentUser?.roleKey === 'manager' ||
                    currentUser?.roleKey === 'chief' ||
                    currentUser?.roleKey === 'supervisor'

  const isAdmin = currentUser?.roleKey === 'admin' || currentUser?.roleKey === 'super_admin'

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
        if (json.data?.length > 0 && !selectedType) {
          setSelectedType(json.data[0])
        }
      }
      if (resRooms.ok) {
        const json = await resRooms.json()
        setMeetingRooms(json.data || [])
        if (json.data?.length > 0) {
          setSelectedRoomId(json.data[0].id)
        }
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
          setSelectedHostId(filteredManagers[0].id)
          setSelectedAvailHost(filteredManagers[0].id)
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

  // Fetch Slots
  async function loadSlots(dateStr: string, hostId: string, typeKey: string, roomId?: string) {
    if (!accessToken || !dateStr || !hostId || !typeKey) return
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({
        hostId,
        date: dateStr,
        typeKey,
      })
      if (roomId) params.append('roomId', roomId)

      const res = await fetch(`/api/meetings/slots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSlots(json.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDateStr && selectedHostId && selectedType) {
      void loadSlots(selectedDateStr, selectedHostId, selectedType.key, selectedType.needsRoom ? selectedRoomId : undefined)
    }
  }, [selectedDateStr, selectedHostId, selectedType, selectedRoomId])

  // Book Meeting Action
  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedDateStr || !selectedSlotTime || !selectedHostId || !selectedType) {
      alert('لطفاً موضوع، تاریخ و ساعت را انتخاب کنید.')
      return
    }

    setSubmitting(true)
    const scheduledAt = `${selectedDateStr}T${selectedSlotTime}:00`
    const attendees = attendeesInput.split(',').map(s => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetManagerId: selectedHostId,
          title,
          description: description.trim() || undefined,
          scheduledAt,
          durationMinutes: selectedType.durationMin,
          typeId: selectedType.id,
          roomId: selectedType.needsRoom ? selectedRoomId : undefined,
          formData: dynamicFields,
          attendees,
        }),
      })

      if (res.ok) {
        alert('جلسه با موفقیت ثبت گردید.')
        setTitle('')
        setDescription('')
        setDynamicFields({})
        setAttendeesInput('')
        setSelectedSlotTime('')
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

  // Review Meeting Action
  const handleReviewMeeting = async (meetingId: string, action: 'approved' | 'rejected' | 'rescheduled') => {
    try {
      let res
      if (action === 'rescheduled') {
        if (!altProposedDate || !altProposedTime) {
          alert('لطفاً تاریخ و ساعت جدید را وارد کنید.')
          return
        }
        res = await fetch(`/api/meetings/${meetingId}/reschedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            newSlot: `${altProposedDate}T${altProposedTime}:00`,
          }),
        })
      } else {
        res = await fetch('/api/meetings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            meetingId,
            status: action,
            note: reviewNote.trim() || (action === 'approved' ? 'تایید شد' : 'رد شد'),
          }),
        })
      }

      if (res.ok) {
        alert('اقدام با موفقیت اعمال گردید.')
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

  // Cancel Meeting Action
  const handleCancelMeeting = async (meetingId: string) => {
    const reason = prompt('لطفاً علت لغو جلسه را وارد نمایید:')
    if (reason === null) return
    if (!reason.trim()) {
      alert('وارد کردن علت لغو الزامی است.')
      return
    }

    try {
      const res = await fetch(`/api/meetings/${meetingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        alert('جلسه با موفقیت لغو شد.')
        void loadMeetings()
      } else {
        const json = await res.json()
        alert(json.error?.message || json.error || 'خطا در لغو جلسه')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  // Save Outcome Minutes Action
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!minutesMeetingId || !minutesOutcomeNote.trim()) {
      alert('لطفاً جلسه و متن صورت‌جلسه را پر کنید.')
      return
    }

    try {
      const res = await fetch(`/api/meetings/${minutesMeetingId}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ outcomeNote: minutesOutcomeNote }),
      })

      if (res.ok) {
        alert('صورت‌جلسه با موفقیت ثبت گردید.')
        setMinutesMeetingId(null)
        setMinutesOutcomeNote('')
        void loadMeetings()
      } else {
        const json = await res.json()
        alert(json.error?.message || json.error || 'خطا در ثبت صورت‌جلسه')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  // Admin Reports loader
  async function loadReports() {
    if (!accessToken) return
    setReportsLoading(true)
    try {
      const params = new URLSearchParams()
      if (reportTypeFilter) params.append('typeId', reportTypeFilter)
      if (reportFromFilter) params.append('from', reportFromFilter)
      if (reportToFilter) params.append('to', reportToFilter)

      const res = await fetch(`/api/admin/meetings/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setReports(json.data || reports)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'admin' && adminSubTab === 'reports') {
      void loadReports()
    }
  }, [activeTab, adminSubTab, reportTypeFilter, reportFromFilter, reportToFilter])

  // Load Availability for Admin Visual Editor
  async function loadAvailability(hostId: string) {
    if (!accessToken || !hostId) return
    try {
      const res = await fetch(`/api/admin/meetings/availability?ownerKey=${hostId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAvailRules(json.data?.rules || [])
        setAvailExceptions(json.data?.exceptions || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (selectedAvailHost && activeTab === 'admin' && adminSubTab === 'availability') {
      void loadAvailability(selectedAvailHost)
    }
  }, [selectedAvailHost, activeTab, adminSubTab])

  // Add Availability Rule Action
  const handleAddRule = async () => {
    try {
      const res = await fetch('/api/admin/meetings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ownerType: 'user',
          ownerKey: selectedAvailHost,
          weekday: newRuleWeekday,
          fromTime: newRuleFrom,
          toTime: newRuleTo,
        }),
      })
      if (res.ok) {
        void loadAvailability(selectedAvailHost)
      } else {
        alert('خطا در ذخیره قانون زمان حضور')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  // Delete Availability Rule
  const handleDeleteRule = async (id: string, type: 'rule' | 'exception') => {
    if (!confirm('آیا از حذف این مورد مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/admin/meetings/availability?id=${id}&type=${type}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        void loadAvailability(selectedAvailHost)
      }
    } catch {
      // ignore
    }
  }

  // Add Availability Exception Action
  const handleAddException = async () => {
    if (!newExceptionDate) {
      alert('لطفاً تاریخ استثنا را مشخص کنید.')
      return
    }
    try {
      const res = await fetch('/api/admin/meetings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ownerType: 'user',
          ownerKey: selectedAvailHost,
          date: newExceptionDate,
          reason: newExceptionReason,
        }),
      })
      if (res.ok) {
        setNewExceptionDate('')
        setNewExceptionReason('')
        void loadAvailability(selectedAvailHost)
      } else {
        alert('خطا در ذخیره استثنا')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  // Admin MeetingType CRUD actions
  const handleSaveMeetingType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingType?.key || !editingType?.title) return
    try {
      const isNew = !editingType.id
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch('/api/admin/meetings/types', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editingType),
      })
      if (res.ok) {
        alert('نوع جلسه با موفقیت ذخیره شد.')
        setEditingType(null)
        void loadMeetingTypesAndRooms()
      } else {
        alert('خطا در ذخیره‌سازی نوع جلسه')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  const handleDeleteMeetingType = async (id: string) => {
    if (!confirm('آیا از حذف این نوع جلسه اطمینان دارید؟ (غیرفعال‌سازی منطقی)')) return
    try {
      const res = await fetch(`/api/admin/meetings/types?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        void loadMeetingTypesAndRooms()
      }
    } catch {
      // ignore
    }
  }

  // Admin MeetingRoom CRUD actions
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRoom?.name) return
    try {
      const isNew = !editingRoom.id
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch('/api/admin/meetings/rooms', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editingRoom),
      })
      if (res.ok) {
        alert('اتاق با موفقیت ذخیره شد.')
        setEditingRoom(null)
        void loadMeetingTypesAndRooms()
      } else {
        alert('خطا در ذخیره‌سازی اتاق')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('آیا از حذف این اتاق اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/admin/meetings/rooms?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        void loadMeetingTypesAndRooms()
      }
    } catch {
      // ignore
    }
  }

  // Jalali Calendar date generation
  const firstDay = jdate()
    .year(currentYear)
    .month(currentMonth - 1)
    .date(1)
  const daysInMonth = firstDay.daysInMonth()
  const startWeekday = firstDay.day()

  const today = jdate()
  const todayStr = today.format('YYYY-MM-DD')

  const calendarDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = firstDay.date(d)
    const dateStr = dateObj.format('YYYY-MM-DD')
    calendarDays.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      isFriday: dateObj.day() === 5,
    })
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDateStr('')
    setSelectedSlotTime('')
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDateStr('')
    setSelectedSlotTime('')
  }

  const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

  const statusLabel: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده/لغو شده',
    rescheduled: 'زمان پیشنهادی جایگزین',
    completed: 'پایان‌یافته و مستند شده'
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    rescheduled: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    completed: 'bg-violet-500/10 text-violet-400 border-violet-500/20 font-bold'
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 select-none">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2">
            <Calendar className="size-6 text-red-500 animate-pulse" />
            سیستم جامع رزرواسیون ملاقات و جلسات هماهنگی خط ۱
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            گردش کار رسمی درخواست جلسات حضوری، تلفنی و انضباطی با مدیریت و سرشیفت‌های محترم خط ۱ مترو تهران
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "pb-2 px-4 border-b-2 transition-all cursor-pointer",
            activeTab === 'list' ? "border-red-500 text-red-400 font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          ملاقات‌های من ({toFa(meetings.length)})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={cn(
            "pb-2 px-4 border-b-2 transition-all cursor-pointer",
            activeTab === 'new' ? "border-red-500 text-red-400 font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          رزرو جلسه جدید
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab('inbox')}
            className={cn(
              "pb-2 px-4 border-b-2 transition-all cursor-pointer",
              activeTab === 'inbox' ? "border-red-500 text-red-400 font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            کارتابل تایید مدیریت ({toFa(meetings.filter(m => m.status === 'pending').length)})
          </button>
        )}
        <button
          onClick={() => {
            setActiveTab('minutes')
            setMinutesMeetingId(null)
          }}
          className={cn(
            "pb-2 px-4 border-b-2 transition-all cursor-pointer",
            activeTab === 'minutes' ? "border-red-500 text-red-400 font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          ثبت صورت‌جلسه
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              setActiveTab('admin')
              setAdminSubTab('dashboard')
            }}
            className={cn(
              "pb-2 px-4 border-b-2 transition-all cursor-pointer",
              activeTab === 'admin' ? "border-red-500 text-red-400 font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            پنل ادمین
          </button>
        )}
      </div>

      {/* Tab 1: Meetings List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">لیست ملاقات‌های تنظیم شده</h4>
          </div>

          {loading ? (
            <div className="text-center py-10 text-foreground-muted text-xs">در حال بارگذاری اطلاعات...</div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low/40 border border-dashed border-border rounded-xl text-foreground-muted text-xs select-none">
              ملاقات یا جلسه‌ای در سیستم برای شما یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((m) => {
                const typeCfg = TYPE_CONFIG[m.meetingType?.key || 'public_visit'] || TYPE_CONFIG['public_visit']
                const TypeIcon = typeCfg.icon

                return (
                  <Card key={m.id} className="transition-all hover:border-red-500/30 flex flex-col justify-between bg-surface-container-low/80 backdrop-blur-md">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded-lg border', typeCfg.color, typeCfg.bg)}>
                            <TypeIcon className="size-4" />
                          </div>
                          <span className="text-xs font-black text-foreground">{m.title}</span>
                        </div>
                        <Badge variant="outline" className={cn('text-[9px] font-extrabold', statusColor[m.status])}>
                          {statusLabel[m.status]}
                        </Badge>
                      </div>
                      {m.description && (
                        <p className="mt-3 text-[11px] text-foreground-muted leading-relaxed font-semibold">
                          {m.description}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="p-4 pt-0 mt-auto">
                      <div className="border-t border-border/30 my-3" />
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-foreground-muted font-bold">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3 text-red-400" />
                          {jalali(m.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-red-400" />
                          ساعت: {toFa(new Date(m.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))} ({toFa(m.durationMinutes)} دقیقه)
                        </span>
                        <span className="flex items-center gap-1 col-span-2">
                          <User className="size-3 text-red-400" />
                          درخواست‌دهنده: {m.requester?.name} | میزبان: {m.targetManager?.name}
                        </span>
                        {m.room && (
                          <span className="flex items-center gap-1 col-span-2 text-red-300">
                            <MapPin className="size-3" />
                            اتاق: {m.room.name}
                          </span>
                        )}
                      </div>

                      {m.cancelReason && (
                        <div className="mt-3 rounded-lg bg-red-950/20 border border-red-900/40 p-2.5 text-[10px] text-red-300 font-bold">
                          <span className="block mb-0.5 text-red-400">علت لغو:</span>
                          {m.cancelReason}
                        </div>
                      )}

                      {m.outcomeNote && (
                        <div className="mt-3 rounded-lg bg-violet-950/20 border border-violet-900/40 p-2.5 text-[10px] text-violet-300 font-bold">
                          <span className="block mb-0.5 text-violet-400">صورت‌جلسه / خروجی:</span>
                          {m.outcomeNote}
                        </div>
                      )}

                      {m.note && !m.cancelReason && (
                        <div className="mt-3.5 rounded-lg bg-neutral-900/60 border border-border/40 p-2.5 text-xs text-foreground font-semibold">
                          <span className="text-red-400 text-[10px] block mb-1">یادداشت میزبان:</span>
                          {m.note}
                        </div>
                      )}

                      {m.status !== 'rejected' && m.status !== 'completed' && !m.cancelReason && (
                        <div className="flex gap-2 justify-end mt-4">
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-xs border-red-900 text-red-400 hover:bg-red-900/10 cursor-pointer"
                            onClick={() => handleCancelMeeting(m.id)}
                          >
                            لغو جلسه
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: New Meeting Form */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-surface-container-low/80 backdrop-blur-md border-border/40">
              <CardHeader>
                <CardTitle className="text-xs font-black">رزرو وقت ملاقات جدید</CardTitle>
                <CardDescription className="text-[10px]">نوع جلسه و میزبان خود را انتخاب کرده و اسلات زمانی آزاد را تعیین کنید.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookMeeting} className="space-y-4 text-xs font-bold">
                  {/* Select Type */}
                  <div className="space-y-2">
                    <Label className="text-[11px]">نوع ملاقات:</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {meetingTypes.map(t => {
                        const isSelected = selectedType?.id === t.id
                        const cfg = TYPE_CONFIG[t.key] || TYPE_CONFIG['public_visit']
                        const Icon = cfg.icon

                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedType(t)
                              setSelectedSlotTime('')
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-right cursor-pointer transition-all flex flex-col justify-between min-h-[5.5rem]",
                              isSelected ? "border-red-500 bg-red-500/10" : "border-border/40 bg-neutral-900/40 hover:border-red-500/30"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className="size-5 text-red-400" />
                              <Badge className="text-[8px] bg-red-900/30 text-red-400">{toFa(t.durationMin)} دقیقه</Badge>
                            </div>
                            <span className="text-[11px] font-black text-foreground mt-2 block">{t.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[11px]">موضوع جلسه <span className="text-red-500">*</span></Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: هماهنگی تایید تعویض شیفت"
                        className="bg-neutral-950/40"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">مخاطب جلسه (میزبان) <span className="text-red-500">*</span></Label>
                      {selectedType?.hostMode === 'role' ? (
                        <div className="p-3 bg-neutral-950/30 border border-border/40 rounded-lg text-red-300 text-xs flex justify-between items-center">
                          <span>میزبان نقشی: دارندگان نقش ({selectedType.hostRoleKey})</span>
                          <Badge variant="outline" className="border-red-500/30 text-red-400 font-extrabold">انتخاب خودکار</Badge>
                        </div>
                      ) : (
                        <select
                          value={selectedHostId}
                          onChange={(e) => {
                            setSelectedHostId(e.target.value)
                            setSelectedSlotTime('')
                          }}
                          className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs focus:outline-none focus:border-red-500 font-bold"
                          required
                        >
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role.name})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {selectedType?.needsRoom && (
                    <div className="space-y-1">
                      <Label className="text-[11px]">اتاق جلسه:</Label>
                      <select
                        value={selectedRoomId}
                        onChange={(e) => {
                          setSelectedRoomId(e.target.value)
                          setSelectedSlotTime('')
                        }}
                        className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs focus:outline-none focus:border-red-500 font-bold"
                      >
                        {meetingRooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} - ظرفیت: {toFa(r.capacity)} نفر ({r.location})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Render Dynamic Form Fields */}
                  {selectedType?.fields && (
                    <div className="space-y-2 border-t border-border/20 pt-3">
                      <Label className="text-[11px] text-red-400">اطلاعات تکمیلی جلسه:</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {(selectedType.fields as any[]).map((f) => (
                          <div key={f.name} className="space-y-1">
                            <Label className="text-[11px]">{f.label} {f.required && <span className="text-red-500">*</span>}</Label>
                            <Input
                              value={dynamicFields[f.name] || ''}
                              onChange={(e) => setDynamicFields(prev => ({ ...prev, [f.name]: e.target.value }))}
                              placeholder={f.label}
                              className="bg-neutral-950/40"
                              required={f.required}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-[11px]">اسامی سایر شرکت‌کنندگان (جدا شده با کاما - اختیاری):</Label>
                    <Input
                      value={attendeesInput}
                      onChange={(e) => setAttendeesInput(e.target.value)}
                      placeholder="احمدی, علوی, صادقی"
                      className="bg-neutral-950/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">شرح موضوع و ضرورت برگزاری:</Label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="دلایل لزوم برگزاری ملاقات را شرح دهید..."
                      rows={3}
                      className="w-full bg-neutral-950/40 border border-border rounded-lg p-3 outline-none focus:border-red-500 text-xs resize-none font-bold"
                    />
                  </div>

                  {selectedSlotTime && (
                    <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg text-emerald-300 text-xs flex justify-between items-center">
                      <span>زمان انتخاب شده: {jalali(selectedDateStr)} ساعت {toFa(selectedSlotTime)}</span>
                      <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white font-extrabold cursor-pointer">
                        {submitting ? 'در حال ثبت...' : 'تایید نهایی و ثبت رزرو'}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Slots & Calendar Picker Column */}
          <div className="space-y-6">
            <Card className="bg-surface-container-low/80 border-border/40 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-xs font-black">انتخاب تاریخ و بازه زمانی</CardTitle>
                <CardDescription className="text-[9px]">ابتدا روز برگزاری و سپس یکی از بازه‌های سبز رنگ را انتخاب کنید.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Month Selector */}
                <div className="flex items-center justify-between select-none">
                  <h3 className="font-bold text-[11px] text-foreground">
                    {toFa(firstDay.format('MMMM YYYY'))}
                  </h3>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon-sm" onClick={prevMonth}>
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={nextMonth}>
                      <ChevronLeft className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {weekdays.map((wd, i) => (
                    <div key={wd} className={cn('p-1 font-bold', i === 6 ? 'text-red-500' : 'text-foreground-muted')}>
                      {wd}
                    </div>
                  ))}

                  {Array.from({ length: startWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {calendarDays.map(({ day, dateStr, isToday, isFriday }) => {
                    const isSelected = selectedDateStr === dateStr
                    return (
                      <div
                        key={day}
                        onClick={() => {
                          setSelectedDateStr(dateStr)
                          setSelectedSlotTime('')
                        }}
                        className={cn(
                          'p-2 rounded-lg border text-center cursor-pointer transition font-bold font-mono',
                          isToday ? 'border-red-500/50 bg-red-500/5' : 'border-border/20',
                          isFriday ? 'text-red-400' : '',
                          isSelected ? 'bg-red-500 text-white border-red-500' : 'hover:bg-neutral-850'
                        )}
                      >
                        {toFa(day)}
                      </div>
                    )
                  })}
                </div>

                {/* Available Slots Display */}
                {selectedDateStr && (
                  <div className="space-y-2 border-t border-border/20 pt-4">
                    <h4 className="font-black text-[10px] text-foreground-muted">اسلات‌های زمانی روز {jalali(selectedDateStr)}:</h4>
                    {slotsLoading ? (
                      <div className="text-center py-4 text-xs text-foreground-muted">در حال بارگذاری اسلات‌ها...</div>
                    ) : slots.length === 0 ? (
                      <div className="text-center py-4 bg-neutral-950/20 rounded-lg text-foreground-muted text-[10px]">
                        هیچ ساعت حضوری برای این روز تعریف نشده است.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map(s => (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedSlotTime(s.time)}
                            title={s.reason}
                            className={cn(
                              "p-2 text-[11px] font-bold rounded-lg border transition font-mono relative group",
                              s.available
                                ? selectedSlotTime === s.time
                                  ? "bg-red-600 text-white border-red-600"
                                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-neutral-900 text-foreground-muted border-border/10 cursor-not-allowed opacity-50"
                            )}
                          >
                            {toFa(s.time)}
                            {!s.available && s.reason && (
                              <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 p-2 bg-neutral-950 text-white text-[9px] rounded shadow-lg border border-border/40 z-20 w-44 pointer-events-none">
                                {s.reason}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Manager Inbox */}
      {activeTab === 'inbox' && isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List pending */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-foreground">پرونده‌های ملاقات معلق</h4>

            {meetings.filter(m => m.status === 'pending').length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low border border-border/30 rounded-lg text-foreground-muted text-xs select-none">
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
                    reviewingId === item.id ? 'bg-red-500/10 border-red-500' : 'bg-surface-container-low border-border hover:border-red-500/30'
                  )}
                >
                  <div className="flex justify-between items-center text-[9px] text-foreground-muted font-bold font-mono">
                    <span>{jalali(item.scheduledAt)}</span>
                    <span className="text-red-400">ساعت: {toFa(new Date(item.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</span>
                  </div>
                  <h5 className="text-xs font-black text-foreground line-clamp-1">{item.title}</h5>
                  <span className="text-[9px] text-foreground-muted font-bold block">درخواست‌دهنده: {item.requester?.name}</span>
                </div>
              ))
            )}
          </div>

          {/* Form details & Action Conversion */}
          <div className="lg:col-span-2">
            {reviewingId && meetings.find(m => m.id === reviewingId) ? (
              (() => {
                const item = meetings.find(m => m.id === reviewingId)!
                return (
                  <Card className="bg-surface-container-low/80 backdrop-blur-md border border-red-500/20">
                    <CardHeader className="pb-3 border-b border-border/30">
                      <CardTitle className="text-xs font-black">{item.title}</CardTitle>
                      <CardDescription className="text-[9px]">درخواست‌دهنده: {item.requester?.name} | نوع جلسه: {item.meetingType?.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 text-xs font-bold">
                      <div className="p-3 bg-neutral-950/20 border border-border/40 rounded-lg space-y-2">
                        <span className="text-red-400 text-[10px] block">توضیحات درخواست:</span>
                        <p className="font-semibold text-foreground leading-relaxed">{item.description || 'توضیحی ثبت نشده است.'}</p>
                      </div>

                      {reviewAction === null ? (
                        <div className="flex gap-2 justify-end pt-2 border-t border-border/20">
                          <Button
                            variant="outline"
                            className="text-xs border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                            onClick={() => setReviewAction('approved')}
                          >
                            تایید ملاقات
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs border-sky-500 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                            onClick={() => setReviewAction('reschedule')}
                          >
                            پیشنهاد زمان جایگزین
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs border-red-500 text-red-400 hover:bg-red-500/10 cursor-pointer"
                            onClick={() => setReviewAction('rejected')}
                          >
                            رد درخواست
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-3 border-t border-border/20">
                          <h4 className="font-black text-red-400 text-[11px]">
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
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold cursor-pointer"
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
                💡 درخواستی را جهت بازخوانی انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Minutes & Decisions */}
      {activeTab === 'minutes' && (
        <div className="space-y-6">
          {/* Form to log outcome minutes */}
          {isManager && (
            <Card className="bg-surface-container-low border-border/40">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-xs font-black">ثبت صورت‌جلسه و تکالیف اجرایی</CardTitle>
                <CardDescription className="text-[10px]">ثبت خروجی رسمی ملاقات و انتساب تصمیمات به جلسه.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs font-bold">
                <form onSubmit={handleSaveOutcome} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px]">انتخاب ملاقات انجام شده:</label>
                    <select
                      value={minutesMeetingId || ''}
                      onChange={(e) => setMinutesMeetingId(e.target.value || null)}
                      className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs focus:outline-none focus:border-red-500 font-bold"
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
                        <label className="text-[11px]">خلاصه، نتایج و صورت‌جلسه:</label>
                        <Textarea
                          value={minutesOutcomeNote}
                          onChange={(e) => setMinutesOutcomeNote(e.target.value)}
                          placeholder="شرح خروجی گفتگو و مصوبات..."
                          rows={4}
                          className="bg-neutral-950/40 font-bold text-xs resize-none"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
                        <Button variant="ghost" size="xs" onClick={() => setMinutesMeetingId(null)}>انصراف</Button>
                        <Button size="xs" type="submit" className="bg-red-600 hover:bg-red-700 text-white cursor-pointer font-bold">ذخیره و اتمام پرونده</Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Archived outcomes */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-foreground">آرشیو تصمیمات و صورت‌جلسات رسمی</h4>
            {meetings.filter(m => m.status === 'completed' && m.outcomeNote).length === 0 ? (
              <div className="text-center py-8 text-foreground-muted text-xs">صورت‌جلسه‌ای ثبت نشده است.</div>
            ) : (
              meetings.filter(m => m.status === 'completed' && m.outcomeNote).map(item => (
                <Card key={item.id} className="bg-surface-container-low border border-violet-500/20">
                  <CardHeader className="pb-2 border-b border-border/20 p-4">
                    <CardTitle className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <FileCheck className="size-4 text-violet-400" />
                      <span>خلاصه و صورت‌جلسه: {item.title}</span>
                    </CardTitle>
                    <span className="text-[9px] text-foreground-muted mt-1 block">میزبان: {item.targetManager?.name} | تاریخ: {jalali(item.scheduledAt)}</span>
                  </CardHeader>
                  <CardContent className="p-4 text-xs font-bold">
                    <p className="text-foreground leading-relaxed p-2.5 bg-neutral-950/20 rounded-lg border border-border/40">{item.outcomeNote}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Admin Console */}
      {activeTab === 'admin' && isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sub Navigation */}
          <div className="md:col-span-1 space-y-1">
            <h4 className="text-xs font-bold text-foreground px-3 pb-2 select-none border-b border-border/20 mb-2">منوی مدیریت جلسات</h4>
            {[
              { key: 'dashboard', label: 'داشبورد آماری', icon: Sliders },
              { key: 'types', label: 'انواع جلسه', icon: Sliders },
              { key: 'rooms', label: 'سالن‌ها و اتاق‌ها', icon: MapPin },
              { key: 'availability', label: 'ساعت حضور (Visual)', icon: Clock },
              { key: 'reports', label: 'گزارشات و اکسل', icon: FileSpreadsheet },
            ].map((sub) => (
              <button
                key={sub.key}
                onClick={() => setAdminSubTab(sub.key as any)}
                className={cn(
                  'w-full text-right p-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer',
                  adminSubTab === sub.key ? 'bg-red-500/10 text-red-400 font-extrabold border-r-2 border-red-500' : 'text-foreground-muted hover:text-foreground hover:bg-neutral-900/50'
                )}
              >
                <sub.icon className="size-4" />
                {sub.label}
              </button>
            ))}
          </div>

          {/* Sub Content */}
          <div className="md:col-span-3">
            {/* Dashboard Sub Tab */}
            {adminSubTab === 'dashboard' && (
              <div className="space-y-6 select-none">
                <h4 className="text-xs font-bold text-foreground">داشبورد آمار پلتفرم جلسات</h4>
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                  {[
                    { label: 'کل جلسات', val: reports.stats?.total ?? 0, desc: 'رزروهای ثبت شده' },
                    { label: 'تایید شده', val: reports.stats?.approved ?? 0, desc: 'آماده برگزاری' },
                    { label: 'در انتظار تایید', val: reports.stats?.pending ?? 0, desc: 'نیازمند اقدام' },
                    { label: 'نرخ لغو', val: `${reports.stats?.cancelRate ?? 0}%`, desc: 'جلسات لغو شده' },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-surface-container-low">
                      <CardContent className="p-3">
                        <span className="text-[10px] text-foreground-muted font-bold block">{stat.label}</span>
                        <span className="text-lg font-black text-foreground block mt-1">{toFa(stat.val)}</span>
                        <span className="text-[8px] text-foreground-muted block mt-0.5">{stat.desc}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Host loads */}
                <Card className="bg-surface-container-low border-border/40">
                  <CardHeader>
                    <CardTitle className="text-xs font-black">بار کاری و ترافیک جلسات ادمین‌ها</CardTitle>
                    <CardDescription className="text-[9px]">تعداد جلسات به تفکیک مدیران سیر و حرکت</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reports.stats?.hostLoads?.length === 0 ? (
                      <div className="text-center py-4 text-xs text-foreground-muted">داده‌ای یافت نشد.</div>
                    ) : (
                      reports.stats?.hostLoads?.map((hl: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span>{hl.name}</span>
                            <span>{toFa(hl.count)} جلسه</span>
                          </div>
                          <div className="w-full bg-neutral-950/40 rounded-full h-1.5">
                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((hl.count / (reports.stats?.total || 1)) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Types CRUD Sub Tab */}
            {adminSubTab === 'types' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground">مدیریت قالب‌های انواع جلسه</h4>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                    onClick={() => setEditingType({
                      key: 'new_type',
                      title: 'نوع جدید',
                      durationMin: 30,
                      bufferMin: 0,
                      hostMode: 'user',
                      whoCanBook: ['driver', 'operator'],
                      approval: 'auto',
                      minNoticeHrs: 4,
                      needsRoom: false,
                      isActive: true,
                    })}
                  >
                    <Plus className="size-4" />
                    نوع جلسه جدید
                  </Button>
                </div>

                {editingType ? (
                  <Card className="bg-surface-container-low border-red-500/20">
                    <CardHeader>
                      <CardTitle className="text-xs font-black">فرم ساخت / ویرایش نوع جلسه</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <form onSubmit={handleSaveMeetingType} className="space-y-3 text-xs font-bold">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>کلید یکتا (انگلیسی):</Label>
                            <Input
                              value={editingType.key}
                              onChange={(e) => setEditingType({ ...editingType, key: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>عنوان فارسی:</Label>
                            <Input
                              value={editingType.title}
                              onChange={(e) => setEditingType({ ...editingType, title: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label>مدت (دقیقه):</Label>
                            <Input
                              type="number"
                              value={editingType.durationMin}
                              onChange={(e) => setEditingType({ ...editingType, durationMin: Number(e.target.value) })}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>زمان بافر (دقیقه):</Label>
                            <Input
                              type="number"
                              value={editingType.bufferMin}
                              onChange={(e) => setEditingType({ ...editingType, bufferMin: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>حداقل هماهنگی (ساعت):</Label>
                            <Input
                              type="number"
                              value={editingType.minNoticeHrs}
                              onChange={(e) => setEditingType({ ...editingType, minNoticeHrs: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>حالت میزبانی:</Label>
                            <select
                              value={editingType.hostMode}
                              onChange={(e) => setEditingType({ ...editingType, hostMode: e.target.value })}
                              className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs"
                            >
                              <option value="user">کاربر خاص</option>
                              <option value="role">میزبان نقشی (توزیع عادلانه)</option>
                            </select>
                          </div>
                          {editingType.hostMode === 'role' && (
                            <div className="space-y-1">
                              <Label>نقش میزبان:</Label>
                              <Input
                                value={editingType.hostRoleKey || ''}
                                onChange={(e) => setEditingType({ ...editingType, hostRoleKey: e.target.value })}
                                placeholder="مثال: supervisor"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                          <div className="flex items-center justify-between">
                            <Label>الزام به رزرو اتاق جلسه:</Label>
                            <input
                              type="checkbox"
                              checked={editingType.needsRoom || false}
                              onChange={(e) => setEditingType({ ...editingType, needsRoom: e.target.checked })}
                              className="size-4"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>فعال بودن نوع جلسه:</Label>
                            <input
                              type="checkbox"
                              checked={editingType.isActive || false}
                              onChange={(e) => setEditingType({ ...editingType, isActive: e.target.checked })}
                              className="size-4"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                          <Button variant="ghost" onClick={() => setEditingType(null)}>انصراف</Button>
                          <Button type="submit" className="bg-red-600 text-white font-bold cursor-pointer">ذخیره قالب</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {meetingTypes.map(t => (
                      <div key={t.id} className="p-3 bg-surface-container-low border border-border/40 rounded-xl flex justify-between items-center text-xs font-bold">
                        <div>
                          <span className="font-black text-foreground block">{t.title} ({t.key})</span>
                          <span className="text-[10px] text-foreground-muted mt-1 block">
                            مدت: {toFa(t.durationMin)} دقیقه | بافر: {toFa(t.bufferMin)} دقیقه | حداقل فاصله: {toFa(t.minNoticeHrs)} ساعت
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="xs" variant="outline" className="border-red-500/30 text-red-400 cursor-pointer" onClick={() => setEditingType(t)}>ویرایش</Button>
                          <Button size="xs" variant="ghost" className="text-red-500 cursor-pointer" onClick={() => handleDeleteMeetingType(t.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rooms CRUD Sub Tab */}
            {adminSubTab === 'rooms' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-foreground">مدیریت سالن‌ها و اتاق‌های جلسه دپو</h4>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                    onClick={() => setEditingRoom({
                      name: 'اتاق جدید',
                      location: 'دپو طبقه اول',
                      capacity: 10,
                      isActive: true,
                    })}
                  >
                    <Plus className="size-4" />
                    افزودن اتاق جدید
                  </Button>
                </div>

                {editingRoom ? (
                  <Card className="bg-surface-container-low border-red-500/20">
                    <CardHeader>
                      <CardTitle className="text-xs font-black">ساخت / ویرایش اتاق جلسه</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <form onSubmit={handleSaveRoom} className="space-y-3 text-xs font-bold">
                        <div className="space-y-1">
                          <Label>نام اتاق:</Label>
                          <Input
                            value={editingRoom.name}
                            onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label>موقعیت مکانی:</Label>
                            <Input
                              value={editingRoom.location || ''}
                              onChange={(e) => setEditingRoom({ ...editingRoom, location: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>ظرفیت (نفر):</Label>
                            <Input
                              type="number"
                              value={editingRoom.capacity || ''}
                              onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                          <Label>اتاق فعال است:</Label>
                          <input
                            type="checkbox"
                            checked={editingRoom.isActive || false}
                            onChange={(e) => setEditingRoom({ ...editingRoom, isActive: e.target.checked })}
                            className="size-4"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-3">
                          <Button variant="ghost" onClick={() => setEditingRoom(null)}>انصراف</Button>
                          <Button type="submit" className="bg-red-600 text-white font-bold cursor-pointer">ذخیره</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {meetingRooms.map(r => (
                      <div key={r.id} className="p-3 bg-surface-container-low border border-border/40 rounded-xl flex justify-between items-center text-xs font-bold">
                        <div>
                          <span className="font-black text-foreground block">{r.name} ({r.location})</span>
                          <span className="text-[10px] text-foreground-muted mt-1 block">ظرفیت: {toFa(r.capacity)} نفر</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="xs" variant="outline" className="border-red-500/30 text-red-400 cursor-pointer" onClick={() => setEditingRoom(r)}>ویرایش</Button>
                          <Button size="xs" variant="ghost" className="text-red-500 cursor-pointer" onClick={() => handleDeleteRoom(r.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Availability Sub Tab (Visual Editor) */}
            {adminSubTab === 'availability' && (
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-foreground">تنظیم ساعت حضور هفتگی میزبان‌ها</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label className="text-[11px]">انتخاب مدیر / میزبان:</Label>
                    <select
                      value={selectedAvailHost}
                      onChange={(e) => setSelectedAvailHost(e.target.value)}
                      className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs focus:outline-none focus:border-red-500 font-bold"
                    >
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role.name})
                        </option>
                      ))}
                    </select>

                    {/* Add new rule */}
                    <Card className="bg-neutral-950/20 border-border/40 mt-4">
                      <CardHeader className="p-3">
                        <CardTitle className="text-[10px] font-black text-red-400">افزودن بازه حضور هفتگی</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-3 text-xs font-bold">
                        <div className="space-y-1">
                          <Label>روز هفته:</Label>
                          <select
                            value={newRuleWeekday}
                            onChange={(e) => setNewRuleWeekday(Number(e.target.value))}
                            className="w-full bg-neutral-950/40 border p-2 rounded-lg text-xs"
                          >
                            <option value={0}>شنبه</option>
                            <option value={1}>یکشنبه</option>
                            <option value={2}>دوشنبه</option>
                            <option value={3}>سه‌شنبه</option>
                            <option value={4}>چهارشنبه</option>
                            <option value={5}>پنج‌شنبه</option>
                            <option value={6}>جمعه</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label>از ساعت:</Label>
                            <Input value={newRuleFrom} onChange={(e) => setNewRuleFrom(e.target.value)} placeholder="09:00" />
                          </div>
                          <div className="space-y-1">
                            <Label>تا ساعت:</Label>
                            <Input value={newRuleTo} onChange={(e) => setNewRuleTo(e.target.value)} placeholder="12:00" />
                          </div>
                        </div>
                        <Button size="xs" onClick={handleAddRule} className="w-full bg-red-600 text-white font-bold cursor-pointer">افزودن زمان حضور</Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rules grid */}
                  <div className="col-span-2 space-y-4">
                    <Card className="bg-surface-container-low">
                      <CardHeader className="p-4 pb-2 border-b border-border/20">
                        <CardTitle className="text-xs font-black">زمان‌های تعریف شده برای میزبان</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        {availRules.length === 0 ? (
                          <div className="text-center py-6 text-xs text-foreground-muted">قانونی تعریف نشده است.</div>
                        ) : (
                          availRules.map((rule) => {
                            const weekdayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
                            return (
                              <div key={rule.id} className="flex justify-between items-center p-2 bg-neutral-950/30 rounded border border-border/40 text-xs font-bold">
                                <span>{weekdayNames[rule.weekday]}: {toFa(rule.fromTime)} الی {toFa(rule.toTime)}</span>
                                <Button size="xs" variant="ghost" className="text-red-500 cursor-pointer" onClick={() => handleDeleteRule(rule.id, 'rule')}>حذف</Button>
                              </div>
                            )
                          })
                        )}
                      </CardContent>
                    </Card>

                    {/* Exceptions */}
                    <Card className="bg-surface-container-low">
                      <CardHeader className="p-4 pb-2 border-b border-border/20">
                        <CardTitle className="text-xs font-black">استثناها و مرخصی‌ها (بلاک موقت)</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex gap-2">
                          <Input type="date" value={newExceptionDate} onChange={(e) => setNewExceptionDate(e.target.value)} />
                          <Input placeholder="دلیل مرخصی/ماموریت..." value={newExceptionReason} onChange={(e) => setNewExceptionReason(e.target.value)} />
                          <Button size="sm" onClick={handleAddException} className="bg-red-600 text-white cursor-pointer shrink-0 font-bold">ثبت استثنا</Button>
                        </div>

                        <div className="space-y-2">
                          {availExceptions.map((ex) => (
                            <div key={ex.id} className="flex justify-between items-center p-2 bg-neutral-950/30 rounded border border-border/40 text-xs font-bold">
                              <span>تاریخ: {jalali(ex.date)} {ex.reason ? `(${ex.reason})` : ''} - بلاک کامل روز</span>
                              <Button size="xs" variant="ghost" className="text-red-500 cursor-pointer" onClick={() => handleDeleteRule(ex.id, 'exception')}>حذف</Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Reports and Excel Sub Tab */}
            {adminSubTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center select-none">
                  <h4 className="text-xs font-bold text-foreground">گزارشات و مستندات چاپی جلسات</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 font-bold flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        const params = new URLSearchParams()
                        if (reportTypeFilter) params.append('typeId', reportTypeFilter)
                        if (reportFromFilter) params.append('from', reportFromFilter)
                        if (reportToFilter) params.append('to', reportToFilter)
                        window.open(`/api/admin/meetings/reports/export?${params.toString()}`)
                      }}
                    >
                      <FileSpreadsheet className="size-4" />
                      خروجی اکسل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-neutral-500/30 text-foreground-muted font-bold flex items-center gap-1 cursor-pointer"
                      onClick={() => window.print()}
                    >
                      <Printer className="size-4" />
                      چاپ فیلتر شده
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-surface-container-low border border-border/40 rounded-xl text-xs font-bold select-none">
                  <div className="space-y-1">
                    <label>نوع جلسه:</label>
                    <select
                      value={reportTypeFilter}
                      onChange={(e) => setReportTypeFilter(e.target.value)}
                      className="w-full bg-neutral-950/40 border border-border/50 p-2.5 rounded-lg text-xs"
                    >
                      <option value="">همه انواع جلسه...</option>
                      {meetingTypes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label>از تاریخ:</label>
                    <Input type="date" value={reportFromFilter} onChange={(e) => setReportFromFilter(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label>تا تاریخ:</label>
                    <Input type="date" value={reportToFilter} onChange={(e) => setReportToFilter(e.target.value)} />
                  </div>
                </div>

                {/* List */}
                <Card className="bg-surface-container-low border-border/40">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs font-bold">
                        <thead>
                          <tr className="border-b border-border/40 bg-neutral-900/50 select-none">
                            <th className="p-3 text-[10px] text-foreground-muted">ردیف</th>
                            <th className="p-3 text-[10px] text-foreground-muted">موضوع</th>
                            <th className="p-3 text-[10px] text-foreground-muted">درخواست‌دهنده</th>
                            <th className="p-3 text-[10px] text-foreground-muted">میزبان</th>
                            <th className="p-3 text-[10px] text-foreground-muted">تاریخ برگزاری</th>
                            <th className="p-3 text-[10px] text-foreground-muted">مدت</th>
                            <th className="p-3 text-[10px] text-foreground-muted">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportsLoading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-foreground-muted">در حال بارگذاری گزارش...</td>
                            </tr>
                          ) : reports.meetings?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-6 text-foreground-muted">پرونده‌ای یافت نشد.</td>
                            </tr>
                          ) : (
                            reports.meetings?.map((m: any, idx: number) => (
                              <tr key={m.id} className="border-b border-border/20 hover:bg-neutral-900/20">
                                <td className="p-3 font-mono">{toFa(idx + 1)}</td>
                                <td className="p-3 font-black text-foreground">{m.title}</td>
                                <td className="p-3">{m.requester?.name}</td>
                                <td className="p-3">{m.targetManager?.name}</td>
                                <td className="p-3 font-mono">{jalali(m.scheduledAt)} ساعت {toFa(new Date(m.scheduledAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</td>
                                <td className="p-3 font-mono">{toFa(m.durationMinutes)} دقیقه</td>
                                <td className="p-3">
                                  <Badge className={cn('text-[9px] font-extrabold', statusColor[m.status])}>{statusLabel[m.status] || m.status}</Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
