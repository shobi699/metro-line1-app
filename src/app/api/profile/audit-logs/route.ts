import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { actorId: user.id },
          { entity: 'User', entityId: user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ data: logs })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت گزارش فعالیت‌ها: ' + message },
      { status: 500 }
    )
  }
}
