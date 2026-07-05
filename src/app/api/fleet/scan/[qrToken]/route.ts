import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:read')
  if (err) return authErrorResponse(err)

  const { qrToken } = await params

  const train = await prisma.train.findUnique({
    where: { qrToken },
    include: {
      wagons: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!train || !train.isActive) {
    return NextResponse.json({ error: 'برچسب QR نامعتبر است یا قطار یافت نشد.' }, { status: 404 })
  }

  // Count open and deferred faults for this train
  const openCount = await prisma.faultReport.count({
    where: {
      trainId: train.id,
      status: {
        in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'],
      },
    },
  })

  const deferredCount = await prisma.faultReport.count({
    where: {
      trainId: train.id,
      status: 'deferred',
    },
  })

  return NextResponse.json({
    data: {
      train,
      stats: {
        open: openCount,
        deferred: deferredCount,
      },
    },
  })
}
