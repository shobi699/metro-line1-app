import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requirePermission } from '@/server/rbac/guard'
import { getRadioAnalytics } from '@/server/modules/radio/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'comms:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7', 10)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const data = await getRadioAnalytics({ fromDate })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
