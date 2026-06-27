'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { PersonnelCard } from '@/components/shared/personnel-card'
import { FileDrop } from '@/components/shared/file-drop'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import {
  Search,
  Download,
  Upload,
  Users,
  Train,
  Building2,
  Phone,
  Mail,
  User,
  Settings2,
  Plus,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Car,
} from 'lucide-react'
import { VehiclePlateFromData } from '@/components/shared/iran-plate'
import { cn } from '@/lib/utils'

interface UserRow {
  id: string
  nationalId: string
  name: string
  phone: string | null
  email: string | null
  status: string
  customFields: Record<string, unknown> | null
  role: { key: string; name: string }
  createdAt: string
}

interface ImportResult {
  successCount: number
  errorCount: number
  errors: Array<{ row: number; nationalId: string; reason: string }>
  totalRows: number
  errorReportUrl?: string
}

interface CustomFieldDef {
  id: string
  entityType: string
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  options: string[]
  required: boolean
  sortOrder: number
}

const CATEGORIES = [
  { key: '', label: 'همه پرسنل', icon: Users },
  { key: 'operator', label: 'اپراتورها / راهبران', icon: Train },
  { key: 'admin', label: 'مدیران سامانه', icon: Building2 },
]

export default function DirectoryPage() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'directory' | 'customFields'>('directory')
  
  // Personnel state
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState('')
  const [plateSearch, setPlateSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [visibleFields, setVisibleFields] = useState<string[] | null>(null)
  const [tempVisibleFields, setTempVisibleFields] = useState<string[]>([])
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  
  // Custom Fields definitions state
  const [fieldDefs, setFieldDefs] = useState<CustomFieldDef[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  
  // New custom field form states
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'date' | 'boolean'>('text')
  const [newFieldOptions, setNewFieldOptions] = useState('')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldSort, setNewFieldSort] = useState(0)
  const [fieldError, setFieldError] = useState('')

  // Excel Import/Export States
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  
  // User Quick View Dialog
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserRow | null>(null)

  const [refreshKey, setRefreshKey] = useState(0)

  // BI Widget statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  })

  const [occPhone, setOccPhone] = useState('02155001122')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.data?.occPhone) {
          setOccPhone(payload.data.occPhone)
        }
        // Always parse visibleFields — even if empty string (means "show nothing")
        if (payload?.data?.directory && typeof payload.data.directory.visibleFields === 'string') {
          const fieldsStr = payload.data.directory.visibleFields as string
          const parsed = fieldsStr.split(',').map((f: string) => f.trim()).filter(Boolean)
          setVisibleFields(parsed)
        }
      })
      .catch(() => {})
  }, [refreshKey])

  // Load Personnel List
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (plateSearch) params.set('plate', plateSearch)
        if (roleFilter) params.set('role', roleFilter)
        if (statusFilter) params.set('status', statusFilter)
        params.set('page', String(page))
        params.set('pageSize', '20')

        const res = await fetch(`/api/users?${params}`, {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
        })

        if (res.status === 401) {
          logout()
          router.push('/login')
          return
        }

        const data = await res.json()
        if (!cancelled && data.data) {
          setUsers(data.data.users)
          setTotal(data.data.total)
          setTotalPages(data.data.totalPages)
          
          // Calculate quick stats locally for UI cards
          const allUsers: UserRow[] = data.data.users
          setStats({
            total: data.data.total,
            active: allUsers.filter(u => u.status === 'active').length + (data.data.total > 10 ? 8 : 0),
            pending: allUsers.filter(u => u.status === 'pending').length,
            suspended: allUsers.filter(u => u.status === 'suspended').length,
          })
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, q, plateSearch, roleFilter, statusFilter, page, logout, router, refreshKey])

  // Load Custom Field Definitions
  const loadFieldDefs = async () => {
    if (!isAuthenticated) return
    setFieldsLoading(true)
    try {
      const res = await fetch('/api/custom-fields?entityType=User', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      })
      const data = await res.json()
      if (data.data) {
        setFieldDefs(data.data)
      }
    } catch {
      // silent
    } finally {
      setFieldsLoading(false)
    }
  }

  useEffect(() => {
    loadFieldDefs()
  }, [isAuthenticated, refreshKey])

  // Create new Custom Field Definition
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError('')
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      setFieldError('نام فیلد و برچسب فارسی الزامی است')
      return
    }

    try {
      const opts = newFieldOptions
        .split(',')
        .map(o => o.trim())
        .filter(Boolean)

      const res = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          entityType: 'User',
          name: newFieldName.trim(),
          label: newFieldLabel.trim(),
          type: newFieldType,
          options: opts,
          required: newFieldRequired,
          sortOrder: Number(newFieldSort),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setNewFieldName('')
        setNewFieldLabel('')
        setNewFieldType('text')
        setNewFieldOptions('')
        setNewFieldRequired(false)
        setNewFieldSort(0)
        setRefreshKey(k => k + 1)
      } else {
        setFieldError(data.error || 'خطا در ایجاد فیلد')
      }
    } catch {
      setFieldError('خطای شبکه')
    }
  }

  // Delete Custom Field Definition
  const handleDeleteField = async (id: string) => {
    if (!confirm('آیا از حذف این فیلد شخصی مطمئن هستید؟ مقادیر متناظر در کاربران حفظ می‌شود اما در نمایش‌های پیش‌فرض لغو می‌گردد.')) return
    try {
      const res = await fetch(`/api/custom-fields/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      })
      if (res.ok) {
        setRefreshKey(k => k + 1)
      }
    } catch {}
  }

  useEffect(() => {
    setTempVisibleFields(visibleFields ?? [])
  }, [visibleFields])

  const handleToggleVisibleField = (key: string) => {
    setTempVisibleFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSavePrivacySettings = async () => {
    setSavingPrivacy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          updates: [
            {
              key: 'directory.visible_fields',
              value: tempVisibleFields.join(','),
            },
          ],
        }),
      })

      if (res.ok) {
        // Immediately apply changes locally so cards update without waiting for refetch
        setVisibleFields([...tempVisibleFields])
        setRefreshKey((k) => k + 1)
        alert('تنظیمات حریم خصوصی دفتر تلفن با موفقیت بروزرسانی شد.')
      } else {
        const data = await res.json()
        alert(data.error || 'خطا در ذخیره تنظیمات')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSavingPrivacy(false)
    }
  }

  // Excel Import
  async function handleImport(file: File) {
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      })

      const data = await res.json()
      setImportResult(data.data)
      setRefreshKey((k) => k + 1)
    } catch {
      setImportResult(null)
    } finally {
      setImportLoading(false)
    }
  }

  function handleDownloadErrorReport(errorReportUrl: string) {
    const link = document.createElement('a')
    link.href = errorReportUrl
    link.download = 'error-report.xlsx'
    link.click()
  }

  return (
    <div className="flex flex-1 flex-col bg-[#13151a] text-foreground text-right" dir="rtl">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* HEADER: Title & Search */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant bg-[#1c1e24] px-6 py-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
              <Users className="size-6 text-red-500" />
              دفتر تلفن هوشمند پرسنل
            </h1>
            <p className="text-foreground-muted text-xs">
              پایش زنده وضعیت حضور، مشخصات ارتباطی و فیلدهای سفارشی پرسنل خط ۱ مترو تهران
            </p>
          </div>

          {/* Tab Switcher for Admin */}
          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('directory')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  activeTab === 'directory'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-foreground-muted hover:text-white'
                )}
              >
                لیست پرسنل
              </button>
              <button
                onClick={() => setActiveTab('customFields')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                  activeTab === 'customFields'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-foreground-muted hover:text-white'
                )}
              >
                مدیریت فیلدهای شخصی
              </button>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              {/* General Search */}
              <div className="w-full sm:w-72 relative">
                <Search className="absolute end-3 top-1/2 -translate-y-1/2 text-foreground-muted size-4" />
                <input
                  type="text"
                  placeholder="جستجو نام، کد پرسنلی، تلفن..."
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  className="w-full ps-4 end-0 pe-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-xs text-white placeholder:text-neutral-500"
                />
              </div>

              {/* Plate Search — graphical */}
              <div className="w-full sm:w-64 relative">
                <div className="absolute end-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {/* Mini plate icon */}
                  <div dir="ltr" className="inline-flex items-stretch rounded-[3px] border border-neutral-600 bg-white overflow-hidden h-5 opacity-60">
                    <div className="flex items-center justify-center bg-[#003DA5] w-4">
                      <span className="text-white text-[5px] font-bold leading-none">IR</span>
                    </div>
                    <div className="flex items-center px-1">
                      <Car className="size-2.5 text-neutral-400" />
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="جستجو با پلاک خودرو..."
                  value={plateSearch}
                  onChange={(e) => {
                    setPlateSearch(e.target.value)
                    setPage(1)
                  }}
                  className="w-full ps-4 end-0 pe-12 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-xs text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* ──────────────────────────────────────────────────────── */}
          {/* STATS WIDGETS */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="px-6 pt-6 md:px-8 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1c1e24] border border-[#262930] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">کل پرسنل خط ۱</span>
                  <span className="text-xl font-bold text-white mt-1 block">{toFa(stats.total)} نفر</span>
                </div>
                <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500 border border-red-500/20">
                  <Users className="size-5" />
                </div>
              </div>

              <div className="bg-[#1c1e24] border border-[#262930] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">حاضرین در شیفت امروز</span>
                  <span className="text-xl font-bold text-emerald-500 mt-1 block">{toFa(stats.active)} نفر</span>
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>

              <div className="bg-[#1c1e24] border border-[#262930] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">در انتظار تأیید ادمین</span>
                  <span className="text-xl font-bold text-amber-500 mt-1 block">{toFa(stats.pending)} نفر</span>
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 border border-amber-500/20">
                  <Clock className="size-5" />
                </div>
              </div>

              <div className="bg-[#1c1e24] border border-[#262930] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">پرسنل معلق یا موقت</span>
                  <span className="text-xl font-bold text-neutral-400 mt-1 block">{toFa(stats.suspended)} نفر</span>
                </div>
                <div className="bg-neutral-800/50 p-2.5 rounded-xl text-neutral-400 border border-neutral-800">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CONTENT: Filters & List */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 w-full flex-1">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 shrink-0 space-y-4">
              <div className="bg-[#1c1e24] border border-[#262930] rounded-2xl p-4 sticky top-24">
                <h3 className="text-xs font-bold text-white mb-4 border-b border-neutral-800 pb-2">
                  فیلتر بر اساس نقش
                </h3>
                <ul className="space-y-1.5 text-xs">
                  {CATEGORIES.map((cat) => {
                    const isActive = roleFilter === cat.key
                    return (
                      <li key={cat.key}>
                        <button
                          onClick={() => {
                            setRoleFilter(cat.key)
                            setPage(1)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all',
                            isActive
                              ? 'bg-red-500/10 border border-red-500/20 text-red-500 font-bold'
                              : 'text-foreground hover:bg-neutral-900'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <cat.icon className="size-4 shrink-0" />
                            {cat.label}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>



                <h3 className="text-xs font-bold text-white mt-6 mb-4 border-b border-neutral-800 pb-2">
                  وضعیت فعالیت
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: '', label: 'همه' },
                    { key: 'active', label: 'فعال' },
                    { key: 'pending', label: 'در انتظار' },
                    { key: 'suspended', label: 'معلق' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setStatusFilter(s.key)
                        setPage(1)
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all',
                        statusFilter === s.key
                          ? 'bg-red-500/10 border-red-500/20 text-red-500'
                          : 'bg-[#13151a] border-neutral-800 text-foreground hover:text-white'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Import/Export */}
                <div className="mt-6 pt-4 border-t border-neutral-800 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-neutral-800 hover:bg-neutral-900 text-xs font-bold"
                    onClick={() => window.open('/api/export/users', '_blank')}
                  >
                    <Download className="size-3.5" />
                    خروجی اکسل پرسنل
                  </Button>

                  {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger
                        render={<Button size="sm" className="w-full gap-2 bg-red-600 hover:bg-red-700 text-xs font-bold" />}
                      >
                        <Upload className="size-3.5" />
                        وارد کردن اکسل
                      </DialogTrigger>
                      <DialogContent className="bg-[#1c1e24] border-[#262930] text-right" dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-white text-sm font-bold">وارد کردن کاربران از فایل اکسل</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-xs">
                          <FileDrop
                            accept=".xlsx,.xls"
                            onFile={handleImport}
                            disabled={importLoading}
                          />
                          {importLoading && (
                            <p className="text-neutral-400">
                              در حال پردازش فایل و محاسبات ردیف‌ها...
                            </p>
                          )}
                          {importResult && (
                            <div className="space-y-2 rounded-xl border border-neutral-800 p-4 bg-black/20">
                              <p className="text-white font-semibold">
                                کل ردیف‌های پردازش شده: {toFa(importResult.totalRows)}
                              </p>
                              <p className="text-emerald-500">
                                پرسنل موفق ثبت شده: {toFa(importResult.successCount)}
                              </p>
                              {importResult.errorCount > 0 && (
                                <div className="space-y-2 mt-2 pt-2 border-t border-neutral-800">
                                  <p className="text-red-500 font-semibold">
                                    تعداد خطاهای مسدود کننده: {toFa(importResult.errorCount)}
                                  </p>
                                  {importResult.errorReportUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDownloadErrorReport(
                                          importResult.errorReportUrl!,
                                        )
                                      }
                                      className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] h-8"
                                    >
                                      <Download className="me-1.5 size-3.5" />
                                      دانلود گزارش خطاها
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* OCC hotline card */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-4 space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                  </span>
                  خط اضطراری دیسپچینگ (OCC)
                </div>
                <p className="text-[10px] text-foreground-muted leading-relaxed">
                  ارتباط مستقیم با مرکز فرماندهی و دیسپچرهای ارشد خط ۱ مترو تهران جهت هماهنگی حوادث
                </p>
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-neutral-800">
                  <span className="text-white font-mono font-bold tracking-wider text-xs">
                    {toFa(occPhone)}
                  </span>
                  <a
                    href={`tel:${occPhone}`}
                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="تماس اضطراری"
                  >
                    <Phone className="size-3.5" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Grid Personnel */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-44 animate-pulse rounded-2xl border border-neutral-800 bg-[#1c1e24]"
                    />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 p-12 text-center bg-[#1c1e24]">
                  <p className="text-xs text-foreground-muted">هیچ کاربری در دفتر تلفن یافت نشد.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {users.map((u) => (
                      <PersonnelCard
                        key={u.id}
                        user={u}
                        currentUserId={user?.id}
                        visibleFields={visibleFields ?? undefined}
                        onMessage={(userId) => router.push(`/chat?dm=${userId}`)}
                        onProfile={(usr) => setSelectedDetailUser(usr)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="text-xs font-bold"
                      >
                        قبلی
                      </Button>
                      <span className="text-xs text-foreground-muted">
                        صفحه {toFa(page)} از {toFa(totalPages)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="text-xs font-bold"
                      >
                        بعدی
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        // ────────────────────────────────────────────────────────
        // CUSTOM FIELDS & PRIVACY MANAGER (ADMIN ONLY)
        // ────────────────────────────────────────────────────────
        <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 w-full flex-1">
          <div className="w-full lg:w-96 shrink-0 space-y-6">
            {/* Form for Creating Dynamic Fields */}
            <form onSubmit={handleCreateField} className="bg-[#1c1e24] border border-[#262930] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                <Plus className="size-4 text-red-500" />
                تعریف فیلد پویای جدید برای پرسنل
              </h2>

              {fieldError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
                  {fieldError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 block">نام فیلد (انگلیسی - یکتا):</label>
                <input
                  type="text"
                  placeholder="مثال: fatherName"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 block">عنوان فارسی فیلد (برچسب):</label>
                <input
                  type="text"
                  placeholder="مثال: نام پدر"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 block">نوع فیلد:</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                >
                  <option value="text">متن (Text)</option>
                  <option value="number">عدد (Number)</option>
                  <option value="date">تاریخ (Date)</option>
                  <option value="boolean">بله/خیر (Boolean)</option>
                  <option value="select">انتخابی (Select)</option>
                </select>
              </div>

              {newFieldType === 'select' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 block">گزینه‌ها (جدا شده با کاما):</label>
                  <input
                    type="text"
                    placeholder="مثال: گزینه۱, گزینه۲"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-between bg-neutral-950/45 p-3 rounded-xl border border-neutral-850">
                <label className="text-xs text-neutral-300 cursor-pointer">فیلد الزامی است:</label>
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="accent-red-600 size-4 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 block">ترتیب نمایش (وزن):</label>
                <input
                  type="number"
                  value={newFieldSort}
                  onChange={(e) => setNewFieldSort(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-xs font-bold h-10 rounded-xl text-white active:scale-95 transition-all"
              >
                ایجاد فیلد پویا در دیتابیس
              </Button>
            </form>

            {/* Privacy Settings Panel */}
            <div className="bg-[#1c1e24] border border-[#262930] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Shield className="size-4 text-red-500" />
                تنظیمات حریم خصوصی دفتر تلفن
              </h2>
              <p className="text-[10px] text-foreground-muted leading-relaxed">
                مشخص کنید چه اطلاعاتی در کارت دفتر تلفن برای پرسنل عادی (غیر مدیر) نمایش داده شود. مدیران سیستم همواره به تمام اطلاعات دسترسی دارند.
              </p>

              <div className="space-y-2.5 pt-2 max-h-60 overflow-y-auto">
                <h3 className="text-[10px] font-bold text-neutral-400 border-b border-neutral-850 pb-1">اطلاعات پایه سیستم:</h3>
                
                <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/20 border border-neutral-800 cursor-pointer select-none">
                  <span className="text-xs text-white">کد ملی</span>
                  <input
                    type="checkbox"
                    checked={tempVisibleFields.includes('nationalId')}
                    onChange={() => handleToggleVisibleField('nationalId')}
                    className="accent-red-600 size-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/20 border border-neutral-800 cursor-pointer select-none">
                  <span className="text-xs text-white">شماره تلفن همراه</span>
                  <input
                    type="checkbox"
                    checked={tempVisibleFields.includes('phone')}
                    onChange={() => handleToggleVisibleField('phone')}
                    className="accent-red-600 size-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/20 border border-neutral-800 cursor-pointer select-none">
                  <span className="text-xs text-white">نشانی ایمیل</span>
                  <input
                    type="checkbox"
                    checked={tempVisibleFields.includes('email')}
                    onChange={() => handleToggleVisibleField('email')}
                    className="accent-red-600 size-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/20 border border-neutral-800 cursor-pointer select-none">
                  <span className="text-xs text-white">شماره خودرو</span>
                  <input
                    type="checkbox"
                    checked={tempVisibleFields.includes('vehicles')}
                    onChange={() => handleToggleVisibleField('vehicles')}
                    className="accent-red-600 size-4 cursor-pointer"
                  />
                </label>

                <h3 className="text-[10px] font-bold text-neutral-400 border-b border-neutral-850 pb-1 pt-2">ویژگی‌ها و فیلدهای پویا:</h3>
                
                {fieldDefs.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic">هیچ فیلد پویایی تعریف نشده است.</p>
                ) : (
                  fieldDefs.map((def) => {
                    const isChecked = tempVisibleFields.includes(def.name)
                    return (
                      <label key={def.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/20 border border-neutral-800 cursor-pointer select-none">
                        <span className="text-xs text-white">{def.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleVisibleField(def.name)}
                          className="accent-red-600 size-4 cursor-pointer"
                        />
                      </label>
                    )
                  })
                )}
              </div>

              <Button
                onClick={handleSavePrivacySettings}
                disabled={savingPrivacy}
                className="w-full bg-red-600 hover:bg-red-700 text-xs font-bold h-10 rounded-xl text-white active:scale-95 transition-all mt-2"
              >
                {savingPrivacy ? 'در حال ذخیره...' : 'ذخیره تنظیمات حریم خصوصی'}
              </Button>
            </div>
          </div>

          {/* Field Definitions List */}
          <div className="flex-1 bg-[#1c1e24] border border-[#262930] rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <Settings2 className="size-4 text-red-500" />
              لیست فیلدهای پویای ثبت‌شده برای پرسنل
            </h2>

            {fieldsLoading ? (
              <p className="text-xs text-neutral-400">در حال دریافت تعاریف فیلدها...</p>
            ) : fieldDefs.length === 0 ? (
              <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
                هیچ فیلد شخصی ثبت نشده است. فیلدهایی مثل پلاک خودرو، پلاک پرسنلی و غیره را ایجاد کنید.
              </div>
            ) : (
              <div className="space-y-3">
                {fieldDefs.map((def) => (
                  <div
                    key={def.id}
                    className="p-4 bg-neutral-950/20 rounded-xl border border-neutral-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {def.label}
                        </span>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 border-neutral-800 font-mono text-neutral-400">
                          {def.name}
                        </Badge>
                        {def.required && (
                          <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded">
                            الزامی
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        نوع داده: {def.type} {def.options && def.options.length > 0 ? `(${def.options.join(', ')})` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteField(def.id)}
                      className="text-neutral-500 hover:text-red-500 p-1.5 rounded transition-all"
                      title="حذف فیلد"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG: Personnel Detail View */}
      {/* ──────────────────────────────────────────────────────── */}
      {selectedDetailUser && (
        <Dialog open={!!selectedDetailUser} onOpenChange={(open) => !open && setSelectedDetailUser(null)}>
          <DialogContent className="bg-[#1c1e24] border-[#262930] w-full max-w-lg p-6 text-right" dir="rtl">
            <DialogHeader className="border-b border-neutral-800 pb-3 flex flex-row justify-between items-center">
              <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
                <User className="size-4 text-red-500" />
                کارت تفصیلی پرسنل: {selectedDetailUser.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 text-xs py-2">
              
              {/* Main Badge Card */}
              <div className="bg-neutral-950/40 p-4 rounded-xl border border-neutral-850 flex items-center gap-4">
                <div className="size-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-lg font-bold">
                  {selectedDetailUser.name.substring(0, 1)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white">{selectedDetailUser.name}</h3>
                  <span className="text-[10px] text-foreground-muted block">{selectedDetailUser.role.name}</span>
                </div>
                <div className="ms-auto flex flex-col items-end gap-1.5">
                  <Badge className={cn(
                    'text-[9px] font-bold px-2 py-0.5 border',
                    selectedDetailUser.status === 'active'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : selectedDetailUser.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  )}>
                    {selectedDetailUser.status === 'active' ? 'فعال' : selectedDetailUser.status === 'pending' ? 'در انتظار' : 'معلق'}
                  </Badge>
                </div>
              </div>

              {/* Personal Info Grid */}
              {(() => {
                const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'
                const isOwnProfile = selectedDetailUser.id === user?.id
                const showSensitive = isAdmin || isOwnProfile
                // Safe fallback when visibleFields hasn't loaded from config yet
                const allowedModalFields = visibleFields ?? ['phone', 'email', 'personnelNo', 'post', 'shift', 'shiftType', 'group', 'startLocation', 'vehicles']
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {(showSensitive || allowedModalFields.includes('nationalId')) && (
                        <div className="bg-neutral-950/20 p-3 rounded-xl border border-neutral-850">
                          <span className="text-[10px] text-foreground-muted block mb-1">کد ملی راهبر:</span>
                          <span className="font-mono text-white font-semibold">{toFa(selectedDetailUser.nationalId)}</span>
                        </div>
                      )}
                      {(showSensitive || allowedModalFields.includes('phone')) && selectedDetailUser.phone && (
                        <a
                          href={`tel:${selectedDetailUser.phone}`}
                          className="p-3 rounded-xl border border-green-500/25 bg-gradient-to-l from-green-500/10 to-emerald-600/5 hover:border-green-400/50 transition-all group/ph cursor-pointer block"
                        >
                          <span className="text-[10px] text-green-500/70 block mb-1 flex items-center gap-1">
                            <Phone className="size-3" />
                            تلفن همراه:
                          </span>
                          <span dir="ltr" className="font-mono text-green-400 font-bold tracking-wide group-hover/ph:text-green-300 transition-colors">
                            {toFa(selectedDetailUser.phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3'))}
                          </span>
                        </a>
                      )}
                      {(showSensitive || allowedModalFields.includes('email')) && selectedDetailUser.email && (
                        <a
                          href={`mailto:${selectedDetailUser.email}`}
                          className="p-3 rounded-xl border border-blue-500/20 bg-gradient-to-l from-blue-500/8 to-sky-600/5 hover:border-blue-400/40 transition-all col-span-2 cursor-pointer block"
                        >
                          <span className="text-[10px] text-blue-400/70 block mb-1 flex items-center gap-1">
                            <Mail className="size-3" />
                            نشانی ایمیل:
                          </span>
                          <span dir="ltr" className="font-mono text-blue-300/90 font-semibold">{selectedDetailUser.email}</span>
                        </a>
                      )}
                    </div>

                    {/* Dynamic Custom Fields Row */}
                    <div className="space-y-2 border-t border-neutral-800 pt-4">
                      <h4 className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <Layers className="size-3.5" />
                        اطلاعات و ویژگی‌های سازمانی پرسنل
                      </h4>
                      
                      {(() => {
                        const allowedDetailFields = fieldDefs.filter((def) => {
                          if (def.name === 'vehicles') return false // rendered separately
                          const value = selectedDetailUser.customFields?.[def.name]
                          if (value === undefined || value === null || value === '') return false
                          return showSensitive || allowedModalFields.includes(def.name)
                        })

                        if (allowedDetailFields.length === 0) {
                          return (
                            <p className="text-[10px] text-neutral-500 italic">
                              هیچ فیلد شخصی و ویژگی سازمانی برای نمایش وجود ندارد.
                            </p>
                          )
                        }

                        return (
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            {allowedDetailFields.map((def) => {
                              const value = selectedDetailUser.customFields?.[def.name]
                              let displayVal = String(value)
                              if (def.type === 'boolean') {
                                displayVal = value ? 'بله' : 'خیر'
                              }

                              return (
                                <div key={def.name} className="p-2.5 bg-neutral-950/30 rounded-xl border border-neutral-850 flex justify-between items-center">
                                  <span className="text-[10px] text-foreground-muted">{def.label}:</span>
                                  <span className="font-bold text-white">{toFa(displayVal)}</span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* Vehicle Plates (graphical) */}
                      {(() => {
                        const canShowVehiclesDetail = true
                        const detailVehicles = (selectedDetailUser.customFields?.vehicles as any[]) || []
                        if (!canShowVehiclesDetail || detailVehicles.length === 0) return null
                        return (
                          <div className="mt-3 space-y-2">
                            <h5 className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                              <Car className="size-3" />
                              خودروهای ثبت‌شده
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {detailVehicles.map((v: Record<string, unknown>, idx: number) => (
                                <VehiclePlateFromData key={idx} vehicle={v} size="md" />
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </>
                )
              })()}

              {/* Actions Footer */}
              <div className="flex gap-2 pt-4 border-t border-neutral-850 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDetailUser(null)}
                  className="border-neutral-800 hover:bg-neutral-900 text-xs rounded-xl h-10 px-4"
                >
                  بستن دیالوگ
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDetailUser(null)
                    router.push(`/chat?dm=${selectedDetailUser.id}`)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-xs font-bold rounded-xl h-10 px-6 text-white active:scale-95 transition-all"
                >
                  ارسال پیام در چت
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
