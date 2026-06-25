'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { SystemHealthWidget } from '@/components/shared/system-health-widget'
import { TsrPanel } from '@/components/shared/tsr-panel'
import { LiveTrackMap } from '@/components/shared/live-track-map'
import { FaultTicketCard } from '@/components/shared/fault-ticket-card'
import { Megaphone, Clock } from 'lucide-react'

export default function OCCPage() {
  const [currentTime, setCurrentTime] = useState('')

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

  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar
        title="مرکز فرمان خط ۱"
        subtitle="کنترل عملیات"
        showHealth
      />

      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6">
        {/* Top Utility Row */}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SystemHealthWidget />
          <div className="md:col-span-2">
            <TsrPanel />
          </div>
          <div className="flex flex-col gap-2">
            {/* Live Clock */}
            {currentTime && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <Clock className="size-4 text-accent" />
                <span className="font-data-mono text-lg text-foreground" dir="ltr">
                  {currentTime}
                </span>
              </div>
            )}
            <button className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-accent-foreground shadow-[inset_0_2px_4px_oklch(0_0_0/0.3)] transition-all active:shadow-[inset_0_0_8px_oklch(0_0_0/0.6)]">
              <Megaphone className="size-6" />
              <span className="text-sm">صدور فرمان اضطراری</span>
            </button>
          </div>
        </div>

        {/* Live Track Map */}
        <div className="mb-4">
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
              <FaultTicketCard
                ticketId="TKT-8842"
                description="قطار TR-204: نقص درب واگن ۳"
                priority="high"
                status="در حال بررسی"
              />
              <FaultTicketCard
                ticketId="TKT-8843"
                description="سیستم تهویه ایستگاه میرداماد"
                priority="medium"
                status="انتظار تعمیر"
              />
              <FaultTicketCard
                ticketId="TKT-8840"
                description="روشنایی سکوی تجریش"
                priority="low"
                status="برنامه‌ریزی شده"
              />
              <FaultTicketCard
                ticketId="TKT-8845"
                description="سنسور دود واگن ۵ قطار TR-088"
                priority="high"
                status="فوری"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
