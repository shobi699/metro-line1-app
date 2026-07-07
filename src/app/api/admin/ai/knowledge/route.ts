import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { indexKnowledgeSource } from '@/server/modules/ai/knowledge'
import { z } from 'zod'

const aiKnowledgeSourceSchema = z.object({
  title: z.string().min(1, 'عنوان سند اجباری است'),
  category: z.string().min(1, 'دسته‌بندی سند اجباری است'),
  accessRoles: z.string().default('[]'),
  fileUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  content: z.string().optional(), // Content to index immediately
})

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const sources = await prisma.aiKnowledgeSource.findMany({
      orderBy: { title: 'asc' }
    })
    return NextResponse.json({ data: sources })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت اسناد دانش' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = aiKnowledgeSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { content, ...data } = parsed.data
    const source = await prisma.aiKnowledgeSource.create({
      data
    })

    if (content) {
      // Index in background or synchronously
      await indexKnowledgeSource(source.id, content)
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeSource',
        entityId: source.id,
        action: 'create',
        after: parsed.data
      }
    }).catch(() => {})

    return NextResponse.json({ data: source })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ایجاد سند دانش جدید' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const { id, content, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'شناسه سند الزامی است' }, { status: 400 })
    }

    const existing = await prisma.aiKnowledgeSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'سند یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.aiKnowledgeSource.update({
      where: { id },
      data
    })

    if (content) {
      await indexKnowledgeSource(id, content)
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiKnowledgeSource',
        entityId: id,
        action: 'update',
        before: existing,
        after: updated
      }
    }).catch(() => {})

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در بروزرسانی سند دانش' }, { status: 500 })
  }
}
