import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const { isVerified, answerText } = body

    const before = await prisma.aiKnowledgeCache.findUnique({ where: { id } })
    if (!before) {
      return NextResponse.json({ error: 'رکورد کش یافت نشد' }, { status: 404 })
    }

    const cache = await prisma.aiKnowledgeCache.update({
      where: { id },
      data: {
        isVerified: typeof isVerified === 'boolean' ? isVerified : undefined,
        answerText: typeof answerText === 'string' ? answerText : undefined
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeCache',
        entityId: id,
        action: 'update',
        before,
        after: { isVerified, answerText }
      }
    }).catch(() => {})

    return NextResponse.json({ data: cache })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ویرایش کش' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const before = await prisma.aiKnowledgeCache.findUnique({ where: { id } })
    if (!before) {
      return NextResponse.json({ error: 'رکورد کش یافت نشد' }, { status: 404 })
    }

    await prisma.aiKnowledgeCache.delete({
      where: { id }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeCache',
        entityId: id,
        action: 'delete',
        before
      }
    }).catch(() => {})

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در حذف رکورد کش' }, { status: 500 })
  }
}
