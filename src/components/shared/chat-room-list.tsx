'use client'

import { cn } from '@/lib/utils'
import { toFa, faTime } from '@/lib/fa'
import type { ChatRoom } from '@/features/chat'
import { Users, User, Hash, MessageSquare } from 'lucide-react'

interface ChatRoomListProps {
  rooms: ChatRoom[]
  activeRoomId: string | null
  onSelect: (roomId: string) => void
  loading: boolean
}

function roomIcon(room: ChatRoom) {
  if (room.type === 'direct') return User
  if (room.kind === 'custom' || room.kind === 'shift' || room.kind === 'station')
    return Hash
  return Users
}

function previewText(room: ChatRoom): string {
  if (!room.lastMessage) return 'بدون پیام'
  if (room.lastMessage.body) return room.lastMessage.body
  if (room.lastMessage.attachmentType?.startsWith('image/')) return '🖼️ تصویر'
  if (room.lastMessage.attachmentType?.startsWith('video/')) return '🎬 ویدیو'
  if (room.lastMessage.attachmentType?.startsWith('audio/')) return '🎤 صوت'
  return '📎 پیوست'
}

export function ChatRoomList({
  rooms,
  activeRoomId,
  onSelect,
  loading,
}: ChatRoomListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2" role="status">
        <div className="size-6 animate-spin rounded-full border-2 border-foreground-muted/30 border-t-accent" />
        <span className="text-xs text-foreground-muted">در حال بارگذاری...</span>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2 text-foreground-muted">
        <MessageSquare className="size-8" />
        <p className="text-xs">روم گفت‌وگویی وجود ندارد</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col" aria-label="فهرست گفت‌وگوها">
      {rooms.map((room) => {
        const Icon = roomIcon(room)
        const active = room.id === activeRoomId
        return (
          <li key={room.id}>
            <button
              onClick={() => onSelect(room.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border-subtle px-3 py-3 text-start transition-all',
                active
                  ? 'bg-accent/10 border-e-2 border-e-accent'
                  : 'hover:bg-surface-container-low',
              )}
            >
              <span className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
                active ? 'bg-accent/15 text-accent' : 'bg-surface-container-high text-foreground-muted',
              )}>
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'truncate text-sm',
                    active ? 'font-semibold text-foreground' : 'font-medium',
                  )}>{room.name}</span>
                  {room.lastMessage && (
                    <span className="shrink-0 font-data-mono text-[10px] text-foreground-muted">
                      {faTime(room.lastMessage.createdAt)}
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="truncate text-xs text-foreground-muted">
                    {previewText(room)}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {toFa(room.unreadCount)}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
