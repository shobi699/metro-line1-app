import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { attemptPushDelivery, attemptSmsDelivery } from '@/server/modules/notifications/gateway'
import { chatBus } from '@/server/realtime/bus'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const { title, body: msgBody, severity, targetGroup, targetDetail, requireReceipt, continuousAlert } = body

    if (!title || !msgBody) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'عنوان و متن الزامی است' } }, { status: 400 })
    }

    // 1. Resolve targets
    let targetUserIds: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    if (targetGroup === 'all') {
      const activeUsers = await prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      targetUserIds = activeUsers.map((u) => u.id)
    } else if (targetGroup === 'shift' && targetDetail) {
      // Find users with shifts today matching code
      const shifts = await prisma.shift.findMany({
        where: {
          code: targetDetail as any,
          date: { gte: today, lt: tomorrow },
        },
        select: { userId: true },
      })
      targetUserIds = shifts.map((s) => s.userId)
    } else if (targetGroup === 'station' && targetDetail) {
      // Filter by station in customFields
      const allUsers = await prisma.user.findMany({
        where: { status: 'active' },
      })
      targetUserIds = allUsers
        .filter((u) => {
          const cf = u.customFields ? JSON.stringify(u.customFields) : ''
          return cf.includes(targetDetail)
        })
        .map((u) => u.id)
    } else {
      // Fallback: all active users
      const activeUsers = await prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      targetUserIds = activeUsers.map((u) => u.id)
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ data: { success: true, count: 0, message: 'مخاطبی یافت نشد' } })
    }

    // 2. Dispatch to each target user
    for (const targetId of targetUserIds) {
      // Create in-app notification
      const notif = await prisma.notification.create({
        data: {
          userId: targetId,
          title,
          body: msgBody,
          type: (severity as any) || 'info',
        },
      })

      // Queue in-app Outbox log
      await prisma.notificationOutbox.create({
        data: {
          eventKey: 'manual.broadcast',
          userId: targetId,
          channel: 'inapp',
          payload: { notifId: notif.id, title, body: msgBody },
          status: 'sent',
          sentAt: new Date(),
        },
      })

      // Realtime dispatch
      chatBus.emit('notification', {
        userId: targetId,
        notification: {
          id: notif.id,
          type: severity || 'info',
          title,
          body: msgBody,
          isRead: false,
          createdAt: notif.createdAt.toISOString(),
          policy: {
            mutable: !requireReceipt,
            requireReceipt,
            continuous: continuousAlert,
          },
        },
      })

      // Push channel
      const pushOutbox = await prisma.notificationOutbox.create({
        data: {
          eventKey: 'manual.broadcast',
          userId: targetId,
          channel: 'push',
          payload: { title, body: msgBody, severity },
          status: 'queued',
        },
      })
      await attemptPushDelivery(pushOutbox.id, targetId, { title, body: msgBody, severity })

      // SMS channel (only if critical or selected as fallback)
      if (severity === 'critical') {
        const smsOutbox = await prisma.notificationOutbox.create({
          data: {
            eventKey: 'manual.broadcast',
            userId: targetId,
            channel: 'sms',
            payload: { text: `${title}\n${msgBody}` },
            status: 'queued',
          },
        })
        await attemptSmsDelivery(smsOutbox.id, targetId, `${title}\n${msgBody}`)
      }
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'NotificationBroadcast',
        entityId: `broadcast-${Date.now()}`,
        action: 'create',
        after: { title, targetGroup, targetDetail, count: targetUserIds.length },
        reason: 'ارسال اعلان دستی کمپین سراسری',
      },
    })

    return NextResponse.json({
      data: {
        success: true,
        count: targetUserIds.length,
        message: `اعلان با موفقیت به ${targetUserIds.length} نفر ارسال گردید.`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
