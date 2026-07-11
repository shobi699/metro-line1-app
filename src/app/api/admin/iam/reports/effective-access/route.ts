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
    const assignments = await prisma.roleAssignment.findMany({
      include: {
        user: { select: { id: true, personnelCode: true, name: true } },
        role: { select: { id: true, title: true, key: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    const data = assignments.map(a => ({
      id: a.id,
      personnelCode: a.user.personnelCode,
      name: a.user.name,
      roleTitle: a.role.title,
      scopeType: a.scopeType,
      scopeKey: a.scopeKey,
      validFrom: a.validFrom,
      validTo: a.validTo,
      reason: a.reason
    }))

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
