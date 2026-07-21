import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { submitPostAck } from '@/server/modules/content/service'
import { z } from 'zod'

const ackSchema = z.object({
  device: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).nullable().optional(),
  signature: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = ackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'اطلاعات ارسالی نامعتبر است' } }, { status: 400 })
    }

    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1'

    const ack = await submitPostAck(id, user.id, {
      device: parsed.data.device || 'web',
      ip: parsed.data.ipAddress || clientIp,
      location: parsed.data.location || null,
      signature: parsed.data.signature || 'تایید شد',
    })

    return NextResponse.json({ data: ack })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
