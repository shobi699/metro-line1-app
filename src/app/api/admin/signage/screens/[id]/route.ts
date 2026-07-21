import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { updateSignageScreen, deleteSignageScreen } from '@/server/modules/signage/service'
import { chatBus } from '@/server/realtime/bus'
import { z } from 'zod'

const updateScreenSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional().nullable(),
  playlistId: z.string().optional().nullable(),
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
    const parsed = updateScreenSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const screen = await updateSignageScreen(id, parsed.data)

    // Notify the specific screen to update immediately
    chatBus.emit('signage-update', { screenId: id })

    return NextResponse.json({ data: screen })
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
    await deleteSignageScreen(id)

    // Notify the screen (so it handles removal)
    chatBus.emit('signage-update', { screenId: id })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
