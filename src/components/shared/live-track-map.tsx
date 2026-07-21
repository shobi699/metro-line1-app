'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { MapPin, ShieldAlert, PlusCircle, Trash2, X } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { Button } from '@/components/ui/button'

interface TrainPosition {
  id: string
  station: string
  status: 'ok' | 'warn' | 'error'
  position: string
  speedLimitInfo?: string
}

interface Station {
  name: string
}

const defaultStations: Station[] = [
  { name: 'تجریش' },
  { name: 'قیطریه' },
  { name: 'میرداماد' },
  { name: 'شهید حقانی' },
  { name: 'دکتر شریعتی' },
  { name: 'گل‌حکیم' },
]

const statusStyles: Record<string, { bg: string; label: string; dot: string; border: string }> = {
  ok: { bg: 'bg-success', label: 'آزاد (سرعت مجاز)', dot: 'bg-success', border: 'border-success/30' },
  warn: { bg: 'pulse-amber', label: 'محدودیت سرعت (TSR)', dot: 'bg-warning', border: 'border-warning/30' },
  error: { bg: 'pulse-red', label: 'محدودیت شدید (TSR)', dot: 'bg-critical', border: 'border-critical/30' },
}

export function LiveTrackMap() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isRealAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  const [trains, setTrains] = useState<TrainPosition[]>([])
  const [tsrs, setTsrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // TSR dialog states
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [showTsrDialog, setShowTsrDialog] = useState(false)
  const [speedLimit, setSpeedLimit] = useState('30')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function fetchTrains() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/trains', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrains(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function fetchTsrs() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/tsr', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTsrs(json.data || [])
      }
    } catch {}
  }

  useEffect(() => {
    void fetchTrains()
    void fetchTsrs()
    const interval = setInterval(() => {
      void fetchTrains()
      void fetchTsrs()
    }, 2500)
    return () => clearInterval(interval)
  }, [accessToken])

  const handleStationClick = (stationName: string) => {
    setSelectedStation(stationName)
    const existingTsr = tsrs.find(t => t.section.toLowerCase() === stationName.toLowerCase())
    if (existingTsr) {
      setSpeedLimit(existingTsr.speedLimit.toString())
      setReason(existingTsr.reason)
    } else {
      setSpeedLimit('30')
      setReason('')
    }
    setShowTsrDialog(true)
  }

  const handleSaveTsr = async () => {
    if (!selectedStation || !accessToken) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/tsr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          section: selectedStation,
          speedLimit: parseInt(speedLimit, 10),
          reason,
        }),
      })
      if (res.ok) {
        setShowTsrDialog(false)
        void fetchTsrs()
        void fetchTrains()
      }
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTsr = async (id: string) => {
    if (!accessToken) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/tsr/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        setShowTsrDialog(false)
        void fetchTsrs()
        void fetchTrains()
      }
    } catch {} finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-4 relative">
      <style>{`
        @keyframes pulse-amber {
          0%, 100% { background-color: #f59e0b; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          50% { background-color: #d97706; box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-red {
          0%, 100% { background-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { background-color: #dc2626; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        .pulse-amber {
          animation: pulse-amber 2s infinite;
        }
        .pulse-red {
          animation: pulse-red 1.5s infinite;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-accent" />
          <span className="font-label-md text-foreground">نقشه خطوط زنده و مانیتورینگ TSR (خط ۱)</span>
        </div>
        <div className="flex gap-3">
          {Object.entries(statusStyles).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`size-2 rounded-full ${val.dot}`} />
              <span className="font-data-mono text-[10px] text-foreground-muted">{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="no-scrollbar relative min-h-[220px] flex-1 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-low px-8 pt-8">
        {/* Track Line */}
        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-accent/20" />

        {/* Stations */}
        <div className="relative flex h-full items-center justify-between">
          {defaultStations.map((station, i) => {
            const hasTsr = tsrs.find(t => t.section.toLowerCase() === station.name.toLowerCase())
            const isCriticalTsr = hasTsr && hasTsr.speedLimit <= 15
            
            return (
              <div
                key={i}
                onClick={() => handleStationClick(station.name)}
                className="relative z-10 flex flex-col items-center -translate-y-6 cursor-pointer group"
                title={`ایستگاه ${station.name} - برای مدیریت کلیک کنید`}
              >
                {/* Station circle changes color based on active TSR */}
                <div className={`mb-2 size-5 rounded-full border-[3px] border-surface transition-all duration-300 ${
                  isCriticalTsr
                    ? 'pulse-red bg-critical'
                    : hasTsr
                    ? 'pulse-amber bg-warning'
                    : 'bg-accent group-hover:scale-110'
                }`} />
                <span className="absolute top-7 whitespace-nowrap font-data-mono text-[10px] text-foreground-muted font-bold group-hover:text-foreground">
                  {station.name}
                </span>
                {hasTsr && (
                  <span className="absolute -bottom-6 whitespace-nowrap text-[8px] font-bold px-1 py-0.5 rounded bg-critical/10 text-critical border border-critical/20">
                    TSR {toFa(hasTsr.speedLimit)} km/h
                  </span>
                )}
              </div>
            )
          })}

          {/* Trains */}
          {!loading && trains.map((train) => (
            <div
              key={train.id}
              className={`absolute top-1/2 z-20 h-9 w-20 -translate-y-1/2 rounded-lg border-2 shadow-md transition-all duration-1000 flex flex-col items-center justify-center ${statusStyles[train.status].bg} ${statusStyles[train.status].border}`}
              style={{ left: train.position }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-inverse-surface px-1.5 py-0.5 font-data-mono text-[9px] text-inverse-on-surface whitespace-nowrap border border-border-subtle font-bold">
                {train.id}
              </span>
              <span className="text-[10px] font-bold text-white leading-none">{train.station}</span>
              {train.speedLimitInfo && (
                <span className="text-[7px] text-white/90 font-mono leading-none mt-1 font-bold">
                  {toFa(train.speedLimitInfo.split(' ')[0] || '')} km/h
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive TSR Management Dialog */}
      {showTsrDialog && selectedStation && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 rounded-xl flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-border rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <ShieldAlert className="size-4 text-warning" />
                مدیریت TSR ایستگاه {selectedStation}
              </h3>
              <button
                onClick={() => setShowTsrDialog(false)}
                className="text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {(() => {
              const activeTsr = tsrs.find(t => t.section.toLowerCase() === selectedStation.toLowerCase())
              if (!activeTsr) {
                return (
                  <div className="space-y-3">
                    <p className="text-xs text-foreground-muted">هیچ محدودیت سرعتی در این بلاک ثبت نشده است.</p>
                    {isRealAdmin ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground-muted">سرعت مجاز جدید (km/h):</label>
                          <select
                            value={speedLimit}
                            onChange={(e) => setSpeedLimit(e.target.value)}
                            className="w-full p-2 bg-surface border border-border rounded-md text-xs font-semibold"
                          >
                            <option value="15">۱۵ km/h (بحرانی)</option>
                            <option value="30">۳۰ km/h (انحراف سوزن)</option>
                            <option value="50">۵۰ km/h (عملیات کارگاهی)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground-muted">علت محدودیت:</label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="مثلاً: تعمیر خط ریل سوم"
                            className="w-full p-2 bg-surface border border-border rounded-md text-xs"
                          />
                        </div>
                        <Button
                          onClick={handleSaveTsr}
                          disabled={submitting || !reason}
                          className="w-full h-8 text-[11px] font-semibold"
                        >
                          <PlusCircle className="size-3.5 me-1" />
                          ثبت محدودیت سرعت موقت
                        </Button>
                      </>
                    ) : (
                      <p className="text-[11px] text-warning font-semibold">تنها مدیران سامانه مجاز به ثبت TSR جدید هستند.</p>
                    )}
                  </div>
                )
              }
              return (
                <div className="space-y-4 text-right" dir="rtl">
                  <div className="p-3 bg-critical/5 border border-critical/20 rounded-md space-y-1.5">
                    <p className="text-xs text-foreground-muted">محدودیت سرعت فعال وجود دارد:</p>
                    <p className="text-xs font-bold text-critical">
                      حداکثر سرعت: {toFa(activeTsr.speedLimit)} کیلومتر بر ساعت
                    </p>
                    <p className="text-[11px] text-foreground font-medium">علت: {activeTsr.reason}</p>
                    {isRealAdmin && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTsr(activeTsr.id)}
                        disabled={submitting}
                        className="w-full h-8 text-[11px] mt-2 font-semibold"
                      >
                        <Trash2 className="size-3.5 me-1" />
                        لغو محدودیت سرعت (TSR)
                      </Button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
