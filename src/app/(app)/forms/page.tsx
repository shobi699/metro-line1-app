'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import {
  FileText,
  Plus,
  RefreshCw,
  Printer,
  AlertTriangle,
  XCircle,
  Eye,
  CornerUpLeft,
  Search,
  Clock,
  CheckCircle,
  Inbox,
  Send,
  X,
  Check,
  CornerDownLeft,
  MessageSquare,
  ShieldAlert,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  ArrowLeftRight,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

/* ────────────────────────────────── Types ─────────────────────────────────── */

interface FormTemplate {
  id: string
  key: string
  title: string
  description: string | null
  category: string | null
  icon: string | null
  allowMobile: boolean
}

interface Submission {
  id: string
  submissionNo: number
  status: string
  currentStage: string | null
  createdAt: string
  closedAt: string | null
  amount: number | null
  slaDueAt: string | null
  targetDate: string | null
  data: Record<string, any>
  template: { title: string; key: string }
  submitter?: { name: string; phone?: string | null }
  version?: {
    schema: { fields: any[]; layout?: any[] }
    workflow: { stages: any[] }
  }
  steps?: any[]
  logs?: any[]
}

/* ────────────────────────────── Config Maps ───────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال شده',
  in_review: 'در حال بررسی',
  needs_changes: 'نیاز به اصلاح',
  approved: 'تایید نهایی',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-neutral-800/50 text-neutral-400 border-neutral-700',
  submitted: 'bg-info/10 text-info border-info/30',
  in_review: 'bg-accent/10 text-accent border-accent/30',
  needs_changes: 'bg-warning/10 text-warning border-warning/30 animate-pulse',
  approved: 'bg-success/10 text-success border-success/30',
  rejected: 'bg-critical/10 text-critical border-critical/30',
  cancelled: 'bg-neutral-800/50 text-neutral-500 border-neutral-700',
}

const CATEGORY_ICONS: Record<string, string> = {
  'منابع انسانی': '👔',
  'عملیات': '🚇',
  'ایمنی': '🛡️',
  'فنی': '🔧',
  'مالی': '💰',
  'آموزش': '📚',
  'عمومی': '📋',
}

const REFERABLE_ROLES = [
  { value: 'safety', label: 'واحد ایمنی' },
  { value: 'dispatch_tech', label: 'تکنسین اعزام پذیرش' },
  { value: 'chief', label: 'رئیس خط' },
  { value: 'manager', label: 'مدیر ارشد' },
  { value: 'finance', label: 'واحد مالی' },
  { value: 'hr', label: 'منابع انسانی' },
]

/* ──────────────────────────────── Helpers ─────────────────────────────────── */

function slaLabel(dueStr: string | null): { text: string; color: string } {
  if (!dueStr) return { text: '—', color: 'text-foreground-muted' }
  const due = new Date(dueStr)
  const now = new Date()
  const diffH = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (diffH < 0) return { text: 'نقض SLA ⚠️', color: 'text-critical' }
  if (diffH < 6) return { text: `${toFa(Math.ceil(diffH))} ساعت`, color: 'text-warning' }
  if (diffH < 24) return { text: `${toFa(Math.ceil(diffH))} ساعت`, color: 'text-foreground-muted' }
  return { text: `${toFa(Math.floor(diffH / 24))} روز`, color: 'text-foreground-muted' }
}

/* ═══════════════════════════════ COMPONENT ════════════════════════════════ */

