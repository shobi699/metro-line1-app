import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: 'User',
      entityId: user.id,
      action: 'logout',
    },
  })

  return NextResponse.json({ message: 'با موفقیت خارج شدید' })
}
