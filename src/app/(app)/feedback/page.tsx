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
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackItem {
  id: string
  trackingNumber: string // شماره پیگیری یکتا
  type: string           // criticism, suggestion, complaint, appreciation
  title: string
  body: string
  isAnonymous: boolean
  secureHashToken?: string // شناسه رمزنگاری شده برای مدیریت سوءاستفاده
  status: 'submitted' | 'under_review' | 'responded' | 'converted'
  reply: string | null
  repliedAt: string | null
  createdAt: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string | null
  slaDueDate: string     // مهلت SLA پاسخگویی
  satisfactionRating?: number // رنکینگ رضایت راهبر از پاسخ (۱ تا ۵)
  actionTakenType?: string // نوع پروژه تبدیل شده (وظیفه، اقدام اصلاحی، نظرسنجی و...)
  user?: { name: string } | null
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  criticism: { label: 'انتقاد', icon: AlertTriangle, color: 'text-critical', bgColor: 'bg-critical/10 border-critical/20' },
  suggestion: { label: 'پیشنهاد واصله', icon: Lightbulb, color: 'text-info', bgColor: 'bg-info/10 border-info/20' },
  complaint: { label: 'شکایت پرسنلی', icon: MessageCircle, color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20' },
  appreciation: { label: 'تقدیر و تشکر', icon: Star, color: 'text-success', bgColor: 'bg-success/10 border-success/20' },
}

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-neutral-800 text-neutral-300',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/15 text-warning',
  critical: 'bg-critical/15 text-critical animate-pulse',
}

const SAMPLE_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-1',
    trackingNumber: 'TRK-105-09',
    type: 'suggestion',
    title: 'نیاز به اصلاح زاویه چراغ‌های روشنایی ورودی سکوی ایستگاه شوش',
    body: 'نور مستقیم چراغ‌های جدید در ابتدای سکو باعث کوری موقت دید راهبر هنگام ورود به ایستگاه می‌شود. پیشنهاد می‌شود زاویه تابش ۱۵ درجه تغییر کند.',
    isAnonymous: false,
    secureHashToken: undefined,
    status: 'responded',
    reply: 'با سلام، همکار گرامی پیشنهاد شما به بخش تاسیسات خط یک ارجاع شد و زاویه چراغ‌ها در شیفت شب گذشته تصحیح گردید. تشکر از دقت نظر شما.',
    repliedAt: new Date(Date.now() - 36000000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    priority: 'high',
    assignee: 'مهندس حسینی (رئیس نگهداری و تعمیرات)',
    slaDueDate: '۱۴۰۵/۰۴/۱۲',
    satisfactionRating: 5,
    user: { name: 'امین سلیمانی (راهبر پایه یک)' }
  },
  {
    id: 'fb-2',
    trackingNumber: 'TRK-105-10',
    type: 'complaint',
    title: 'تداخل زمان استراحت شیفت ب با کلاس بازآموزی بایکوت ترمز واگن سری ۳۰۰',
    body: 'کلاس آموزشی دقیقاً در ساعت خواب بعد از شیفت شب تنظیم شده است. لطفاً زمان را به ساعت شروع شیفت تغییر دهید.',
    isAnonymous: true,
    secureHashToken: 'SEC-HASH-998x5A', // هویت مخفی است ولی توکن برای عدم سوءاستفاده موجود است
    status: 'under_review',
    reply: null,
    repliedAt: null,
    createdAt: new Date(Date.now() - 72000000).toISOString(),
    priority: 'medium',
    assignee: 'سرپرست آموزش خط ۱',
    slaDueDate: '۱۴۰۵/۰۴/۱۴',
    user: null
  },
  {
    id: 'fb-3',
    trackingNumber: 'TRK-105-11',
    type: 'criticism',
    title: 'تأخیر در ثبت درخواست‌های جابجایی لوحه و شیفت کاری',
    body: 'پنل تایید تعویض شیفت گاهی بیش از ۴۸ ساعت در صف بررسی سوپروایزر می‌ماند که باعث سردرگمی پرسنل است.',
    isAnonymous: false,
    secureHashToken: undefined,
    status: 'converted', // تبدیل شده به پروژه/نظرسنجی
    reply: 'با تشکر از ثبت انتقاد. این بازخورد تبدیل به یک «نظرسنجی سراسری از راهبران» پیرامون تغییر خودکار پنل شیفت‌ها شد.',
    repliedAt: new Date(Date.now() - 10000000).toISOString(),
    createdAt: new Date(Date.now() - 120000000).toISOString(),
    priority: 'critical',
    assignee: 'رئیس دیسپاچینگ خط ۱',
    slaDueDate: '۱۴۰۵/۰۴/۱۰',
    actionTakenType: 'نظرسنجی سراسری پرسنل',
    user: { name: 'امیرحسین زارعی' }
  }
]

