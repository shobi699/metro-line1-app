'use client'

import { StatusPip } from './status-pip'
import { Activity } from 'lucide-react'

interface SystemHealthWidgetProps {
  radio?: 'ok' | 'warn' | 'error'
  network?: 'ok' | 'warn' | 'error'
  server?: 'ok' | 'warn' | 'error'
}

export function SystemHealthWidget({
  radio = 'ok',
  network = 'ok',
  server = 'ok',
}: SystemHealthWidgetProps) {
  const items = [
    { label: 'رادیو', labelEn: 'RAD', status: radio },
    { label: 'شبکه', labelEn: 'NET', status: network },
    { label: 'سرور', labelEn: 'SRV', status: server },
  ]

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface p-4">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="size-4 text-accent" />
        <span className="font-label-md text-foreground">وضعیت سیستم</span>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-2.5"
        >
          <div className="flex items-center gap-2">
            <StatusPip status={item.status} pulse={item.status !== 'ok'} />
            <span className="text-xs text-foreground">{item.label}</span>
          </div>
          <span className="font-data-mono text-[10px] text-foreground-muted">
            {item.labelEn}
          </span>
        </div>
      ))}
    </div>
  )
}
