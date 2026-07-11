'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { useChatStore, type MessagePriority, type ChannelKind } from '@/features/chat'
import { ChatRoomList } from '@/components/shared/chat-room-list'
import { ChatThread } from '@/components/shared/chat-thread'
import { MessageComposer } from '@/components/shared/message-composer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'
import {
  ArrowRight,
  MessagesSquare,
  Search,
  Plus,
  Pin,
  Info,
  X,
  User,
  Users,
  Hash,
  Check,
  Lock,
  Volume2,
  Activity,
  MessageCircle,
  ShieldAlert,
  Siren,
  AlertTriangle,
  Zap,
  Tag,
  Radio
} from 'lucide-react'

// ── نگاشت نوع کانال به برچسب فارسی — بخش ۵.۱
const CHANNEL_KIND_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  direct:       { label: 'خصوصی',       icon: User,         color: 'text-foreground-muted' },
  shift:        { label: 'گروه شیفت',   icon: Users,        color: 'text-accent' },
  station:      { label: 'ایستگاه',     icon: Radio,        color: 'text-primary' },
  announcement: { label: 'اطلاعیه رسمی',icon: Hash,         color: 'text-warning' },
  emergency:    { label: 'اضطراری',     icon: ShieldAlert,  color: 'text-critical' },
  occ:          { label: 'OCC',         icon: Zap,          color: 'text-blue-400' },
  training:     { label: 'آموزش',       icon: Tag,          color: 'text-success' },
  management:   { label: 'مدیران',      icon: Lock,         color: 'text-purple-400' },
  general:      { label: 'عمومی',       icon: MessageCircle,color: 'text-foreground-muted' },
  operators:    { label: 'راهبران',     icon: Users,        color: 'text-accent' },
  custom:       { label: 'سفارشی',      icon: Hash,         color: 'text-foreground-muted' },
}

// ── سطح اولویت پیام — بخش ۵.۳
const PRIORITY_META: Record<MessagePriority, { label: string; color: string; ringColor: string }> = {
  normal:    { label: 'عادی',        color: 'text-foreground-muted', ringColor: '' },
  important: { label: 'مهم',         color: 'text-warning',          ringColor: 'ring-warning/50' },
  urgent:    { label: 'فوری',        color: 'text-orange-400',       ringColor: 'ring-orange-400/50' },
  emergency: { label: 'اضطراری',     color: 'text-critical',         ringColor: 'ring-critical/50' },
  critical:  { label: 'بحرانی 🔴',   color: 'text-red-500',          ringColor: 'ring-red-500/60' },
}

interface UserOption {
  id: string
  name: string
  personnelCode: string
  role: { name: string; key: string }
  customFields?: Record<string, unknown> | null
}

