'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import {
  Zap,
  Radio,
  GitBranch,
  ShieldAlert,
  RefreshCw,
  Power,
  AlertTriangle,
  Play,
  Settings,
  Database,
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface RectifierStation {
  id: string
  name: string
  voltage: number // DC Volt
  current: number // Ampere
  status: 'active' | 'inactive' | 'fault'
  temperature: number // Celsius
}

interface SignalingTrack {
  id: string
  blockName: string
  status: 'clear' | 'occupied' | 'warning'
  switchState: 'straight' | 'diverging'
  signalColor: 'red' | 'yellow' | 'green'
}

interface EventLog {
  id: string
  time: string
  source: 'برق کشش' | 'سیگنالینگ' | 'ارتباطات رادیویی'
  message: string
  type: 'info' | 'warning' | 'critical'
  operator: string
}

const INITIAL_STATIONS: RectifierStation[] = [
  { id: 'RECT-01', name: 'پست رکتیفایر تجریش', voltage: 752, current: 1200, status: 'active', temperature: 42 },
  { id: 'RECT-03', name: 'پست رکتیفایر قلهک', voltage: 748, current: 950, status: 'active', temperature: 39 },
  { id: 'RECT-07', name: 'پست رکتیفایر حقانی', voltage: 755, current: 1100, status: 'active', temperature: 45 },
  { id: 'RECT-11', name: 'پست رکتیفایر دروازه دولت', voltage: 742, current: 1400, status: 'active', temperature: 48 },
  { id: 'RECT-15', name: 'پست رکتیفایر امام خمینی', voltage: 749, current: 1550, status: 'active', temperature: 51 },
  { id: 'RECT-21', name: 'پست رکتیفایر شهر ری', voltage: 758, current: 800, status: 'active', temperature: 38 },
  { id: 'RECT-25', name: 'پست رکتیفایر دپوی کهریزک', voltage: 760, current: 650, status: 'active', temperature: 35 },
]

const INITIAL_TRACKS: SignalingTrack[] = [
  { id: 'BLK-101', blockName: 'بلاک تجریش - قیطریه', status: 'occupied', switchState: 'straight', signalColor: 'red' },
  { id: 'BLK-102', blockName: 'بلاک قیطریه - صدر', status: 'clear', switchState: 'straight', signalColor: 'green' },
  { id: 'BLK-203', blockName: 'بلاک همت - حقانی', status: 'warning', switchState: 'diverging', signalColor: 'yellow' },
  { id: 'BLK-308', blockName: 'بلاک هفت تیر - طالقانی', status: 'clear', switchState: 'straight', signalColor: 'green' },
  { id: 'BLK-412', blockName: 'بلاک امام خمینی - پانزده خرداد', status: 'occupied', switchState: 'straight', signalColor: 'red' },
  { id: 'BLK-502', blockName: 'بلاک علی آباد - جوانمرد قصاب', status: 'clear', switchState: 'straight', signalColor: 'green' },
]

const INITIAL_LOGS: EventLog[] = [
  { id: 'LOG-001', time: '01:45:12', source: 'برق کشش', message: 'افت ولتاژ لحظه‌ای در پست رکتیفایر دروازه دولت (۷۱۰ ولت)', type: 'warning', operator: 'سیستم خودکار' },
  { id: 'LOG-002', time: '01:40:05', source: 'سیگنالینگ', message: 'تغییر وضعیت سوزن بلاک همت - حقانی به انحرافی', type: 'info', operator: 'اپراتور OCC' },
  { id: 'LOG-003', time: '01:32:40', source: 'ارتباطات رادیویی', message: 'تداخل رادیویی موقت در فرکانس کانال ۴۴۰.۱۲۵ ایستگاه ری', type: 'warning', operator: 'سیستم نظارت' },
  { id: 'LOG-004', time: '01:15:00', source: 'برق کشش', message: 'شروع کارکرد آزمایشی رکتیفایر دپوی کهریزک پس از اورهال', type: 'info', operator: 'مهندس فنی دپو' },
]

