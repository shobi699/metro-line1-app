import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/server/db'
import { toFa } from '@/lib/fa'

// GET /api/me/trips?date=1404/07/16 — لیست سفرهای شخصی راهبر (§۱۴)
export async function GET(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'احراز هویت الزامی است' }, { status: 401 })
  }

  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }

  let userId: string
  try {
    const { payload } = await jwtVerify(
      authHeader.slice(7),
      new TextEncoder().encode(secret),
    )
    userId = payload.sub as string
  } catch {
    return NextResponse.json({ error: 'توکن نامعتبر' }, { status: 401 })
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  if (!dateParam) {
    return NextResponse.json(
      { error: 'پارامتر date الزامی است (مثال: 1404/07/16)' },
      { status: 400 },
    )
  }

  try {
    // Find RosterDay for given jalali date
    const rosterDay = await prisma.rosterDay.findUnique({
      where: { jalaliDate: dateParam },
      select: { id: true },
    })

    if (!rosterDay) {
      return NextResponse.json({ data: { trips: [], date: dateParam } })
    }

    // Find latest published version
    const version = await prisma.rosterVersion.findFirst({
      where: {
        rosterDayId: rosterDay.id,
        status: 'PUBLISHED',
      },
      orderBy: { versionNo: 'desc' },
      include: {
        trips: {
          orderBy: { rowNo: 'asc' },
          include: {
            assignments: {
              include: {
                matchedUser: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!version) {
      return NextResponse.json({ data: { trips: [], date: dateParam } })
    }

    // Filter trips where this user is assigned
    const myTrips = version.trips
      .filter((trip) =>
        trip.assignments.some((a) => a.matchedUserId === userId),
      )
      .map((trip) => ({
        id: trip.id,
        rowNo: trip.rowNo,
        trainNumber: trip.trainNumber,
        direction: trip.direction,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        operationalNote: trip.operationalNote,
        myRole: trip.assignments.find((a) => a.matchedUserId === userId)?.role ?? null,
        acknowledgedAt: trip.assignments.find((a) => a.matchedUserId === userId)?.acknowledgedAt ?? null,
        readyAt: trip.assignments.find((a) => a.matchedUserId === userId)?.readyAt ?? null,
        handoverAt: trip.assignments.find((a) => a.matchedUserId === userId)?.handoverAt ?? null,
        h2Partner: trip.assignments
          .filter((a) => a.role === 'H2' && a.matchedUserId !== userId)
          .map((a) => ({
            name: a.matchedUser?.name ?? a.rawName,
            userId: a.matchedUserId,
          }))[0] ?? null,
        h1Partner: trip.assignments
          .filter((a) => a.role === 'H1' && a.matchedUserId !== userId)
          .map((a) => ({
            name: a.matchedUser?.name ?? a.rawName,
            userId: a.matchedUserId,
          }))[0] ?? null,
      }))

    return NextResponse.json({
      data: {
        date: dateParam,
        versionNo: version.versionNo,
        trips: myTrips,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطای سرور' },
      { status: 500 },
    )
  }
}
