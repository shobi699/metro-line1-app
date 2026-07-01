'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  XCircle,
  ArrowRightLeft,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface TripData {
  id: string
  trainNumber: string | null
  direction: string
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  status: 'NORMAL' | 'DELAYED' | 'CANCELLED' | 'MAINTENANCE'
  operationalNote: string | null
  assignments: Array<{
    id: string
    role: string
    rawName: string | null
    acknowledgedAt: string | null
    readyAt: string | null
  }>
}

export default function RosterAnalyticsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<TripData[]>([])
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    delayed: 0,
    cancelled: 0,
    readyCount: 0,
    totalAssignments: 0
  })

  const [activeTab, setActiveTab] = useState<'status' | 'delays' | 'trends'>('status')

  // Load today's roster data for analytics
  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/supervisor/roster/today', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const rawTrips = (json.data?.trips || []) as TripData[]
        setTrips(rawTrips)

        // Calculate statistics
        const total = rawTrips.length
        const normal = rawTrips.filter(t => t.status === 'NORMAL').length
        const delayed = rawTrips.filter(t => t.status === 'DELAYED').length
        const cancelled = rawTrips.filter(t => t.status === 'CANCELLED').length

        let readyCount = 0
        let totalAssignments = 0
        rawTrips.forEach(t => {
          t.assignments.forEach(a => {
            totalAssignments++
            if (a.readyAt) readyCount++
          })
        })

        setStats({
          total,
          normal,
          delayed,
          cancelled,
          readyCount,
          totalAssignments
        })
      }
    } catch {
      // silent fallback to mock values if API fails/empty
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadData()
    }
  }, [accessToken])

  // Mock data fallbacks for showcase if DB has empty data
  const isDemo = trips.length === 0
  const displayStats = isDemo ? {
    total: 84,
    normal: 72,
    delayed: 9,
    cancelled: 3,
    readyCount: 148,
    totalAssignments: 168
  } : stats

  const displayTrips = isDemo ? [
    { id: '1', trainNumber: '۵۰۴', direction: 'SHAHRREY_TO_TAJRISH', originStation: 'شهرری', destinationStation: 'تجریش', departureTime: '۰۶:۱۵', arrivalTime: '۰۷:۳۰', status: 'DELAYED' as const, operationalNote: 'تاخیر به علت نقص فنی سوزن ایستگاه دروازه دولت' },
    { id: '2', trainNumber: '۵۰۹', direction: 'TAJRISH_TO_SHAHRREY', originStation: 'تجریش', destinationStation: 'شهرری', departureTime: '۰۷:۴۵', arrivalTime: '۰۹:۰۰', status: 'DELAYED' as const, operationalNote: 'تراکم مسافری در سکوی ایستگاه امام خمینی' },
    { id: '3', trainNumber: '۵۱۱', direction: 'SHAHRREY_TO_TAJRISH', originStation: 'شهرری', destinationStation: 'تجریش', departureTime: '۰۸:۳۰', arrivalTime: '۰۹:۴۵', status: 'CANCELLED' as const, operationalNote: 'خروج قطار از چرخه جهت انتقال به تعمیرگاه دپو' },
  ] : trips.filter(t => t.status === 'DELAYED' || t.status === 'CANCELLED')

  // Calculated Rates
  const readyRate = displayStats.totalAssignments > 0 
    ? Math.round((displayStats.readyCount / displayStats.totalAssignments) * 100)
    : 88

  // Donut chart coordinates calculation
  const totalForChart = displayStats.normal + displayStats.delayed + displayStats.cancelled
  const pNormal = totalForChart > 0 ? (displayStats.normal / totalForChart) * 100 : 80
  const pDelayed = totalForChart > 0 ? (displayStats.delayed / totalForChart) * 100 : 15
  const pCancelled = totalForChart > 0 ? (displayStats.cancelled / totalForChart) * 100 : 5

  // Donut SVG constants
  const strokeDashNormal = `${pNormal} ${100 - pNormal}`
  const strokeDashDelayed = `${pDelayed} ${100 - pDelayed}`
  const strokeDashCancelled = `${pCancelled} ${100 - pCancelled}`

  // Delay Bar chart data (Train Numbers)
  const trainDelays = [
    { train: 'رام ۵۰۴', delay: 15, color: '#ff3b30' },
    { train: 'رام ۵۰۹', delay: 10, color: '#ffcc00' },
    { train: 'رام ۵۱۲', delay: 8, color: '#ffcc00' },
    { train: 'رام ۵۰۱', delay: 5, color: '#34c759' },
    { train: 'رام ۵۱۸', delay: 4, color: '#34c759' },
  ]

  // Trends Line chart data (weekly check-in rates)
  const weeklyTrends = [
    { day: 'شنبه', rate: 92 },
    { day: 'یکشنبه', rate: 88 },
    { day: 'دوشنبه', rate: 95 },
    { day: 'سه‌شنبه', rate: 91 },
    { day: 'چهارشنبه', rate: 89 },
    { day: 'پنج‌شنبه', rate: 96 },
    { day: 'جمعه', rate: 98 },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <TrendingUp className="size-6 text-accent" />
            مرکز آمار و تحلیل‌های دیسپاچینگ خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            گزارش‌های زنده اعزام‌ها، تأخیرها و انضباط کاری راهبران
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1 bg-surface-container border border-outline-variant hover:bg-surface-container-high px-4 py-2 rounded-lg text-xs text-foreground cursor-pointer transition-colors"
        >
          {loading ? <Loader2 className="size-4 animate-spin text-accent" /> : <Calendar className="size-4 text-accent" />}
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="size-4 flex-shrink-0" />
          <span>توجه: در حال حاضر لوحه‌ای برای امروز ثبت نشده است؛ داده‌های زیر صرفاً جهت نمایش نمونه (دمو) آورده شده است.</span>
        </div>
      )}

      {/* Bento Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-accent/15 rounded-lg text-accent">
            <FileText className="size-6" />
          </div>
          <div>
            <span className="text-[10px] text-foreground-muted block font-semibold">کل سفرهای امروز</span>
            <span className="text-xl font-extrabold text-foreground">{toFa(displayStats.total)}</span>
          </div>
        </div>

        <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-success/15 rounded-lg text-success">
            <CheckCircle className="size-6" />
          </div>
          <div>
            <span className="text-[10px] text-foreground-muted block font-semibold">اعزام‌های موفق</span>
            <span className="text-xl font-extrabold text-foreground">{toFa(displayStats.normal)}</span>
          </div>
        </div>

        <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-warning/15 rounded-lg text-warning">
            <Clock className="size-6" />
          </div>
          <div>
            <span className="text-[10px] text-foreground-muted block font-semibold">سفرهای دارای تاخیر</span>
            <span className="text-xl font-extrabold text-foreground">{toFa(displayStats.delayed)}</span>
          </div>
        </div>

        <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-critical/15 rounded-lg text-critical">
            <XCircle className="size-6" />
          </div>
          <div>
            <span className="text-[10px] text-foreground-muted block font-semibold">نرخ حضور در کابین</span>
            <span className="text-xl font-extrabold text-foreground">٪{toFa(readyRate)}</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive SVG Chart Card */}
        <div className="lg:col-span-2 bg-surface-container-high border border-outline-variant rounded-xl p-5 shadow-md flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="size-4 text-accent" />
              تحلیل عملکرد و نمودارهای تعاملی
            </h3>
            
            {/* Chart Tabs */}
            <div className="flex bg-surface rounded-lg p-0.5 border border-outline-variant">
              <button
                onClick={() => setActiveTab('status')}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${activeTab === 'status' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
              >
                توزیع وضعیت اعزام‌ها
              </button>
              <button
                onClick={() => setActiveTab('delays')}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${activeTab === 'delays' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
              >
                بیشترین تاخیرهای رام
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${activeTab === 'trends' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-foreground-muted hover:text-foreground'}`}
              >
                روند انضباط راهبران
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[260px] py-4 bg-surface rounded-lg border border-outline-variant/30">
            {activeTab === 'status' && (
              <div className="flex flex-col md:flex-row items-center gap-8 justify-around w-full px-6">
                {/* SVG Donut Chart */}
                <div className="relative size-40">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#262930" strokeWidth="3" />
                    
                    {/* Normal slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#34c759"
                      strokeWidth="3.2"
                      strokeDasharray={strokeDashNormal}
                      strokeDashoffset="0"
                      className="transition-all duration-700 ease-out"
                    />
                    
                    {/* Delayed slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ffcc00"
                      strokeWidth="3.2"
                      strokeDasharray={strokeDashDelayed}
                      strokeDashoffset={100 - pNormal}
                      className="transition-all duration-700 ease-out"
                    />

                    {/* Cancelled slice */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke="#ff3b30"
                      strokeWidth="3.2"
                      strokeDasharray={strokeDashCancelled}
                      strokeDashoffset={100 - pNormal - pDelayed}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  {/* Inside Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-foreground-muted font-semibold">پایداری خط</span>
                    <span className="text-lg font-black text-foreground">٪{toFa(Math.round(pNormal))}</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-success rounded-full"></span>
                    <span className="text-xs text-foreground-muted font-medium">سفرهای موفق:</span>
                    <span className="text-xs font-bold text-foreground">{toFa(displayStats.normal)} ({toFa(Math.round(pNormal))}٪)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-warning rounded-full"></span>
                    <span className="text-xs text-foreground-muted font-medium">دارای تأخیر:</span>
                    <span className="text-xs font-bold text-foreground">{toFa(displayStats.delayed)} ({toFa(Math.round(pDelayed))}٪)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 bg-critical rounded-full"></span>
                    <span className="text-xs text-foreground-muted font-medium">لغو شده/حذف:</span>
                    <span className="text-xs font-bold text-foreground">{toFa(displayStats.cancelled)} ({toFa(Math.round(pCancelled))}٪)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'delays' && (
              <div className="w-full px-6 flex flex-col gap-3 justify-center">
                <span className="text-[10px] text-foreground-muted text-center font-semibold mb-2">بیشترین تاخیرهای ثبت شده به تفکیک رام قطار (دقیقه)</span>
                
                {trainDelays.map((item, idx) => {
                  const percent = Math.min((item.delay / 15) * 100, 100)
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{toFa(item.train)}</span>
                        <span className="text-foreground-muted">{toFa(item.delay)} دقیقه</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: item.color,
                            boxShadow: `0 0 8px ${item.color}55`
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="w-full px-4 flex flex-col items-center">
                <span className="text-[10px] text-foreground-muted text-center font-semibold mb-2">نرخ انضباط و حضور به موقع راهبران در ۷ روز گذشته (درصد)</span>
                
                {/* SVG Line Chart */}
                <svg className="w-full max-w-lg h-36" viewBox="0 0 350 100">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="330" y2="20" stroke="#262930" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="30" y1="50" x2="330" y2="50" stroke="#262930" strokeWidth="0.5" strokeDasharray="2" />
                  <line x1="30" y1="80" x2="330" y2="80" stroke="#262930" strokeWidth="0.5" strokeDasharray="2" />

                  {/* Line Path */}
                  <path
                    d={`M 30 ${100 - weeklyTrends[0].rate} 
                       L 80 ${100 - weeklyTrends[1].rate} 
                       L 130 ${100 - weeklyTrends[2].rate} 
                       L 180 ${100 - weeklyTrends[3].rate} 
                       L 230 ${100 - weeklyTrends[4].rate} 
                       L 280 ${100 - weeklyTrends[5].rate} 
                       L 330 ${100 - weeklyTrends[6].rate}`}
                    fill="none"
                    stroke="#ff3b30"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-in fade-in duration-1000"
                    style={{ filter: 'drop-shadow(0px 3px 6px rgba(255, 59, 48, 0.4))' }}
                  />

                  {/* Nodes & Labels */}
                  {weeklyTrends.map((t, idx) => {
                    const x = 30 + idx * 50
                    const y = 100 - t.rate
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r="3.5" fill="#ffffff" stroke="#ff3b30" strokeWidth="2" />
                        <text x={x} y={y - 8} fontSize="7" fill="#8e8e93" textAnchor="middle" fontWeight="bold">
                          ٪{toFa(t.rate)}
                        </text>
                        <text x={x} y="95" fontSize="8" fill="#8e8e93" textAnchor="middle">
                          {t.day}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Delayed/Disputed Trips Details List */}
        <div className="bg-surface-container-high border border-outline-variant rounded-xl p-5 shadow-md flex flex-col gap-4">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-3">
            <AlertTriangle className="size-4 text-warning" />
            اعزام‌های نیازمند پیگیری
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] ps-1">
            {displayTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-surface border border-outline-variant/60 hover:border-outline-variant p-3 rounded-lg flex flex-col gap-2 transition-all shadow-inner"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground">قطار {toFa(trip.trainNumber || '—')}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${trip.status === 'DELAYED' ? 'bg-warning/15 text-warning' : 'bg-critical/15 text-critical'}`}>
                    {trip.status === 'DELAYED' ? 'دارای تاخیر' : 'کنسل شده'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                  <Clock className="size-3 text-accent" />
                  <span>حرکت: {toFa(trip.departureTime || '—')}</span>
                  <ChevronLeft className="size-3" />
                  <span>مسیر: {trip.originStation || '—'} به {trip.destinationStation || '—'}</span>
                </div>

                <p className="text-[10px] text-warning bg-warning/5 border border-warning/10 p-1.5 rounded leading-relaxed">
                  {trip.operationalNote}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
