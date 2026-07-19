'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, RotateCcw, Check, AlertCircle } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { ImageUploader } from '@/components/shared/image-uploader'
import { SharedFilesUploader } from '@/components/shared/shared-files-uploader'

interface Setting {
  id: string
  key: string
  label: string
  description: string | null
  type: string
  value: string // JSON serialized string
  defaultValue: string
  category: string
  min: number | null
  max: number | null
  options: string | null
}

interface AuditLog {
  id: string
  actorId: string
  entity: string
  entityId: string
  action: string
  before: any
  after: any
  createdAt: string
  actor?: {
    name: string | null
    email: string
    role: string
  }
}

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  general: { label: 'تنظیمات عمومی', icon: '⚙️' },
  ui: { label: 'طراحی و رابط کاربری', icon: '🎨' },
  shifts: { label: 'مدیریت شیفت‌ها', icon: '📅' },
  tickets: { label: 'خرابی و تیکتینگ', icon: '🎫' },
  chat: { label: 'پیام‌رسان و گفت‌وگو', icon: '💬' },
  mobile: { label: 'تنظیمات اپلیکیشن موبایل', icon: '📱' },
  comms: { label: 'ارتباطات صوتی و بی‌سیم', icon: '🎙️' },
  performance: { label: 'ارزیابی عملکرد و گیمیفیکیشن', icon: '🏆' },
  download: { label: 'تنظیمات صفحه دانلود', icon: '📥' },
  requests: { label: 'درخواست‌های پرسنلی', icon: '📝' },
  audit: { label: 'تاریخچه تغییرات', icon: '🕒' },
}

