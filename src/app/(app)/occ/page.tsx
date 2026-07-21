'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { SystemHealthWidget } from '@/components/shared/system-health-widget'
import { TsrPanel } from '@/components/shared/tsr-panel'
import { LiveTrackMap } from '@/components/shared/live-track-map'
import { FaultTicketCard } from '@/components/shared/fault-ticket-card'
import { Megaphone, Clock, AlertOctagon, User, ShieldAlert, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'

interface Ticket {
  id: string
  title: string
  description: string
  priority: string
  status: string
}

interface SosAlert {
  id: string
  title: string
  description: string // JSON details
  activatedAt: string
  activator?: {
    id: string
    name: string
    phone: string
  }
}

export default function OCCPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [currentTime, setCurrentTime] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeSosList, setActiveSosList] = useState<SosAlert[]>([])
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${h}:${m}:${s}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Poll tickets and active SOS alerts
  const loadData = async () => {
    if (!accessToken) return
    try {
      // 1. Fetch tickets
      const resTickets = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resTickets.ok) {
        const json = await resTickets.json()
        const data = json?.data
        if (Array.isArray(data)) {
          setTickets(data.filter((t: Ticket) => t.status === 'open' || t.status === 'in_progress').slice(0, 4))
        }
      }

      // 2. Fetch active SOS alerts
      const resSos = await fetch('/api/occ/sos', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resSos.ok) {
        const json = await resSos.json()
        setActiveSosList(json.data || [])
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    void loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [accessToken])

  // Play periodic siren warning when active SOS alerts exist
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeSosList.length > 0) {
      const playSiren = () => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          
          osc.type = 'sawtooth'
          const now = audioCtx.currentTime
          
          // siren pitch slide 440Hz -> 880Hz -> 440Hz
          osc.frequency.setValueAtTime(440, now)
          osc.frequency.linearRampToValueAtTime(750, now + 0.25)
          osc.frequency.linearRampToValueAtTime(440, now + 0.5)
          
          gain.gain.setValueAtTime(0.06, now)
          gain.gain.linearRampToValueAtTime(0.06, now + 0.4)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
          
          osc.start(now)
          osc.stop(now + 0.55)
        } catch {
          // audio ctx blocked or unsupported
        }
      }

      playSiren()
      interval = setInterval(playSiren, 1600)
    }
    return () => clearInterval(interval)
  }, [activeSosList])

  // Resolve an active SOS alert
  const handleResolveSos = async (alertId: string) => {
    if (!accessToken) return
    setResolvingId(alertId)
    try {
      const res = await fetch('/api/occ/sos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ alertId }),
      })

      if (res.ok) {
        // immediately update list
        setActiveSosList((prev) => prev.filter((item) => item.id !== alertId))
      }
    } catch {
      // silent
    } finally {
      setResolvingId(null)
    }
  }

  // Helper to parse SOS JSON meta details
  const getSosDetails = (descStr: string) => {
    try {
      return JSON.parse(descStr) as {
        latitude: number | null
        longitude: number | null
        blockCode: string
        trainNumber: string
        reason: string
        senderName: string
        senderPhone: string
      }
    } catch {
      return {
        latitude: null,
        longitude: null,
        blockCode: 'نامشخص',
        trainNumber: 'نامشخص',
        reason: descStr,
        senderName: 'راهبر سیستم',
        senderPhone: 'نامشخص',
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s infinite ease-in-out;
        }
      `}</style>

      <TopAppBar
        title="مرکز فرمان خط ۱"
        subtitle="کنترل عملیات"
        showHealth
      />

      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 space-y-4">
        
        {/* Flashing Red Warning SOS Banner */}
        {activeSosList.map((sos) => {
          const detail = getSosDetails(sos.description)
          return (
            <div
              key={sos.id}
              className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-red-950/40 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
            >
              <div className="flex items-start gap-3">
                <AlertOctagon className="size-8 text-red-500 shrink-0 mt-1" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-red-500">وضعیت اضطراری فعال (SOS)</span>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 bg-red-900/10 text-red-400 font-semibold">
                      علت: {detail.reason}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground font-semibold leading-relaxed">
                    راهبر قطار <span className="text-accent">{detail.senderName}</span> در رام <span className="text-accent font-data-mono">{toFa(detail.trainNumber)}</span> در موقعیت <span className="text-accent font-semibold">{detail.blockCode}</span> سیگنال اضطراری فرستاده است.
                  </p>
                </div>
              </div>
              <button
                disabled={resolvingId === sos.id}
                onClick={() => handleResolveSos(sos.id)}
                className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="size-4" />
                <span>تایید و رفع وضعیت اضطرار</span>
              </button>
            </div>
          )
        })}

        {/* Top Utility Row */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <SystemHealthWidget />
          <div className="md:col-span-2">
            <TsrPanel />
          </div>
          <div className="flex flex-col gap-2">
            {/* Live Clock */}
            {currentTime && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3 shadow-inner">
                <Clock className="size-4 text-accent" />
                <span className="font-data-mono text-lg text-foreground" dir="ltr">
                  {toFa(currentTime)}
                </span>
              </div>
            )}
            <button className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-accent-foreground shadow-[inset_0_2px_4px_oklch(0_0_0/0.3)] transition-all active:shadow-[inset_0_0_8px_oklch(0_0_0/0.6)] cursor-pointer">
              <Megaphone className="size-6" />
              <span className="text-sm">صدور فرمان اضطراری</span>
            </button>
          </div>
        </div>

        {/* Live Track Map */}
        <div>
          <LiveTrackMap />
        </div>

        {/* Active Fault Tickets */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-2">
              <span className="font-label-md text-foreground">تیکت‌های خرابی (فعال)</span>
              <button className="text-xs text-accent hover:underline">
                مشاهده همه
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tickets.length > 0 ? (
                tickets.map((t) => (
                  <FaultTicketCard
                    key={t.id}
                    ticketId={t.id}
                    description={t.title}
                    priority={t.priority === 'critical' ? 'high' : (t.priority as 'low' | 'medium' | 'high')}
                    status={t.status === 'open' ? 'باز' : t.status === 'in_progress' ? 'در حال بررسی' : t.status}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center text-xs text-foreground-muted py-8">
                  تیکت فعالی وجود ندارد
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Full-screen Active SOS Alert Modal Overlay */}
        {activeSosList.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4 md:p-8 overflow-y-auto">
            {/* Flashing background animation wrapper */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-650/15 via-transparent to-red-650/15 pointer-events-none animate-pulse" />
            
            <div className="relative w-full max-w-lg bg-neutral-950 border-4 border-critical rounded-xl p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.5)] space-y-6 text-center animate-bounce-short">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-20 rounded-full bg-critical border-4 border-neutral-950 flex items-center justify-center animate-ping pointer-events-none" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-20 rounded-full bg-critical border-4 border-neutral-950 flex items-center justify-center shadow-lg">
                <AlertOctagon className="size-10 text-white animate-pulse" />
              </div>
              
              <div className="pt-8 space-y-2">
                <h1 className="text-xl md:text-2xl font-black text-critical tracking-widest uppercase animate-pulse">
                  وضعیت اضطراری بحرانی (SOS)
                </h1>
                <p className="text-[10px] text-foreground-muted">
                  مرکز فرماندهی OCC - هشدار زنده راهبری قطار خط ۱
                </p>
              </div>
              
              <div className="divide-y divide-border-subtle border-y border-border-subtle bg-neutral-900/60 rounded-lg p-4 text-right space-y-3">
                {activeSosList.map((sos) => {
                  const detail = getSosDetails(sos.description)
                  return (
                    <div key={sos.id} className="pt-3 first:pt-0 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-foreground-muted block">نام راهبر:</span>
                          <span className="font-bold text-foreground">{detail.senderName}</span>
                        </div>
                        <div>
                          <span className="text-foreground-muted block">تلفن تماس:</span>
                          <span className="font-bold text-foreground font-data-mono">{toFa(detail.senderPhone)}</span>
                        </div>
                        <div>
                          <span className="text-foreground-muted block">شماره رام قطار:</span>
                          <span className="font-bold text-accent text-sm font-data-mono">{toFa(detail.trainNumber)}</span>
                        </div>
                        <div>
                          <span className="text-foreground-muted block">بلاک / موقعیت خط:</span>
                          <span className="font-bold text-warning text-sm">{detail.blockCode}</span>
                        </div>
                      </div>
                      
                      <div className="bg-critical/5 border border-critical/20 p-2.5 rounded-md mt-2">
                        <span className="text-[10px] text-critical font-bold block mb-1">علت اعلام وضعیت اضطراری:</span>
                        <p className="text-xs text-foreground font-semibold leading-relaxed">
                          {detail.reason}
                        </p>
                      </div>

                      {detail.latitude && (
                        <div className="p-2 bg-neutral-950 border border-border-subtle rounded-md flex items-center justify-between text-[10px]" dir="ltr">
                          <span className="text-foreground-muted">GPS Coordinates:</span>
                          <span className="font-mono text-accent">{detail.latitude.toFixed(6)}, {detail.longitude?.toFixed(6)}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleResolveSos(sos.id)}
                          disabled={resolvingId === sos.id}
                          className="w-full h-10 text-xs font-black shadow-lg shadow-critical/20 hover:scale-[1.01] transition-transform"
                        >
                          <Check className="size-4 me-1.5" />
                          تایید و رفع وضعیت اضطرار
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-foreground-muted">
                <Clock className="size-3.5" />
                <span>ثبت در سیستم: {toFa(new Date(activeSosList[0].activatedAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
