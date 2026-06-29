import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { createRoleSchema } from '@/lib/zod/admin'

// GET /api/admin/roles - دریافت لیست نقش‌ها و تعداد کاربران هر نقش
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        rank: 'desc',
      },
    })

    return NextResponse.json({ data: roles })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت لیست نقش‌ها: ' + message },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - ایجاد نقش جدید توسط مدیر
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Only super_admin can create new roles
  const roleErr = requireRole(sessionUser, 'super_admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = createRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { key, name, permissions, rank } = parsed.data

    const existingRole = await prisma.role.findUnique({
      where: { key },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'نقشی با این شناسه از قبل وجود دارد' },
        { status: 400 }
      )
    }

    const [newRole] = await prisma.$transaction([
      prisma.role.create({
        data: {
          key,
          name,
          permissions: JSON.stringify(permissions),
          rank,
          isSystem: false,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'Role',
          entityId: key,
          action: 'create',
          before: undefined,
          after: {
            key,
            name,
            permissions,
            rank,
            isSystem: false,
          },
        },
      }),
    ])

    return NextResponse.json({ data: newRole, message: 'نقش جدید با موفقیت ایجاد شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در ایجاد نقش جدید: ' + message },
      { status: 500 }
    )
  }
}