function ChatView() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  const searchParams = useSearchParams()
  const router = useRouter()
  const dmUserId = searchParams.get('dm')

  // Chat Store states
  const rooms = useChatStore((s) => s.rooms)
  const activeRoomId = useChatStore((s) => s.activeRoomId)
  const messagesByRoom = useChatStore((s) => s.messagesByRoom)
  const roomSettings = useChatStore((s) => s.roomSettings)
  const roomReactions = useChatStore((s) => s.roomReactions)
  const roomIsAdmin = useChatStore((s) => s.roomIsAdmin)
  const loadingRooms = useChatStore((s) => s.loadingRooms)
  const loadingMessages = useChatStore((s) => s.loadingMessages)
  const loadRooms = useChatStore((s) => s.loadRooms)
  const selectRoom = useChatStore((s) => s.selectRoom)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const openDirect = useChatStore((s) => s.openDirect)
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)
  const connected = useChatStore((s) => s.connected)
  const toggleReaction = useChatStore((s) => s.toggleReaction)
  const updateSettings = useChatStore((s) => s.updateSettings)

  // Layout & UI States
  const [showThreadMobile, setShowThreadMobile] = useState(false)
  const [roomSearchQuery, setRoomSearchQuery] = useState('')
  const [roomFilterType, setRoomFilterType] = useState<'all' | 'direct' | 'group'>('all')
  const [msgSearchQuery, setMsgSearchQuery] = useState('')
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)
  const [msgPriority, setMsgPriority] = useState<MessagePriority>('normal')
  const [roomKindFilter, setRoomKindFilter] = useState<string>('all')
  const emergencyMode = useChatStore((s) => s.emergencyMode)
  const setEmergencyMode = useChatStore((s) => s.setEmergencyMode)

  // Modals
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [usersList, setUsersList] = useState<UserOption[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Member Filtering States
  const [filterRole, setFilterRole] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterStation, setFilterStation] = useState('')

  // Group Builder Form
  const [groupName, setGroupName] = useState('')
  const [groupKind, setGroupKind] = useState('custom')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)

  // 1. Connect and fetch rooms
  useEffect(() => {
    if (!accessToken) return
    loadRooms(accessToken)
    connect(accessToken)
    return () => disconnect()
  }, [accessToken, loadRooms, connect, disconnect])

  // 2. Open direct chat on URL command ?dm=
  useEffect(() => {
    if (!accessToken || !dmUserId) return
    let cancelled = false
    openDirect(accessToken, dmUserId).then((roomId) => {
      if (cancelled || !roomId) return
      selectRoom(accessToken, roomId)
      setShowThreadMobile(true)
      router.replace('/chat')
    })
    return () => {
      cancelled = true
    }
  }, [accessToken, dmUserId, openDirect, selectRoom, router])

  // Fetch users when the dialog opens
  useEffect(() => {
    if (!isNewChatOpen || !accessToken) return
    setLoadingUsers(true)
    fetch('/api/users?pageSize=100', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : { data: { users: [] } }))
      .then((payload) => {
        setUsersList(payload.data?.users ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false))
  }, [isNewChatOpen, accessToken])

  // Select room handler
  function handleSelectRoom(roomId: string) {
    if (!accessToken) return
    selectRoom(accessToken, roomId)
    setShowThreadMobile(true)
    setMsgSearchQuery('')
    setShowMsgSearch(false)
  }

  async function handleSend(body: string, attachment?: { url: string; type: string }) {
    if (!accessToken || !activeRoomId) return false
    return sendMessage(accessToken, activeRoomId, body, attachment, msgPriority)
  }

  // Pin/Unpin message handler
  async function handlePinMessage(messageId: string, pinned: boolean) {
    if (!accessToken || !activeRoomId) return
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoomId}/pin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId, pinned }),
      })
      if (res.ok) {
        selectRoom(accessToken, activeRoomId)
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در عملیات سنجاق کردن پیام')
      }
    } catch {
      // pin message failed silently
    }
  }

  // Create group room handler
  async function handleCreateGroup() {
    if (!accessToken || !groupName.trim()) return
    setCreatingGroup(true)
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          kind: groupKind,
          memberIds: selectedMembers,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGroupName('')
        setGroupKind('custom')
        setSelectedMembers([])
        setIsNewChatOpen(false)
        loadRooms(accessToken)
        selectRoom(accessToken, data.data.id)
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در ساخت گروه جدید')
      }
    } catch {
      // create group failed silently
    } finally {
      setCreatingGroup(false)
    }
  }

  // Trigger direct chat creation
  async function handleStartDirectChat(userId: string) {
    if (!accessToken) return
    setIsNewChatOpen(false)
    const roomId = await openDirect(accessToken, userId)
    if (roomId) {
      selectRoom(accessToken, roomId)
      setShowThreadMobile(true)
    }
  }

  // Toggle user group member selection
  function toggleMemberSelection(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  // Data Selectors
  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null
  const messages = activeRoomId ? messagesByRoom[activeRoomId] ?? [] : []

  // Filtered rooms in the sidebar
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(roomSearchQuery.toLowerCase())
      const matchesType =
        roomFilterType === 'all'
          ? true
          : roomFilterType === 'direct'
          ? r.type === 'direct'
          : r.type === 'group'
      const matchesKind = roomKindFilter === 'all' ? true : r.kind === roomKindFilter
      // In emergency mode, highlight only emergency/occ/management channels
      if (emergencyMode && roomKindFilter === 'all') {
        return matchesSearch && matchesType
      }
      return matchesSearch && matchesType && matchesKind
    })
  }, [rooms, roomSearchQuery, roomFilterType, roomKindFilter, emergencyMode])

  // Filtered messages inside thread search
  const filteredMessages = useMemo(() => {
    if (!msgSearchQuery.trim()) return messages
    return messages.filter((m) =>
      m.body?.toLowerCase().includes(msgSearchQuery.toLowerCase()),
    )
  }, [messages, msgSearchQuery])

  // Pinned messages list
  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.pinned)
  }, [messages])

  const latestPinned = pinnedMessages[pinnedMessages.length - 1] ?? null

  const isUserAdmin = currentUser?.roleKey === 'admin' || currentUser?.roleKey === 'super_admin'

  // Filter users lists in dialog
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
      const matchesRole = filterRole ? u.role?.key === filterRole : true
      const uFields = u.customFields as Record<string, any> | null
      const matchesGroup = filterGroup ? uFields?.group === filterGroup : true
      const matchesStation = filterStation ? uFields?.station === filterStation : true
      return matchesSearch && matchesRole && matchesGroup && matchesStation && u.id !== currentUser?.id
    })
  }, [usersList, userSearchQuery, filterRole, filterGroup, filterStation, currentUser])

  const activeSettings = activeRoomId ? roomSettings[activeRoomId] || { readOnly: false, blockAttachments: false, maxLength: 1000 } : { readOnly: false, blockAttachments: false, maxLength: 1000 }
  const isRoomAdmin = activeRoomId ? roomIsAdmin[activeRoomId] || false : false

  const handleUpdateSetting = async (key: 'readOnly' | 'blockAttachments' | 'maxLength', value: any) => {
    if (!accessToken || !activeRoomId) return
    const newSettings = {
      ...activeSettings,
      [key]: value
    }
    await updateSettings(accessToken, activeRoomId, newSettings)
  }


  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background">

      {/* ── بنر حالت اضطراری — بخش ۵.۵ ── */}
      {emergencyMode && (
        <div className="fixed top-0 inset-x-0 z-50 bg-critical text-white flex items-center justify-between px-4 py-2 text-xs font-bold shadow-lg">
          <div className="flex items-center gap-2">
            <Siren className="size-4 animate-pulse" />
            حالت ارتباط اضطراری فعال است — فقط پیام‌های OCC، مدیر و مسئول ایمنی اولویت دارند
          </div>
          <button
            onClick={() => setEmergencyMode(false)}
            className="opacity-70 hover:opacity-100 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────── */}
      {/* SIDEBAR: ROOM LIST */}
      {/* ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex w-full flex-col border-e border-border lg:w-80 bg-surface-container-low/40',
          showThreadMobile ? 'hidden lg:flex' : 'flex',
        )}
      >
        {/* Sidebar Header */}
        <div className="flex flex-col gap-3 shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <MessageCircle className="size-5 text-accent" />
              گفت‌وگوهای خط ۱
            </h1>
            
            {/* Live SSE Status */}
            <div className="flex items-center gap-1.5 bg-neutral-900/40 px-2 py-0.5 rounded border border-border-subtle">
              <span className={cn(
                "relative flex h-2 w-2 rounded-full",
                connected ? "bg-success" : "bg-warning"
              )}>
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/80 opacity-75"></span>
                )}
              </span>
              <span className="text-[10px] font-bold text-foreground-muted">
                {connected ? 'OCC برخط' : 'آفلاین'}
              </span>
            </div>
          </div>

          {/* Search and Action Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-2.5 size-4 text-foreground-muted" />
              <Input
                placeholder="جستجو گفتگوها..."
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="h-9 pr-8 text-xs bg-neutral-950/20"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsNewChatOpen(true)}
              className="h-9 w-9 shrink-0 active:scale-95 transition-transform"
              title="گفت‌وگوی جدید"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Channel Kind Filter pills — بخش ۵.۱ */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide text-[10px]">
            {['all', 'shift', 'station', 'announcement', 'emergency', 'occ', 'training', 'management'].map((kind) => {
              const meta = kind === 'all' ? { label: 'همه', color: '' } : CHANNEL_KIND_META[kind]
              return (
                <button
                  key={kind}
                  onClick={() => setRoomKindFilter(kind)}
                  className={cn(
                    'shrink-0 px-2 py-0.5 rounded-full border transition-all font-semibold',
                    roomKindFilter === kind
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'border-border/40 text-foreground-muted hover:border-border'
                  )}
                >
                  {meta?.label || 'همه'}
                </button>
              )
            })}
          </div>

          {/* Filter pills (type) */}
          <div className="flex gap-1.5 p-0.5 bg-neutral-950/30 rounded-lg border border-border-subtle/50 text-[11px]">
            <button
              onClick={() => setRoomFilterType('all')}
              className={cn(
                "flex-1 py-1 rounded-md text-center transition-all font-semibold",
                roomFilterType === 'all' ? "bg-accent text-accent-foreground shadow" : "text-foreground-muted hover:text-foreground"
              )}
            >
              همه ({toFa(rooms.length)})
            </button>
            <button
              onClick={() => setRoomFilterType('direct')}
              className={cn(
                "flex-1 py-1 rounded-md text-center transition-all font-semibold",
                roomFilterType === 'direct' ? "bg-accent text-accent-foreground shadow" : "text-foreground-muted hover:text-foreground"
              )}
            >
              خصوصی
            </button>
            <button
              onClick={() => setRoomFilterType('group')}
              className={cn(
                "flex-1 py-1 rounded-md text-center transition-all font-semibold",
                roomFilterType === 'group' ? "bg-accent text-accent-foreground shadow" : "text-foreground-muted hover:text-foreground"
              )}
            >
              گروه‌ها
            </button>
          </div>
        </div>

        {/* Room List scroll section */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatRoomList
            rooms={filteredRooms}
            activeRoomId={activeRoomId}
            onSelect={handleSelectRoom}
            loading={loadingRooms}
          />
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────── */}
      {/* CHAT CONTAINER */}
      {/* ──────────────────────────────────────────────────────── */}
      <section
        className={cn(
          'min-h-0 flex-1 flex-col relative',
          showThreadMobile ? 'flex' : 'hidden lg:flex',
        )}
      >
        {activeRoom ? (
          <>
            {/* Chat Thread Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-container-low/30 px-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="بازگشت"
                  onClick={() => setShowThreadMobile(false)}
                >
                  <ArrowRight className="size-4" />
                </Button>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    {activeRoom.type === 'group' ? (
                      <Users className="size-4 text-accent" />
                    ) : (
                      <User className="size-4 text-foreground-muted" />
                    )}
                    {activeRoom.name}
                  </span>
                  {activeRoom.type === 'group' && (
                    <span className="text-[10px] text-foreground-muted">
                      {toFa(activeRoom.memberCount)} عضو فعال | کانال رسمی خط ۱
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Window Actions */}
              <div className="flex items-center gap-2">
                {/* Search in message thread */}
                {showMsgSearch ? (
                  <div className="flex items-center gap-1 bg-neutral-950/20 border border-border-subtle rounded-lg px-2 h-8 w-44 md:w-56">
                    <Search className="size-3.5 text-foreground-muted shrink-0" />
                    <input
                      placeholder="جستجو پیام‌ها..."
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-[11px] w-full text-foreground"
                    />
                    <button
                      onClick={() => {
                        setMsgSearchQuery('')
                        setShowMsgSearch(false)
                      }}
                      className="text-foreground-muted hover:text-foreground active:scale-90"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowMsgSearch(true)}
                    className="h-8 w-8 text-foreground-muted hover:text-foreground"
                    title="جستجو در پیام‌ها"
                  >
                    <Search className="size-4" />
                  </Button>
                )}

                {/* Details toggle */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                  className={cn(
                    "h-8 w-8 text-foreground-muted hover:text-foreground",
                    showDetailsPanel && "bg-neutral-900/40 text-accent"
                  )}
                  title="اطلاعات گفت‌وگو"
                >
                  <Info className="size-4" />
                </Button>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {latestPinned && (
              <div className="flex items-center justify-between bg-warning/5 border-b border-warning/10 px-4 py-2 text-xs text-warning animate-fade-in shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Pin className="size-3.5 text-warning shrink-0 fill-warning" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-[10px] text-warning/80">پیام سنجاق شده:</span>
                    <span className="truncate block text-foreground/90 font-medium">{latestPinned.body || 'پیوست رسانه‌ای'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => handlePinMessage(latestPinned.id, false)}
                    className="p-1 hover:text-foreground text-warning/80"
                    title="برداشتن سنجاق"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Thread list */}
            <ChatThread
              messages={filteredMessages}
              currentUserId={currentUser?.id ?? ''}
              loading={loadingMessages}
              onPin={handlePinMessage}
              reactions={activeRoomId ? roomReactions[activeRoomId] : undefined}
              onReact={(messageId, emoji) => {
                if (accessToken && activeRoomId) {
                  toggleReaction(accessToken, activeRoomId, messageId, emoji)
                }
              }}
              accessToken={accessToken ?? ''}
            />

            {/* Priority Selector Bar — بخش ۵.۳ */}
            <div className="shrink-0 px-4 py-1.5 border-t border-border/30 bg-surface-container-low/20 flex items-center gap-2">
              <span className="text-[10px] text-foreground-muted">اولویت:</span>
              <div className="flex gap-1">
                {(Object.entries(PRIORITY_META) as [MessagePriority, typeof PRIORITY_META[MessagePriority]][]).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setMsgPriority(key)}
                    className={cn(
                      'text-[9px] px-2 py-0.5 rounded-full border transition-all font-bold cursor-pointer',
                      msgPriority === key
                        ? `bg-surface-container-high border-current ${meta.color} shadow ring-1 ${meta.ringColor}`
                        : 'border-border/30 text-foreground-muted hover:border-border'
                    )}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
              {isUserAdmin && (
                <button
                  onClick={() => setEmergencyMode(!emergencyMode)}
                  className={cn(
                    'mr-auto text-[9px] px-2 py-0.5 rounded-full border font-bold cursor-pointer transition-all',
                    emergencyMode
                      ? 'bg-critical/20 border-critical text-critical'
                      : 'border-border/30 text-foreground-muted hover:border-critical hover:text-critical'
                  )}
                >
                  {emergencyMode ? '🚨 حالت بحران فعال' : 'فعال‌سازی حالت بحران'}
                </button>
              )}
            </div>

            {/* Composer */}
            <MessageComposer
              token={accessToken ?? ''}
              onSend={handleSend}
              disabled={activeSettings.readOnly && !isRoomAdmin}
              blockAttachments={activeSettings.blockAttachments && !isRoomAdmin}
              maxLength={activeSettings.maxLength}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-foreground-muted bg-neutral-950/5">
            <div className="flex size-16 items-center justify-center rounded-full bg-surface-container-high border border-border-subtle">
              <MessagesSquare className="size-8 text-foreground-muted" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">یک گفتگو را برای آغاز پیام‌رسانی انتخاب کنید</p>
              <p className="text-xs text-foreground-muted">
                اتاق‌های گروهی یا گفتگوهای خصوصی خود باOCC و سایر راهبران را باز کنید.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsNewChatOpen(true)} className="mt-2 text-xs">
              شروع گفت‌وگوی جدید
            </Button>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* RIGHT SIDE DETAILS DRAWER */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeRoom && showDetailsPanel && (
        <aside className="hidden md:flex w-64 flex-col border-s border-border bg-surface-container-low/20 shrink-0">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <h3 className="text-xs font-bold text-foreground">اطلاعات و جزئیات گفت‌وگو</h3>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowDetailsPanel(false)}
              className="h-7 w-7"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto flex-1 text-right" dir="rtl">
            {/* Room Avatar & Name */}
            <div className="flex flex-col items-center justify-center text-center gap-2 py-4 border-b border-border-subtle/55">
              <div className="size-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                {activeRoom.type === 'group' ? (
                  <Users className="size-8" />
                ) : (
                  <User className="size-8" />
                )}
              </div>
              <span className="font-bold text-sm mt-1 text-foreground block">{activeRoom.name}</span>
              <Badge variant="outline" className="text-[9px] bg-neutral-900/40">
                {activeRoom.type === 'group' ? 'کانال گروهی خط ۱' : 'گفتگو خصوصی ایمن'}
              </Badge>
            </div>

            {/* Room Metadata */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-accent block">مشخصات روم:</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border-subtle/30">
                  <span className="text-foreground-muted">شناسه اتاق:</span>
                  <span className="font-mono text-[10px] select-all">{activeRoom.id}</span>
                </div>
                {activeRoom.type === 'group' && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/30">
                      <span className="text-foreground-muted">تعداد اعضا:</span>
                      <span className="font-bold">{toFa(activeRoom.memberCount)} نفر</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/30">
                      <span className="text-foreground-muted">نوع کانال:</span>
                      <span className="font-semibold text-accent">{activeRoom.kind}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-1 border-b border-border-subtle/30">
                  <span className="text-foreground-muted">آخرین فعالیت:</span>
                  <span className="font-mono text-[10px]">
                    {activeRoom.lastMessage ? toFa(activeRoom.lastMessage.createdAt.split('T')[0]) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Settings and Restrictions (only for room administrators) */}
            {isRoomAdmin && activeRoom.type === 'group' && (
              <div className="space-y-3 border-t border-border-subtle/55 pt-4">
                <span className="text-[11px] font-bold text-accent block">تنظیمات و محدودیت‌های کانال:</span>
                <div className="space-y-3 text-xs bg-neutral-950/20 p-2.5 rounded-lg border border-border-subtle/30">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">فقط مدیر پیام بفرستد:</span>
                    <input
                      type="checkbox"
                      checked={activeSettings.readOnly}
                      onChange={(e) => handleUpdateSetting('readOnly', e.target.checked)}
                      className="rounded border-border bg-neutral-950 text-accent focus:ring-accent size-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">غیرفعال‌سازی ارسال فایل:</span>
                    <input
                      type="checkbox"
                      checked={activeSettings.blockAttachments}
                      onChange={(e) => handleUpdateSetting('blockAttachments', e.target.checked)}
                      className="rounded border-border bg-neutral-950 text-accent focus:ring-accent size-4 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">حداکثر کاراکتر پیام:</span>
                    <select
                      value={activeSettings.maxLength}
                      onChange={(e) => handleUpdateSetting('maxLength', Number(e.target.value))}
                      className="rounded border border-border bg-neutral-950 px-1 py-0.5 text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value={100}>۱۰۰</option>
                      <option value={500}>۵۰۰</option>
                      <option value={1000}>۱۰۰۰</option>
                      <option value={5000}>۵۰۰۰</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Pinned messages lists inside drawer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-accent block">پیام‌های سنجاق شده ({toFa(pinnedMessages.length)}):</span>
              </div>
              
              {pinnedMessages.length === 0 ? (
                <p className="text-[10px] text-foreground-muted text-center py-4 border border-dashed border-border-subtle rounded-md">
                  پیام پین شده‌ای یافت نشد
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {pinnedMessages.map((m) => (
                    <div key={m.id} className="p-2 bg-neutral-950/20 rounded border border-border-subtle text-[10px] space-y-1 relative group">
                      <div className="flex justify-between text-[9px] text-accent/80 font-bold">
                        <span>فرستنده: {m.senderName}</span>
                        {isUserAdmin && (
                          <button
                            onClick={() => handlePinMessage(m.id, false)}
                            className="text-foreground-muted hover:text-critical font-normal opacity-0 group-hover:opacity-100 transition-opacity"
                            title="حذف پین"
                          >
                            حذف پین
                          </button>
                        )}
                      </div>
                      <p className="text-foreground/90 leading-relaxed">{m.body || 'پیوست رسانه‌ای'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL: NEW DIALOG / GROUP CONVERSATION */}
      {/* ──────────────────────────────────────────────────────── */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="max-w-md bg-surface-container-low border border-border text-foreground" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold">شروع گفت‌وگوی جدید</DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted">
              با انتخاب یکی از همکاران خط ۱ گفت‌وگو را آغاز کنید یا یک کانال گروهی جدید بسازید.
            </DialogDescription>
          </DialogHeader>

          {/* User Search Input */}
          <div className="relative mt-2">
            <Search className="absolute right-2.5 top-2.5 size-4 text-foreground-muted" />
            <Input
              placeholder="جستجو همکاران بر اساس نام..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pr-8 text-xs bg-neutral-950/20"
            />
          </div>

          {/* Smart Member Filters */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-foreground-muted">فیلتر نقش:</Label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-neutral-950 px-1 py-0.5 text-[10px] text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">همه نقش‌ها</option>
                <option value="super_admin">مدیر ارشد</option>
                <option value="admin">مدیر</option>
                <option value="operator">راهبر / اپراتور</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-foreground-muted">فیلتر گروه شیفت:</Label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-neutral-950 px-1 py-0.5 text-[10px] text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">همه گروه‌ها</option>
                <option value="A">گروه A</option>
                <option value="B">گروه B</option>
                <option value="C">گروه C</option>
                <option value="Staff">ستادی</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-semibold text-foreground-muted">فیلتر ایستگاه:</Label>
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-neutral-950 px-1 py-0.5 text-[10px] text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">همه ایستگاه‌ها</option>
                <option value="tajrish">تجریش</option>
                <option value="haft_tir">هفت تیر</option>
                <option value="darvazeh_dowlat">دروازه دولت</option>
                <option value="imam_khomeini">امام خمینی</option>
                <option value="shahr_e_rey">شهر ری</option>
                <option value="kahrizak">کهریزک</option>
                <option value="depot">دپو کهریزک</option>
              </select>
            </div>
          </div>

          {/* Quick Select Buttons (only for admin) */}
          {isUserAdmin && (
            <div className="flex justify-between items-center mt-2 bg-neutral-900/40 p-2 rounded-lg border border-border-subtle/50">
              <span className="text-[10px] text-foreground-muted">تعداد منطبق: {toFa(filteredUsers.length)} نفر</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px] px-2"
                onClick={() => {
                  const newSelections = Array.from(new Set([...selectedMembers, ...filteredUsers.map(u => u.id)]))
                  setSelectedMembers(newSelections)
                }}
              >
                انتخاب همه فیلتر شده‌ها
              </Button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {/* Tabs for Direct Chat vs Group Chat */}
            <div className="flex border-b border-border-subtle text-xs">
              <button
                type="button"
                className="px-4 py-2 border-b-2 border-accent text-accent font-bold"
              >
                کاربران خط ۱ (خصوصی)
              </button>
              {isUserAdmin && (
                <div className="px-4 py-2 text-foreground-muted text-[10px] flex items-center gap-1">
                  <Lock className="size-3 text-accent" />
                  ساخت گروه (در پنل زیرین)
                </div>
              )}
            </div>

            {/* User List selection block */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {loadingUsers ? (
                <div className="flex flex-col items-center py-6 gap-2 text-foreground-muted">
                  <div className="size-5 animate-spin rounded-full border-2 border-foreground-muted/30 border-t-accent" />
                  <span className="text-[10px]">در حال خواندن لیست پرسنل...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-foreground-muted text-center py-4">همکاری با این نام یافت نشد.</p>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/10 border border-border-subtle/50 hover:bg-neutral-950/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7.5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-[11px] font-bold text-accent">
                        {u.name.substring(0, 1)}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-bold">{u.name}</span>
                        <span className="text-[9px] text-foreground-muted">{u.role.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {/* DM Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartDirectChat(u.id)}
                        className="h-7 text-[10px]"
                      >
                        ارسال پیام
                      </Button>

                      {/* Select as Group Member (Only for Admin) */}
                      {isUserAdmin && (
                        <Button
                          size="sm"
                          variant={selectedMembers.includes(u.id) ? "default" : "outline"}
                          onClick={() => toggleMemberSelection(u.id)}
                          className="h-7 px-2.5"
                        >
                          {selectedMembers.includes(u.id) ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Plus className="size-3.5 text-foreground-muted" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Admin Group Builder Form */}
            {isUserAdmin && (
              <div className="border-t border-border-subtle/70 pt-4 space-y-3 bg-neutral-950/15 p-3 rounded-lg border">
                <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  پنل ایجاد کانال گروهی جدید (مخصوص مدیران)
                </span>
                
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] font-semibold text-foreground-muted">نام گروه:</Label>
                  <Input
                    placeholder="مثال: کانال هماهنگی دپو کهریزک"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-8.5 text-xs bg-neutral-950/20"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <Label className="text-[10px] font-semibold text-foreground-muted">نوع کانال / حوزه فعالیت:</Label>
                  <select
                    value={groupKind}
                    onChange={(e) => setGroupKind(e.target.value)}
                    className="w-full h-8.5 rounded-md border border-border bg-neutral-950 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="general">عمومی (General)</option>
                    <option value="operators">راهبران (Operators)</option>
                    <option value="occ">دیسپاچینگ و OCC</option>
                    <option value="shift">شیفت کاری (Shifts)</option>
                    <option value="station">ایستگاهی (Stations)</option>
                    <option value="custom">سفارشی (Custom)</option>
                  </select>
                </div>

                {selectedMembers.length > 0 && (
                  <p className="text-[9px] text-green-500 font-bold">
                    تعداد {toFa(selectedMembers.length)} عضو به این گروه اضافه خواهند شد.
                  </p>
                )}

                <Button
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !groupName.trim()}
                  className="w-full h-8 text-[11px]"
                >
                  ایجاد و ساخت کانال گروهی
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatView />
    </Suspense>
  )
}
