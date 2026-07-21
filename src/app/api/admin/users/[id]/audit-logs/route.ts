import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

// GET /api/admin/users/[id]/audit-logs - دریافت لاگ‌های ممیزی مربوط به یک کاربر خاص
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: userId } = await params

  try {
    // Fetch logs where the user is either the actor OR the target entity of the action
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: userId },
          {
            AND: [
              { entity: 'User' },
              { entityId: userId },
            ],
          },
        ],
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            personnelCode: true,
            role: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30, // Limit to recent 30 activities for performance
    })

    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `خطا در دریافت لاگ‌های ممیزی کاربر: ${message}` },
      { status: 500 }
    )
  }
}
