import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { getSettingValue } from '@/server/modules/settings/service'
import { submitRequestSchema } from '@/lib/zod'
import type { RequestTypeConfig } from '@/lib/zod'
import { hasPermission } from '@/server/rbac/permissions'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const parsed = submitRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const data = parsed.data

  // Fetch types config
  const types = await getSettingValue<RequestTypeConfig[]>('requests.types', [])
  const typeConfig = types.find(t => t.id === data.typeId && t.isEnabled)

  if (!typeConfig) {
    return NextResponse.json({ error: 'نوع درخواست نامعتبر است یا غیرفعال شده است' }, { status: 400 })
  }

  // Calculate final amount based on multiplier if no approval is required
  let calculatedAmount = data.amount
  let status = 'pending'

  if (!typeConfig.requiresApproval) {
    calculatedAmount = data.amount * typeConfig.multiplier
    status = 'approved'
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: user.id,
      type: data.typeId,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      amount: data.amount,
      unit: typeConfig.unit,
      reason: data.reason,
      status: status as any,
      calculatedAmount: status === 'approved' ? calculatedAmount : null
    }
  })

  return NextResponse.json({ data: leaveRequest }, { status: 201 })
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires admin or shifts:read to view all requests
  const hasAccess = hasPermission(user.permissions, 'shifts:read') || ['admin', 'super_admin'].includes(user.roleKey)
  if (!hasAccess) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  
  const whereClause: any = {}
  if (statusFilter) {
    whereClause.status = statusFilter
  }

  const requests = await prisma.leaveRequest.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, personnelCode: true } },
      reviewedBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json({ data: requests })
}

