'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { useShiftsStore } from '@/features/shifts'
import { getShiftForUserAndDate } from '@/lib/cycle-math'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toFa, jalali, faTime } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { 
  User,
  Shield,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Contact,
  Briefcase,
  Award,
  Clock,
  Activity,
  Check,
  Camera,
  MapPin,
  Palette,
  ClipboardList,
  Car,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react'

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

interface AuditLog {
  id: string
  actorId: string
  entity: string
  entityId: string
  action: string
  before: unknown
  after: unknown
  createdAt: string
}

interface Vehicle {
  id: string
  plateNum1: string
  plateLetter: string
  plateNum2: string
  plateCity: string
  carPlate: string
  carType: string
  carColor: string
  carLicenseExpiry: string
  status: 'pending' | 'approved' | 'rejected'
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدیر کل سیستم',
  admin: 'مدیر حرکت',
  operator: 'راهبر قطار',
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  online: { label: 'آماده به کار', color: 'bg-green-500 text-green-500', desc: 'حضور فعال در ایستگاه یا آماده انجام ماموریت' },
  busy: { label: 'مشغول', color: 'bg-red-500 text-red-500', desc: 'در حال اجرای ماموریت یا کارگاه آموزشی' },
  on_shift: { label: 'در شیفت کاری', color: 'bg-blue-500 text-blue-500', desc: 'مشغول به خدمت رسمی طبق لوحه روزانه' },
  offline: { label: 'خارج از شیفت / استراحت', color: 'bg-neutral-500 text-neutral-400', desc: 'پایان زمان کار و خروج از دپو / ایستگاه' },
}

const DEFAULT_THEME_COLORS = [
  { name: 'قرمز (برند خط ۱)', hex: '#e53935' },
  { name: 'آبی (مرکزی)', hex: '#007aff' },
  { name: 'سبز (ایمنی)', hex: '#34c759' },
  { name: 'نارنجی (هشدار)', hex: '#ff9500' },
  { name: 'خاکستری (سرد)', hex: '#8e8e93' },
  { name: 'بنفش (مدرن)', hex: '#af52de' },
]

const PLATE_LETTERS = ['الف', 'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ع', 'ق', 'ل', 'م', 'ن', 'و', 'ه', 'ی']

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { assignments, templates } = useShiftsStore()
  
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [updatingField, setUpdatingField] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Editable Contact states
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  
  // Custom states for sidebar direct picker sync
  const [availability, setAvailability] = useState('online')
  const [themeColor, setThemeColor] = useState('#e53935')

  // Personal Fields editable state (User can edit ALL personnel data)
  const [fatherName, setFatherName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [age, setAge] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [insuranceNo, setInsuranceNo] = useState('')
  const [education, setEducation] = useState('')
  
  // Organizational / Job Info Fields (Editable now)
  const [post, setPost] = useState('')
  const [shift, setShift] = useState('')
  const [shiftType, setShiftType] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [personnelNo, setPersonnelNo] = useState('')
  const [group, setGroup] = useState('A')

  // Qualifications & Percents (Editable now)
  const [drivingStatus, setDrivingStatus] = useState('')
  const [licenseClass1Date, setLicenseClass1Date] = useState('')
  const [licenseClass2Date, setLicenseClass2Date] = useState('')
  const [medicalExamValidity, setMedicalExamValidity] = useState('')
  const [driverPercent, setDriverPercent] = useState('')
  const [coDriverPercent, setCoDriverPercent] = useState('')
  const [traineeDriverPercent, setTraineeDriverPercent] = useState('')
  
  // Additional contacts
  const [address, setAddress] = useState('')
  const [phone3, setPhone3] = useState('')
  const [phone4, setPhone4] = useState('')

  // Dynamic phone numbers list (User can register any number of phones)
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([])

  // Dynamic vehicles list (User can register any number of vehicles)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Vehicle permit form states (for adding a new vehicle)
  const [plateNum1, setPlateNum1] = useState('')
  const [plateLetter, setPlateLetter] = useState('ب')
  const [plateNum2, setPlateNum2] = useState('')
  const [plateCity, setPlateCity] = useState('')
  const [carType, setCarType] = useState('')
  const [carColor, setCarColor] = useState('')
  const [carLicenseExpiry, setCarLicenseExpiry] = useState('۱۴۰۶/۱۲/۲۹')
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)

  // Uploading state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const todayShift = useMemo(() => {
    if (!profile) return null
    const userIdForShift = profile.id === user?.id ? 'current' : profile.id
    const userGroup = (profile.customFields?.group as string) || undefined
    return getShiftForUserAndDate(userIdForShift, dayjs(), assignments, templates, undefined, userGroup)
  }, [profile, user, assignments, templates])

  const getCustomField = (key: string): string => {
    if (!profile?.customFields) return ''
    return String(profile.customFields[key] || '')
  }

  const getFieldStatus = (key: string): 'pending' | 'approved' | 'rejected' => {
    if (!profile?.customFields) return 'approved'
    return (profile.customFields[`${key}_status`] as 'pending' | 'approved' | 'rejected') || 'approved'
  }

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
        setAvailability((prof.customFields?.availability as string) || 'online')
        setThemeColor((prof.customFields?.themeColor as string) || '#e53935')
        setAvatar((prof.customFields?.avatar as string) || '')

        // Personal identification fields
        setFatherName((prof.customFields?.fatherName as string) || '')
        setIdNumber((prof.customFields?.idNumber as string) || '')
        setBirthDate((prof.customFields?.birthDate as string) || '')
        setAge((prof.customFields?.age as string) || '')
        setBirthPlace((prof.customFields?.birthPlace as string) || '')
        setMaritalStatus((prof.customFields?.maritalStatus as string) || '')
        setInsuranceNo((prof.customFields?.insuranceNo as string) || '')
        setEducation((prof.customFields?.education as string) || '')

        // Job & Org fields
        setPersonnelNo((prof.customFields?.personnelNo as string) || '')
        setGroup((prof.customFields?.group as string) || 'A')
        setPost((prof.customFields?.post as string) || '')
        setShift((prof.customFields?.shift as string) || '')
        setShiftType((prof.customFields?.shiftType as string) || '')
        setStartLocation((prof.customFields?.startLocation as string) || '')
        setHireDate((prof.customFields?.hireDate as string) || '')

        // Safety & Qualifications
        setDrivingStatus((prof.customFields?.drivingStatus as string) || '')
        setLicenseClass1Date((prof.customFields?.licenseClass1Date as string) || '')
        setLicenseClass2Date((prof.customFields?.licenseClass2Date as string) || '')
        setMedicalExamValidity((prof.customFields?.medicalExamValidity as string) || '')
        setDriverPercent((prof.customFields?.driverPercent as string) || '')
        setCoDriverPercent((prof.customFields?.coDriverPercent as string) || '')
        setTraineeDriverPercent((prof.customFields?.traineeDriverPercent as string) || '')

        // Address & Other phone numbers
        setAddress((prof.customFields?.address as string) || '')
        setPhone3((prof.customFields?.phone3 as string) || '')
        setPhone4((prof.customFields?.phone4 as string) || '')

        // Dynamic phone numbers list
        setAdditionalPhones((prof.customFields?.additionalPhones as string[]) || [])

        // Dynamic vehicles list
        setVehicles((prof.customFields?.vehicles as Vehicle[]) || [])
      }
    } catch {
      setError('خطا در دریافت اطلاعات پرونده پرسنلی')
    } finally {
      setLoading(false)
    }
  }

  async function loadAuditLogs() {
    if (!accessToken) return
    setLogsLoading(true)
    try {
      const res = await fetch('/api/profile/audit-logs', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.data || [])
      }
    } catch {
      // silent
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
    void loadAuditLogs()
  }, [accessToken])

  // Direct instant field update handler (for theme color, availability, avatar)
  const handleUpdateDirectField = async (key: string, value: string) => {
    if (!accessToken || !profile) return
    setError('')
    setUpdatingField(key)
    try {
      const payload = {
        phone,
        email,
        avatar: key === 'avatar' ? value : avatar,
        availability: key === 'availability' ? value : availability,
        themeColor: key === 'themeColor' ? value : themeColor,
        vehicles,
      }
      
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        setProfile(data.data)
        if (key === 'themeColor') setThemeColor(value)
        if (key === 'availability') setAvailability(value)
        if (key === 'avatar') setAvatar(value)
        void loadAuditLogs()
      } else {
        setError(data.error || 'خطا در اعمال تنظیمات جدید')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`خطا در ارتباط با سرور: ${msg}`)
    } finally {
      setUpdatingField(null)
    }
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
        const fileUrl = data.data.url
        await handleUpdateDirectField('avatar', fileUrl)
      } else {
        setError(data.error || 'خطا در بارگذاری تصویر')
      }
    } catch {
      setError('خطا در ارتباط با سرور هنگام بارگذاری فایل')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Save the full Edit Form (Contact details + ALL personal details + dynamic phones list)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
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
          availability,
          themeColor,
          avatar,
          
          // Personal fields
          fatherName,
          idNumber,
          birthDate,
          age,
          birthPlace,
          maritalStatus,
          insuranceNo,
          education,
          
          // Job details
          post,
          shift,
          shiftType,
          startLocation,
          hireDate,
          personnelNo,
          group,

          // Safety & Qualifications
          drivingStatus,
          licenseClass1Date,
          licenseClass2Date,
          medicalExamValidity,
          driverPercent,
          coDriverPercent,
          traineeDriverPercent,

          // Contacts
          address,
          phone3,
          phone4,
          
          // Dynamic lists
          additionalPhones: additionalPhones.filter(p => p.trim() !== ''),
          vehicles,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.data)
        setSuccess('تغییرات با موفقیت ثبت شد و فیلدهای هویتی جهت تایید نهایی به مدیر ابلاغ گردید.');
        window.scrollTo({ top: 0, behavior: 'smooth' })
        void loadProfile()
        void loadAuditLogs()
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

  // Vehicle Permits List Action Handlers
  const handleAddVehicleToList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    if (!plateNum1 || !plateLetter || !plateNum2 || !plateCity || !carType) {
      setError('پر کردن شماره پلاک و نوع خودرو الزامی است.')
      return
    }

    setSavingVehicle(true)
    setError('')
    setSuccess('')

    const combinedPlate = `${plateNum1} ${plateLetter} ${plateNum2} ایران ${plateCity}`
    const newVehicle: Vehicle = {
      id: `VEH-${crypto.randomUUID()}`,
      plateNum1,
      plateLetter,
      plateNum2,
      plateCity,
      carPlate: combinedPlate,
      carType,
      carColor,
      carLicenseExpiry,
      status: 'pending' // automatically pending for manager review
    }

    const updatedVehicles = [...vehicles, newVehicle]

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vehicles: updatedVehicles,
          phone,
          email,
          availability,
          themeColor,
          avatar,
          fatherName,
          idNumber,
          birthDate,
          age,
          birthPlace,
          maritalStatus,
          insuranceNo,
          additionalPhones: additionalPhones.filter(p => p.trim() !== ''),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.data)
        setVehicles(updatedVehicles)
        setSuccess('خودروی جدید ثبت و جهت صدور مجوز تردد به دپو ابلاغ شد.')
        setIsAddingVehicle(false)
        resetVehicleForm()
        void loadAuditLogs()
      } else {
        setError(data.error || 'خطا در ثبت مشخصات خودرو')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${msg}`)
    } finally {
      setSavingVehicle(false)
    }
  }

  const handleRemoveVehicle = async (id: string) => {
    if (!accessToken) return
    if (!confirm('آیا از حذف این خودرو و ابطال مجوز تردد آن اطمینان دارید؟')) return

    setError('')
    setSuccess('')
    const updatedVehicles = vehicles.filter(v => v.id !== id)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vehicles: updatedVehicles,
          phone,
          email,
          availability,
          themeColor,
          avatar,
          fatherName,
          idNumber,
          birthDate,
          age,
          birthPlace,
          maritalStatus,
          insuranceNo,
          additionalPhones: additionalPhones.filter(p => p.trim() !== ''),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setProfile(data.data)
        setVehicles(updatedVehicles)
        setSuccess('خودرو با موفقیت حذف و ابطال مجوز تردد به گیت‌ها اعلام شد.')
        void loadAuditLogs()
      } else {
        setError(data.error || 'خطا در حذف خودرو')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${msg}`)
    }
  }

  const resetVehicleForm = () => {
    setPlateNum1('')
    setPlateLetter('ب')
    setPlateNum2('')
    setPlateCity('')
    setCarType('')
    setCarColor('')
    setCarLicenseExpiry('۱۴۰۶/۱۲/۲۹')
  }

  // Dynamic phone handlers
  const handleAdditionalPhoneChange = (index: number, val: string) => {
    const updated = [...additionalPhones]
    updated[index] = val
    setAdditionalPhones(updated)
  }

  const handleAddPhoneField = () => {
    setAdditionalPhones([...additionalPhones, ''])
  }

  const handleRemoveAdditionalPhone = (index: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== index))
  }

  // Helper to render field validation state badges in profile view
  const renderFieldBadge = (key: string) => {
    const status = getFieldStatus(key)
    if (status === 'pending') {
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-yellow-500/10 text-yellow-300 border-yellow-500/20 mr-2 flex items-center gap-0.5">
          <AlertTriangle className="size-2.5 shrink-0" />
          <span>در انتظار تایید</span>
        </Badge>
      )
    }
    if (status === 'rejected') {
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-400 border-red-500/20 mr-2 flex items-center gap-0.5">
          <X className="size-2.5 shrink-0" />
          <span>غیرفعال / رد شده</span>
        </Badge>
      )
    }
    return null
  }

  // Audit timeline description Farsi translator
  const translateAuditLog = (log: AuditLog) => {
    const isSelf = log.actorId === profile?.id
    const entity = log.entity
    const action = log.action

    if (action === 'login') return 'ورود موفق به سامانه سیر و حرکت'
    if (action === 'logout') return 'خروج از سامانه سیر و حرکت'

    if (entity === 'User') {
      if (action === 'update') {
        return isSelf ? 'ویرایش و شخصی‌سازی پروفایل کاربری شما' : 'ویرایش اطلاعات پرسنلی توسط مدیر حرکت'
      }
      return 'تغییرات در پروفایل کاربری'
    }

    if (entity === 'Ticket') {
      if (action === 'create') return 'ثبت تیکت اعلام خرابی تجهیزات'
      if (action === 'update') return 'بروزرسانی وضعیت تیکت خرابی پرسنل'
    }

    if (entity === 'SwapRequest') {
      if (action === 'create') return 'ارسال درخواست جابجایی شیفت در تقویم'
      if (action === 'update') return 'بروزرسانی وضعیت درخواست جابجایی شیفت'
    }

    if (entity === 'RosterFile') {
      if (action === 'create') return 'بارگذاری فایل لوحه شیفت کاری ماهانه'
    }

    // Default formatting
    const entityFarsi: Record<string, string> = {
      User: 'اطلاعات پرسنلی',
      Ticket: 'تیکت خرابی',
      SwapRequest: 'درخواست جابجایی',
      Bulletin: 'بخشنامه ایمنی',
      RosterFile: 'لوحه شیفت کاری',
    }

    const actionFarsi: Record<string, string> = {
      create: 'ایجاد',
      update: 'بروزرسانی',
      delete: 'حذف',
    }

    const item = entityFarsi[entity] || entity
    const op = actionFarsi[action] || action
    return `${op} ${item} در سامانه`
  }

  if (loading) {
    return (
      <div role="status" className="flex flex-1 flex-col items-center justify-center p-12">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-foreground-muted mt-4">در حال بارگذاری پرونده پرسنلی شما...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <AlertCircle className="size-12 text-critical" />
        <p className="text-sm text-foreground-muted">خطا در بارگذاری پرونده پرسنلی کاربری</p>
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const activeTheme = themeColor
  const activeAvailability = availability
  const availabilityInfo = AVAILABILITY_LABELS[activeAvailability] || { label: 'نامشخص', color: 'bg-neutral-500 text-neutral-400', desc: '' }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      {/* Banner / Header Card */}
      <Card className="relative overflow-hidden border-border-subtle bg-surface-container-low">
        {/* Decorative Theme Color Background Mesh */}
        <div 
          className="absolute top-0 right-0 w-full h-32 md:h-44 transition-all duration-300 opacity-20" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 10% 20%, ${activeTheme} 0%, transparent 50%), radial-gradient(circle at 90% 80%, ${activeTheme} 0%, transparent 60%)` 
          }}
        />
        <div 
          className="absolute top-0 right-0 w-full h-1.5 transition-all duration-300" 
          style={{ backgroundColor: activeTheme }}
        />

        <CardContent className="relative flex flex-col md:flex-row items-center md:items-end gap-5 p-6 pt-16 md:pt-24 z-10">
          {/* Floating Avatar Container */}
          <div className="relative shrink-0 -mt-10 md:mt-0">
            <div className="relative group rounded-full overflow-hidden border-4 border-background bg-surface-container-high shadow-xl size-24 md:size-32 transition-all">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={avatar} 
                  alt={profile.name} 
                  className="size-full object-cover"
                />
              ) : (
                <div 
                  className="flex size-full items-center justify-center font-headline-lg text-2xl md:text-4xl"
                  style={{ color: activeTheme }}
                >
                  {initials}
                </div>
              )}
              {/* Click overlay to upload avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white gap-1"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="size-5 text-white/90" />
                    <span className="text-[10px] font-medium font-sans">تغییر تصویر</span>
                  </>
                )}
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            {/* Realtime Status Indicator Ring */}
            <div 
              className={cn(
                "absolute bottom-1 right-1 size-5 rounded-full border-4 border-surface-container-low shadow-md",
                availabilityInfo.color.split(' ')[0]
              )} 
            />
          </div>

          {/* User Basic HR Details */}
          <div className="flex-1 text-center md:text-right space-y-2 pb-1">
            <div className="flex flex-col md:flex-row items-center gap-2.5 justify-center md:justify-start">
              <h2 className="font-headline-lg text-2xl md:text-3xl text-foreground font-bold">{profile.name}</h2>
              <Badge variant="outline" className="px-2.5 py-0.5 border-primary/20 text-primary bg-primary/5 font-semibold text-xs rounded-full">
                {profile.role ? (ROLE_LABEL[profile.role.key] || profile.role.name) : 'پرسنل'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-sm text-foreground-muted">
              <span className="flex items-center gap-1.5">
                <Contact className="size-4 opacity-75" />
                <span>کد ملی: <span className="font-data-mono">{toFa(profile.nationalId)}</span></span>
              </span>
              <span className="hidden md:inline text-border-subtle">•</span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="size-4 opacity-75" />
                <span>شماره پرسنلی: <span className="font-data-mono">{toFa(getCustomField('personnelNo') || '—')}</span></span>
              </span>
            </div>
          </div>

          {/* Shift status shortcut */}
          {todayShift && (
            <div className="shrink-0 flex flex-col items-center md:items-end gap-1.5 pt-4 md:pt-0">
              <span className="text-xs text-foreground-muted">شیفت کاری امروز شما:</span>
              <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-border/80">
                <Clock className="size-4 text-primary" />
                <Badge variant="outline" className={cn(
                  "text-xs px-2.5 py-0.5",
                  todayShift.shift?.code === 'morning' && "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  todayShift.shift?.code === 'evening' && "bg-sky-500/20 text-sky-300 border-sky-500/30",
                  todayShift.shift?.code === 'night' && "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                  todayShift.shift?.code === 'office' && "bg-purple-500/20 text-purple-300 border-purple-500/30",
                  todayShift.shift?.code === 'off' && "bg-neutral-800 text-neutral-400 border-neutral-700"
                )}>
                  {todayShift.shift?.label || 'نامشخص'}
                </Badge>
                <span className="text-xs text-foreground-muted font-sans font-medium">({todayShift.templateName})</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Right Sidebar Column - Interactive controls (3/10) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Availability Status switcher card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="size-4" style={{ color: activeTheme }} />
                وضعیت حضور کاربری
              </CardTitle>
              <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                وضعیت فعلی خود را جهت هماهنگی با مرکز فرماندهی (OCC) بروز کنید.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <div className="flex flex-col gap-2">
                {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => {
                  const isActive = activeAvailability === k
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={updatingField === 'availability'}
                      onClick={() => handleUpdateDirectField('availability', k)}
                      className={cn(
                        "w-full text-right p-3 rounded-lg border text-sm flex items-center justify-between transition-all hover:bg-surface-container-high/40 cursor-pointer",
                        isActive 
                          ? "border-primary/40 bg-surface-container-high font-semibold shadow-inner" 
                          : "border-border/40 bg-surface-container-low"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={cn("size-2.5 rounded-full shrink-0", v.color.split(' ')[0])} />
                        <div className="flex flex-col text-right">
                          <span>{v.label}</span>
                          <span className="text-[10px] text-foreground-muted font-normal mt-0.5 leading-tight">{v.desc}</span>
                        </div>
                      </div>
                      {isActive && (
                        updatingField === 'availability' ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <Check className="size-4 text-primary shrink-0" />
                        )
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Theme Color Circle Picker card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Palette className="size-4" style={{ color: activeTheme }} />
                شخصی‌سازی ظاهر کاربری
              </CardTitle>
              <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                رنگ سازمانی و موردعلاقه خود را برای محیط سامانه انتخاب کنید.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-6 gap-2 mt-1">
                {DEFAULT_THEME_COLORS.map((color) => {
                  const isSelected = activeTheme.toLowerCase() === color.hex.toLowerCase()
                  return (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.name}
                      disabled={updatingField === 'themeColor'}
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all relative flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm cursor-pointer",
                        isSelected ? "scale-110 border-white ring-2 ring-primary/20" : "border-transparent opacity-80"
                      )}
                      style={{ 
                        backgroundColor: color.hex, 
                      }}
                      onClick={() => handleUpdateDirectField('themeColor', color.hex)}
                    >
                      {isSelected && (
                        updatingField === 'themeColor' ? (
                          <Loader2 className="size-3.5 animate-spin text-white" />
                        ) : (
                          <span className="size-2 rounded-full bg-white shadow" />
                        )
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left main area - Tabs dashboard (7/10) */}
        <div className="lg:col-span-7 flex flex-col">
          <Tabs defaultValue="personnel" className="w-full flex flex-col flex-1">
            
            {/* Tabs List Navigation */}
            <TabsList className="bg-surface-container-high border border-border/80 w-full md:w-auto self-start mb-4">
              <TabsTrigger value="personnel" className="data-active:shadow-sm gap-2">
                <ClipboardList className="size-4" />
                <span>پرونده پرسنلی اصلی</span>
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="data-active:shadow-sm gap-2">
                <Car className="size-4" />
                <span>مجوز تردد خودروها ({toFa(vehicles.length)})</span>
              </TabsTrigger>
              <TabsTrigger value="edit" className="data-active:shadow-sm gap-2">
                <Pencil className="size-4" />
                <span>ویرایش اطلاعات و مشخصات</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-active:shadow-sm gap-2">
                <Activity className="size-4" />
                <span>گزارش فعالیت‌ها</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Personnel File details (with dynamic field verification badges) */}
            <TabsContent value="personnel" className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Identification Fields */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <User className="size-4" style={{ color: activeTheme }} />
                      مشخصات شناسنامه‌ای و فردی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 py-2 divide-y divide-border/30">
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">کد ملی</span>
                      <span className="font-semibold text-foreground font-data-mono">{toFa(profile.nationalId)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">نام پدر</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('fatherName') || '—'}
                        {renderFieldBadge('fatherName')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">شماره شناسنامه</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('idNumber') || '—')}
                        {renderFieldBadge('idNumber')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">تاریخ تولد</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('birthDate') || '—')}
                        {renderFieldBadge('birthDate')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">سن</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('age') || '—')}
                        {renderFieldBadge('age')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">محل تولد</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('birthPlace') || '—'}
                        {renderFieldBadge('birthPlace')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">وضعیت تاهل / فرزندان</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('maritalStatus') || '—'}
                        {renderFieldBadge('maritalStatus')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">گروه خونی / شماره بیمه</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('insuranceNo') || '—'}
                        {renderFieldBadge('insuranceNo')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">تحصیلات</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('education') || '—'}
                        {renderFieldBadge('education')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Organizational Fields */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Briefcase className="size-4" style={{ color: activeTheme }} />
                      اطلاعات سازمانی و شغلی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 py-2 divide-y divide-border/30">
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">شماره پرسنلی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('personnelNo') || '—')}
                        {renderFieldBadge('personnelNo')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">عنوان پست سازمانی</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('post') || (profile.role ? ROLE_LABEL[profile.role.key] : '—')}
                        {renderFieldBadge('post')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">کد گروه راهبری</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('group') === 'Staff' ? 'ستادی / اداری' : `گروه ${getCustomField('group') || 'A'}`}
                        {renderFieldBadge('group')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">نام شیفت کاری</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('shift') || '—'}
                        {renderFieldBadge('shift')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">نوع شیفت</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('shiftType') || '—'}
                        {renderFieldBadge('shiftType')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">ایستگاه شروع به کار</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('startLocation') || '—'}
                        {renderFieldBadge('startLocation')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">تاریخ استخدام / گروه شغلی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('hireDate') || '—')}
                        {renderFieldBadge('hireDate')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Qualifications & Safety */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Award className="size-4" style={{ color: activeTheme }} />
                      صلاحیت‌ها، گواهینامه‌ها و سلامت
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 py-2 divide-y divide-border/30">
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">وضعیت راهبری قطار</span>
                      <span className="font-semibold text-foreground flex items-center">
                        {getCustomField('drivingStatus') || '—'}
                        {renderFieldBadge('drivingStatus')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">تاریخ اخذ گواهینامه پایه ۱</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('licenseClass1Date') || '—')}
                        {renderFieldBadge('licenseClass1Date')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">تاریخ اخذ گواهینامه پایه ۲</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('licenseClass2Date') || '—')}
                        {renderFieldBadge('licenseClass2Date')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">اعتبار معاینه پزشکی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('medicalExamValidity') || '—')}
                        {renderFieldBadge('medicalExamValidity')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Operations Percentages */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Shield className="size-4" style={{ color: activeTheme }} />
                      درصدهای سهم کارکرد راهبری
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 py-2 divide-y divide-border/30">
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">درصد سهم راهبر قطار</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        ٪{toFa(getCustomField('driverPercent') || '0')}
                        {renderFieldBadge('driverPercent')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">درصد سهم کمک راهبری</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        ٪{toFa(getCustomField('coDriverPercent') || '0')}
                        {renderFieldBadge('coDriverPercent')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm">
                      <span className="text-foreground-muted">درصد سهم راهبر آموزشی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        ٪{toFa(getCustomField('traineeDriverPercent') || '0')}
                        {renderFieldBadge('traineeDriverPercent')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Additional Contacts Info */}
                <Card className="border-border/60 shadow-sm md:col-span-2">
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <MapPin className="size-4" style={{ color: activeTheme }} />
                      سایر کانال‌های ارتباطی پرسنلی و آدرس
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex justify-between items-center py-2.5 text-sm border-b border-border/30">
                      <span className="text-foreground-muted">تلفن همراه اول</span>
                      <span className="font-data-mono font-semibold text-foreground">{toFa(profile.phone || '—')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 text-sm border-b border-border/30">
                      <span className="text-foreground-muted">ایمیل پرسنلی</span>
                      <span className="font-semibold text-foreground">{profile.email || '—'}</span>
                    </div>
                    
                    {/* Render dynamic phone numbers */}
                    {additionalPhones.map((ph, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 text-sm border-b border-border/30">
                        <span className="text-foreground-muted">تلفن همراه {toFa(idx + 2)}</span>
                        <span className="font-data-mono font-semibold text-foreground">{toFa(ph)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center py-2.5 text-sm border-b border-border/30">
                      <span className="text-foreground-muted">تلفن ۳ پرسنلی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('phone3') || '—')}
                        {renderFieldBadge('phone3')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2.5 text-sm border-b border-border/30">
                      <span className="text-foreground-muted">تلفن ۴ پرسنلی</span>
                      <span className="font-semibold text-foreground font-data-mono flex items-center">
                        {toFa(getCustomField('phone4') || '—')}
                        {renderFieldBadge('phone4')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2.5 text-sm border-b border-border/30 md:border-0 md:col-span-2">
                      <span className="text-foreground-muted shrink-0 me-4">آدرس پستی محل سکونت</span>
                      <span className="font-semibold text-foreground text-left md:text-right flex items-center">
                        {getCustomField('address') || '—'}
                        {renderFieldBadge('address')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2: Vehicles Permit Registration (Support ANY number of vehicles) */}
            <TabsContent value="vehicle" className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Header Action Card */}
              <div className="flex justify-between items-center bg-surface-container-high/40 p-4 rounded-lg border border-border/50">
                <div className="text-right">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Car className="size-4" style={{ color: activeTheme }} />
                    لیست خودروهای مجاز پرسنل خط ۱
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1 leading-normal">
                    شما می‌توانید به تعداد دلخواه خودرو برای تردد در پارکینگ‌های دپو کهریزک و صادقیه ثبت کنید.
                  </p>
                </div>
                {!isAddingVehicle && (
                  <Button 
                    size="sm" 
                    onClick={() => { resetVehicleForm(); setIsAddingVehicle(true); }}
                    className="gap-1.5 h-9 shrink-0 cursor-pointer"
                  >
                    <span>+ ثبت خودروی جدید</span>
                  </Button>
                )}
              </div>

              {/* Add New Vehicle Form Card */}
              {isAddingVehicle && (
                <Card className="border-border/60 shadow-sm bg-surface-container-low/20 animate-in slide-in-from-top-2 duration-200">
                  <CardHeader className="p-4 pb-2 border-b border-border/30 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">ثبت مشخصات وسیله نقلیه و پرسنل</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingVehicle(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="size-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleAddVehicleToList} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-right text-xs font-semibold text-foreground">نام و نام خانوادگی پرسنل *</Label>
                          <Input
                            value={profile.name}
                            disabled
                            className="bg-surface-container-high text-foreground-muted cursor-not-allowed opacity-80"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-right text-xs font-semibold text-foreground">کد پرسنلی *</Label>
                          <Input
                            value={getCustomField('personnelNo') || '—'}
                            disabled
                            className="bg-surface-container-high text-foreground-muted cursor-not-allowed opacity-80 font-mono text-left"
                          />
                        </div>
                      </div>

                      {/* Plate Number Inputs */}
                      <div className="flex flex-col gap-2">
                        <Label className="text-right text-xs font-semibold text-foreground">شماره پلاک ملی خودرو *</Label>
                        
                        <div className="flex items-center justify-center gap-3 bg-surface-container-high/40 p-4 rounded-lg border border-border/50 max-w-xl mx-auto" dir="ltr">
                          
                          {/* 1. Left 2 Digits */}
                          <input
                            type="text"
                            maxLength={2}
                            value={plateNum1}
                            onChange={(e) => setPlateNum1(e.target.value.replace(/\D/g, ''))}
                            placeholder="۶۶"
                            className="h-10 w-16 border border-input bg-background text-foreground text-center font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />

                          {/* 2. Plate Letter Selection */}
                          <select
                            value={plateLetter}
                            onChange={(e) => setPlateLetter(e.target.value)}
                            className="h-10 w-20 border border-input bg-background text-foreground text-center font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                          >
                            {PLATE_LETTERS.map((letter) => (
                              <option key={letter} value={letter} className="bg-popover text-foreground">
                                {letter}
                              </option>
                            ))}
                          </select>

                          {/* 3. Middle 3 Digits */}
                          <input
                            type="text"
                            maxLength={3}
                            value={plateNum2}
                            onChange={(e) => setPlateNum2(e.target.value.replace(/\D/g, ''))}
                            placeholder="۳۴۵"
                            className="h-10 w-20 border border-input bg-background text-foreground text-center font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />

                          {/* 4. Separator Text */}
                          <span className="text-sm font-semibold text-foreground-muted px-1" dir="rtl">
                            ایران -
                          </span>

                          {/* 5. Right City 2 Digits */}
                          <input
                            type="text"
                            maxLength={2}
                            value={plateCity}
                            onChange={(e) => setPlateCity(e.target.value.replace(/\D/g, ''))}
                            placeholder="۲۲"
                            className="h-10 w-16 border border-input bg-background text-foreground text-center font-bold text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      {/* Car Type & Color */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Car Type */}
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="car_type" className="text-right text-xs font-semibold text-foreground">نوع خودرو *</Label>
                          <Input
                            id="car_type"
                            value={carType}
                            onChange={(e) => setCarType(e.target.value)}
                            placeholder="مثلاً پژو ۴۰۵"
                            required
                          />
                        </div>

                        {/* Car Color */}
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="car_color" className="text-right text-xs font-semibold text-foreground">رنگ خودرو</Label>
                          <Input
                            id="car_color"
                            value={carColor}
                            onChange={(e) => setCarColor(e.target.value)}
                            placeholder="مثلاً نوک مدادی"
                          />
                        </div>

                        {/* License Expiry Date */}
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="car_expiry" className="text-right text-xs font-semibold text-foreground">تاریخ انقضای مجوز</Label>
                          <Input
                            id="car_expiry"
                            value={carLicenseExpiry}
                            onChange={(e) => setCarLicenseExpiry(e.target.value)}
                            placeholder="۱۴۰۶/۱۲/۲۹"
                            className="font-mono text-center"
                          />
                        </div>

                      </div>

                      {/* Footer Actions buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingVehicle(false)}
                          disabled={savingVehicle}
                        >
                          انصراف
                        </Button>
                        <Button 
                          type="submit" 
                          size="sm"
                          disabled={savingVehicle}
                          className="gap-2 cursor-pointer"
                        >
                          {savingVehicle ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              <span>در حال ثبت...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              <span>ثبت و ابلاغ به گیت</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Vehicles Grid List */}
              {vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-foreground-muted gap-2 border border-dashed border-border/60 rounded-lg">
                  <Car className="size-10 opacity-30" />
                  <span className="text-sm font-medium">هیچ خودرویی تاکنون در پرونده شما ثبت نشده است</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {vehicles.map((v) => {
                    const isPending = v.status === 'pending'
                    const isRejected = v.status === 'rejected'
                    const isApproved = v.status === 'approved' || !v.status

                    return (
                      <Card key={v.id} className="border-border/60 shadow-sm relative overflow-hidden">
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-6">
                          
                          {/* Visual plate and Status badge */}
                          <div className="flex flex-col items-center gap-2">
                            {/* Realistic Iranian Plate */}
                            <div className="relative w-60 h-12 bg-white border border-neutral-300 rounded shadow flex items-center justify-between font-sans overflow-hidden select-none" dir="ltr">
                              {/* Blue section (left) */}
                              <div className="w-8 h-full bg-[#003399] flex flex-col items-center justify-between py-1 text-white text-[7px] font-bold">
                                <div className="flex flex-col gap-0.5 items-center">
                                  <div className="w-3 h-0.5 bg-[#FF0000]" />
                                  <div className="w-3 h-0.5 bg-[#FFFFFF]" />
                                  <div className="w-3 h-0.5 bg-[#009933]" />
                                </div>
                                <div className="flex flex-col items-center text-[6px]">
                                  <span>I.R.</span>
                                  <span>IRAN</span>
                                </div>
                              </div>
                              
                              {/* Left Plate Numbers */}
                              <div className="flex-1 flex items-center justify-center gap-1.5 text-xl font-bold text-neutral-800 tracking-tight">
                                <span>{toFa(v.plateNum1)}</span>
                                <span className="text-base font-normal">{v.plateLetter}</span>
                                <span>{toFa(v.plateNum2)}</span>
                              </div>
                              
                              {/* Right Box (City Code) */}
                              <div className="w-10 h-full border-l border-neutral-300 flex flex-col items-center justify-center bg-white text-neutral-800">
                                <span className="text-[7px] text-neutral-500 font-semibold -mb-0.5">ایران</span>
                                <span className="text-base font-bold tracking-tight">{toFa(v.plateCity)}</span>
                              </div>
                            </div>

                            {/* Status label */}
                            {isPending && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 font-semibold text-[10px] rounded-full">
                                در انتظار تایید پلاک‌خوان
                              </Badge>
                            )}
                            {isApproved && (
                              <Badge className="bg-success/20 text-success border border-success/30 px-2 py-0.5 font-semibold text-[10px] rounded-full">
                                مجوز تردد فعال دپو
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 font-semibold text-[10px] rounded-full">
                                غیرفعال / فاقد مجوز
                              </Badge>
                            )}
                          </div>

                          {/* Details details */}
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs w-full text-right">
                            <div>
                              <span className="text-foreground-muted block">نوع خودرو:</span>
                              <span className="font-semibold text-foreground mt-0.5 block">{v.carType}</span>
                            </div>
                            <div>
                              <span className="text-foreground-muted block">رنگ خودرو:</span>
                              <span className="font-semibold text-foreground mt-0.5 block">{v.carColor || 'نامشخص'}</span>
                            </div>
                            <div>
                              <span className="text-foreground-muted block">انقضای تردد:</span>
                              <span className="font-semibold text-foreground font-data-mono mt-0.5 block">{toFa(v.carLicenseExpiry || '—')}</span>
                            </div>
                          </div>

                          {/* Delete Action button */}
                          <div className="shrink-0 flex items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 h-8 gap-1 cursor-pointer"
                              onClick={() => handleRemoveVehicle(v.id)}
                            >
                              <Trash2 className="size-3.5" />
                              <span>حذف</span>
                            </Button>
                          </div>

                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab 3: Edit Profile details & dynamic phone numbers (User can edit ALL personnel data) */}
            <TabsContent value="edit" className="animate-in fade-in-50 duration-200 space-y-6">
              
              <form onSubmit={handleSaveForm} className="space-y-6">
                
                {/* 1. Contact details & Dynamic phone list */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 border-b border-border/30">
                    <CardTitle className="text-base font-semibold">تلفن‌های تماس و کانال‌های ارتباطی کاربری</CardTitle>
                    <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                      شماره‌های همراه و ایمیل شخصی خود را در این بخش ویرایش کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email" className="text-right text-xs font-semibold text-foreground">پست الکترونیک (ایمیل)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@mail.com"
                          className="font-mono text-left"
                        />
                      </div>

                      {/* Phone Numbers List Container (User requested any number of phones) */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="phone" className="text-right text-xs font-semibold text-foreground">تلفن همراه اول *</Label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                            className="font-mono text-left"
                            required
                          />
                        </div>

                        {/* Render additional phone inputs dynamically */}
                        {additionalPhones.map((ph, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 animate-in slide-in-from-top-1 duration-150">
                            <Label className="text-right text-xs font-semibold text-foreground">تلفن همراه {toFa(idx + 2)}</Label>
                            <div className="flex gap-2">
                              <Input
                                value={ph}
                                onChange={(e) => handleAdditionalPhoneChange(idx, e.target.value)}
                                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                                className="font-mono text-left flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="shrink-0 text-red-400 border-red-500/20 hover:bg-red-500/10 cursor-pointer h-10 px-3"
                                onClick={() => handleRemoveAdditionalPhone(idx)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 self-start gap-1 text-primary border-primary/20 hover:bg-primary/5 cursor-pointer text-xs"
                          onClick={handleAddPhoneField}
                        >
                          + افزودن شماره تلفن جدید
                        </Button>
                      </div>

                      {/* Address */}
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <Label htmlFor="address" className="text-right text-xs font-semibold text-foreground">آدرس پستی محل سکونت</Label>
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="آدرس پستی کامل به همراه شهر و خیابان"
                        />
                      </div>

                      {/* Phone 3 */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone3" className="text-right text-xs font-semibold text-foreground">تلفن ثابت یا اضطراری ۳</Label>
                        <Input
                          id="phone3"
                          value={phone3}
                          onChange={(e) => setPhone3(e.target.value)}
                          placeholder="شماره تلفن ثابت یا همراه دیگر"
                          className="font-mono text-left"
                        />
                      </div>

                      {/* Phone 4 */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone4" className="text-right text-xs font-semibold text-foreground">تلفن ثابت یا اضطراری ۴</Label>
                        <Input
                          id="phone4"
                          value={phone4}
                          onChange={(e) => setPhone4(e.target.value)}
                          placeholder="شماره تلفن ثابت یا همراه دیگر"
                          className="font-mono text-left"
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* 2. Personal identification fields (ALL of them are editable now!) */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 border-b border-border/30">
                    <CardTitle className="text-base font-semibold">مشخصات شناسنامه‌ای و فردی پرسنل</CardTitle>
                    <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                      اطلاعات شناسنامه‌ای و ثبت احوالی خود را در این بخش تکمیل کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Father Name */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="father_name" className="text-right text-xs font-semibold text-foreground">نام پدر</Label>
                        <Input
                          id="father_name"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="نام پدر"
                        />
                      </div>

                      {/* ID Number */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="id_number" className="text-right text-xs font-semibold text-foreground">شماره شناسنامه</Label>
                        <Input
                          id="id_number"
                          value={idNumber}
                          onChange={(e) => setIdNumber(e.target.value)}
                          placeholder="شماره شناسنامه"
                          className="font-mono text-right"
                        />
                      </div>

                      {/* Birth Date */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="birth_date" className="text-right text-xs font-semibold text-foreground">تاریخ تولد</Label>
                        <Input
                          id="birth_date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          placeholder="۱۳۷۰/۰۵/۱۲"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* Age */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="age" className="text-right text-xs font-semibold text-foreground">سن</Label>
                        <Input
                          id="age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="سن"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* Birth Place */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="birth_place" className="text-right text-xs font-semibold text-foreground">محل تولد</Label>
                        <Input
                          id="birth_place"
                          value={birthPlace}
                          onChange={(e) => setBirthPlace(e.target.value)}
                          placeholder="محل تولد"
                        />
                      </div>

                      {/* Marital Status */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="marital_status" className="text-right text-xs font-semibold text-foreground">وضعیت تاهل / تعداد فرزند</Label>
                        <Input
                          id="marital_status"
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          placeholder="مثلاً: متاهل - ۲ فرزند"
                        />
                      </div>

                      {/* Insurance No */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="insurance_no" className="text-right text-xs font-semibold text-foreground">گروه خونی / شماره بیمه</Label>
                        <Input
                          id="insurance_no"
                          value={insuranceNo}
                          onChange={(e) => setInsuranceNo(e.target.value)}
                          placeholder="مثلاً: O مثبت - شماره بیمه ۱۲۳۴۵۶"
                        />
                      </div>

                      {/* Education */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="education" className="text-right text-xs font-semibold text-foreground">اطلاعات تحصیلی</Label>
                        <Input
                          id="education"
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          placeholder="مدرک و رشته تحصیلی"
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* 3. Job & Org details (Editable now!) */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 border-b border-border/30">
                    <CardTitle className="text-base font-semibold">اطلاعات شغلی و سازمانی پرسنل</CardTitle>
                    <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                      جزئیات مربوط به پست، گروه، شیفت‌ها و محل شروع کار را در صورت لزوم ویرایش کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Personnel No */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="personnel_no" className="text-right text-xs font-semibold text-foreground">شماره پرسنلی</Label>
                        <Input
                          id="personnel_no"
                          value={personnelNo}
                          onChange={(e) => setPersonnelNo(e.target.value)}
                          placeholder="شماره پرسنلی"
                          className="font-mono text-left"
                        />
                      </div>

                      {/* Post */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="post" className="text-right text-xs font-semibold text-foreground">عنوان پست سازمانی</Label>
                        <Input
                          id="post"
                          value={post}
                          onChange={(e) => setPost(e.target.value)}
                          placeholder="عنوان پست"
                        />
                      </div>

                      {/* Group */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="group" className="text-right text-xs font-semibold text-foreground">گروه کاری شیفت</Label>
                        <select
                          id="group"
                          value={group}
                          onChange={(e) => setGroup(e.target.value)}
                          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                        >
                          <option value="A">گروه الف (A)</option>
                          <option value="B">گروه ب (B)</option>
                          <option value="C">گروه ج (C)</option>
                          <option value="D">گروه د (D)</option>
                          <option value="Staff">ستادی / اداری</option>
                        </select>
                      </div>

                      {/* Shift Name */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="shift_name" className="text-right text-xs font-semibold text-foreground">نام شیفت کاری</Label>
                        <Input
                          id="shift_name"
                          value={shift}
                          onChange={(e) => setShift(e.target.value)}
                          placeholder="نام شیفت کاری"
                        />
                      </div>

                      {/* Shift Type */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="shift_type" className="text-right text-xs font-semibold text-foreground">نوع شیفت کاری</Label>
                        <Input
                          id="shift_type"
                          value={shiftType}
                          onChange={(e) => setShiftType(e.target.value)}
                          placeholder="نوع شیفت کاری"
                        />
                      </div>

                      {/* Start Location */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start_location" className="text-right text-xs font-semibold text-foreground">ایستگاه شروع به کار</Label>
                        <Input
                          id="start_location"
                          value={startLocation}
                          onChange={(e) => setStartLocation(e.target.value)}
                          placeholder="نام ایستگاه شروع"
                        />
                      </div>

                      {/* Hire Date */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="hire_date" className="text-right text-xs font-semibold text-foreground">تاریخ استخدام / گروه شغلی</Label>
                        <Input
                          id="hire_date"
                          value={hireDate}
                          onChange={(e) => setHireDate(e.target.value)}
                          placeholder="تاریخ استخدام"
                          className="font-mono text-center"
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* 4. Safety & Qualifications (Editable now!) */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 border-b border-border/30">
                    <CardTitle className="text-base font-semibold">صلاحیت‌ها، گواهینامه‌ها و درصدهای سهم کارکرد</CardTitle>
                    <CardDescription className="text-xs text-foreground-muted mt-1 leading-normal">
                      اطلاعات مربوط به گواهینامه راهبری و درصدهای سهمیه را در صورت نیاز اصلاح کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Driving Status */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="driving_status" className="text-right text-xs font-semibold text-foreground">وضعیت راهبری قطار</Label>
                        <Input
                          id="driving_status"
                          value={drivingStatus}
                          onChange={(e) => setDrivingStatus(e.target.value)}
                          placeholder="مثلاً: فعال"
                        />
                      </div>

                      {/* Medical validity */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="medical_validity" className="text-right text-xs font-semibold text-foreground">اعتبار معاینه پزشکی</Label>
                        <Input
                          id="medical_validity"
                          value={medicalExamValidity}
                          onChange={(e) => setMedicalExamValidity(e.target.value)}
                          placeholder="تاریخ انقضای اعتبار پزشکی"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* License Class 1 */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="license_class1" className="text-right text-xs font-semibold text-foreground">تاریخ اخذ گواهینامه پایه ۱</Label>
                        <Input
                          id="license_class1"
                          value={licenseClass1Date}
                          onChange={(e) => setLicenseClass1Date(e.target.value)}
                          placeholder="تاریخ گواهینامه پایه ۱"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* License Class 2 */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="license_class2" className="text-right text-xs font-semibold text-foreground">تاریخ اخذ گواهینامه پایه ۲</Label>
                        <Input
                          id="license_class2"
                          value={licenseClass2Date}
                          onChange={(e) => setLicenseClass2Date(e.target.value)}
                          placeholder="تاریخ گواهینامه پایه ۲"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* Driver Percent */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="driver_percent" className="text-right text-xs font-semibold text-foreground">درصد سهم راهبری قطار</Label>
                        <Input
                          id="driver_percent"
                          value={driverPercent}
                          onChange={(e) => setDriverPercent(e.target.value)}
                          placeholder="مثال: ۱۰۰"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* Co-Driver Percent */}
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="co_driver_percent" className="text-right text-xs font-semibold text-foreground">درصد سهم کمک راهبری</Label>
                        <Input
                          id="co_driver_percent"
                          value={coDriverPercent}
                          onChange={(e) => setCoDriverPercent(e.target.value)}
                          placeholder="مثال: ۵۰"
                          className="font-mono text-center"
                        />
                      </div>

                      {/* Trainee Driver Percent */}
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <Label htmlFor="trainee_percent" className="text-right text-xs font-semibold text-foreground">درصد سهم راهبری آموزشی</Label>
                        <Input
                          id="trainee_percent"
                          value={traineeDriverPercent}
                          onChange={(e) => setTraineeDriverPercent(e.target.value)}
                          placeholder="مثال: ۵۰"
                          className="font-mono text-center"
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Error Alerts inside form */}
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

                {/* Form Submit Action */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={saving}
                    className="gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>در حال ذخیره و ثبت تاییدیه...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>ذخیره تغییرات و ابلاغ جهت تایید</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab 4: Activity Timeline */}
            <TabsContent value="timeline" className="animate-in fade-in-50 duration-200">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
                  <div className="space-y-1 text-right">
                    <CardTitle className="text-base font-semibold">گزارش فعالیت‌های اخیر کاربری</CardTitle>
                    <CardDescription className="text-xs text-foreground-muted leading-normal">
                      آخرین رویدادها، ورود و خروج‌ها و تغییرات ثبت شده در پنل کاربری شما.
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadAuditLogs}
                    disabled={logsLoading}
                    className="gap-1.5 h-8 shrink-0 cursor-pointer"
                  >
                    {logsLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Activity className="size-3.5" />
                    )}
                    <span>بروزرسانی</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  {logsLoading && auditLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-foreground-muted gap-2">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="text-xs">در حال دریافت رویدادها...</span>
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-foreground-muted gap-2 border border-dashed border-border/60 rounded-lg">
                      <Clock className="size-8 opacity-40" />
                      <span className="text-xs font-medium">هیچ گزارشی یافت نشد</span>
                    </div>
                  ) : (
                    <div className="relative border-r border-border/80 pr-4 mr-2 py-4 space-y-6">
                      {auditLogs.map((log) => {
                        const dateStr = jalali(log.createdAt)
                        const timeStr = faTime(log.createdAt)
                        
                        return (
                          <div key={log.id} className="relative">
                            {/* Point on timeline */}
                            <div className="absolute -right-[21px] top-1.5 size-2.5 rounded-full border bg-background" style={{ borderColor: activeTheme }} />

                            {/* Row structure */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 border border-border/40 bg-surface-container-low/30 rounded-lg p-3 hover:bg-surface-container-low/60 transition-colors">
                              <div className="space-y-1.5 text-right">
                                <p className="text-sm font-semibold text-foreground">
                                  {translateAuditLog(log)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {log.entity}
                                  </Badge>
                                  <span className="text-[10px] text-foreground-muted font-sans">
                                    شناسه: <span className="font-data-mono">{log.id.slice(0, 8)}</span>
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 justify-end shrink-0 text-xs text-foreground-muted font-data-mono bg-surface px-2 py-0.5 rounded border border-border/40">
                                <span>{dateStr}</span>
                                <span>-</span>
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
