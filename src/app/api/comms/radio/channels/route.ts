import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getRadioChannels } from '@/server/modules/radio/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const channels = await getRadioChannels()
    return NextResponse.json({ data: channels })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت کانال‌ها' } },
      { status: 500 }
    )
  }
}
