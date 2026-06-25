import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const updateProfileSchema = z.object({
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal('')),
  availability: z
    .enum(['online', 'busy', 'on_shift', 'offline'])
    .optional(),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'کد رنگ نامعتبر است')
    .optional()
    .or(z.literal('')),
  carPlate: z
    .string()
    .max(50, 'پلاک خودرو بسیار طولانی است')
    .optional()
    .or(z.literal('')),
  avatar: z
    .string()
    .url('آدرس آواتار نامعتبر است')
    .optional()
    .or(z.literal('')),
  personnelNo: z
    .string()
    .min(3, 'شماره پرسنلی حداقل ۳ رقم باشد')
    .max(20, 'شماره پرسنلی حداکثر ۲۰ رقم باشد')
    .regex(/^\d+$/, 'شماره پرسنلی فقط شامل اعداد باشد')
    .optional()
    .or(z.literal('')),
  group: z
    .string()
    .max(50)
    .optional()
    .or(z.literal('')),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        role: {
          select: {
            name: true,
            key: true,
          }
        },
        customFields: true,
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ data: profile })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { phone, email, availability, themeColor, carPlate, avatar, personnelNo, group } = parsed.data

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { customFields: true, phone: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    const currentCustomFields = (currentUser.customFields as Record<string, unknown>) || {}

    // Merge custom field modifications
    const updatedCustomFields = {
      ...currentCustomFields,
      availability: availability ?? currentCustomFields.availability ?? 'online',
      themeColor: themeColor ?? currentCustomFields.themeColor ?? '',
      carPlate: carPlate ?? currentCustomFields.carPlate ?? '',
      avatar: avatar !== undefined ? (avatar === '' ? '' : avatar) : currentCustomFields.avatar ?? '',
      personnelNo: personnelNo !== undefined ? (personnelNo === '' ? '' : personnelNo) : currentCustomFields.personnelNo ?? '',
      group: group !== undefined ? (group === '' ? '' : group) : currentCustomFields.group ?? '',
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: phone !== undefined ? (phone === '' ? null : phone) : currentUser.phone,
        email: email !== undefined ? (email === '' ? null : email) : currentUser.email,
        customFields: updatedCustomFields,
      },
      select: {
        id: true,
        nationalId: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        customFields: true,
        role: {
          select: {
            name: true,
            key: true,
          }
        },
      },
    })

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'update',
        before: {
          phone: currentUser.phone,
          email: currentUser.email,
          customFields: currentUser.customFields,
        },
        after: {
          phone: updatedUser.phone,
          email: updatedUser.email,
          customFields: updatedUser.customFields,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'پروفایل شما با موفقیت بروزرسانی شد.',
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