export default function InfrastructurePage() {
  const [stations, setStations] = useState<RectifierStation[]>(INITIAL_STATIONS)
  const [tracks, setTracks] = useState<SignalingTrack[]>(INITIAL_TRACKS)
  const [logs, setLogs] = useState<EventLog[]>(INITIAL_LOGS)
  const [activeTab, setActiveTab] = useState<'power' | 'signaling' | 'radio' | 'settings'>('power')

  // تنظیمات حد آستانه (قانون ۷)
  const [minVoltage, setMinVoltage] = useState(720)
  const [maxVoltage, setMaxVoltage] = useState(780)
  const [maxTemp, setMaxTemp] = useState(55)

  // قطع اضطراری برق ریل سوم (Trip)
  const [showTripDialog, setShowTripDialog] = useState(false)
  const [selectedStationForTrip, setSelectedStationForTrip] = useState<RectifierStation | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [tripError, setTripError] = useState('')

  // وضعیت رادیو
  const [radioChannels, _setRadioChannels] = useState([
    { name: 'کانال اصلی راهبران (CH 1)', frequency: '440.125 MHz', status: 'stable', load: '65%' },
    { name: 'کانال خدمات ایستگاهی (CH 2)', frequency: '442.250 MHz', status: 'stable', load: '32%' },
    { name: 'کانال دپو و مانور (CH 3)', frequency: '445.500 MHz', status: 'stable', load: '18%' },
    { name: 'کانال پشتیبان اضطراری (CH 4)', frequency: '449.875 MHz', status: 'backup', load: '0%' },
  ])

  const handleToggleSwitch = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextState = t.switchState === 'straight' ? 'diverging' : 'straight'
          const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
          setLogs((prevLogs) => [
            {
              id: `LOG-${Date.now()}`,
              time: timeString,
              source: 'سیگنالینگ',
              message: `تغییر دسترسی سوزن ${t.blockName} به ${nextState === 'straight' ? 'مستقیم' : 'انحرافی'}`,
              type: 'info',
              operator: 'مدیر ارشد سیستم',
            },
            ...prevLogs,
          ])
          return { ...t, switchState: nextState }
        }
        return t
      }),
    )
  }

  const handleToggleSignalColor = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const nextColor = t.signalColor === 'green' ? 'yellow' : t.signalColor === 'yellow' ? 'red' : 'green'
          const nextStatus = nextColor === 'green' ? 'clear' : nextColor === 'yellow' ? 'warning' : 'occupied'
          const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
          setLogs((prevLogs) => [
            {
              id: `LOG-${Date.now()}`,
              time: timeString,
              source: 'سیگنالینگ',
              message: `تغییر وضعیت چراغ سیگنال ${t.blockName} به رنگ ${nextColor === 'green' ? 'سبز' : nextColor === 'yellow' ? 'زرد' : 'قرمز'}`,
              type: 'warning',
              operator: 'مدیر ارشد سیستم',
            },
            ...prevLogs,
          ])

          return { ...t, signalColor: nextColor, status: nextStatus }
        }
        return t
      }),
    )
  }

  const handleInitiateTrip = (station: RectifierStation) => {
    setSelectedStationForTrip(station)
    setShowTripDialog(true)
    setVerificationCode('')
    setTripError('')
  }

  const handleConfirmTrip = () => {
    if (verificationCode !== '750') {
      setTripError('کد امنیتی تایید هویت اضطراری اشتباه است. (راهنما: عدد ولتاژ ریل سوم یعنی ۷۵۰ را وارد کنید)')
      return
    }

    if (selectedStationForTrip) {
      setStations((prev) =>
        prev.map((s) => (s.id === selectedStationForTrip.id ? { ...s, status: 'inactive', voltage: 0, current: 0 } : s)),
      )

      const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
      setLogs((prevLogs) => [
        {
          id: `LOG-${Date.now()}`,
          time: timeString,
          source: 'برق کشش',
          message: `!!! قطع اضطراری برق (TRIP) در ${selectedStationForTrip.name} اعمال شد !!!`,
          type: 'critical',
          operator: 'مدیر ارشد سیستم',
        },
        ...prevLogs,
      ],
      )

      setShowTripDialog(false)
      setSelectedStationForTrip(null)
    }
  }

  const handleRestorePower = (stationId: string) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, status: 'active', voltage: 750, current: 600 } : s)),
    )

    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs((prevLogs) => [
      {
        id: `LOG-${Date.now()}`,
        time: timeString,
        source: 'برق کشش',
        message: `برق‌رسانی مجدد ریل سوم در ${stations.find((s) => s.id === stationId)?.name}`,
        type: 'info',
        operator: 'مدیر ارشد سیستم',
      },
      ...prevLogs,
    ])
  }

  const handleSaveSettings = () => {
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs((prevLogs) => [
      {
        id: `LOG-${Date.now()}`,
        time: timeString,
        source: 'برق کشش',
        message: `آستانه‌های هشدار تغییر یافت: ولتاژ مجاز (${minVoltage}V - ${maxVoltage}V)، دمای حداکثر (${maxTemp}°C)`,
        type: 'info',
        operator: 'مدیر ارشد سیستم',
      },
      ...prevLogs,
    ])
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="سنسورها، برق کشش ریلی و علائم خط ۱"
        subtitle="مانیتورینگ زنده وضعیت دیسپاچینگ، اینترلاکینگ، سوزن‌ها و ریل سوم"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6">
        {/* Alerts / Live Status Badges */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Traction Power */}
          <Card className="relative overflow-hidden bg-surface-container-low/30 backdrop-blur-md border-border-subtle hover:border-amber-500/30 transition-colors duration-200">
            <div className="absolute top-0 right-0 h-[2px] w-12 bg-amber-500" />
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">برق ریل سوم (Traction)</p>
                <h3 className="text-sm font-semibold mt-1 text-foreground">
                  {toFa(stations.filter((s) => s.status === 'active').length)} از {toFa(stations.length)} پست فعال
                </h3>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-md text-amber-500 border border-amber-500/20">
                <Zap className="size-4 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Interlocking */}
          <Card className="relative overflow-hidden bg-surface-container-low/30 backdrop-blur-md border-border-subtle hover:border-success/30 transition-colors duration-200">
            <div className="absolute top-0 right-0 h-[2px] w-12 bg-success" />
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">وضعیت اینترلاکینگ مسیر</p>
                <h3 className="text-sm font-semibold mt-1 text-success">ایمن و بدون خطا</h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-md text-success border border-success/20">
                <GitBranch className="size-4" />
              </div>
            </CardContent>
          </Card>

          {/* Radio Frequency */}
          <Card className="relative overflow-hidden bg-surface-container-low/30 backdrop-blur-md border-border-subtle hover:border-info/30 transition-colors duration-200">
            <div className="absolute top-0 right-0 h-[2px] w-12 bg-info" />
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">فرکانس رادیویی راهبران</p>
                <h3 className="text-sm font-semibold mt-1 text-info font-mono">{toFa('۴۴۰.۱۲۵')} مگاهرتز</h3>
              </div>
              <div className="bg-info/10 p-2.5 rounded-md text-info border border-info/20">
                <Radio className="size-4" />
              </div>
            </CardContent>
          </Card>

          {/* Dispatching */}
          <Card className="relative overflow-hidden bg-surface-container-low/30 backdrop-blur-md border-border-subtle hover:border-accent/30 transition-colors duration-200">
            <div className="absolute top-0 right-0 h-[2px] w-12 bg-accent" />
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">سیستم دیسپاچینگ مرکزی</p>
                <h3 className="text-sm font-semibold mt-1 text-success">متصل (آنلاین)</h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-md text-success border border-success/20">
                <Database className="size-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border-subtle gap-1 overflow-x-auto pb-1 bg-surface-container-low/20 p-1 rounded-lg">
          <Button
            variant="ghost"
            className={`rounded-md h-9 shrink-0 gap-1.5 transition-colors duration-150 ${
              activeTab === 'power'
                ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('power')}
          >
            <Zap className="size-4" />
            <span>پست‌های برق و ریل سوم ({toFa(750)} ولت)</span>
          </Button>

          <Button
            variant="ghost"
            className={`rounded-md h-9 shrink-0 gap-1.5 transition-colors duration-150 ${
              activeTab === 'signaling'
                ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('signaling')}
          >
            <GitBranch className="size-4" />
            <span>علائم، سوزن‌ها و سنسورهای بلاک</span>
          </Button>

          <Button
            variant="ghost"
            className={`rounded-md h-9 shrink-0 gap-1.5 transition-colors duration-150 ${
              activeTab === 'radio'
                ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('radio')}
          >
            <Radio className="size-4" />
            <span>ارتباطات بی‌سیم و رادیویی</span>
          </Button>

          <Button
            variant="ghost"
            className={`rounded-md h-9 shrink-0 gap-1.5 transition-colors duration-150 ${
              activeTab === 'settings'
                ? 'bg-accent/10 text-accent border border-accent/20 font-medium'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="size-4" />
            <span>پیکربندی آستانه هشدارها</span>
          </Button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'power' && (
          <div className="space-y-6">
            {/* Rectifier Stations Table */}
            <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  مانیتورینگ توان ریلی خط ۱ ({toFa(750)} ولت دی‌سی)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1 rounded-md" onClick={() => setStations(INITIAL_STATIONS)}>
                    <RefreshCw className="size-3.5" />
                    <span>ریست زنده</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-border-subtle bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                        <th className="p-3">شناسه پست</th>
                        <th className="p-3">نام پست رکتیفایر</th>
                        <th className="p-3">ولتاژ ریل سوم (V DC)</th>
                        <th className="p-3">جریان خروجی (A)</th>
                        <th className="p-3">دمای تجهیزات</th>
                        <th className="p-3">وضعیت اتصال</th>
                        <th className="p-3 text-left">عملیات کنترلی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-sm">
                      {stations.map((s) => {
                        const isVoltageOut = s.status === 'active' && (s.voltage < minVoltage || s.voltage > maxVoltage)
                        const isTempOut = s.status === 'active' && s.temperature > maxTemp

                        return (
                          <tr key={s.id} className="hover:bg-surface-hover/50 transition-colors duration-150">
                            <td className="p-3 font-mono text-xs text-foreground-muted">{s.id}</td>
                            <td className="p-3 font-medium">{s.name}</td>
                            <td className={`p-3 font-mono ${isVoltageOut ? 'text-critical font-semibold animate-pulse' : ''}`}>
                              <span className="flex items-center gap-1.5">
                                {toFa(s.voltage)} ولت
                                {isVoltageOut && (
                                  <Badge className="bg-critical/10 text-critical border border-critical/20 px-1 py-0 rounded-sm text-[10px]">
                                    <AlertTriangle className="size-2.5 me-0.5 inline" />
                                    نامعتبر
                                  </Badge>
                                )}
                              </span>
                            </td>
                            <td className="p-3 font-mono">{toFa(s.current)} آمپر</td>
                            <td className={`p-3 font-mono ${isTempOut ? 'text-critical font-semibold animate-pulse' : ''}`}>
                              <span className="flex items-center gap-1.5">
                                {toFa(s.temperature)}°C
                                {isTempOut && (
                                  <Badge className="bg-critical/10 text-critical border border-critical/20 px-1 py-0 rounded-sm text-[10px]">
                                    بحرانی
                                  </Badge>
                                )}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  s.status === 'active'
                                    ? 'bg-success/10 text-success border-success/20 rounded-md font-medium'
                                    : s.status === 'inactive'
                                    ? 'bg-critical/10 text-critical border-critical/20 rounded-md font-medium animate-pulse'
                                    : 'bg-warning/10 text-warning border-warning/20 rounded-md font-medium'
                                }
                              >
                                {s.status === 'active' ? 'برق‌دار' : s.status === 'inactive' ? 'قطع اضطراری' : 'خطای سنسور'}
                              </Badge>
                            </td>
                            <td className="p-3 text-left">
                              {s.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 gap-1 rounded-md text-xs"
                                  onClick={() => handleInitiateTrip(s)}
                                >
                                  <Power className="size-3.5" />
                                  <span>قطع اضطراری برق</span>
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-success/30 hover:bg-success/10 text-success hover:text-success gap-1 rounded-md text-xs"
                                  onClick={() => handleRestorePower(s.id)}
                                >
                                  <Play className="size-3.5" />
                                  <span>وصل مجدد ریل</span>
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'signaling' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Signaling Track Blocks List */}
              <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md lg:col-span-2">
                <CardHeader className="border-b border-border-subtle pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <GitBranch className="size-4 text-accent" />
                    سنسورهای بلاک مسیر و سیگنالینگ خط ۱
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-border-subtle bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                          <th className="p-3">بلاک مسیر</th>
                          <th className="p-3">وضعیت تردد</th>
                          <th className="p-3">وضعیت سوزن</th>
                          <th className="p-3">سیگنال چراغ</th>
                          <th className="p-3 text-left">تغییر فرمان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-sm">
                        {tracks.map((t) => (
                          <tr key={t.id} className="hover:bg-surface-hover/50 transition-colors duration-150">
                            <td className="p-3 font-semibold">{t.blockName}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  t.status === 'clear'
                                    ? 'bg-success/10 text-success border-success/20 rounded-md font-medium'
                                    : t.status === 'occupied'
                                    ? 'bg-critical/10 text-critical border-critical/20 rounded-md font-medium animate-pulse'
                                    : 'bg-warning/10 text-warning border-warning/20 rounded-md font-medium'
                                }
                              >
                                {t.status === 'clear' ? 'آزاد (بدون قطار)' : t.status === 'occupied' ? 'اشغال (سیر قطار)' : 'احتیاط'}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs text-foreground-muted">
                                {t.switchState === 'straight' ? 'مستقیم (سوزن قفل)' : 'انحرافی (راست‌گرد)'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-2.5 rounded-full transition-all duration-300 ${
                                    t.signalColor === 'green'
                                      ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse'
                                      : t.signalColor === 'yellow'
                                      ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]'
                                      : 'bg-critical shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse'
                                  }`}
                                />
                                <span className="text-xs font-medium">
                                  {t.signalColor === 'green' ? 'سبز (حرکت)' : t.signalColor === 'yellow' ? 'زرد (احتیاط)' : 'قرمز (توقف)'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-left space-x-1 space-x-reverse">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs rounded-md"
                                onClick={() => handleToggleSwitch(t.id)}
                              >
                                تغییر سوزن
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs rounded-md"
                                onClick={() => handleToggleSignalColor(t.id)}
                              >
                                فرمان چراغ
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Graphic interlocking mock panel */}
              <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md">
                <CardHeader className="border-b border-border-subtle pb-3">
                  <CardTitle className="text-sm font-semibold">نمای گرافیکی بلاک‌ها (شبیه‌ساز)</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col items-center justify-center space-y-6">
                  <div className="w-full p-4 border border-border-subtle rounded-lg bg-background-subtle/50 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-[2px] w-8 bg-accent" />
                    <div className="flex items-center justify-between text-xs text-foreground-muted">
                      <span>پایانه تجریش</span>
                      <span>سوزن {toFa(3)}</span>
                      <span>بلاک صدر</span>
                    </div>

                    {/* Simple Track SVG representation */}
                    <svg viewBox="0 0 300 80" className="w-full h-auto text-foreground stroke-current">
                      {/* Main track line */}
                      <path d="M 10 40 L 290 40" strokeWidth="3" className="stroke-neutral-700 dark:stroke-neutral-800" />
                      
                      {/* Active green path segments */}
                      <path d="M 10 40 L 120 40" strokeWidth="3" className="stroke-success/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <path d="M 120 40 L 180 40" strokeWidth="3" className="stroke-critical/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse" />
                      <path d="M 180 40 L 290 40" strokeWidth="3" className="stroke-success/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />

                      {/* Switch line */}
                      <path d="M 150 40 L 230 15" strokeWidth="2.5" className="stroke-dashed stroke-amber-500/70" />

                      {/* Station indicators */}
                      <circle cx="30" cy="40" r="5" className="fill-surface stroke-success" strokeWidth="2" />
                      <circle cx="270" cy="40" r="5" className="fill-surface stroke-critical" strokeWidth="2" />

                      {/* Switch junction */}
                      <polygon points="146,36 154,36 150,44" className="fill-amber-500 animate-pulse" />
                    </svg>

                    <div className="text-xs text-foreground-muted leading-relaxed">
                      💡 سوزن‌های با رنگ <span className="text-amber-500 font-semibold">نارنجی</span> نشان‌دهنده تغییر مسیر موقت راهبران به پایانه فرعی هستند. بلاک‌های با وضعیت <span className="text-critical font-semibold">قرمز</span> مانع حرکت خودکار قطارهای مجهز به سیستم ATC خواهند شد.
                    </div>
                  </div>

                  <div className="w-full p-4 border border-border-subtle rounded-lg bg-background-subtle/50 text-center">
                    <h5 className="text-xs font-semibold text-foreground-muted mb-2">فرمان خودکار ATC</h5>
                    <div className="flex items-center justify-center gap-2">
                      <Badge className="bg-success/10 text-success border border-success/20 rounded-md font-medium">کنترل کامپیوتری فعال</Badge>
                      <Badge className="bg-surface-container-highest text-foreground-muted border border-border rounded-md font-medium">حالت دستی غیرفعال</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'radio' && (
          <div className="space-y-6">
            <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="size-4 text-info" />
                  وضعیت فرستنده‌ها و شبکه‌های رادیویی اختصاصی مترو خط ۱
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 divide-y divide-border-subtle md:grid-cols-2 md:divide-y-0 md:gap-4 md:p-4">
                  {radioChannels.map((ch, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 md:border md:rounded-lg border-border-subtle bg-background-subtle/40 backdrop-blur-sm hover:border-info/30 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-info/10 p-2.5 text-info border border-info/20 relative">
                          <Radio className="size-4" />
                          <span className="absolute -top-1 -left-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-info opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-info"></span>
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">{ch.name}</h4>
                          <p className="text-xs text-foreground-muted font-mono mt-0.5">{toFa(ch.frequency)}</p>
                        </div>
                      </div>
                      <div className="text-left flex flex-col items-end">
                        <Badge
                          variant="outline"
                          className={
                            ch.status === 'stable'
                              ? 'bg-success/10 text-success border-success/20 rounded-md font-medium'
                              : 'bg-info/10 text-info border-info/20 rounded-md font-medium'
                          }
                        >
                          {ch.status === 'stable' ? 'سیگنال عالی' : 'رزرو اضطراری'}
                        </Badge>
                        <p className="text-[10px] text-foreground-muted mt-1.5 font-mono">
                          بار ترافیکی: {toFa(ch.load)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md max-w-2xl">
              <CardHeader className="border-b border-border-subtle pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="size-4 text-accent" />
                  تنظیمات حدود مجاز و هشدارهای اتوماتیک
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-muted">حداقل ولتاژ مجاز ریل سوم (ولت دی‌سی)</label>
                  <input
                    type="number"
                    value={minVoltage}
                    onChange={(e) => setMinVoltage(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-start text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                  />
                  <p className="text-[10px] text-foreground-muted">افت ولتاژ ریل سوم پایین‌تر از این حد به صورت هشدار ثبت می‌شود.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-muted">حداکثر ولتاژ مجاز ریل سوم (ولت دی‌سی)</label>
                  <input
                    type="number"
                    value={maxVoltage}
                    onChange={(e) => setMaxVoltage(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-start text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-muted">دمای مجاز تجهیزات رکتیفایر (°C)</label>
                  <input
                    type="number"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-start text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                  />
                  <p className="text-[10px] text-foreground-muted">دمای بیش از این مقدار باعث ارسال فرمان تهویه اضطراری می‌شود.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" className="rounded-md h-9 text-xs" onClick={handleSaveSettings}>
                    ذخیره پیکربندی هشدارها
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Live Logs Table */}
        <Card className="border-border-subtle bg-surface-container-low/30 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border-subtle">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4 text-critical" />
              وقایع زنده و لاگ دیسپاچینگ علائم و برق کشش (RTL)
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-md gap-1"
              onClick={() => {
                const timeString = new Date().toLocaleTimeString('en-US', { hour12: false })
                setLogs((prev) => [
                  {
                    id: `LOG-${Date.now()}`,
                    time: timeString,
                    source: 'ارتباطات رادیویی',
                    message: 'تست دوره سلامتی شبکه رادیویی کلید خط ۱ با موفقیت انجام شد.',
                    type: 'info',
                    operator: 'سیستم خودکار',
                  },
                  ...prev,
                ])
              }}
            >
              <RefreshCw className="size-3" />
              <span>ارسال پیام تست زنده</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-container/50 text-foreground-muted text-xs font-semibold">
                    <th className="p-3 w-28">ساعت ثبت</th>
                    <th className="p-3 w-32">منبع رویداد</th>
                    <th className="p-3">شرح واقعه دیسپاچینگ</th>
                    <th className="p-3 w-28">سطح بحرانی</th>
                    <th className="p-3 w-40">کاربر اعمال‌کننده</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {logs.map((log) => {
                    const isCritical = log.type === 'critical'
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors duration-150 ${
                          isCritical
                            ? 'bg-critical/5 hover:bg-critical/10 text-critical border-y border-critical/20'
                            : 'hover:bg-surface-hover/50'
                        }`}
                      >
                        <td className="p-3 font-mono text-xs text-foreground-muted">{toFa(log.time)}</td>
                        <td className="p-3">{log.source}</td>
                        <td className={`p-3 font-medium ${isCritical ? 'text-critical' : ''}`}>
                          {log.message.replace(/\b\d+\b/g, (m) => toFa(m))}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              log.type === 'info'
                                ? 'bg-success/10 text-success border-success/20 rounded-md font-medium'
                                : log.type === 'warning'
                                ? 'bg-warning/10 text-warning border-warning/20 rounded-md font-medium'
                                : 'bg-critical/10 text-critical border border-critical/30 rounded-md font-semibold animate-pulse'
                            }
                          >
                            {log.type === 'info' ? 'اطلاع‌رسانی' : log.type === 'warning' ? 'هشدار' : 'بحرانی'}
                          </Badge>
                        </td>
                        <td className="p-3 text-foreground-muted text-xs">{log.operator}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Emergency Trip Dialog */}
      {showTripDialog && selectedStationForTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 transition-all duration-300">
          <div className="w-full max-w-md rounded-lg border-2 border-critical bg-surface-container-high/90 p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] space-y-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 h-[3px] w-full bg-gradient-to-l from-critical via-transparent to-critical" />
            
            <div className="flex items-center gap-3 text-critical pt-2">
              <AlertTriangle className="size-6 animate-pulse" />
              <div>
                <h4 className="text-sm font-semibold tracking-tight">هشدار قطع فوری برق ریل سوم (TRIP)</h4>
                <p className="text-xs text-foreground-muted mt-0.5">پست انتخابی: {selectedStationForTrip.name}</p>
              </div>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed bg-critical/5 p-3 border border-critical/10 rounded-lg">
              شما در حال اعمال قطع اضطراری برق روی شبکه ریل سوم خط ۱ هستید. این اقدام بلافاصله کل نیروی محرکه ریل در این مقطع را قطع خواهد کرد و باعث توقف تمام قطارهای مجهز به سیستم محرکه خواهد شد.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-critical block">
                برای تایید، ولتاژ استاندارد ریل سوم خط ۱ ({toFa(750)}) را وارد کنید:
              </label>
              <input
                type="text"
                placeholder="کد امنیتی تایید هویت"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-9 w-full rounded-lg border border-critical/30 bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-critical font-mono text-center tracking-widest"
              />
              {tripError && <p className="text-xs text-critical font-medium mt-1">{tripError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" className="rounded-md h-9 text-xs" onClick={() => setShowTripDialog(false)}>
                انصراف و لغو عملیات
              </Button>
              <Button variant="destructive" size="sm" onClick={handleConfirmTrip} className="gap-1.5 rounded-md h-9 text-xs bg-critical text-critical-foreground hover:bg-critical/90">
                <Power className="size-4" />
                <span>بله، قطع اضطراری اعمال شود</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
