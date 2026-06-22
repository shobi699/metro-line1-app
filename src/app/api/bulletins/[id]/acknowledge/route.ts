import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { acknowledgeBulletin } from '@/server/modules/safety/bulletins'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  const userAgent = request.headers.get('User-Agent')

  try {
    const receipt = await acknowledgeBulletin(id, user.id, userAgent)
    return NextResponse.json({ data: receipt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
