import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { listSignagePlaylists, createSignagePlaylist } from '@/server/modules/signage/service'
import { chatBus } from '@/server/realtime/bus'
import { z } from 'zod'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const playlists = await listSignagePlaylists()
    return NextResponse.json({ data: playlists })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'نام پلی‌لیست الزامی است'),
  items: z.array(z.any()),
})

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const parsed = createPlaylistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const playlist = await createSignagePlaylist(parsed.data.name, parsed.data.items)

    // Notify all screens
    chatBus.emit('signage-update', { screenId: 'all' })

    return NextResponse.json({ data: playlist })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
