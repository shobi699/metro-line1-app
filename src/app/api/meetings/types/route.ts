import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getMeetingTypes } from '@/server/modules/meetings/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const types = await getMeetingTypes()
    return NextResponse.json({ data: types })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت انواع جلسات' } },
      { status: 500 }
    )
  }
}
