import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFormTemplateSchema } from '@/lib/zod/forms'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'قالب یافت نشد.' }, { status: 404 })
    }

    return NextResponse.json({ data: template })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    // استفاده از پارشیال برای ویرایش
    const partialSchema = createFormTemplateSchema.partial()
    const parsed = partialSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.formTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'قالب یافت نشد.' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.formTemplate.update({
        where: { id },
        data: parsed.data,
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormTemplate',
          entityId: id,
          action: 'update',
          before: existing as any,
          after: parsed.data as any,
        },
      })

      return t
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
