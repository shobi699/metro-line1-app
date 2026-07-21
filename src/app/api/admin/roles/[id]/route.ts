import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { updateRoleSchema } from '@/lib/zod/admin'

// PATCH /api/admin/roles/[id] - ویرایش نقش و دسترسی‌های آن
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Only super_admin can update role configurations
  const roleErr = await requireRole(sessionUser, 'super_admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: roleId } = await params

  try {
    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updates = parsed.data

    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!targetRole) {
      return NextResponse.json(
        { error: 'نقش یافت نشد' },
        { status: 404 }
      )
    }

    // Prepare update data
    const dataToUpdate: Record<string, unknown> = {}
    if (updates.title) dataToUpdate.title = updates.title
    if (updates.rank !== undefined) dataToUpdate.rank = updates.rank
    if (updates.permissions) dataToUpdate.permissions = JSON.stringify(updates.permissions)

    // Capture state before change
    const beforeState = {
      title: targetRole.title,
      rank: targetRole.rank,
      permissions: typeof targetRole.permissions === 'string'
        ? JSON.parse(targetRole.permissions)
        : targetRole.permissions,
    }

    const [updatedRole] = await prisma.$transaction([
      prisma.role.update({
        where: { id: roleId },
        data: dataToUpdate,
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'Role',
          entityId: roleId,
          action: 'update',
          before: beforeState,
          after: updates,
        },
      }),
    ])

    return NextResponse.json({ data: updatedRole, message: 'نقش با موفقیت بروزرسانی شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در بروزرسانی نقش: ' + message },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/roles/[id] - حذف نقش
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'super_admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: roleId } = await params

  try {
    const targetRole = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!targetRole) {
      return NextResponse.json(
        { error: 'نقش یافت نشد' },
        { status: 404 }
      )
    }

    if (targetRole.isSystem) {
      return NextResponse.json(
        { error: 'امکان حذف نقش‌های سیستمی اصلی وجود ندارد' },
        { status: 400 }
      )
    }

    // Check if any user is using this role
    const usersCount = await prisma.user.count({
      where: { roleId },
    })

    if (usersCount > 0) {
      return NextResponse.json(
        { error: 'این نقش دارای کاربر فعال است و امکان حذف آن وجود ندارد' },
        { status: 400 }
      )
    }

    const beforeState = {
      key: targetRole.key,
      title: targetRole.title,
      rank: targetRole.rank,
      permissions: typeof targetRole.permissions === 'string'
        ? JSON.parse(targetRole.permissions)
        : targetRole.permissions,
    }

    await prisma.$transaction([
      prisma.role.delete({
        where: { id: roleId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'Role',
          entityId: roleId,
          action: 'delete',
          before: beforeState,
          after: undefined,
        },
      }),
    ])

    return NextResponse.json({ message: 'نقش با موفقیت حذف شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در حذف نقش: ' + message },
      { status: 500 }
    )
  }
}
