import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const meetingTypeSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  durationMin: z.number().int().positive(),
  bufferMin: z.number().int().nonnegative().default(0),
  hostMode: z.enum(['user', 'role']).default('user'),
  hostRoleKey: z.string().optional().nullable(),
  whoCanBook: z.array(z.string()),
  approval: z.enum(['auto', 'host', 'secretary']).default('auto'),
  minNoticeHrs: z.number().int().nonnegative().default(4),
  maxPerWeek: z.number().int().nullable().optional(),
  needsRoom: z.boolean().default(false),
  fields: z.any().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const types = await prisma.meetingType.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ data: types })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = meetingTypeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
    }

    const type = await prisma.meetingType.create({
      data: {
        key: parsed.data.key,
        title: parsed.data.title,
        description: parsed.data.description,
        durationMin: parsed.data.durationMin,
        bufferMin: parsed.data.bufferMin,
        hostMode: parsed.data.hostMode,
        hostRoleKey: parsed.data.hostRoleKey,
        whoCanBook: parsed.data.whoCanBook,
        approval: parsed.data.approval,
        minNoticeHrs: parsed.data.minNoticeHrs,
        maxPerWeek: parsed.data.maxPerWeek,
        needsRoom: parsed.data.needsRoom,
        fields: parsed.data.fields ?? undefined,
        color: parsed.data.color,
        isActive: parsed.data.isActive,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingType',
        entityId: type.id,
        action: 'create',
        after: type as any,
      }
    })

    return NextResponse.json({ data: type }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ایجاد نوع جلسه' } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) {
      return NextResponse.json({ error: { message: 'شناسه الزامی است' } }, { status: 400 })
    }

    const parsed = meetingTypeSchema.partial().safeParse(updateData)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
    }

    const before = await prisma.meetingType.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: { message: 'نوع جلسه یافت نشد' } }, { status: 404 })

    const updated = await prisma.meetingType.update({
      where: { id },
      data: parsed.data
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingType',
        entityId: id,
        action: 'update',
        before: before as any,
        after: updated as any,
      }
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ویرایش نوع جلسه' } }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: { message: 'شناسه الزامی است' } }, { status: 400 })

    const before = await prisma.meetingType.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: { message: 'یافت نشد' } }, { status: 404 })

    // Logical delete: mark isActive = false
    const type = await prisma.meetingType.update({
      where: { id },
      data: { isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingType',
        entityId: id,
        action: 'delete',
        before: before as any,
      }
    })

    return NextResponse.json({ data: type })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در حذف نوع جلسه' } }, { status: 500 })
  }
}
