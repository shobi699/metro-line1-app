import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const ruleSchema = z.object({
  ownerType: z.enum(['user', 'role']),
  ownerKey: z.string(),
  weekday: z.number().min(0).max(6),
  fromTime: z.string().regex(/^\d{2}:\d{2}$/),
  toTime: z.string().regex(/^\d{2}:\d{2}$/),
  typeKeys: z.array(z.string()).optional().nullable(),
  isActive: z.boolean().default(true),
})

const exceptionSchema = z.object({
  ownerType: z.enum(['user', 'role']),
  ownerKey: z.string(),
  date: z.string(),
  fromTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  toTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin' && user.roleKey !== 'manager') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const ownerKey = searchParams.get('ownerKey')
  const ownerType = searchParams.get('ownerType') ?? 'user'

  const where: any = {}
  if (ownerKey) {
    where.ownerKey = ownerKey
    where.ownerType = ownerType
  }

  const rules = await prisma.availabilityRule.findMany({
    where,
    orderBy: [{ ownerKey: 'asc' }, { weekday: 'asc' }, { fromTime: 'asc' }],
  })

  const exceptions = await prisma.availabilityException.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ data: { rules, exceptions } })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin' && user.roleKey !== 'manager') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const isException = 'date' in body

    if (isException) {
      const parsed = exceptionSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
      }

      const exc = await prisma.availabilityException.create({
        data: {
          ownerType: parsed.data.ownerType,
          ownerKey: parsed.data.ownerKey,
          date: new Date(parsed.data.date),
          fromTime: parsed.data.fromTime,
          toTime: parsed.data.toTime,
          reason: parsed.data.reason,
        }
      })

      return NextResponse.json({ data: exc, type: 'exception' }, { status: 201 })
    } else {
      const parsed = ruleSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: { message: 'داده‌های ورودی معتبر نیست', details: parsed.error.format() } }, { status: 400 })
      }

      const rule = await prisma.availabilityRule.create({
        data: {
          ownerType: parsed.data.ownerType,
          ownerKey: parsed.data.ownerKey,
          weekday: parsed.data.weekday,
          fromTime: parsed.data.fromTime,
          toTime: parsed.data.toTime,
          typeKeys: parsed.data.typeKeys ?? undefined,
          isActive: parsed.data.isActive,
        }
      })

      return NextResponse.json({ data: rule, type: 'rule' }, { status: 201 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ذخیره‌سازی' } }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin' && user.roleKey !== 'manager') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') ?? 'rule'

    if (!id) return NextResponse.json({ error: { message: 'شناسه الزامی است' } }, { status: 400 })

    if (type === 'exception') {
      await prisma.availabilityException.delete({ where: { id } })
    } else {
      await prisma.availabilityRule.delete({ where: { id } })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در حذف' } }, { status: 500 })
  }
}
