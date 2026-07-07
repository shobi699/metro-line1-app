import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { getPostAckStats } from '@/server/modules/content/service'
import { notifyEvent } from '@/server/modules/notifications/gateway'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { id } = await params

  try {
    const stats = await getPostAckStats(id)
    const remainingUserIds = stats.remainingList.map((u) => u.userId)

    if (remainingUserIds.length === 0) {
      return NextResponse.json({ data: { count: 0, message: 'همه پرسنل این اطلاعیه را تایید کرده‌اند.' } })
    }

    // Send warning/remind notification to all remaining users in bulk or individually
    // Using our Notification Gateway:
    for (const userId of remainingUserIds) {
      await notifyEvent('announcement.reminded', [userId], {
        title: stats.title,
        id,
      })
    }

    return NextResponse.json({ data: { success: true, count: remainingUserIds.length } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
