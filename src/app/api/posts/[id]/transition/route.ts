import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { transitionPostStatusSchema } from '@/lib/zod/content'
import { transitionPostStatus } from '@/server/modules/content/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const body = await request.json()
  const parsed = transitionPostStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  try {
    const post = await transitionPostStatus(id, parsed.data.status, user.id)
    return NextResponse.json({ data: post })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
