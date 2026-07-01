import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin') // Allow admin (supervisor)
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params // assignmentId
    const body = await request.json()
    const { matchedUserId, rawName } = body

    const assignment = await prisma.tripAssignment.findUnique({
      where: { id }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'تخصیص یافت نشد' }, { status: 404 })
    }

    let userToMatch = null
    if (matchedUserId) {
      userToMatch = await prisma.user.findUnique({
        where: { id: matchedUserId },
        select: { id: true, name: true, nationalId: true }
      })
    }

    const before = {
      matchedUserId: assignment.matchedUserId,
      rawName: assignment.rawName,
      matchStatus: assignment.matchStatus
    }

    const updated = await prisma.tripAssignment.update({
      where: { id },
      data: {
        matchedUserId: matchedUserId || null,
        personnelNo: userToMatch?.nationalId || null,
        rawName: rawName || userToMatch?.name || assignment.rawName,
        matchStatus: matchedUserId ? 'MANUAL_MATCHED' : 'UNMATCHED',
        confirmedById: user.id,
        confirmedAt: new Date(),
        disputed: false
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: id,
        action: 'update',
        before,
        after: {
          matchedUserId: updated.matchedUserId,
          rawName: updated.rawName,
          matchStatus: updated.matchStatus
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تغییر تخصیص با موفقیت انجام شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در تخصیص مجدد راننده: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
