'use client'

import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { jalali } from '@/lib/fa'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CrisisEvent {
  id: string
  title: string
  description: string | null
  level: string
  activatedAt: string
  resolvedAt: string | null
  activator?: { name: string }
}

export default function CrisisPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.roleKey === 'super_admin'

  useEffect(() => {
    void loadCrisis()
  }, [accessToken])

  async function loadCrisis() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/crisis', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setActiveCrisis(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  async function activateCrisis() {
    if (!accessToken) return
    const title = prompt('عنوان بحران:')
    if (!title) return
    const level = prompt('سطح بحران (normal/elevated/high/critical):', 'high')
    if (!level) return

    await fetch('/api/crisis', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, level }),
    })
    loadCrisis()
  }

  async function resolveCrisis() {
    if (!accessToken || !activeCrisis) return
    if (!confirm('آیا از غیرفعال کردن حالت بحران اطمینان دارید؟')) return

    await fetch('/api/crisis', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ crisisId: activeCrisis.id }),
    })
    loadCrisis()
  }

  const levelConfig: Record<string, { label: string; color: string }> = {
    normal: { label: 'عادی', color: 'bg-success/15 text-success' },
    elevated: { label: 'افزایش یافته', color: 'bg-warning/15 text-warning' },
    high: { label: 'بالا', color: 'bg-critical/15 text-critical' },
    critical: { label: 'بحرانی', color: 'bg-critical text-critical-foreground' },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Shield className="size-6 text-accent" />
            مدیریت بحران
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            فعال‌سازی و مدیریت حالت اضطراری
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!activeCrisis ? (
              <Button variant="destructive" onClick={activateCrisis}>
                <AlertTriangle className="size-4" />
                فعال‌سازی بحران
              </Button>
            ) : (
              <Button variant="outline" onClick={resolveCrisis}>
                <CheckCircle className="size-4" />
                غیرفعال کردن
              </Button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg border border-border bg-background-subtle" />
      ) : activeCrisis ? (
        <Card className="border-critical/50 bg-critical/5 pulse-animation">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-critical/20">
              <AlertTriangle className="size-8 text-critical" />
            </div>
            <div className="text-center">
              <h2 className="font-headline-md text-critical">
                حالت بحران فعال
              </h2>
              <p className="mt-1 text-sm">{activeCrisis.title}</p>
              {activeCrisis.description && (
                <p className="mt-2 text-sm text-foreground-muted">
                  {activeCrisis.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 font-data-mono text-xs text-foreground-muted">
              <Badge className={levelConfig[activeCrisis.level]?.color}>
                {levelConfig[activeCrisis.level]?.label}
              </Badge>
              <span>فعال شده: {jalali(activeCrisis.activatedAt)}</span>
              {activeCrisis.activator && (
                <span>توسط: {activeCrisis.activator.name}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="mb-3 size-10 text-success" />
            <p className="text-sm text-success">وضعیت عادی</p>
            <p className="mt-1 text-xs text-foreground-muted">
              هیچ بحران فعالی وجود ندارد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
