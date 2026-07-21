import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'
import { z } from 'zod'

const requestSchema = z.object({
  userId: z.string(),
  toUnitId: z.string(),
  effectiveDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  reason: z.string().optional()
})

const approveSchema = z.object({
  status: z.enum(['approved', 'rejected'])
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!user.homeUnitId) {
    return NextResponse.json({ error: 'شما به هیچ واحد سازمانی متصل نیستید' }, { status: 403 })
  }

  try {
    // Managers can see transfer requests where their unit is either the source or destination
    const requests = await prisma.transferRequest.findMany({
      where: {
        OR: [
          { fromUnitId: user.homeUnitId },
          { toUnitId: user.homeUnitId }
        ]
      },
      include: {
        targetUser: { select: { name: true, personnelCode: true } },
        requestedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ data: requests })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { userId, toUnitId, effectiveDate, reason } = parsed.data

    // Get target user to find current home unit
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const req = await prisma.transferRequest.create({
      data: {
        userId,
        fromUnitId: targetUser.homeUnitId,
        toUnitId,
        effectiveDate: new Date(effectiveDate),
        reason,
        requestedById: user.id
      }
    })

    return NextResponse.json({ data: req })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
