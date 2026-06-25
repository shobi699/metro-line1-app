import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createFeedback, listFeedback } from '@/server/modules/feedback/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')

  const result = await listFeedback({ status, page, pageSize })
  return NextResponse.json({ data: result })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { type, title, body: feedbackBody, isAnonymous } = body

  if (!type || !title || !feedbackBody) {
    return NextResponse.json(
      { error: 'فیلدهای الزامی را پر کنید' },
      { status: 400 },
    )
  }

  const feedback = await createFeedback({
    userId: isAnonymous ? undefined : user.id,
    type,
    title,
    body: feedbackBody,
    isAnonymous,
  })

  return NextResponse.json({ data: feedback }, { status: 201 })
}
