import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { validateRosterVersion } from '@/server/modules/roster/validation'
import { prisma } from '@/server/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { versionId } = await params
    const errors = await validateRosterVersion(versionId)

    // Also update the version status based on errors if it's currently PARSED or VALIDATED
    const version = await prisma.rosterVersion.findUnique({ where: { id: versionId } })
    if (version && ['PARSED', 'VALIDATED'].includes(version.status)) {
      const hasErrors = errors.some(e => e.severity === 'error')
      const newStatus = hasErrors ? 'REJECTED' : 'VALIDATED'
      if (newStatus !== version.status) {
        await prisma.rosterVersion.update({
          where: { id: versionId },
          data: { status: newStatus }
        })
      }
    }

    return NextResponse.json({ success: true, errors })
  } catch (error: any) {
    console.error('Validation API Error:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}
