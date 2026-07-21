import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { updateSignagePlaylist, deleteSignagePlaylist } from '@/server/modules/signage/service'
import { chatBus } from '@/server/realtime/bus'
import { z } from 'zod'

const updatePlaylistSchema = z.object({
  name: z.string().optional(),
  items: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = updatePlaylistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const playlist = await updateSignagePlaylist(id, parsed.data)

    // Notify all screens
    chatBus.emit('signage-update', { screenId: 'all' })

    return NextResponse.json({ data: playlist })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { id } = await params

  try {
    await deleteSignagePlaylist(id)

    // Notify all screens
    chatBus.emit('signage-update', { screenId: 'all' })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
