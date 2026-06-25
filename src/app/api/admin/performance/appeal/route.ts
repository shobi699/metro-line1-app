import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/performance/appeal - List all performance appeals (Admin Only)
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'pending' | 'approved' | 'rejected' | null (all)

  try {
    const appeals = await prisma.performanceAppeal.findMany({
      where: status ? { status } : undefined,
      include: {
        employee: {
          select: { id: true, name: true, customFields: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
        log: {
          include: {
            actionType: {
              include: { competency: true },
            },
            recordedBy: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ data: appeals })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت اعتراضات: ' + message },
      { status: 500 }
    )
  }
}
