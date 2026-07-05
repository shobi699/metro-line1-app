'use client'

import { useState } from 'react'
import { Link2, RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { calendarApi } from '../api-client'

interface IcsDialogProps {
  accessToken: string
}

export function IcsDialog({ accessToken }: IcsDialogProps) {
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const feedUrl =
    token && typeof window !== 'undefined'
      ? `${window.location.origin}/api/calendar/ics/${token}`
      : null

  async function loadToken() {
    setBusy(true)
    setError(null)
    try {
      const data = await calendarApi.getIcsToken(accessToken)
      setToken(data.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'دریافت لینک ممکن نشد')
    } finally {
      setBusy(false)
    }
  }

  async function rotate() {
    setBusy(true)
    setError(null)
    try {
      const data = await calendarApi.rotateIcsToken(accessToken)
      setToken(data.token)
      setCopied(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'بازتولید لینک ممکن نشد')
    } finally {
      setBusy(false)
    }
  }

  async function copyUrl() {
    if (!feedUrl) return
    await navigator.clipboard.writeText(feedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !token) void loadToken()
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Link2 className="size-4" />
        اشتراک ICS
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>اشتراک تقویم در گوگل / اپل / اوت‌لوک</DialogTitle>
          <DialogDescription>
            این لینک را در تقویم بیرونی خود Subscribe کنید — شیفت‌ها و رویدادها فقط‌خواندنی
            همگام می‌شوند. با «بازتولید»، لینک قبلی بلافاصله باطل می‌شود.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-critical">{error}</p>}

        {feedUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border-subtle bg-surface-container-low p-2">
              <bdi dir="ltr" className="block break-all font-data-mono text-xs">
                {feedUrl}
              </bdi>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={copyUrl} disabled={busy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'کپی شد' : 'کپی لینک'}
              </Button>
              <Button variant="outline" size="sm" onClick={rotate} disabled={busy}>
                <RefreshCw className="size-4" />
                بازتولید (باطل‌کردن لینک قبلی)
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">{busy ? 'در حال دریافت…' : ''}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
