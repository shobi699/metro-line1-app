import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { listSignageScreens, createSignageScreen } from '@/server/modules/signage/service'
import { chatBus } from '@/server/realtime/bus'
import { z } from 'zod'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const screens = await listSignageScreens()
    return NextResponse.json({ data: screens })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}

const createScreenSchema = z.object({
  name: z.string().min(1, 'نام صفحه الزامی است'),
  location: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  try {
    const body = await request.json()
    const parsed = createScreenSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const screen = await createSignageScreen(parsed.data.name, parsed.data.location)

    // Notify all monitors
    chatBus.emit('signage-update', { screenId: 'all' })

    return NextResponse.json({ data: screen })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
