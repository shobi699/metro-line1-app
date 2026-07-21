import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { updateSettings, getSettings } from '@/server/modules/settings/service'
import { z } from 'zod'

const configUpdateSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  )
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const allSettings = await getSettings()
  const meetingSettings = allSettings.filter(s => s.category === 'meetings')
  return NextResponse.json({ data: meetingSettings })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = configUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'پارامترهای ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    // Filter updates to ensure only meetings category keys are updated
    const allowedKeys = [
      'meetings.autoDeductShifts',
      'meetings.lateCancelHours',
      'meetings.maxLateCancellations',
      'meetings.banDurationDays',
    ]

    const filteredUpdates = parsed.data.updates.filter(u => allowedKeys.includes(u.key))

    if (filteredUpdates.length === 0) {
      return NextResponse.json({ error: { message: 'هیچ کلید تنظیمی معتبری ارسال نشده است' } }, { status: 400 })
    }

    await updateSettings(filteredUpdates, user.id)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در بروزرسانی تنظیمات' } }, { status: 500 })
  }
}
