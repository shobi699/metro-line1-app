'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { useShiftsStore } from '@/features/shifts'
import { getShiftForUserAndDate } from '@/lib/cycle-math'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { User, Shield, Phone, Mail, Calendar, KeyRound, Pencil, CheckCircle2, AlertCircle, Upload, Loader2, Contact, Briefcase } from 'lucide-react'

interface FullProfile {
  id: string
  nationalId: string
  name: string
  phone: string | null
  email: string | null
  status: string
  role: {
    name: string
    key: string
  }
  customFields: Record<string, unknown> | null
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدیر کل',
  admin: 'مدیر',
  operator: 'راهبر',
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: 'آماده به کار', color: 'bg-success' },
  busy: { label: 'مشغول', color: 'bg-destructive' },
  on_shift: { label: 'در شیفت کاری', color: 'bg-primary' },
  offline: { label: 'خارج از شیفت / استراحت', color: 'bg-neutral-500' },
}

const DEFAULT_THEME_COLORS = [
  { name: 'قرمز (برند خط ۱)', hex: '#e53935' },
  { name: 'آبی (مرکزی)', hex: '#007aff' },
  { name: 'سبز (ایمنی)', hex: '#34c759' },
  { name: 'نارنجی (هشدار)', hex: '#ff9500' },
  { name: 'خاکستری (سرد)', hex: '#8e8e93' },
]

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const { assignments, templates } = useShiftsStore()
  
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [carPlate, setCarPlate] = useState('')
  const [availability, setAvailability] = useState('online')
  const [themeColor, setThemeColor] = useState('#e53935')
  const [avatar, setAvatar] = useState('')
  const [personnelNo, setPersonnelNo] = useState('')
  const [group, setGroup] = useState('A')

  // Uploading state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const todayShift = useMemo(() => {
    if (!profile) return null
    const userIdForShift = profile.id === user?.id ? 'current' : profile.id
    const userGroup = (profile.customFields?.group as string) || undefined
    return getShiftForUserAndDate(userIdForShift, dayjs(), assignments, templates, undefined, userGroup)
  }, [profile, user, assignments, templates])

  async function loadProfile() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const prof = data.data as FullProfile
        setProfile(prof)
        setPhone(prof.phone || '')
        setEmail(prof.email || '')
        setCarPlate((prof.customFields?.carPlate as string) || '')
        setAvailability((prof.customFields?.availability as string) || 'online')
        setThemeColor((prof.customFields?.themeColor as string) || '#e53935')
        setAvatar((prof.customFields?.avatar as string) || '')
        setPersonnelNo((prof.customFields?.personnelNo as string) || '')
        setGroup((prof.customFields?.group as string) || 'A')
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [accessToken])

  const handleOpenEdit = () => {
    setError('')
    setSuccess('')
    if (profile) {
      setPhone(profile.phone || '')
      setEmail(profile.email || '')
      setCarPlate((profile.customFields?.carPlate as string) || '')
      setAvailability((profile.customFields?.availability as string) || 'online')
      setThemeColor((profile.customFields?.themeColor as string) || '#e53935')
      setAvatar((profile.customFields?.avatar as string) || '')
      setPersonnelNo((profile.customFields?.personnelNo as string) || '')
      setGroup((profile.customFields?.group as string) || 'A')
    }
    setEditing(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !accessToken) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setAvatar(data.data.url)
      } else {
        setError(data.error || 'خطا در بارگذاری تصویر')
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور هنگام بارگذاری فایل')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!accessToken) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phone,
          email,
          carPlate,
          availability,
          themeColor,
          avatar,
          personnelNo,
          group,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.data)
        setSuccess('اطلاعات پروفایل شما با موفقیت ذخیره شد.')
        setTimeout(() => setEditing(false), 1500)
      } else {
        setError(data.error || 'خطا در ثبت تغییرات')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-foreground-muted">در حال بارگذاری اطلاعات...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-foreground-muted">خطا در بارگذاری پروفایل</p>
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const activeTheme = (profile.customFields?.themeColor as string) || '#e53935'
  const activeAvailability = (profile.customFields?.availability as string) || 'online'
  const availabilityInfo = AVAILABILITY_LABELS[activeAvailability] || { label: 'نامشخص', color: 'bg-neutral-500' }
  const profileAvatar = profile.customFields?.avatar as string | undefined

  return (
    <div className="flex flex-1 flex-col gap-6 p-4" dir="rtl">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground">
          پروفایل من
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          مشاهده و ویرایش اطلاعات شخصی و شخصی‌سازی ظاهر حساب کاربری
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-full h-1" 
          style={{ backgroundColor: activeTheme }}
        />
        <CardContent className="flex flex-col items-center gap-4 p-6 pt-8">
          <div className="relative">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={profileAvatar} 
                alt={profile.name} 
                className="size-20 rounded-full object-cover border-2 shadow-sm"
                style={{ borderColor: activeTheme }}
              />
            ) : (
              <div 
                className="flex size-20 items-center justify-center rounded-full border-2 bg-surface-container-high font-headline-md text-xl"
                style={{ borderColor: activeTheme, color: activeTheme }}
              >
                {initials}
              </div>
            )}
            <div 
              className={cn("absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-surface", availabilityInfo.color)} 
              title={availabilityInfo.label} 
            />
          </div>
          <div className="text-center">
            <h2 className="font-headline-md text-foreground">{profile.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge>
                {profile.role ? (ROLE_LABEL[profile.role.key] || profile.role.name) : 'پرسنل'}
              </Badge>
              <span className="font-data-mono text-xs bg-surface-container-high text-foreground px-2 py-0.5 rounded border border-border-subtle">
                کد ملی: {profile.nationalId}
              </span>
            </div>
            <div className="text-xs text-foreground-muted mt-2 flex items-center justify-center gap-1.5">
              <span className={cn("size-2 rounded-full", availabilityInfo.color)} />
              <span>وضعیت حضور: {availabilityInfo.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Phone className="size-4" style={{ color: activeTheme }} />
              اطلاعات تماس و پلاک
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <Phone className="size-3.5" />
                تلفن همراه
              </span>
              <span className="font-data-mono">{profile.phone || 'ثبت‌نشده'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <Mail className="size-3.5" />
                ایمیل
              </span>
              <span className="font-data-mono">{profile.email || 'ثبت‌نشده'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <Calendar className="size-3.5" />
                پلاک خودرو
              </span>
              <span className="font-medium">{(profile.customFields?.carPlate as string) || 'ثبت‌نشده'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Shield className="size-4" style={{ color: activeTheme }} />
              سطح دسترسی و سازمانی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <Contact className="size-3.5" />
                شماره پرسنلی
              </span>
              <span className="font-data-mono font-semibold">{(profile.customFields?.personnelNo as string) || 'ثبت‌نشده'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <Shield className="size-3.5" />
                نقش سیستم
              </span>
              <span>{ROLE_LABEL[profile.role.key] || profile.role.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted flex items-center gap-2">
                <KeyRound className="size-3.5" />
                شناسه کاربری
              </span>
              <span className="font-data-mono text-xs">{profile.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-border-subtle/30 pt-3">
              <span className="text-foreground-muted flex items-center gap-2">
                <Briefcase className="size-3.5" />
                گروه کاری
              </span>
              <Badge variant="outline" className="font-semibold">
                {profile.customFields?.group === 'Staff' ? 'ستادی / اداری' : `گروه ${profile.customFields?.group || 'A'}`}
              </Badge>
            </div>
            {todayShift && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted flex items-center gap-2">
                  <Calendar className="size-3.5" />
                  شیفت امروز شما
                </span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Badge variant="outline" className={cn(
                    "text-[10px] px-2 py-0.5",
                    todayShift.shift?.code === 'morning' && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    todayShift.shift?.code === 'evening' && "bg-sky-500/20 text-sky-300 border-sky-500/30",
                    todayShift.shift?.code === 'night' && "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                    todayShift.shift?.code === 'office' && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                    todayShift.shift?.code === 'off' && "bg-neutral-800 text-neutral-400 border-neutral-700"
                  )}>
                    {todayShift.shift?.label || 'نامشخص'}
                  </Badge>
                  <span className="text-[10px] text-foreground-muted">({todayShift.templateName})</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenEdit}>
            <Pencil className="size-3.5" />
            ویرایش و شخصی‌سازی پروفایل
          </Button>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog Modal */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">ویرایش اطلاعات شخصی و شخصی‌سازی</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-critical/20 bg-critical/10 p-3 text-xs text-critical flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col gap-4 py-2">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border pb-4">
              <Label className="w-full text-right mb-1">عکس پروفایل</Label>
              <div className="relative">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="size-16 rounded-full object-cover border" />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full bg-surface-container-high text-foreground-muted border">
                    <User className="size-8" />
                  </div>
                )}
                {avatar && (
                  <button 
                    type="button" 
                    onClick={() => setAvatar('')}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full size-4 flex items-center justify-center shadow"
                  >
                    ×
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                className="h-8 gap-1.5"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>بارگذاری تصویر جدید</span>
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-personnel" className="text-right">شماره پرسنلی</Label>
              <Input
                id="edit-personnel"
                value={personnelNo}
                onChange={(e) => setPersonnelNo(e.target.value)}
                placeholder="مثال: 1002345"
                className="font-mono text-left"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone" className="text-right">تلفن همراه</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 09123456789"
                className="font-mono text-left"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email" className="text-right">ایمیل</Label>
              <Input
                id="edit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="font-mono text-left"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-carplate" className="text-right">پلاک خودرو</Label>
              <Input
                id="edit-carplate"
                value={carPlate}
                onChange={(e) => setCarPlate(e.target.value)}
                placeholder="مثال: ۱۲ ب ۳۴۵ ایران ۱۱"
                className="text-right"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-availability" className="text-right">وضعیت حضور</Label>
              <select
                id="edit-availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm"
              >
                {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-group" className="text-right">گروه کاری شیفت</Label>
              <select
                id="edit-group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm"
              >
                <option value="A">گروه الف (A)</option>
                <option value="B">گروه ب (B)</option>
                <option value="C">گروه ج (C)</option>
                <option value="Staff">ستادی / اداری</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-right">رنگ تم پروفایل</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DEFAULT_THEME_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    title={color.name}
                    className={cn(
                      "size-8 rounded-full border-2 transition-all relative flex items-center justify-center",
                      themeColor === color.hex ? "scale-110" : "opacity-80 hover:opacity-100"
                    )}
                    style={{ 
                      backgroundColor: color.hex, 
                      borderColor: themeColor === color.hex ? 'white' : 'transparent' 
                    }}
                    onClick={() => setThemeColor(color.hex)}
                  >
                    {themeColor === color.hex && (
                      <span className="size-2 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              انصراف
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


