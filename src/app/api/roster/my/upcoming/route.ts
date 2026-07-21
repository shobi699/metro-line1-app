import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const url = new URL(request.url)
    const daysParam = url.searchParams.get('days') || '7'
    const days = parseInt(daysParam, 10)

    // Get today's date in Gregorian, then find Jalali date
    const now = new Date()
    const nowStr = now.toISOString()

    // 1. Get recent & upcoming RosterDays
    const rosterDays = await prisma.rosterDay.findMany({
      where: {
        gregorianDate: {
          gte: new Date(new Date().setHours(0,0,0,0))
        },
        status: 'PUBLISHED'
      },
      orderBy: { gregorianDate: 'asc' },
      take: days,
      select: { jalaliDate: true }
    })

    const jalaliDates = rosterDays.map(rd => rd.jalaliDate)

    if (jalaliDates.length === 0) {
      return NextResponse.json({ days: [] })
    }

    // 2. Fetch MyRosterDays
    const myDays = await prisma.myRosterDay.findMany({
      where: {
        userId: user.id,
        jalaliDate: { in: jalaliDates }
      },
      select: {
        jalaliDate: true,
        payload: true
      }
    })

    const responseData = myDays.map(md => {
      // payload is stringified JSON, parse it
      return JSON.parse(md.payload)
    })

    return NextResponse.json({ days: responseData })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت بسته لوحه‌های پیش‌رو: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
