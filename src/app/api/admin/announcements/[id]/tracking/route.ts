import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { getPostAckStats } from '@/server/modules/content/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { id } = await params

  try {
    const stats = await getPostAckStats(id)
    return NextResponse.json({ data: stats })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
