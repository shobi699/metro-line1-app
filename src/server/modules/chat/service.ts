import { prisma } from '@/server/db'
import type { CreateGroupRoomInput, SendMessageInput } from '@/lib/zod/chat'
import { publishMessage } from '@/server/realtime/bus'

export interface RoomSummary {
  id: string
  name: string
  type: 'direct' | 'group'
  kind: string
  memberCount: number
  unreadCount: number
  lastMessage: {
    body: string | null
    attachmentType: string | null
    senderName: string
    createdAt: Date
  } | null
  updatedAt: Date
}

export interface MessageView {
  id: string
  roomId: string
  senderId: string
  senderName: string
  body: string | null
  attachmentUrl: string | null
  attachmentType: string | null
  pinned: boolean
  priority?: string
  tags?: string[]
  readReceipts?: any
  createdAt: Date
}

async function assertMember(roomId: string, userId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  })
  if (!member) throw new Error('شما عضو این روم نیستید')
  return member
}

/** عنوان نمایشی روم؛ برای روم مستقیم نام طرف مقابل. */
function roomDisplayName(
  room: { name: string; type: string; members: { userId: string; user: { name: string } }[] },
  viewerId: string,
): string {
  if (room.type === 'direct') {
    const other = room.members.find((m) => m.userId !== viewerId)
    return other?.user.name ?? room.name
  }
  return room.name
}

export async function listRoomsForUser(userId: string): Promise<RoomSummary[]> {
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    select: {
      lastReadAt: true,
      room: {
        select: {
          id: true,
          name: true,
          type: true,
          kind: true,
          updatedAt: true,
          members: { select: { userId: true, user: { select: { name: true } } } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              body: true,
              attachmentType: true,
              createdAt: true,
              sender: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  const summaries = await Promise.all(
    memberships.map(async (m) => {
      const room = m.room
      const unreadCount = await prisma.message.count({
        where: {
          roomId: room.id,
          senderId: { not: userId },
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      })
      const last = room.messages[0]
      return {
        id: room.id,
        name: roomDisplayName(room, userId),
        type: room.type as 'direct' | 'group',
        kind: room.kind,
        memberCount: room.members.length,
        unreadCount,
        lastMessage: last
          ? {
              body: last.body,
              attachmentType: last.attachmentType,
              senderName: last.sender.name,
              createdAt: last.createdAt,
            }
          : null,
        updatedAt: room.updatedAt,
      }
    }),
  )

  // مرتب‌سازی بر اساس آخرین فعالیت
  return summaries.sort((a, b) => {
    const at = a.lastMessage?.createdAt.getTime() ?? a.updatedAt.getTime()
    const bt = b.lastMessage?.createdAt.getTime() ?? b.updatedAt.getTime()
    return bt - at
  })
}

export async function getOrCreateDirectRoom(userId: string, otherUserId: string) {
  if (userId === otherUserId) throw new Error('امکان گفت‌وگو با خود وجود ندارد')

  const other = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true },
  })
  if (!other) throw new Error('کاربر یافت نشد')

  // جست‌وجوی روم مستقیم موجود میان دو کاربر
  const existing = await prisma.chatRoom.findFirst({
    where: {
      type: 'direct',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    select: { id: true },
  })
  if (existing) return existing

  return prisma.chatRoom.create({
    data: {
      name: other.name,
      type: 'direct',
      kind: 'custom',
      members: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    select: { id: true },
  })
}

export async function createGroupRoom(data: CreateGroupRoomInput, actorId: string) {
  const memberIds = Array.from(new Set([actorId, ...data.memberIds]))

  const room = await prisma.chatRoom.create({
    data: {
      name: data.name,
      type: 'group',
      kind: data.kind,
      members: {
        create: memberIds.map((userId) => ({
          userId,
          isAdmin: userId === actorId,
        })),
      },
    },
    select: { id: true, name: true, type: true, kind: true },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'ChatRoom',
      entityId: room.id,
      action: 'create',
      after: { name: room.name, kind: room.kind, memberCount: memberIds.length },
    },
  })

  return room
}

export async function listMessages(
  roomId: string,
  userId: string,
  cursor?: string,
  take = 30,
): Promise<{ 
  messages: MessageView[]
  nextCursor: string | null
  settings: { readOnly: boolean; blockAttachments: boolean; maxLength: number }
  reactions: Record<string, Array<{ emoji: string; userId: string; userName: string }>>
  isAdmin: boolean
}> {
  const member = await assertMember(roomId, userId)

  const rows = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      roomId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      attachmentType: true,
      pinned: true,
      priority: true,
      tags: true,
      readReceipts: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  })

  const hasMore = rows.length > take
  const page = hasMore ? rows.slice(0, take) : rows
  const messages: MessageView[] = page
    .map((r) => ({
      id: r.id,
      roomId: r.roomId,
      senderId: r.senderId,
      senderName: r.sender.name,
      body: r.body,
      attachmentUrl: r.attachmentUrl,
      attachmentType: r.attachmentType,
      pinned: r.pinned,
      priority: r.priority,
      tags: r.tags ? r.tags.split(',') : [],
      readReceipts: r.readReceipts ? JSON.parse(JSON.stringify(r.readReceipts)) : null,
      createdAt: r.createdAt,
    }))
    .reverse() // قدیمی → جدید برای نمایش

  const settings = await getRoomSettings(roomId)
  const reactions = await getRoomReactions(roomId)

  return {
    messages,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    settings,
    reactions,
    isAdmin: member.isAdmin,
  }
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  input: SendMessageInput,
): Promise<MessageView> {
  const member = await assertMember(roomId, senderId)

  // Load and check room settings restrictions
  const settings = await getRoomSettings(roomId)
  if (settings.readOnly && !member.isAdmin) {
    throw new Error('فقط مدیر گروه مجاز به ارسال پیام است.')
  }
  if (settings.blockAttachments && (input.attachmentUrl || input.attachmentType) && !member.isAdmin) {
    throw new Error('ارسال فایل در این گفتگو مسدود شده است.')
  }

  const maxLength = settings.maxLength || 1000
  if (input.body && input.body.trim().length > maxLength && !member.isAdmin) {
    throw new Error(`طول پیام نمی‌تواند بیشتر از ${maxLength} کاراکتر باشد.`)
  }

  const message = await prisma.message.create({
    data: {
      roomId,
      senderId,
      body: input.body?.trim() || null,
      attachmentUrl: input.attachmentUrl || null,
      attachmentType: input.attachmentType || null,
      priority: input.priority || 'normal',
      tags: input.tags && input.tags.length > 0 ? input.tags.join(',') : null,
    },
    select: {
      id: true,
      roomId: true,
      senderId: true,
      body: true,
      attachmentUrl: true,
      attachmentType: true,
      pinned: true,
      priority: true,
      tags: true,
      readReceipts: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  })

  // بروزرسانی فعالیت روم و خواندن خود فرستنده
  await prisma.$transaction([
    prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } }),
    prisma.chatMember.update({
      where: { roomId_userId: { roomId, userId: senderId } },
      data: { lastReadAt: message.createdAt },
    }),
  ])

  const view: MessageView = {
    id: message.id,
    roomId: message.roomId,
    senderId: message.senderId,
    senderName: message.sender.name,
    body: message.body,
    attachmentUrl: message.attachmentUrl,
    attachmentType: message.attachmentType,
    pinned: message.pinned,
    priority: message.priority,
    tags: message.tags ? message.tags.split(',') : [],
    readReceipts: message.readReceipts ? JSON.parse(JSON.stringify(message.readReceipts)) : null,
    createdAt: message.createdAt,
  }

  publishMessage({
    roomId,
    message: { ...view, createdAt: view.createdAt.toISOString() },
  })

  return view
}

