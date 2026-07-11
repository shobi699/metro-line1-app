import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params

    const template = await prisma.rosterTemplate.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json({ error: 'الگو یافت نشد' }, { status: 404 })
    }

    // Do not allow deleting the standard default template
    if (template.name === 'الگوی استاندارد خط ۱') {
      return NextResponse.json({ error: 'حذف الگوی پیش‌فرض سیستم امکان‌پذیر نیست' }, { status: 400 })
    }

    await prisma.rosterTemplate.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'RosterTemplate',
        entityId: id,
        action: 'delete',
        before: template
      }
    })

    return NextResponse.json({
      success: true,
      message: 'الگو با موفقیت حذف شد.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در حذف الگو: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params
    const body = await request.json()

    const updated = await prisma.rosterTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        sourceType: body.sourceType,
        rightMapping: body.rightMapping ?? undefined,
        leftMapping: body.leftMapping ?? undefined,
        pageWidth: body.pageWidth,
        pageHeight: body.pageHeight,
        rightBlock: body.rightBlock ?? undefined,
        leftBlock: body.leftBlock ?? undefined,
        headerZones: body.headerZones ?? undefined,
        pdfColumns: body.pdfColumns ?? undefined,
        isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'RosterTemplate',
        entityId: id,
        action: 'update',
        after: body
      }
    })

    return NextResponse.json({
      success: true,
      message: 'الگو با موفقیت به‌روزرسانی شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی الگو: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
