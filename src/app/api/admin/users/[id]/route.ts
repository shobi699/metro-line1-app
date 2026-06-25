import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد').optional(),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  email: z
    .string()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  roleId: z.string().optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد').optional(),
})

// PATCH /api/admin/users/[id] - ویرایش اطلاعات کاربر
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: userId } = await params

  try {
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { password, ...dataToUpdate } = parsed.data

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    // Automatically map roleId from post if post is set in customFields
    if (dataToUpdate.customFields && 'post' in dataToUpdate.customFields) {
      const postVal = dataToUpdate.customFields.post
      if (postVal && typeof postVal === 'string') {
        const { POST_TO_ROLE_KEY } = await import('@/server/rbac/permissions')
        const mappedRoleKey = POST_TO_ROLE_KEY[postVal]
        if (mappedRoleKey) {
          const matchedRole = await prisma.role.findUnique({
            where: { key: mappedRoleKey },
          })
          if (matchedRole) {
            dataToUpdate.roleId = matchedRole.id
          }
        }
      }
    }

    // Check if role exists if updating roleId
    if (dataToUpdate.roleId) {
      const roleExists = await prisma.role.findUnique({
        where: { id: dataToUpdate.roleId },
      })
      if (!roleExists) {
        return NextResponse.json(
          { error: 'نقش مشخص شده معتبر نیست' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    const prismaData: any = { ...dataToUpdate }
    if (password) {
      const { hashPassword } = await import('@/server/auth/password')
      prismaData.passwordHash = await hashPassword(password)
    }

    // Capture state before change for Audit Log
    const beforeState = {
      name: targetUser.name,
      phone: targetUser.phone,
      email: targetUser.email,
      roleId: targetUser.roleId,
      status: targetUser.status,
      customFields: targetUser.customFields,
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: prismaData,
        select: {
          id: true,
          nationalId: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          roleId: true,
          customFields: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'User',
          entityId: userId,
          action: 'update',
          before: beforeState,
          after: {
            ...dataToUpdate,
            passwordChanged: !!password,
          } as any,
        },
      }),
    ])

    return NextResponse.json({ data: updatedUser, message: 'اطلاعات کاربر با موفقیت بروزرسانی شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در بروزرسانی اطلاعات کاربر: ' + message },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - حذف کاربر
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Only super_admin can delete users for security reasons
  const roleErr = requireRole(sessionUser, 'super_admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: userId } = await params

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (targetUser.id === sessionUser.id) {
      return NextResponse.json(
        { error: 'شما نمی‌توانید حساب کاربری خودتان را حذف کنید' },
        { status: 400 }
      )
    }

    const beforeState = {
      nationalId: targetUser.nationalId,
      name: targetUser.name,
      phone: targetUser.phone,
      email: targetUser.email,
      roleId: targetUser.roleId,
      status: targetUser.status,
    }

    await prisma.$transaction([
      prisma.user.delete({
        where: { id: userId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'User',
          entityId: userId,
          action: 'delete',
          before: beforeState,
          after: undefined,
        },
      }),
    ])

    return NextResponse.json({ message: 'کاربر با موفقیت حذف شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در حذف کاربر: ' + message },
      { status: 500 }
    )
  }
}
