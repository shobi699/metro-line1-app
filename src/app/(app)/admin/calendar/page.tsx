'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import dayjs from 'dayjs'
// @ts-expect-error — dayjs-jalali بدون type declaration منتشر شده است
import jalaliday from 'dayjs-jalali'
import {
  CalendarDays,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Eye,
  Settings2,
  Calendar,
  Megaphone,
  X,
  Save,
  Check,
} from 'lucide-react'

dayjs.extend(jalaliday)
const jdate = (d: string | Date) => dayjs(d).calendar('jalali')

type Tab = 'holidays' | 'org-events' | 'config'

interface Holiday {
  id: string
  jalaliDate: string
  title: string
  kind: string
  isOffDay: boolean
  recurring: boolean
  hijriBased: boolean
  color: string | null
  isActive: boolean
}

interface OrgEvent {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  audience: { roles?: string[]; groups?: string[]; userIds?: string[] }
  color: string | null
  mandatory: boolean
  createdBy: string
  isActive: boolean
  createdAt: string
  _count: { seenRecords: number }
}

interface SeenReport {
  eventId: string
  title: string
  mandatory: boolean
  totalSeen: number
  records: { userId: string; userName: string; nationalId: string; seenAt: string }[]
}

interface ShiftHours {
  start: string
  end: string
  hours: number
}

interface CalendarConfig {
  shiftHours: Record<string, ShiftHours>
  smartRules: { bridgeFinder: boolean; conflictWarning: boolean }
  widgetPolicy: { enabled: boolean; updateIntervalMinutes: number }
  icsPolicy: { enabled: boolean; maxTokensPerUser: number }
}

const KIND_LABELS: Record<string, string> = {
  official: 'رسمی',
  religious: 'مذهبی',
  occasion: 'مناسبت',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  office: 'اداری',
  off: 'آف',
}

