import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'
import { requireRole } from '@/server/rbac/guard'
import { createChecklistTemplateSchema } from '@/lib/zod'

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    // Non-admins only see active templates
    const isAdmin = ['admin', 'super_admin'].includes(user.roleKey)
    const where = isAdmin ? {} : { isActive: true }

    const templates = await prisma.checklistTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: templates })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    requireRole(user, 'admin')

    const body = await req.json()
    const parsed = createChecklistTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const data = parsed.data

    const template = await prisma.checklistTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        items: data.items as any,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'ChecklistTemplate',
        entityId: template.id,
        action: 'create',
        after: data as any,
      }
    })

    return NextResponse.json({ data: template })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}


