import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { createPostSchema } from '@/server/dto/content'
import { listPosts, listPostsAdmin, createPost } from '@/server/modules/content/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope')

  // نمای مدیریتی شامل پیش‌نویس‌ها
  if (scope === 'admin') {
    const roleErr = requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)
    const posts = await listPostsAdmin()
    return NextResponse.json({ data: posts })
  }

  const posts = await listPosts(
    {
      type: searchParams.get('type') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      q: searchParams.get('q') ?? undefined,
    },
    user.id,
  )
  return NextResponse.json({ data: posts })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const post = await createPost(parsed.data, user.id)
  return NextResponse.json({ data: post }, { status: 201 })
}
