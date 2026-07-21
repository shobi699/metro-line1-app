import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const pages = await prisma.uiPage.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        }
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ data: pages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const { title, slug, layoutType } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'عنوان و آدرس صفحه الزامی است' }, { status: 400 })
    }

    // Check unique slug
    const existing = await prisma.uiPage.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'صفحه‌ای با این آدرس (slug) قبلاً ایجاد شده است' }, { status: 400 })
    }

    const newPage = await prisma.$transaction(async (tx) => {
      const page = await tx.uiPage.create({
        data: {
          title,
          slug,
          layoutType: layoutType || 'list',
          status: 'draft',
        }
      })

      const version = await tx.uiPageVersion.create({
        data: {
          pageId: page.id,
          versionNumber: 1,
          schemaJson: { components: [] },
          createdById: user.id,
        }
      })

      return tx.uiPage.update({
        where: { id: page.id },
        data: { currentVersionId: version.id },
        include: { versions: true }
      })
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiPage',
        entityId: newPage.id,
        action: 'create',
        after: newPage as any,
        reason: `ایجاد صفحه سفارشی جدید: ${title}`,
      },
    })

    return NextResponse.json({
      message: 'صفحه جدید با موفقیت ایجاد شد',
      data: newPage,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
