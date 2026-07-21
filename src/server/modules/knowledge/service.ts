import { prisma } from '@/server/db'

export interface KnowledgeArticleData {
  id: string
  title: string
  slug: string
  body: string
  category: string | null
  tags: string | null
  attachments: Array<{ url: string; name: string; type: string }> | null
  version: number
  validFrom: Date | null
  validUntil: Date | null
  ownerId: string | null
  confidentialityLevel: string
  relatedPostId: string | null
  relatedQuizPostId: string | null
  createdAt: Date
  author?: { name: string }
}

export interface KnowledgeFAQData {
  id: string
  question: string
  answer: string
  category: string | null
  articleId: string | null
  createdAt: Date
}

function mapArticle(a: {
  id: string; title: string; slug: string; body: string
  category: string | null; tags: string | null; attachments: unknown
  version: number; validFrom: Date | null; validUntil: Date | null
  ownerId: string | null; confidentialityLevel: string
  relatedPostId: string | null; relatedQuizPostId: string | null
  createdAt: Date; author?: { name: string }
}): KnowledgeArticleData {
  return {
    ...a,
    attachments: (a.attachments as Array<{ url: string; name: string; type: string }>) ?? null,
  }
}

export async function listArticles(options?: {
  category?: string
  q?: string
  page?: number
  pageSize?: number
  confidentialityLevel?: string
}): Promise<{ items: KnowledgeArticleData[]; total: number }> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const where: Record<string, unknown> = {}

  if (options?.category) where.category = options.category
  if (options?.confidentialityLevel) where.confidentialityLevel = options.confidentialityLevel
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
      orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.knowledgeArticle.count({ where }),
  ])

  return {
    items: items.map(mapArticle),
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
  return mapArticle(article)
}

export async function createArticle(data: {
  title: string
  slug: string
  body: string
  category?: string
  tags?: string
  attachments?: Array<{ url: string; name: string; type: string }>
  validFrom?: string
  validUntil?: string
  ownerId?: string
  confidentialityLevel?: string
  relatedPostId?: string
  relatedQuizPostId?: string
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
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      ownerId: data.ownerId,
      confidentialityLevel: data.confidentialityLevel ?? 'internal',
      relatedPostId: data.relatedPostId,
      relatedQuizPostId: data.relatedQuizPostId,
      authorId: data.authorId,
    },
    include: { author: { select: { name: true } } },
  })

  return mapArticle(article)
}

export async function updateArticle(
  id: string,
  data: {
    title?: string
    body?: string
    category?: string
    tags?: string
    validFrom?: string | null
    validUntil?: string | null
    ownerId?: string | null
    confidentialityLevel?: string
    relatedPostId?: string | null
    relatedQuizPostId?: string | null
  },
): Promise<void> {
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } })
  if (!existing) throw new Error('مقاله یافت نشد')

  await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      ...data,
      version: existing.version + 1,
      validFrom: data.validFrom !== undefined ? (data.validFrom ? new Date(data.validFrom) : null) : undefined,
      validUntil: data.validUntil !== undefined ? (data.validUntil ? new Date(data.validUntil) : null) : undefined,
    },
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

  return articles.map(mapArticle)
}

// ── FAQ Methods ──────────────────────────────────────

export async function listFAQs(category?: string): Promise<KnowledgeFAQData[]> {
  return prisma.knowledgeFAQ.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

export async function createFAQ(data: {
  question: string
  answer: string
  category?: string
  articleId?: string
}): Promise<KnowledgeFAQData> {
  return prisma.knowledgeFAQ.create({ data })
}

export async function deleteFAQ(id: string): Promise<void> {
  await prisma.knowledgeFAQ.delete({ where: { id } })
}
