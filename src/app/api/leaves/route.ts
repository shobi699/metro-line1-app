import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { z } from 'zod'

const leaveRequestSchema = z.object({
  type: z.string(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  reason: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // operator or higher
  const roleErr = await requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const monthPrefix = searchParams.get('month') // e.g. "2026-07"
  
  let dateFilter = {}
  if (monthPrefix) {
    const startDate = new Date(`${monthPrefix}-01T00:00:00Z`)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
    
    dateFilter = {
      fromDate: {
        gte: startDate,
        lt: endDate
      }
    }
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      userId: user.id,
      ...dateFilter
    },
    orderBy: { fromDate: 'desc' }
  })

  return NextResponse.json({ data: leaves })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = leaveRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { type, fromDate, toDate, reason, amount, unit } = parsed.data

    // Check if type is valid in settings
    const setting = await prisma.setting.findFirst({
      where: { key: `leave.type.${type}` }
    })

    if (!setting) {
      return NextResponse.json({ error: 'نوع مرخصی نامعتبر است' }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        reason,
        amount,
        unit,
        status: 'pending'
      }
    })

    return NextResponse.json({ data: leaveRequest })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

