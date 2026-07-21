import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  const where: Record<string, unknown> = {}
  if (status !== 'all') where.status = status

  const docs = await prisma.userDocument.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, personnelCode: true, phone: true } },
      type: { select: { key: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const counts = await prisma.userDocument.groupBy({
    by: ['status'],
    _count: true,
  })

  const kpi = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  }
  for (const c of counts) {
    const s = c.status as keyof typeof kpi
    if (s in kpi) kpi[s] = c._count
    kpi.total += c._count
  }

  return NextResponse.json({ data: { items: docs, kpi } })
}
