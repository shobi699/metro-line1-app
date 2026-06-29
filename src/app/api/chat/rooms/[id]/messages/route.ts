import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { sendMessageSchema } from '@/lib/zod/chat'
import { listMessages, sendMessage } from '@/server/modules/chat/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor') ?? undefined

  try {
    const result = await listMessages(id, user.id, cursor)
    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  const body = await request.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  try {
    const message = await sendMessage(id, user.id, parsed.data)
    return NextResponse.json({ data: message }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
