import { prisma } from '@/server/db'
import type { PostType } from '@/generated/prisma/client'
import type {
  CreatePostInput,
  UpdatePostInput,
} from '@/lib/zod/content'
import { notifyEvent } from '../notifications/gateway'

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
  return `${base || 'post'}-${crypto.randomUUID().slice(0, 6)}`
}

function emptyToNull(v?: string | null): string | null {
  return v && v.length > 0 ? v : null
}

function extractPrerequisiteId(body: string): string | null {
  const match = body.match(/\[prerequisite\]([\s\S]*?)\[\/prerequisite\]/)
  return match ? match[1].trim() : null
}

export async function resolvePostAudienceUserIds(post: { id: string; audience: any }) {
  if (!post.audience) return null

  const aud = post.audience as {
    roles?: string[]
    groups?: string[]
    stations?: string[]
    shiftCodes?: string[]
    userIds?: string[]
  }

  const hasCriteria =
    (aud.roles && aud.roles.length > 0) ||
    (aud.groups && aud.groups.length > 0) ||
    (aud.stations && aud.stations.length > 0) ||
    (aud.shiftCodes && aud.shiftCodes.length > 0) ||
    (aud.userIds && aud.userIds.length > 0)

  if (!hasCriteria) return null

  const allUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, role: { select: { key: true } }, customFields: true },
  })

  const matchedUserIds: string[] = []

  for (const user of allUsers) {
    let match = false

    if (aud.userIds?.includes(user.id)) match = true
    if (aud.roles?.includes(user.role.key)) match = true
    if (aud.stations && aud.stations.length > 0) {
      const userStation = (user.customFields as Record<string, any> | null)?.station
      if (userStation && aud.stations.includes(userStation)) match = true
    }

    if (match) {
      matchedUserIds.push(user.id)
    }
  }

  if (aud.shiftCodes && aud.shiftCodes.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeShifts = await prisma.shift.findMany({
      where: {
        code: { in: aud.shiftCodes as any[] },
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: { userId: true },
    })
    activeShifts.forEach((s) => {
      if (!matchedUserIds.includes(s.userId)) {
        matchedUserIds.push(s.userId)
      }
    })
  }

  return matchedUserIds
}

export async function triggerAnnouncementNotification(post: {
  id: string
  title: string
  slug: string
  kind: string
  audience: any
  notifyRuleKey: string | null
}) {
  try {
    const targetUserIds = await resolvePostAudienceUserIds(post)
    await notifyEvent(
      post.notifyRuleKey || 'announcement.published',
      targetUserIds,
      {
        title: post.title,
        id: post.id,
        slug: post.slug,
        kind: post.kind,
      }
    )
  } catch (err) {
    console.error('Failed to trigger announcement notification:', err)
  }
}

export async function listPosts(filter: PostListFilter, viewerId: string) {
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { id: true, role: { select: { key: true } }, customFields: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const viewerShifts = await prisma.shift.findMany({
    where: {
      userId: viewerId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    select: { code: true },
  })
  const viewerShiftCodes = viewerShifts.map((s) => s.code)

  const dbPosts = await prisma.post.findMany({
    where: {
      status: 'published',
      published: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
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
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
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
      // New Announcement Platform fields
      kind: true,
      audience: true,
      surfaces: true,
      priority: true,
      pinnedUntil: true,
      expiresAt: true,
      ackRequired: true,
      ackDeadline: true,
      bannerStyle: true,
      attachments: true,
      notifyRuleKey: true,
      acks: { where: { userId: viewerId }, select: { id: true } },
    },
  })

  // Target audience in-memory filtering
  const posts = dbPosts.filter((p) => {
    if (!p.audience) return true

    const aud = p.audience as {
      roles?: string[]
      groups?: string[]
      stations?: string[]
      shiftCodes?: string[]
      userIds?: string[]
    }

    const hasCriteria =
      (aud.roles && aud.roles.length > 0) ||
      (aud.groups && aud.groups.length > 0) ||
      (aud.stations && aud.stations.length > 0) ||
      (aud.shiftCodes && aud.shiftCodes.length > 0) ||
      (aud.userIds && aud.userIds.length > 0)

    if (!hasCriteria) return true

    let isMatched = false
    if (aud.userIds?.includes(viewerId)) isMatched = true
    if (viewer && aud.roles?.includes(viewer.role.key)) isMatched = true
    if (viewer && aud.stations && aud.stations.length > 0) {
      const viewerStation = (viewer.customFields as Record<string, any> | null)?.station
      if (viewerStation && aud.stations.includes(viewerStation)) isMatched = true
    }
    if (aud.shiftCodes && aud.shiftCodes.length > 0) {
      if (viewerShiftCodes.some((code) => aud.shiftCodes?.includes(code))) {
        isMatched = true
      }
    }

    return isMatched
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
      kind: p.kind,
      audience: p.audience,
      surfaces: p.surfaces,
      priority: p.priority,
      pinnedUntil: p.pinnedUntil,
      expiresAt: p.expiresAt,
      ackRequired: p.ackRequired,
      ackDeadline: p.ackDeadline,
      bannerStyle: p.bannerStyle,
      attachments: p.attachments,
      notifyRuleKey: p.notifyRuleKey,
      acknowledged: p.acks.length > 0,
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
      // New Announcement Platform fields
      kind: true,
      audience: true,
      surfaces: true,
      priority: true,
      pinnedUntil: true,
      expiresAt: true,
      ackRequired: true,
      ackDeadline: true,
      bannerStyle: true,
      attachments: true,
      notifyRuleKey: true,
      acks: { where: { userId: viewerId }, select: { id: true } },
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
    kind: post.kind,
    audience: post.audience,
    surfaces: post.surfaces,
    priority: post.priority,
    pinnedUntil: post.pinnedUntil,
    expiresAt: post.expiresAt,
    ackRequired: post.ackRequired,
    ackDeadline: post.ackDeadline,
    bannerStyle: post.bannerStyle,
    attachments: post.attachments,
    notifyRuleKey: post.notifyRuleKey,
    acknowledged: post.acks.length > 0,
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
      status: true,
      publishAt: true,
      nextReviewAt: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { reads: true } },
      // New Announcement Platform fields
      kind: true,
      audience: true,
      surfaces: true,
      priority: true,
      pinnedUntil: true,
      expiresAt: true,
      ackRequired: true,
      ackDeadline: true,
      bannerStyle: true,
      attachments: true,
      notifyRuleKey: true,
    },
  })
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['review', 'published'],
  review: ['approved', 'draft'],
  approved: ['published', 'draft'],
  published: ['archived'],
  archived: ['draft'],
}

