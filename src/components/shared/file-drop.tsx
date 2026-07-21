'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, CheckCircle } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface FileDropProps {
  accept: string
  onFile: (file: File) => void
  onClear?: () => void
  disabled?: boolean
}

export function FileDrop({ accept, onFile, onClear, disabled }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFile = useCallback(
    (f: File) => {
      setFile(f)
      onFile(f)
    },
    [onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [disabled, handleFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const clearFile = useCallback(() => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
  }, [onClear])

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      aria-label="آپلود فایل اکسل"
      className={cn(
        'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : dragging
            ? 'border-accent bg-accent/5 scale-[1.02]'
            : 'border-outline-variant hover:border-accent hover:bg-surface-container-low active:scale-[0.98]',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="size-5 text-success" />
          </div>
          <div className="text-start">
            <span className="block text-sm font-medium text-foreground">{file.name}</span>
            <span className="text-xs text-foreground-muted">
              {toFa((file.size / 1024).toFixed(1))} کیلوبایت
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearFile()
            }}
            className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-container-high hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-container-high">
            <Upload className="size-6 text-foreground-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              فایل را اینجا رها کنید یا کلیک کنید
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              فایل Excel (.xlsx, .xls)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
