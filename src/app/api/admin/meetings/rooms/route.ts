import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const meetingRoomSchema = z.object({
  name: z.string(),
  location: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const rooms = await prisma.meetingRoom.findMany({
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ data: rooms })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = meetingRoomSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
    }

    const room = await prisma.meetingRoom.create({
      data: {
        name: parsed.data.name,
        location: parsed.data.location,
        capacity: parsed.data.capacity,
        amenities: parsed.data.amenities ?? undefined,
        isActive: parsed.data.isActive,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingRoom',
        entityId: room.id,
        action: 'create',
        after: room as any,
      }
    })

    return NextResponse.json({ data: room }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ایجاد اتاق جلسه' } }, { status: 500 })
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

    const parsed = meetingRoomSchema.partial().safeParse(updateData)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
    }

    const before = await prisma.meetingRoom.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: { message: 'اتاق جلسه یافت نشد' } }, { status: 404 })

    const updated = await prisma.meetingRoom.update({
      where: { id },
      data: {
        ...parsed.data,
        amenities: parsed.data.amenities === null ? undefined : parsed.data.amenities,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingRoom',
        entityId: id,
        action: 'update',
        before: before as any,
        after: updated as any,
      }
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ویرایش اتاق جلسه' } }, { status: 500 })
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

    const before = await prisma.meetingRoom.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: { message: 'یافت نشد' } }, { status: 404 })

    // Logical delete
    const room = await prisma.meetingRoom.update({
      where: { id },
      data: { isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'MeetingRoom',
        entityId: id,
        action: 'delete',
        before: before as any,
      }
    })

    return NextResponse.json({ data: room })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در حذف اتاق جلسه' } }, { status: 500 })
  }
}
