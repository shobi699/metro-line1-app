import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFaultReportSchema } from '@/lib/zod/faults'
import { createFaultReport } from '@/server/modules/faults/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:read')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const trainId = searchParams.get('trainId')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const slaBreached = searchParams.get('slaBreached')
  const query = searchParams.get('q')

  const filter: Record<string, any> = {}

  if (trainId) filter.trainId = trainId
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (slaBreached !== null) filter.slaBreached = slaBreached === 'true'

  if (query) {
    const q = query.toLowerCase()
    filter.OR = [
      { description: { contains: q } },
      { locationNote: { contains: q } },
      { faultCode: { title: { contains: q } } },
      { faultCode: { code: { contains: q } } },
    ]
  }

  // Operators can only see faults they reported
  if (user.roleKey === 'operator' || user.roleKey === 'driver') {
    filter.reporterId = user.id
  }

  const reports = await prisma.faultReport.findMany({
    where: filter,
    include: {
      train: true,
      wagon: true,
      faultCode: {
        include: { category: true },
      },
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      verifier: { select: { id: true, name: true } },
      _count: { select: { logs: true } },
    },
    orderBy: { occurredAt: 'desc' },
  })

  return NextResponse.json({ data: reports })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:create')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = createFaultReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const report = await createFaultReport(parsed.data, user.id)
    return NextResponse.json({ data: report }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ثبت گزارش خرابی' }, { status: 500 })
  }
}
