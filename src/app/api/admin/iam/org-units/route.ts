import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'
import { z } from 'zod'

const createSchema = z.object({
  key: z.string(),
  title: z.string(),
  kind: z.string(), // e.g. "line" | "station" | "shift_group" | "unit"
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true)
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires 'iam:users-manage' or 'iam:assign'
  if (!can(user, 'iam:users-manage') && !can(user, 'iam:assign')) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  try {
    const units = await prisma.orgUnit.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
    return NextResponse.json({ data: units })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:users-manage')) {
    return NextResponse.json({ error: 'عدم دسترسی برای ایجاد واحد' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const created = await prisma.orgUnit.create({
      data: parsed.data
    })
    
    // Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'OrgUnit',
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
