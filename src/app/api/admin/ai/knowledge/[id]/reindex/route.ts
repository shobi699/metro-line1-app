import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { indexKnowledgeSource } from '@/server/modules/ai/knowledge'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params

  try {
    const { content } = await request.json()
    if (!content) {
      return NextResponse.json({ error: 'محتوای سند جهت ایندکس الزامی است' }, { status: 400 })
    }

    const source = await prisma.aiKnowledgeSource.findUnique({
      where: { id }
    })

    if (!source) {
      return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 })
    }

    await indexKnowledgeSource(id, content)

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeSource',
        entityId: id,
        action: 'update',
        after: { action: 'reindex', contentLength: content.length }
      }
    }).catch(() => {})

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    console.error('[knowledge reindex error]', error)
    return NextResponse.json({ error: error.message || 'خطا در اجرای فرآیند ایندکس‌گذاری' }, { status: 500 })
  }
}
