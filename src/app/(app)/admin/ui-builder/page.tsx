'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { 
  Palette, 
  Menu as MenuIcon, 
  LayoutGrid, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle, 
  Smartphone, 
  Layout, 
  Eye, 
  Sliders,
  Type,
  TrendingUp,
  BarChart3,
  List,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

// Types
interface UiTheme {
  id: string
  primaryColor: string
  accentColor: string
  radius: number
  fontSize: string
  logoUrl: string
  apiBaseUrl: string
}

interface UiMenuItem {
  id?: string
  label: string
  icon: string
  route: string
  orderIndex: number
  isVisible: boolean
  requiredPermission: string | null
}

interface UiDashboardWidget {
  id?: string
  widgetType: string
  title: string | null
  size: string
  orderIndex: number
  isVisible: boolean
  configJson: Record<string, any>
  requiredPermission: string | null
}

interface UiPage {
  id: string
  title: string
  slug: string
  layoutType: string
  status: 'draft' | 'published'
  currentVersionId: string | null
  versions: Array<{
    id: string
    versionNumber: number
    schemaJson: {
      components: Array<{
        type: string
        props: Record<string, any>
      }>
    }
  }>
}

const AVAILABLE_ICONS = [
  { name: 'home', label: 'خانه' },
  { name: 'calendar', label: 'لوحه/تقویم' },
  { name: 'chat', label: 'گفتگو' },
  { name: 'tickets', label: 'تیکتینگ' },
  { name: 'profile', label: 'پروفایل' },
  { name: 'announcements', label: 'بخشنامه‌ها' },
  { name: 'radio', label: 'بی‌سیم' },
  { name: 'checklist', label: 'چک‌لیست' },
  { name: 'settings', label: 'تنظیمات' },
  { name: 'info', label: 'درباره ما' },
]

