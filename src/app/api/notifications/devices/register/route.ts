import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const registerSchema = z.object({
  platform: z.enum(['android', 'ios_pwa', 'web']),
  driver: z.enum(['pushe', 'najva', 'selfhosted']),
  token: z.string().min(1),
  deviceName: z.string().optional(),
})

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'اطلاعات نامعتبر است' } }, { status: 400 })
    }

    const { platform, driver, token, deviceName } = parsed.data

    // Upsert the device token
    const device = await prisma.notificationDevice.upsert({
      where: {
        driver_token: { driver, token },
      },
      update: {
        userId: user.id,
        platform,
        deviceName,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId: user.id,
        platform,
        driver,
        token,
        deviceName,
        isActive: true,
      },
    })

    return NextResponse.json({ data: device })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
