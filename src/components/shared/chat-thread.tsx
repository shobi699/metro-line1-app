'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { faTime } from '@/lib/fa'
import type { ChatMessage } from '@/features/chat'
import { Pin, FileText, ShieldAlert } from 'lucide-react'

interface ChatThreadProps {
  messages: ChatMessage[]
  currentUserId: string
  loading: boolean
  onPin?: (messageId: string, pinned: boolean) => void
}

function Attachment({ url, type }: { url: string; type: string | null }) {
  if (!type) return null
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="پیوست تصویری"
          className="max-h-60 rounded-lg object-cover"
        />
      </a>
    )
  }
  if (type.startsWith('video/')) {
    return <video src={url} controls className="max-h-60 rounded-lg" />
  }
  if (type.startsWith('audio/')) {
    return <audio src={url} controls className="w-full" />
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-2 text-xs text-accent hover:bg-surface-container transition-colors"
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">دانلود پیوست</span>
    </a>
  )
}

export function ChatThread({
  messages,
  currentUserId,
  loading,
  onPin,
  reactions,
  onReact,
}: ChatThreadProps & {
  reactions?: Record<string, Array<{ emoji: string; userId: string; userName: string }>>
  onReact?: (messageId: string, emoji: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status">
        <div className="flex flex-col items-center gap-2 text-foreground-muted">
          <div className="size-6 animate-spin rounded-full border-2 border-foreground-muted/30 border-t-accent" />
          <span className="text-xs">در حال بارگذاری پیام‌ها...</span>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        هنوز پیامی در این روم نیست
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((m) => {
        const mine = m.senderId === currentUserId
        const isSOS = m.body?.includes('🚨') || m.body?.includes('SOS') || m.body?.includes('هشدار اضطراری')
        
        // reactions grouping
        const msgReactions = reactions?.[m.id] || []
        const groupedReactions = msgReactions.reduce((acc, curr) => {
          if (!acc[curr.emoji]) acc[curr.emoji] = []
          acc[curr.emoji].push(curr)
          return acc
        }, {} as Record<string, typeof msgReactions>)

        return (
          <div
            key={m.id}
            className={cn('flex flex-col w-full group relative', isSOS ? 'items-center my-2' : mine ? 'items-start' : 'items-end')}
          >
            {/* Reaction Selector (on message hover) */}
            {!isSOS && onReact && (
              <div className={cn(
                "absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-border-subtle shadow-lg rounded-full px-2 py-0.5 flex gap-1 z-10",
                mine ? "right-2" : "left-2"
              )}>
                {['👍', '❤️', '😂', '😮', '😢', '🔥', '🚨'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(m.id, emoji)}
                    className="hover:scale-125 active:scale-95 transition-transform text-xs cursor-pointer p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div
              className={cn(
                isSOS
                  ? 'w-full max-w-md bg-red-950/25 border-2 border-red-600 text-red-500 rounded-xl p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                  : mine
                  ? 'max-w-[80%] px-3 py-2 bg-accent text-accent-foreground rounded-xl rounded-br-none'
                  : 'max-w-[80%] px-3 py-2 bg-surface-container-high border border-outline-variant text-foreground rounded-xl rounded-bl-none',
              )}
            >
              {isSOS ? (
                <div className="flex items-start gap-3 text-right" dir="rtl">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-500/20 shrink-0 text-red-500 animate-bounce">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-red-500">آلارم اضطراری فعال (SOS)</span>
                      <span className="text-[9px] text-red-500/80 font-mono">{faTime(m.createdAt)}</span>
                    </div>
                    <div className="mb-1 text-xs font-semibold text-red-400">
                      فرستنده: {m.senderName}
                    </div>
                    {m.body && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-red-200 font-medium">{m.body}</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {!mine && (
                    <div className="mb-0.5 text-[11px] font-semibold text-accent">
                      {m.senderName}
                    </div>
                  )}
                  {m.pinned && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-warning">
                      <Pin className="size-3 fill-warning" />
                      <span>سنجاق شده</span>
                    </div>
                  )}
                  {m.attachmentUrl && (
                    <div className="mb-1">
                      <Attachment url={m.attachmentUrl} type={m.attachmentType} />
                    </div>
                  )}
                  {m.body && (
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  )}
                  <div className={cn(
                    'mt-1 flex items-center justify-end gap-2 text-[10px]',
                    mine ? 'text-accent-foreground/70' : 'text-foreground-muted',
                  )}>
                    <span>{faTime(m.createdAt)}</span>
                    {onPin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPin(m.id, !m.pinned) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-warning active:scale-95 cursor-pointer text-foreground-muted"
                        title={m.pinned ? "برداشتن سنجاق" : "سنجاق کردن"}
                      >
                        <Pin className={cn("size-3", m.pinned && "fill-warning text-warning")} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Reactions Display (Rendered below message bubble) */}
            {Object.entries(groupedReactions).length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-1 mt-1 max-w-[80%]",
                mine ? "self-start" : "self-end"
              )}>
                {Object.entries(groupedReactions).map(([emoji, users]) => {
                  const reactedByMe = users.some((u) => u.userId === currentUserId)
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(m.id, emoji)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border",
                        reactedByMe
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-surface-container border-outline-variant text-foreground-muted hover:text-foreground hover:bg-surface-container-high"
                      )}
                      title={users.map((u) => u.userName).join('، ')}
                    >
                      <span>{emoji}</span>
                      <span className="font-bold">{users.length}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
