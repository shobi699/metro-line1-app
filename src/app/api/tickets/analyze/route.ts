import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { analyzeSchema } from '@/lib/zod/tickets'
import { predictTicketPriority } from '@/server/modules/tickets/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = analyzeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, description } = parsed.data
    const analysis = await predictTicketPriority(title, description)

    return NextResponse.json({ data: analysis })
  } catch {
    return NextResponse.json(
      { error: 'خطا در تحلیل متن گزارش خرابی' },
      { status: 500 }
    )
  }
}
