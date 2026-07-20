import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jalaliDate: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { jalaliDate: rawJalaliDate } = await params
    const jalaliDate = decodeURIComponent(rawJalaliDate).replace(/-/g, '/')
    
    // Check if client has ETag
    const ifNoneMatch = request.headers.get('If-None-Match')

    // 1. First find the roster day to get its ID
    const rosterDay = await prisma.rosterDay.findUnique({
      where: { jalaliDate },
      select: { id: true, status: true }
    })

    if (!rosterDay || rosterDay.status !== 'PUBLISHED') {
      return NextResponse.json({
        jalaliDate,
        rosterDayId: null,
        rosterVersionId: null,
        trips: [],
        stats: null
      })
    }

    // 2. Get the precomputed Snapshot
    const snapshot = await prisma.rosterSnapshot.findUnique({
      where: { rosterDayId: rosterDay.id },
      select: {
        payload: true,
        etag: true,
      }
    })

    if (snapshot) {
      const parsed = JSON.parse(snapshot.payload)
      const { applyVisibilityMatrix } = await import('@/server/modules/roster/visibility-filter')
      const filtered = await applyVisibilityMatrix(parsed, user.roleKey)
      return NextResponse.json(filtered)
    }

    // 3. Fallback: If not found, return empty or trigger manual precompute (for old dates)
    return NextResponse.json({
      jalaliDate,
      rosterDayId: rosterDay.id,
      rosterVersionId: null,
      trips: [],
      stats: null,
      message: 'Snapshot not found'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اسنپ‌شات لوحه: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
