'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Label } from '@/components/ui/label'
import {
  Car,
  Camera,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface Vehicle {
  id: string
  ownerName: string
  ownerCode: string
  plate: {
    num1: string
    letter: string
    num2: string
    city: string
  }
  type: string
  color: string
  status: 'active' | 'expired' | 'blocked'
  expiryDate: string
}

interface CameraLog {
  id: string
  time: string
  cameraLocation: string
  plate: {
    num1: string
    letter: string
    num2: string
    city: string
  }
  direction: 'in' | 'out'
  status: 'allowed' | 'denied'
  ownerName?: string
}

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', ownerName: 'محمدرضا علوی', ownerCode: '10984', plate: { num1: '22', letter: 'ب', num2: '567', city: '33' }, type: 'پژو ۲۰۶', color: 'سفید', status: 'active', expiryDate: '۱۴۰۶/۰۳/۰۱' },
  { id: '2', ownerName: 'سید رضا حسینی', ownerCode: '12450', plate: { num1: '78', letter: 'ج', num2: '123', city: '22' }, type: 'سمند EF7', color: 'خاکستری', status: 'active', expiryDate: '۱۴۰۵/۱۲/۲۹' },
  { id: '3', ownerName: 'علی عباسی', ownerCode: '15044', plate: { num1: '36', letter: 'د', num2: '984', city: '11' }, type: 'پژو پارس', color: 'مشکی', status: 'expired', expiryDate: '۱۴۰۵/۰۲/۱۵' },
  { id: '4', ownerName: 'امیرحسین زارعی', ownerCode: '17320', plate: { num1: '14', letter: 'س', num2: '445', city: '77' }, type: 'پراید ۱۳۱', color: 'نقره‌ای', status: 'active', expiryDate: '۱۴۰۶/۰۵/۲۰' },
  { id: '5', ownerName: 'حامد تقوی', ownerCode: '11002', plate: { num1: '45', letter: 'ق', num2: '233', city: '66' }, type: 'تارا اتوماتیک', color: 'خاکستری متالیک', status: 'blocked', expiryDate: '۱۴۰۵/۰۸/۱۰' },
]

const INITIAL_CAMERA_LOGS: CameraLog[] = [
  { id: 'LOG-301', time: '01:52:10', cameraLocation: 'گیت شمالی دپوی کهریزک', plate: { num1: '22', letter: 'ب', num2: '567', city: '33' }, direction: 'in', status: 'allowed', ownerName: 'محمدرضا علوی' },
  { id: 'LOG-302', time: '01:45:05', cameraLocation: 'خروجی پارکینگ اداری صادقیه', plate: { num1: '78', letter: 'ج', num2: '123', city: '22' }, direction: 'out', status: 'allowed', ownerName: 'سید رضا حسینی' },
  { id: 'LOG-303', time: '01:30:44', cameraLocation: 'گیت شمالی دپوی کهریزک', plate: { num1: '99', letter: 'ی', num2: '999', city: '99' }, direction: 'in', status: 'denied' },
  { id: 'LOG-304', time: '01:10:15', cameraLocation: 'گیت جنوبی دپوی کهریزک', plate: { num1: '14', letter: 'س', num2: '445', city: '77' }, direction: 'in', status: 'allowed', ownerName: 'امیرحسین زارعی' },
]

const PLATE_LETTERS = ['الف', 'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ع', 'ق', 'ل', 'م', 'ن', 'و', 'ه', 'ی']

interface Plate {
  num1: string
  letter: string
  num2: string
  city: string
}

function IranianPlateDisplay({ plate }: { plate: Plate }) {
  return (
    <div className="inline-flex items-center border border-slate-700 rounded bg-white text-slate-900 font-bold text-xs h-7 select-none overflow-hidden shrink-0 shadow-sm" dir="ltr">
      <div className="bg-blue-800 text-white w-4 h-full flex flex-col items-center justify-between py-0.5 px-0.5 border-r border-slate-700">
        <span className="text-[5px] leading-none">I.R.</span>
        <span className="text-[5px] leading-none font-sans font-normal">IRAN</span>
      </div>
      <div className="px-1.5 font-sans text-sm tracking-tighter">{toFa(plate.num1)}</div>
      <div className="px-1.5 text-xs font-semibold font-serif text-slate-800">{plate.letter}</div>
      <div className="px-1.5 font-sans text-sm tracking-tighter">{toFa(plate.num2)}</div>
      <div className="border-l border-slate-700 h-full flex flex-col items-center justify-center px-1.5 bg-slate-100 text-[8px] leading-none">
        <span className="text-[6px] text-slate-600 scale-90 mb-0.5">ایران</span>
        <span className="font-sans font-bold text-xs leading-none">{toFa(plate.city)}</span>
      </div>
    </div>
  )
}

