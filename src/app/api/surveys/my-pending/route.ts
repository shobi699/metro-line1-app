import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { listActiveSurveys } from '@/server/modules/surveys'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const surveys = await listActiveSurveys(user.id, user.roleKey)
    return NextResponse.json({ data: surveys })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت لیست' }, { status: 500 })
  }
}
