import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('trainIds')

  const filter: Record<string, any> = { isActive: true }
  if (idsParam) {
    const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean)
    if (ids.length > 0) {
      filter.id = { in: ids }
    }
  }

  const trains = await prisma.train.findMany({
    where: filter,
    select: {
      id: true,
      trainNumber: true,
      fleetSeries: true,
      qrToken: true,
    },
    orderBy: { trainNumber: 'asc' },
  })

  return NextResponse.json({ data: trains })
}
