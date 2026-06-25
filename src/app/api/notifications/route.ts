import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/server/modules/notifications/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const limit = Number(searchParams.get('limit') ?? '50')

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, { unreadOnly, limit }),
    getUnreadCount(user.id),
  ])

  return NextResponse.json({ data: { notifications, unreadCount } })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { action, notificationId } = body

  if (action === 'markRead' && notificationId) {
    await markAsRead(notificationId, user.id)
  } else if (action === 'markAllRead') {
    await markAllAsRead(user.id)
  } else {
    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
  }

  return NextResponse.json({ data: { success: true } })
}
