import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return authErrorResponse(user)

    const roleErr = await requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level') || 'all'
    const source = searchParams.get('source') || 'all'
    const category = searchParams.get('category') || ''
    const query = searchParams.get('query') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit

    const where: any = {}

    if (level !== 'all') {
      where.level = level
    }
    if (source !== 'all') {
      where.source = source
    }
    if (category) {
      where.category = { contains: category }
    }
    if (query) {
      where.OR = [
        { message: { contains: query } },
        { stack: { contains: query } },
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              name: true,
              personnelCode: true,
            },
          },
        },
      }),
      prisma.systemLog.count({ where }),
    ])

    return NextResponse.json({
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'خطا در بارگذاری لاگ‌ها: ' + err.message },
      { status: 500 }
    )
  }
}
