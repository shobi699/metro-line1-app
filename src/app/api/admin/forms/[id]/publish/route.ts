import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms-admin:manage')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json({ error: 'شناسه نسخه الزامی است.' }, { status: 400 })
    }

    const version = await prisma.formVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.templateId !== id) {
      return NextResponse.json({ error: 'نسخه مورد نظر معتبر نیست.' }, { status: 400 })
    }

    const publishedTemplate = await prisma.$transaction(async (tx) => {
      // ۱. غیرفعال‌سازی تمام نسخه‌های دیگر این قالب
      await tx.formVersion.updateMany({
        where: { templateId: id },
        data: { isActive: false },
      })

      // ۲. فعال‌سازی نسخه مورد نظر
      await tx.formVersion.update({
        where: { id: versionId },
        data: {
          isActive: true,
          publishedAt: new Date(),
          publishedBy: user.id,
        },
      })

      // ۳. به‌روزرسانی قالب اصلی
      const t = await tx.formTemplate.update({
        where: { id },
        data: {
          isPublished: true,
          activeVersionId: versionId,
        },
      })

      // ۴. لاگ ممیزی
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormTemplate',
          entityId: id,
          action: 'update',
          after: { activeVersionId: versionId, isPublished: true },
        },
      })

      return t
    })

    return NextResponse.json({ data: publishedTemplate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
