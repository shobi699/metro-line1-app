import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { submitSurveyResponse } from '@/server/modules/surveys'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params
  const { key } = resolvedParams

  try {
    const body = await request.json()
    const { answers, durationSec } = body

    if (!answers) {
      return NextResponse.json({ error: 'پاسخ‌ها الزامی است' }, { status: 400 })
    }

    const result = await submitSurveyResponse(key, user.id, answers, durationSec)
    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ثبت پاسخ' }, { status: 400 })
  }
}
