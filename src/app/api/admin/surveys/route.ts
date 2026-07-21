import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { createSurvey, listAllSurveysAdmin } from '@/server/modules/surveys'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const surveys = await listAllSurveysAdmin()
    return NextResponse.json({ data: surveys })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت لیست' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const {
      key,
      title,
      description,
      schema,
      audience,
      isAnonymous,
      isMandatory,
      opensAt,
      closesAt,
      remindDays,
      quotaPercent,
    } = body

    if (!key || !title || !schema) {
      return NextResponse.json(
        { error: 'پر کردن کلید یکتا، عنوان و سوالات الزامی است' },
        { status: 400 },
      )
    }

    const survey = await createSurvey({
      key,
      title,
      description,
      schema,
      audience,
      isAnonymous,
      isMandatory,
      opensAt: opensAt ? new Date(opensAt) : undefined,
      closesAt: closesAt ? new Date(closesAt) : undefined,
      remindDays,
      quotaPercent,
      createdBy: user.id,
    })

    return NextResponse.json({ data: survey }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ایجاد پیمایش' }, { status: 400 })
  }
}
