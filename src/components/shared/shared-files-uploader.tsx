'use client'

import React, { useRef, useState } from 'react'
import { 
  UploadCloud, 
  Trash2, 
  Copy, 
  Check, 
  Loader2, 
  FileArchive, 
  FileText,
  File
} from 'lucide-react'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'
import { uploadFileWithProgress } from '@/lib/upload'
import { Button } from '@/components/ui/button'

interface SharedFile {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: string
}

interface SharedFilesUploaderProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SharedFilesUploader({ value = '[]', onChange, disabled }: SharedFilesUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const token = useAuthStore((s) => s.accessToken)

  // Parse files
  const files: SharedFile[] = (() => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : (value || [])
    } catch {
      return []
    }
  })()

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '۰ بایت'
    const k = 1024
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(1))
    return `${toFa(formatted)} ${sizes[i]}`
  }

  // Get file icon based on name extension
  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="size-6 text-accent shrink-0" />
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf'].includes(ext)) {
      return <FileText className="size-6 text-blue-400 shrink-0" />
    }
    return <File className="size-6 text-foreground-muted shrink-0" />
  }

  // Handle file selection and upload
  const handleUpload = async (selectedFiles: FileList | null) => {
    const file = selectedFiles?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const url = await uploadFileWithProgress({
        file,
        token: token || undefined,
        onProgress: (p) => setProgress(p),
      })

      const newFile: SharedFile = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }

      const updatedFiles = [newFile, ...files]
      onChange(JSON.stringify(updatedFiles))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در آپلود فایل'
      setError(msg)
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || uploading) return
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleUpload(e.dataTransfer.files)
    }
  }

  // Copy link handler
  const handleCopyLink = (file: SharedFile) => {
    const host = typeof window !== 'undefined' ? window.location.origin : ''
    const fullUrl = file.url.startsWith('http') ? file.url : `${host}${file.url}`
    void navigator.clipboard.writeText(fullUrl)
    setCopiedId(file.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Delete file handler
  const handleDeleteFile = (id: string) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return
    const updatedFiles = files.filter((f) => f.id !== id)
    onChange(JSON.stringify(updatedFiles))
  }

  return (
    <div className="w-full flex flex-col gap-4" dir="rtl">
      
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          "w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-200 min-h-[140px]",
          disabled ? "opacity-50 cursor-not-allowed border-border" : "cursor-pointer border-outline-variant hover:border-accent hover:bg-accent/[0.02] active:scale-[0.99]",
          dragActive && "border-accent bg-accent/[0.04] scale-[1.01]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.rar,.7z,.tar,.gz,.pdf,.doc,.docx,.xls,.xlsx,.txt,.apk,.ipa"
          onChange={(e) => void handleUpload(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center text-center p-2 w-full max-w-xs">
            <Loader2 className="size-8 text-accent animate-spin mb-3" />
            <span className="text-xs font-bold text-foreground">
              در حال آپلود فایل ({toFa(progress)}٪)
            </span>
            <div className="w-full h-1.5 bg-border rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-150 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <UploadCloud className="size-9 text-foreground-muted mb-2.5 transition-colors group-hover:text-accent" />
            <span className="text-xs font-bold text-foreground">
              فایل خود را اینجا بکشید یا برای انتخاب کلیک کنید
            </span>
            <span className="text-[10px] text-foreground-muted mt-1.5">
              پشتیبانی از ZIP، RAR و اسناد بدون محدودیت حجم (حداقل ۱۵۰ مگابایت)
            </span>
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-critical font-medium text-center bg-critical/5 p-2 rounded-lg border border-critical/10">{error}</span>
      )}

      {/* Files List */}
      <div className="space-y-2 mt-2">
        <h4 className="text-xs font-bold text-foreground-muted mb-2">فایل‌های آپلود شده ({toFa(files.length)} مورد):</h4>
        
        {files.length === 0 ? (
          <div className="p-6 border border-border/40 rounded-2xl text-center text-xs text-foreground-muted bg-white/[0.01]">
            هیچ فایلی هنوز در آپلود سنتر ذخیره نشده است.
          </div>
        ) : (
          <div className="divide-y divide-border/30 border border-border/40 rounded-2xl overflow-hidden bg-white/[0.01]">
            {files.map((file) => (
              <div 
                key={file.id} 
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex flex-col gap-1 min-w-0 text-right">
                    <span 
                      className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                      dir="ltr"
                    >
                      {file.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-foreground-muted">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>آپلود: {jalali(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Copy Link Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyLink(file)}
                    className="size-8 rounded-lg hover:bg-white/5 text-foreground-muted hover:text-white cursor-pointer"
                    title="کپی لینک مستقیم"
                  >
                    {copiedId === file.id ? (
                      <Check className="size-4 text-success animate-in fade-in zoom-in duration-200" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFile(file.id)}
                    className="size-8 rounded-lg hover:bg-critical/10 text-foreground-muted hover:text-critical cursor-pointer"
                    title="حذف فایل"
                    disabled={disabled || uploading}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
