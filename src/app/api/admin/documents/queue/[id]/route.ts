import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const body = await request.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: parsed.error.issues[0].message } },
      { status: 400 },
    )
  }

  const doc = await prisma.userDocument.findUnique({ where: { id } })
  if (!doc) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'سند یافت نشد' } },
      { status: 404 },
    )
  }

  if (doc.status !== 'pending') {
    return NextResponse.json(
      { error: { code: 'ALREADY_REVIEWED', message: 'این سند قبلاً بررسی شده است' } },
      { status: 400 },
    )
  }

  const updated = await prisma.userDocument.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.note ?? null,
      reviewedBy: user.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: 'UserDocument',
      entityId: id,
      action: 'update',
      after: { status: parsed.data.status, note: parsed.data.note },
    },
  })

  return NextResponse.json({ data: updated })
}
