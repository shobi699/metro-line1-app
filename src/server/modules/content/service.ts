import { randomUUID } from 'node:crypto'
import { prisma } from '@/server/db'
import type { PostType } from '@/generated/prisma/client'
import type {
  CreatePostInput,
  UpdatePostInput,
} from '@/server/dto/content'

export interface PostListFilter {
  type?: string
  category?: string
  q?: string
}

function makeSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[\s‌]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'post'}-${randomUUID().slice(0, 6)}`
}

function emptyToNull(v?: string | null): string | null {
  return v && v.length > 0 ? v : null
}

function extractPrerequisiteId(body: string): string | null {
  const match = body.match(/\[prerequisite\]([\s\S]*?)\[\/prerequisite\]/)
  return match ? match[1].trim() : null
}

export async function listPosts(filter: PostListFilter, viewerId: string) {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...(filter.type ? { type: filter.type as PostType } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.q
        ? {
            OR: [
              { title: { contains: filter.q } },
              { body: { contains: filter.q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      excerpt: true,
      body: true,
      category: true,
      coverUrl: true,
      mediaUrl: true,
      mediaType: true,
      mandatory: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { reactions: true, comments: true } },
      reactions: { where: { userId: viewerId }, select: { id: true } },
      reads: { where: { userId: viewerId }, select: { id: true } },
    },
  })

  // Fetch all reads of this user to check completion
  const userReads = await prisma.postRead.findMany({
    where: { userId: viewerId },
    select: { postId: true },
  })
  const readPostIds = new Set(userReads.map((r) => r.postId))

  // Fetch all gamification scores of this user (for quizzes)
  const userQuizScores = await prisma.gamificationScore.findMany({
    where: {
      userId: viewerId,
      reason: { startsWith: 'quiz_completed_post_' },
    },
    select: { reason: true },
  })
  const completedQuizPostIds = new Set(
    userQuizScores.map((s) => s.reason.replace('quiz_completed_post_', ''))
  )

  // Helper to check if a post is completed
  const isPostCompleted = (post: { id: string; body: string }) => {
    const hasQuiz = post.body.includes('[quiz]')
    if (hasQuiz) {
      return completedQuizPostIds.has(post.id)
    }
    return readPostIds.has(post.id)
  }

  const prereqIds = new Set<string>()
  posts.forEach((p) => {
    const pid = extractPrerequisiteId(p.body)
    if (pid) prereqIds.add(pid)
  })

  // Fetch titles and slugs for all prerequisites in one query
  const prereqPosts = prereqIds.size > 0
    ? await prisma.post.findMany({
        where: { id: { in: Array.from(prereqIds) } },
        select: { id: true, title: true, slug: true, body: true },
      })
    : []

  const prereqMap = new Map(prereqPosts.map((p) => [p.id, p]))

  return posts.map((p) => {
    const prerequisiteId = extractPrerequisiteId(p.body)
    let prerequisiteTitle: string | null = null
    let prerequisiteSlug: string | null = null
    let prerequisiteCompleted = true

    if (prerequisiteId) {
      const prereqPost = prereqMap.get(prerequisiteId)
      if (prereqPost) {
        prerequisiteTitle = prereqPost.title
        prerequisiteSlug = prereqPost.slug
        prerequisiteCompleted = isPostCompleted(prereqPost)
      }
    }

    const hasQuiz = p.body.includes('[quiz]')
    const isCompleted = hasQuiz ? completedQuizPostIds.has(p.id) : p.reads.length > 0

    return {
      id: p.id,
      type: p.type,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      category: p.category,
      coverUrl: p.coverUrl,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType,
      mandatory: p.mandatory,
      createdAt: p.createdAt,
      authorName: p.author.name,
      likeCount: p._count.reactions,
      commentCount: p._count.comments,
      liked: p.reactions.length > 0,
      read: p.reads.length > 0,
      isCompleted,
      prerequisiteId,
      prerequisiteTitle,
      prerequisiteSlug,
      prerequisiteCompleted,
      hasQuiz,
    }
  })
}

export async function getPostBySlug(slug: string, viewerId: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      body: true,
      category: true,
      coverUrl: true,
      mediaUrl: true,
      mediaType: true,
      mandatory: true,
      published: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { reactions: true, comments: true } },
      reactions: { where: { userId: viewerId }, select: { id: true } },
      reads: { where: { userId: viewerId }, select: { id: true } },
    },
  })
  if (!post) throw new Error('محتوا یافت نشد')

  const prerequisiteId = extractPrerequisiteId(post.body)
  let prerequisiteTitle: string | null = null
  let prerequisiteSlug: string | null = null
  let prerequisiteCompleted = true

  // Fetch all reads of this user to check completion
  const userReads = await prisma.postRead.findMany({
    where: { userId: viewerId },
    select: { postId: true },
  })
  const readPostIds = new Set(userReads.map((r) => r.postId))

  // Fetch all gamification scores of this user (for quizzes)
  const userQuizScores = await prisma.gamificationScore.findMany({
    where: {
      userId: viewerId,
      reason: { startsWith: 'quiz_completed_post_' },
    },
    select: { reason: true },
  })
  const completedQuizPostIds = new Set(
    userQuizScores.map((s) => s.reason.replace('quiz_completed_post_', ''))
  )

  const isPostCompleted = (p: { id: string; body: string }) => {
    const hasQuiz = p.body.includes('[quiz]')
    if (hasQuiz) {
      return completedQuizPostIds.has(p.id)
    }
    return readPostIds.has(p.id)
  }

  if (prerequisiteId) {
    const prereqPost = await prisma.post.findUnique({
      where: { id: prerequisiteId },
      select: { id: true, title: true, slug: true, body: true },
    })
    if (prereqPost) {
      prerequisiteTitle = prereqPost.title
      prerequisiteSlug = prereqPost.slug
      prerequisiteCompleted = isPostCompleted(prereqPost)
    }
  }

  const hasQuiz = post.body.includes('[quiz]')
  const isCompleted = hasQuiz ? completedQuizPostIds.has(post.id) : post.reads.length > 0

  return {
    id: post.id,
    type: post.type,
    title: post.title,
    slug: post.slug,
    body: post.body,
    category: post.category,
    coverUrl: post.coverUrl,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    mandatory: post.mandatory,
    published: post.published,
    createdAt: post.createdAt,
    authorName: post.author.name,
    likeCount: post._count.reactions,
    commentCount: post._count.comments,
    liked: post.reactions.length > 0,
    read: post.reads.length > 0,
    isCompleted,
    prerequisiteId,
    prerequisiteTitle,
    prerequisiteSlug,
    prerequisiteCompleted,
  }
}

export async function listPostsAdmin() {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      category: true,
      published: true,
      mandatory: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { reads: true } },
    },
  })
}

export async function createPost(data: CreatePostInput, authorId: string) {
  const post = await prisma.post.create({
    data: {
      type: data.type,
      title: data.title,
      slug: makeSlug(data.title),
      excerpt: emptyToNull(data.excerpt),
      body: data.body,
      category: emptyToNull(data.category),
      coverUrl: emptyToNull(data.coverUrl),
      mediaUrl: emptyToNull(data.mediaUrl),
      mediaType: emptyToNull(data.mediaType),
      published: data.published,
      mandatory: data.mandatory,
      authorId,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: authorId,
      entity: 'Post',
      entityId: post.id,
      action: 'create',
      after: { title: post.title, type: post.type, published: post.published },
    },
  })

  return post
}

export async function updatePost(
  id: string,
  data: UpdatePostInput,
  actorId: string,
) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) throw new Error('محتوا یافت نشد')

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.excerpt !== undefined ? { excerpt: emptyToNull(data.excerpt) } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.category !== undefined ? { category: emptyToNull(data.category) } : {}),
      ...(data.coverUrl !== undefined ? { coverUrl: emptyToNull(data.coverUrl) } : {}),
      ...(data.mediaUrl !== undefined ? { mediaUrl: emptyToNull(data.mediaUrl) } : {}),
      ...(data.mediaType !== undefined ? { mediaType: emptyToNull(data.mediaType) } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.mandatory !== undefined ? { mandatory: data.mandatory } : {}),
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Post',
      entityId: id,
      action: 'update',
      before: { title: existing.title, published: existing.published },
      after: { title: post.title, published: post.published },
    },
  })

  return post
}

export async function deletePost(id: string, actorId: string) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) throw new Error('محتوا یافت نشد')

  await prisma.post.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Post',
      entityId: id,
      action: 'delete',
      before: { title: existing.title },
    },
  })
}

export async function markPostRead(postId: string, userId: string) {
  await prisma.postRead.upsert({
    where: { postId_userId: { postId, userId } },
    update: {},
    create: { postId, userId },
  })
}

export async function toggleLike(postId: string, userId: string) {
  const existing = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId, userId } },
  })

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.postReaction.create({ data: { postId, userId } })
  }

  const likeCount = await prisma.postReaction.count({ where: { postId } })
  return { liked: !existing, likeCount }
}

export async function addComment(postId: string, userId: string, body: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('محتوا یافت نشد')

  const comment = await prisma.comment.create({
    data: { postId, userId, body },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })

  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    userName: comment.user.name,
  }
}

export async function listComments(postId: string) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    userName: c.user.name,
  }))
}
