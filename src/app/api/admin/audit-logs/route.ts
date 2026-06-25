import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import type { Prisma } from '@/generated/prisma/client'

// GET /api/admin/audit-logs - دریافت کل لاگ‌های ممیزی سیستم با فیلتر و جستجو
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const action = searchParams.get('action') || ''
  const entity = searchParams.get('entity') || ''

  try {
    const whereClause: Prisma.AuditLogWhereInput = {}

    if (action) {
      whereClause.action = action as any
    }

    if (entity) {
      whereClause.entity = entity
    }

    if (search) {
      whereClause.OR = [
        { entityId: { contains: search } },
        {
          actor: {
            OR: [
              { name: { contains: search } },
              { nationalId: { contains: search } },
            ],
          },
        },
      ]
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            nationalId: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Capped at 100 for responsive performance
    })

    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    console.error('Error fetching general audit logs:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `خطا در دریافت لاگ‌های ممیزی سیستم: ${message}` },
      { status: 500 }
    )
  }
}
