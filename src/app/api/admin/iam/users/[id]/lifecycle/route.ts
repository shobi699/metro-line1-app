import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'users:update')) {
    return NextResponse.json({ error: 'عدم دسترسی به تغییر وضعیت کاربر' }, { status: 403 })
  }

  const { id: targetUserId } = await params
  
  try {
    const { action, reason } = await request.json()
    // action: "suspend" | "activate" | "offboard"
    
    let newStatus = 'active'
    let kind = 'activated'
    
    if (action === 'suspend') {
      newStatus = 'suspended'
      kind = 'suspended'
    } else if (action === 'offboard') {
      newStatus = 'offboarded' // assuming this is a valid UserStatus
      kind = 'offboarded'
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
    }

    // Update user status
    // Note: UserStatus enum might need to be casted to any if it complains, but let's try direct assignment
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: newStatus as any }
    })

    // Log the lifecycle event
    await prisma.userLifecycleEvent.create({
      data: {
        userId: targetUserId,
        kind,
        detail: { reason },
        actorId: user.id
      }
    })

    // If suspending or offboarding, we might also want to revoke sessions (UserSession model)
    if (newStatus === 'suspended' || newStatus === 'offboarded') {
      await prisma.userSession.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    }

    return NextResponse.json({ data: updatedUser })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
