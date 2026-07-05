import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:view-own')
  if (err) return authErrorResponse(err)

  try {
    const templates = await prisma.formTemplate.findMany({
      where: { isActive: true },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // فیلتر قالب‌ها بر اساس دسترسی ثبت کاربر
    const allowedTemplates = templates.filter((template) => {
      const activeVersion = template.versions[0]
      if (!activeVersion) return false
      const access = activeVersion.access as any
      if (!access || !access.whoCanSubmit) return false
      return access.whoCanSubmit.includes('*') || access.whoCanSubmit.includes(user.roleKey)
    })

    const result = allowedTemplates.map((t) => ({
      id: t.id,
      key: t.key,
      title: t.title,
      description: t.description,
      category: t.category,
      icon: t.icon,
      allowMobile: t.allowMobile,
    }))

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
