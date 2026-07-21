import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:reports') && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: 'دسترسی مشاهده گزارشات را ندارید' }, { status: 403 })
  }

  try {
    const now = new Date()

    // Expired temporary roles
    const expiredAssignments = await prisma.roleAssignment.findMany({
      where: {
        validTo: { lt: now }
      },
      include: {
        user: { select: { id: true, personnelCode: true, name: true } },
        role: { select: { id: true, title: true } }
      }
    })

    // Suspended users
    const suspendedUsers = await prisma.user.findMany({
      where: { status: 'suspended' },
      select: { id: true, personnelCode: true, name: true, updatedAt: true }
    })

    return NextResponse.json({
      data: {
        expiredAssignments: expiredAssignments.map(a => ({
          id: a.id,
          personnelCode: a.user.personnelCode,
          name: a.user.name,
          roleTitle: a.role.title,
          validTo: a.validTo
        })),
        suspendedUsers
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
