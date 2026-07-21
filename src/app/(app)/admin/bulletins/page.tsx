'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import { Plus, Eye, ShieldCheck } from 'lucide-react'

interface Bulletin {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
  _count: { readReceipts: number }
}

export default function AdminBulletinsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)
  const [receiptsOpen, setReceiptsOpen] = useState(false)
  const [receipts, setReceipts] = useState<{
    totalUsers: number
    acknowledgedCount: number
    percentage: number
    receipts: Array<{
      id: string
      readAt: string
      user: { name: string; personnelCode: string }
    }>
  } | null>(null)

  async function loadBulletins() {
    try {
      const res = await fetch('/api/bulletins', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setBulletins(data.data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/bulletins', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setBulletins(data.data)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [accessToken])

  async function handleCreate() {
    if (!title.trim() || !body.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/bulletins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title, body }),
      })
      if (res.ok) {
        setCreateOpen(false)
        setTitle('')
        setBody('')
        loadBulletins()
      }
    } catch {
      // silent
    } finally {
      setCreating(false)
    }
  }

  async function viewReceipts(bulletinId: string) {
    try {
      const res = await fetch(`/api/bulletins/${bulletinId}/receipts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReceipts(data.data)
        setReceiptsOpen(true)
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" />
            مدیریت بخشنامه‌های ایمنی
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            ایجاد ابلاغیه‌ها و مانیتورینگ وضعیت مطالعه و تأیید پرسنل سیر و حرکت
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="h-9 px-4 text-xs font-semibold gap-1.5" />}>
            <Plus className="size-4" />
            بخشنامه جدید
          </DialogTrigger>
          <DialogContent className="max-w-md border border-border bg-surface shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-md font-bold text-foreground text-start">ایجاد بخشنامه ایمنی جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground-muted">عنوان بخشنامه</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: دستورالعمل سرعت مجاز در بلاک ۴ خط ۱"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulletinBody" className="text-xs font-semibold text-foreground-muted">متن ابلاغیه</Label>
                <textarea
                  id="bulletinBody"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-32 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors leading-relaxed"
                  placeholder="متن کامل بخشنامه ایمنی..."
                />
              </div>
              <Button
                className="w-full h-9 font-semibold text-xs mt-2"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'در حال ایجاد...' : 'ثبت و انتشار عمومی'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div role="status" className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری بخشنامه‌ها...</p>
        </div>
      ) : bulletins.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-foreground-muted">هیچ بخشنامه ایمنی ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.map((b) => (
            <Card key={b.id} className="border border-border bg-surface hover:bg-surface-hover hover:border-border-subtle transition-all duration-150 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                      <Badge variant={b.active ? 'secondary' : 'outline'} className={`h-5 text-[10px] font-semibold ${b.active ? 'bg-success/10 text-success border-success/20' : 'bg-foreground-muted/10 text-foreground-muted'}`}>
                        {b.active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground-muted line-clamp-2 max-w-3xl leading-relaxed">
                      {b.body}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-foreground-muted font-mono">
                      <span>انتشار: {toFa(new Date(b.createdAt).toLocaleDateString('fa-IR'))}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 border border-border hover:border-border-subtle flex items-center gap-1.5 px-3 rounded-md transition-colors duration-150"
                    onClick={() => viewReceipts(b.id)}
                  >
                    <Eye className="size-3.5 text-foreground-muted" />
                    <span className="text-xs font-semibold text-foreground-muted">تاییدها:</span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {toFa(b._count.readReceipts)}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={receiptsOpen} onOpenChange={setReceiptsOpen}>
        <DialogContent className="max-w-lg border border-border bg-surface shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-md font-bold text-foreground text-start">وضعیت امضا و مطالعه بخشنامه</DialogTitle>
          </DialogHeader>
          {receipts && (
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-3 gap-4 text-center bg-background-subtle p-3 rounded-lg border border-border-subtle">
                <div>
                  <div className="text-lg font-bold tracking-tight text-foreground">
                    {toFa(receipts.totalUsers)}
                  </div>
                  <div className="text-[10px] font-semibold text-foreground-muted">
                    کل پرسنل
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight text-success">
                    {toFa(receipts.acknowledgedCount)}
                  </div>
                  <div className="text-[10px] font-semibold text-foreground-muted">
                    تأیید شده
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold tracking-tight text-info">
                    {toFa(receipts.percentage)}%
                  </div>
                  <div className="text-[10px] font-semibold text-foreground-muted">
                    نرخ خوانش
                  </div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto pr-1">
                {receipts.receipts.length === 0 ? (
                  <p className="text-center text-xs text-foreground-muted py-6">
                    این بخشنامه هنوز توسط هیچ کاربری تایید نشده است.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {receipts.receipts.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between border border-border-subtle rounded-md bg-surface p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{r.user.name}</span>
                          <span className="font-mono text-[10px] text-foreground-muted bg-background-subtle border border-border-subtle rounded px-1" dir="ltr">
                            {r.user.personnelCode}
                          </span>
                        </div>
                        <span className="text-foreground-muted font-mono text-[11px]">
                          {toFa(new Date(r.readAt).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' }))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
