import { prisma } from '@/server/db'

export interface KnowledgeArticleData {
  id: string
  title: string
  slug: string
  body: string
  category: string | null
  tags: string | null
  attachments: Array<{ url: string; name: string; type: string }> | null
  createdAt: Date
  author?: { name: string }
}

export async function listArticles(options?: {
  category?: string
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ items: KnowledgeArticleData[]; total: number }> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const where: Record<string, unknown> = {}

  if (options?.category) where.category = options.category
  if (options?.q) {
    where.OR = [
      { title: { contains: options.q } },
      { body: { contains: options.q } },
      { tags: { contains: options.q } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.knowledgeArticle.count({ where }),
  ])

  return {
    items: items.map((a) => ({
      ...a,
      attachments: (a.attachments as Array<{ url: string; name: string; type: string }>) ?? null,
    })),
    total,
  }
}

export async function getArticleBySlug(
  slug: string,
): Promise<KnowledgeArticleData | null> {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  })

  if (!article) return null

  return {
    ...article,
    attachments: (article.attachments as Array<{ url: string; name: string; type: string }>) ?? null,
  }
}

export async function createArticle(data: {
  title: string
  slug: string
  body: string
  category?: string
  tags?: string
  attachments?: Array<{ url: string; name: string; type: string }>
  authorId: string
}): Promise<KnowledgeArticleData> {
  const article = await prisma.knowledgeArticle.create({
    data: {
      title: data.title,
      slug: data.slug,
      body: data.body,
      category: data.category,
      tags: data.tags,
      attachments: data.attachments as never,
      authorId: data.authorId,
    },
    include: { author: { select: { name: true } } },
  })

  return {
    ...article,
    attachments: (article.attachments as Array<{ url: string; name: string; type: string }>) ?? null,
  }
}

export async function updateArticle(
  id: string,
  data: {
    title?: string
    body?: string
    category?: string
    tags?: string
  },
): Promise<void> {
  await prisma.knowledgeArticle.update({
    where: { id },
    data,
  })
}

export async function deleteArticle(id: string): Promise<void> {
  await prisma.knowledgeArticle.delete({ where: { id } })
}

export async function searchArticles(
  query: string,
): Promise<KnowledgeArticleData[]> {
  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { body: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return articles.map((a) => ({
    ...a,
    attachments: (a.attachments as Array<{ url: string; name: string; type: string }>) ?? null,
  }))
}
