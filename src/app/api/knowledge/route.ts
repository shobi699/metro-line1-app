import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { listArticles, createArticle, listFAQs, createFAQ } from '@/server/modules/knowledge/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')
  const scope = searchParams.get('scope')

  if (scope === 'faq') {
    const faqs = await listFAQs(category)
    return NextResponse.json({ data: faqs })
  }

  const result = await listArticles({ category, q, page, pageSize })
  return NextResponse.json({ data: result })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const body = await request.json()
  const scope = body._scope

  if (scope === 'faq') {
    const { question, answer, category, articleId } = body
    if (!question || !answer) {
      return NextResponse.json({ error: 'فیلدهای الزامی را پر کنید' }, { status: 400 })
    }
    const faq = await createFAQ({ question, answer, category, articleId })
    return NextResponse.json({ data: faq }, { status: 201 })
  }

  const { title, slug, body: articleBody, category, tags, attachments, validFrom, validUntil, ownerId, confidentialityLevel, relatedPostId, relatedQuizPostId } = body

  if (!title || !slug || !articleBody) {
    return NextResponse.json(
      { error: 'فیلدهای الزامی را پر کنید' },
      { status: 400 },
    )
  }

  const article = await createArticle({
    title,
    slug,
    body: articleBody,
    category,
    tags,
    attachments,
    validFrom,
    validUntil,
    ownerId,
    confidentialityLevel,
    relatedPostId,
    relatedQuizPostId,
    authorId: user.id,
  })

  return NextResponse.json({ data: article }, { status: 201 })
}