/**
 * تایید و امضای رسمی رؤیت پیام (رسید قانونی) — بخش ۵.۲ سند tosee.md
 */
export async function acknowledgeMessage(
  messageId: string,
  userId: string,
  context: { device?: string; ipAddress?: string; signature?: string }
): Promise<any> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, roomId: true, readReceipts: true }
  })
  if (!message) throw new Error('پیام یافت نشد')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })
  if (!user) throw new Error('کاربر یافت نشد')

  let currentReceipts: any[] = []
  if (message.readReceipts) {
    try {
      currentReceipts = JSON.parse(JSON.stringify(message.readReceipts)) as any[]
    } catch {
      currentReceipts = []
    }
  }

  // جلوگیری از رسید تکراری
  if (currentReceipts.some((r) => r.userId === userId)) {
    return currentReceipts
  }

  const newReceipt = {
    userId,
    userName: user.name,
    seenAt: new Date().toISOString(),
    device: context.device || 'desktop',
    ipAddress: context.ipAddress || '127.0.0.1',
    signature: context.signature || `SIGN-${userId}-${Date.now().toString(36)}`
  }

  currentReceipts.push(newReceipt)

  await prisma.message.update({
    where: { id: messageId },
    data: { readReceipts: currentReceipts }
  })

  // انتشار به‌روزرسانی برای کاربران متصل
  publishMessage({
    roomId: message.roomId,
    message: {
      id: `receipt-${messageId}-${Date.now()}`,
      roomId: message.roomId,
      senderId: userId,
      senderName: user.name,
      body: JSON.stringify({ messageId, receipts: currentReceipts }),
      attachmentUrl: null,
      attachmentType: 'event/receipt_updated',
      pinned: false,
      createdAt: new Date().toISOString()
    }
  })

  return currentReceipts
}

