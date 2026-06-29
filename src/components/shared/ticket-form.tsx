'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { usePrivateConfig } from '@/features/auth/use-private-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, Camera, MapPin } from 'lucide-react'

interface Annotation {
  x: number
  y: number
  text: string
}

interface TicketFormProps {
  onCreated: () => void
}

export function TicketForm({ onCreated }: TicketFormProps) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('medium')
  const [wagonCode, setWagonCode] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allowNoWagon, setAllowNoWagon] = useState(true)
  const [aiPredictedPriority, setAiPredictedPriority] = useState<string>('')
  const [aiReason, setAiReason] = useState<string>('')
  const [_aiMatchedKeywords, setAiMatchedKeywords] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchWithAuth(url: string, init?: RequestInit) {
    const currentToken = useAuthStore.getState().accessToken
    const rToken = useAuthStore.getState().refreshToken

    const headers = new Headers(init?.headers)
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`)
    }

    let res = await fetch(url, { ...init, headers })

    if (res.status === 401 && rToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rToken }),
        })
        if (refreshRes.ok) {
          const payload = await refreshRes.json()
          const newAccess = payload.accessToken
          const newRefresh = payload.refreshToken
          if (newAccess && newRefresh) {
            useAuthStore.getState().setAuth(
              useAuthStore.getState().user!,
              newAccess,
              newRefresh
            )
            headers.set('Authorization', `Bearer ${newAccess}`)
            res = await fetch(url, { ...init, headers })
          }
        }
      } catch {
        // token refresh failed silently
      }
    }
    return res
  }

  useEffect(() => {
    if (!title.trim()) {
      setAiPredictedPriority('')
      setAiReason('')
      setAiMatchedKeywords([])
      return
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true)
      try {
        const res = await fetchWithAuth('/api/tickets/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, description }),
        })
        if (res.ok) {
          const payload = await res.json()
          if (payload?.data) {
            const { priority: predicted, matchedKeywords, reasons } = payload.data
            setAiPredictedPriority(predicted)
            setAiMatchedKeywords(matchedKeywords || [])
            setAiReason(reasons?.[0] || '')

            // Auto-select priority if there are matched keywords
            if (matchedKeywords && matchedKeywords.length > 0) {
              setPriority(predicted)
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setIsAnalyzing(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [title, description, accessToken])

  const privateConfig = usePrivateConfig()

  useEffect(() => {
    if (privateConfig?.allowNoWagon !== undefined) {
      setAllowNoWagon(privateConfig.allowNoWagon)
    }
  }, [privateConfig])

  const handlePhoto = useCallback((file: File) => {
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const text = prompt('توضیح نقطه:')
    if (text) {
      setAnnotations((prev) => [...prev, { x, y, text }])
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('عنوان الزامی است')
      return
    }

    if (!allowNoWagon && !wagonCode.trim()) {
      setError('وارد کردن کد واگن/تجهیز الزامی است')
      return
    }

    setLoading(true)
    setError('')

    try {
      let photoUrl = ''
      if (photo) {
        const formData = new FormData()
        formData.append('file', photo)

        const uploadRes = await fetchWithAuth('/api/uploads', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          setError(errData.error || 'خطا در آپلود تصویر خرابی')
          setLoading(false)
          return
        }

        const uploadData = await uploadRes.json()
        photoUrl = uploadData.data.url
      }

      const res = await fetchWithAuth('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          wagonCode: wagonCode || undefined,
          photoUrl: photoUrl || undefined,
          annotations: annotations.length > 0 ? annotations : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }

      setOpen(false)
      setTitle('')
      setDescription('')
      setPriority('medium')
      setWagonCode('')
      setPhoto(null)
      setPhotoPreview(null)
      setAnnotations([])
      setAiPredictedPriority('')
      setAiReason('')
      setAiMatchedKeywords([])
      onCreated()
    } catch {
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Camera className="ms-2 size-4" />
        ثبت تیکت جدید
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>ثبت تیکت خرابی</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">عنوان *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان تیکت"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="توضیحات خرابی"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ticketPriority">سطح اولویت</Label>
              {isAnalyzing && (
                <span className="text-[10px] text-accent animate-pulse flex items-center gap-1 font-mono">
                  <span className="size-1.5 rounded-full bg-accent animate-ping" />
                  در حال تحلیل متن...
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'critical', label: 'بحرانی', checked: 'peer-checked:bg-critical/15 peer-checked:border-critical peer-checked:text-critical' },
                { value: 'high', label: 'عمده', checked: 'peer-checked:bg-warning/15 peer-checked:border-warning peer-checked:text-warning' },
                { value: 'medium', label: 'جزئی', checked: 'peer-checked:bg-info/15 peer-checked:border-info peer-checked:text-info' },
                { value: 'low', label: 'کم‌اهمیت', checked: 'peer-checked:bg-surface-container-high peer-checked:border-outline peer-checked:text-foreground-muted' },
              ].map((p) => (
                <label key={p.value} className="cursor-pointer relative block">
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={priority === p.value}
                    onChange={(e) => setPriority(e.target.value)}
                    className="peer sr-only"
                  />
                  <div className={cn(
                    'h-14 flex items-center justify-center border border-outline rounded-lg bg-surface transition-colors active:inner-shadow relative overflow-hidden',
                    p.checked,
                  )}>
                    <span className="font-label-md text-xs md:text-sm">{p.label}</span>
                  </div>
                  {aiPredictedPriority === p.value && (
                    <span className="absolute -top-1.5 start-1/2 -translate-x-1/2 bg-accent text-[8px] text-accent-foreground px-1 py-0.5 rounded-full font-bold animate-pulse scale-90 whitespace-nowrap shadow-sm">
                      پیشنهاد AI
                    </span>
                  )}
                </label>
              ))}
            </div>

            {aiPredictedPriority && (
              <div className={cn(
                "p-3 rounded-lg border text-xs flex flex-col gap-1 transition-all duration-300 animate-in fade-in slide-in-from-top-1 bg-surface-container-high/40 backdrop-blur-sm",
                aiPredictedPriority === 'critical' ? 'border-critical/30 text-critical bg-critical/5' :
                  aiPredictedPriority === 'high' ? 'border-warning/30 text-warning bg-warning/5' :
                    aiPredictedPriority === 'medium' ? 'border-info/30 text-info bg-info/5' :
                      'border-border text-foreground-muted bg-surface/5'
              )}>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      aiPredictedPriority === 'critical' ? 'bg-critical' :
                        aiPredictedPriority === 'high' ? 'bg-warning' :
                          aiPredictedPriority === 'medium' ? 'bg-info' :
                            'bg-foreground-muted'
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      aiPredictedPriority === 'critical' ? 'bg-critical' :
                        aiPredictedPriority === 'high' ? 'bg-warning' :
                          aiPredictedPriority === 'medium' ? 'bg-info' :
                            'bg-foreground-muted'
                    )}></span>
                  </span>
                  <span>تحلیل هوشمند اولویت خرابی (AI):</span>
                  <span className="font-bold underline">
                    {aiPredictedPriority === 'critical' ? 'بحرانی' :
                      aiPredictedPriority === 'high' ? 'عمده' :
                        aiPredictedPriority === 'medium' ? 'جزئی' : 'کم‌اهمیت'}
                  </span>
                </div>
                {aiReason && <p className="text-[11px] leading-relaxed opacity-90">{aiReason}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>تصویر / ویدیو</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlePhoto(f)
              }}
            />
            {photoPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={photoPreview}
                  alt="preview"
                  className="w-full cursor-crosshair rounded-lg border border-border"
                  onClick={handleImageClick}
                />
                {annotations.map((a, i) => (
                  <div
                    key={i}
                    className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
                    style={{ left: `${a.x}%`, top: `${a.y}%` }}
                    title={a.text}
                  >
                    {i + 1}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 end-2"
                  onClick={() => {
                    setPhoto(null)
                    setPhotoPreview(null)
                    setAnnotations([])
                  }}
                >
                  حذف
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="انتخاب یا گرفتن عکس"
                className="flex w-full h-32 items-center justify-center gap-3 rounded-lg border-2 border-dashed border-outline hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all active:inner-shadow group bg-surface-container-lowest"
              >
                <Camera className="size-12 text-accent group-hover:scale-110 transition-transform" />
                <span className="font-label-md text-foreground">ثبت تصویر / ویدیو از خرابی</span>
              </button>
            )}
            {annotations.length > 0 && (
              <div className="space-y-1">
                {annotations.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <MapPin className="size-3" />
                    <span className="font-mono">{i + 1}.</span>
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="wagonCode">
              کد واگن/قطار {!allowNoWagon && ' *'}
            </Label>
            <Input
              id="wagonCode"
              value={wagonCode}
              onChange={(e) => setWagonCode(e.target.value)}
              placeholder="کد واگن یا قطار"
            />
          </div>

          <div className="pt-2">
            <Button
              className="w-full h-14 font-headline-md text-base gap-2 active:inner-shadow"
              onClick={handleSubmit}
              disabled={loading}
            >
              <Upload className="size-5" />
              {loading ? 'در حال ارسال...' : 'ارسال گزارش'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
