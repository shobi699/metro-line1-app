'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toFa, jalali } from '@/lib/fa'
import { Calendar, Clock } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  durationMinutes: number
  status: string
  note: string | null
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
}

export default function MeetingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  async function loadMeetings() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadMeetings()
  }, [accessToken])

  const statusLabel: Record<string, string> = {
    pending: 'در انتظار تأیید',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    rescheduled: 'زمان جدید پیشنهاد شد',
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-warning/15 text-warning',
    approved: 'bg-success/15 text-success',
    rejected: 'bg-critical/15 text-critical',
    rescheduled: 'bg-info/15 text-info',
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Calendar className="size-6 text-accent" />
          رزرو وقت جلسه
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          درخواست و پیگیری جلسات با مدیران
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-background-subtle"
            />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-3 size-10 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">جلسه‌ای ثبت نشده است</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Card key={m.id} className="transition-colors hover:bg-surface-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.title}</span>
                      <Badge className={statusColor[m.status]}>
                        {statusLabel[m.status]}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                        {m.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 font-data-mono text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {jalali(m.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {toFa(m.durationMinutes)} دقیقه
                      </span>
                      {m.targetManager && (
                        <span>با: {m.targetManager.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                {m.note && (
                  <div className="mt-3 rounded-lg border border-outline-variant bg-surface-container-low p-2 text-xs text-foreground-muted">
                    {m.note}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
