import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getCourseDetail } from '@/server/modules/learning/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params

  try {
    const course = await getCourseDetail(resolvedParams.id, user.id)
    return NextResponse.json({ data: course })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت جزئیات دوره' } },
      { status: 500 }
    )
  }
}