export async function markRead(roomId: string, userId: string): Promise<void> {
  await assertMember(roomId, userId)
  await prisma.chatMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: new Date() },
  })
}

export async function pinMessage(
  roomId: string,
  messageId: string,
  userId: string,
  pinned: boolean,
): Promise<void> {
  const member = await assertMember(roomId, userId)
  if (!member.isAdmin) throw new Error('فقط مدیر روم می‌تواند پیام پین کند')

  await prisma.message.update({
    where: { id: messageId },
    data: { pinned },
  })
}

// ── Room Settings and Reactions ─────────────────────────

export async function getRoomSettings(roomId: string): Promise<{ readOnly: boolean; blockAttachments: boolean; maxLength: number }> {
  const key = `chat.room.${roomId}.settings`
  const setting = await prisma.setting.findUnique({ where: { key } })
  if (!setting) {
    return {
      readOnly: false,
      blockAttachments: false,
      maxLength: 1000
    }
  }
  try {
    return JSON.parse(setting.value)
  } catch {
    return {
      readOnly: false,
      blockAttachments: false,
      maxLength: 1000
    }
  }
}

export async function updateRoomSettings(
  roomId: string,
  settings: { readOnly: boolean; blockAttachments: boolean; maxLength: number }
): Promise<void> {
  const key = `chat.room.${roomId}.settings`
  const value = JSON.stringify(settings)
  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      label: `تنظیمات چت‌روم ${roomId}`,
      type: 'text',
      value,
      defaultValue: JSON.stringify({ readOnly: false, blockAttachments: false, maxLength: 1000 }),
      category: 'chat'
    },
    update: { value }
  })
}

export async function getRoomReactions(roomId: string): Promise<Record<string, Array<{ emoji: string; userId: string; userName: string }>>> {
  const key = `chat.room.${roomId}.reactions`
  const setting = await prisma.setting.findUnique({ where: { key } })
  if (!setting) return {}
  try {
    return JSON.parse(setting.value)
  } catch {
    return {}
  }
}

export async function saveRoomReactions(
  roomId: string,
  reactions: Record<string, Array<{ emoji: string; userId: string; userName: string }>>
): Promise<void> {
  const key = `chat.room.${roomId}.reactions`
  const value = JSON.stringify(reactions)
  await prisma.setting.upsert({
    where: { key },
    create: {
      key,
      label: `واکنش‌های چت‌روم ${roomId}`,
      type: 'text',
      value,
      defaultValue: '{}',
      category: 'chat'
    },
    update: { value }
  })
}

export async function toggleReaction(
  roomId: string,
  messageId: string,
  userId: string,
  userName: string,
  emoji: string,
): Promise<Record<string, Array<{ emoji: string; userId: string; userName: string }>>> {
  await assertMember(roomId, userId)

  const reactions = await getRoomReactions(roomId)
  if (!reactions[messageId]) {
    reactions[messageId] = []
  }

  const existingIndex = reactions[messageId].findIndex(
    (r) => r.userId === userId && r.emoji === emoji,
  )

  if (existingIndex > -1) {
    reactions[messageId].splice(existingIndex, 1)
  } else {
    reactions[messageId].push({ emoji, userId, userName })
  }

  if (reactions[messageId].length === 0) {
    delete reactions[messageId]
  }

  await saveRoomReactions(roomId, reactions)

  publishMessage({
    roomId,
    message: {
      id: `reaction-${messageId}-${Date.now()}`,
      roomId,
      senderId: userId,
      senderName: userName,
      body: JSON.stringify({ messageId, emoji, activeReactions: reactions[messageId] || [] }),
      attachmentUrl: null,
      attachmentType: 'event/reaction',
      pinned: false,
      createdAt: new Date().toISOString(),
    },
  })

  return reactions
}

export async function changeRoomSettings(
  roomId: string,
  userId: string,
  newSettings: { readOnly: boolean; blockAttachments: boolean; maxLength: number },
): Promise<void> {
  const member = await assertMember(roomId, userId)
  if (!member.isAdmin) {
    throw new Error('فقط مدیر روم می‌تواند تنظیمات را تغییر دهد')
  }

  await updateRoomSettings(roomId, newSettings)

  publishMessage({
    roomId,
    message: {
      id: `settings-${roomId}-${Date.now()}`,
      roomId,
      senderId: userId,
      senderName: 'سیستم',
      body: JSON.stringify(newSettings),
      attachmentUrl: null,
      attachmentType: 'event/settings_updated',
      pinned: false,
      createdAt: new Date().toISOString(),
    },
  })
}
