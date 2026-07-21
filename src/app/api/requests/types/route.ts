import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getSettingValue } from '@/server/modules/settings/service'
import type { RequestTypeConfig } from '@/lib/zod'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Fetch from settings or use fallback
  const types = await getSettingValue<RequestTypeConfig[]>('requests.types', [])
  
  // Return only enabled types
  const enabledTypes = types.filter(t => t.isEnabled)
  return NextResponse.json({ data: enabledTypes })
}
