import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { pushDrivers, smsDrivers } from '@/server/modules/notifications/gateway'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const pushHealth: Record<string, any> = {}
    for (const [key, driver] of Object.entries(pushDrivers)) {
      pushHealth[key] = await driver.healthCheck()
    }

    const smsHealth: Record<string, any> = {}
    for (const [key, driver] of Object.entries(smsDrivers)) {
      smsHealth[key] = await driver.healthCheck()
    }

    return NextResponse.json({
      data: {
        push: pushHealth,
        sms: smsHealth,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
