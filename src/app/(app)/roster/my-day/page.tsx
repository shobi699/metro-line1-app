'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import { dayjs, gregStr, jdate, fromJalali } from '@/lib/dayjs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker'
import {
  Clock,
  MapPin,
  CheckCircle2,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Loader2,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Partner {
  name: string
  userId: string | null
}

interface Trip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH' | string
  departureTime: string
  arrivalTime: string
  status: string
  operationalNote: string | null
  myRole: string | null
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  h2Partner: Partner | null
  h1Partner: Partner | null
}

export default function MyDayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessToken = useAuthStore((s) => s.accessToken)
  
  // Resolve current date from URL, default to today
  const dateParam = searchParams.get('date')
  const initialJalali = dateParam 
    ? dateParam.replace(/-/g, '/') 
    : jdate(new Date()).format('YYYY/MM/DD')
    
  const [selectedJalali, setSelectedJalali] = useState(initialJalali)
  const [trips, setTrips] = useState<Trip[]>([])
  const [versionNo, setVersionNo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  
  // Dashboard integrations
  const [pendingBulletinsCount, setPendingBulletinsCount] = useState(0)
  const [fatigueStatus, setFatigueStatus] = useState<{ checked: boolean; score?: number } | null>(null)
  const [meetings, setMeetings] = useState<any[]>([])

  // Dispute Modal States
  const [disputeTripId, setDisputeTripId] = useState<string | null>(null)
  const [disputeNote, setDisputeNote] = useState('')
  const [disputing, setDisputing] = useState(false)

  // Fetch trips for selected date
  const loadTrips = async (dateStr: string) => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/me/trips?date=${encodeURIComponent(dateStr)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      const body = await res.json()
      if (body.data) {
        setTrips(body.data.trips || [])
        setVersionNo(body.data.versionNo || null)
      } else {
        setTrips([])
        setVersionNo(null)
      }
    } catch (err) {
      console.error(err)
      toast.error('خطا در دریافت لیست اعزام‌ها')
    } finally {
      setLoading(false)
    }
  }

  const loadSidebarIntegrations = async (dateStr: string) => {
    if (!accessToken) return
    try {
      // 1. Fetch pending safety bulletins
      const bulletinsRes = await fetch('/api/bulletins/pending', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const bulletinsData = await bulletinsRes.json()
      if (bulletinsData.data) {
        setPendingBulletinsCount(bulletinsData.data.length || 0)
      }

      // 2. Fetch fatigue logs for today
      const fatigueRes = await fetch('/api/fatigue', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const fatigueData = await fatigueRes.json()
      if (fatigueData.data) {
        const latestLog = fatigueData.data.latestLog
        if (latestLog) {
          const logDate = dayjs(latestLog.createdAt).format('YYYY-MM-DD')
          const parts = dateStr.split('/').map(Number)
          const queryDate = dayjs(gregStr(fromJalali(parts[0], parts[1], parts[2]))).format('YYYY-MM-DD')
          const isSelectedDay = logDate === queryDate
          setFatigueStatus({
            checked: isSelectedDay,
            score: latestLog.score
          })
        } else {
          setFatigueStatus({ checked: false })
        }
      }

      // 3. Fetch meetings
      const meetingsRes = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const meetingsData = await meetingsRes.json()
      if (meetingsData.data) {
        const parts = dateStr.split('/').map(Number)
        const queryDate = dayjs(gregStr(fromJalali(parts[0], parts[1], parts[2]))).format('YYYY-MM-DD')
        const filtered = meetingsData.data.filter((m: any) => {
          return dayjs(m.scheduledAt).format('YYYY-MM-DD') === queryDate
        })
        setMeetings(filtered)
      }
    } catch (err) {
      console.error('Error fetching dashboard integrations:', err)
    }
  }

  useEffect(() => {
    setSelectedJalali(initialJalali)
    loadTrips(initialJalali)
    loadSidebarIntegrations(initialJalali)
  }, [initialJalali, accessToken])

  const handleDateChange = (newDate: string) => {
    const formatted = newDate.replace(/\//g, '-')
    router.push(`/roster/my-day?date=${formatted}`)
  }

  const navigateDay = (daysOffset: number) => {
    const normalized = selectedJalali.replace(/\//g, '-')
    const parts = normalized.split('-').map(Number)
    const targetDate = fromJalali(parts[0], parts[1], parts[2])
    const targetJalali = jdate(targetDate.add(daysOffset, 'day')).format('YYYY/MM/DD')
    handleDateChange(targetJalali)
  }

  // Handle Trip Action (receipt / ready / cabin-handover)
  const executeTripAction = async (tripId: string, actionType: 'receipt' | 'ready' | 'cabin-handover') => {
    if (!accessToken) return
    setSubmittingId(`${tripId}-${actionType}`)
    try {
      const res = await fetch(`/api/trips/${tripId}/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          geoLocation: '35.6892,51.3890' // Default Tehran coords for fallback
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت رویداد')
      }

      toast.success(data.message || 'عملیات با موفقیت ثبت شد')
      loadTrips(selectedJalali)
    } catch (err: any) {
      toast.error(err.message || 'خطا در اجرای درخواست')
    } finally {
      setSubmittingId(null)
    }
  }

  // Handle Dispute Submission
  const submitDispute = async () => {
    if (!disputeTripId || !disputeNote.trim()) return
    setDisputing(true)
    try {
      const res = await fetch(`/api/trips/${disputeTripId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ disputeNote })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت مغایرت')
      }

      toast.success('گزارش مغایرت ثبت شد و به سرشیفت اطلاع داده شد.')
      setDisputeTripId(null)
      setDisputeNote('')
      loadTrips(selectedJalali)
    } catch (err: any) {
      toast.error(err.message || 'خطا در ارسال مغایرت')
    } finally {
      setDisputing(false)
    }
  }

  // Formatter helpers
  const getDirectionText = (dir: string) => {
    if (dir === 'SHAHRREY_TO_TAJRISH') return 'شهرری ➔ تجریش'
    if (dir === 'TAJRISH_TO_SHAHRREY') return 'تجریش ➔ شهرری'
    return dir
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">برنامه روزانه من</h1>
          <p className="text-xs text-foreground-muted">لیست اعزام‌ها، قطارها و وظایف مشخص شده شما در لوحه</p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-surface border border-border p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)} aria-label="روز قبل">
            <ChevronRight className="size-4" />
          </Button>
          <div className="px-2 font-bold text-sm text-foreground">
            {toFa(selectedJalali)}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDay(1)} aria-label="روز بعد">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      {/* Date Picker Drawer / Selector */}
      <div className="flex flex-col sm:flex-row gap-3 bg-surface p-4 rounded-xl border border-border items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar className="size-5 text-accent shrink-0" />
          <div className="w-full sm:w-64">
            <JalaliDatePicker
              value={selectedJalali}
              onChange={handleDateChange}
            />
          </div>
        </div>
        
        {versionNo && (
          <div className="text-[11px] text-foreground-muted bg-surface-variant px-3 py-1 rounded-full font-semibold">
            لوحه اعزام فعال: نسخه {toFa(versionNo)}
          </div>
        )}
      </div>

      {/* 📊 بخش یکپارچگی اطلاعات ایمنی، خستگی و جلسات */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* ۱. کارت خودارزیابی خستگی */}
        <Card className={cn(
          "border border-border bg-surface",
          fatigueStatus?.checked ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"
        )}>
          <CardContent className="p-4 space-y-2 text-right">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>🩺</span> خودارزیابی خستگی
            </h3>
            {fatigueStatus?.checked ? (
              <div className="space-y-1">
                <p className="text-[11px] text-success font-semibold flex items-center gap-1">
                  <span>✅</span> امروز تکمیل شده است
                </p>
                <p className="text-[10px] text-foreground-muted">
                  شاخص خستگی ثبت‌شده: {toFa(fatigueStatus.score || 0)}٪
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-warning font-semibold flex items-center gap-1">
                  <span>⚠️</span> امروز ثبت نشده است!
                </p>
                <Link href="/fatigue" className="block">
                  <Button className="h-6 w-full text-[10px] bg-warning hover:bg-warning/90 text-warning-foreground mt-1 py-0">
                    تکمیل فرم خستگی امروز
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ۲. کارت بخشنامه‌های ایمنی */}
        <Card className={cn(
          "border border-border bg-surface",
          pendingBulletinsCount > 0 ? "border-critical/20 bg-critical/5" : "border-success/20 bg-success/5"
        )}>
          <CardContent className="p-4 space-y-2 text-right">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>📜</span> بخشنامه‌های ایمنی
            </h3>
            {pendingBulletinsCount > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-critical font-semibold flex items-center gap-1">
                  <span>📢</span> {toFa(pendingBulletinsCount)} بخشنامه خوانده‌نشده
                </p>
                <Link href="/docs" className="block">
                  <Button className="h-6 w-full text-[10px] bg-critical hover:bg-critical/90 text-critical-foreground mt-1 py-0">
                    مطالعه و تایید بخشنامه‌ها
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[11px] text-success font-semibold flex items-center gap-1">
                  <span>✅</span> وضعیت بخشنامه‌ها عالی است
                </p>
                <p className="text-[10px] text-foreground-muted">مورد خوانده‌نشده‌ای ندارید.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ۳. کارت جلسات اداری */}
        <Card className="border border-border bg-surface">
          <CardContent className="p-4 space-y-2 text-right">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>👥</span> جلسات کاری امروز
            </h3>
            {meetings.length > 0 ? (
              <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                {meetings.map((m: any) => (
                  <div key={m.id} className="text-[10px] border-b border-border/40 pb-1 last:border-0">
                    <p className="font-semibold text-foreground truncate">{m.title}</p>
                    <p className="text-foreground-muted font-data-mono" dir="ltr">
                      {toFa(dayjs(m.scheduledAt).format('HH:mm'))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[11px] text-foreground-muted">هیچ جلسه‌ای برای امروز ندارید.</p>
                <Link href="/meetings" className="block">
                  <Button variant="outline" className="h-6 w-full text-[10px] mt-1 py-0">
                    درخواست جلسه جدید
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="size-8 animate-spin mx-auto text-accent" />
          <p className="text-sm text-foreground-muted">در حال دریافت برنامه اعزام شما...</p>
        </div>
      ) : trips.length === 0 ? (
        /* Empty State */
        <Card className="border border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <div className="size-12 rounded-full bg-surface-variant flex items-center justify-center mx-auto text-foreground-muted">
              <Clock className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">هیچ اعزامی یافت نشد</h3>
              <p className="text-xs text-foreground-muted">برای تاریخ {toFa(selectedJalali)} هیچ اعزام یا لوحه فعالی برای شما ثبت نشده است.</p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => handleDateChange(jdate(new Date()).format('YYYY/MM/DD'))}>
                بازگشت به امروز
              </Button>
              <Link href="/calendar">
                <Button size="sm">تقویم زندگی من</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Trips List */
        <div className="space-y-4">
          <div className="bg-info/10 text-info text-xs p-3 rounded-lg border border-info/20 flex gap-2.5 items-start">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1 text-right">
              <p className="font-bold">راهنمای مراحل اعزام:</p>
              <p>۱. پس از رویت اعزام جدید، دکمه «تایید رویت» را بزنید. ۲. قبل از حرکت، دکمه «اعلام آمادگی» را جهت ثبت حضور کلیک کنید. ۳. پس از اتمام سفر، کابین را با زدن «ثبت تحویل» تحویل دهید.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {trips.map((trip) => {
              const isAcknowledged = !!trip.acknowledgedAt
              const isReady = !!trip.readyAt
              const isHandover = !!trip.handoverAt
              
              return (
                <Card key={trip.id} className={cn("overflow-hidden border transition-all", isHandover ? "border-success/20 bg-success/5" : "border-border")}>
                  {/* Card Header showing Trip Info & Role */}
                  <div className="bg-surface-variant/40 p-4 border-b border-border flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-accent text-accent-foreground font-bold font-data-mono text-sm px-2.5 py-1 rounded-md">
                        قطار {toFa(trip.trainNumber || trip.rowNo)}
                      </div>
                      <div className="text-xs font-bold text-foreground">
                        نوبت اعزام {toFa(trip.rowNo)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {trip.myRole && (
                        <span className="bg-info/10 text-info text-[11px] font-bold px-2.5 py-1 rounded-full border border-info/10">
                          نقش: {trip.myRole}
                        </span>
                      )}
                      
                      {isHandover ? (
                        <span className="bg-success/15 text-success text-[10px] font-bold px-2 py-0.5 rounded-full">
                          تکمیل شده
                        </span>
                      ) : isReady ? (
                        <span className="bg-warning/15 text-warning text-[10px] font-bold px-2 py-0.5 rounded-full">
                          کابین فعال
                        </span>
                      ) : isAcknowledged ? (
                        <span className="bg-info/15 text-info text-[10px] font-bold px-2 py-0.5 rounded-full">
                          رویت شده
                        </span>
                      ) : (
                        <span className="bg-critical/15 text-critical text-[10px] font-bold px-2 py-0.5 rounded-full">
                          در انتظار رویت
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {/* Time and Path Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Direction & Stations */}
                      <div className="space-y-2">
                        <div className="text-foreground-muted text-[10px] font-bold">مسیر حرکت</div>
                        <div className="flex items-center gap-2.5 text-sm font-bold text-foreground">
                          <MapPin className="size-4 text-accent" />
                          <span>{getDirectionText(trip.direction)}</span>
                        </div>
                      </div>

                      {/* Right: Departure & Arrival Time */}
                      <div className="space-y-2">
                        <div className="text-foreground-muted text-[10px] font-bold">زمان‌بندی اعزام</div>
                        <div className="flex items-center gap-3 text-sm font-bold font-data-mono text-foreground" dir="ltr">
                          <span>{toFa(trip.arrivalTime)}</span>
                          <ArrowLeftRight className="size-3.5 text-foreground-muted" />
                          <span>{toFa(trip.departureTime)}</span>
                          <Clock className="size-4 text-accent" />
                        </div>
                      </div>
                    </div>

                    {/* Cabin Partner Details */}
                    {(trip.h1Partner || trip.h2Partner) && (
                      <div className="border-t border-border/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {trip.h1Partner && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="size-3.5 text-foreground-muted" />
                            <span className="text-foreground-muted">همکار لوکوموتیوران (H1):</span>
                            <span className="font-bold text-foreground">{trip.h1Partner.name}</span>
                          </div>
                        )}
                        {trip.h2Partner && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="size-3.5 text-foreground-muted" />
                            <span className="text-foreground-muted">همکار کمک لوکوموتیوران (H2):</span>
                            <span className="font-bold text-foreground">{trip.h2Partner.name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {trip.operationalNote && (
                      <div className="bg-surface p-3 rounded-lg border border-border text-xs text-foreground-muted">
                        <span className="font-bold text-foreground">یادداشت عملیاتی: </span>
                        {trip.operationalNote}
                      </div>
                    )}

                    {/* Interactive Action Steps */}
                    <div className="border-t border-border/60 pt-4 flex flex-wrap justify-between items-center gap-3">
                      {/* Left: Standard Action Buttons */}
                      <div className="flex gap-2">
                        {!isAcknowledged && (
                          <Button
                            size="sm"
                            disabled={submittingId !== null}
                            onClick={() => executeTripAction(trip.id, 'receipt')}
                          >
                            {submittingId === `${trip.id}-receipt` && <Loader2 className="size-3 animate-spin me-1.5" />}
                            تایید رویت سفر
                          </Button>
                        )}

                        {isAcknowledged && !isReady && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={submittingId !== null}
                            onClick={() => executeTripAction(trip.id, 'ready')}
                          >
                            {submittingId === `${trip.id}-ready` && <Loader2 className="size-3 animate-spin me-1.5" />}
                            اعلام آمادگی حرکت
                          </Button>
                        )}

                        {isReady && !isHandover && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-success hover:bg-success/90 text-success-foreground"
                            disabled={submittingId !== null}
                            onClick={() => executeTripAction(trip.id, 'cabin-handover')}
                          >
                            {submittingId === `${trip.id}-cabin-handover` && <Loader2 className="size-3 animate-spin me-1.5" />}
                            ثبت تحویل کابین
                          </Button>
                        )}

                        {isHandover && (
                          <div className="flex items-center gap-1.5 text-success font-bold text-xs">
                            <CheckCircle2 className="size-4" />
                            <span>مراحل اعزام با موفقیت پایان یافته است.</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Dispute / Comment Buttons */}
                      {!isHandover && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-critical hover:bg-critical/10"
                            onClick={() => {
                              setDisputeTripId(trip.id)
                              setDisputeNote('')
                            }}
                          >
                            گزارش مغایرت
                          </Button>
                          
                          <Link href={`/checklists`}>
                            <Button size="sm" variant="outline">
                              چک‌لیست قبل حرکت
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl border border-border max-w-md w-full p-6 space-y-4 text-right">
            <div>
              <h3 className="text-base font-bold text-foreground">گزارش مغایرت یا اشتباه در لوحه</h3>
              <p className="text-xs text-foreground-muted mt-1">توضیحات خود را در مورد عدم انطباق این اعزام ثبت کنید تا توسط سرشیفت بررسی شود.</p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="dispute-note" className="text-xs font-bold text-foreground">شرح مغایرت:</label>
              <textarea
                id="dispute-note"
                rows={4}
                className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-accent outline-none"
                placeholder="مثلاً: بنده امروز در این ساعت شیفت نیستم یا شماره قطار اشتباه است..."
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setDisputeTripId(null)} disabled={disputing}>
                انصراف
              </Button>
              <Button size="sm" className="bg-critical hover:bg-critical/90 text-critical-foreground" onClick={submitDispute} disabled={disputing || !disputeNote.trim()}>
                {disputing && <Loader2 className="size-3 animate-spin me-1.5" />}
                ثبت گزارش مغایرت
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
