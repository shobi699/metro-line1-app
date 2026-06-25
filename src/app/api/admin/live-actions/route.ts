import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    // 1. Fetch pending users
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 2. Fetch pending swap requests
    const pendingSwapRequests = await prisma.swapRequest.findMany({
      where: { status: 'pending' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            nationalId: true,
          },
        },
        target: {
          select: {
            id: true,
            name: true,
            nationalId: true,
          },
        },
        sourceShift: {
          select: {
            id: true,
            date: true,
            code: true,
          },
        },
        targetShift: {
          select: {
            id: true,
            date: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 3. Fetch pending performance appeals
    const pendingAppeals = await prisma.performanceAppeal.findMany({
      where: { status: 'pending' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            nationalId: true,
          },
        },
        log: {
          include: {
            actionType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Fetch recent audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: {
              select: {
                name: true,
                key: true,
              },
            },
          },
        },
      },
    })

    // 5. Fetch all roles for user approval assignment
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        key: true,
        name: true,
      },
      orderBy: { rank: 'asc' },
    })

    return NextResponse.json({
      data: {
        pendingUsers,
        pendingSwapRequests,
        pendingAppeals,
        recentAuditLogs,
        roles,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error fetching live actions: ' + message },
      { status: 500 },
    )
  }
}
