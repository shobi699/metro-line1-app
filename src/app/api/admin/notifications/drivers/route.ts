import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'notification_active_push_driver',
            'notification_active_sms_driver',
            'notification_push_fallback_chain',
            'notification_sms_fallback_chain',
            'notification_pushe_api_key',
            'notification_najva_api_key',
            'notification_kavenegar_api_key',
          ],
        },
      },
    })

    const data: Record<string, string> = {}
    settings.forEach((s) => {
      data[s.key] = s.value
    })

    // Fallbacks if not set in DB
    return NextResponse.json({
      data: {
        activePushDriver: data['notification_active_push_driver'] ? JSON.parse(data['notification_active_push_driver']) : 'pushe',
        activeSmsDriver: data['notification_active_sms_driver'] ? JSON.parse(data['notification_active_sms_driver']) : 'kavenegar',
        pushFallbackChain: data['notification_push_fallback_chain']
          ? JSON.parse(data['notification_push_fallback_chain'])
          : ['pushe', 'najva', 'selfhosted'],
        smsFallbackChain: data['notification_sms_fallback_chain']
          ? JSON.parse(data['notification_sms_fallback_chain'])
          : ['kavenegar', 'melipayamak', 'smsir'],
        pusheApiKey: data['notification_pushe_api_key'] ? JSON.parse(data['notification_pushe_api_key']) : '',
        najvaApiKey: data['notification_najva_api_key'] ? JSON.parse(data['notification_najva_api_key']) : '',
        kavenegarApiKey: data['notification_kavenegar_api_key'] ? JSON.parse(data['notification_kavenegar_api_key']) : '',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const keys = [
      'activePushDriver',
      'activeSmsDriver',
      'pushFallbackChain',
      'smsFallbackChain',
      'pusheApiKey',
      'najvaApiKey',
      'kavenegarApiKey',
    ]

    for (const key of keys) {
      if (body[key] !== undefined) {
        const dbKey = `notification_${key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())}`
        await prisma.setting.upsert({
          where: { key: dbKey },
          update: { value: JSON.stringify(body[key]) },
          create: {
            key: dbKey,
            label: `تنظیمات اعلان - ${key}`,
            value: JSON.stringify(body[key]),
            defaultValue: JSON.stringify(body[key]),
            category: 'notifications',
            type: 'text',
          },
        })
      }
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'NotificationSettings',
        entityId: 'global',
        action: 'update',
        after: body,
        reason: 'تغییر درایورها و تنظیمات سامانه اعلان',
      },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
