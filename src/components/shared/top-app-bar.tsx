'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Bell, HelpCircle, User, AlertOctagon, X, Navigation, Train, Flame, AlertCircle } from 'lucide-react'
import { SystemHealthPips } from './system-health-pips'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'

interface TopAppBarProps {
  title: string
  subtitle?: string
  showHealth?: boolean
}

export function TopAppBar({ title, subtitle, showHealth = true }: TopAppBarProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  // SOS States
  const [sosOpen, setSosOpen] = useState(false)
  const [reason, setReason] = useState('حریق')
  const [trainNumber, setTrainNumber] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [blockCode, setBlockCode] = useState('BLK-102')
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [enableSos, setEnableSos] = useState(true)

  // Fetch settings config on load to verify mobile.enableSos
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data && typeof data.data.mobile?.enableSos === 'boolean') {
          setEnableSos(data.data.mobile.enableSos)
        }
      })
      .catch(() => {})
  }, [])

  // Simulated location generator based on Line 1 blocks
  const blocks = ['BLK-101 (تجریش)', 'BLK-102 (حقانی)', 'BLK-103 (دروازه دولت)', 'BLK-104 (امام خمینی)', 'BLK-105 (شهرری)', 'BLK-106 (کهریزک)']
  useEffect(() => {
    if (sosOpen) {
      // Pick a random block for simulation
      const randomBlock = blocks[Math.floor(Math.random() * blocks.length)]
      setBlockCode(randomBlock)

      // Try actual browser location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          },
          () => {
            // fallback simulated coordinates near Line 1
            setCoords({ lat: 35.6892 + (Math.random() - 0.5) * 0.05, lng: 51.3890 + (Math.random() - 0.5) * 0.05 })
          }
        )
      } else {
        setCoords({ lat: 35.6892, lng: 51.3890 })
      }
    }
  }, [sosOpen])

  // Play beep sound using Web Audio API
  const playSOSBeep = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    } catch {}
  }

  const executeSOS = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/occ/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason,
          trainNumber: trainNumber || 'نامشخص',
          latitude: coords?.lat || 35.6892,
          longitude: coords?.lng || 51.3890,
          blockCode,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        playSOSBeep(1200, 0.4)
        setTimeout(() => {
          setSosOpen(false)
          setSending(false)
          setSuccess(false)
        }, 2000)
      } else {
        const errData = await res.json()
        setErrorMsg(errData.error || 'خطا در ثبت آلارم اضطراری')
        setSending(false)
      }
    } catch {
      setErrorMsg('خطای شبکه در ارسال آلارم')
      setSending(false)
    }
  }, [accessToken, reason, trainNumber, coords, blockCode])

  const triggerSOS = () => {
    setCountdown(3)
    setSending(true)
    setSuccess(false)
    setErrorMsg('')
  }

  const cancelSOS = () => {
    setCountdown(0)
    setSending(false)
  }

  // Handle SOS countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      playSOSBeep(880, 0.15)
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (countdown === 0 && sending) {
      void executeSOS()
    }
    return () => clearTimeout(timer)
  }, [countdown, sending, executeSOS])

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 flex h-12 items-center justify-between border-b border-border-subtle bg-surface-container px-4 md:left-64">
        <div className="flex items-center gap-3">
          <span className="font-label-md text-accent">{title}</span>
          {subtitle && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <span className="text-xs text-foreground-muted">{subtitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showHealth && <SystemHealthPips className="hidden md:flex" />}
          
          {/* Glowing Red SOS Button */}
          {enableSos && accessToken && (
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center justify-center gap-1 h-8 px-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md animate-pulse active:scale-95 transition-all scale-[0.98]"
              title="وضعیت اضطراری SOS"
            >
              <AlertOctagon className="size-4" />
              <span>SOS</span>
            </button>
          )}

          <button className="flex size-8 items-center justify-center rounded-md text-foreground-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95">
            <Bell className="size-4" />
          </button>
          <button className="flex size-8 items-center justify-center rounded-md text-foreground-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95">
            <HelpCircle className="size-4" />
          </button>
          <Link
            href="/profile"
            className="flex size-8 items-center justify-center rounded-md border border-border bg-surface-container-high text-foreground-muted transition-all hover:bg-surface-hover active:scale-95"
          >
            <User className="size-4" />
          </Link>
        </div>
      </header>

      {/* SOS Dialog Modal */}
      {sosOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md border border-red-500/30 bg-surface-container-low/95 rounded-lg p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-[3px] w-full bg-gradient-to-l from-red-600 via-transparent to-red-600" />
            
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div className="flex items-center gap-2 text-red-500">
                <AlertOctagon className="size-5 shrink-0" />
                <span className="font-semibold text-sm">ارسال سیگنال اضطراری SOS (مرکز فرمان خط ۱)</span>
              </div>
              <button 
                onClick={() => !sending && setSosOpen(false)}
                disabled={sending}
                className="text-foreground-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
                  <AlertOctagon className="size-6" />
                </div>
                <h3 className="font-semibold text-emerald-500 text-sm">آلارم اضطراری مخابره شد</h3>
                <p className="text-xs text-foreground-muted">مرکز فرمان OCC در حال بررسی و موقعیت‌یابی رادیویی شماست.</p>
              </div>
            ) : sending && countdown > 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <span className="text-4xl font-extrabold text-red-500 font-data-mono animate-ping">
                  {countdown}
                </span>
                <p className="text-xs text-foreground-muted">ارسال خودکار آلارم اضطراری به OCC...</p>
                <Button variant="outline" onClick={cancelSOS} className="border-red-500/40 text-red-500 hover:bg-red-500/10">
                  لغو ارسال اضطراری
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Form fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-muted">علت یا نوع حادثه اضطراری:</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-foreground font-semibold"
                  >
                    <option value="حریق در قطار">حریق در قطار / واگن</option>
                    <option value="نقص ترمز اضطراری">نقص فنی ترمز اضطراری</option>
                    <option value="تجاوز به حریم ریل">تجاوز به حریم ریل / برخورد</option>
                    <option value="فوریت پزشکی حاد">فوریت پزشکی حاد در قطار</option>
                    <option value="خرابی قطار در بلاک">توقف ناگهانی و خرابی در بلاک</option>
                    <option value="سایر موارد امنیتی">سایر موارد امنیتی</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground-muted flex items-center gap-1">
                      <Train className="size-3.5" />
                      <span>شماره رام قطار:</span>
                    </label>
                    <input
                      type="text"
                      value={trainNumber}
                      onChange={(e) => setTrainNumber(e.target.value)}
                      placeholder="مثال: ۱۰۴"
                      className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-foreground font-semibold font-data-mono text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground-muted flex items-center gap-1">
                      <Navigation className="size-3.5" />
                      <span>موقعیت قطار (بلاک):</span>
                    </label>
                    <div className="w-full bg-surface-container-high border border-border rounded-md px-3 py-1.5 text-xs text-foreground font-bold text-center truncate">
                      {blockCode}
                    </div>
                  </div>
                </div>

                {coords && (
                  <div className="bg-surface p-2.5 rounded-lg border border-border-subtle flex items-center justify-between text-[10px] text-foreground-muted font-data-mono">
                    <span>عرض جغرافیایی: {coords.lat.toFixed(6)}</span>
                    <span>طول جغرافیایی: {coords.lng.toFixed(6)}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 bg-red-950/20 border border-red-900/40 text-red-500 p-2.5 rounded-lg text-xs font-medium">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={triggerSOS}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 shadow-md active:scale-95 transition-all"
                  >
                    ارسال سیگنال اضطراری SOS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSosOpen(false)}
                    className="border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                  >
                    بازگشت
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

