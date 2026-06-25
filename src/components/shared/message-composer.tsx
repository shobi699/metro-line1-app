'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, SendHorizontal, X, Loader2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attachment {
  url: string
  type: string
  name: string
}

interface MessageComposerProps {
  token: string
  onSend: (body: string, attachment?: { url: string; type: string }) => Promise<boolean>
  disabled?: boolean
  blockAttachments?: boolean
  maxLength?: number
  disabledPlaceholder?: string
}

export function MessageComposer({
  token,
  onSend,
  disabled = false,
  blockAttachments = false,
  maxLength: propMaxLength,
  disabledPlaceholder,
}: MessageComposerProps) {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [configMaxLength, setConfigMaxLength] = useState(1000)
  const [configEnableFileSharing, setConfigEnableFileSharing] = useState(true)
  const [configAudioBitrate, setConfigAudioBitrate] = useState('32kbps')

  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const effectiveMaxLength = propMaxLength !== undefined ? propMaxLength : configMaxLength

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
    }
  }, [])

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    recordIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current)
      recordIntervalRef.current = null
    }
  }

  const cancelRecording = () => {
    stopRecording()
    setIsRecording(false)
    setRecordingTime(0)
  }

  const sendVoiceMessage = async () => {
    stopRecording()
    setIsRecording(false)
    setSending(true)
    const mockVoiceUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    const ok = await onSend('', { url: mockVoiceUrl, type: 'audio/mpeg' })
    setSending(false)
    setRecordingTime(0)
  }

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.data?.chatMaxMessageLength) {
          setConfigMaxLength(payload.data.chatMaxMessageLength)
        }
        if (payload?.data?.enableFileSharing !== undefined) {
          setConfigEnableFileSharing(payload.data.enableFileSharing)
        }
        if (payload?.data?.comms?.audioBitrate) {
          setConfigAudioBitrate(payload.data.comms.audioBitrate)
        }
      })
      .catch(() => {})
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (res.ok) {
        const data = await res.json()
        setAttachment({ url: data.data.url, type: data.data.type, name: file.name })
      }
    } catch {
      // silent
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSend() {
    const body = text.trim()
    if (!body && !attachment) return
    setSending(true)
    const ok = await onSend(
      body,
      attachment ? { url: attachment.url, type: attachment.type } : undefined,
    )
    setSending(false)
    if (ok) {
      setText('')
      setAttachment(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = text.trim() || attachment

  if (isRecording) {
    return (
      <div className="border-t border-border-subtle bg-surface-container-low p-3 flex items-center justify-between gap-4 animate-fade-in" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="text-xs font-semibold text-foreground">در حال ضبط صدا... ({configAudioBitrate})</span>
          <span className="font-mono text-xs text-foreground-muted">
            {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
            {(recordingTime % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Pulsing Waveform Simulation */}
        <div className="flex items-center gap-1 flex-1 justify-center max-w-[200px]">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((height, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full transition-all duration-150 animate-pulse"
              style={{
                height: `${height * 3}px`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-foreground-muted hover:text-foreground text-xs h-8 px-2"
          >
            لغو
          </Button>
          <Button
            size="sm"
            onClick={sendVoiceMessage}
            className="bg-red-600 hover:bg-red-700 text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl h-8 active:scale-95 transition-transform"
          >
            <Mic className="size-3.5" />
            ارسال ویس
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border-subtle bg-surface-container-low p-3">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs">
          <div className="flex size-7 items-center justify-center rounded-md bg-accent/10">
            <Paperclip className="size-3.5 text-accent" />
          </div>
          <span className="flex-1 truncate font-medium">{attachment.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="حذف پیوست"
            onClick={() => setAttachment(null)}
            className="active:scale-90"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={handleFile}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="پیوست فایل"
          disabled={uploading || disabled || blockAttachments || !configEnableFileSharing}
          onClick={() => fileRef.current?.click()}
          className="active:scale-90 transition-transform shrink-0"
          title={(blockAttachments || !configEnableFileSharing) ? 'ارسال پیوست در این گفتگو مسدود است' : 'پیوست فایل'}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className={cn("size-4", (disabled || blockAttachments || !configEnableFileSharing) && "opacity-40")} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="ضبط صدا"
          disabled={disabled}
          onClick={startRecording}
          className="active:scale-90 transition-transform shrink-0"
          title="ضبط پیام صوتی"
        >
          <Mic className={cn("size-4 text-foreground-muted hover:text-foreground", disabled && "opacity-40")} />
        </Button>
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? (disabledPlaceholder || 'فقط مدیر گروه مجاز به ارسال پیام است.') : 'پیام خود را بنویسید...'}
            aria-label="متن پیام"
            maxLength={effectiveMaxLength}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors disabled:opacity-60 disabled:bg-neutral-900/30"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          {text.length > 0 && !disabled && (
            <span className="absolute left-2.5 bottom-1 text-[9px] text-foreground-muted">
              {text.length}/{effectiveMaxLength}
            </span>
          )}
        </div>
        <Button
          size="icon-sm"
          aria-label="ارسال"
          disabled={sending || !canSend || disabled}
          onClick={handleSend}
          className={cn(
            'active:scale-90 transition-all shrink-0',
            canSend && !disabled ? 'bg-accent text-accent-foreground hover:bg-accent-hover' : '',
          )}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
