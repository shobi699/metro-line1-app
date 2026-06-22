'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileSpreadsheet } from 'lucide-react'
import { toFa } from '@/lib/fa'

interface FileDropProps {
  accept: string
  onFile: (file: File) => void
  disabled?: boolean
}

export function FileDrop({ accept, onFile, disabled }: FileDropProps) {
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
  }, [])

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
      className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-150 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : dragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent hover:bg-surface-hover'
      }`}
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
          <FileSpreadsheet className="size-4 text-success" />
          <span className="text-sm text-foreground">{file.name}</span>
          <span className="text-xs text-foreground-muted">
            ({toFa((file.size / 1024).toFixed(1))} کیلوبایت)
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearFile()
            }}
            className="rounded-md p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="mx-auto size-8 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">
            فایل را اینجا رها کنید یا کلیک کنید
          </p>
          <p className="text-xs text-foreground-muted">
            فایل Excel (.xlsx, .xls)
          </p>
        </div>
      )}
    </div>
  )
}
