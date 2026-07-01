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

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params // assignmentId

    const assignment = await prisma.tripAssignment.findUnique({
      where: { id }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'تخصیص یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.tripAssignment.update({
      where: { id },
      data: {
        disputed: false,
        confirmedById: user.id,
        confirmedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: id,
        action: 'update',
        before: { disputed: assignment.disputed, confirmedById: assignment.confirmedById },
        after: { disputed: false, confirmedById: user.id }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'مغایرت با موفقیت برطرف و تایید شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در رفع مغایرت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
