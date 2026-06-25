'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield } from 'lucide-react'
import { toFa } from '@/lib/fa'

interface Bulletin {
  id: string
  title: string
  body: string
  createdAt: string
}

export function BulletinGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [pending, setPending] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/bulletins/pending', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPending(data.data)
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
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10
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

  async function handleAcknowledge(bulletinId: string) {
    try {
      await fetch(`/api/bulletins/${bulletinId}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      setPending((prev) => prev.filter((b) => b.id !== bulletinId))
      setScrolledToEnd(false)
    } catch {
      // silent
    }
  }

  if (loading) return <>{children}</>
  if (pending.length === 0) return <>{children}</>

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
        <div className="mx-4 w-full max-w-md animate-[fadeInUp_0.3s_ease-out]">
          <div className="rounded-xl border border-warning/30 bg-surface shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-warning/10 px-6 py-5 border-b border-warning/20">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-warning/15">
                  <AlertTriangle className="size-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    بخشنامه ایمنی اجباری
                  </h2>
                  <p className="text-xs text-foreground-muted mt-1">
                    مطالعه و تأیید متن زیر الزامی است
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
                className="max-h-60 overflow-y-auto rounded-lg border border-border bg-background-subtle p-4 text-xs leading-relaxed text-foreground"
              >
                {current.body}
              </div>

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
                className="w-full h-10 text-xs font-semibold gap-1.5"
                disabled={!scrolledToEnd}
                onClick={() => handleAcknowledge(current.id)}
              >
                <Shield className="size-4" />
                مطالعه کردم و متوجه شدم
              </Button>

              {pending.length > 1 && (
                <p className="text-center font-mono text-[10px] text-foreground-muted">
                  {toFa(pending.length - 1)} بخشنامه دیگر باقی مانده
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
