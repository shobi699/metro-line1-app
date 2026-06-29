import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { getAllShifts } from '@/server/modules/roster/shifts'
import { prisma } from '@/server/db'
import { assignShiftSchema } from '@/lib/zod/shifts'

// GET /api/shifts - دریافت شیفت‌ها در یک بازه زمانی خاص
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year = Number(searchParams.get('year') ?? now.getFullYear())
  const roleFilter = searchParams.get('role') ?? undefined

  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  let startDate = new Date(year, month - 1, 1)
  let endDate = new Date(year, month, 0, 23, 59, 59)

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam)
    endDate = new Date(endDateParam)
  }

  const shifts = await getAllShifts(startDate, endDate, roleFilter ?? undefined)
  return NextResponse.json({ data: shifts })
}

// POST /api/shifts - ایجاد یا به‌روزرسانی دستی شیفت پرسنل توسط مدیر
export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = assignShiftSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, date, code, source, note } = parsed.data

    // Standardize date to midnight local/UTC representation
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    // Check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    // Check if there is an existing shift for this user on this date
    const existingShift = await prisma.shift.findUnique({
      where: {
        userId_date: {
          userId,
          date: dateObj,
        },
      },
    })

    const [shift] = await prisma.$transaction([
      prisma.shift.upsert({
        where: {
          userId_date: {
            userId,
            date: dateObj,
          },
        },
        update: {
          code,
          source: source ?? 'manual',
          note: note || null,
        },
        create: {
          userId,
          date: dateObj,
          code,
          source: source ?? 'manual',
          note: note || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Shift',
          entityId: `${userId}_${dateObj.toISOString().slice(0, 10)}`,
          action: existingShift ? 'update' : 'create',
          before: existingShift ? { code: existingShift.code, note: existingShift.note } : undefined,
          after: { code, note },
        },
      }),
    ])

    return NextResponse.json({ data: shift, message: 'شیفت با موفقیت ثبت و به‌روزرسانی شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `خطا در ثبت شیفت: ${message}` },
      { status: 500 }
    )
  }
}
