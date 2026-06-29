import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { publishRosterVersion } from '@/server/modules/roster/service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params
    const result = await publishRosterVersion(id, user.id)
    return NextResponse.json({
      success: true,
      message: 'نسخه لوحه با موفقیت تایید و در تقویم راهبران اعمال گردید.',
      data: result
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در انتشار لوحه: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
