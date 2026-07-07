import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { voteIdea } from '@/server/modules/feedback/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params

  try {
    await voteIdea(resolvedParams.id, user.id)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت رای ایده' } },
      { status: 500 }
    )
  }
}
