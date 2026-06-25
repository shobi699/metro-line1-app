import { prisma } from '@/server/db'

export interface NotificationData {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: Date
}

export async function getUserNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<NotificationData[]> {
  const where: Record<string, unknown> = { userId }
  if (options?.unreadOnly) where.isRead = false

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      isRead: true,
      createdAt: true,
    },
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  })
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export async function createNotification(data: {
  userId: string
  type?: string
  title: string
  body?: string
  link?: string
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: (data.type as 'info' | 'warning' | 'urgent' | 'system') ?? 'info',
      title: data.title,
      body: data.body,
      link: data.link,
    },
  })
}

export async function createBulkNotifications(
  userIds: string[],
  data: {
    type?: string
    title: string
    body?: string
    link?: string
  },
): Promise<void> {
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: (data.type as 'info' | 'warning' | 'urgent' | 'system') ?? 'info',
      title: data.title,
      body: data.body,
      link: data.link,
    })),
  })
}
