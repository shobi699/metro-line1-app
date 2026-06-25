'use client'

import { MapPin } from 'lucide-react'

interface TrainPosition {
  id: string
  station: string
  status: 'ok' | 'warn' | 'error'
  position: string
}

interface Station {
  name: string
}

interface LiveTrackMapProps {
  stations?: Station[]
  trains?: TrainPosition[]
}

const defaultStations: Station[] = [
  { name: 'تجریش' },
  { name: 'قیطریه' },
  { name: 'میرداماد' },
  { name: 'شهید حقانی' },
  { name: 'دکتر شریعتی' },
  { name: 'گل‌حکیم' },
]

const defaultTrains: TrainPosition[] = [
  { id: 'TR-101', station: 'تجریش', status: 'ok', position: '15%' },
  { id: 'TR-204', station: 'قیطریه', status: 'error', position: '40%' },
  { id: 'TR-088', station: 'میرداماد', status: 'warn', position: '70%' },
]

const statusStyles: Record<string, { bg: string; label: string; dot: string; border: string }> = {
  ok: { bg: 'bg-success', label: 'آزاد', dot: 'bg-success', border: 'border-success/30' },
  warn: { bg: 'pulse-amber', label: 'اشغال', dot: 'bg-warning', border: 'border-warning/30' },
  error: { bg: 'pulse-red', label: 'نقص', dot: 'bg-critical', border: 'border-critical/30' },
}

export function LiveTrackMap({
  stations = defaultStations,
  trains = defaultTrains,
}: LiveTrackMapProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-accent" />
          <span className="font-label-md text-foreground">نقشه خطوط زنده (خط ۱)</span>
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

      <div className="no-scrollbar relative min-h-[200px] flex-1 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-low px-8">
        {/* Track Line */}
        <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-accent/20" />

        {/* Stations */}
        <div className="relative flex h-full items-center justify-between">
          {stations.map((station, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center -translate-y-6">
              <div className="mb-2 size-5 rounded-full border-[3px] border-surface bg-accent shadow-sm" />
              <span className="absolute top-7 whitespace-nowrap font-data-mono text-[10px] text-foreground-muted">
                {station.name}
              </span>
            </div>
          ))}

          {/* Trains */}
          {trains.map((train) => (
            <div
              key={train.id}
              className={`absolute top-1/2 z-20 h-5 w-20 -translate-y-1/2 rounded-full border-2 shadow-md transition-all ${statusStyles[train.status].bg} ${statusStyles[train.status].border}`}
              style={{ left: train.position }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-inverse-surface px-1.5 py-0.5 font-data-mono text-[9px] text-inverse-on-surface whitespace-nowrap">
                {train.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
