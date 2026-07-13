'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Image as ImageIcon,
  MessageCircle,
  Palette,
  Link2,
  LayoutList,
  Megaphone,
  BarChart3,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

interface OrbitImage {
  id: string
  title: string
  caption?: string | null
  alt: string
  mediaUrl: string
  thumbUrl?: string | null
  linkUrl?: string | null
  sortOrder: number
  isActive: boolean
}

interface HeroQuote {
  id: string
  text: string
  author?: string | null
  isActive: boolean
  sortOrder: number
}

interface LandingCta {
  id: string
  label: string
  href: string
  icon?: string | null
  variant: string
  sortOrder: number
  isActive: boolean
  authOnly: boolean
}

function useApi() {
  const token = useAuthStore((s) => s.accessToken)

  return useMemo(() => {
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    return {
      get: async (url: string) => {
        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error('خطا در دریافت اطلاعات')
        return res.json()
      },
      post: async (url: string, body: unknown) => {
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('خطا در ذخیره')
        return res.json()
      },
      patch: async (url: string, body: unknown) => {
        const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('خطا در بروزرسانی')
        return res.json()
      },
      del: async (url: string) => {
        const res = await fetch(url, { method: 'DELETE', headers })
        if (!res.ok) throw new Error('خطا در حذف')
        return res.json()
      },
    }
  }, [token])
}

function ImagesTab() {
  const api = useApi()
  const [images, setImages] = useState<OrbitImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', alt: '', mediaUrl: '', caption: '', linkUrl: '' })
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/landing/images')
      setImages(res.data)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      let data: { data?: { url: string }; error?: string } | null = null
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      }

      if (!res.ok) {
        throw new Error(data?.error || `بارگذاری ناموفق بود (${res.status})`)
      }
      if (data?.data?.url) {
        setForm((prev) => ({ ...prev, mediaUrl: data.data.url }))
      } else {
        throw new Error('پاسخ نامعتبر از سرور')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در بارگذاری فایل')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    await api.post('/api/admin/landing/images', {
      ...form,
      sortOrder: images.length,
    })
    setForm({ title: '', alt: '', mediaUrl: '', caption: '', linkUrl: '' })
    setShowForm(false)
    await load()
  }

  const handleToggle = async (img: OrbitImage) => {
    await api.patch('/api/admin/landing/images', { id: img.id, isActive: !img.isActive })
    await load()
  }

  const handleDelete = async (id: string) => {
    await api.del(`/api/admin/landing/images?id=${id}`)
    await load()
  }

  const handleMove = async (index: number, dir: -1 | 1) => {
    const other = index + dir
    if (other < 0 || other >= images.length) return
    await api.patch('/api/admin/landing/images', { id: images[index].id, sortOrder: other })
    await api.patch('/api/admin/landing/images', { id: images[other].id, sortOrder: index })
    await load()
  }

  if (loading) return <div className="p-8 text-center text-foreground-muted">در حال بارگذاری...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">تصاویر مدار ({images.length})</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="size-4" />
          افزودن تصویر
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>عنوان</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان تصویر" />
            </div>
            <div>
              <Label>متن جایگزین (alt)</Label>
              <Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="توضیح تصویر برای دسترس‌پذیری" />
            </div>
            <div>
              <Label>آدرس تصویر یا بارگذاری</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="/images/landing/..."
                  dir="ltr"
                  className="flex-1 font-mono text-xs"
                />
                <label className="cursor-pointer shrink-0">
                  <span className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface-container px-3 text-xs font-bold text-foreground hover:bg-surface-hover transition-colors">
                    {uploading ? 'درحال آپلود...' : 'انتخاب تصویر'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <div>
              <Label>لینک مقصد (اختیاری)</Label>
              <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." dir="ltr" />
            </div>
          </div>
          <div>
            <Label>توضیح (اختیاری)</Label>
            <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="توضیح در Lightbox" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!form.title || !form.alt || !form.mediaUrl} size="sm">
              <Save className="size-4" />
              ذخیره
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} size="sm">انصراف</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {images.map((img, idx) => (
          <div key={img.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-container-low px-3 py-2">
            <GripVertical className="size-4 text-foreground-muted shrink-0" />
            <div className="size-12 shrink-0 overflow-hidden rounded-md bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.mediaUrl} alt={img.alt} className="size-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{img.title}</div>
              <div className="truncate text-xs text-foreground-muted">{img.alt}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, 1)} disabled={idx === images.length - 1}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Switch checked={img.isActive} onCheckedChange={() => handleToggle(img)} />
              <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(img.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="py-12 text-center text-foreground-muted">هنوز تصویری اضافه نشده</div>
        )}
      </div>
    </div>
  )
}

