import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFormTemplateSchema } from '@/lib/zod/forms'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const templates = await prisma.formTemplate.findMany({
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: templates })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = createFormTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { key, title, description, category, icon, allowMobile } = parsed.data

    const existing = await prisma.formTemplate.findUnique({
      where: { key },
    })

    if (existing) {
      return NextResponse.json({ error: 'قالبی با این کلید قبلاً ثبت شده است.' }, { status: 400 })
    }

    const template = await prisma.$transaction(async (tx) => {
      const t = await tx.formTemplate.create({
        data: {
          key,
          title,
          description,
          category,
          icon,
          allowMobile,
          createdBy: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormTemplate',
          entityId: t.id,
          action: 'create',
          after: parsed.data as any,
        },
      })

      return t
    })

    return NextResponse.json({ data: template })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