export default function WebUiBuilderPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [activeTab, setActiveTab] = useState<'theme' | 'menu' | 'dashboard' | 'pages'>('theme')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // System States
  const [theme, setTheme] = useState<UiTheme>({ id: '', primaryColor: '#ae0011', accentColor: '#575e70', radius: 12, fontSize: 'md', logoUrl: '', apiBaseUrl: 'https://metro.qzz.io' })
  const [menuItems, setMenuItems] = useState<UiMenuItem[]>([])
  const [widgets, setWidgets] = useState<UiDashboardWidget[]>([])
  const [pages, setPages] = useState<UiPage[]>([])

  // Selection states
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  
  // Custom Page Creator / Editor States
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [newPageLayout, setNewPageLayout] = useState('list')
  const [isCreatingPage, setIsCreatingPage] = useState(false)

  // Reset notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load all UI settings from API
  async function loadAllData() {
    if (!accessToken) return
    setLoading(true)
    try {
      // Fetch Theme
      const resTheme = await fetch('/api/admin/ui/theme', { headers: { Authorization: `Bearer ${accessToken}` } })
      const dataTheme = await resTheme.json()
      if (resTheme.ok && dataTheme.data) setTheme(dataTheme.data)

      // Fetch Menu
      const resMenu = await fetch('/api/admin/ui/menu', { headers: { Authorization: `Bearer ${accessToken}` } })
      const dataMenu = await resMenu.json()
      if (resMenu.ok && dataMenu.data) setMenuItems(dataMenu.data)

      // Fetch Dashboard
      const resDash = await fetch('/api/admin/ui/dashboard', { headers: { Authorization: `Bearer ${accessToken}` } })
      const dataDash = await resDash.json()
      if (resDash.ok && dataDash.data) setWidgets(dataDash.data)

      // Fetch Pages
      const resPages = await fetch('/api/admin/ui/pages', { headers: { Authorization: `Bearer ${accessToken}` } })
      const dataPages = await resPages.json()
      if (resPages.ok && dataPages.data) {
        setPages(dataPages.data)
        if (dataPages.data.length > 0 && !selectedPageId) {
          setSelectedPageId(dataPages.data[0].id)
        }
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در بارگذاری داده‌ها از سرور' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAllData()
  }, [accessToken])

  const selectedPage = useMemo(() => {
    return pages.find(p => p.id === selectedPageId) || null
  }, [pages, selectedPageId])

  // Save Theme changes
  async function handleSaveTheme() {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ui/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(theme)
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'تنظیمات تم با موفقیت ذخیره و در تلفن‌های پرسنل اعمال شد.' })
        if (data.data) setTheme(data.data)
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در ذخیره‌سازی تم' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در اتصال به سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Save Menu changes
  async function handleSaveMenu() {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ui/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ menuItems })
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'منوی ناوبری با موفقیت ذخیره و چیدمان زنده منوها اعمال شد.' })
        if (data.data) setMenuItems(data.data)
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در ذخیره‌سازی منو' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در اتصال به سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Save Dashboard changes
  async function handleSaveDashboard() {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ui/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ widgets })
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'ابزارک‌های صفحه خانه با موفقیت ذخیره و مجدداً چیده شدند.' })
        if (data.data) setWidgets(data.data)
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در ذخیره‌سازی ابزارک‌ها' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در اتصال به سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Save Custom Page changes
  async function handleSavePage(pageId: string, updatedFields: Partial<UiPage> & { components?: any[] }) {
    if (!accessToken) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ui/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(updatedFields)
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'تغییرات صفحه سفارشی با موفقیت ذخیره و نسخه جدید منتشر شد.' })
        setPages(pages.map(p => p.id === pageId ? { ...p, ...data.data } : p))
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در ذخیره‌سازی صفحه' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در اتصال به سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Create new Custom Page
  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !newPageTitle || !newPageSlug) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ui/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ title: newPageTitle, slug: newPageSlug, layoutType: newPageLayout })
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: `صفحه سفارشی "${newPageTitle}" با موفقیت ایجاد شد.` })
        setPages([data.data, ...pages])
        setSelectedPageId(data.data.id)
        setIsCreatingPage(false)
        setNewPageTitle('')
        setNewPageSlug('')
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در ایجاد صفحه' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Delete Custom Page
  async function handleDeletePage(pageId: string) {
    if (!accessToken || !confirm('آیا از حذف این صفحه سفارشی و تمامی نسخه‌های آن اطمینان دارید؟ این عمل غیر قابل بازگشت است.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/ui/pages/${pageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'صفحه سفارشی با موفقیت حذف شد.' })
        const remaining = pages.filter(p => p.id !== pageId)
        setPages(remaining)
        setSelectedPageId(remaining.length > 0 ? remaining[0].id : null)
      } else {
        setNotification({ type: 'error', text: data.error || 'خطا در حذف صفحه' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setSaving(false)
    }
  }

  // Helper: Shift item in list order
  function moveItem<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
    const nextList = [...list]
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= nextList.length) return list
    const temp = nextList[index]
    nextList[index] = nextList[swapWith]
    nextList[swapWith] = temp
    return nextList
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 bg-background" dir="rtl">
        <Loader2 className="size-8 animate-spin text-accent" />
        <span className="text-sm text-foreground-muted font-sans">در حال بارگذاری پنل مدیریت صفحه‌ساز و چیدمان...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl flex items-center gap-2">
            <Palette className="size-5 text-accent" />
            <span>مدیریت صفحه‌ساز و چیدمان (UI Builder)</span>
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5 font-sans">
            طراحی ظاهر، رنگ‌ها، ناوبری و صفحات اختصاصی اپلیکیشن موبایل پرسنل خط ۱ مترو به صورت زنده و SDUI
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div 
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-300 font-sans",
            notification.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-critical/10 border-critical/30 text-critical'
          )}
          role="alert"
        >
          {notification.type === 'success' ? (
            <Check className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Column Layout (Tabs Left / Custom View Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Categories Sidebar (3/12) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 border-b lg:border-b-0 lg:border-e border-border pb-2 lg:pb-0 lg:pe-4 shrink-0 scrollbar-none p-1 lg:p-0 rounded-lg">
          <button
            onClick={() => setActiveTab('theme')}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all text-start whitespace-nowrap cursor-pointer",
              activeTab === 'theme' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            )}
          >
            <Palette className="size-4" />
            <span>شخصی‌سازی تم رنگی و لبه‌ها</span>
          </button>
          
          <button
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all text-start whitespace-nowrap cursor-pointer",
              activeTab === 'menu' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            )}
          >
            <MenuIcon className="size-4" />
            <span>مدیریت منوها و زبانه‌ها</span>
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all text-start whitespace-nowrap cursor-pointer",
              activeTab === 'dashboard' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            )}
          >
            <LayoutGrid className="size-4" />
            <span>چیدمان ابزارک‌های خانه</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all text-start whitespace-nowrap cursor-pointer",
              activeTab === 'pages' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            )}
          >
            <FileText className="size-4" />
            <span>صفحات سفارشی و صفحه‌ساز</span>
          </button>
        </div>

        {/* Dynamic Panels (9/12) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: Theme Customizer */}
          {activeTab === 'theme' && (
            <Card className="border-border/60 bg-surface-container-low/30 backdrop-blur-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="size-4 text-accent" />
                  <span>شخصی‌سازی تم رنگی و لبه‌ها</span>
                </CardTitle>
                <CardDescription className="text-xs font-sans">
                  مشخصات بصری اصلی اپلیکیشن موبایل راهبران را مدیریت کنید. تغییرات بلافاصله در رنگ تم کلاینت اعمال می‌شوند.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Controls */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">رنگ تم برند (اصلی)</Label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg p-1.5 bg-background/50">
                        <input
                          type="color"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                          className="size-8 rounded-md cursor-pointer border border-border/40 p-0 bg-transparent shrink-0"
                        />
                        <Input
                          type="text"
                          value={theme.primaryColor}
                          onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                          className="h-8 border-none bg-transparent text-xs font-mono uppercase focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">رنگ فرعی (اکسنت)</Label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg p-1.5 bg-background/50">
                        <input
                          type="color"
                          value={theme.accentColor}
                          onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                          className="size-8 rounded-md cursor-pointer border border-border/40 p-0 bg-transparent shrink-0"
                        />
                        <Input
                          type="text"
                          value={theme.accentColor}
                          onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                          className="h-8 border-none bg-transparent text-xs font-mono uppercase focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold">
                        <Label>انحنای گوشه‌ها (شعاع لبه‌ها)</Label>
                        <span className="font-mono text-accent">{toFa(theme.radius)}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={theme.radius}
                        onChange={(e) => setTheme({ ...theme, radius: parseInt(e.target.value) })}
                        className="w-full mt-2 cursor-pointer accent-accent"
                      />
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <Label htmlFor="apiBaseUrl">آدرس دامنه سرور (API موبایل)</Label>
                      <Input
                        id="apiBaseUrl"
                        type="text"
                        value={theme.apiBaseUrl || ''}
                        onChange={(e) => setTheme({ ...theme, apiBaseUrl: e.target.value })}
                        placeholder="https://metro.qzz.io"
                        className="font-mono text-left text-xs dir-ltr"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        این آدرس برای دانلود تصاویر و اتصال بلادرنگ وب‌ساکت در کلاینت موبایل استفاده می‌شود.
                      </p>
                    </div>
                  </div>

                  {/* Right Preview */}
                  <div className="border border-border/60 rounded-xl bg-background/40 p-5 flex flex-col justify-between h-64 relative overflow-hidden">
                    <span className="absolute top-2 right-2 text-[10px] text-foreground-muted font-sans font-medium flex items-center gap-1">
                      <Smartphone className="size-3" />
                      <span>پیش‌نمایش زنده در موبایل</span>
                    </span>

                    <div className="space-y-3 mt-4">
                      {/* Dynamic Card */}
                      <div 
                        className="p-4 border bg-surface-container-low/60 shadow-sm"
                        style={{ borderRadius: `${theme.radius}px`, borderColor: `${theme.primaryColor}20` }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                          <span className="text-xs font-semibold">عنوان کارت پویا</span>
                        </div>
                        <p className="text-[10px] text-foreground-muted mt-1 leading-normal font-sans">
                          این پیش‌نمایش به صورت بلادرنگ تغییرات انحنا و تم رنگی انتخابی شما را شبیه‌سازی می‌کند.
                        </p>
                      </div>

                      {/* Dynamic Button */}
                      <button 
                        className="w-full py-2 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
                        style={{ borderRadius: `${theme.radius}px`, backgroundColor: theme.primaryColor }}
                      >
                        <span>ذخیره نهایی</span>
                        <Check className="size-3.5" />
                      </button>
                    </div>

                    <div className="text-[9px] text-foreground-muted/70 text-center font-sans">
                      تنظیمات بالا بلافاصله پس از فشردن دکمه ذخیره در کلاینت پرسنل آپدیت می‌شوند.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4 mt-6">
                  <Button
                    onClick={handleSaveTheme}
                    disabled={saving}
                    className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-2 font-medium"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    <span>ذخیره تغییرات تم رنگی</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Menu Builder */}
          {activeTab === 'menu' && (
            <Card className="border-border/60 bg-surface-container-low/30 backdrop-blur-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MenuIcon className="size-4 text-accent" />
                  <span>مدیریت منوها و زبانه‌ها</span>
                </CardTitle>
                <CardDescription className="text-xs font-sans">
                  زبانه‌ها (Tabs) در منوی ناوبری پایین اپلیکیشن موبایل پرسنل را اضافه، حذف یا چیدمان مجدد کنید.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Table of Menu Items */}
                  <div className="overflow-x-auto border border-border/60 rounded-xl">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                          <th className="p-3 w-12 text-center">ترتیب</th>
                          <th className="p-3">عنوان منو (فارسی)</th>
                          <th className="p-3">آیکون</th>
                          <th className="p-3">مسیر برنامه (Route)</th>
                          <th className="p-3 w-40">دسترسی نقش (حداقل)</th>
                          <th className="p-3 w-28 text-center">وضعیت نمایش</th>
                          <th className="p-3 w-24 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-xs font-sans">
                        {menuItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="p-3 text-center font-mono text-foreground-muted">{toFa(idx + 1)}</td>
                            <td className="p-3">
                              <Input
                                type="text"
                                value={item.label}
                                onChange={(e) => {
                                  const updated = [...menuItems]
                                  updated[idx].label = e.target.value
                                  setMenuItems(updated)
                                }}
                                className="h-8 bg-transparent text-xs w-36 font-sans border-border/30 hover:border-border"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.icon}
                                onChange={(e) => {
                                  const updated = [...menuItems]
                                  updated[idx].icon = e.target.value
                                  setMenuItems(updated)
                                }}
                                className="h-8 rounded bg-background border border-border/50 text-xs px-2"
                              >
                                {AVAILABLE_ICONS.map((ico) => (
                                  <option key={ico.name} value={ico.name}>
                                    {ico.label} ({ico.name})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <Input
                                type="text"
                                value={item.route}
                                onChange={(e) => {
                                  const updated = [...menuItems]
                                  updated[idx].route = e.target.value
                                  setMenuItems(updated)
                                }}
                                className="h-8 bg-transparent text-xs w-36 font-sans border-border/30 hover:border-border font-mono text-left dir-ltr"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.requiredPermission || ''}
                                onChange={(e) => {
                                  const updated = [...menuItems]
                                  updated[idx].requiredPermission = e.target.value || null
                                  setMenuItems(updated)
                                }}
                                className="h-8 rounded bg-background border border-border/50 text-xs px-2 w-full"
                              >
                                <option value="">همه پرسنل (بدون نقش)</option>
                                <option value="operator:role">فقط راهبران قطار</option>
                                <option value="admin:role">فقط مدیران حرکت (ادمین)</option>
                                <option value="super_admin:role">فقط مدیر کل سیستم</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  const updated = [...menuItems]
                                  updated[idx].isVisible = !updated[idx].isVisible
                                  setMenuItems(updated)
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded text-[10px] font-bold tracking-wide transition-all cursor-pointer",
                                  item.isVisible ? "bg-success/15 text-success" : "bg-neutral-800 text-neutral-400"
                                )}
                              >
                                {item.isVisible ? 'فعال / نمایان' : 'غیرفعال / پنهان'}
                              </button>
                            </td>
                            <td className="p-3 text-center flex items-center justify-center gap-1 mt-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => setMenuItems(moveItem(menuItems, idx, 'up'))}
                                className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="size-3 text-foreground-muted" />
                              </button>
                              <button
                                disabled={idx === menuItems.length - 1}
                                onClick={() => setMenuItems(moveItem(menuItems, idx, 'down'))}
                                className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="size-3 text-foreground-muted" />
                              </button>
                              <button
                                onClick={() => {
                                  setMenuItems(menuItems.filter((_, i) => i !== idx))
                                }}
                                className="size-6 rounded border border-critical/30 hover:bg-critical/10 flex items-center justify-center cursor-pointer text-critical"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add New Menu Item */}
                  <Button
                    onClick={() => {
                      setMenuItems([
                        ...menuItems,
                        {
                          label: 'زبانه‌ جدید',
                          icon: 'home',
                          route: 'Home',
                          orderIndex: menuItems.length,
                          isVisible: true,
                          requiredPermission: null
                        }
                      ])
                    }}
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/5"
                  >
                    <Plus className="size-3.5" />
                    <span>افزودن زبانه ناوبری جدید</span>
                  </Button>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4 mt-6">
                  <Button
                    onClick={handleSaveMenu}
                    disabled={saving}
                    className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-2 font-medium"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    <span>ذخیره چینش منو</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Dashboard Widgets */}
          {activeTab === 'dashboard' && (
            <Card className="border-border/60 bg-surface-container-low/30 backdrop-blur-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <LayoutGrid className="size-4 text-accent" />
                  <span>چیدمان ابزارک‌های خانه</span>
                </CardTitle>
                <CardDescription className="text-xs font-sans">
                  چیدمان و نحوه نمایش ابزارک‌های مختلف را در صفحه اصلی اپلیکیشن پرسنل شخصی‌سازی کنید.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Table of Widgets */}
                  <div className="overflow-x-auto border border-border/60 rounded-xl">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                          <th className="p-3 w-12 text-center">ترتیب</th>
                          <th className="p-3">نوع ابزارک (Widget Type)</th>
                          <th className="p-3">عنوان نمایشی (فارسی)</th>
                          <th className="p-3 w-32">اندازه ستون‌ها</th>
                          <th className="p-3 w-40">دسترسی نقش (حداقل)</th>
                          <th className="p-3 w-28 text-center">وضعیت نمایش</th>
                          <th className="p-3 w-24 text-center">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-xs font-sans">
                        {widgets.map((widget, idx) => (
                          <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                            <td className="p-3 text-center font-mono text-foreground-muted">{toFa(idx + 1)}</td>
                            <td className="p-3 font-mono text-accent">{widget.widgetType}</td>
                            <td className="p-3">
                              <Input
                                type="text"
                                value={widget.title || ''}
                                onChange={(e) => {
                                  const updated = [...widgets]
                                  updated[idx].title = e.target.value || null
                                  setMenuItems(updated as any)
                                }}
                                className="h-8 bg-transparent text-xs w-48 font-sans border-border/30 hover:border-border"
                                placeholder="مثال: آمار شیفت جاری"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={widget.size}
                                onChange={(e) => {
                                  const updated = [...widgets]
                                  updated[idx].size = e.target.value
                                  setWidgets(updated)
                                }}
                                className="h-8 rounded bg-background border border-border/50 text-xs px-2 w-full font-sans"
                              >
                                <option value="sm">نصف صفحه (Small)</option>
                                <option value="md">متوسط (Medium)</option>
                                <option value="lg">تمام صفحه (Large)</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={widget.requiredPermission || ''}
                                onChange={(e) => {
                                  const updated = [...widgets]
                                  updated[idx].requiredPermission = e.target.value || null
                                  setWidgets(updated)
                                }}
                                className="h-8 rounded bg-background border border-border/50 text-xs px-2 w-full font-sans"
                              >
                                <option value="">همه پرسنل (بدون نقش)</option>
                                <option value="operator:role">فقط راهبران قطار</option>
                                <option value="admin:role">فقط مدیران حرکت (ادمین)</option>
                                <option value="super_admin:role">فقط مدیر کل سیستم</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  const updated = [...widgets]
                                  updated[idx].isVisible = !updated[idx].isVisible
                                  setWidgets(updated)
                                }}
                                className={cn(
                                  "px-2.5 py-1 rounded text-[10px] font-bold tracking-wide transition-all cursor-pointer",
                                  widget.isVisible ? "bg-success/15 text-success" : "bg-neutral-800 text-neutral-400"
                                )}
                              >
                                {widget.isVisible ? 'فعال / نمایان' : 'غیرفعال / پنهان'}
                              </button>
                            </td>
                            <td className="p-3 text-center flex items-center justify-center gap-1 mt-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => setWidgets(moveItem(widgets, idx, 'up'))}
                                className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="size-3 text-foreground-muted" />
                              </button>
                              <button
                                disabled={idx === widgets.length - 1}
                                onClick={() => setWidgets(moveItem(widgets, idx, 'down'))}
                                className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="size-3 text-foreground-muted" />
                              </button>
                              <button
                                onClick={() => {
                                  setWidgets(widgets.filter((_, i) => i !== idx))
                                }}
                                className="size-6 rounded border border-critical/30 hover:bg-critical/10 flex items-center justify-center cursor-pointer text-critical"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add New Widget */}
                  <Button
                    onClick={() => {
                      setWidgets([
                        ...widgets,
                        {
                          widgetType: 'StatRow',
                          title: 'آمار ابزارک جدید',
                          size: 'md',
                          orderIndex: widgets.length,
                          isVisible: true,
                          configJson: {},
                          requiredPermission: null
                        }
                      ])
                    }}
                    variant="outline"
                    className="flex items-center gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/5 font-sans"
                  >
                    <Plus className="size-3.5" />
                    <span>افزودن ابزارک جدید</span>
                  </Button>
                </div>

                <div className="flex justify-end border-t border-border/30 pt-4 mt-6">
                  <Button
                    onClick={handleSaveDashboard}
                    disabled={saving}
                    className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-2 font-medium"
                  >
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    <span>ذخیره چیدمان ابزارک‌ها</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Custom Pages / SDUI Block Builder */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              {/* Selector Card */}
              <Card className="border-border/60 bg-surface-container-low/30 backdrop-blur-md">
                <CardHeader className="pb-4 border-b border-border/40">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="size-4 text-accent" />
                        <span>مدیریت صفحات سفارشی (SDUI)</span>
                      </CardTitle>
                      <CardDescription className="text-xs font-sans mt-0.5">
                        صفحاتی مانند آیین‌نامه‌ها، قوانین کاری و راهنماها را بسازید. این صفحات به طور داینامیک در موبایل رندر می‌شوند.
                      </CardDescription>
                    </div>

                    <Button
                      onClick={() => setIsCreatingPage(true)}
                      className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-1.5 text-xs self-start md:self-center font-medium"
                    >
                      <Plus className="size-4" />
                      <span>ایجاد صفحه سفارشی جدید</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {isCreatingPage ? (
                    <form onSubmit={handleCreatePage} className="p-2 space-y-4 max-w-lg border border-border/60 rounded-xl bg-background/30 p-4">
                      <div className="text-xs font-bold text-foreground">ثبت صفحه جدید</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-[10px] font-semibold">عنوان صفحه (فارسی)</Label>
                          <Input
                            type="text"
                            required
                            value={newPageTitle}
                            onChange={(e) => setNewPageTitle(e.target.value)}
                            placeholder="مثال: دستورالعمل بلاک ایمن"
                            className="h-8 text-xs mt-1.5"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] font-semibold">آدرس صفحه (Slug - انگلیسی)</Label>
                          <Input
                            type="text"
                            required
                            value={newPageSlug}
                            onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="مثال: safe-block-rules"
                            className="h-8 text-xs mt-1.5 font-mono text-left dir-ltr"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 justify-end mt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsCreatingPage(false)}
                          className="h-8 text-xs"
                        >
                          انصراف
                        </Button>
                        <Button
                          type="submit"
                          disabled={saving}
                          className="h-8 text-xs bg-accent hover:bg-accent-hover text-accent-foreground font-medium"
                        >
                          {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                          <span>تایید و ساخت صفحه</span>
                        </Button>
                      </div>
                    </form>
                  ) : pages.length === 0 ? (
                    <div className="text-center p-6 text-xs text-foreground-muted font-sans">
                      صفحه سفارشی ثبت نشده است. با زدن دکمه بالا اولین صفحه را ایجاد کنید.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {pages.map((p) => {
                        const isSelected = p.id === selectedPageId
                        return (
                          <div 
                            key={p.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-sans transition-all",
                              isSelected 
                                ? "bg-accent/10 border-accent/40 text-accent font-semibold" 
                                : "bg-surface-container border-border hover:bg-surface-hover cursor-pointer"
                            )}
                            onClick={() => setSelectedPageId(p.id)}
                          >
                            <span>{p.title}</span>
                            <span className="text-[10px] text-foreground-muted/60 font-mono">({p.slug})</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePage(p.id)
                              }}
                              className="text-foreground-muted hover:text-critical p-0.5"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Page Designer & Editor Component Block */}
              {selectedPage && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left: Designer Components Editor (7/12) */}
                  <div className="xl:col-span-7 space-y-4">
                    <Card className="border-border/60 bg-surface-container-low/30 backdrop-blur-md">
                      <CardHeader className="p-4 pb-2 border-b border-border/40">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layout className="size-4 text-accent" />
                            <span>موتور چیدمان اجزای صفحه «{selectedPage.title}»</span>
                          </div>
                          <Badge className={cn("text-[9px] px-1.5 py-0 rounded", selectedPage.status === 'published' ? "bg-success/10 text-success border-success/30" : "bg-neutral-800 text-neutral-400")}>
                            {selectedPage.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        
                        {/* Page Details Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border/30">
                          <div>
                            <Label className="text-[10px] font-semibold">عنوان نمایشی صفحه</Label>
                            <Input
                              type="text"
                              value={selectedPage.title}
                              onChange={(e) => {
                                setPages(pages.map(p => p.id === selectedPage.id ? { ...p, title: e.target.value } : p))
                              }}
                              className="h-8 text-xs mt-1.5 font-sans"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] font-semibold">قالب نمایش موبایل</Label>
                            <select
                              value={selectedPage.layoutType}
                              onChange={(e) => {
                                setPages(pages.map(p => p.id === selectedPage.id ? { ...p, layoutType: e.target.value } : p))
                              }}
                              className="h-8 rounded bg-background border border-border/50 text-xs px-2 w-full mt-1.5 font-sans"
                            >
                              <option value="list">لیست عمودی (List Layout)</option>
                              <option value="grid">جدول شبکه‌ای (Grid Layout)</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[10px] font-semibold">وضعیت انتشار</Label>
                            <select
                              value={selectedPage.status}
                              onChange={(e) => {
                                setPages(pages.map(p => p.id === selectedPage.id ? { ...p, status: e.target.value as any } : p))
                              }}
                              className="h-8 rounded bg-background border border-border/50 text-xs px-2 w-full mt-1.5 font-sans"
                            >
                              <option value="draft">پیش‌نویس (Draft)</option>
                              <option value="published">منتشر شده (Published)</option>
                            </select>
                          </div>
                        </div>

                        {/* Page Components List */}
                        <div className="space-y-3 pt-2">
                          <Label className="text-xs font-semibold block mb-2">اجزای فعال صفحه سفارشی (رندر درختی SDUI)</Label>
                          
                          {(selectedPage.versions[0]?.schemaJson?.components || []).length === 0 ? (
                            <div className="text-center p-8 border border-dashed border-border/60 rounded-xl text-xs text-foreground-muted font-sans">
                              هیچ المانی در این صفحه وجود ندارد. با زدن دکمه‌های زیر شروع به افزودن اجزا کنید.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                              {(selectedPage.versions[0]?.schemaJson?.components || []).map((comp, compIdx) => (
                                <div 
                                  key={compIdx}
                                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-background/80 transition-colors"
                                >
                                  {/* Comp Type & Props Settings Form */}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono tracking-wider font-semibold rounded">
                                        {comp.type === 'Text' && <Type className="size-3 text-amber-400" />}
                                        {comp.type === 'StatRow' && <TrendingUp className="size-3 text-green-400" />}
                                        {comp.type === 'ChartWidget' && <BarChart3 className="size-3 text-sky-400" />}
                                        {comp.type === 'DataList' && <List className="size-3 text-purple-400" />}
                                        {comp.type === 'Button' && <ExternalLink className="size-3 text-primary-light" />}
                                        <span className="ms-1">{comp.type}</span>
                                      </Badge>
                                    </div>

                                    {/* Dynamic inputs based on type */}
                                    {comp.type === 'Text' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                                        <Input
                                          type="text"
                                          placeholder="متن نمایشی"
                                          value={comp.props.content || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.content = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50"
                                        />
                                        <select
                                          value={comp.props.style || 'paragraph'}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.style = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 rounded bg-background border border-border/40 text-[10px] px-1 font-sans"
                                        >
                                          <option value="title">عنوان اصلی بزرگ (Title)</option>
                                          <option value="subtitle">عنوان فرعی (Subtitle)</option>
                                          <option value="paragraph">پاراگراف عادی (Paragraph)</option>
                                          <option value="description">توضیح کوتاه (Description)</option>
                                        </select>
                                      </div>
                                    )}

                                    {comp.type === 'StatRow' && (
                                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        <Input
                                          type="text"
                                          placeholder="عنوان"
                                          value={comp.props.title || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.title = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-sans"
                                        />
                                        <Input
                                          type="text"
                                          placeholder="مقدار"
                                          value={comp.props.value || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.value = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-sans font-medium"
                                        />
                                        <select
                                          value={comp.props.color || 'accent'}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.color = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 rounded bg-background border border-border/40 text-[10px] px-1 font-sans"
                                        >
                                          <option value="primary">رنگ برند (قرمز)</option>
                                          <option value="accent">خاکستری تیره</option>
                                          <option value="success">سبز (مثبت)</option>
                                          <option value="error">قرمز (منفی/خطا)</option>
                                        </select>
                                      </div>
                                    )}

                                    {comp.type === 'Button' && (
                                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        <Input
                                          type="text"
                                          placeholder="برچسب دکمه"
                                          value={comp.props.label || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.label = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-sans"
                                        />
                                        <Input
                                          type="text"
                                          placeholder="مسیر / آدرس"
                                          value={comp.props.target || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.target = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-mono text-left dir-ltr"
                                        />
                                        <select
                                          value={comp.props.action || 'navigate'}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.action = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 rounded bg-background border border-border/40 text-[10px] px-1 font-sans"
                                        >
                                          <option value="navigate">انتقال صفحه (Navigate)</option>
                                          <option value="api">اجرای وب‌سرویس (API)</option>
                                        </select>
                                      </div>
                                    )}

                                    {comp.type === 'DataList' && (
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <Input
                                          type="text"
                                          placeholder="عنوان هدر لیست"
                                          value={comp.props.title || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.title = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-sans"
                                        />
                                        <Input
                                          type="text"
                                          placeholder="آدرس فراخوانی داده‌ها (API URL)"
                                          value={comp.props.endpoint || ''}
                                          onChange={(e) => {
                                            const updatedPages = [...pages]
                                            const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                            updatedPages[pageIdx].versions[0].schemaJson.components[compIdx].props.endpoint = e.target.value
                                            setPages(updatedPages)
                                          }}
                                          className="h-7 text-xs bg-background/50 font-mono text-left dir-ltr"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Move/Delete controls */}
                                  <div className="flex items-center gap-1 shrink-0 mt-1">
                                    <button
                                      disabled={compIdx === 0}
                                      onClick={() => {
                                        const updatedPages = [...pages]
                                        const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                        const comps = updatedPages[pageIdx].versions[0].schemaJson.components
                                        updatedPages[pageIdx].versions[0].schemaJson.components = moveItem(comps, compIdx, 'up')
                                        setPages(updatedPages)
                                      }}
                                      className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowUp className="size-3 text-foreground-muted" />
                                    </button>
                                    <button
                                      disabled={compIdx === (selectedPage.versions[0]?.schemaJson?.components || []).length - 1}
                                      onClick={() => {
                                        const updatedPages = [...pages]
                                        const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                        const comps = updatedPages[pageIdx].versions[0].schemaJson.components
                                        updatedPages[pageIdx].versions[0].schemaJson.components = moveItem(comps, compIdx, 'down')
                                        setPages(updatedPages)
                                      }}
                                      className="size-6 rounded border border-border/60 hover:bg-surface-hover flex items-center justify-center disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowDown className="size-3 text-foreground-muted" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updatedPages = [...pages]
                                        const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                        const comps = updatedPages[pageIdx].versions[0].schemaJson.components
                                        updatedPages[pageIdx].versions[0].schemaJson.components = comps.filter((_, i) => i !== compIdx)
                                        setPages(updatedPages)
                                      }}
                                      className="size-6 rounded border border-critical/30 hover:bg-critical/10 flex items-center justify-center cursor-pointer text-critical"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Component Buttons */}
                        <div className="pt-4 border-t border-border/30">
                          <Label className="text-[10px] font-semibold text-foreground-muted block mb-2 font-sans">افزودن جزء جدید به درخت SDUI صفحه:</Label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => {
                                const updatedPages = [...pages]
                                const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                const comps = updatedPages[pageIdx].versions[0]?.schemaJson?.components || []
                                updatedPages[pageIdx].versions[0].schemaJson.components = [
                                  ...comps,
                                  { type: 'Text', props: { content: 'متن جدید', style: 'paragraph' } }
                                ]
                                setPages(updatedPages)
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <Plus className="size-3" />
                              <span>متن (Text)</span>
                            </button>
                            <button
                              onClick={() => {
                                const updatedPages = [...pages]
                                const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                const comps = updatedPages[pageIdx].versions[0]?.schemaJson?.components || []
                                updatedPages[pageIdx].versions[0].schemaJson.components = [
                                  ...comps,
                                  { type: 'StatRow', props: { title: 'شاخص جدید', value: '0', color: 'accent' } }
                                ]
                                setPages(updatedPages)
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <Plus className="size-3" />
                              <span>کارت آمار (StatRow)</span>
                            </button>
                            <button
                              onClick={() => {
                                const updatedPages = [...pages]
                                const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                const comps = updatedPages[pageIdx].versions[0]?.schemaJson?.components || []
                                updatedPages[pageIdx].versions[0].schemaJson.components = [
                                  ...comps,
                                  { type: 'Button', props: { label: 'کلیک کنید', target: 'Home', action: 'navigate' } }
                                ]
                                setPages(updatedPages)
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/15 cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <Plus className="size-3" />
                              <span>دکمه (Button)</span>
                            </button>
                            <button
                              onClick={() => {
                                const updatedPages = [...pages]
                                const pageIdx = updatedPages.findIndex(p => p.id === selectedPage.id)
                                const comps = updatedPages[pageIdx].versions[0]?.schemaJson?.components || []
                                updatedPages[pageIdx].versions[0].schemaJson.components = [
                                  ...comps,
                                  { type: 'DataList', props: { title: 'لیست داده', endpoint: '/api/directory' } }
                                ]
                                setPages(updatedPages)
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/15 cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <Plus className="size-3" />
                              <span>لیست داده (DataList)</span>
                            </button>
                          </div>
                        </div>
                      </CardContent>
                      
                      <div className="flex justify-end p-4 border-t border-border/30 bg-surface-container-low/20">
                        <Button
                          onClick={() => {
                            const comps = selectedPage.versions[0]?.schemaJson?.components || []
                            handleSavePage(selectedPage.id, {
                              title: selectedPage.title,
                              layoutType: selectedPage.layoutType,
                              status: selectedPage.status,
                              components: comps
                            })
                          }}
                          disabled={saving}
                          className="bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-2 font-medium h-9 text-xs"
                        >
                          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                          <span>ذخیره و انتشار نسخه جدید</span>
                        </Button>
                      </div>
                    </Card>
                  </div>

                  {/* Right: Phone Live Preview Simulator (5/12) */}
                  <div className="xl:col-span-5">
                    <div className="sticky top-6 border-4 border-border rounded-[36px] bg-background/90 p-3 shadow-2xl h-[560px] max-w-[280px] mx-auto relative overflow-hidden flex flex-col">
                      {/* Phone Speaker Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-border rounded-b-xl z-20 flex items-center justify-center">
                        <div className="h-1.5 w-10 bg-background rounded-full" />
                      </div>

                      {/* Screen Content Wrapper */}
                      <div className="flex-1 rounded-[24px] border border-border/60 bg-[#0f1013] overflow-y-auto p-4 pt-8 flex flex-col gap-4 relative scrollbar-none font-sans select-none">
                        
                        {/* Status bar */}
                        <div className="flex justify-between items-center text-[8px] text-foreground-muted px-2 py-0.5 select-none font-sans absolute top-2 left-2 right-2 z-10">
                          <span>۱۰:۳۰</span>
                          <div className="flex items-center gap-1">
                            <span>LTE</span>
                            <div className="w-4 h-2 border border-foreground-muted rounded-sm bg-foreground/60" />
                          </div>
                        </div>

                        {/* App header mock */}
                        <div className="flex items-center gap-2 border-b border-border/40 pb-2 mt-2">
                          <Smartphone className="size-3.5" style={{ color: theme.primaryColor }} />
                          <span className="text-[10px] font-bold text-foreground">{selectedPage.title}</span>
                          <span className="text-[7px] text-foreground-muted ms-auto font-mono">/{selectedPage.slug}</span>
                        </div>

                        {/* Rendering simulated SDUI elements in preview */}
                        <div className="flex-1 flex flex-col gap-2.5">
                          {(selectedPage.versions[0]?.schemaJson?.components || []).length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 p-4">
                              <Info className="size-5 text-foreground-muted opacity-50" />
                              <span className="text-[8px] text-foreground-muted font-sans">صفحه خالی است</span>
                            </div>
                          ) : (
                            (selectedPage.versions[0]?.schemaJson?.components || []).map((comp, idx) => {
                              if (comp.type === 'Text') {
                                const isTitle = comp.props.style === 'title'
                                const isSub = comp.props.style === 'subtitle'
                                const isDesc = comp.props.style === 'description'
                                return (
                                  <div 
                                    key={idx} 
                                    className={cn(
                                      "text-right",
                                      isTitle && "text-xs font-bold text-foreground border-r-2 pr-1.5",
                                      isSub && "text-[10px] font-semibold text-foreground/90",
                                      isDesc && "text-[7px] text-foreground-muted font-sans",
                                      (!isTitle && !isSub && !isDesc) && "text-[9px] text-foreground font-sans leading-relaxed"
                                    )}
                                    style={{ borderRightColor: isTitle ? theme.primaryColor : undefined }}
                                  >
                                    {comp.props.content || 'نمونه متن'}
                                  </div>
                                )
                              }

                              if (comp.type === 'StatRow') {
                                return (
                                  <div 
                                    key={idx} 
                                    className="p-2 border border-border/40 bg-surface-container-low/50 flex items-center justify-between text-[8px] font-sans"
                                    style={{ borderRadius: `${theme.radius / 1.5}px` }}
                                  >
                                    <span className="text-foreground-muted">{comp.props.title || 'شاخص'}</span>
                                    <span 
                                      className="font-bold font-data-mono"
                                      style={{ 
                                        color: comp.props.color === 'primary' 
                                          ? theme.primaryColor 
                                          : comp.props.color === 'success' 
                                            ? '#34c759' 
                                            : comp.props.color === 'error' 
                                              ? '#ff3b30' 
                                              : undefined 
                                      }}
                                    >
                                      {comp.props.value || '۰'}
                                    </span>
                                  </div>
                                )
                              }

                              if (comp.type === 'Button') {
                                return (
                                  <div 
                                    key={idx} 
                                    className="w-full text-center py-1.5 text-[8px] font-bold text-white shadow-sm flex items-center justify-center gap-1 font-sans cursor-pointer hover:opacity-90"
                                    style={{ 
                                      borderRadius: `${theme.radius / 1.5}px`, 
                                      backgroundColor: theme.primaryColor 
                                    }}
                                  >
                                    <span>{comp.props.label || 'دکمه تعاملی'}</span>
                                    <ChevronRight className="size-2.5" />
                                  </div>
                                )
                              }

                              if (comp.type === 'DataList') {
                                return (
                                  <div 
                                    key={idx} 
                                    className="p-2 border border-border/30 bg-surface-container-high/30 flex flex-col gap-1.5 text-[7px]"
                                    style={{ borderRadius: `${theme.radius / 1.5}px` }}
                                  >
                                    <div className="font-semibold text-foreground border-b border-border/20 pb-1">{comp.props.title || 'لیست داده'}</div>
                                    <div className="flex justify-between items-center bg-background/30 p-1 rounded-sm">
                                      <span className="text-foreground-muted">داده نمونه اول</span>
                                      <span className="font-data-mono">۱۰۱</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-background/30 p-1 rounded-sm">
                                      <span className="text-foreground-muted">داده نمونه دوم</span>
                                      <span className="font-data-mono">۱۰۲</span>
                                    </div>
                                  </div>
                                )
                              }

                              return null
                            })
                          )}
                        </div>

                        {/* Phone Home Indicator bar */}
                        <div className="h-1 w-20 bg-foreground/60 rounded-full mx-auto mt-auto shrink-0 select-none z-10" />
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
