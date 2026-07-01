import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getArticleBySlug, updateArticle, deleteArticle } from '@/server/modules/knowledge/service'
import { prisma } from '@/server/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({ data: article })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const { slug } = await params
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } })
  if (!article) {
    return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
  }

  const body = await request.json()
  const { title, body: articleBody, category, tags, validFrom, validUntil, ownerId, confidentialityLevel, relatedPostId, relatedQuizPostId } = body

  await updateArticle(article.id, {
    title,
    body: articleBody,
    category,
    tags,
    validFrom,
    validUntil,
    ownerId,
    confidentialityLevel,
    relatedPostId,
    relatedQuizPostId,
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: 'KnowledgeArticle',
      entityId: article.id,
      action: 'update',
      after: { title: title ?? article.title },
    },
  })

  return NextResponse.json({ data: { ok: true } })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const { slug } = await params
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug } })
  if (!article) {
    return NextResponse.json({ error: 'مقاله یافت نشد' }, { status: 404 })
  }

  await deleteArticle(article.id)

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      entity: 'KnowledgeArticle',
      entityId: article.id,
      action: 'delete',
      before: { title: article.title },
    },
  })

  return NextResponse.json({ data: { ok: true } })
}

