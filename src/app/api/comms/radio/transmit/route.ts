import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { logTransmission } from '@/server/modules/radio/service'
import { prisma } from '@/server/db'
import { z } from 'zod'

const transmitSchema = z.object({
  channelId: z.string(),
  message: z.string(),
  kind: z.enum(['VOICE_NOTE', 'TEXT', 'SYSTEM', 'EMERGENCY']).optional(),
}).strict()

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = transmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'داده‌های ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    })

    const log = await logTransmission({
      channelId: parsed.data.channelId,
      senderId: user.id,
      senderName: dbUser?.name || 'کاربر سیستم',
      message: parsed.data.message,
      kind: parsed.data.kind,
    })

    return NextResponse.json({ data: log })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ارسال پیام رادیویی' } },
      { status: 500 }
    )
  }
}
