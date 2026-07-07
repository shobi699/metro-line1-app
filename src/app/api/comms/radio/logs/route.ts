import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getRadioLogs } from '@/server/modules/radio/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const limitStr = searchParams.get('limit')
  const limit = limitStr ? parseInt(limitStr, 10) : 50

  if (!channelId) {
    return NextResponse.json(
      { error: { message: 'شناسه کانال الزامی است' } },
      { status: 400 }
    )
  }

  try {
    const logs = await getRadioLogs(channelId, limit)
    return NextResponse.json({ data: logs })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت لاگ‌ها' } },
      { status: 500 }
    )
  }
}