function QuotesTab() {
  const api = useApi()
  const [quotes, setQuotes] = useState<HeroQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ text: '', author: '' })

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/landing/quotes')
      setQuotes(res.data)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const handleCreate = async () => {
    await api.post('/api/admin/landing/quotes', {
      ...form,
      sortOrder: quotes.length,
    })
    setForm({ text: '', author: '' })
    setShowForm(false)
    await load()
  }

  const handleToggle = async (q: HeroQuote) => {
    await api.patch('/api/admin/landing/quotes', { id: q.id, isActive: !q.isActive })
    await load()
  }

  const handleDelete = async (id: string) => {
    await api.del(`/api/admin/landing/quotes?id=${id}`)
    await load()
  }

  const handleMove = async (index: number, dir: -1 | 1) => {
    const other = index + dir
    if (other < 0 || other >= quotes.length) return
    await api.patch('/api/admin/landing/quotes', { id: quotes[index].id, sortOrder: other })
    await api.patch('/api/admin/landing/quotes', { id: quotes[other].id, sortOrder: index })
    await load()
  }

  if (loading) return <div className="p-8 text-center text-foreground-muted">در حال بارگذاری...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">نقل‌قول‌ها ({quotes.length})</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="size-4" />
          افزودن نقل‌قول
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
          <div>
            <Label>متن نقل‌قول</Label>
            <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="نقل‌قول..." rows={2} />
          </div>
          <div>
            <Label>نویسنده (اختیاری)</Label>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="نام نویسنده" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!form.text} size="sm">
              <Save className="size-4" />
              ذخیره
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} size="sm">انصراف</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {quotes.map((q, idx) => (
          <div key={q.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface-container-low px-4 py-3">
            <MessageCircle className="mt-1 size-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">«{q.text}»</p>
              {q.author && <p className="mt-1 text-xs text-foreground-muted">— {q.author}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, 1)} disabled={idx === quotes.length - 1}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Switch checked={q.isActive} onCheckedChange={() => handleToggle(q)} />
              <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(q.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="py-12 text-center text-foreground-muted">هنوز نقل‌قولی ثبت نشده</div>
        )}
      </div>
    </div>
  )
}

function CtaTab() {
  const api = useApi()
  const [ctas, setCtas] = useState<LandingCta[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', href: '', icon: '', variant: 'primary', authOnly: false })

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/landing/cta')
      setCtas(res.data)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const handleCreate = async () => {
    await api.post('/api/admin/landing/cta', {
      ...form,
      icon: form.icon || undefined,
      sortOrder: ctas.length,
    })
    setForm({ label: '', href: '', icon: '', variant: 'primary', authOnly: false })
    setShowForm(false)
    await load()
  }

  const handleToggle = async (c: LandingCta) => {
    await api.patch('/api/admin/landing/cta', { id: c.id, isActive: !c.isActive })
    await load()
  }

  const handleDelete = async (id: string) => {
    await api.del(`/api/admin/landing/cta?id=${id}`)
    await load()
  }

  const handleMove = async (index: number, dir: -1 | 1) => {
    const other = index + dir
    if (other < 0 || other >= ctas.length) return
    await api.patch('/api/admin/landing/cta', { id: ctas[index].id, sortOrder: other })
    await api.patch('/api/admin/landing/cta', { id: ctas[other].id, sortOrder: index })
    await load()
  }

  if (loading) return <div className="p-8 text-center text-foreground-muted">در حال بارگذاری...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">دکمه‌های ورود ({ctas.length})</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="size-4" />
          افزودن دکمه
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>برچسب</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="متن دکمه" />
            </div>
            <div>
              <Label>لینک</Label>
              <Input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/dashboard" dir="ltr" />
            </div>
            <div>
              <Label>آیکون (نام Lucide)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="LogIn" dir="ltr" />
            </div>
            <div>
              <Label>نوع</Label>
              <select
                value={form.variant}
                onChange={(e) => setForm({ ...form, variant: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-container px-3 py-2 text-sm text-foreground"
              >
                <option value="primary">اصلی (Primary)</option>
                <option value="secondary">ثانویه (Secondary)</option>
                <option value="ghost">شبح (Ghost)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.authOnly} onCheckedChange={(v) => setForm({ ...form, authOnly: v })} />
            <Label>فقط برای کاربران واردشده</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!form.label || !form.href} size="sm">
              <Save className="size-4" />
              ذخیره
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} size="sm">انصراف</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {ctas.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-container-low px-4 py-3">
            <Link2 className="size-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{c.label}</div>
              <div className="text-xs text-foreground-muted" dir="ltr">{c.href}</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-foreground-muted shrink-0">
              <span className="rounded bg-surface-container px-1.5 py-0.5">{c.variant}</span>
              {c.authOnly && <span className="rounded bg-warning/20 text-warning px-1.5 py-0.5">احراز</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, -1)} disabled={idx === 0}>
                <ArrowUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => handleMove(idx, 1)} disabled={idx === ctas.length - 1}>
                <ArrowDown className="size-3.5" />
              </Button>
              <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c)} />
              <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {ctas.length === 0 && (
          <div className="py-12 text-center text-foreground-muted">هنوز دکمه‌ای اضافه نشده</div>
        )}
      </div>
    </div>
  )
}

