import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { hashPassword } from '@/server/auth/password'
import type { Prisma } from '@/generated/prisma/client'
import { POST_TO_ROLE_KEY } from '@/server/rbac/permissions'
import { createUserSchema } from '@/lib/zod/admin'

// GET /api/admin/users - دریافت لیست کاربران با امکان جستجو و فیلتر
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const roleId = searchParams.get('roleId') || ''
  const status = searchParams.get('status') || ''

  try {
    const whereClause: Prisma.UserWhereInput = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { nationalId: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (roleId) {
      whereClause.roleId = roleId
    }

    if (status) {
      whereClause.status = status as 'pending' | 'active' | 'suspended'
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        role: {
          select: {
            id: true,
            key: true,
            name: true,
            rank: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Remove password hash from response
    const sanitizedUsers = users.map((u) => {
      const { passwordHash: _passwordHash, ...rest } = u
      return rest
    })

    return NextResponse.json({ data: sanitizedUsers })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت لیست کاربران: ' + message },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - ایجاد کاربر جدید توسط مدیر
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { nationalId, name, phone, email, password, roleId, status, customFields } = parsed.data

    // Check unique nationalId
    const existingUser = await prisma.user.findUnique({
      where: { nationalId },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'کاربری با این کد ملی از قبل وجود دارد' },
        { status: 400 }
      )
    }

    // Automatically map roleId from post if post is set in customFields
    let finalRoleId = roleId
    const postVal = customFields?.post
    if (postVal && typeof postVal === 'string') {
      const mappedRoleKey = POST_TO_ROLE_KEY[postVal]
      if (mappedRoleKey) {
        const matchedRole = await prisma.role.findUnique({
          where: { key: mappedRoleKey },
        })
        if (matchedRole) {
          finalRoleId = matchedRole.id
        }
      }
    }

    const role = await prisma.role.findUnique({
      where: { id: finalRoleId },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'نقش انتخاب شده معتبر نیست' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          nationalId,
          name,
          phone: phone || null,
          email: email || null,
          passwordHash,
          roleId: finalRoleId,
          status,
          customFields: (customFields || null) as unknown as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          nationalId: true,
          name: true,
          phone: true,
          email: true,
          status: true,
          roleId: true,
          createdAt: true,
          customFields: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: sessionUser.id,
          entity: 'User',
          entityId: nationalId, // Using national ID as a key reference or fallback to new user ID after creation
          action: 'create',
          before: undefined,
          after: {
            nationalId,
            name,
            phone,
            email,
            roleId: finalRoleId,
            status,
            customFields,
          } as unknown as Prisma.InputJsonValue,
        },
      }),
    ])

    // Update AuditLog entityId with actual database ID
    await prisma.auditLog.updateMany({
      where: { actorId: sessionUser.id, entity: 'User', entityId: nationalId },
      data: { entityId: newUser.id },
    })

    return NextResponse.json({ data: newUser, message: 'کاربر جدید با موفقیت ایجاد شد' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در ایجاد کاربر جدید: ' + message },
      { status: 500 }
    )
  }
}
