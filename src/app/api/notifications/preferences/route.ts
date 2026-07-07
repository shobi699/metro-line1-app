import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const preferenceSchema = z.object({
  channels: z.record(z.string(), z.array(z.string())),
  quietHours: z.object({
    from: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    to: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }).nullable(),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    })

    if (!pref) {
      // Return default preferences
      return NextResponse.json({
        data: {
          channels: {
            'roster.published': ['inapp', 'push'],
            'sos.triggered': ['inapp', 'push', 'sms'],
            'bulletin.published': ['inapp', 'push'],
            'ticket.created': ['inapp', 'push'],
            'shift.swap': ['inapp', 'push'],
          },
          quietHours: { from: '23:00', to: '07:00' },
        },
      })
    }

    return NextResponse.json({ data: pref })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = preferenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'اطلاعات نامعتبر است' } }, { status: 400 })
    }

    const { channels, quietHours } = parsed.data

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        channels: channels as any,
        quietHours: quietHours as any,
      },
      create: {
        userId: user.id,
        channels: channels as any,
        quietHours: quietHours as any,
      },
    })

    return NextResponse.json({ data: pref })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
