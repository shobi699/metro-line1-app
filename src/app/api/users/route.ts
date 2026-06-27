import { NextResponse } from 'next/server'
import { userSearchSchema } from '@/server/dto/directory'
import { listUsers } from '@/server/modules/directory/service'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const params = {
    q: searchParams.get('q') ?? '',
    role: searchParams.get('role') ?? '',
    status: searchParams.get('status') ?? '',
    plate: searchParams.get('plate') ?? '',
    page: searchParams.get('page') ?? '1',
    pageSize: searchParams.get('pageSize') ?? '20',
  }

  const parsed = userSearchSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const result = await listUsers(parsed.data)
  return NextResponse.json({ data: result })
}
