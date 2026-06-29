import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { notificationSettingsSchema } from '@/lib/zod/profile'

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = notificationSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { circulars, chat, shifts } = parsed.data

    // Fetch latest user data to merge customFields safely
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { customFields: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const currentCustomFields = (currentUser.customFields as Record<string, unknown>) || {}
    
    // Save under the `notificationSettings` key inside customFields JSON
    const updatedCustomFields = {
      ...currentCustomFields,
      notificationSettings: {
        circulars,
        chat,
        shifts,
      },
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        customFields: updatedCustomFields,
      },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        roleId: true,
        status: true,
        customFields: true,
      },
    })

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'update',
        after: {
          reason: 'Updated notification settings',
          notificationSettings: updatedCustomFields.notificationSettings,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'تنظیمات اعلانات با موفقیت ذخیره شد.',
      data: updatedUser,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
