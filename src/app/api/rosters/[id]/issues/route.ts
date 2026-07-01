import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { validateRoster } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

// GET /api/rosters/[id]/issues — فقط خواندنی، بازگرداندن issues اعتبارسنجی. §۷.۴
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params
    const rosterVersion = await prisma.rosterVersion.findUnique({
      where: { id },
      include: { trips: { include: { assignments: true } } },
    })
    if (!rosterVersion) {
      return NextResponse.json({ error: 'نسخه لوحه یافت نشد' }, { status: 404 })
    }

    const issues = await validateRoster(
      rosterVersion.trips,
      rosterVersion.trips.flatMap((t) => t.assignments),
    )
    return NextResponse.json({ data: { issues } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت هشدارها: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