export default function LicensePlatesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES)
  const [cameraLogs, setCameraLogs] = useState<CameraLog[]>(INITIAL_CAMERA_LOGS)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // فیلدهای فرم ثبت خودرو
  const [ownerName, setOwnerName] = useState('')
  const [ownerCode, setOwnerCode] = useState('')
  const [plateNum1, setPlateNum1] = useState('')
  const [plateLetter, setPlateLetter] = useState('ب')
  const [plateNum2, setPlateNum2] = useState('')
  const [plateCity, setPlateCity] = useState('')
  const [carType, setCarType] = useState('')
  const [carColor, setCarColor] = useState('')
  const [expiryDate, setExpiryDate] = useState('۱۴۰۶/۱۲/۲۹')

  // تنظیمات پلاک‌خوان (قانون ۷)
  const [autoOpenForAllowed, setAutoOpenForAllowed] = useState(true)
  const [notifyOnBlocked, setNotifyOnBlocked] = useState(true)
  const [alertExpiryDays, setAlertExpiryDays] = useState(30)
  const [successMessage, setSuccessMessage] = useState('')

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerName || !ownerCode || !plateNum1 || !plateNum2 || !plateCity || !carType) {
      alert('لطفاً تمامی فیلدهای الزامی را پر کنید.')
      return
    }

    const newVehicle: Vehicle = {
      id: `VEH-${vehicles.length + 1}`,
      ownerName,
      ownerCode,
      plate: {
        num1: plateNum1,
        letter: plateLetter,
        num2: plateNum2,
        city: plateCity,
      },
      type: carType,
      color: carColor || 'نامشخص',
      status: 'active',
      expiryDate,
    }

    setVehicles((prev) => [newVehicle, ...prev])
    setShowAddForm(false)
    resetForm()
    setSuccessMessage('خودروی پرسنلی جدید با موفقیت ثبت و به سیستم دوربین‌های پلاک‌خوان ابلاغ شد.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  const resetForm = () => {
    setOwnerName('')
    setOwnerCode('')
    setPlateNum1('')
    setPlateLetter('ب')
    setPlateNum2('')
    setPlateCity('')
    setCarType('')
    setCarColor('')
  }

  const handleToggleStatus = (id: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const nextStatus = v.status === 'active' ? 'blocked' : 'active'
          return { ...v, status: nextStatus }
        }
        return v
      }),
    )
  }

  const handleDeleteVehicle = (id: string) => {
    if (confirm('آیا از حذف این خودرو اطمینان دارید؟')) {
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    }
  }

  const handleSimulateScan = () => {
    // شبیه‌سازی اسکن خودروی ثبت‌نشده یا ثبت‌شده
    const isRegistered = Math.random() > 0.4
    const d = new Date()
    const pad = (v: number) => String(v).padStart(2, '0')
    const timeString = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

    let scanLog: CameraLog

    if (isRegistered) {
      const randomCar = vehicles[Math.floor(Math.random() * vehicles.length)]
      scanLog = {
        id: `LOG-${Date.now()}`,
        time: timeString,
        cameraLocation: Math.random() > 0.5 ? 'گیت شمالی دپوی کهریزک' : 'گیت جنوبی دپوی کهریزک',
        plate: randomCar.plate,
        direction: 'in',
        status: randomCar.status === 'active' ? 'allowed' : 'denied',
        ownerName: randomCar.ownerName,
      }
    } else {
      const randomLetters = PLATE_LETTERS[Math.floor(Math.random() * PLATE_LETTERS.length)]
      scanLog = {
        id: `LOG-${Date.now()}`,
        time: timeString,
        cameraLocation: 'گیت شمالی دپوی کهریزک',
        plate: {
          num1: String(Math.floor(Math.random() * 80) + 10),
          letter: randomLetters,
          num2: String(Math.floor(Math.random() * 900) + 100),
          city: String(Math.floor(Math.random() * 80) + 10),
        },
        direction: 'in',
        status: 'denied',
      }
    }

    setCameraLogs((prev) => [scanLog, ...prev])
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.ownerName.includes(searchTerm) ||
      v.ownerCode.includes(searchTerm) ||
      v.plate.num1.includes(searchTerm) ||
      v.plate.num2.includes(searchTerm),
  )

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="ثبت خودروهای پرسنل و پلاک‌خوان"
        subtitle="مدیریت مجوزهای ورود وسایل نقلیه شخصی به دپو و نظارت بر گیت‌ها"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs text-success animate-in fade-in duration-150">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Vehicle List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle/50 gap-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Car className="size-4 text-accent" />
                  لیست خودروهای مجاز پرسنل خط ۱
                </CardTitle>
                <Button size="sm" className="h-8 gap-1 cursor-pointer" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus className="size-4" />
                  <span>ثبت خودروی جدید</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
                  <input
                    type="text"
                    placeholder="جستجو بر اساس نام پرسنل، کد پرسنلی یا شماره پلاک..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                  />
                </div>

                {/* Add Vehicle Form (Collapsible) */}
                {showAddForm && (
                  <form onSubmit={handleAddVehicle} className="border border-border-subtle rounded-lg p-4 bg-surface/60 backdrop-blur-sm space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    <h4 className="text-xs font-bold text-foreground-muted border-b border-border pb-2">ثبت مشخصات وسیله نقلیه و پرسنل</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">نام و نام خانوادگی پرسنل *</Label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">کد پرسنلی *</Label>
                        <input
                          type="text"
                          required
                          value={ownerCode}
                          onChange={(e) => setOwnerCode(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 font-mono"
                        />
                      </div>
                    </div>

                    {/* Iranian Plate Input Container */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">شماره پلاک ملی خودرو *</Label>
                      <div className="flex items-center gap-2 border border-border-subtle rounded-lg p-3 bg-surface/80 max-w-md" dir="ltr">
                        {/* 2 digits */}
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="۲۲"
                          value={plateNum1}
                          onChange={(e) => setPlateNum1(e.target.value)}
                          className="w-12 text-center rounded-md border border-border bg-surface px-1 h-9 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                        {/* Letter Selector */}
                        <select
                          value={plateLetter}
                          onChange={(e) => setPlateLetter(e.target.value)}
                          className="rounded-md border border-border bg-surface px-2 h-9 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 cursor-pointer"
                        >
                          {PLATE_LETTERS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                        {/* 3 digits */}
                        <input
                          type="text"
                          required
                          maxLength={3}
                          placeholder="۳۴۵"
                          value={plateNum2}
                          onChange={(e) => setPlateNum2(e.target.value)}
                          className="w-16 text-center rounded-md border border-border bg-surface px-1 h-9 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                        <span className="text-xs text-foreground-muted">- ایران</span>
                        {/* City code */}
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="۶۶"
                          value={plateCity}
                          onChange={(e) => setPlateCity(e.target.value)}
                          className="w-12 text-center rounded-md border border-border bg-surface px-1 h-9 text-base font-bold font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">نوع خودرو *</Label>
                        <input
                          type="text"
                          required
                          placeholder="مثلاً پژو ۴۰۵"
                          value={carType}
                          onChange={(e) => setCarType(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">رنگ خودرو</Label>
                        <input
                          type="text"
                          placeholder="مثلاً نوک مدادی"
                          value={carColor}
                          onChange={(e) => setCarColor(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-foreground">تاریخ انقضای مجوز</Label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle/50">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="cursor-pointer">
                        انصراف
                      </Button>
                      <Button type="submit" size="sm" className="cursor-pointer">
                        ثبت و ابلاغ به گیت
                      </Button>
                    </div>
                  </form>
                )}

                {/* Vehicles Table */}
                <div className="overflow-x-auto border border-border-subtle rounded-lg bg-surface/30">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-background-subtle text-foreground-muted text-xs font-semibold">
                        <th className="p-3">پرسنل</th>
                        <th className="p-3">پلاک ملی ثبت شده</th>
                        <th className="p-3">خودرو / رنگ</th>
                        <th className="p-3">تاریخ اعتبار مجوز</th>
                        <th className="p-3">وضعیت گیت</th>
                        <th className="p-3 text-left">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-sm">
                      {filteredVehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-surface-hover/70 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{v.ownerName}</div>
                            <div className="text-xs text-foreground-muted mt-0.5 font-mono">کد پرسنلی: {toFa(v.ownerCode)}</div>
                          </td>
                          <td className="p-3">
                            <IranianPlateDisplay plate={v.plate} />
                          </td>
                          <td className="p-3 font-medium text-foreground-muted">
                            {v.type} ({v.color})
                          </td>
                          <td className="p-3 font-mono text-xs text-foreground-muted">{toFa(v.expiryDate)}</td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                v.status === 'active'
                                  ? 'bg-success/10 text-success border-success/20 rounded-md px-2 py-0.5'
                                  : v.status === 'expired'
                                  ? 'bg-warning/10 text-warning border-warning/20 rounded-md px-2 py-0.5'
                                  : 'bg-critical/10 text-critical border-critical/20 rounded-md px-2 py-0.5'
                              }
                            >
                              {v.status === 'active' ? 'مجاز به ورود' : v.status === 'expired' ? 'منقضی شده' : 'مسدود'}
                            </Badge>
                          </td>
                          <td className="p-3 text-left space-x-1 space-x-reverse">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs cursor-pointer border-border hover:bg-surface-hover"
                              onClick={() => handleToggleStatus(v.id)}
                            >
                              {v.status === 'active' ? 'مسدود کردن' : 'رفع انسداد'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-critical hover:bg-critical/10 cursor-pointer"
                              onClick={() => handleDeleteVehicle(v.id)}
                            >
                              حذف
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area: Live camera monitor & policy config */}
          <div className="space-y-6">
            {/* ANPR Camera Monitor */}
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle/50 gap-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Camera className="size-4 text-accent" />
                  دوربین پلاک‌خوان زنده دپو
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-surface-hover cursor-pointer" onClick={handleSimulateScan}>
                  <RefreshCw className="size-3.5 text-foreground-muted" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-slate-950 flex items-center justify-center group shadow-inner">
                  {/* Camera scan simulator visual */}
                  <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[10px] text-success font-semibold font-mono border border-neutral-800">
                    <span className="size-1.5 rounded-full bg-success animate-ping" />
                    <span>CAM-NORTH_DEPO</span>
                  </div>

                  {/* Grid effect */}
                  <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />

                  {/* License Plate Box */}
                  <div className="border border-success bg-success/5 px-4 py-2.5 rounded-lg text-center backdrop-blur-sm shadow-lg max-w-[200px]">
                    <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">اسکن موفقیت‌آمیز</div>
                    <IranianPlateDisplay plate={{ num1: '22', letter: 'ب', num2: '567', city: '33' }} />
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 cursor-pointer border-border hover:bg-surface-hover" onClick={handleSimulateScan}>
                    <Car className="size-4 text-accent" />
                    <span>شبیه‌سازی تردد خودرو</span>
                  </Button>
                </div>

                <h5 className="text-xs font-bold text-foreground-muted border-b border-border pb-1">آخرین ترددهای گیت</h5>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {cameraLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface/30 hover:border-accent/10 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <IranianPlateDisplay plate={log.plate} />
                          <Badge
                            className={
                              log.direction === 'in'
                                ? 'bg-info/10 text-info border-info/20 rounded-md px-1.5 py-0'
                                : 'bg-neutral-800 text-foreground-muted border-neutral-700 rounded-md px-1.5 py-0'
                            }
                          >
                            {log.direction === 'in' ? 'ورود' : 'خروج'}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-foreground-muted flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>{log.cameraLocation} • {toFa(log.time)}</span>
                        </div>
                      </div>

                      <div className="text-left">
                        {log.status === 'allowed' ? (
                          <div className="flex items-center gap-1 text-success text-xs font-semibold">
                            <CheckCircle className="size-3.5" />
                            <span>مجاز ({log.ownerName})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-critical text-xs font-semibold">
                            <XCircle className="size-3.5 text-accent" />
                            <span>مسدود</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ANPR Control Panel / Config Rules */}
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="border-b border-border-subtle/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Settings className="size-4 text-accent" />
                  قوانین امنیتی پلاک‌خوان
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">باز شدن خودکار راهبند دپو</span>
                  <input
                    type="checkbox"
                    checked={autoOpenForAllowed}
                    onChange={(e) => setAutoOpenForAllowed(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">هشدار تردد خودروهای مسدود</span>
                  <input
                    type="checkbox"
                    checked={notifyOnBlocked}
                    onChange={(e) => setNotifyOnBlocked(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">محدوده هشدار انقضای مجوز (روز)</Label>
                  <input
                    type="number"
                    value={alertExpiryDays}
                    onChange={(e) => setAlertExpiryDays(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 font-mono text-center"
                  />
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning leading-relaxed">
                  <AlertTriangle className="size-4 shrink-0 text-warning" />
                  <span>تغییر هر یک از قوانین بالا بلافاصله بر روی سیستم گیت دپوی کهریزک و ساختمان صادقیه بازتاب خواهد داشت.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

