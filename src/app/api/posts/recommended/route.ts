import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import type { PostType } from '@/generated/prisma/client'

const ROLE_TYPE_PREFERENCES: Record<string, PostType[]> = {
  driver: ['training', 'circular', 'directive'],
  operator: ['training', 'circular', 'directive', 'announcement'],
  dispatcher: ['news', 'announcement', 'directive'],
}

const ROLE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  driver: ['ایمنی', ' قطار', 'سیر و حرکت', 'دستورالعمل'],
  operator: ['مدیریت', 'گزارش', 'اخطار'],
  dispatcher: ['دیسپاچینگ', 'OCC', 'فرماندهی'],
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleKey = user.roleKey
  const preferredTypes = ROLE_TYPE_PREFERENCES[roleKey] ?? ['news', 'training', 'announcement']
  const categoryKeywords = ROLE_CATEGORY_KEYWORDS[roleKey] ?? []

  const readPostIds = await prisma.postRead.findMany({
    where: { userId: user.id },
    select: { postId: true },
  })
  const excludeIds = readPostIds.map((r) => r.postId)

  const recommended = await prisma.post.findMany({
    where: {
      status: 'published',
      published: true,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
      OR: [
        { type: { in: preferredTypes } },
        ...(categoryKeywords.length > 0
          ? categoryKeywords.map((kw) => ({ category: { contains: kw } }))
          : []),
        { mandatory: true },
      ],
    },
    orderBy: [{ mandatory: 'desc' }, { createdAt: 'desc' }],
    take: 8,
    select: {
      id: true,
      type: true,
      title: true,
      slug: true,
      excerpt: true,
      coverUrl: true,
      mandatory: true,
      category: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  })

  return NextResponse.json({ data: recommended })
}
