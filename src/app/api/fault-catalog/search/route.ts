import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:read')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const categoryId = searchParams.get('categoryId') || ''

  const whereClause: Record<string, any> = { isActive: true }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  if (query) {
    const q = query.toLowerCase()
    whereClause.OR = [
      { code: { contains: q } },
      { title: { contains: q } },
      { keywords: { contains: q } },
      { aliases: { contains: q } },
    ]
  }

  const codes = await prisma.faultCode.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json({ data: codes })
}