interface FeatureItem {
  icon: string
  title: string
  description: string
}

interface StatItem {
  value: string
  label: string
}

interface FooterLinkItem {
  label: string
  href: string
}

const FEATURE_ICONS = [
  'Calendar', 'Users', 'ShieldCheck', 'Wrench', 'MessageCircle',
  'GraduationCap', 'Radio', 'MapPin', 'Bell', 'ClipboardCheck', 'BarChart3', 'Bot',
]

function parseJsonSetting<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(fallback) ? (Array.isArray(parsed) ? (parsed as T) : fallback) : (parsed as T)
  } catch {
    return fallback
  }
}

function SectionsTab() {
  const api = useApi()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementHref, setAnnouncementHref] = useState('')
  const [featuresTitle, setFeaturesTitle] = useState('')
  const [features, setFeatures] = useState<FeatureItem[]>([])
  const [stats, setStats] = useState<StatItem[]>([])
  const [footerLinks, setFooterLinks] = useState<FooterLinkItem[]>([])

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/settings')
      const map: Record<string, string> = {}
      for (const s of res.data as Array<{ key: string; value: string }>) {
        if (s.key.startsWith('landing.')) map[s.key] = s.value
      }
      setAnnouncementEnabled(parseJsonSetting<unknown>(map['landing.announcementEnabled'], false) === true)
      setAnnouncementText(parseJsonSetting(map['landing.announcementText'], ''))
      setAnnouncementHref(parseJsonSetting(map['landing.announcementHref'], ''))
      setFeaturesTitle(parseJsonSetting(map['landing.featuresTitle'], ''))
      setFeatures(parseJsonSetting<FeatureItem[]>(map['landing.features'], []))
      setStats(parseJsonSetting<StatItem[]>(map['landing.stats'], []))
      setFooterLinks(parseJsonSetting<FooterLinkItem[]>(map['landing.footerLinks'], []))
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.patch('/api/admin/settings', {
        updates: [
          { key: 'landing.announcementEnabled', value: announcementEnabled },
          { key: 'landing.announcementText', value: announcementText },
          { key: 'landing.announcementHref', value: announcementHref },
          { key: 'landing.featuresTitle', value: featuresTitle },
          { key: 'landing.features', value: features.filter((f) => f.title) },
          { key: 'landing.stats', value: stats.filter((s) => s.label && s.value) },
          { key: 'landing.footerLinks', value: footerLinks.filter((l) => l.label && l.href) },
        ],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ذخیره')
    } finally {
      setSaving(false)
    }
  }

  const moveItem = <T,>(list: T[], set: (v: T[]) => void, index: number, dir: -1 | 1) => {
    const other = index + dir
    if (other < 0 || other >= list.length) return
    const next = [...list]
    ;[next[index], next[other]] = [next[other], next[index]]
    set(next)
  }

  if (loading) return <div className="p-8 text-center text-foreground-muted">در حال بارگذاری...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">بخش‌های صفحهٔ اصلی</h3>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-success">ذخیره شد ✓</span>}
          {error && <span className="text-xs text-danger">{error}</span>}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="size-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </div>

      {/* نوار اطلاعیه */}
      <section className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-accent" />
          <h4 className="text-sm font-bold text-foreground">نوار اطلاعیه</h4>
          <div className="ms-auto flex items-center gap-2">
            <Label className="text-xs text-foreground-muted">فعال</Label>
            <Switch checked={announcementEnabled} onCheckedChange={setAnnouncementEnabled} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>متن اطلاعیه</Label>
            <Input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="مثلاً: نسخهٔ جدید اپلیکیشن منتشر شد" />
          </div>
          <div>
            <Label>لینک (اختیاری)</Label>
            <Input value={announcementHref} onChange={(e) => setAnnouncementHref(e.target.value)} placeholder="/download" dir="ltr" />
          </div>
        </div>
      </section>

      {/* قابلیت‌ها */}
      <section className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LayoutList className="size-4 text-accent" />
          <h4 className="text-sm font-bold text-foreground">قابلیت‌های سامانه ({features.length})</h4>
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            onClick={() => setFeatures([...features, { icon: 'ClipboardCheck', title: '', description: '' }])}
          >
            <Plus className="size-4" />
            افزودن
          </Button>
        </div>
        <div>
          <Label>عنوان بخش</Label>
          <Input value={featuresTitle} onChange={(e) => setFeaturesTitle(e.target.value)} placeholder="عنوان بخش قابلیت‌ها" />
        </div>
        <div className="space-y-2">
          {features.map((f, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-surface-container px-3 py-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Input value={f.title} onChange={(e) => setFeatures(features.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="عنوان قابلیت" />
                <select
                  value={f.icon}
                  onChange={(e) => setFeatures(features.map((x, i) => i === idx ? { ...x, icon: e.target.value } : x))}
                  className="rounded-lg border border-border bg-surface-container px-3 py-2 text-sm text-foreground"
                  aria-label="آیکون"
                >
                  {FEATURE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => moveItem(features, setFeatures, idx, -1)} disabled={idx === 0}>
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => moveItem(features, setFeatures, idx, 1)} disabled={idx === features.length - 1}>
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button variant="destructive" size="icon-xs" onClick={() => setFeatures(features.filter((_, i) => i !== idx))}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea value={f.description} onChange={(e) => setFeatures(features.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="توضیح کوتاه" rows={2} />
            </div>
          ))}
          {features.length === 0 && (
            <div className="py-6 text-center text-sm text-foreground-muted">قابلیتی تعریف نشده — بخش در صفحه نمایش داده نمی‌شود</div>
          )}
        </div>
      </section>

      {/* آمار */}
      <section className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-accent" />
          <h4 className="text-sm font-bold text-foreground">آمار ({stats.length})</h4>
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            onClick={() => setStats([...stats, { value: '', label: '' }])}
          >
            <Plus className="size-4" />
            افزودن
          </Button>
        </div>
        <div className="space-y-2">
          {stats.map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_1fr_auto]">
              <Input value={s.value} onChange={(e) => setStats(stats.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))} placeholder="مقدار (مثلاً 32)" dir="ltr" />
              <Input value={s.label} onChange={(e) => setStats(stats.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} placeholder="برچسب (مثلاً ایستگاه فعال)" />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs" onClick={() => moveItem(stats, setStats, idx, -1)} disabled={idx === 0}>
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => moveItem(stats, setStats, idx, 1)} disabled={idx === stats.length - 1}>
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button variant="destructive" size="icon-xs" onClick={() => setStats(stats.filter((_, i) => i !== idx))}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {stats.length === 0 && (
            <div className="py-6 text-center text-sm text-foreground-muted">آماری تعریف نشده — بخش در صفحه نمایش داده نمی‌شود</div>
          )}
        </div>
      </section>

      {/* لینک‌های فوتر */}
      <section className="rounded-xl border border-border bg-surface-container-low p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-accent" />
          <h4 className="text-sm font-bold text-foreground">لینک‌های فوتر ({footerLinks.length})</h4>
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            onClick={() => setFooterLinks([...footerLinks, { label: '', href: '' }])}
          >
            <Plus className="size-4" />
            افزودن
          </Button>
        </div>
        <div className="space-y-2">
          {footerLinks.map((l, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Input value={l.label} onChange={(e) => setFooterLinks(footerLinks.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} placeholder="برچسب" />
              <Input value={l.href} onChange={(e) => setFooterLinks(footerLinks.map((x, i) => i === idx ? { ...x, href: e.target.value } : x))} placeholder="/login" dir="ltr" />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-xs" onClick={() => moveItem(footerLinks, setFooterLinks, idx, -1)} disabled={idx === 0}>
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => moveItem(footerLinks, setFooterLinks, idx, 1)} disabled={idx === footerLinks.length - 1}>
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button variant="destructive" size="icon-xs" onClick={() => setFooterLinks(footerLinks.filter((_, i) => i !== idx))}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {footerLinks.length === 0 && (
            <div className="py-6 text-center text-sm text-foreground-muted">لینکی تعریف نشده</div>
          )}
        </div>
      </section>
    </div>
  )
}

function SceneSettingsTab() {
  const api = useApi()
  const [settings, setSettings] = useState<Array<{
    key: string
    label: string
    type: string
    value: string
    options?: string | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/settings')
      const landing = (res.data as Array<typeof settings[number] & { category?: string }>).filter(
        (s) =>
          (('category' in s && s.category) ? s.category === 'landing' : s.key.startsWith('landing.')) &&
          s.type !== 'json',
      )
      setSettings(landing)
      const vals: Record<string, string> = {}
      for (const s of landing) {
        vals[s.key] = s.value
      }
      setLocalValues(vals)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = settings
        .filter((s) => localValues[s.key] !== s.value)
        .map((s) => {
          let val: unknown = localValues[s.key]
          try { val = JSON.parse(val as string) } catch { /* keep as string */ }
          return { key: s.key, value: val }
        })
      if (updates.length > 0) {
        await api.patch('/api/admin/settings', { updates })
      }
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-foreground-muted">در حال بارگذاری...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">تنظیمات صحنه و سئو</h3>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="size-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </Button>
      </div>

      <div className="space-y-3">
        {settings.map((s) => {
          const shortKey = s.key.replace('landing.', '')
          let parsedValue: unknown
          try { parsedValue = JSON.parse(localValues[s.key] ?? s.value) } catch { parsedValue = localValues[s.key] ?? s.value }

          return (
            <div key={s.key} className="rounded-lg border border-border bg-surface-container-low px-4 py-3">
              <Label className="text-sm font-medium text-foreground">{s.label}</Label>
              <div className="mt-1.5 text-xs text-foreground-muted mb-2">{shortKey}</div>

              {s.type === 'boolean' ? (
                <Switch
                  checked={parsedValue === true}
                  onCheckedChange={(v) => setLocalValues({ ...localValues, [s.key]: JSON.stringify(v) })}
                />
              ) : s.type === 'select' ? (
                <select
                  value={String(parsedValue)}
                  onChange={(e) => setLocalValues({ ...localValues, [s.key]: JSON.stringify(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface-container px-3 py-2 text-sm text-foreground"
                >
                  {(JSON.parse(s.options ?? '[]') as string[]).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : s.type === 'number' ? (
                <Input
                  type="number"
                  value={String(parsedValue)}
                  onChange={(e) => setLocalValues({ ...localValues, [s.key]: e.target.value })}
                  dir="ltr"
                />
              ) : (
                <Input
                  value={String(parsedValue)}
                  onChange={(e) => setLocalValues({ ...localValues, [s.key]: JSON.stringify(e.target.value) })}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminLandingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">مدیریت صفحهٔ اصلی</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            مدیریت تصاویر مدار، نقل‌قول‌ها، دکمه‌ها و تنظیمات صحنه سه‌بعدی
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-container px-3 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
        >
          <Eye className="size-4" />
          پیش‌نمایش
        </a>
      </div>

      <Tabs defaultValue="images">
        <TabsList variant="line" className="w-full overflow-x-auto">
          <TabsTrigger value="images">
            <ImageIcon className="size-4" />
            تصاویر مدار
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <MessageCircle className="size-4" />
            نقل‌قول‌ها
          </TabsTrigger>
          <TabsTrigger value="cta">
            <Link2 className="size-4" />
            دکمه‌ها
          </TabsTrigger>
          <TabsTrigger value="sections">
            <LayoutList className="size-4" />
            بخش‌های صفحه
          </TabsTrigger>
          <TabsTrigger value="scene">
            <Palette className="size-4" />
            صحنه و سئو
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="mt-4">
          <ImagesTab />
        </TabsContent>
        <TabsContent value="quotes" className="mt-4">
          <QuotesTab />
        </TabsContent>
        <TabsContent value="cta" className="mt-4">
          <CtaTab />
        </TabsContent>
        <TabsContent value="sections" className="mt-4">
          <SectionsTab />
        </TabsContent>
        <TabsContent value="scene" className="mt-4">
          <SceneSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