export default function AdminSettingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [settings, setSettings] = useState<Setting[]>([])
  const [localValues, setLocalValues] = useState<Record<string, string | number | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  
  // Notification states
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Reset notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Load settings
  async function loadSettings() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const settingsList = data.data as Setting[]
        setSettings(settingsList)
        
        // Parse values
        const values: Record<string, string | number | boolean> = {}
        settingsList.forEach((s) => {
          try {
            values[s.key] = JSON.parse(s.value)
          } catch {
            values[s.key] = s.value
          }
        })
        setLocalValues(values)
      } else {
        const errData = await res.json()
        setNotification({
          type: 'error',
          text: errData.error || 'خطا در دریافت تنظیمات',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load audit logs
  async function loadAuditLogs() {
    if (!accessToken) return
    setLoadingAudit(true)
    try {
      const res = await fetch('/api/admin/settings/audit-logs', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.data as AuditLog[])
      }
    } catch {
      // audit logs fetch failed silently
    } finally {
      setLoadingAudit(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadSettings()
    }
  }, [accessToken])

  useEffect(() => {
    if (activeTab === 'audit' && accessToken) {
      void loadAuditLogs()
    }
  }, [activeTab, accessToken])

  // Handle local state changes
  function handleValueChange(key: string, val: string | number | boolean) {
    setLocalValues((prev) => ({
      ...prev,
      [key]: val,
    }))
  }

  // Save active tab settings
  async function handleSave() {
    if (!accessToken) return
    setSaving(true)
    
    // Filter updates for the active tab
    const activeSettings = settings.filter((s) => s.category === activeTab)
    const updates = activeSettings.map((s) => ({
      key: s.key,
      value: localValues[s.key],
    }))

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ updates }),
      })

      const data = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: 'تنظیمات با موفقیت ذخیره شدند و زنده اعمال شدند.',
        })
        loadSettings()
      } else {
        setNotification({
          type: 'error',
          text: data.error || 'خطا در ذخیره تنظیمات',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در ذخیره تغییرات روی سرور',
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset a specific setting to default
  async function handleReset(key: string) {
    if (!accessToken) return
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تنظیم را به مقدار پیش‌فرض بازنشانی کنید؟')) {
      return
    }

    try {
      const res = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ key }),
      })

      const data = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: 'تنظیم با موفقیت به پیش‌فرض بازنشانی شد.',
        })
        loadSettings()
      } else {
        setNotification({
          type: 'error',
          text: data.error || 'خطا در بازنشانی تنظیم',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در برقراری ارتباط با سرور',
      })
    }
  }

  // Bulk reset all settings
  async function handleResetAll() {
    if (!accessToken) return
    if (!confirm('🚨 هشدار مهم!\nآیا مطمئن هستید که می‌خواهید تمامی تنظیمات سامانه را به مقادیر پیش‌فرض بازنشانی کنید؟ این اقدام بلافاصله بر روی کلاینت‌ها و اپلیکیشن موبایل پرسنل اعمال خواهد شد.')) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/reset-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await res.json()
      if (res.ok) {
        setNotification({
          type: 'success',
          text: 'تمامی تنظیمات با موفقیت به پیش‌فرض بازنشانی و زنده اعمال شدند.',
        })
        loadSettings()
        if (activeTab === 'audit') {
          void loadAuditLogs()
        }
      } else {
        setNotification({
          type: 'error',
          text: data.error || 'خطا در بازنشانی همگانی تنظیمات',
        })
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'خطا در ارتباط با سرور',
      })
    } finally {
      setSaving(false)
    }
  }

  // Filter settings by active tab
  const tabSettings = settings.filter((s) => s.category === activeTab)

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 bg-background">
        <Loader2 className="size-8 animate-spin text-accent" />
        <span className="text-sm text-foreground-muted">در حال بارگذاری تنظیمات سیستم...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            تنظیمات سیستم و شخصی‌سازی
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            پیکربندی هوشمند و زنده ماژول‌های سامانه سیر و حرکت خط ۱ مترو تهران
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
          {/* Reset All Button */}
          <Button
            onClick={handleResetAll}
            disabled={saving}
            variant="ghost"
            className="w-full md:w-auto text-critical hover:bg-critical/10 border border-critical/20 font-medium flex items-center justify-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            <RotateCcw className="size-4" />
            <span>بازنشانی همگانی</span>
          </Button>

          {/* Save Button for active tab settings */}
          <Button 
            onClick={handleSave} 
            disabled={saving || activeTab === 'audit' || tabSettings.length === 0}
            className="w-full md:w-auto bg-accent hover:bg-accent-hover text-accent-foreground font-medium flex items-center justify-center gap-2 px-5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره تغییرات این بخش
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            notification.type === 'success' 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-critical/10 border-critical/30 text-critical'
          }`}
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

      {/* Category Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation Menu */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 border-b lg:border-b-0 lg:border-e border-border pb-2 lg:pb-0 lg:pe-4 shrink-0 scrollbar-none bg-surface-container-low/20 p-1 lg:p-0 rounded-lg">
          {Object.entries(CATEGORY_MAP).map(([key, item]) => {
            const active = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all text-start whitespace-nowrap cursor-pointer ${
                  active 
                    ? 'bg-accent/10 text-accent font-semibold border border-accent/20' 
                    : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          <Card className="border border-border-subtle bg-surface-container-low/30 backdrop-blur-md shadow-none">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span>{CATEGORY_MAP[activeTab]?.icon}</span>
                <span>{CATEGORY_MAP[activeTab]?.label}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {activeTab === 'audit' 
                  ? 'تاریخچه ۵۰ واقعه اخیر تغییرات تنظیمات سیستم توسط اپراتورها و مدیران' 
                  : 'تغییرات این بخش بلافاصله در کل سامانه اعمال و لاگ‌های امنیتی ثبت می‌گردد.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/40 p-0">
              {activeTab === 'audit' ? (
                loadingAudit ? (
                  <div className="flex items-center justify-center p-8 gap-2">
                    <Loader2 className="size-5 animate-spin text-accent" />
                    <span className="text-sm text-foreground-muted">در حال بارگذاری تاریخچه تغییرات...</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-foreground-muted">
                    تاریخچه تغییراتی ثبت نشده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                          <th className="p-3 w-40">تاریخ و ساعت</th>
                          <th className="p-3 w-36">کاربر ویرایش‌کننده</th>
                          <th className="p-3">کلید تغییریافته</th>
                          <th className="p-3">مقدار قدیمی</th>
                          <th className="p-3">مقدار جدید</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-sm">
                        {auditLogs.map((log) => {
                          let beforeVal = ''
                          let afterVal = ''
                          try {
                            beforeVal = log.before && typeof log.before === 'object' && 'value' in log.before 
                              ? String(JSON.parse(log.before.value as string))
                              : String(log.before)
                          } catch {
                            beforeVal = log.before ? String(log.before) : ''
                          }
                          try {
                            afterVal = log.after && typeof log.after === 'object' && 'value' in log.after
                              ? String(JSON.parse(log.after.value as string))
                              : String(log.after)
                          } catch {
                            afterVal = log.after ? String(log.after) : ''
                          }

                          if (beforeVal === 'true') beforeVal = 'فعال'
                          if (beforeVal === 'false') beforeVal = 'غیرفعال'
                          if (afterVal === 'true') afterVal = 'فعال'
                          if (afterVal === 'false') afterVal = 'غیرفعال'

                          return (
                            <tr key={log.id} className="hover:bg-surface-hover/30 transition-colors duration-150">
                              <td className="p-3 font-mono text-xs text-foreground-muted">
                                {toFa(new Date(log.createdAt).toLocaleDateString('fa-IR'))} - {toFa(new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
                              </td>
                              <td className="p-3 font-medium text-xs">
                                <span className="block text-foreground">{log.actor?.name || 'نامشخص'}</span>
                                <span className="block text-[10px] text-foreground-muted">{log.actor?.email}</span>
                              </td>
                              <td className="p-3 font-mono text-xs text-foreground-muted dir-ltr text-end">{log.entityId}</td>
                              <td className="p-3 text-xs text-foreground-muted line-through truncate max-w-[120px]">{toFa(beforeVal)}</td>
                              <td className="p-3 text-xs text-accent font-semibold truncate max-w-[120px]">{toFa(afterVal)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : tabSettings.length === 0 ? (
                <div className="p-8 text-center text-sm text-foreground-muted">
                  تنظیمی در این بخش ثبت نشده است.
                </div>
              ) : (
                tabSettings.map((setting) => {
                  const currentValue = localValues[setting.key]
                  const isModified = JSON.stringify(currentValue) !== setting.value

                  return (
                    <div 
                      key={setting.key} 
                      className="p-4 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:bg-surface-hover/30"
                    >
                      {/* Left: Metadata */}
                      <div className="flex flex-col gap-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-semibold text-foreground cursor-default">
                            {setting.label}
                          </Label>
                          {isModified && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/40 text-accent bg-accent/5 rounded-md">
                              تغییر یافته
                            </Badge>
                          )}
                        </div>
                        {setting.description && (
                          <span className="text-xs text-foreground-muted leading-relaxed">
                            {setting.description}
                          </span>
                        )}
                        <span className="text-[10px] text-foreground-muted/60 font-mono tracking-tight dir-ltr text-start mt-1">
                          {setting.key}
                        </span>
                      </div>

                      {/* Right: Controller Input */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        {/* Custom Inputs based on type */}
                        {setting.type === 'text' && (
                          setting.key === 'requests.types' ? (
                            <textarea
                              value={String(currentValue ?? '')}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              rows={10}
                              dir="ltr"
                              className="w-full md:w-[400px] rounded-lg border border-border bg-background/50 p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring focus:border-accent resize-y"
                            />
                          ) : setting.key === 'download.sharedFiles' ? (
                            <div className="w-48 md:w-[480px]">
                              <SharedFilesUploader
                                value={String(currentValue ?? '[]')}
                                onChange={(val) => handleValueChange(setting.key, val)}
                              />
                            </div>
                          ) : setting.key.includes('Notice') || setting.key.includes('message') ? (
                            <textarea
                              value={String(currentValue ?? '')}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              rows={2}
                              className="w-48 md:w-64 rounded-lg border border-border bg-background/50 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:border-accent resize-y min-h-[60px]"
                            />
                          ) : (
                            ((setting.key.toLowerCase().includes('url') || setting.key.toLowerCase().includes('logo') || setting.key.toLowerCase().includes('banner')) && 
                             !setting.key.toLowerCase().includes('link') &&
                             setting.key !== 'download.android.value' &&
                             setting.key !== 'download.ios.value') ||
                            (setting.key === 'download.android.value' && localValues['download.android.type'] === 'file') ||
                            (setting.key === 'download.ios.value' && localValues['download.ios.type'] === 'file')
                          ) ? (
                            <div className="w-48 md:w-64">
                              <ImageUploader 
                                value={String(currentValue ?? '')}
                                onChange={(url) => handleValueChange(setting.key, url)}
                                accept={setting.key === 'download.android.value' ? '.apk' : setting.key === 'download.ios.value' ? '.ipa,.plist' : 'image/*'}
                                placeholder={setting.key.includes('download') ? 'آپلود فایل نصب' : 'آپلود تصویر'}
                              />
                            </div>
                          ) : (
                            <Input
                              type="text"
                              value={String(currentValue ?? '')}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="w-48 md:w-64 h-9 bg-background/50 text-sm focus-visible:ring-accent"
                            />
                          )
                        )}

                        {setting.type === 'color' && (
                          <div className="flex items-center gap-2 border border-border rounded-lg p-1 bg-background/50 w-48 md:w-64">
                            <input
                              type="color"
                              value={String(currentValue ?? '#ffffff')}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="size-7 rounded cursor-pointer border border-border/40 p-0 bg-transparent shrink-0"
                            />
                            <Input
                              type="text"
                              value={String(currentValue ?? '')}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="h-7 border-none bg-transparent text-sm focus-visible:ring-0 p-1 font-mono uppercase"
                            />
                          </div>
                        )}

                        {setting.type === 'number' && (
                          <div className="flex flex-col gap-1.5 w-48 md:w-64">
                            <Input
                              type="number"
                              min={setting.min ?? undefined}
                              max={setting.max ?? undefined}
                              value={Number(currentValue ?? 0)}
                              onChange={(e) => handleValueChange(setting.key, Number(e.target.value))}
                              className="h-9 bg-background/50 text-sm focus-visible:ring-accent font-mono"
                            />
                            {(setting.min !== null || setting.max !== null) && (
                              <div className="flex justify-between text-[10px] text-foreground-muted px-0.5">
                                <span>حداقل: {toFa(setting.min ?? 0)}</span>
                                <span>حداکثر: {toFa(setting.max ?? 0)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {setting.type === 'boolean' && (
                          <div className="flex items-center gap-2 w-48 md:w-64 justify-end">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!currentValue}
                                onChange={(e) => handleValueChange(setting.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-background border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:content-[''] after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-foreground-muted peer-checked:after:bg-accent-foreground after:border-none after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                              <span className="ms-2 text-xs font-medium text-foreground cursor-pointer">
                                {currentValue ? 'فعال' : 'غیرفعال'}
                              </span>
                            </label>
                          </div>
                        )}

                        {setting.type === 'select' && setting.options && (
                          <select
                            value={String(currentValue ?? '')}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className="w-48 md:w-64 h-9 rounded-lg border border-border bg-background/50 px-2.5 text-sm outline-none focus-visible:border-accent"
                          >
                            {(() => {
                              let parsed: any;
                              try {
                                parsed = JSON.parse(setting.options)
                              } catch {
                                parsed = setting.options
                              }
                              
                              let opts: string[] = []
                              if (Array.isArray(parsed)) {
                                opts = parsed
                              } else if (typeof parsed === 'string') {
                                opts = parsed.split(',')
                              }

                              return opts.map((opt) => (
                                <option key={opt} value={opt}>
                                  {toFa(opt)}
                                </option>
                              ))
                            })()}
                          </select>
                        )}

                        {/* Reset button to restore default value */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="بازنشانی به پیش‌فرض"
                          onClick={() => handleReset(setting.key)}
                          className="text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-md cursor-pointer shrink-0 size-8 p-0"
                        >
                          <RotateCcw className="size-4" />
                          <span className="sr-only">بازنشانی</span>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
