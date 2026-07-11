import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { validateRoster } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

// اجرای اعتبارسنجی روی نسخه لوحه و بازگرداندن issues. §۷
async function runValidation(versionId: string) {
  const rosterVersion = await prisma.rosterVersion.findUnique({
    where: { id: versionId },
    include: { trips: { include: { assignments: true } } },
  })
  if (!rosterVersion) return null
  const issues = await validateRoster(
    rosterVersion.trips,
    rosterVersion.trips.flatMap((t) => t.assignments),
  )
  return { rosterVersion, issues }
}

// POST /api/rosters/[id]/validate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params
    const result = await runValidation(id)
    if (!result) {
      return NextResponse.json({ error: 'نسخه لوحه یافت نشد' }, { status: 404 })
    }
    return NextResponse.json({ data: { issues: result.issues } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در اعتبارسنجی: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