export async function transitionPostStatus(
  id: string,
  newStatus: string,
  actorId: string,
) {
  const existing = await prisma.post.findUnique({ where: { id } })
  if (!existing) throw new Error('محتوا یافت نشد')

  const allowed = VALID_STATUS_TRANSITIONS[existing.status] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(`تغییر وضعیت از ${existing.status} به ${newStatus} مجاز نیست`)
  }

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'published') {
    updateData.published = true
  } else if (newStatus === 'archived') {
    updateData.published = false
    updateData.archivedAt = new Date()
  } else if (newStatus === 'review') {
    updateData.reviewedById = null
    updateData.reviewedAt = null
  } else if (newStatus === 'approved') {
    updateData.reviewedById = actorId
    updateData.reviewedAt = new Date()
  }

  const post = await prisma.post.update({ where: { id }, data: updateData })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Post',
      entityId: id,
      action: 'update',
      before: { status: existing.status },
      after: { status: newStatus },
    },
  })

  if (newStatus === 'published' && existing.status !== 'published') {
    await triggerAnnouncementNotification(post)
  }

  return post
}

export async function getNonReaders(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('محتوا یافت نشد')

  const readers = await prisma.postRead.findMany({
    where: { postId },
    select: { userId: true },
  })
  const readerIds = new Set(readers.map((r) => r.userId))

  const allUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, personnelCode: true },
  })

  return allUsers
    .filter((u) => !readerIds.has(u.id))
    .map((u) => ({ id: u.id, name: u.name, personnelCode: u.personnelCode }))
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
      tags: data.tags ? data.tags.join(',') : null,
      coverUrl: emptyToNull(data.coverUrl),
      mediaUrl: emptyToNull(data.mediaUrl),
      mediaType: emptyToNull(data.mediaType),
      published: data.published,
      mandatory: data.mandatory,
      status: data.status ?? 'draft',
      publishAt: data.publishAt ? new Date(data.publishAt) : null,
      nextReviewAt: data.nextReviewAt ? new Date(data.nextReviewAt) : null,
      authorId,
      // New Announcement fields
      kind: data.kind ?? 'news',
      audience: (data.audience ?? null) as any,
      surfaces: (data.surfaces ?? null) as any,
      priority: data.priority ?? 0,
      pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      ackRequired: data.ackRequired ?? false,
      ackDeadline: data.ackDeadline ? new Date(data.ackDeadline) : null,
      bannerStyle: (data.bannerStyle ?? null) as any,
      attachments: (data.attachments ?? null) as any,
      notifyRuleKey: data.notifyRuleKey ?? null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: authorId,
      entity: 'Post',
      entityId: post.id,
      action: 'create',
      after: { title: post.title, type: post.type, status: post.status },
    },
  })

  if (post.status === 'published' && post.published) {
    await triggerAnnouncementNotification(post)
  }

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
      ...(data.tags !== undefined ? { tags: data.tags ? data.tags.join(',') : null } : {}),
      ...(data.coverUrl !== undefined ? { coverUrl: emptyToNull(data.coverUrl) } : {}),
      ...(data.mediaUrl !== undefined ? { mediaUrl: emptyToNull(data.mediaUrl) } : {}),
      ...(data.mediaType !== undefined ? { mediaType: emptyToNull(data.mediaType) } : {}),
      ...(data.published !== undefined ? { published: data.published } : {}),
      ...(data.mandatory !== undefined ? { mandatory: data.mandatory } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.publishAt !== undefined ? { publishAt: data.publishAt ? new Date(data.publishAt) : null } : {}),
      ...(data.nextReviewAt !== undefined ? { nextReviewAt: data.nextReviewAt ? new Date(data.nextReviewAt) : null } : {}),
      // New Announcement fields
      ...(data.kind !== undefined ? { kind: data.kind } : {}),
      ...(data.audience !== undefined ? { audience: (data.audience ?? null) as any } : {}),
      ...(data.surfaces !== undefined ? { surfaces: (data.surfaces ?? null) as any } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.pinnedUntil !== undefined ? { pinnedUntil: data.pinnedUntil ? new Date(data.pinnedUntil) : null } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}),
      ...(data.ackRequired !== undefined ? { ackRequired: data.ackRequired } : {}),
      ...(data.ackDeadline !== undefined ? { ackDeadline: data.ackDeadline ? new Date(data.ackDeadline) : null } : {}),
      ...(data.bannerStyle !== undefined ? { bannerStyle: (data.bannerStyle ?? null) as any } : {}),
      ...(data.attachments !== undefined ? { attachments: (data.attachments ?? null) as any } : {}),
      ...(data.notifyRuleKey !== undefined ? { notifyRuleKey: data.notifyRuleKey ?? null } : {}),
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

  if (post.status === 'published' && existing.status !== 'published') {
    await triggerAnnouncementNotification(post)
  }

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

