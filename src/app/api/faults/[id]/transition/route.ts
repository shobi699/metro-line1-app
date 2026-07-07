import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { transitionSchema } from '@/lib/zod/faults'
import { executeWorkflowTransition } from '@/server/modules/faults/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  try {
    const body = await request.json()
    const parsed = transitionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { action, note, payload } = parsed.data

    const updated = await executeWorkflowTransition(
      id,
      action,
      user.id,
      user.roleKey,
      user.rank,
      payload
    )

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در اجرای فرآیند گردشکار' }, { status: 400 })
  }
}
