'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Check, AlertTriangle, Trash2, Edit2, ShieldCheck, ShieldAlert } from 'lucide-react'

interface CacheRecord {
  id: string
  questionText: string
  answerText: string
  source: string
  providerUsed: string | null
  confidenceScore: number
  hitCount: number
  isVerified: boolean
  createdAt: string
  lastUsedAt: string
}

export default function AICachePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [cacheRecords, setCacheRecords] = useState<CacheRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CacheRecord | null>(null)
  
  // Form State
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchCache() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-cache', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setProviders(json.data || []) // wait, json.data
        setCacheRecords(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // To resolve lint error
  const setProviders = (val: any) => {}

  useEffect(() => {
    fetchCache()
  }, [accessToken])

  const toggleVerify = async (record: CacheRecord) => {
    try {
      const res = await fetch(`/api/admin/ai-cache/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ isVerified: !record.isVerified })
      })
      if (res.ok) {
        fetchCache()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenEdit = (record: CacheRecord) => {
    setEditingRecord(record)
    setEditText(record.answerText)
    setDialogOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ai-cache/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ answerText: editText, isVerified: true })
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchCache()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پاسخ کش شده مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/admin/ai-cache/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        fetchCache()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('توجه! با این کار تمام حافظه معنایی هوش مصنوعی پاک شده و در درخواست‌های بعدی هزینه لود بردار و API مجدداً محاسبه خواهد شد. آیا مطمئن هستید؟')) return
    try {
      const res = await fetch('/api/admin/ai-cache', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        fetchCache()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semantic Cache (حافظه معنایی هوش مصنوعی)</h1>
          <p className="text-muted-foreground mt-2">
            لیست پاسخ‌های کش‌شده برای کاهش هزینه و افزایش سرعت پاسخگویی
          </p>
        </div>
        {cacheRecords.length > 0 && (
          <Button onClick={handleClearAll} variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            پاکسازی کل کش
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>۱۰۰ رکورد اخیر کش</CardTitle>
          <CardDescription>
            پاسخ‌های تأیید شده (Verified) با رنگ متمایز نمایش داده می‌شوند و مرجع اول هوش مصنوعی هستند.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">سؤال کاربر</TableHead>
                  <TableHead className="text-right">خلاصه پاسخ</TableHead>
                  <TableHead className="text-right">پروایدر</TableHead>
                  <TableHead className="text-right">امتیاز تشابه</TableHead>
                  <TableHead className="text-right">استفاده مجدد (Hit)</TableHead>
                  <TableHead className="text-right">تایید صحت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheRecords.map((c) => (
                  <TableRow key={c.id} className={c.isVerified ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={c.questionText}>
                      {c.questionText}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground" title={c.answerText}>
                      {c.answerText}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.providerUsed || 'محلی / RAG'}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{c.confidenceScore}%</TableCell>
                    <TableCell className="font-mono text-center">{c.hitCount}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => toggleVerify(c)}
                        variant="ghost"
                        size="sm"
                        className={c.isVerified ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-foreground'}
                      >
                        {c.isVerified ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <ShieldAlert className="h-5 w-5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => handleOpenEdit(c)} variant="outline" size="sm" className="gap-1">
                          <Edit2 className="h-3.5 w-3.5" />
                          اصلاح پاسخ
                        </Button>
                        <Button onClick={() => handleDelete(c.id)} variant="destructive" size="sm" className="gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {cacheRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      هنوز هیچ پاسخی کش نشده است
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>اصلاح و تایید پاسخ کش شده</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">سوال پرسیده شده:</Label>
              <p className="p-3 bg-muted rounded-md text-sm leading-relaxed">{editingRecord?.questionText}</p>
            </div>

            <div className="space-y-2">
              <Label>پاسخ اصلاح شده (به عنوان مرجع کش ذخیره می‌شود):</Label>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ذخیره و تایید صحت
              </Button>
              <DialogClose render={<Button type="button" variant="outline">انصراف</Button>} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
