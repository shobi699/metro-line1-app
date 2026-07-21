import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { getSurveyAnalytics } from '@/server/modules/surveys'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const resolvedParams = await params
  const { id } = resolvedParams

  try {
    const analytics = await getSurveyAnalytics(id)
    if (!analytics) {
      return NextResponse.json({ error: 'پیمایش یافت نشد' }, { status: 404 })
    }
    return NextResponse.json({ data: analytics })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت نتایج' }, { status: 500 })
  }
}
