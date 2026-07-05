import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { matchFaultCode } from '@/server/modules/faults/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:create')
  if (err) return authErrorResponse(err)

  try {
    const { text } = await request.json()
    if (!text || !text.trim()) {
      return NextResponse.json({ data: [] })
    }

    const matches = await matchFaultCode(text)
    return NextResponse.json({ data: matches })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در تطبیق هوشمند کد خطا' }, { status: 500 })
  }
}
