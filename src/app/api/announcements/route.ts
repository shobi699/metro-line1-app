import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { listPosts } from '@/server/modules/content/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { searchParams } = new URL(request.url)
    const surface = searchParams.get('surface')

    // Fetch posts of type 'announcement' or general category
    // Let's filter by type = 'announcement' or return all posts since the platform encompasses news/notices as kinds.
    // Wait, the client content feed lists all posts, but the "Announcements Platform" can filter kinds.
    // Let's retrieve posts and filter by kind / surface.
    const posts = await listPosts({}, user.id)

    // Filter by surface if provided
    let filtered = posts
    if (surface) {
      filtered = posts.filter((p) => {
        // surfaces is a Json field, let's cast or check array
        const surfaces = (p as any).surfaces as string[] | null
        if (!surfaces || surfaces.length === 0) {
          // If no surfaces specified, default to feed
          return surface === 'feed'
        }
        return surfaces.includes(surface)
      })
    }

    return NextResponse.json({ data: filtered })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
