import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getRadioPhrases } from '@/server/modules/radio/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const roleKey = user.roleKey
    const phrases = await getRadioPhrases(roleKey)
    return NextResponse.json({ data: phrases })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت عبارات استاندارد' } },
      { status: 500 }
    )
  }
}
