import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { publishRosterVersion } from '@/server/modules/roster/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: rosterFileId } = await params

  try {
    const result = await publishRosterVersion(rosterFileId, user.id)

    return NextResponse.json({
      message: 'لوحه شیفت با موفقیت تأیید و در سیستم منتشر گردید.',
      data: result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ثبت نهایی شیفت‌های لوحه'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
