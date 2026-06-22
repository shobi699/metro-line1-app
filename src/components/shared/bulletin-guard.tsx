'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

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

  const handleScroll = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10
    setScrolledToEnd(atBottom)
  }, [])

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

  const current = pending[0]

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="mx-4 w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-warning" />
              بخشنامه ایمنی اجباری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-semibold">{current.title}</h3>
            <div
              ref={bodyRef}
              onScroll={handleScroll}
              className="max-h-60 overflow-y-auto rounded-lg border border-border p-4 text-sm leading-relaxed text-foreground"
            >
              {current.body}
            </div>
            <Button
              className="w-full"
              disabled={!scrolledToEnd}
              onClick={() => handleAcknowledge(current.id)}
            >
              مطالعه کردم و متوجه شدم
            </Button>
            {pending.length > 1 && (
              <p className="text-center text-xs text-foreground-muted">
                {pending.length - 1} بخشنامه دیگر باقی مانده
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
