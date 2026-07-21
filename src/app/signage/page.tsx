'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Clock as ClockIcon, ShieldAlert, Tv, ArrowLeftRight } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { sanitizeHtml } from '@/lib/sanitize'

interface PlaylistItem {
  type: 'post' | 'roster_today' | 'clock' | 'weather' | 'custom_html'
  seconds: number
  title?: string
  body?: string
  coverUrl?: string | null
  kind?: string
  rosterTitle?: string
  jalaliDate?: string
  trips?: {
    id: string
    trainNumber: string
    direction: string
    originStation: string
    destinationStation: string
    departureTime: string
    arrivalTime: string
    drivers: string
  }[]
  customHtml?: string
}

export default function SignagePage() {
  const [screenId, setScreenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Pairing State
  const [pairCode, setPairCode] = useState('')
  const [screenName, setScreenName] = useState('مانیتور ایستگاه ۱')
  const [location, setLocation] = useState('')
  const [pairingError, setPairingError] = useState('')
  const [pairing, setPairing] = useState(false)

  // Signage Active State
  const [playlistName, setPlaylistName] = useState('پیش‌فرض')
  const [items, setItems] = useState<PlaylistItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  const [currentJalaliDate, setCurrentJalaliDate] = useState('')
  const [emergency, setEmergency] = useState<{ title: string; body: string; active: boolean } | null>(null)

  // Audio for emergency
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Clock updates
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCurrentJalaliDate(
        new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(now)
      )
    }, 1000)

    // Load paired screen ID
    const storedId = localStorage.getItem('signageScreenId')
    if (storedId) {
      setScreenId(storedId)
    }
    setLoading(false)

    return () => clearInterval(timer)
  }, [])

  // Playlist Cycle
  useEffect(() => {
    if (items.length === 0) return

    const currentItem = items[currentIndex]
    const seconds = currentItem?.seconds || 15

    const timeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, seconds * 1000)

    return () => clearTimeout(timeout)
  }, [items, currentIndex])

  // Fetch playlist
  const loadPlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/signage/${id}/playlist`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.data.items || [])
        setPlaylistName(data.data.playlistName || 'پیش‌فرض')
        setCurrentIndex(0)
      }
    } catch (err) {
      console.error('Failed to load playlist:', err)
    }
  }

  // SSE Stream Connection
  useEffect(() => {
    if (!screenId) return

    loadPlaylist(screenId)

    // Connect to SSE live stream
    const eventSource = new EventSource(`/api/signage/${screenId}/live`)

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'playlist_refresh') {
          loadPlaylist(screenId)
        } else if (payload.type === 'emergency') {
          setEmergency(payload.data.active ? payload.data : null)
          if (payload.data.active) {
            // Play alert sound if possible
            if (audioRef.current) {
              audioRef.current.play().catch(() => {})
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err)
      }
    }

    // Ping every 30s to keep connection alive and update screen health in dashboard
    const pingInterval = setInterval(async () => {
      try {
        await fetch(`/api/signage/${screenId}/playlist`)
      } catch {}
    }, 30000)

    return () => {
      eventSource.close()
      clearInterval(pingInterval)
    }
  }, [screenId])

  // Pairing Action
  const handlePair = async () => {
    if (!pairCode.trim() || !screenName.trim()) {
      setPairingError('لطفاً کد جفت‌سازی و نام مانیتور را وارد کنید')
      return
    }

    setPairing(true)
    setPairingError('')

    try {
      const res = await fetch('/api/signage/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairCode: pairCode.trim(),
          name: screenName.trim(),
          location: location.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('signageScreenId', data.data.id)
        setScreenId(data.data.id)
      } else {
        const errData = await res.json()
        setPairingError(errData.error?.message || 'کد جفت‌سازی نامعتبر است')
      }
    } catch {
      setPairingError('خطا در ارتباط با سرور')
    } finally {
      setPairing(false)
    }
  }

  // Pairing View
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white font-sans" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div>
      </div>
    )
  }

  if (!screenId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4 text-white" dir="rtl">
        <Card className="w-full max-w-md bg-[#18181b] border-zinc-800">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-600/10 text-red-500">
                <Tv className="size-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">اتصال تلویزیون دیجیتال (Signage)</h1>
              <p className="text-xs text-zinc-400">
                کد جفت‌سازی ۶ رقمی تولید شده در داشبورد مدیریت اعلانات را برای اتصال وارد کنید.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">کد جفت‌سازی ۶ رقمی</label>
                <Input
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value)}
                  placeholder="مثال: 123456"
                  maxLength={6}
                  className="bg-zinc-900 border-zinc-800 text-center font-bold tracking-[6px] text-lg text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">نام نمایشگر</label>
                <Input
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  placeholder="مثال: مانیتور سالن دپو شمال"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">موقعیت فیزیکی (اختیاری)</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: ورودی دپو"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>

              {pairingError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-950/20 border border-red-900/30 p-3 rounded-lg">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{pairingError}</span>
                </div>
              )}

              <Button
                onClick={handlePair}
                disabled={pairing}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer rounded-lg h-10 text-xs"
              >
                {pairing ? 'در حال اتصال...' : 'اتصال مانیتور'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active Emergency Overlay
  if (emergency && emergency.active) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-red-950 text-white p-8 text-center animate-pulse" dir="rtl">
        <audio ref={audioRef} src="/sounds/alarm.mp3" loop />
        <div className="flex flex-col items-center gap-6 max-w-3xl">
          <ShieldAlert className="size-24 text-red-500 animate-bounce" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white">{emergency.title}</h1>
          <p className="text-2xl leading-relaxed text-zinc-200 bg-black/30 border border-white/10 p-8 rounded-2xl">
            {emergency.body}
          </p>
        </div>
      </div>
    )
  }

  const currentItem = items[currentIndex]

  // Signage Viewer Mode
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden font-sans select-none" dir="rtl">
      {/* Top Banner Status Bar */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-[#09090b] px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-600/10 text-red-500">
            <Tv className="size-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold">نمایشگر اطلاع‌رسانی ایستگاه</h1>
            <p className="text-xs text-zinc-400">پلی‌لیست فعال: {playlistName}</p>
          </div>
        </div>

        {/* Jalali Clock and Date */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-300">{currentJalaliDate}</p>
            <p className="text-xs text-zinc-500">سیر و حرکت خط ۱ مترو</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-2xl font-mono font-bold text-red-500">
            <ClockIcon className="size-5 shrink-0" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main Slide Content Display */}
      <main className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-[#09090b]">
        {!currentItem ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500 text-center">
            <Tv className="size-16 animate-bounce" />
            <p className="text-lg">در انتظار دریافت پلی‌لیست فعال...</p>
          </div>
        ) : (
          <div className="w-full h-full max-w-6xl animate-in fade-in zoom-in-95 duration-500">
            
            {/* Slide Type: POST (Announcement) */}
            {currentItem.type === 'post' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full items-center">
                {currentItem.coverUrl && (
                  <div className="md:col-span-4 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentItem.coverUrl}
                      alt=""
                      className="w-full h-[350px] object-cover"
                    />
                  </div>
                )}
                <div className={`${currentItem.coverUrl ? 'md:col-span-8' : 'md:col-span-12'} space-y-6 text-right`}>
                  <span className="rounded bg-red-600/10 px-3 py-1 text-sm font-bold text-red-500">
                    {currentItem.kind === 'must_read' ? 'دستورالعمل الزامی' : 'اطلاعیه اداری'}
                  </span>
                  <h2 className="text-4xl font-extrabold leading-tight text-white">{currentItem.title}</h2>
                  <p className="text-lg leading-relaxed text-zinc-300 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/40 whitespace-pre-line max-h-[300px] overflow-hidden">
                    {currentItem.body}
                  </p>
                </div>
              </div>
            )}

            {/* Slide Type: ROSTER TODAY */}
            {currentItem.type === 'roster_today' && (
              <div className="space-y-6 text-right h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h2 className="text-3xl font-extrabold text-white">{currentItem.rosterTitle}</h2>
                  <span className="text-lg text-zinc-400 font-mono">امروز: {currentItem.jalaliDate}</span>
                </div>
                
                <div className="flex-1 overflow-hidden border border-zinc-800 rounded-2xl bg-zinc-900/10">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-850 bg-zinc-950 text-zinc-400 text-sm">
                        <th className="p-4">شماره قطار</th>
                        <th className="p-4">مبدا</th>
                        <th className="p-4">مقصد</th>
                        <th className="p-4 text-center">جهت</th>
                        <th className="p-4">زمان حرکت</th>
                        <th className="p-4">زمان وصول</th>
                        <th className="p-4">راهبر(ان)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-base text-zinc-200">
                      {currentItem.trips && currentItem.trips.length > 0 ? (
                        currentItem.trips.map((trip) => (
                          <tr key={trip.id} className="hover:bg-zinc-900/50">
                            <td className="p-4 font-bold text-red-500">{trip.trainNumber}</td>
                            <td className="p-4">{trip.originStation}</td>
                            <td className="p-4">{trip.destinationStation}</td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300">
                                <ArrowLeftRight className="size-3" />
                                {trip.direction}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-zinc-300">{trip.departureTime}</td>
                            <td className="p-4 font-mono text-zinc-300">{trip.arrivalTime}</td>
                            <td className="p-4 font-semibold text-white">{trip.drivers}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500">
                            هیچ سفری برای لوحه امروز ثبت یا منتشر نشده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Slide Type: CLOCK */}
            {currentItem.type === 'clock' && (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
                <span className="text-2xl text-zinc-500 font-medium">ساعت رسمی جمهوری اسلامی ایران</span>
                <span className="text-[120px] font-mono font-bold tracking-widest text-red-500 drop-shadow-md select-all">
                  {currentTime}
                </span>
                <span className="text-3xl text-zinc-300 font-semibold">{currentJalaliDate}</span>
              </div>
            )}

            {/* Slide Type: WEATHER */}
            {currentItem.type === 'weather' && (
              <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
                <span className="text-xl text-zinc-400 font-medium">وضعیت جوی و کیفیت هوا - تهران دپو شمال</span>
                <div className="grid grid-cols-3 gap-12 w-full max-w-3xl items-center">
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-sm block">سرعت باد</span>
                    <span className="text-3xl font-bold text-white">۱۴ کیلومتر بر ساعت</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-sm block">دما</span>
                    <span className="text-[72px] font-extrabold text-red-500 font-mono">۲۸°C</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-sm block">کیفیت هوا (AQI)</span>
                    <span className="text-3xl font-bold text-amber-500">۸۵ - قابل قبول</span>
                  </div>
                </div>
                <div className="text-sm text-zinc-500 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
                  هوای ابری به همراه وزش باد ملایم دوره‌ای در نواحی کوهستانی تهران
                </div>
              </div>
            )}

            {/* Slide Type: CUSTOM HTML */}
            {currentItem.type === 'custom_html' && (
              <div
                className="w-full h-full text-right"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentItem.customHtml || '') }}
              />
            )}

          </div>
        )}
      </main>

      {/* Footer Branding Bar */}
      <footer className="bg-[#09090b] border-t border-zinc-800 px-8 py-3 flex items-center justify-between text-xs text-zinc-500">
        <span>پلتفرم یکپارچه سیر و حرکت خط ۱ مترو تهران</span>
        <span>نمایش خودکار پلی‌لیست اسلاید {toFa(currentIndex + 1)} از {toFa(items.length)}</span>
      </footer>
    </div>
  )
}
