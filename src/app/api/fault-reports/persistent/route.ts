import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { getSettingValue } from '@/server/modules/settings/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  const thresholdDays = await getSettingValue<number>('faults.persistent.thresholdDays', 7)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays)

  const persistentReports = await prisma.faultReport.findMany({
    where: {
      OR: [
        { status: 'deferred' },
        {
          status: {
            in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'],
          },
          createdAt: { lte: cutoffDate },
        },
      ],
    },
    include: {
      train: true,
      wagon: true,
      faultCode: true,
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' }, // oldest first
  })

  return NextResponse.json({ data: persistentReports })
}
