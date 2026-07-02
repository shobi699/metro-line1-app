import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { getSettingValue } from '@/server/modules/settings/service'
import { reviewRequestSchema } from '@/lib/zod'
import { hasPermission } from '@/server/rbac/permissions'

import type { RequestTypeConfig } from '@/lib/zod'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires admin or shifts:update to review requests
  const hasAccess = hasPermission(user.permissions, 'shifts:update') || ['admin', 'super_admin'].includes(user.roleKey)
  if (!hasAccess) {
    return NextResponse.json({ error: 'عدم دسترسی برای بررسی درخواست' }, { status: 403 })
  }

  const { id } = await context.params
  const body = await request.json()
  const parsed = reviewRequestSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { status, note } = parsed.data

  const existingRequest = await prisma.leaveRequest.findUnique({ where: { id } })
  if (!existingRequest) {
    return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
  }

  if (existingRequest.status !== 'pending') {
    return NextResponse.json({ error: 'این درخواست قبلاً بررسی شده است' }, { status: 400 })
  }

  const types = await getSettingValue<RequestTypeConfig[]>('requests.types', [])
  const typeConfig = types.find(t => t.id === existingRequest.type)

  let calculatedAmount: number | null = null

  if (status === 'approved') {
    const multiplier = typeConfig?.multiplier ?? 1
    calculatedAmount = (existingRequest.amount ?? 0) * multiplier
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewNote: note,
      reviewedById: user.id,
      reviewedAt: new Date(),
      calculatedAmount
    }
  })

  return NextResponse.json({ data: updated })
}
