'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { toFa } from '@/lib/fa'

interface Announcement {
  id: string
  title: string
  body: string
  attachments?: { name: string; url: string; type: string }[] | null
  createdAt: string
  ackRequired: boolean
}

export function AnnouncementGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [pending, setPending] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessToken) return
    async function load() {
      try {
        const res = await fetch('/api/announcements?surface=modal', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          // filter ones that require ack and are not acknowledged
          const mustRead = (data.data as any[]).filter((p) => p.ackRequired && !p.acknowledged)
          setPending(mustRead)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [accessToken])

  const current = pending[0]

  const checkScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const isScrollable = el.scrollHeight > el.clientHeight
    if (!isScrollable) {
      setScrolledToEnd(true)
    } else {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 15
      setScrolledToEnd(atBottom)
    }
  }, [])

  useEffect(() => {
    if (!current) return
    checkScroll()
    const timer = setTimeout(checkScroll, 50)
    window.addEventListener('resize', checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScroll)
    }
  }, [current, checkScroll])

  async function handleAcknowledge(id: string) {
    try {
      const res = await fetch(`/api/announcements/${id}/ack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          device: 'web',
          signature: 'من متن فوق را خوانده و متعهد به اجرای آن هستم',
        }),
      })

      if (res.ok) {
        setPending((prev) => prev.filter((a) => a.id !== id))
        setScrolledToEnd(false)
      }
    } catch {
      // silent
    }
  }

  if (loading) return <>{children}</>
  if (pending.length === 0) return <>{children}</>

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md" dir="rtl">
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        <div className="mx-4 w-full max-w-md animate-[fadeInUp_0.3s_ease-out]">
          <div className="rounded-xl border border-destructive/30 bg-surface shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-destructive/10 px-6 py-5 border-b border-destructive/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15">
                  <AlertCircle className="size-5 text-destructive animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    اطلاعیه اداری الزامی (مهم)
                  </h2>
                  <p className="text-xs text-foreground-muted mt-1">
                    برای ادامه کاربری، تأیید و امضای متن زیر الزامی است
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{current.title}</h3>
              <div
                ref={bodyRef}
                onScroll={checkScroll}
                className="max-h-60 overflow-y-auto rounded-lg border border-border bg-background-subtle p-4 text-xs leading-relaxed text-foreground whitespace-pre-line"
              >
                {current.body}
              </div>

              {/* Attachments */}
              {current.attachments && current.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-foreground-muted">فایل‌های پیوست:</span>
                  <div className="space-y-1">
                    {current.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between text-[11px] text-accent hover:underline bg-accent/5 px-2 py-1 rounded border border-accent/10"
                      >
                        <span>{file.name}</span>
                        <span className="text-[10px] text-foreground-muted font-mono">{file.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: scrolledToEnd ? '100%' : '0%' }}
                  />
                </div>
                <span className="font-mono text-xs text-foreground-muted">
                  {scrolledToEnd ? '✓' : '↓'}
                </span>
              </div>

              <Button
                className="w-full h-10 text-xs font-semibold gap-1.5 cursor-pointer bg-destructive hover:bg-destructive-hover text-white rounded-lg"
                disabled={!scrolledToEnd}
                onClick={() => handleAcknowledge(current.id)}
              >
                <ShieldCheck className="size-4" />
                خواندم و متعهد می‌شوم
              </Button>

              {pending.length > 1 && (
                <p className="text-center font-mono text-[10px] text-foreground-muted">
                  {toFa(pending.length - 1)} اطلاعیه الزامی دیگر باقی مانده
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
