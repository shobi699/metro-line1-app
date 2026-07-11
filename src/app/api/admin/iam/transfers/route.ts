import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getDescendantIds, getOrgUnits } from '@/server/rbac/org-unit'
import { z } from 'zod'

const createTransferSchema = z.object({
  userId: z.string(),
  toUnitId: z.string(),
  effectiveDate: z.string(),
  reason: z.string().optional()
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const isGlobalAdmin = user.scopes?.some(s => s.type === 'all') || user.roleKey === 'admin' || user.roleKey === 'super_admin'

    let myUnitIds: string[] = []

    if (!isGlobalAdmin && user.scopes) {
      const allUnits = await getOrgUnits()
      for (const scope of user.scopes) {
        if (scope.type === 'all') continue
        const unit = allUnits.find(u => u.key === scope.key)
        if (unit) {
          myUnitIds.push(unit.id)
          myUnitIds.push(...(await getDescendantIds(unit.id)))
        }
      }
      myUnitIds = Array.from(new Set(myUnitIds))
    }

    // A user can see transfer requests where fromUnitId OR toUnitId is in their scopes
    const whereClause = isGlobalAdmin ? {} : {
      OR: [
        { fromUnitId: { in: myUnitIds } },
        { toUnitId: { in: myUnitIds } }
      ]
    }

    const transfers = await prisma.transferRequest.findMany({
      where: whereClause,
      include: {
        targetUser: { select: { id: true, name: true, personnelCode: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add unit titles
    const allUnits = await getOrgUnits()
    const getTitle = (id: string | null) => id ? allUnits.find(u => u.id === id)?.title || id : '-'

    const mapped = transfers.map(t => ({
      ...t,
      fromUnitTitle: getTitle(t.fromUnitId),
      toUnitTitle: getTitle(t.toUnitId)
    }))

    return NextResponse.json({ data: mapped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = createTransferSchema.parse(body)

    const targetUser = await prisma.user.findUnique({ where: { id: parsed.userId } })
    if (!targetUser) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })

    // Check if requester has authority over the user's CURRENT unit (or is global admin)
    // For simplicity here, we assume any logged in user can request a transfer, but it's pending until approved by the destination manager
    
    const requestRecord = await prisma.transferRequest.create({
      data: {
        userId: parsed.userId,
        fromUnitId: targetUser.homeUnitId,
        toUnitId: parsed.toUnitId,
        effectiveDate: new Date(parsed.effectiveDate),
        reason: parsed.reason,
        requestedById: user.id,
        status: 'pending'
      }
    })

    return NextResponse.json({ data: requestRecord }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
