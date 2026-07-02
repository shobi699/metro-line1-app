import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const cache = await prisma.aiKnowledgeCache.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    return NextResponse.json({ data: cache })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت کش معنایی' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    await prisma.aiKnowledgeCache.deleteMany()
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeCache',
        entityId: 'all',
        action: 'delete',
        after: { cleared: true }
      }
    }).catch(() => {})

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در پاکسازی کش' }, { status: 500 })
  }
}