export async function submitPostAck(
  postId: string,
  userId: string,
  metadata: { device?: string; ip?: string; location?: any; signature?: string }
) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('محتوا یافت نشد')

  const ack = await prisma.postAck.upsert({
    where: { postId_userId: { postId, userId } },
    update: {
      device: metadata.device ?? null,
      ip: metadata.ip ?? null,
      location: metadata.location ?? null,
      signature: metadata.signature ?? null,
      ackAt: new Date(),
    },
    create: {
      postId,
      userId,
      device: metadata.device ?? null,
      ip: metadata.ip ?? null,
      location: metadata.location ?? null,
      signature: metadata.signature ?? null,
      ackAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      entity: 'PostAck',
      entityId: ack.id,
      action: 'create',
      after: { postId, userId, device: metadata.device },
    },
  })

  return ack
}

export async function getPostAckStats(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post) throw new Error('محتوا یافت نشد')

  let targetUserIds = await resolvePostAudienceUserIds(post)
  if (!targetUserIds) {
    const allActive = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true },
    })
    targetUserIds = allActive.map((u) => u.id)
  }

  const targetCount = targetUserIds.length

  const targets = await prisma.user.findMany({
    where: { id: { in: targetUserIds } },
    select: {
      id: true,
      name: true,
      personnelCode: true,
      role: { select: { key: true, title: true } },
      customFields: true,
    },
  })

  const acks = await prisma.postAck.findMany({
    where: { postId, userId: { in: targetUserIds } },
    select: { userId: true, ackAt: true, device: true, ip: true, location: true, signature: true },
  })

  const ackedUserIds = new Set(acks.map((a) => a.userId))
  const ackMap = new Map(acks.map((a) => [a.userId, a]))

  const acknowledgedList: any[] = []
  const remainingList: any[] = []

  const roleBreakdown: Record<string, { total: number; acked: number }> = {}
  const stationBreakdown: Record<string, { total: number; acked: number }> = {}

  targets.forEach((u) => {
    const isAcked = ackedUserIds.has(u.id)
    const roleKey = u.role.title || u.role.key
    const station = (u.customFields as Record<string, any> | null)?.station || 'سایر'

    if (!roleBreakdown[roleKey]) roleBreakdown[roleKey] = { total: 0, acked: 0 }
    roleBreakdown[roleKey].total++
    if (isAcked) roleBreakdown[roleKey].acked++

    if (!stationBreakdown[station]) stationBreakdown[station] = { total: 0, acked: 0 }
    stationBreakdown[station].total++
    if (isAcked) stationBreakdown[station].acked++

    const userAckInfo = ackMap.get(u.id)

    const item = {
      userId: u.id,
      name: u.name,
      personnelCode: u.personnelCode,
      role: roleKey,
      station,
      ackAt: userAckInfo?.ackAt || null,
      device: userAckInfo?.device || null,
      ip: userAckInfo?.ip || null,
      location: userAckInfo?.location || null,
      signature: userAckInfo?.signature || null,
    }

    if (isAcked) {
      acknowledgedList.push(item)
    } else {
      remainingList.push(item)
    }
  })

  const ackCount = acks.length
  const percentage = targetCount > 0 ? Math.round((ackCount / targetCount) * 100) : 0

  return {
    postId,
    title: post.title,
    targetCount,
    ackCount,
    percentage,
    roleBreakdown,
    stationBreakdown,
    acknowledgedList,
    remainingList,
  }
}
