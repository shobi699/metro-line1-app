import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:assign')) {
    return NextResponse.json({ error: 'عدم دسترسی برای انتساب نقش' }, { status: 403 })
  }

  const { id: targetUserId } = await params
  
  try {
    const { roleId, scopeType, scopeKey, validTo, reason } = await request.json()
    
    // Check if role exists
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      return NextResponse.json({ error: 'نقش یافت نشد' }, { status: 404 })
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    // Create RoleAssignment
    const assignment = await prisma.roleAssignment.create({
      data: {
        userId: targetUserId,
        roleId,
        scopeType,
        scopeKey,
        validTo,
        reason,
        grantedBy: user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'RoleAssignment',
        entityId: assignment.id,
        action: 'create',
        after: assignment as any
      }
    })

    return NextResponse.json({ data: assignment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
