import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { attemptPushDelivery, attemptSmsDelivery } from '@/server/modules/notifications/gateway'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const eventKey = searchParams.get('eventKey')
  const channel = searchParams.get('channel')
  const limit = Number(searchParams.get('limit') ?? '50')
  const offset = Number(searchParams.get('offset') ?? '0')

  try {
    const where: Record<string, any> = {}
    if (status) where.status = status
    if (eventKey) where.eventKey = eventKey
    if (channel) where.channel = channel

    // 1. Fetch outbox items with user name
    const [outbox, totalCount] = await Promise.all([
      prisma.notificationOutbox.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              name: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
      prisma.notificationOutbox.count({ where }),
    ])

    // 2. Fetch SMS quota analytics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const smsCountToday = await prisma.notificationOutbox.count({
      where: {
        channel: 'sms',
        status: 'sent',
        createdAt: { gte: today },
      },
    })

    return NextResponse.json({
      data: {
        outbox,
        totalCount,
        smsCountToday,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const { outboxId } = body

    if (!outboxId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'شناسه لاگ الزامی است' } }, { status: 400 })
    }

    const outbox = await prisma.notificationOutbox.findUnique({
      where: { id: outboxId },
    })

    if (!outbox) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'رکورد خروجی یافت نشد' } }, { status: 404 })
    }

    // Increment attempts
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        attempts: { increment: 1 },
        status: 'queued',
      },
    })

    const payload = outbox.payload as Record<string, any>

    if (outbox.channel === 'push') {
      await attemptPushDelivery(outbox.id, outbox.userId, {
        title: payload?.title || 'بازارسال',
        body: payload?.body || '',
        link: payload?.link,
        severity: payload?.severity,
      })
    } else if (outbox.channel === 'sms') {
      await attemptSmsDelivery(outbox.id, outbox.userId, payload?.text || '')
    }

    const updated = await prisma.notificationOutbox.findUnique({
      where: { id: outboxId },
      include: {
        user: {
          select: {
            name: true,
            role: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
