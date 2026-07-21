import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const layer = searchParams.get('layer')
  const persona = searchParams.get('persona')
  const ratingStr = searchParams.get('rating')
  const rating = ratingStr ? Number(ratingStr) : undefined

  try {
    const where: any = {}
    if (layer) where.layer = layer
    if (persona) where.personaKey = persona
    if (rating !== undefined) where.rating = rating

    const interactions = await prisma.aiInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ data: interactions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت تعاملات' }, { status: 500 })
  }
}
