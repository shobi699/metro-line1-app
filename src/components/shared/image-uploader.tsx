'use client'

import React, { useRef, useState } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  onClear?: () => void
  disabled?: boolean
  className?: string
  placeholder?: string
  accept?: string
}

export function ImageUploader({ value, onChange, onClear, disabled, className, placeholder = 'آپلود تصویر', accept = 'image/*' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const token = useAuthStore((s) => s.accessToken)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      
      let data: any = null
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      }
      
      if (!res.ok) {
        throw new Error(data?.error || `خطا در آپلود فایل (${res.status})`)
      }
      
      if (data?.data?.url) {
        onChange(data.data.url)
      } else {
        throw new Error('پاسخ نامعتبر از سرور')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    if (onClear) onClear()
  }

  const isImage = value ? /\.(jpeg|jpg|gif|png|webp|svg)/i.test(value) : false
  const fileName = value ? value.split('/').pop() : ''

  return (
    <div className={cn("relative group flex flex-col gap-2", className)}>
      <div 
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 min-h-[120px]",
          disabled ? "opacity-50 cursor-not-allowed border-border" : "cursor-pointer border-outline-variant hover:border-accent hover:bg-surface-container-low active:scale-[0.98]",
          value ? "border-transparent border-solid p-0" : "p-4"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleUpload}
          className="hidden"
          disabled={disabled || uploading}
        />

        {value ? (
          <div className="w-full h-full relative min-h-[120px] flex items-center justify-center p-3 bg-surface-container">
            {isImage ? (
              <img src={value} alt="Uploaded preview" className="w-full h-full object-cover absolute inset-0" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className="size-8 text-accent" />
                <span className="text-xs font-bold text-foreground truncate max-w-[180px]" dir="ltr">{fileName}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
              <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full">تغییر فایل</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {uploading ? (
              <Loader2 className="size-8 text-accent animate-spin mb-2" />
            ) : (
              <ImageIcon className="size-8 text-foreground-muted mb-2" />
            )}
            <span className="text-xs font-bold text-foreground">
              {uploading ? 'در حال آپلود...' : placeholder}
            </span>
            {!uploading && (
              <span className="text-[10px] text-foreground-muted mt-1">حداکثر حجم: ۱۰۰ مگابایت</span>
            )}
          </div>
        )}
      </div>

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute -top-2 -left-2 size-6 rounded-full bg-critical text-critical-foreground flex items-center justify-center shadow-md active:scale-90 transition-transform opacity-0 group-hover:opacity-100 z-20"
        >
          <X className="size-3.5" />
        </button>
      )}

      {error && (
        <span className="text-[10px] text-critical font-medium text-center">{error}</span>
      )}
    </div>
  )
}
