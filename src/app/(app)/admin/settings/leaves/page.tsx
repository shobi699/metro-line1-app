'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/features/auth'
import { Save, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LeaveSetting {
  id: string
  key: string
  label: string
  description: string | null
  value: string
  isEnabled: boolean
}

interface LeaveConfig {
  maxDaysPerMonth: number
  requiresApproval: boolean
}

export default function AdminLeaveSettingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [settings, setSettings] = useState<LeaveSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTypeKey, setNewTypeKey] = useState('')
  const [newTypeLabel, setNewTypeLabel] = useState('')
  const [newTypeMaxDays, setNewTypeMaxDays] = useState('0')
  const [newTypeRequiresApproval, setNewTypeRequiresApproval] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  async function fetchSettings() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const leaveSettings = (json.data || []).filter((s: LeaveSetting) => s.key.startsWith('leave.type.'))
        setSettings(leaveSettings)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [accessToken])

  const handleUpdate = (index: number, field: string, value: any) => {
    const newSettings = [...settings]
    if (field === 'label' || field === 'description' || field === 'isEnabled') {
      (newSettings[index] as any)[field] = value
    } else {
      const parsedValue = JSON.parse(newSettings[index].value)
      parsedValue[field] = value
      newSettings[index].value = JSON.stringify(parsedValue)
    }
    setSettings(newSettings)
  }

  async function saveSettings() {
    if (!accessToken) return
    setSaving(true)
    setMessage('')
    try {
      const updates = settings.map(s => ({
        key: s.key,
        value: s.value,
        isEnabled: s.isEnabled
      }))
      
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ updates })
      })
      
      if (res.ok) {
        setMessage('تنظیمات با موفقیت ذخیره شد.')
      } else {
        setMessage('خطا در ذخیره تنظیمات.')
      }
    } catch (e) {
      setMessage('خطای ارتباط با سرور.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateNewType() {
    if (!accessToken) return
    if (!newTypeKey || !newTypeLabel) return
    setIsCreating(true)
    setMessage('')
    
    try {
      const valueObj: LeaveConfig = {
        maxDaysPerMonth: parseFloat(newTypeMaxDays) || 0,
        requiresApproval: newTypeRequiresApproval
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          key: `leave.type.${newTypeKey}`,
          label: newTypeLabel,
          description: '',
          type: 'text',
          value: JSON.stringify(valueObj),
          category: 'leaves'
        })
      })

      if (res.ok) {
        setMessage('نوع مرخصی جدید با موفقیت ایجاد شد.')
        setIsCreateModalOpen(false)
        setNewTypeKey('')
        setNewTypeLabel('')
        setNewTypeMaxDays('0')
        fetchSettings() // refresh
      } else {
        const err = await res.json()
        setMessage(err.error || 'خطا در ایجاد تنظیم.')
      }
    } catch (e) {
      setMessage('خطای ارتباط با سرور.')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteType(key: string) {
    if (!accessToken) return
    if (!confirm('آیا از حذف این نوع مرخصی اطمینان دارید؟')) return
    setMessage('')
    
    try {
      const res = await fetch(`/api/admin/settings?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (res.ok) {
        setMessage('تنظیم با موفقیت حذف شد.')
        fetchSettings() // refresh
      } else {
        const err = await res.json()
        setMessage(err.error || 'خطا در حذف تنظیم.')
      }
    } catch (e) {
      setMessage('خطای ارتباط با سرور.')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تنظیمات مرخصی و مأموریت</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مدیریت انواع مرخصی‌ها، اضافه‌کار، کشیک و سقف مجاز ماهانه
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsCreateModalOpen(true)} disabled={loading}>
            <Plus className="w-4 h-4 ms-2" />
            افزودن نوع جدید
          </Button>
          <Button onClick={saveSettings} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 ms-2 animate-spin" /> : <Save className="w-4 h-4 ms-2" />}
            ذخیره تغییرات
          </Button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted-foreground animate-pulse">در حال بارگذاری تنظیمات...</div>
      ) : (
        <div className="grid gap-4">
          {settings.length === 0 && (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/20">
              هیچ نوع مرخصی تعریف نشده است. روی «افزودن نوع جدید» کلیک کنید.
            </div>
          )}
          {settings.map((setting, i) => {
            let config: LeaveConfig = { maxDaysPerMonth: 0, requiresApproval: false }
            try {
              config = JSON.parse(setting.value)
            } catch {
              // ignore parse errors
            }
            
            return (
              <Card key={setting.id} className={!setting.isEnabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {setting.label}
                        <span className="text-xs text-muted-foreground font-normal bg-background px-2 py-0.5 rounded-full border">
                          {setting.key.replace('leave.type.', '')}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">{setting.description || 'بدون توضیحات'}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enable-${i}`} className="text-sm">فعال</Label>
                        <Switch 
                          id={`enable-${i}`} 
                          checked={setting.isEnabled} 
                          onCheckedChange={(val) => handleUpdate(i, 'isEnabled', val)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteType(setting.key)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`max-${i}`}>سقف مجاز ماهانه (روز)</Label>
                      <Input 
                        id={`max-${i}`}
                        type="number" 
                        step="0.5"
                        value={config.maxDaysPerMonth} 
                        onChange={(e) => handleUpdate(i, 'maxDaysPerMonth', parseFloat(e.target.value) || 0)}
                        disabled={!setting.isEnabled}
                      />
                    </div>
                    <div className="space-y-2 pt-8">
                      <div className="flex items-center gap-2">
                        <Switch 
                          id={`approval-${i}`} 
                          checked={config.requiresApproval} 
                          onCheckedChange={(val) => handleUpdate(i, 'requiresApproval', val)}
                          disabled={!setting.isEnabled}
                        />
                        <Label htmlFor={`approval-${i}`} className="cursor-pointer">نیاز به تایید مدیر دارد</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>افزودن نوع جدید مرخصی/مأموریت</DialogTitle>
            <DialogDescription>
              مشخصات نوع جدید را وارد کنید. این تنظیم بلافاصله در سیستم اعمال خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type-key">کلید سیستم (انگلیسی)</Label>
              <Input
                id="type-key"
                placeholder="مثال: sick_leave"
                value={newTypeKey}
                onChange={(e) => setNewTypeKey(e.target.value)}
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground">شناسه یکتا بدون فاصله (به عنوان leave.type.[key] ذخیره می‌شود)</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type-label">عنوان نمایشی (فارسی)</Label>
              <Input
                id="type-label"
                placeholder="مثال: مرخصی استعلاجی"
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type-max">سقف مجاز ماهانه (روز)</Label>
              <Input
                id="type-max"
                type="number"
                placeholder="0"
                value={newTypeMaxDays}
                onChange={(e) => setNewTypeMaxDays(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id="type-approval"
                checked={newTypeRequiresApproval}
                onCheckedChange={setNewTypeRequiresApproval}
              />
              <Label htmlFor="type-approval">نیاز به تایید مدیر دارد</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>انصراف</Button>
            <Button onClick={handleCreateNewType} disabled={isCreating || !newTypeKey || !newTypeLabel}>
              {isCreating && <Loader2 className="w-4 h-4 ms-2 animate-spin" />}
              ایجاد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
