import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const roleKey = user.roleKey

    const allPaths = await prisma.learningPath.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    const paths = allPaths.filter(p => !p.roleKeys || p.roleKeys.includes(roleKey))

    return NextResponse.json({ data: paths })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت لیست مسیرهای آموزشی' } },
      { status: 500 }
    )
  }
}
