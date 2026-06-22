import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { updateTicketStatusSchema } from '@/server/dto/safety'
import { updateTicketStatus } from '@/server/modules/tickets/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const body = await request.json()
  const parsed = updateTicketStatusSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  try {
    const ticket = await updateTicketStatus(id, parsed.data, user.id)
    return NextResponse.json({ data: ticket })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
