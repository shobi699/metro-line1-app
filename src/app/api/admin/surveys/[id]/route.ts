import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { updateSurveyStatus } from '@/server/modules/surveys'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const resolvedParams = await params
  const { id } = resolvedParams

  try {
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'وضعیت جدید الزامی است' }, { status: 400 })
    }

    const survey = await updateSurveyStatus(id, status, user.id)
    return NextResponse.json({ data: survey })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در بروزرسانی پیمایش' }, { status: 400 })
  }
}
