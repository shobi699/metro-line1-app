import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
  reviewNote: z.string().optional(),
  amount: z.number().optional().nullable(),
  calculatedAmount: z.number().optional().nullable()
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires admin role
  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { status, reviewNote, amount, calculatedAmount } = parsed.data

    const { id } = await params
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewNote,
        amount,
        calculatedAmount,
        reviewedById: user.id,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
