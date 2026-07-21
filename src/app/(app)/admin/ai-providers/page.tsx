'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react'

interface Provider {
  id: string
  name: string
  providerType: 'gemini' | 'openai'
  baseUrl: string
  apiKey: string
  modelName: string
  requestFormat: 'gemini' | 'openai'
  priority: number
  isActive: boolean
  healthStatus: string
  consecutiveFailures: number
  maxRetries: number
  timeoutMs: number
}

const emptyForm: Omit<Provider, 'id' | 'healthStatus' | 'consecutiveFailures'> = {
  name: '',
  providerType: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: '',
  modelName: 'gemini-2.0-flash',
  requestFormat: 'gemini',
  priority: 10,
  isActive: true,
  maxRetries: 3,
  timeoutMs: 10000
}

export default function AIProvidersPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  
  // Form State
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function fetchProviders() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-providers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setProviders(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [accessToken])

  const handleOpenAdd = () => {
    setEditingProvider(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (p: Provider) => {
    setEditingProvider(p)
    setForm({
      name: p.name,
      providerType: p.providerType,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      modelName: p.modelName,
      requestFormat: p.requestFormat,
      priority: p.priority,
      isActive: p.isActive,
      maxRetries: p.maxRetries,
      timeoutMs: p.timeoutMs
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این سرویس‌دهنده مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        fetchProviders()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingProvider 
        ? `/api/admin/ai-providers/${editingProvider.id}` 
        : '/api/admin/ai-providers'
      const method = editingProvider ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ...form,
          priority: Number(form.priority),
          maxRetries: Number(form.maxRetries),
          timeoutMs: Number(form.timeoutMs)
        })
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchProviders()
      } else {
        const errData = await res.json()
        alert(errData.error || 'خطا در ثبت اطلاعات')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Providers (دروازه هوش مصنوعی)</h1>
          <p className="text-muted-foreground mt-2">
            مدیریت سرویس‌دهنده‌های هوش مصنوعی با قابلیت سوئیچ خودکار (Fallback)
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن پروایدر جدید
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سرویس‌های فعال</CardTitle>
          <CardDescription>بر اساس اولویت برای استفاده در سیستم مسیریابی انتخاب می‌شوند</CardDescription>
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
                  <TableHead className="text-right">نام</TableHead>
                  <TableHead className="text-right">نوع</TableHead>
                  <TableHead className="text-right">مدل</TableHead>
                  <TableHead className="text-right">اولویت</TableHead>
                  <TableHead className="text-right">وضعیت سلامت</TableHead>
                  <TableHead className="text-right">خطاهای پیاپی</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.providerType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.modelName}</TableCell>
                    <TableCell>{p.priority}</TableCell>
                    <TableCell>
                      <Badge variant={p.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                        {p.healthStatus === 'healthy' ? 'سالم' : 'خراب / تعلیق'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{p.consecutiveFailures}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => handleOpenEdit(p)} variant="outline" size="sm" className="gap-1">
                          <Edit2 className="h-3.5 w-3.5" />
                          ویرایش
                        </Button>
                        <Button onClick={() => handleDelete(p.id)} variant="destructive" size="sm" className="gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {providers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      هیچ سرویسی ثبت نشده است
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'ویرایش سرویس‌دهنده' : 'افزودن سرویس‌دهنده جدید'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>نام نمایشی</Label>
              <Input 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثلا: Gemini Flash Core"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع پروایدر</Label>
                <select
                  value={form.providerType}
                  onChange={e => {
                    const val = e.target.value as 'gemini' | 'openai'
                    setForm(f => ({ 
                      ...f, 
                      providerType: val,
                      baseUrl: val === 'gemini' ? 'https://generativelanguage.googleapis.com' : '',
                      requestFormat: val,
                      modelName: val === 'gemini' ? 'gemini-2.0-flash' : ''
                    }))
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">OpenAI Compatible (Groq / OpenRouter)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>فرمت درخواست</Label>
                <select
                  value={form.requestFormat}
                  onChange={e => setForm(f => ({ ...f, requestFormat: e.target.value as 'gemini' | 'openai' }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="gemini">Gemini API</option>
                  <option value="openai">OpenAI API</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>آدرس Base URL</Label>
              <Input 
                value={form.baseUrl} 
                onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                placeholder="مثلا https://api.openai.com/v1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نام مدل</Label>
                <Input 
                  value={form.modelName} 
                  onChange={e => setForm(f => ({ ...f, modelName: e.target.value }))}
                  placeholder="gemini-2.0-flash یا gpt-4"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>اولویت (کمتر = بالاتر)</Label>
                <Input 
                  type="number"
                  value={form.priority} 
                  onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>کلید API Key</Label>
              <Input 
                type="password"
                value={form.apiKey} 
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder={editingProvider ? '••••••••••••' : 'AIzaSy...'}
                required={!editingProvider}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>حداکثر تلاش مجدد</Label>
                <Input 
                  type="number"
                  value={form.maxRetries} 
                  onChange={e => setForm(f => ({ ...f, maxRetries: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>تایم‌اوت (میلی‌ثانیه)</Label>
                <Input 
                  type="number"
                  value={form.timeoutMs} 
                  onChange={e => setForm(f => ({ ...f, timeoutMs: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">این سرویس فعال باشد</Label>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ذخیره اطلاعات
              </Button>
              <DialogClose render={<Button type="button" variant="outline">انصراف</Button>} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
