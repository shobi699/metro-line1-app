import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { diffRosterVersions } from '@/server/modules/roster/diff'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  against: z.string().min(1).optional(),
})

// GET /api/rosters/[id]/diff?against=<versionId>
// مقایسه نسخه لوحه با نسخه قبلی منتشرشده (یا نسخه مشخص‌شده). §۸.۲
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({ against: url.searchParams.get('against') ?? undefined })
  if (!parsed.success) {
    return NextResponse.json({ error: 'پارامتر درخواست نامعتبر است' }, { status: 400 })
  }

  try {
    const { id } = await params
    const diff = await diffRosterVersions(id, parsed.data.against)
    if (!diff) {
      return NextResponse.json({ error: 'نسخه لوحه یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ data: diff })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در مقایسه نسخه‌ها: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
