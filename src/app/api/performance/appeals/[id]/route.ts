import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'
import { requireRole } from '@/server/rbac/guard'
import { reviewAppealSchema } from '@/lib/zod/performance'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    const roleErr = await requireRole(user, 'admin')
    if (roleErr) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 403 })
    const { id } = await params

    const body = await req.json()
    const parsed = reviewAppealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const { status, note } = parsed.data

    const appeal = await prisma.performanceAppeal.findUnique({ where: { id: id } })
    if (!appeal) return NextResponse.json({ error: { message: 'Appeal not found' } }, { status: 404 })

    const updated = await prisma.performanceAppeal.update({
      where: { id: id },
      data: {
        status,
        note,
        reviewedById: user.id,
        resolvedAt: new Date()
      }
    })

    // If appeal approved, overturn the log
    // If appeal rejected, set log back to active
    await prisma.performanceLog.update({
      where: { id: appeal.logId },
      data: { status: status === 'approved' ? 'overturned' : 'active' }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'PerformanceAppeal',
        entityId: id,
        action: 'update',
        after: { status, note },
      }
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
