import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { notificationId } = await request.json()
    if (!notificationId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'شناسه اعلان الزامی است' } }, { status: 400 })
    }

    const notif = await prisma.notification.findUnique({ where: { id: notificationId } })
    if (!notif || notif.userId !== user.id) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'اعلان یافت نشد' } }, { status: 404 })
    }

    // 1. Mark notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    // 2. Cancel any pending unseen SMS backup for this user
    await prisma.notificationOutbox.updateMany({
      where: {
        userId: user.id,
        channel: 'sms',
        status: 'pending_seen_sms',
      },
      data: {
        status: 'delivered',
        seenAt: new Date(),
      },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
