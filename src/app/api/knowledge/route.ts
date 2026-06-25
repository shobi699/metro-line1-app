import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { listArticles, createArticle } from '@/server/modules/knowledge/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')

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
  const { title, slug, body: articleBody, category, tags, attachments } = body

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
    authorId: user.id,
  })

  return NextResponse.json({ data: article }, { status: 201 })
}
