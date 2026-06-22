'use client'

import { useCallback, useRef, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const imgRef = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    setLoading(true)
    setError('')

    try {
      let photoUrl = ''
      if (photo) {
        // In production, upload to object storage. For now, use a placeholder.
        photoUrl = `photo-${Date.now()}`
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticketPriority">اولویت</Label>
              <select
                id="ticketPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="اولویت تیکت"
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
                <option value="critical">بحرانی</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wagonCode">کد واگن/تجهیز</Label>
              <Input
                id="wagonCode"
                value={wagonCode}
                onChange={(e) => setWagonCode(e.target.value)}
                placeholder="کد"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>تصویر</Label>
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
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-foreground-muted hover:border-accent hover:bg-surface-hover"
              >
                <Upload className="size-4" />
                انتخاب یا گرفتن عکس
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

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'در حال ارسال...' : 'ثبت تیکت'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
