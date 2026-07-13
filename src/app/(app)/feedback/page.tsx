'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import {
  MessageSquare,
  Send,
  ThumbsUp,
  AlertTriangle,
  Star,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  Users,
  Shield,
  EyeOff,
  UserCheck,
  TrendingUp,
  FileCheck,
  Zap,
  TrendingDown,
  BarChart3,
  Calendar,
  Sparkles,
  Info,
  Search,
  Copy,
  X,
  Clock,
  ArrowLeftRight,
  Inbox,
  ChevronDown,
  ChevronUp,
  Lock,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ────────────────────────────────── Types ─────────────────────────────────── */

interface Category {
  id: string
  key: string
  title: string
  icon?: string
  description?: string
  assigneeRole: string
  allowAnonymous: boolean
  forceAnonymous: boolean
  confidential: boolean
  ideaBoard: boolean
  slaHours: { firstResponse: number; resolve: number }
}

interface FeedbackMessage {
  id: string
  senderKind: 'submitter' | 'staff'
  senderId?: string | null
  body: string
  createdAt: string
  isInternal: boolean
  sender?: { name: string } | null
}

interface FeedbackItem {
  id: string
  feedbackNo: number
  type: string
  title: string
  body: string
  isAnonymous: boolean
  anonToken?: string | null
  status: string
  reply: string | null
  repliedAt: string | null
  repliedBy: string | null
  priority: string
  assigneeId: string | null
  assigneeRole: string | null
  categoryId: string | null
  slaFirstDue: string | null
  slaResolveDue: string | null
  slaBreached: boolean
  satisfaction: number | null
  isPublicIdea: boolean
  ideaVotesCount: number
  closedAt: string | null
  createdAt: string
  updatedAt: string
  user?: { name: string } | null
  category?: { title: string; key: string } | null
  messages?: FeedbackMessage[]
}

/* ────────────────────────────── Config Maps ───────────────────────────────── */

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }
> = {
  criticism: { label: 'انتقاد', icon: AlertTriangle, color: 'text-critical', bgColor: 'bg-critical/10 border-critical/20' },
  suggestion: { label: 'پیشنهاد', icon: Lightbulb, color: 'text-info', bgColor: 'bg-info/10 border-info/20' },
  complaint: { label: 'شکایت', icon: MessageCircle, color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20' },
  appreciation: { label: 'تقدیر', icon: Star, color: 'text-success', bgColor: 'bg-success/10 border-success/20' },
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'ثبت شده',
  under_review: 'در حال بررسی',
  responded: 'پاسخ داده شد',
  resolved: 'حل شده',
  closed: 'بسته شده',
  reopened: 'بازگشایی',
  referred: 'ارجاع شده',
}

const STATUS_COLOR: Record<string, string> = {
  submitted: 'bg-info/10 text-info border-info/30',
  under_review: 'bg-warning/10 text-warning border-warning/30',
  responded: 'bg-success/15 text-success border-success/30',
  resolved: 'bg-success/15 text-success border-success/30',
  closed: 'bg-neutral-800/50 text-neutral-400 border-neutral-700',
  reopened: 'bg-critical/10 text-critical border-critical/30',
  referred: 'bg-accent/10 text-accent border-accent/30',
}

const PRIORITY_COLOR: Record<string, string> = {
  normal: 'bg-neutral-800 text-neutral-300',
  high: 'bg-warning/15 text-warning',
  critical: 'bg-critical/15 text-critical animate-pulse',
}

/* ──────────────────────────────── Helpers ─────────────────────────────────── */

function slaRemainingLabel(dueDateStr: string | null): { label: string; urgent: boolean; breached: boolean } {
  if (!dueDateStr) return { label: '—', urgent: false, breached: false }
  const due = new Date(dueDateStr)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) return { label: 'نقض SLA ⚠️', urgent: true, breached: true }
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 6) return { label: `${toFa(hours)} ساعت باقیمانده`, urgent: true, breached: false }
  if (hours < 24) return { label: `${toFa(hours)} ساعت`, urgent: false, breached: false }
  const days = Math.floor(hours / 24)
  return { label: `${toFa(days)} روز`, urgent: false, breached: false }
}

/* ═══════════════════════════════ COMPONENT ════════════════════════════════ */

