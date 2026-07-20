'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth'
import { useConfigStore } from '@/features/config'
import { toFa } from '@/lib/fa'
import {
  ShieldAlert,
  Save,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Smartphone,
  Monitor,
  Layers,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react'

interface ModuleFlag {
  id: string
  title: string
  description: string
  category: 'core' | 'comms' | 'advanced' | 'admin' | 'services'
  platform: 'both' | 'web' | 'mobile'
  enabled: boolean
  matchingPrefixes: string[]
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: 'همه ماژول‌ها', icon: '⚡' },
  core: { label: 'ماژول‌های اصلی عملیاتی', icon: '🚆' },
  comms: { label: 'ارتباطات و پیام‌رسانی', icon: '💬' },
  advanced: { label: 'ماژول‌های پیشرفته', icon: '🚀' },
  services: { label: 'خدمات و امکانات عمومی', icon: '⚙️' },
  admin: { label: 'بخش‌های پنل مدیریت', icon: '🛠️' },
}

export default function AdminModulesPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const setModuleFlagsStore = useConfigStore((s) => s.setModuleFlags)
  const fetchModuleFlagsStore = useConfigStore((s) => s.fetchModuleFlags)

  const [modules, setModules] = useState<ModuleFlag[]>([])
  const [initialModules, setInitialModules] = useState<ModuleFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Clear notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const isSuperAdmin = user?.roleKey === 'super_admin' || user?.roleKey === 'admin'

  async function loadModules() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/modules', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const list: ModuleFlag[] = data.data?.flags ?? []
        setModules(list)
        setInitialModules(list)
      } else {
        const errJson = await res.json().catch(() => ({}))
        setNotification({
          type: 'error',
          message: errJson?.error?.message ?? 'خطا در دریافت وضعیت ماژول‌ها',
        })
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModules()
  }, [accessToken])

  const hasChanges = useMemo(() => {
    if (modules.length !== initialModules.length) return true
    const initMap = new Map(initialModules.map((m) => [m.id, m.enabled]))
    return modules.some((m) => initMap.get(m.id) !== m.enabled)
  }, [modules, initialModules])

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesCategory = activeCategory === 'all' || m.category === activeCategory
      const matchesSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase().trim())
      return matchesCategory && matchesSearch
    })
  }, [modules, activeCategory, searchQuery])

  const stats = useMemo(() => {
    const total = modules.length
    const enabled = modules.filter((m) => m.enabled).length
    const disabled = total - enabled
    return { total, enabled, disabled }
  }, [modules])

  function toggleModule(id: string) {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
  }

  function handleEnableAll() {
    setModules((prev) => prev.map((m) => ({ ...m, enabled: true })))
  }

  function handleDisableAdvanced() {
    setModules((prev) =>
      prev.map((m) => (['advanced', 'services'].includes(m.category) ? { ...m, enabled: false } : m))
    )
  }

  function handleReset() {
    setModules(initialModules)
  }

  async function handleSave() {
    if (!accessToken) return
    setSaving(true)
    try {
      const payload = {
        flags: modules.map((m) => ({ id: m.id, enabled: m.enabled })),
      }
      const res = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        const updatedList: ModuleFlag[] = data.data?.flags ?? modules
        setModules(updatedList)
        setInitialModules(updatedList)

        // Update global client store
        setModuleFlagsStore(
          updatedList.map((m) => ({
            id: m.id,
            enabled: m.enabled,
            matchingPrefixes: m.matchingPrefixes,
          }))
        )
        fetchModuleFlagsStore()

        setNotification({
          type: 'success',
          message: 'تنظیمات ماژول‌ها و دسترسی‌های سیستم با موفقیت به‌روزرسانی شد',
        })
      } else {
        const errJson = await res.json().catch(() => ({}))
        setNotification({
          type: 'error',
          message: errJson?.error?.message ?? 'خطا در ثبت تغییرات ماژول‌ها',
        })
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'خطا در برقراری ارتباط با سرور' })
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3 text-destructive">
            <ShieldAlert className="w-6 h-6" />
            <span>این صفحه اختصاصی مدیران کل و سوپر ادمین سامانه می‌باشد.</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            مدیریت ماژول‌ها و بخش‌های سیستم (Super Admin)
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            فعال‌سازی یا غیرفعال‌سازی منوها، بخش‌ها و امکانات مختلف سامانه در نسخه وب و اپلیکیشن موبایل پرسنل
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="gap-1 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            بازنشانی
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-1 text-xs font-semibold"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            ذخیره تغییرات
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border text-sm flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-success/15 border-success/30 text-success'
              : 'bg-destructive/15 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {notification.message}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-surface-container-low border-border-subtle">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">کل ماژول‌ها</div>
              <div className="text-xl font-bold mt-1">{toFa(stats.total)}</div>
            </div>
            <Sparkles className="w-6 h-6 text-primary opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4 flex items-center justify-between text-success">
            <div>
              <div className="text-xs font-medium">ماژول‌های فعال</div>
              <div className="text-xl font-bold mt-1">{toFa(stats.enabled)}</div>
            </div>
            <CheckCircle2 className="w-6 h-6 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex items-center justify-between text-destructive">
            <div>
              <div className="text-xs font-medium">ماژول‌های خاموش/غیرفعال</div>
              <div className="text-xl font-bold mt-1">{toFa(stats.disabled)}</div>
            </div>
            <XCircle className="w-6 h-6 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Controls & Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="جستجوی نام یا توضیح ماژول..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-xs h-9"
              />
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleEnableAll} className="text-xs h-8">
                فعال‌سازی همه
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDisableAdvanced} className="text-xs h-8">
                خاموشی ماژول‌های فرعی
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-border-subtle/40">
            {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
              const isActive = activeCategory === catKey
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Module Grid */}
      {loading ? (
        <div className="text-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div className="text-xs text-muted-foreground">در حال دریافت وضعیت ماژول‌ها...</div>
        </div>
      ) : filteredModules.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-xs">
          هیچ ماژولی با فیلتر جستجوی انتخاب‌شده پیدا نشد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((module) => {
            return (
              <Card
                key={module.id}
                className={`transition-all duration-200 border ${
                  module.enabled
                    ? 'border-border-subtle bg-surface-container-low/50 hover:border-primary/40'
                    : 'border-destructive/30 bg-destructive/5 opacity-80'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{module.title}</span>
                        <Badge variant={module.enabled ? 'default' : 'outline'} className="text-[10px] px-2 py-0">
                          {module.enabled ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{module.description}</p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={module.enabled}
                      onClick={() => toggleModule(module.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        module.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                          module.enabled ? '-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Platforms & Prefixes Footer */}
                  <div className="flex items-center justify-between border-t border-border-subtle/30 pt-2.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {module.platform === 'both' ? (
                        <>
                          <Monitor className="w-3.5 h-3.5 text-info" />
                          <Smartphone className="w-3.5 h-3.5 text-success" />
                          <span>وب و موبایل</span>
                        </>
                      ) : module.platform === 'mobile' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-success" />
                          <span>اپلیکیشن موبایل</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-3.5 h-3.5 text-info" />
                          <span>سامانه وب</span>
                        </>
                      )}
                    </div>

                    <div className="text-muted-foreground font-mono text-[10px] truncate max-w-[200px]" dir="ltr">
                      {module.matchingPrefixes.join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
