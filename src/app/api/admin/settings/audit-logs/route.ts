import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requirePermission,
  authErrorResponse,
} from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'Setting',
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 logs
    })

    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    console.error('Error fetching settings audit logs:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `خطا در دریافت لاگ‌های ممیزی تنظیمات: ${message}` },
      { status: 500 }
    )
  }
}