export default function FeedbackPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  /* ── Tabs ── */
  type TabKey = 'my' | 'track' | 'ideas' | 'inbox' | 'analytics'
  const [activeTab, setActiveTab] = useState<TabKey>('my')

  /* ── Data ── */
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [ideas, setIdeas] = useState<FeedbackItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  /* ── Form ── */
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'suggestion',
    categoryId: '',
    title: '',
    body: '',
    isAnonymous: false,
    priority: 'normal',
    isPublicIdea: false,
  })
  const [submitting, setSubmitting] = useState(false)

  /* ── Token Modal ── */
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [newAnonToken, setNewAnonToken] = useState('')
  const [newFeedbackNo, setNewFeedbackNo] = useState(0)

  /* ── Anonymous Tracking ── */
  const [trackToken, setTrackToken] = useState('')
  const [trackedFeedback, setTrackedFeedback] = useState<FeedbackItem | null>(null)
  const [trackLoading, setTrackLoading] = useState(false)

  /* ── Thread Modal ── */
  const [threadFeedback, setThreadFeedback] = useState<FeedbackItem | null>(null)
  const [threadMessages, setThreadMessages] = useState<FeedbackMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [newMsgInternal, setNewMsgInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  /* ── Staff Inbox ── */
  const [inboxItems, setInboxItems] = useState<FeedbackItem[]>([])
  const [selectedInboxItem, setSelectedInboxItem] = useState<FeedbackItem | null>(null)
  const [adminReplyText, setAdminReplyText] = useState('')

  /* ────────────────────────────── Data Fetching ──────────────────────────── */

  useEffect(() => {
    loadCategories()
  }, [accessToken])

  useEffect(() => {
    if (activeTab === 'my') loadMyFeedbacks()
    if (activeTab === 'ideas') loadIdeas()
    if (activeTab === 'inbox' && isAdmin) loadInbox()
  }, [accessToken, activeTab])

  async function loadCategories() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/feedback/categories', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const cats = json.data || []
        setCategories(cats)
        if (cats.length > 0 && !form.categoryId) {
          setForm((prev) => ({ ...prev, categoryId: cats[0].id }))
        }
      }
    } catch { /* silent */ }
  }

  async function loadMyFeedbacks() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setItems(json.data?.items ?? [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function loadIdeas() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback?isPublicIdea=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setIdeas(json.data?.items ?? [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function loadInbox() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback?pageSize=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setInboxItems(json.data?.items ?? [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  /* ────────────────────────────── Actions ────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.body) return
    setSubmitting(true)

    const selectedCat = categories.find((c) => c.id === form.categoryId)
    const isAnon = selectedCat?.forceAnonymous ? true : form.isAnonymous

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          body: form.body,
          isAnonymous: isAnon,
          categoryId: form.categoryId || undefined,
          priority: form.priority,
          isPublicIdea: selectedCat?.ideaBoard ? form.isPublicIdea : false,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data?.anonToken) {
          setNewAnonToken(json.data.anonToken)
          setNewFeedbackNo(json.data.feedbackNo)
          setShowTokenModal(true)
        } else {
          alert(`✅ پیام شما با شماره پیگیری FB-${toFa(json.data?.feedbackNo)} با موفقیت ثبت شد.`)
        }
        setForm({ type: 'suggestion', categoryId: categories[0]?.id || '', title: '', body: '', isAnonymous: false, priority: 'normal', isPublicIdea: false })
        setShowForm(false)
        loadMyFeedbacks()
      } else {
        const json = await res.json()
        alert(json.error?.message || 'خطا در ثبت پیام')
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTrackAnonymous() {
    if (!trackToken.trim()) return
    setTrackLoading(true)
    setTrackedFeedback(null)
    try {
      const res = await fetch(`/api/feedback/track/${trackToken.trim()}`)
      const json = await res.json()
      if (res.ok) {
        setTrackedFeedback(json.data)
      } else {
        alert(json.error?.message || 'بازخوردی با این توکن یافت نشد.')
      }
    } catch {
      alert('مشکل در ارتباط با سرور')
    } finally {
      setTrackLoading(false)
    }
  }

  async function handleVote(id: string) {
    if (!accessToken) return
    try {
      await fetch(`/api/feedback/${id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (activeTab === 'ideas') loadIdeas()
      else loadMyFeedbacks()
    } catch { /* silent */ }
  }

  async function openThread(fb: FeedbackItem) {
    setThreadFeedback(fb)
    setThreadMessages([])
    setThreadLoading(true)
    setNewMsg('')
    setNewMsgInternal(false)

    const tokenParam = fb.anonToken ? `?anonToken=${fb.anonToken}` : ''
    try {
      const res = await fetch(`/api/feedback/${fb.id}${tokenParam}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setThreadMessages(json.data?.messages ?? [])
      }
    } catch { /* silent */ }
    finally { setThreadLoading(false) }

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 200)
  }

  async function sendThreadMessage() {
    if (!threadFeedback || !newMsg.trim() || sending) return
    setSending(true)
    const tokenParam = threadFeedback.anonToken ? `?anonToken=${threadFeedback.anonToken}` : ''
    try {
      const res = await fetch(`/api/feedback/${threadFeedback.id}/messages${tokenParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: newMsg.trim(), isInternal: newMsgInternal }),
      })
      if (res.ok) {
        const json = await res.json()
        setThreadMessages((prev) => [...prev, json.data])
        setNewMsg('')
        setNewMsgInternal(false)
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight }), 100)
      }
    } catch { /* silent */ }
    finally { setSending(false) }
  }

  async function handleAdminReply() {
    if (!selectedInboxItem || !adminReplyText.trim()) return
    try {
      const res = await fetch(`/api/feedback/${selectedInboxItem.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: adminReplyText.trim() }),
      })
      if (res.ok) {
        alert('✅ پاسخ رسمی ثبت و ارسال شد.')
        setAdminReplyText('')
        setSelectedInboxItem(null)
        loadInbox()
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    }
  }

  async function handleSetSatisfaction(fbId: string, rating: number) {
    try {
      await fetch(`/api/feedback/${fbId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: `امتیاز رضایت: ${rating} از ۵` }),
      })
      alert('میزان رضایت شما ثبت شد. سپاس.')
    } catch { /* silent */ }
  }

  /* ────────────────────────────── Computed ───────────────────────────────── */

  const activeCat = categories.find((c) => c.id === form.categoryId)

  const stats = useMemo(() => {
    const all = activeTab === 'inbox' ? inboxItems : items
    const total = all.length
    const pending = all.filter((i) => i.status === 'submitted' || i.status === 'under_review').length
    const resolved = all.filter((i) => i.status === 'responded' || i.status === 'resolved' || i.status === 'closed').length
    const breached = all.filter((i) => i.slaBreached).length
    return { total, pending, resolved, breached }
  }, [items, inboxItems, activeTab])

  /* ════════════════════════════════ RENDER ════════════════════════════════ */

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<any>; adminOnly?: boolean }[] = [
    { key: 'my', label: 'مکاتبات من', icon: MessageSquare },
    { key: 'track', label: 'پیگیری ناشناس', icon: Lock },
    { key: 'ideas', label: 'تابلوی ایده‌ها', icon: Lightbulb },
    { key: 'inbox', label: 'کارتابل رسیدگی', icon: Inbox, adminOnly: true },
    { key: 'analytics', label: 'داشبورد تحلیلی', icon: BarChart3 },
  ]

  return (
    <div className="flex flex-1 flex-col gap-5 p-4 md:p-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2 select-none">
            <MessageSquare className="size-6 text-accent" />
            سامانه صدای کارکنان — بازخورد و پیام سازمانی
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            ثبت بازخورد رسمی، گفتگوی دوطرفه، پیگیری ناشناس، تابلوی ایده‌ها و تحلیل روند
          </p>
        </div>
        {activeTab === 'my' && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs font-bold cursor-pointer shrink-0">
            <Send className="size-4" />
            ثبت بازخورد جدید
          </Button>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        {tabs
          .filter((t) => !t.adminOnly || isAdmin)
          .map((t) => {
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
              </button>
            )
          })}
      </div>

      {/* ─── Stats Quick Cards ─── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 select-none">
        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">کل مکاتبات</p>
              <h3 className="text-base font-black mt-1 text-foreground">{toFa(stats.total)} پرونده</h3>
            </div>
            <div className="bg-neutral-800 p-2.5 rounded-lg text-neutral-300 border border-neutral-700">
              <Send className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">در صف رسیدگی</p>
              <h3 className="text-base font-black mt-1 text-warning">{toFa(stats.pending)} تیکت</h3>
            </div>
            <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
              <Clock className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">پاسخ‌ داده‌ شده</p>
              <h3 className="text-base font-black mt-1 text-success">{toFa(stats.resolved)} مورد</h3>
            </div>
            <div className="bg-success/10 p-2.5 rounded-lg text-success">
              <CheckCircle className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">نقض SLA</p>
              <h3 className={cn('text-base font-black mt-1', stats.breached > 0 ? 'text-critical' : 'text-success')}>{toFa(stats.breached)} مورد</h3>
            </div>
            <div className={cn('p-2.5 rounded-lg', stats.breached > 0 ? 'bg-critical/10 text-critical' : 'bg-success/10 text-success')}>
              <AlertTriangle className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════ NEW FEEDBACK FORM ═══════════════════ */}
      {showForm && activeTab === 'my' && (
        <Card className="bg-surface-container-low border-border-subtle">
          <CardHeader>
            <CardTitle className="text-xs font-black">ارسال بازخورد جدید</CardTitle>
            <CardDescription className="text-[10px]">
              اطلاعات ثبت شده رمزنگاری شده و مستقیماً به مسئول مربوطه ارسال می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Category Selector */}
                {categories.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">دسته‌بندی بازخورد:</Label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.id === e.target.value)
                        setForm({
                          ...form,
                          categoryId: e.target.value,
                          isAnonymous: cat?.forceAnonymous ? true : false,
                        })
                      }}
                      className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                    {activeCat?.description && (
                      <p className="text-[9px] text-foreground-muted font-normal mt-1 flex items-start gap-1">
                        <Info className="size-3 shrink-0 mt-px text-info" />
                        {activeCat.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Type Selector */}
                <div className="space-y-1">
                  <Label className="text-[11px]">نوع پیام:</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="suggestion">💡 پیشنهاد بهبود</option>
                    <option value="criticism">⚠️ انتقاد سازنده</option>
                    <option value="complaint">💬 شکایت اداری / پرسنلی</option>
                    <option value="appreciation">⭐ تقدیر و تشکر</option>
                  </select>
                </div>

                {/* Anonymous + Priority Row */}
                <div className="space-y-2">
                  {/* Anonymity */}
                  {activeCat?.forceAnonymous ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-warning/40 bg-warning/5 text-warning text-[10px]">
                      <EyeOff className="size-4 shrink-0" />
                      <span>این دسته الزاماً ناشناس ثبت می‌شود</span>
                    </div>
                  ) : activeCat?.allowAnonymous !== false ? (
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-neutral-950/20 cursor-pointer w-full justify-between select-none">
                      <span className="flex items-center gap-1.5">
                        <EyeOff className="size-4 text-warning" />
                        <span>ارسال ناشناس:</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={form.isAnonymous}
                        onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                        className="size-4 cursor-pointer"
                      />
                    </label>
                  ) : null}

                  {/* Priority */}
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="normal">اولویت عادی</option>
                    <option value="high">اولویت بالا / فوری</option>
                    <option value="critical">بحرانی — نیازمند اقدام فوری</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <Label className="text-[11px]">موضوع:</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="موضوع پیام..." className="bg-neutral-950/40" />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <Label className="text-[11px]">شرح کامل:</Label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="متن بازخورد شما..."
                  rows={4}
                  className="w-full bg-neutral-950/40 border border-border rounded-lg p-3 outline-none focus:border-accent text-xs resize-none"
                />
              </div>

              {/* Idea Board Toggle */}
              {activeCat?.ideaBoard && (
                <label className="flex items-center gap-2 text-[10px] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublicIdea}
                    onChange={(e) => setForm({ ...form, isPublicIdea: e.target.checked })}
                    className="size-3.5"
                  />
                  <Lightbulb className="size-3.5 text-accent" />
                  <span>انتشار روی تابلوی ایده‌های عمومی</span>
                </label>
              )}

              {/* Anonymous Warning */}
              {form.isAnonymous && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg text-[10px] text-warning font-normal flex items-start gap-2">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>
                    پس از ثبت ناشناس، توکن امنیتی پیگیری صادر خواهد شد. بدون این توکن امکان مشاهده پاسخ وجود ندارد. لطفاً آن را ذخیره نمایید.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-xs cursor-pointer">
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting} className="text-xs cursor-pointer bg-accent hover:bg-accent-hover text-white">
                  {submitting ? '⏳ در حال ارسال...' : 'ارسال بازخورد رسمی'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════ TAB: MY FEEDBACKS ═══════════════════ */}
      {activeTab === 'my' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              بازخوردی ثبت نشده است. برای شروع، دکمه «ثبت بازخورد جدید» را بزنید.
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.suggestion
                const TypeIcon = typeConf.icon
                const sla = slaRemainingLabel(item.slaResolveDue)
                return (
                  <Card
                    key={item.id}
                    className="bg-surface-container-low border-border/40 hover:border-accent/30 transition cursor-pointer"
                    onClick={() => openThread(item)}
                  >
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between flex-wrap gap-2 pb-2 border-b border-border/20 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded border', typeConf.bgColor)}>
                            <TypeIcon className={cn('size-4', typeConf.color)} />
                          </div>
                          <span className="font-bold text-foreground">{item.title}</span>
                          <span className="font-mono text-[10px] text-foreground-muted">FB-{toFa(item.feedbackNo)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-[9px] font-extrabold', PRIORITY_COLOR[item.priority])}>
                            {item.priority === 'critical' ? 'بحرانی' : item.priority === 'high' ? 'فوری' : 'عادی'}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[9px] font-extrabold', STATUS_COLOR[item.status])}>
                            {STATUS_LABEL[item.status]}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-foreground-muted leading-relaxed font-bold line-clamp-2">{item.body}</p>

                      <div className="flex items-center justify-between text-[9px] text-foreground-muted font-bold pt-1">
                        <div className="flex items-center gap-3">
                          <span>ثبت: {jalali(item.createdAt)}</span>
                          <span>•</span>
                          <span className={cn(sla.breached && 'text-critical', sla.urgent && !sla.breached && 'text-warning')}>
                            SLA: {sla.label}
                          </span>
                          {item.category && <><span>•</span><span>{item.category.title}</span></>}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isAnonymous ? (
                            <span className="text-warning flex items-center gap-1"><EyeOff className="size-3" /> ناشناس</span>
                          ) : (
                            <span className="text-accent flex items-center gap-1"><UserCheck className="size-3" /> {item.user?.name}</span>
                          )}
                          {item.isPublicIdea && (
                            <button onClick={(e) => { e.stopPropagation(); handleVote(item.id) }} className="flex items-center gap-1 text-accent hover:scale-110 transition">
                              <ThumbsUp className="size-3" /> {toFa(item.ideaVotesCount)}
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: ANONYMOUS TRACKING ═══════════════════ */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <Card className="bg-surface-container-low border-border-subtle">
            <CardHeader>
              <CardTitle className="text-xs font-black flex items-center gap-2">
                <Lock className="size-4 text-warning" />
                پیگیری پرونده ناشناس با توکن امنیتی
              </CardTitle>
              <CardDescription className="text-[10px]">
                توکن پیگیری خود را که هنگام ثبت ناشناس دریافت کرده‌اید وارد نمایید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={trackToken}
                  onChange={(e) => setTrackToken(e.target.value)}
                  placeholder="توکن امنیتی پیگیری ناشناس..."
                  className="bg-neutral-950/40 font-mono text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackAnonymous()}
                />
                <Button onClick={handleTrackAnonymous} disabled={trackLoading} className="text-xs cursor-pointer shrink-0 gap-1">
                  <Search className="size-3.5" />
                  {trackLoading ? 'جستجو...' : 'پیگیری'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {trackedFeedback && (
            <Card className="bg-surface-container-low border-warning/30 cursor-pointer" onClick={() => openThread(trackedFeedback)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-xs">{trackedFeedback.title}</span>
                    <span className="font-mono text-[10px] text-foreground-muted">FB-{toFa(trackedFeedback.feedbackNo)}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] font-extrabold', STATUS_COLOR[trackedFeedback.status])}>
                    {STATUS_LABEL[trackedFeedback.status]}
                  </Badge>
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed">{trackedFeedback.body}</p>

                {/* Progress Indicator */}
                <div className="flex items-center justify-around bg-surface/30 border border-border/30 rounded-lg p-3 text-[9px] font-bold">
                  <div className="flex flex-col items-center gap-1">
                    <Check className="size-4 text-success" />
                    <span className="text-success">ثبت شد</span>
                  </div>
                  <div className="h-px w-6 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    <Check className={cn('size-4', trackedFeedback.status !== 'submitted' ? 'text-success' : 'text-foreground-muted')} />
                    <span className={trackedFeedback.status !== 'submitted' ? 'text-success' : 'text-foreground-muted'}>بررسی</span>
                  </div>
                  <div className="h-px w-6 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    <Check className={cn('size-4', ['responded', 'resolved', 'closed'].includes(trackedFeedback.status) ? 'text-success' : 'text-foreground-muted')} />
                    <span className={['responded', 'resolved', 'closed'].includes(trackedFeedback.status) ? 'text-success' : 'text-foreground-muted'}>پاسخ</span>
                  </div>
                  <div className="h-px w-6 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    <Check className={cn('size-4', trackedFeedback.status === 'closed' ? 'text-success' : 'text-foreground-muted')} />
                    <span className={trackedFeedback.status === 'closed' ? 'text-success' : 'text-foreground-muted'}>بسته</span>
                  </div>
                </div>

                <p className="text-[9px] text-accent text-center font-bold">💬 جهت مشاهده گفتگو و ارسال پاسخ کلیک کنید</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: IDEA BOARD ═══════════════════ */}
      {activeTab === 'ideas' && (
        <div className="space-y-4">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">ایده‌ها و پیشنهادات عمومی همکاران</h4>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : ideas.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              <Lightbulb className="size-8 mx-auto mb-2 text-foreground-muted" />
              ایده عمومی فعالی ثبت نشده است.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => (
                <Card key={idea.id} className="bg-surface-container-low border-border/40 hover:border-accent/30 transition">
                  <CardContent className="p-4 space-y-3">
                    <h5 className="text-xs font-bold text-foreground">{idea.title}</h5>
                    <p className="text-[10px] text-foreground-muted leading-relaxed line-clamp-3">{idea.body}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/20">
                      <span className="text-[9px] text-foreground-muted">{jalali(idea.createdAt)}</span>
                      <button
                        onClick={() => handleVote(idea.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition cursor-pointer',
                          idea.ideaVotesCount > 0
                            ? 'bg-accent/10 border-accent/40 text-accent'
                            : 'border-border/50 text-foreground-muted hover:border-accent/40 hover:text-accent'
                        )}
                      >
                        <ThumbsUp className="size-3" />
                        {toFa(idea.ideaVotesCount)} موافق
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════ TAB: STAFF INBOX ═══════════════════ */}
      {activeTab === 'inbox' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-foreground">صف بازخوردهای فعال</h4>
            {loading ? (
              <div className="flex justify-center py-8"><div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : inboxItems.filter((i) => i.status === 'submitted' || i.status === 'under_review').length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low border border-border/30 rounded-lg text-foreground-muted text-xs">
                پرونده باز فعالی وجود ندارد. ✅
              </div>
            ) : (
              inboxItems
                .filter((i) => i.status === 'submitted' || i.status === 'under_review')
                .map((item) => {
                  const sla = slaRemainingLabel(item.slaFirstDue)
                  return (
                    <div
                      key={item.id}
                      onClick={() => { setSelectedInboxItem(item); setAdminReplyText('') }}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition text-right space-y-2',
                        selectedInboxItem?.id === item.id
                          ? 'bg-accent/15 border-accent'
                          : 'bg-surface-container-low border-border hover:border-accent/40',
                        sla.breached && 'border-critical/50'
                      )}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-foreground-muted">FB-{toFa(item.feedbackNo)}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge className={cn('text-[8px] font-extrabold', PRIORITY_COLOR[item.priority])}>
                            {item.priority === 'critical' ? 'بحرانی' : item.priority === 'high' ? 'فوری' : 'عادی'}
                          </Badge>
                          <span className={cn('text-[8px] font-bold', sla.breached ? 'text-critical' : sla.urgent ? 'text-warning' : 'text-foreground-muted')}>
                            {sla.label}
                          </span>
                        </div>
                      </div>
                      <h5 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h5>
                      <div className="flex justify-between items-center text-[9px] text-foreground-muted">
                        <span>{item.category?.title || '—'}</span>
                        <span>{item.isAnonymous ? '🔒 ناشناس' : item.user?.name}</span>
                      </div>
                    </div>
                  )
                })
            )}
          </div>

          {/* Detail & Reply Panel */}
          <div className="lg:col-span-2">
            {selectedInboxItem ? (
              <Card className="bg-surface-container-low border border-accent/25">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xs font-black">{selectedInboxItem.title}</CardTitle>
                    <span className="text-[10px] text-foreground-muted font-mono">FB-{toFa(selectedInboxItem.feedbackNo)}</span>
                  </div>
                  <div className="text-[9px] text-foreground-muted font-bold mt-1 flex gap-3">
                    <span>ثبت: {jalali(selectedInboxItem.createdAt)}</span>
                    <span>•</span>
                    <span>{selectedInboxItem.isAnonymous ? '🔒 ناشناس' : `👤 ${selectedInboxItem.user?.name}`}</span>
                    <span>•</span>
                    <span>دسته: {selectedInboxItem.category?.title || '—'}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  <div className="p-3 bg-neutral-950/20 border border-border/40 rounded-lg leading-relaxed font-bold">
                    {selectedInboxItem.body}
                  </div>

                  {/* SLA Indicator */}
                  {(() => {
                    const sla = slaRemainingLabel(selectedInboxItem.slaFirstDue)
                    return (
                      <div className={cn(
                        'p-2.5 rounded text-[10px] flex items-center gap-1.5 border',
                        sla.breached ? 'bg-critical/10 border-critical/20 text-critical' : 'bg-warning/10 border-warning/20 text-warning'
                      )}>
                        <Clock className="size-4" />
                        <span>مهلت پاسخ اول (SLA): {sla.label}</span>
                      </div>
                    )
                  })()}

                  {/* Reply */}
                  <div className="space-y-2 border-t border-border/20 pt-3 font-bold">
                    <label className="text-[10px] text-foreground-muted block">ثبت پاسخ رسمی:</label>
                    <textarea
                      rows={3}
                      placeholder="متن پاسخ..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="w-full p-2.5 bg-neutral-950/30 border border-border rounded-lg outline-none focus:border-accent text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => openThread(selectedInboxItem)} className="cursor-pointer text-[10px] gap-1">
                      <MessageCircle className="size-3" /> مشاهده رشته گفتگو
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedInboxItem(null)} className="cursor-pointer text-[10px]">
                        انصراف
                      </Button>
                      <Button size="sm" onClick={handleAdminReply} className="bg-accent hover:bg-accent-hover text-white cursor-pointer font-bold text-[10px] gap-1">
                        <Send className="size-3" /> ثبت پاسخ رسمی
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-8 border border-dashed border-border rounded-lg text-foreground-muted text-xs select-none">
                💡 پرونده‌ای را از صف سمت راست جهت بررسی و پاسخ انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ TAB: ANALYTICS ═══════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">داشبورد تحلیل بازخوردهای سازمانی</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Topics */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-accent">
                  <Lightbulb className="size-4" />
                  موضوعات پرتکرار
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-bold">
                {[
                  { title: 'روشنایی سکوها و دید راهبران', count: 18, pct: 60 },
                  { title: 'زمان‌بندی کلاس‌های آموزشی', count: 10, pct: 40 },
                  { title: 'سرمایش واگن‌های سری ۱۰۰', count: 6, pct: 25 },
                ].map((top, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between">
                      <span>{top.title}</span>
                      <span className="font-mono text-accent">{toFa(top.count)} پیام</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-accent h-1 rounded-full" style={{ width: `${top.pct}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* By Station */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-warning">
                  <AlertTriangle className="size-4" />
                  ایستگاه‌های پرنارضایتی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-bold">
                {[
                  { name: 'ایستگاه شوش', level: 'بالا', color: 'text-critical' },
                  { name: 'ایستگاه تجریش', level: 'متوسط', color: 'text-warning' },
                  { name: 'ایستگاه کهریزک', level: 'عادی', color: 'text-info' },
                ].map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-surface/30 border border-border/20">
                    <span>{st.name}</span>
                    <Badge variant="outline" className={cn('text-[9px] font-extrabold', st.color)}>{st.level}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SLA */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-success">
                  <FileCheck className="size-4" />
                  شاخص انطباق SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-center">
                <div className="flex flex-col items-center justify-center p-4">
                  <span className="text-3xl font-black text-success font-mono">
                    {stats.total > 0 ? toFa(Math.round(((stats.total - stats.breached) / stats.total) * 100)) : '۱۰۰'}٪
                  </span>
                  <span className="text-[10px] text-foreground-muted font-bold mt-1">پاسخ پیش از سررسید SLA</span>
                </div>
                <div className="text-[10px] text-foreground-muted font-normal bg-success/5 border border-success/20 rounded p-2 text-right">
                  ✅ عملکرد پاسخگویی مطابق توافقنامه سطح خدمت ثبت شده است.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════ THREAD MODAL ═══════════════════ */}
      {threadFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={() => setThreadFeedback(null)}>
          <div
            className="bg-background w-full md:w-[640px] md:max-h-[85vh] md:rounded-xl flex flex-col rounded-t-xl overflow-hidden border border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-container-low">
              <button onClick={() => setThreadFeedback(null)} className="cursor-pointer p-1 hover:bg-neutral-800 rounded">
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold">
                <MessageCircle className="size-4 text-accent" />
                <span className="text-foreground">رشته گفتگو — {threadFeedback.title}</span>
              </div>
              <Badge variant="outline" className={cn('text-[8px] font-extrabold', STATUS_COLOR[threadFeedback.status])}>
                {STATUS_LABEL[threadFeedback.status]}
              </Badge>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[55vh]">
              {threadLoading ? (
                <div className="flex justify-center py-8"><div className="size-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <>
                  {/* Original message */}
                  <div className="max-w-[80%] ms-auto bg-surface-container-high p-3 rounded-xl rounded-ee-sm text-xs text-right space-y-1">
                    <p className="text-[9px] font-bold text-accent">
                      {threadFeedback.isAnonymous ? '👤 فرستنده (ناشناس)' : `👤 ${threadFeedback.user?.name || 'فرستنده'}`}
                    </p>
                    <p className="leading-relaxed">{threadFeedback.body}</p>
                    <p className="text-[8px] text-foreground-muted text-start">{jalali(threadFeedback.createdAt)}</p>
                  </div>

                  {/* Thread messages */}
                  {threadMessages
                    .filter((m) => !m.isInternal || isAdmin)
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'max-w-[80%] p-3 rounded-xl text-xs text-right space-y-1',
                          msg.senderKind === 'submitter'
                            ? 'ms-auto bg-surface-container-high rounded-ee-sm'
                            : 'me-auto bg-surface-container-lowest border border-border rounded-es-sm',
                          msg.isInternal && 'border-dashed border-warning/30 bg-warning/5'
                        )}
                      >
                        <p className="text-[9px] font-bold text-accent">
                          {msg.isInternal && '📝 یادداشت داخلی — '}
                          {msg.senderKind === 'submitter'
                            ? (threadFeedback.isAnonymous ? '👤 فرستنده (ناشناس)' : `👤 ${msg.sender?.name || 'فرستنده'}`)
                            : `🏢 ${msg.sender?.name || 'مسئول رسیدگی'}`}
                        </p>
                        <p className="leading-relaxed">{msg.body}</p>
                        <p className="text-[8px] text-foreground-muted text-start">{jalali(msg.createdAt)}</p>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-border px-4 py-3 bg-surface-container-low flex items-center gap-2">
              {isAdmin && (
                <label className="flex items-center gap-1 text-[9px] text-warning cursor-pointer select-none shrink-0" title="یادداشت داخلی">
                  <input type="checkbox" checked={newMsgInternal} onChange={(e) => setNewMsgInternal(e.target.checked)} className="size-3" />
                  داخلی
                </label>
              )}
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendThreadMessage()}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 bg-neutral-950/30 border border-border rounded-full h-9 px-4 text-xs outline-none focus:border-accent text-right"
              />
              <button
                onClick={sendThreadMessage}
                disabled={!newMsg.trim() || sending}
                className={cn(
                  'size-9 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer transition',
                  (!newMsg.trim() || sending) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Send className="size-3.5" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ TOKEN MODAL ═══════════════════ */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowTokenModal(false)}>
          <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 w-[420px] max-w-[90vw] space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <EyeOff className="size-10 text-warning mx-auto" />
            <h3 className="text-sm font-black text-foreground">بازخورد ناشناس با موفقیت ثبت شد</h3>
            <p className="text-xs text-foreground-muted">شماره پیگیری: <span className="font-mono text-accent">FB-{toFa(newFeedbackNo)}</span></p>

            <div className="bg-neutral-950/30 border border-warning/40 rounded-xl p-4">
              <p className="text-[10px] text-foreground-muted mb-2">توکن امنیتی پیگیری شما:</p>
              <p className="font-mono text-base font-bold text-warning tracking-wider select-all">{newAnonToken}</p>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-[10px] text-warning text-right leading-relaxed">
              ⚠️ این توکن تنها یکبار نمایش داده می‌شود. جهت پیگیری پاسخ مدیریت، حتماً آن را کپی یا یادداشت نمایید.
              بدون این توکن، بازیابی پرونده امکان‌پذیر نیست.
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs cursor-pointer gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(newAnonToken)
                  alert('✅ توکن کپی شد!')
                }}
              >
                <Copy className="size-3" /> کپی توکن
              </Button>
              <Button
                size="sm"
                className="text-xs cursor-pointer bg-accent hover:bg-accent-hover text-white"
                onClick={() => {
                  setShowTokenModal(false)
                  setActiveTab('track')
                  setTrackToken(newAnonToken)
                }}
              >
                تأیید و رفتن به پیگیری
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
