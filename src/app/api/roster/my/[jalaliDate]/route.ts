import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
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

    // 1. Try to get precomputed MyRosterDay
    const myDay = await prisma.myRosterDay.findUnique({
      where: {
        userId_jalaliDate: {
          userId: user.id,
          jalaliDate,
        }
      },
      select: {
        payload: true,
        etag: true,
      }
    })

    if (myDay) {
      if (ifNoneMatch === myDay.etag) {
        return new NextResponse(null, { status: 304 }) // Not Modified
      }
      
      const response = new NextResponse(myDay.payload, {
        headers: {
          'Content-Type': 'application/json',
          'ETag': myDay.etag,
        }
      })
      return response
    }

    // 2. Fallback: If not found, it might be an older date without precompute or no trips
    return NextResponse.json({
      jalaliDate,
      rosterDayId: null,
      rosterVersionId: null,
      trips: [],
      totalTrips: 0,
      nextDepartureTime: null
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت برنامه لوحه: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
