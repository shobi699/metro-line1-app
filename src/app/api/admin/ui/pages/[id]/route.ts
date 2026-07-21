import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { id } = await params
    const body = await request.json()
    const { title, layoutType, status, components } = body

    const existingPage = await prisma.uiPage.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        }
      }
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'صفحه مورد نظر یافت نشد' }, { status: 404 })
    }

    const before = { ...existingPage }

    const updatedPage = await prisma.$transaction(async (tx) => {
      let currentVersionId = existingPage.currentVersionId
      
      // If components are provided, create a new version
      if (components && Array.isArray(components)) {
        const nextVersionNo = existingPage.versions.length > 0 
          ? existingPage.versions[0].versionNumber + 1 
          : 1
        
        const newVersion = await tx.uiPageVersion.create({
          data: {
            pageId: id,
            versionNumber: nextVersionNo,
            schemaJson: { components },
            createdById: user.id,
          }
        })
        currentVersionId = newVersion.id
      }

      return tx.uiPage.update({
        where: { id },
        data: {
          title: title ?? existingPage.title,
          layoutType: layoutType ?? existingPage.layoutType,
          status: status ?? existingPage.status,
          currentVersionId,
        },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          }
        }
      })
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiPage',
        entityId: id,
        action: 'update',
        before: before as any,
        after: updatedPage as any,
        reason: `ویرایش صفحه سفارشی: ${existingPage.title}`,
      },
    })

    return NextResponse.json({
      message: 'صفحه با موفقیت بروزرسانی شد',
      data: updatedPage,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { id } = await params

    const existingPage = await prisma.uiPage.findUnique({ where: { id } })
    if (!existingPage) {
      return NextResponse.json({ error: 'صفحه مورد نظر یافت نشد' }, { status: 404 })
    }

    await prisma.uiPage.delete({ where: { id } })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiPage',
        entityId: id,
        action: 'delete',
        before: existingPage as any,
        reason: `حذف صفحه سفارشی: ${existingPage.title}`,
      },
    })

    return NextResponse.json({
      message: 'صفحه با موفقیت حذف شد',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
