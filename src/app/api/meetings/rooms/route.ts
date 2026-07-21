import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getMeetingRooms } from '@/server/modules/meetings/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const rooms = await getMeetingRooms()
    return NextResponse.json({ data: rooms })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت اتاق‌های جلسات' } },
      { status: 500 }
    )
  }
}
