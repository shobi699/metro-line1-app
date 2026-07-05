import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:read')
  if (err) return authErrorResponse(err)

  const { id } = await params
  const report = await prisma.faultReport.findUnique({
    where: { id },
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
      recurrenceOf: {
        include: { faultCode: true },
      },
      logs: {
        include: {
          actor: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!report) {
    return NextResponse.json({ error: 'گزارش خرابی یافت نشد.' }, { status: 404 })
  }

  // Enforce operator boundary (only see their own reports)
  if ((user.roleKey === 'operator' || user.roleKey === 'driver') && report.reporterId !== user.id) {
    return NextResponse.json({ error: 'شما دسترسی مشاهده این گزارش را ندارید.' }, { status: 403 })
  }

  return NextResponse.json({ data: report })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  try {
    const report = await prisma.faultReport.findUnique({ where: { id } })
    if (!report) {
      return NextResponse.json({ error: 'گزارش خرابی یافت نشد.' }, { status: 404 })
    }

    // Checking edit permission: reporter can edit if status is submitted/needs_info. Supervisor/Admin can always edit.
    const isReporter = report.reporterId === user.id
    const isSupervisor = user.roleKey === 'super_admin' || user.roleKey === 'admin' || user.roleKey === 'supervisor' || user.roleKey === 'shift_lead'

    if (!isSupervisor && (!isReporter || (report.status !== 'submitted' && report.status !== 'needs_info'))) {
      return NextResponse.json({ error: 'شما دسترسی ویرایش این گزارش در وضعیت فعلی را ندارید.' }, { status: 403 })
    }

    const body = await request.json()
    const { description, locationNote, priority, serviceImpact } = body

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.faultReport.update({
        where: { id },
        data: {
          description: description !== undefined ? description : undefined,
          locationNote: locationNote !== undefined ? locationNote : undefined,
          priority: priority !== undefined && isSupervisor ? priority : undefined,
          serviceImpact: serviceImpact !== undefined ? serviceImpact : undefined,
        },
      })

      // Log the edits
      await tx.faultLog.create({
        data: {
          faultId: id,
          actorId: user.id,
          action: 'edited',
          note: 'ویرایش مشخصات گزارش خرابی',
          changes: { before: report, after: u } as any,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultReport',
          entityId: id,
          action: 'update',
          before: report,
          after: u,
        },
      })

      return u
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ویرایش گزارش خرابی' }, { status: 500 })
  }
}
