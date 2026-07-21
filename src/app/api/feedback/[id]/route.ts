import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getFeedbackDetail } from '@/server/modules/feedback/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params
  const { searchParams } = new URL(request.url)
  const anonToken = searchParams.get('anonToken') ?? undefined

  try {
    const feedback = await getFeedbackDetail(resolvedParams.id, user.id, anonToken)
    return NextResponse.json({ data: feedback })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت جزئیات بازخورد' } },
      { status: 403 }
    )
  }
}
