import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFormVersionSchema } from '@/lib/zod/forms'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    })

    if (!template) {
      return NextResponse.json({ error: 'قالب فرم یافت نشد.' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createFormVersionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const nextVersionNo = template.versions.length > 0 ? template.versions[0].version + 1 : 1

    const newVersion = await prisma.$transaction(async (tx) => {
      const v = await tx.formVersion.create({
        data: {
          templateId: id,
          version: nextVersionNo,
          schema: parsed.data.schema as any,
          workflow: parsed.data.workflow as any,
          access: parsed.data.access as any,
          isActive: false, // published later
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormVersion',
          entityId: v.id,
          action: 'create',
          after: parsed.data as any,
        },
      })

      return v
    })

    return NextResponse.json({ data: newVersion })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
