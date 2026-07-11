import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { createTicketSchema } from '@/lib/zod/safety'
import { createTicket, listTickets, getTicketStats } from '@/server/modules/tickets/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? undefined

  const tickets = await listTickets(user.id, user.roleKey, status)
  const stats = await getTicketStats()

  return NextResponse.json({ data: { tickets, stats } })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const parsed = createTicketSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const ticket = await createTicket(parsed.data, user.id)
  return NextResponse.json({ data: ticket }, { status: 201 })
}
