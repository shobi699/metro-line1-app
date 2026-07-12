'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth'
import { calendarApi } from '@/features/calendar'

interface SettingsData {
  layers: {
    shift?: { on: boolean; color?: string }
    holidays?: { on: boolean; color?: string }
    personal?: { on: boolean; color?: string }
    org?: { on: boolean; color?: string }
    tasks?: { on: boolean; color?: string }
  }
  quickAddDefaults?: Record<string, { title?: string; amount?: string; hours?: string }>
}

export function CalendarSettingsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({ layers: {} })
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (open && accessToken) {
      setLoading(true)
      calendarApi.getPreferences(accessToken)
        .then((res: any) => {
          setSettings({ 
            layers: res.layers || {},
            quickAddDefaults: res.quickAddDefaults || {}
          })
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, accessToken])

  async function handleSave() {
    if (!accessToken) return
    setSaving(true)
    try {
      await calendarApi.updatePreferences(accessToken, settings)
      setOpen(false)
    } catch (e) {
      // Error handling
    } finally {
      setSaving(false)
    }
  }

  function toggleLayer(key: keyof SettingsData['layers']) {
    setSettings((prev) => {
      const current = prev.layers[key]?.on ?? true
      return {
        ...prev,
        layers: {
          ...prev.layers,
          [key]: { on: !current },
        },
      }
    })
  }

  function updateDefault(typeKey: string, field: 'title'|'hours'|'amount', value: string) {
    setSettings(prev => {
      const currentDefaults = prev.quickAddDefaults || {}
      return {
        ...prev,
        quickAddDefaults: {
          ...currentDefaults,
          [typeKey]: {
            ...(currentDefaults[typeKey] || {}),
            [field]: value
          }
        }
      }
    })
  }

  const quickAddTypes = [
    { key: 'overtime', label: 'اضافه کار', hasHours: true },
    { key: 'leave_hourly', label: 'مرخصی ساعتی', hasHours: true },
    { key: 'financial', label: 'مالی', hasAmount: true },
    { key: 'work_log', label: 'گزارش کار', hasHours: true },
    { key: 'task', label: 'کار' },
    { key: 'event', label: 'رویداد شخصی' },
    { key: 'on_call', label: 'کشیک' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Settings className="size-4" />
        <span className="hidden sm:inline">تنظیمات تقویم</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تنظیمات شخصی تقویم</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-foreground-muted animate-pulse">
            در حال دریافت تنظیمات...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <Tabs defaultValue="layers" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="layers">لایه‌های نمایشی</TabsTrigger>
              <TabsTrigger value="defaults">پیش‌فرض‌ها</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="space-y-4 py-4">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle p-3 hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">شیفت‌ها</span>
                  <span className="text-xs text-foreground-muted">نمایش لوحه کاری شما</span>
                </div>
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={settings.layers.shift?.on ?? true}
                  onChange={() => toggleLayer('shift')}
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle p-3 hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">تعطیلات رسمی</span>
                  <span className="text-xs text-foreground-muted">نمایش تعطیلات در تقویم</span>
                </div>
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={settings.layers.holidays?.on ?? true}
                  onChange={() => toggleLayer('holidays')}
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle p-3 hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">رویدادهای شخصی</span>
                  <span className="text-xs text-foreground-muted">گزارش‌کارها و رویدادهای من</span>
                </div>
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={settings.layers.personal?.on ?? true}
                  onChange={() => toggleLayer('personal')}
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle p-3 hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">رویدادهای سازمانی</span>
                  <span className="text-xs text-foreground-muted">برنامه‌های شرکت و رویدادهای عمومی</span>
                </div>
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={settings.layers.org?.on ?? true}
                  onChange={() => toggleLayer('org')}
                />
              </label>
            </TabsContent>

            <TabsContent value="defaults" className="py-4">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {quickAddTypes.map(type => {
                  const currentObj = settings.quickAddDefaults?.[type.key] || {}
                  return (
                    <div key={type.key} className="space-y-2 p-3 rounded-lg border border-border-subtle bg-surface/50">
                      <Label className="text-sm font-bold text-accent">{type.label}</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-foreground-muted">عنوان پیش‌فرض</Label>
                          <Input 
                            value={currentObj.title || ''} 
                            onChange={e => updateDefault(type.key, 'title', e.target.value)}
                            placeholder={type.label}
                            className="h-8 text-sm"
                          />
                        </div>
                        {type.hasHours && (
                          <div className="w-20 space-y-1">
                            <Label className="text-xs text-foreground-muted">ساعت</Label>
                            <Input 
                              type="number"
                              dir="ltr"
                              value={currentObj.hours || ''} 
                              onChange={e => updateDefault(type.key, 'hours', e.target.value)}
                              placeholder="0"
                              className="h-8 text-sm text-center"
                            />
                          </div>
                        )}
                        {type.hasAmount && (
                          <div className="w-28 space-y-1">
                            <Label className="text-xs text-foreground-muted">مبلغ</Label>
                            <Input 
                              type="number"
                              dir="ltr"
                              value={currentObj.amount || ''} 
                              onChange={e => updateDefault(type.key, 'amount', e.target.value)}
                              placeholder="0"
                              className="h-8 text-sm text-center"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="size-4" />
                {saving ? 'در حال ثبت...' : 'ذخیره تنظیمات'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
