import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { acknowledgeMessage } from '@/server/modules/chat/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { messageId } = await params
  const body = await request.json()

  // استخراج هدرهای دستگاه و IP
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  let device = 'desktop'
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad/i.test(ua)) {
    device = 'tablet'
  } else if (/mobile|android|iphone/i.test(ua)) {
    device = 'mobile'
  }

  // امضای دیجیتال ممیزی
  const signature = `SIGN-SHA256-${user.id}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`

  try {
    const receipts = await acknowledgeMessage(messageId, user.id, {
      device,
      ipAddress,
      signature,
    })

    return NextResponse.json({
      data: {
        receipts,
        signature,
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سرور'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
