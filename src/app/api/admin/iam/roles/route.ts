import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'
import { z } from 'zod'

const createRoleSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string().optional(),
  permissions: z.any(),
  color: z.string().optional()
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:roles-manage') && !can(user, 'iam:assign')) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json({ data: roles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:roles-manage')) {
    return NextResponse.json({ error: 'عدم دسترسی برای ایجاد نقش' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const created = await prisma.role.create({
      data: {
        ...parsed.data,
        isSystem: false,
        isActive: true
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'Role',
        entityId: created.id,
        action: 'create',
        after: created as any
      }
    })

    return NextResponse.json({ data: created })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