export default function FeedbackPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'tracker' | 'admin' | 'analytics'>('tracker')
  const [items, setItems] = useState<FeedbackItem[]>(SAMPLE_FEEDBACKS)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState({
    type: 'suggestion',
    title: '',
    body: '',
    isAnonymous: false,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  })
  
  const [submitting, setSubmitting] = useState(false)

  // پاسخگویی ادمین
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [adminReplyText, setAdminReplyText] = useState('')

  const isUserAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  async function loadItems() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetched = data.data?.items ?? []
        setItems((prev) => {
          const ids = new Set(fetched.map((i: any) => i.id))
          const filteredPrev = prev.filter((i) => !ids.has(i.id))
          return [...fetched, ...filteredPrev]
        })
      }
    } catch {
      // safe fallback to samples
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [accessToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.body) return
    setSubmitting(true)

    try {
      // شبیه‌ساز ارسال تیکت جدید با شماره پیگیری
      const newTrk = `TRK-105-${12 + items.length}`
      const newFb: FeedbackItem = {
        id: `fb-user-${Date.now()}`,
        trackingNumber: newTrk,
        type: form.type,
        title: form.title,
        body: form.body,
        isAnonymous: form.isAnonymous,
        secureHashToken: form.isAnonymous ? `SEC-HASH-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
        status: 'submitted',
        reply: null,
        repliedAt: null,
        createdAt: new Date().toISOString(),
        priority: form.priority,
        assignee: null,
        slaDueDate: '۱۴۰۵/۰۴/۳۰',
        user: form.isAnonymous ? null : { name: user?.name || 'راهبر قطار خط ۱' }
      }

      setItems(prev => [newFb, ...prev])
      setForm({ type: 'suggestion', title: '', body: '', isAnonymous: false, priority: 'medium' })
      setShowForm(false)
      alert(`پیام شما با شماره پیگیری رسمی [${newTrk}] جهت رسیدگی در صف قرار گرفت.`)
    } finally {
      setSubmitting(false)
    }
  }

  // ثبت پاسخ رسمی توسط مدیر — بخش ۱۰.۱
  const handleAdminReplySubmit = () => {
    if (!selectedFeedback || !adminReplyText) return
    setItems(prev =>
      prev.map(i =>
        i.id === selectedFeedback.id
          ? {
              ...i,
              status: 'responded',
              reply: adminReplyText,
              repliedAt: new Date().toISOString(),
              assignee: user?.name || 'مدیریت ارشد خط یک'
            }
          : i
      )
    )
    alert('پاسخ رسمی شما با موفقیت ثبت و برای راهبر ارسال گردید.')
    setAdminReplyText('')
    setSelectedFeedback(null)
  }

  // تبدیل پیشنهاد به اقدام/پروژه سازمانی — بخش ۱۰.۴
  const handleConvertToProject = (feedbackId: string, actionType: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === feedbackId
          ? {
              ...i,
              status: 'converted',
              actionTakenType: actionType,
              reply: `این پیشنهاد سودمند در تاریخ ${new Date().toLocaleDateString('fa-IR')} تبدیل به یک «${actionType}» اصلاحی در سازمان گردید.`
            }
          : i
      )
    )
    alert(`پیشنهاد با موفقیت به [${actionType}] تبدیل و در فرآیند اجرا قرار گرفت.`)
  }

  // ثبت رضایت کاربر از پاسخ رسمی
  const handleSetSatisfaction = (feedbackId: string, rating: number) => {
    setItems(prev =>
      prev.map(i => (i.id === feedbackId ? { ...i, satisfactionRating: rating } : i))
    )
    alert('سپاس؛ میزان رضایتمندی شما از پاسخ ثبت شد.')
  }

  const statusLabel: Record<string, string> = {
    submitted: 'ارسال شده',
    under_review: 'در حال بررسی',
    responded: 'پاسخ داده شد',
    converted: 'تبدیل به پروژه اقدام'
  }

  const statusColor: Record<string, string> = {
    submitted: 'bg-info/10 text-info border-info/30',
    under_review: 'bg-warning/10 text-warning border-warning/30',
    responded: 'bg-success/15 text-success border-success/30',
    converted: 'bg-accent/15 text-accent border-accent/30 font-bold'
  }

  // محاسبه بازخورد آماری — بخش ۱۰.۳
  const stats = useMemo(() => {
    const total = items.length
    const satisfactionSum = items.filter(i => i.satisfactionRating).reduce((sum, i) => sum + (i.satisfactionRating || 0), 0)
    const satisfactionCount = items.filter(i => i.satisfactionRating).length
    const satisfactionIndex = satisfactionCount > 0 ? (satisfactionSum / satisfactionCount).toFixed(1) : '۵.۰'

    return {
      total,
      underReview: items.filter((i) => i.status === 'under_review').length,
      responded: items.filter((i) => i.status === 'responded' || i.status === 'converted').length,
      satisfactionIndex,
      anonymousPercent: Math.round((items.filter(i => i.isAnonymous).length / (total || 1)) * 100)
    }
  }, [items])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2 select-none">
            <MessageSquare className="size-6 text-accent" />
            سامانه پیشنهادات، انتقادات و تیکتینگ مدیریت خط ۱
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            ارسال ایمن، پایش SLA زمانی رسیدگی و فرآیند تبدیل به اقدامات اصلاحی تیمی
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5 text-xs font-bold cursor-pointer shrink-0">
          <Send className="size-4" />
          ثبت پیام / پیشنهاد جدید
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('tracker')}
          className={cn(
            "pb-2 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'tracker' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          پیگیری تیکت‌ها و پیشنهادات من
        </button>
        {isUserAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "pb-2 px-3 border-b-2 transition-all cursor-pointer",
              activeTab === 'admin' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            پنل پاسخگویی و اقدام مدیریت (بخش ۱۰.۱ و ۱۰.۴)
          </button>
        )}
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "pb-2 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'analytics' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          داشبورد تحلیل بازخوردهای پرسنلی (بخش ۱۰.۳)
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 select-none">
        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">کل مکاتبات ثبت شده</p>
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
              <p className="text-[10px] text-foreground-muted font-bold">در صف بررسی و اقدام</p>
              <h3 className="text-base font-black mt-1 text-warning">{toFa(stats.underReview)} تیکت</h3>
            </div>
            <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
              <AlertTriangle className="size-4 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">پاسخ‌های داده شده</p>
              <h3 className="text-base font-black mt-1 text-success">{toFa(stats.responded)} پیام</h3>
            </div>
            <div className="bg-success/10 p-2.5 rounded-lg text-success">
              <CheckCircle className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-foreground-muted font-bold">شاخص رضایت پرسنل</p>
              <h3 className="text-base font-black mt-1 text-accent">{toFa(stats.satisfactionIndex)} از ۵</h3>
            </div>
            <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
              <Star className="size-4 fill-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Message Form */}
      {showForm && (
        <Card className="bg-surface-container-low border-border-subtle">
          <CardHeader>
            <CardTitle className="text-xs font-black">ثبت و ارسال پرونده جدید به مدیریت</CardTitle>
            <CardDescription className="text-[10px]">اطلاعات ورودی شما به صورت امن کدگذاری شده و در صورت تمایل بدون درج هویت ارسال خواهد شد.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px]">دسته‌بندی پیام:</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="suggestion">پیشنهاد بهبود مستمر</option>
                    <option value="criticism">انتقاد از روند جاری</option>
                    <option value="complaint">شکایت پرسنلی و اداری</option>
                    <option value="appreciation">تقدیر و تشکر از همکاران</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">سطح اولویت پیشنهادی:</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="low">عادی (پاسخ حداکثر ۱۰ روز)</option>
                    <option value="medium">متوسط (پاسخ حداکثر ۵ روز)</option>
                    <option value="high">فوری (پاسخ حداکثر ۴۸ ساعت)</option>
                    <option value="critical">بحرانی (نیازمند اقدام فوری OCC)</option>
                  </select>
                </div>

                {/* True Anonymity Toggle — بخش ۱۰.۲ */}
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-neutral-950/20 cursor-pointer w-full text-right justify-between select-none">
                    <span className="flex items-center gap-1.5">
                      <EyeOff className="size-4 text-warning" />
                      <span>ارسال به صورت ناشناس (True Anonymity):</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={form.isAnonymous}
                      onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                      className="size-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">موضوع پیام:</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="موضوع خلاصه تیکت..."
                  className="bg-neutral-950/40"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px]">شرح کامل پیام:</Label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="جزئیات و پیشنهاد اصلاحی خود را اینجا بنویسید..."
                  rows={4}
                  className="w-full bg-neutral-950/40 border border-border rounded-lg p-3 outline-none focus:border-accent text-xs resize-none"
                />
              </div>

              {form.isAnonymous && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg text-[10px] text-warning font-normal flex items-start gap-2">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>
                    توجه: با فعال‌سازی مود ناشناس، نام و کد ملی شما برای هیچ یک از سطوح مدیریتی نمایش داده نخواهد شد. سیستم صرفاً جهت جلوگیری از اسپم، توکن هشدار رمزنگاری‌شده در سوابق نگه خواهد داشت.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="text-xs cursor-pointer">
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting} className="text-xs cursor-pointer bg-accent hover:bg-accent-hover text-white">
                  ارسال پیام رسمی
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Tracker */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">لیست پرونده‌های ارسالی من</h4>
          </div>

          {items.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 py-12 text-center text-foreground-muted text-xs">
              پرونده بازخوردی یافت نشد.
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.suggestion
                const TypeIcon = typeConf.icon
                return (
                  <Card key={item.id} className="bg-surface-container-low border-border/40 hover:border-accent/30 transition">
                    <CardContent className="p-4 space-y-3">
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between flex-wrap gap-2 pb-2.5 border-b border-border/20 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded border', typeConf.bgColor)}>
                            <TypeIcon className={cn('size-4', typeConf.color)} />
                          </div>
                          <span className="font-bold text-foreground">{item.title}</span>
                          <span className="font-mono text-[10px] text-foreground-muted">({item.trackingNumber})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-[9px] font-extrabold', PRIORITY_COLOR[item.priority])}>
                            اولویت: {item.priority === 'critical' ? 'بحرانی' : item.priority === 'high' ? 'بالا' : item.priority === 'medium' ? 'متوسط' : 'عادی'}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[9px] font-extrabold', statusColor[item.status])}>
                            {statusLabel[item.status]}
                          </Badge>
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <p className="text-xs text-foreground-muted leading-relaxed font-bold">{item.body}</p>

                      {/* Ticket Meta Details */}
                      <div className="flex items-center justify-between text-[9px] text-foreground-muted font-bold pt-2">
                        <div className="flex items-center gap-3">
                          <span>ثبت: {jalali(item.createdAt)}</span>
                          <span>•</span>
                          <span>دسته‌بندی: {typeConf.label}</span>
                          <span>•</span>
                          <span className="text-critical">مهلت پاسخ ممیزی (SLA): {toFa(item.slaDueDate)}</span>
                        </div>

                        {item.isAnonymous ? (
                          <span className="text-warning flex items-center gap-1">
                            <EyeOff className="size-3" />
                            ناشناس واقعی (توکن امنیتی: {item.secureHashToken})
                          </span>
                        ) : (
                          <span className="text-accent flex items-center gap-1">
                            <UserCheck className="size-3" />
                            ثبت شده با نام: {item.user?.name}
                          </span>
                        )}
                      </div>

                      {/* Response or Converted Project status */}
                      {item.reply && (
                        <div className="mt-3.5 rounded-lg border border-success/20 bg-success/5 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-bold text-success flex items-center gap-1.5">
                              <CheckCircle className="size-4" />
                              <span>پاسخ رسمی مدیریت خط ۱ (مسئول رسیدگی: {item.assignee || 'تیم دیسپاچینگ'}):</span>
                            </div>
                            <span className="text-[9px] text-foreground-muted font-mono">{jalali(item.repliedAt || '')}</span>
                          </div>
                          <p className="text-xs text-foreground font-bold">{item.reply}</p>

                          {/* Satisfaction Rating input if replied and not rated yet — بخش ۱۰.۱ */}
                          {item.status === 'responded' && !item.satisfactionRating && (
                            <div className="flex items-center gap-2 pt-2 border-t border-success/15 text-[10px]">
                              <span>همکار گرامی، لطفاً میزان رضایت خود را از پاسخ بالا ثبت کنید:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleSetSatisfaction(item.id, star)}
                                    className="text-amber-500 hover:scale-125 transition cursor-pointer"
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.satisfactionRating && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-success/15 text-[9px] text-amber-500 font-bold">
                              <span>امتیاز رضایت ثبت شده:</span>
                              <span className="font-mono">{toFa(item.satisfactionRating)} از ۵</span>
                            </div>
                          )}
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

      {/* Tab 2: Admin Panel */}
      {activeTab === 'admin' && isUserAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of open feedbacks */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-bold text-foreground">پرونده‌های فعال بدون پاسخ</h4>
            
            {items.filter(i => i.status === 'submitted' || i.status === 'under_review').length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low border border-border/30 rounded-lg text-foreground-muted text-xs">
                پرونده پاسخ‌داده‌نشده‌ای یافت نشد.
              </div>
            ) : (
              items.filter(i => i.status === 'submitted' || i.status === 'under_review').map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeedback(item)}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition text-right space-y-2',
                    selectedFeedback?.id === item.id ? 'bg-accent/15 border-accent' : 'bg-surface-container-low border-border hover:border-accent/40'
                  )}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-mono text-foreground-muted">{item.trackingNumber}</span>
                    <Badge className={cn('text-[8px] font-extrabold', PRIORITY_COLOR[item.priority])}>
                      {item.priority === 'critical' ? 'بحرانی' : 'متوسط'}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h5>
                  <div className="flex justify-between items-center text-[9px] text-foreground-muted">
                    <span>مهلت: {toFa(item.slaDueDate)}</span>
                    <span>{item.isAnonymous ? 'ناشناس' : item.user?.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form details & Action Conversion — بخش ۱۰.۴ */}
          <div className="lg:col-span-2">
            {selectedFeedback ? (
              <Card className="bg-surface-container-low border border-accent/25">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xs font-black">{selectedFeedback.title}</CardTitle>
                    <span className="text-[10px] text-foreground-muted font-mono">{selectedFeedback.trackingNumber}</span>
                  </div>
                  <div className="text-[9px] text-foreground-muted font-bold mt-1">
                    <span>ثبت: {jalali(selectedFeedback.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span>مخاطب: {selectedFeedback.isAnonymous ? `ناشناس واقعی (${selectedFeedback.secureHashToken})` : selectedFeedback.user?.name}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-5 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-foreground-muted block text-[10px]">شرح پیام دریافتی:</span>
                    <p className="p-3 bg-neutral-950/20 border border-border/40 rounded-lg leading-relaxed font-bold">
                      {selectedFeedback.body}
                    </p>
                  </div>

                  {/* SLA Warning */}
                  <div className="bg-warning/10 border border-warning/20 p-2.5 rounded text-[10px] text-warning flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    <span>مطابق توافق‌نامه سطح خدمت (SLA)، مهلت پاسخگویی سیستم تا {toFa(selectedFeedback.slaDueDate)} می‌باشد.</span>
                  </div>

                  {/* Actions: Convert Suggestion to Action Items/Projects — بخش ۱۰.۴ */}
                  {selectedFeedback.type === 'suggestion' && (
                    <div className="space-y-2 border-t border-border/20 pt-3">
                      <span className="font-bold text-[10px] text-accent block">تبدیل مستقیم پیشنهاد به پروژه اقدام (بخش ۱۰.۴):</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'اقدام اصلاحی فنی', type: 'اقدام اصلاحی' },
                          { label: 'وظیفه تیمی (Task)', type: 'وظیفه تیمی' },
                          { label: 'پروژه کوچک توسعه', type: 'پروژه کوچک' },
                          { label: 'نظرسنجی همگانی پرسنل', type: 'نظرسنجی سراسری' }
                        ].map((act, aIdx) => (
                          <Button
                            key={aIdx}
                            size="xs"
                            variant="secondary"
                            onClick={() => handleConvertToProject(selectedFeedback.id, act.type)}
                            className="text-[9px] font-bold gap-1 cursor-pointer"
                          >
                            <Zap className="size-3 text-accent" />
                            <span>تبدیل به {act.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Formal reply input */}
                  <div className="space-y-2 border-t border-border/20 pt-3 font-bold">
                    <label className="text-[10px] text-foreground-muted block">ثبت پاسخ رسمی مدیریت:</label>
                    <textarea
                      rows={3}
                      placeholder="متن پاسخ رسمی برای راهبر..."
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      className="w-full p-2.5 bg-neutral-950/30 border border-border rounded-lg outline-none focus:border-accent text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="xs" onClick={() => setSelectedFeedback(null)} className="cursor-pointer">
                      انصراف
                    </Button>
                    <Button size="xs" onClick={handleAdminReplySubmit} className="bg-accent hover:bg-accent-hover text-white cursor-pointer font-bold">
                      ثبت و ارسال پاسخ رسمی
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-8 border border-dashed border-border rounded-lg text-foreground-muted text-xs select-none">
                💡 پرونده‌ای را از لیست سمت راست جهت بررسی و پاسخ رسمی انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="text-right pb-1 select-none">
            <h4 className="text-xs font-bold text-foreground">گزارش و تحلیل پیشرفته بازخوردهای خط ۱</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Common Topics */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-accent">
                  <Lightbulb className="size-4" />
                  موضوعات پرتکرار شکایات و پیشنهادات
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-bold">
                {[
                  { title: 'روشنایی سکوها و دید راهبران', count: 18, pct: 60, trend: 'up' },
                  { title: 'کلاس‌های آموزشی زمان استراحت', count: 10, pct: 40, trend: 'up' },
                  { title: 'سرمایش واگن‌های سری ۱۰۰', count: 6, pct: 25, trend: 'down' }
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

            {/* Friction by Stations */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-warning">
                  <AlertTriangle className="size-4" />
                  ایستگاه‌های دارای نارضایتی بیشتر
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 font-bold">
                {[
                  { name: 'ایستگاه شوش (روشنایی و تاسیسات)', friction: 'بالا', color: 'text-critical' },
                  { name: 'ایستگاه تجریش (فواصل زمانی سوزن‌ها)', friction: 'متوسط', color: 'text-warning' },
                  { name: 'ایستگاه کهریزک (سرمایش استراحتگاه)', friction: 'عادی', color: 'text-info' }
                ].map((st, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-surface/30 border border-border/20">
                    <span>{st.name}</span>
                    <Badge variant="outline" className={cn('text-[9px] font-extrabold', st.color)}>
                      {st.friction}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SLA Performance metrics */}
            <Card className="bg-surface-container-low border border-border/50">
              <CardHeader className="pb-2 border-b border-border/20">
                <CardTitle className="text-xs font-bold flex items-center gap-1 text-success">
                  <FileCheck className="size-4" />
                  شاخص انطباق زمان پاسخ (SLA)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-center">
                <div className="flex flex-col items-center justify-center p-4">
                  <span className="text-3xl font-black text-success font-mono">۹۴.۲٪</span>
                  <span className="text-[10px] text-foreground-muted font-bold mt-1">پاسخ رسمی پیش از سررسید مهلت SLA</span>
                </div>
                <div className="text-[10px] text-foreground-muted font-normal bg-success/5 border border-success/20 rounded p-2 text-right">
                  ✅ میانگین زمان رسیدگی به تیکت‌های عادی خط یک ۲.۴ روز و برای هشدارهای فوری ۱۸ ساعت ثبت شده است.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
