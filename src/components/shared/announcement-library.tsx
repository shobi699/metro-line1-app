'use client'

import { PlayCircle, Volume2, AlertTriangle } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  code: string
  category: 'emergency' | 'operational'
}

interface AnnouncementLibraryProps {
  announcements?: Announcement[]
}

const defaultAnnouncements: Announcement[] = [
  { id: '1', title: 'Evacuation آتش‌نشانی', code: 'FA-01', category: 'emergency' },
  { id: '2', title: 'حادثه امنیتی - در قطار بمانید', code: 'SEC-04', category: 'emergency' },
  { id: '3', title: 'تأخیر قطار - نقص فنی', code: 'OPS-12', category: 'operational' },
  { id: '4', title: 'ازدحام سکو - عقب بایستید', code: 'SAF-02', category: 'operational' },
  { id: '5', title: 'یادآوری پایان سرویس', code: 'INFO-09', category: 'operational' },
]

export function AnnouncementLibrary({
  announcements = defaultAnnouncements,
}: AnnouncementLibraryProps) {
  const emergency = announcements.filter((a) => a.category === 'emergency')
  const operational = announcements.filter((a) => a.category === 'operational')

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-outline-variant pb-2">
        <Volume2 className="size-4 text-accent" />
        <span className="font-label-md text-foreground">اعلانات استاندارد</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Emergency */}
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 font-label-md text-xs text-critical">
            <AlertTriangle className="size-3" />
            بحرانی / اضطراری
          </h4>
          <div className="space-y-2">
            {emergency.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg border border-critical/20 bg-critical/5 p-3 text-start transition-all hover:bg-critical/10 active:scale-[0.98]"
              >
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-0.5 font-data-mono text-xs text-foreground-muted">
                    {item.code}
                  </div>
                </div>
                <PlayCircle className="size-5 text-critical" />
              </button>
            ))}
          </div>
        </div>

        {/* Operational */}
        <div>
          <h4 className="mb-2 font-label-md text-xs text-foreground-muted">
            عملیاتی
          </h4>
          <div className="space-y-2">
            {operational.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg border border-outline-variant bg-surface p-3 text-start transition-all hover:bg-surface-container-low active:scale-[0.98]"
              >
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-0.5 font-data-mono text-xs text-foreground-muted">
                    {item.code}
                  </div>
                </div>
                <PlayCircle className="size-5 text-accent" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