export default function CalendarAdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [tab, setTab] = useState<Tab>('holidays')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CalendarDays className="w-6 h-6 text-primary" />
            مدیریت تقویم
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            تعطیلات، رویدادهای سازمانی و پیکربندی تقویم
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border w-fit">
        {([
          { key: 'holidays', label: 'تعطیلات و مناسبت‌ها', icon: Calendar },
          { key: 'org-events', label: 'رویدادهای سازمانی', icon: Megaphone },
          { key: 'config', label: 'پیکربندی', icon: Settings2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
              tab === key
                ? 'bg-background shadow-sm font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'holidays' && <HolidaysTab accessToken={accessToken} />}
      {tab === 'org-events' && <OrgEventsTab accessToken={accessToken} />}
      {tab === 'config' && <ConfigTab accessToken={accessToken} />}
    </div>
  )
}

// ── تب تعطیلات ────────────────────────────────────────

function HolidaysTab({ accessToken }: { accessToken: string | null }) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState('all')
  const [importResult, setImportResult] = useState<{
    total: number; created: number; updated: number; errors: { row: number; message: string }[]
  } | null>(null)

  const [form, setForm] = useState({
    jalaliDate: '',
    title: '',
    kind: 'official',
    isOffDay: true,
    recurring: true,
    hijriBased: false,
  })

  const fetchHolidays = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/calendar/holidays', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setHolidays(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchHolidays() }, [fetchHolidays])

  async function handleSave() {
    if (!accessToken) return
    const url = editId
      ? `/api/admin/calendar/holidays/${editId}`
      : '/api/admin/calendar/holidays'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowForm(false)
      setEditId(null)
      setForm({ jalaliDate: '', title: '', kind: 'official', isOffDay: true, recurring: true, hijriBased: false })
      fetchHolidays()
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm('آیا از حذف این تعطیلی مطمئن هستید؟')) return
    await fetch(`/api/admin/calendar/holidays/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    fetchHolidays()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (!accessToken || !e.target.files?.[0]) return
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    const res = await fetch('/api/admin/calendar/holidays/import', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
    if (res.ok) {
      const json = await res.json()
      setImportResult(json.data)
      fetchHolidays()
    }
    e.target.value = ''
  }

  function openEdit(h: Holiday) {
    setEditId(h.id)
    setForm({
      jalaliDate: h.jalaliDate,
      title: h.title,
      kind: h.kind,
      isOffDay: h.isOffDay,
      recurring: h.recurring,
      hijriBased: h.hijriBased,
    })
    setShowForm(true)
  }

  const filtered = holidays.filter((h) => kindFilter === 'all' || h.kind === kindFilter)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { setEditId(null); setForm({ jalaliDate: '', title: '', kind: 'official', isOffDay: true, recurring: true, hijriBased: false }); setShowForm(true) }} size="sm">
          <Plus className="w-4 h-4 me-1" /> افزودن تعطیلی
        </Button>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" type="button" className="pointer-events-none">
            <Upload className="w-4 h-4 me-1" /> ایمپورت اکسل
          </Button>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </label>
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border ms-auto">
          {['all', 'official', 'religious', 'occasion'].map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                kindFilter === k ? 'bg-background shadow-sm font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {k === 'all' ? 'همه' : KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {importResult && (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                نتیجه ایمپورت: {toFa(importResult.created)} ایجاد، {toFa(importResult.updated)} بروزرسانی
                {importResult.errors.length > 0 && <span className="text-destructive"> — {toFa(importResult.errors.length)} خطا</span>}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setImportResult(null)}><X className="w-4 h-4" /></Button>
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-xs text-destructive space-y-0.5 max-h-32 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <div key={i}>ردیف {toFa(err.row)}: {err.message}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-bold text-sm">{editId ? 'ویرایش تعطیلی' : 'افزودن تعطیلی جدید'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">تاریخ جلالی (۱۴۰۵-۰۱-۰۱)</label>
                <Input
                  value={form.jalaliDate}
                  onChange={(e) => setForm({ ...form, jalaliDate: e.target.value })}
                  placeholder="1405-01-01"
                  dir="ltr"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">عنوان</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="نوروز"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">نوع</label>
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="official">رسمی</option>
                  <option value="religious">مذهبی</option>
                  <option value="occasion">مناسبت</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isOffDay} onChange={(e) => setForm({ ...form, isOffDay: e.target.checked })} className="rounded" />
                روز تعطیل
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="rounded" />
                تکرار سالانه
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hijriBased} onChange={(e) => setForm({ ...form, hijriBased: e.target.checked })} className="rounded" />
                تاریخ قمری
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null) }}>انصراف</Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 me-1" /> {editId ? 'بروزرسانی' : 'ذخیره'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">در حال دریافت...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium">تعطیلی ثبت نشده است</h3>
              <p className="text-sm text-muted-foreground mt-1">تعطیلات و مناسبت‌ها را ایجاد کنید یا از فایل اکسل ایمپورت نمایید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-start p-3 font-medium">تاریخ</th>
                    <th className="text-start p-3 font-medium">عنوان</th>
                    <th className="text-start p-3 font-medium">نوع</th>
                    <th className="text-center p-3 font-medium">تعطیل</th>
                    <th className="text-center p-3 font-medium">تکرار</th>
                    <th className="text-center p-3 font-medium">قمری</th>
                    <th className="text-end p-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs" dir="ltr">{toFa(h.jalaliDate)}</td>
                      <td className="p-3">{h.title}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          h.kind === 'official' ? 'bg-destructive/10 text-destructive' :
                          h.kind === 'religious' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {KIND_LABELS[h.kind] ?? h.kind}
                        </span>
                      </td>
                      <td className="p-3 text-center">{h.isOffDay ? <Check className="w-4 h-4 text-success mx-auto" /> : '—'}</td>
                      <td className="p-3 text-center">{h.recurring ? <Check className="w-4 h-4 text-info mx-auto" /> : '—'}</td>
                      <td className="p-3 text-center">{h.hijriBased ? <Check className="w-4 h-4 text-warning mx-auto" /> : '—'}</td>
                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(h)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(h.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
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
  )
}

// ── تب رویدادهای سازمانی ──────────────────────────────

function OrgEventsTab({ accessToken }: { accessToken: string | null }) {
  const [events, setEvents] = useState<OrgEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [seenReport, setSeenReport] = useState<SeenReport | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    allDay: true,
    mandatory: false,
    color: '',
    audienceRoles: '',
    audienceGroups: '',
  })

  const fetchEvents = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/calendar/org-events', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setEvents(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function handleSave() {
    if (!accessToken) return
    const audience: Record<string, string[]> = {}
    if (form.audienceRoles.trim()) audience.roles = form.audienceRoles.split(',').map((s) => s.trim()).filter(Boolean)
    if (form.audienceGroups.trim()) audience.groups = form.audienceGroups.split(',').map((s) => s.trim()).filter(Boolean)

    const payload = {
      title: form.title,
      description: form.description || undefined,
      startAt: form.startAt,
      endAt: form.endAt || undefined,
      allDay: form.allDay,
      mandatory: form.mandatory,
      color: form.color || undefined,
      audience,
    }

    const url = editId ? `/api/admin/calendar/org-events/${editId}` : '/api/admin/calendar/org-events'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setShowForm(false)
      setEditId(null)
      resetForm()
      fetchEvents()
    }
  }

  function resetForm() {
    setForm({ title: '', description: '', startAt: '', endAt: '', allDay: true, mandatory: false, color: '', audienceRoles: '', audienceGroups: '' })
  }

  async function handleDelete(id: string) {
    if (!accessToken || !confirm('آیا از حذف این رویداد مطمئن هستید؟')) return
    await fetch(`/api/admin/calendar/org-events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    fetchEvents()
  }

  async function viewSeenReport(id: string) {
    if (!accessToken) return
    const res = await fetch(`/api/admin/calendar/org-events/${id}/seen`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const json = await res.json()
      setSeenReport(json.data)
    }
  }

  function openEdit(ev: OrgEvent) {
    setEditId(ev.id)
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      startAt: ev.startAt.slice(0, 16),
      endAt: ev.endAt?.slice(0, 16) ?? '',
      allDay: ev.allDay,
      mandatory: ev.mandatory,
      color: ev.color ?? '',
      audienceRoles: ev.audience?.roles?.join(', ') ?? '',
      audienceGroups: ev.audience?.groups?.join(', ') ?? '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={() => { setEditId(null); resetForm(); setShowForm(true) }} size="sm">
          <Plus className="w-4 h-4 me-1" /> رویداد سازمانی جدید
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-bold text-sm">{editId ? 'ویرایش رویداد' : 'رویداد سازمانی جدید'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">عنوان</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="جلسه ایمنی ماهانه" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">شروع</label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-background border rounded-md p-3 text-sm resize-none"
                  rows={2}
                  placeholder="توضیحات اختیاری..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">نقش‌های مخاطب (کاما جدا)</label>
                <Input value={form.audienceRoles} onChange={(e) => setForm({ ...form, audienceRoles: e.target.value })} placeholder="driver, operator" dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">گروه‌های مخاطب (کاما جدا)</label>
                <Input value={form.audienceGroups} onChange={(e) => setForm({ ...form, audienceGroups: e.target.value })} placeholder="A, B" dir="ltr" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })} className="rounded" />
                تمام روز
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.mandatory} onChange={(e) => setForm({ ...form, mandatory: e.target.checked })} className="rounded" />
                الزامی (بلاک‌کننده)
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null) }}>انصراف</Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 me-1" /> {editId ? 'بروزرسانی' : 'ذخیره'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {seenReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-xl rounded-xl shadow-lg border flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="font-bold">گزارش رؤیت: {seenReport.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSeenReport(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-muted-foreground mb-3">مجموع رؤیت: {toFa(seenReport.totalSeen)} نفر</p>
              {seenReport.records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">هنوز کسی رؤیت نکرده است</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-start p-2 font-medium">نام</th>
                      <th className="text-start p-2 font-medium">کد ملی</th>
                      <th className="text-start p-2 font-medium">زمان رؤیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seenReport.records.map((r) => (
                      <tr key={r.userId} className="border-b last:border-0">
                        <td className="p-2">{r.userName}</td>
                        <td className="p-2 font-mono text-xs" dir="ltr">{toFa(r.nationalId)}</td>
                        <td className="p-2 text-xs">{toFa(jdate(r.seenAt).format('YYYY/MM/DD HH:mm'))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">در حال دریافت...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-medium">رویداد سازمانی ثبت نشده است</h3>
              <p className="text-sm text-muted-foreground mt-1">رویدادهایی مثل جلسات ایمنی یا مراسم سازمانی ایجاد کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-start p-3 font-medium">عنوان</th>
                    <th className="text-start p-3 font-medium">تاریخ</th>
                    <th className="text-center p-3 font-medium">الزامی</th>
                    <th className="text-center p-3 font-medium">رؤیت</th>
                    <th className="text-center p-3 font-medium">وضعیت</th>
                    <th className="text-end p-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{ev.title}</div>
                        {ev.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ev.description}</div>}
                      </td>
                      <td className="p-3 text-xs">{toFa(jdate(ev.startAt).format('YYYY/MM/DD'))}</td>
                      <td className="p-3 text-center">
                        {ev.mandatory ? (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">الزامی</span>
                        ) : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => viewSeenReport(ev.id)}
                          className="text-xs text-info hover:underline flex items-center gap-1 justify-center mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {toFa(ev._count.seenRecords)}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ev.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {ev.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(ev.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
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
  )
}

// ── تب پیکربندی ───────────────────────────────────────

function ConfigTab({ accessToken }: { accessToken: string | null }) {
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchConfig = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/calendar/config', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setConfig(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  async function handleSave() {
    if (!accessToken || !config) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/calendar/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        const json = await res.json()
        setConfig(json.data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  function updateShiftHour(code: string, field: keyof ShiftHours, value: string | number) {
    if (!config) return
    setConfig({
      ...config,
      shiftHours: {
        ...config.shiftHours,
        [code]: { ...config.shiftHours[code], [field]: value },
      },
    })
  }

  if (loading || !config) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">در حال دریافت...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ساعات شیفت‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(config.shiftHours).map(([code, sh]) => (
            <div key={code} className="grid grid-cols-4 gap-3 items-center">
              <div className="font-medium text-sm">{SHIFT_LABELS[code] ?? code}</div>
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">شروع</label>
                <Input
                  type="time"
                  value={sh.start}
                  onChange={(e) => updateShiftHour(code, 'start', e.target.value)}
                  dir="ltr"
                  className="text-xs"
                  disabled={code === 'off'}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">پایان</label>
                <Input
                  type="time"
                  value={sh.end}
                  onChange={(e) => updateShiftHour(code, 'end', e.target.value)}
                  dir="ltr"
                  className="text-xs"
                  disabled={code === 'off'}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">ساعات</label>
                <Input
                  type="number"
                  value={sh.hours}
                  onChange={(e) => updateShiftHour(code, 'hours', Number(e.target.value))}
                  dir="ltr"
                  className="text-xs"
                  step="0.25"
                  min="0"
                  max="24"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">قوانین هوشمند</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">یابنده روزهای پُل (Bridge Finder)</p>
              <p className="text-xs text-muted-foreground">نمایش فرصت‌های استراحت طولانی به پرسنل</p>
            </div>
            <input
              type="checkbox"
              checked={config.smartRules.bridgeFinder}
              onChange={(e) => setConfig({ ...config, smartRules: { ...config.smartRules, bridgeFinder: e.target.checked } })}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">هشدار تداخل شیفت</p>
              <p className="text-xs text-muted-foreground">نمایش هشدار در صورت تعارض رویداد با شیفت</p>
            </div>
            <input
              type="checkbox"
              checked={config.smartRules.conflictWarning}
              onChange={(e) => setConfig({ ...config, smartRules: { ...config.smartRules, conflictWarning: e.target.checked } })}
              className="rounded"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ویجت موبایل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">فعال‌سازی ویجت</p>
              <p className="text-xs text-muted-foreground">ویجت شیفت در صفحه اصلی گوشی</p>
            </div>
            <input
              type="checkbox"
              checked={config.widgetPolicy.enabled}
              onChange={(e) => setConfig({ ...config, widgetPolicy: { ...config.widgetPolicy, enabled: e.target.checked } })}
              className="rounded"
            />
          </label>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">بازه بروزرسانی (دقیقه)</label>
            <Input
              type="number"
              value={config.widgetPolicy.updateIntervalMinutes}
              onChange={(e) => setConfig({ ...config, widgetPolicy: { ...config.widgetPolicy, updateIntervalMinutes: Number(e.target.value) } })}
              dir="ltr"
              className="w-32"
              min="5"
              max="1440"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اشتراک ICS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">فعال‌سازی ICS</p>
              <p className="text-xs text-muted-foreground">اجازه اشتراک تقویم از طریق لینک ICS</p>
            </div>
            <input
              type="checkbox"
              checked={config.icsPolicy.enabled}
              onChange={(e) => setConfig({ ...config, icsPolicy: { ...config.icsPolicy, enabled: e.target.checked } })}
              className="rounded"
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-4">
        <Button onClick={handleSave} disabled={saving}>
          {saved ? <><Check className="w-4 h-4 me-1" /> ذخیره شد</> : <><Save className="w-4 h-4 me-1" /> ذخیره تنظیمات</>}
        </Button>
      </div>
    </div>
  )
}
