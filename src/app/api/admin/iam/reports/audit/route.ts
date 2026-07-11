import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:reports') && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: 'دسترسی مشاهده لاگ حسابرسی را ندارید' }, { status: 403 })
  }

  try {
    const events = await prisma.userLifecycleEvent.findMany({
      include: {
        user: { select: { name: true, personnelCode: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Limit to latest 200 events for now
    })

    // Also try to get actor names
    const actorIds = events.map(e => e.actorId).filter(Boolean) as string[]
    const actors = await prisma.user.findMany({
      where: { id: { in: Array.from(new Set(actorIds)) } },
      select: { id: true, name: true }
    })
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a.name]))

    const data = events.map(e => ({
      id: e.id,
      personnelCode: e.user.personnelCode,
      targetName: e.user.name,
      kind: e.kind,
      detail: e.detail,
      actorName: e.actorId ? actorMap[e.actorId] || 'نامشخص' : 'سیستم',
      createdAt: e.createdAt
    }))

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
