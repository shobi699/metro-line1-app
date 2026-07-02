import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { createChecklistTemplateSchema } from '@/lib/zod'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)
    
    const roleErr = requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)
    const { id } = await params
    
    const body = await req.json()
    const parsed = createChecklistTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const template = await prisma.checklistTemplate.update({
      where: { id: id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        isActive: parsed.data.isActive,
        items: parsed.data.items as any,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'ChecklistTemplate',
        entityId: template.id,
        action: 'update',
        after: parsed.data as any,
      }
    })

    return NextResponse.json({ data: template })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)
    
    const roleErr = requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)
    const { id } = await params

    // Don't delete if there are records, just deactivate
    const recordsCount = await prisma.checklistRecord.count({ where: { templateId: id } })
    if (recordsCount > 0) {
      await prisma.checklistTemplate.update({
        where: { id: id },
        data: { isActive: false }
      })
      return NextResponse.json({ data: { message: 'Template deactivated because it has existing records.' } })
    }

    await prisma.checklistTemplate.delete({ where: { id: id } })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'ChecklistTemplate',
        entityId: id,
        action: 'delete',
      }
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
