'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'lucide-react'

interface FeedbackItem {
  id: string
  type: string
  title: string
  body: string
  isAnonymous: boolean
  status: string
  reply: string | null
  repliedAt: string | null
  createdAt: string
  user?: { name: string } | null
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  criticism: { label: 'انتقاد', icon: AlertTriangle, color: 'text-critical' },
  suggestion: { label: 'پیشنهاد', icon: Lightbulb, color: 'text-info' },
  complaint: { label: 'شکایت', icon: MessageCircle, color: 'text-warning' },
  appreciation: { label: 'تقدیر', icon: Star, color: 'text-success' },
}


export default function FeedbackPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'suggestion',
    title: '',
    body: '',
    isAnonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)

  async function loadItems() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadItems()
  }, [accessToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !form.title || !form.body) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ type: 'suggestion', title: '', body: '', isAnonymous: false })
        setShowForm(false)
        loadItems()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel: Record<string, string> = {
    submitted: 'دریافت شد',
    under_review: 'در حال بررسی',
    responded: 'پاسخ داده شد',
  }

  const statusColor: Record<string, string> = {
    submitted: 'bg-info/15 text-info',
    under_review: 'bg-warning/15 text-warning',
    responded: 'bg-success/15 text-success',
  }

  const stats = {
    total: items.length,
    submitted: items.filter((i) => i.status === 'submitted').length,
    underReview: items.filter((i) => i.status === 'under_review').length,
    responded: items.filter((i) => i.status === 'responded').length,
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <MessageSquare className="size-6 text-accent" />
            بازخورد و پیام‌ها
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مشاهده وضعیت و جزئیات پیام‌های ارسالی به مدیریت خط ۱
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Send className="size-4" />
          پیام جدید
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-data-mono text-lg font-bold">{toFa(stats.total)}</div>
              <div className="text-xs text-foreground-muted">کل پیام‌ها</div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-surface-container-high">
              <Send className="size-4 text-foreground-muted" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-data-mono text-lg font-bold">{toFa(stats.underReview)}</div>
              <div className="text-xs text-foreground-muted">در حال بررسی</div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10">
              <MessageSquare className="size-4 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-data-mono text-lg font-bold">{toFa(stats.responded)}</div>
              <div className="text-xs text-foreground-muted">پاسخ داده شده</div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
              <ThumbsUp className="size-4 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Message Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">پیام جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع پیام</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    <option value="suggestion">پیشنهاد</option>
                    <option value="criticism">انتقاد</option>
                    <option value="complaint">شکایت</option>
                    <option value="appreciation">تقدیر</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isAnonymous}
                      onChange={(e) =>
                        setForm({ ...form, isAnonymous: e.target.checked })
                      }
                      className="size-4"
                    />
                    ارسال ناشناس
                  </label>
                </div>
              </div>
              <div>
                <Label>موضوع</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="موضوع پیام..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>متن پیام</Label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="متن پیام خود را بنویسید..."
                  rows={4}
                  className="mt-1 flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting}>
                  ارسال پیام
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-background-subtle"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-3 size-10 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">پیامی ارسال نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.suggestion
            const TypeIcon = typeConf.icon
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${typeConf.color}`}>
                        <TypeIcon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                          <Badge className={statusColor[item.status]}>
                            {statusLabel[item.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground-muted">
                          {item.body}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
                          <span>{jalali(item.createdAt)}</span>
                          <span>{typeConf.label}</span>
                          {item.isAnonymous && <span>ناشناس</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {item.reply && (
                    <div className="mt-3 rounded-md border border-success/20 bg-success/5 p-3">
                      <div className="mb-1 text-xs font-medium text-success">
                        پاسخ مدیریت
                      </div>
                      <p className="text-sm">{item.reply}</p>
                      {item.repliedAt && (
                        <span className="mt-1 block text-xs text-foreground-muted">
                          {jalali(item.repliedAt)}
                        </span>
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
  )
}
