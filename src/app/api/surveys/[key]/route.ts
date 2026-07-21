import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getSurveyByKey } from '@/server/modules/surveys'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params
  const { key } = resolvedParams

  try {
    const result = await getSurveyByKey(key, user.id)
    if (!result) {
      return NextResponse.json({ error: 'پیمایش یافت نشد' }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت پیمایش' }, { status: 500 })
  }
}