export default function PersonnelFormsPage() {
  const { accessToken } = useAuthStore()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  /* ── Tabs ── */
  type TabKey = 'catalog' | 'my' | 'inbox'
  const [activeTab, setActiveTab] = useState<TabKey>('catalog')

  /* ── Data ── */
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [inboxItems, setInboxItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  /* ── Detail Modal ── */
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  /* ── Edit/Resubmit ── */
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [resubmitting, setResubmitting] = useState(false)

  /* ── Review (Inbox) ── */
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewItem, setReviewItem] = useState<Submission | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes' | 'refer' | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [referRole, setReferRole] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  /* ────────────────────────────── Data Fetching ──────────────────────────── */

  useEffect(() => {
    loadAll()
  }, [accessToken])

  useEffect(() => {
    if (activeTab === 'inbox' && inboxItems.length === 0) loadInbox()
  }, [activeTab])

  async function loadAll() {
    setLoading(true)
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/api/forms', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/forms/submissions/my', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      if (tRes.ok) {
        const tJson = await tRes.json()
        setTemplates(tJson.data || [])
      }
      if (sRes.ok) {
        const sJson = await sRes.json()
        setSubmissions(sJson.data || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function loadInbox() {
    setLoading(true)
    try {
      const res = await fetch('/api/forms/inbox', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setInboxItems(json.data || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  /* ────────────────────────────── Actions ────────────────────────────────── */

  async function handleCancelSubmission(id: string) {
    if (!confirm('آیا از لغو این درخواست اطمینان دارید؟')) return
    try {
      const res = await fetch(`/api/forms/submissions/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        alert('درخواست شما با موفقیت لغو گردید.')
        loadAll()
      } else {
        const err = await res.json()
        alert(err.error || 'عملیات لغو ناموفق بود.')
      }
    } catch { /* silent */ }
  }

  async function handleViewDetails(id: string) {
    setLoadingDetails(true)
    setShowDetailModal(true)
    try {
      const res = await fetch(`/api/forms/submissions/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSelectedSub(json.data)
      }
    } catch { /* silent */ }
    finally { setLoadingDetails(false) }
  }

  async function handleResubmit() {
    if (!selectedSub) return
    setResubmitting(true)
    try {
      const res = await fetch(`/api/forms/submissions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ data: editData }),
      })
      if (res.ok) {
        alert('درخواست اصلاح‌شده شما با موفقیت مجدداً ارسال گردید.')
        setShowEditModal(false)
        setShowDetailModal(false)
        loadAll()
      } else {
        const json = await res.json()
        if (json.validationErrors) {
          alert('لطفا مقادیر ورودی را بررسی نمایید:\n' + Object.values(json.validationErrors).join('\n'))
        } else {
          alert(json.error || 'خطا در ثبت نهایی')
        }
      }
    } catch { /* silent */ }
    finally { setResubmitting(false) }
  }

  async function handleOpenReview(item: Submission) {
    setLoadingDetails(true)
    setShowReviewModal(true)
    setReviewNote('')
    setReferRole('')
    setActionType(null)
    try {
      const res = await fetch(`/api/forms/submissions/${item.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setReviewItem(json.data)
      }
    } catch { /* silent */ }
    finally { setLoadingDetails(false) }
  }

  async function handleSubmitAction() {
    if (!reviewItem || !actionType) return
    if (actionType === 'refer' && !referRole) {
      alert('لطفا نقش ارجاع‌شونده را انتخاب کنید.')
      return
    }
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/forms/submissions/${reviewItem.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          decision: actionType,
          note: reviewNote.trim() || undefined,
          referTo: actionType === 'refer' ? referRole : undefined,
        }),
      })
      if (res.ok) {
        alert('اقدام شما با موفقیت ثبت و درخواست منتقل شد.')
        setShowReviewModal(false)
        loadInbox()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت اقدام بررسی.')
      }
    } catch { /* silent */ }
    finally { setSubmittingAction(false) }
  }

  /* ────────────────────────────── Computed ───────────────────────────────── */

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    return templates.filter((t) =>
      t.title.includes(searchQuery) || t.description?.includes(searchQuery) || t.category?.includes(searchQuery)
    )
  }, [templates, searchQuery])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, FormTemplate[]> = {}
    for (const t of filteredTemplates) {
      const cat = t.category || 'عمومی'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    }
    return groups
  }, [filteredTemplates])

  const filteredSubmissions = useMemo(() => {
    if (filterStatus === 'all') return submissions
    return submissions.filter((s) => s.status === filterStatus)
  }, [submissions, filterStatus])

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'submitted' || s.status === 'in_review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    needsChanges: submissions.filter((s) => s.status === 'needs_changes').length,
  }), [submissions])

  /* ════════════════════════════════ RENDER ════════════════════════════════ */

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<any>; badge?: number; adminOnly?: boolean }[] = [
    { key: 'catalog', label: 'فرم‌های قابل ثبت', icon: FolderOpen },
    { key: 'my', label: 'درخواست‌های من', icon: FileText, badge: stats.needsChanges > 0 ? stats.needsChanges : undefined },
    { key: 'inbox', label: 'کارتابل تاییدات', icon: Inbox, badge: inboxItems.length > 0 ? inboxItems.length : undefined },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 md:p-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2 select-none">
            <FileText className="size-6 text-accent" />
            فرم‌ها و درخواست‌های سازمانی
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            ارسال فرم‌های دیجیتال، پیگیری زنده وضعیت و تایید/رد درخواست‌های همکاران
          </p>
        </div>
        <Button onClick={() => { loadAll(); loadInbox() }} variant="outline" size="sm" className="h-8 text-xs cursor-pointer gap-1 shrink-0">
          <RefreshCw className="size-3.5" />
          به‌روزرسانی
        </Button>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'pb-2 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                activeTab === t.key
                  ? 'border-accent text-accent font-extrabold'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {t.badge && t.badge > 0 && (
                <span className="bg-critical text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {toFa(t.badge)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ═══════════════════ TAB: CATALOG ═══════════════════ */}
      {activeTab === 'catalog' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-2.5 size-4 text-foreground-muted" />
            <Input
              placeholder="جستجوی فرم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-neutral-950/40 text-xs h-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              <FolderOpen className="size-8 mx-auto mb-2 text-foreground-muted" />
              هیچ فرم فعالی در دسترسی نقش کاربری شما یافت نشد.
            </Card>
          ) : (
            Object.entries(groupedTemplates).map(([category, forms]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 select-none">
                  <span>{CATEGORY_ICONS[category] || '📋'}</span>
                  {category}
                  <Badge variant="outline" className="text-[8px] font-bold text-foreground-muted">
                    {toFa(forms.length)} فرم
                  </Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forms.map((form) => (
                    <Link href={`/forms/${form.key}/submit`} key={form.id}>
                      <Card className="bg-surface-container-low border-border/40 hover:border-accent/40 transition-all cursor-pointer h-full group">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground group-hover:text-accent transition">{form.title}</span>
                            <Plus className="size-4 text-foreground-muted group-hover:text-accent transition" />
                          </div>
                          {form.description && (
                            <p className="text-[10px] text-foreground-muted leading-relaxed line-clamp-2">{form.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-[9px] text-foreground-muted pt-1">
                            {form.allowMobile && <span>📱 موبایل</span>}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: MY SUBMISSIONS ═══════════════════ */}
      {activeTab === 'my' && (
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 select-none">
            {[
              { label: 'کل درخواست‌ها', value: stats.total, icon: FileText, color: 'text-foreground' },
              { label: 'در انتظار بررسی', value: stats.pending, icon: Clock, color: 'text-info' },
              { label: 'تایید شده', value: stats.approved, icon: CheckCircle, color: 'text-success' },
              { label: 'رد شده', value: stats.rejected, icon: XCircle, color: 'text-critical' },
              { label: 'نیاز به اصلاح', value: stats.needsChanges, icon: AlertTriangle, color: 'text-warning' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <Card key={i} className="bg-surface-container-low border-border-subtle">
                  <CardContent className="pt-3 pb-3 flex items-center gap-3 px-3">
                    <div className={cn('p-2 rounded-lg bg-neutral-900/50 border border-border/30', s.color)}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-[9px] text-foreground-muted font-bold">{s.label}</p>
                      <h3 className={cn('text-sm font-black', s.color)}>{toFa(s.value)}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-foreground-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-neutral-950/40 border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
            >
              <option value="all">همه وضعیت‌ها</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Submissions List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              <Send className="size-8 mx-auto mb-2 text-foreground-muted" />
              {filterStatus === 'all' ? 'تاکنون درخواستی ثبت نکرده‌اید.' : 'درخواستی با این وضعیت یافت نشد.'}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const sla = slaLabel(sub.slaDueAt)
                return (
                  <Card
                    key={sub.id}
                    className="bg-surface-container-low border-border/40 hover:border-accent/30 transition cursor-pointer"
                    onClick={() => handleViewDetails(sub.id)}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-border/20 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-accent" />
                          <span className="font-bold text-foreground">{sub.template.title}</span>
                          <span className="font-mono text-[10px] text-foreground-muted">R-{toFa(sub.submissionNo)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-[9px] font-extrabold', STATUS_CLASSES[sub.status])}>
                            {STATUS_LABELS[sub.status]}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-foreground-muted font-bold">
                        <div className="flex items-center gap-3">
                          <span>ثبت: {jalali(sub.createdAt)}</span>
                          {sub.currentStage && (
                            <>
                              <span>•</span>
                              <span className={sla.color}>SLA: {sla.text}</span>
                            </>
                          )}
                          {sub.amount != null && (
                            <>
                              <span>•</span>
                              <span>مقدار: {toFa(sub.amount)}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.currentStage && (
                            <span className="text-accent">مرحله: {sub.currentStage}</span>
                          )}
                          {(sub.status === 'submitted' || sub.status === 'in_review') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelSubmission(sub.id) }}
                              className="text-critical hover:underline text-[9px] cursor-pointer"
                            >
                              لغو
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Workflow Progress Bar */}
                      {sub.status !== 'draft' && sub.status !== 'cancelled' && (
                        <div className="flex items-center gap-1 pt-1">
                          {['submitted', 'in_review', 'approved'].map((step, idx) => {
                            const isReached =
                              step === 'submitted' ? true :
                              step === 'in_review' ? ['in_review', 'approved', 'rejected'].includes(sub.status) :
                              step === 'approved' ? sub.status === 'approved' : false
                            return (
                              <div key={step} className="flex items-center gap-1 flex-1">
                                <div className={cn(
                                  'h-1 flex-1 rounded-full transition-all',
                                  isReached ? 'bg-accent' : 'bg-neutral-800'
                                )} />
                              </div>
                            )
                          })}
                          {sub.status === 'rejected' && <div className="h-1 flex-1 rounded-full bg-critical" />}
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

      {/* ═══════════════════ TAB: INBOX (APPROVALS) ═══════════════════ */}
      {activeTab === 'inbox' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 select-none">
              <Inbox className="size-4 text-accent" />
              درخواست‌های منتظر اقدام شما
            </h4>
            <Button onClick={loadInbox} variant="outline" size="sm" className="h-7 text-[10px] cursor-pointer gap-1">
              <RefreshCw className="size-3" />
              به‌روزرسانی
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inboxItems.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              <CheckCircle className="size-8 mx-auto mb-2 text-success" />
              کارتابل شما خالی است. هیچ درخواست منتظر اقدامی وجود ندارد. ✅
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inboxItems.map((item) => {
                const sla = slaLabel(item.slaDueAt)
                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'bg-surface-container-low border-border/40 hover:border-accent/40 transition cursor-pointer',
                      sla.color === 'text-critical' && 'border-critical/30'
                    )}
                    onClick={() => handleOpenReview(item)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-accent" />
                          <span className="font-bold text-foreground">{item.template.title}</span>
                        </div>
                        <span className="font-mono text-[10px] text-foreground-muted">R-{toFa(item.submissionNo)}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-foreground-muted font-bold">
                        <span>فرستنده: {item.submitter?.name || '—'}</span>
                        <span className={sla.color}>SLA: {sla.text}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-border/20">
                        <span className="text-[9px] text-foreground-muted">{jalali(item.createdAt)}</span>
                        <Button size="sm" className="bg-accent hover:bg-accent-hover text-white font-bold h-7 text-[10px] cursor-pointer gap-1">
                          <ShieldAlert className="size-3" />
                          بررسی و اقدام
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ DETAIL MODAL ═══════════════════ */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          {loadingDetails ? (
            <div className="p-10 text-center text-xs text-foreground-muted">
              <div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3">در حال بارگذاری جزئیات درخواست...</p>
            </div>
          ) : selectedSub && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground flex items-center gap-2">
                  درخواست R-{toFa(selectedSub.submissionNo)} — {selectedSub.template.title}
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">
                  جزئیات داده‌ها، تایم‌لاین مراحل و امضاهای گردش‌کار
                </DialogDescription>
              </DialogHeader>

              {/* Status Badge */}
              <div className="flex items-center gap-2 py-1">
                <Badge variant="outline" className={cn('text-[10px] font-extrabold', STATUS_CLASSES[selectedSub.status])}>
                  {STATUS_LABELS[selectedSub.status]}
                </Badge>
                {selectedSub.currentStage && (
                  <span className="text-[10px] text-foreground-muted">— مرحله: {selectedSub.currentStage}</span>
                )}
              </div>

              {/* Form Data */}
              <div className="space-y-2 border-b border-border/40 pb-4">
                <span className="text-xs font-bold text-foreground">پاسخ‌های ثبت شده:</span>
                <div className="grid grid-cols-1 gap-2 bg-neutral-950/20 p-3 rounded-lg border border-border/40 text-xs">
                  {selectedSub.version?.schema?.fields?.map((f: any) => (
                    <div key={f.name} className="flex justify-between border-b border-border/20 py-1.5 last:border-0">
                      <span className="text-foreground-muted">{f.label}:</span>
                      <span className="font-bold text-foreground">
                        {selectedSub.data[f.name] === true ? 'بله' : selectedSub.data[f.name] === false ? 'خیر' : String(selectedSub.data[f.name] ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {selectedSub.steps && selectedSub.steps.length > 0 && (
                <div className="space-y-3 pb-4">
                  <span className="text-xs font-bold text-foreground">تایم‌لاین گردش‌کار و امضاها:</span>
                  <div className="relative border-s-2 border-neutral-800 ms-2 space-y-4">
                    {selectedSub.steps.map((step: any) => (
                      <div key={step.id} className="relative ps-5">
                        <span className={cn(
                          'absolute -start-[6px] top-1.5 w-3 h-3 rounded-full border-2 border-background',
                          step.decision === 'approve' ? 'bg-success' :
                          step.decision === 'reject' ? 'bg-critical' :
                          step.decision === 'request_changes' ? 'bg-warning' :
                          step.decision === 'refer' ? 'bg-accent' :
                          'bg-neutral-700 animate-pulse'
                        )} />
                        <div className="text-xs flex justify-between">
                          <span className="font-bold text-foreground">{step.stageTitle}</span>
                          <span className="text-[10px] text-foreground-muted">
                            {step.decidedAt ? jalali(step.decidedAt) : '⏳ در انتظار'}
                          </span>
                        </div>
                        {step.decidedBy?.name && (
                          <div className="text-[10px] text-foreground-muted mt-0.5">
                            بررسی‌کننده: {step.decidedBy.name}
                          </div>
                        )}
                        {step.note && (
                          <p className="text-[10px] text-foreground-muted bg-neutral-900/40 border border-border/30 p-2 rounded mt-1 leading-relaxed">
                            {step.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button
                  onClick={() => window.open(`/api/forms/submissions/${selectedSub.id}/print`)}
                  variant="outline"
                  className="text-xs h-8 gap-1 cursor-pointer"
                >
                  <Printer className="size-4" />
                  چاپ رسمی
                </Button>

                {selectedSub.status === 'needs_changes' && (
                  <Button
                    onClick={() => {
                      setEditData(selectedSub.data)
                      setShowEditModal(true)
                    }}
                    className="bg-warning hover:bg-warning/80 text-black text-xs h-8 font-semibold gap-1 cursor-pointer"
                  >
                    <CornerUpLeft className="size-4" />
                    اصلاح و ارسال مجدد
                  </Button>
                )}

                <Button variant="ghost" onClick={() => setShowDetailModal(false)} className="text-xs h-8 cursor-pointer">
                  بستن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ EDIT MODAL ═══════════════════ */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
          {selectedSub && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground">
                  اصلاح و تکمیل مجدد درخواست
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">
                  مقادیر فیلدها را اصلاح کرده و دکمه ارسال مجدد را بزنید.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs py-2">
                {selectedSub.version?.schema?.fields?.map((f: any) => {
                  if (f.type === 'formula') return null
                  return (
                    <div key={f.name} className="space-y-1">
                      <label className="font-semibold text-foreground">{f.label} {f.required && <span className="text-critical">*</span>}</label>

                      {f.type === 'textarea' ? (
                        <Textarea
                          value={editData[f.name] ?? ''}
                          onChange={(e) => setEditData({ ...editData, [f.name]: e.target.value })}
                          className="min-h-16 text-xs"
                        />
                      ) : f.type === 'select' ? (
                        <Select
                          value={editData[f.name] ?? ''}
                          onValueChange={(val) => setEditData({ ...editData, [f.name]: val })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="انتخاب کنید..." />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options?.map((opt: string) => (
                              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={editData[f.name] ?? ''}
                          onChange={(e) => setEditData({ ...editData, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-xs h-8 cursor-pointer">انصراف</Button>
                <Button
                  onClick={handleResubmit}
                  disabled={resubmitting}
                  className="bg-success hover:bg-success/80 text-white font-semibold text-xs h-8 cursor-pointer"
                >
                  {resubmitting ? 'در حال ارسال...' : 'ارسال مجدد درخواست'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ REVIEW MODAL (INBOX) ═══════════════════ */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          {loadingDetails ? (
            <div className="p-10 text-center text-xs text-foreground-muted">
              <div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3">در حال بارگذاری مدارک پرونده...</p>
            </div>
          ) : reviewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground flex items-center gap-2">
                  <ShieldAlert className="size-4 text-accent" />
                  بررسی درخواست R-{toFa(reviewItem.submissionNo)}
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">
                  تایید یا تغییر وضعیت درخواست پرسنل
                </DialogDescription>
              </DialogHeader>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-950/30 p-3 rounded-lg border border-border/20">
                <div><strong className="text-foreground-muted">فرم:</strong> {reviewItem.template.title}</div>
                <div><strong className="text-foreground-muted">متقاضی:</strong> {reviewItem.submitter?.name || '—'}</div>
              </div>

              {/* Form Data */}
              <div className="space-y-2 border-b border-border/40 pb-4">
                <span className="text-xs font-bold text-foreground">داده‌های تکمیل‌شده:</span>
                <div className="grid grid-cols-1 gap-2 bg-neutral-950/20 p-3 rounded-lg border border-border/40 text-xs">
                  {reviewItem.version?.schema?.fields?.map((f: any) => (
                    <div key={f.name} className="flex justify-between border-b border-border/20 py-1.5 last:border-0">
                      <span className="text-foreground-muted">{f.label}:</span>
                      <span className="font-bold text-foreground">
                        {reviewItem.data[f.name] === true ? 'بله' : reviewItem.data[f.name] === false ? 'خیر' : String(reviewItem.data[f.name] ?? '—')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-foreground">تصمیم بررسی‌کننده:</span>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'approve' as const, label: 'تایید', icon: Check, color: 'bg-success hover:bg-success/80 text-white' },
                    { key: 'reject' as const, label: 'رد', icon: X, color: 'bg-critical hover:bg-critical/80 text-white' },
                    { key: 'request_changes' as const, label: 'اصلاح', icon: CornerDownLeft, color: 'bg-warning hover:bg-warning/80 text-black' },
                    { key: 'refer' as const, label: 'ارجاع', icon: ArrowLeftRight, color: 'bg-accent hover:bg-accent-hover text-white' },
                  ].map((act) => {
                    const Icon = act.icon
                    return (
                      <Button
                        key={act.key}
                        size="sm"
                        variant={actionType === act.key ? 'default' : 'outline'}
                        onClick={() => setActionType(act.key)}
                        className={cn(
                          'text-xs h-8 gap-1 cursor-pointer font-bold',
                          actionType === act.key ? act.color : ''
                        )}
                      >
                        <Icon className="size-3.5" />
                        {act.label}
                      </Button>
                    )
                  })}
                </div>

                {actionType === 'refer' && (
                  <div className="space-y-1.5 text-xs">
                    <Label className="font-semibold text-foreground">نقش ارجاع‌شونده *</Label>
                    <Select value={referRole} onValueChange={(val) => setReferRole(val || '')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="انتخاب نقش جهت ارجاع..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value} className="text-xs">{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  <Label className="font-semibold text-foreground">یادداشت بررسی:</Label>
                  <Textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="علت رد، موارد اصلاحی یا بازخورد ارجاع..."
                    className="min-h-16 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowReviewModal(false)} className="text-xs h-8 cursor-pointer">
                  انصراف
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={submittingAction || !actionType}
                  className="bg-accent hover:bg-accent-hover text-white font-semibold text-xs h-8 cursor-pointer"
                >
                  {submittingAction ? 'در حال ثبت...' : 'ثبت قطعی اقدام'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
