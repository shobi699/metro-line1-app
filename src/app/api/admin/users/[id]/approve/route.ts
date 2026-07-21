import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { approveUserSchema } from '@/lib/zod/auth'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const body = await request.json()
  const parsed = approveUserSchema.safeParse({ ...body, userId: id })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { userId, roleKey } = parsed.data

  const targetUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!targetUser) {
    return NextResponse.json(
      { error: 'کاربر یافت نشد' },
      { status: 404 },
    )
  }

  if (targetUser.status !== 'pending') {
    return NextResponse.json(
      { error: 'این کاربر قبلاً بررسی شده است' },
      { status: 409 },
    )
  }

  const role = await prisma.role.findUnique({ where: { key: roleKey } })
  if (!role) {
    return NextResponse.json({ error: 'نقش نامعتبر است' }, { status: 400 })
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { status: 'active', roleId: role.id },
      select: { id: true, personnelCode: true, name: true, status: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: userId,
        action: 'update',
        before: { status: 'pending', roleId: targetUser.roleId },
        after: { status: 'active', roleId: role.id },
      },
    }),
  ])

  return NextResponse.json({
    message: 'کاربر با موفقیت تأیید شد',
    user: updatedUser,
  })
}
