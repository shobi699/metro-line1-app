'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
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
import { Plus, Eye } from 'lucide-react'

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
      user: { name: string; nationalId: string }
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
        <h1 className="text-lg font-semibold tracking-tight">
          مدیریت بخشنامه‌ها
        </h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="ms-2 size-4" />
            بخشنامه جدید
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ایجاد بخشنامه ایمنی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>عنوان</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان بخشنامه"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulletinBody">متن</Label>
                <textarea
                  id="bulletinBody"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-32 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  placeholder="متن بخشنامه ایمنی"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'در حال ایجاد...' : 'ایجاد بخشنامه'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div role="status" className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : bulletins.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">بخشنامه‌ای وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bulletins.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">{b.title}</h3>
                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {b.body}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span>
                        {new Date(b.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                      <Badge variant={b.active ? 'secondary' : 'outline'}>
                        {b.active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewReceipts(b.id)}
                  >
                    <Eye className="size-4" />
                    <span className="me-1 text-xs">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>وضعیت مطالعه بخشنامه</DialogTitle>
          </DialogHeader>
          {receipts && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">
                    {toFa(receipts.totalUsers)}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    کل کاربران
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-success">
                    {toFa(receipts.acknowledgedCount)}
                  </div>
                  <div className="text-xs text-foreground-muted">خوانده</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-info">
                    {toFa(receipts.percentage)}%
                  </div>
                  <div className="text-xs text-foreground-muted">درصد</div>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {receipts.receipts.length === 0 ? (
                  <p className="text-center text-sm text-foreground-muted">
                    هنوز کسی نخوانده
                  </p>
                ) : (
                  <div className="space-y-1">
                    {receipts.receipts.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between border-b border-border-subtle py-1 text-xs"
                      >
                        <span>{r.user.name}</span>
                        <span className="font-mono text-foreground-muted">
                          {r.user.nationalId}
                        </span>
                        <span className="text-foreground-muted">
                          {new Date(r.readAt).toLocaleString('fa-IR')}
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
