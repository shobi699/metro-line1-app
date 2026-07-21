import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, type AuthUser } from '@/server/rbac/guard'
import { verifyAccessToken } from '@/server/auth/jwt'
import { rankForRoleKey } from '@/server/rbac/permissions'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

/** احراز هویت از طریق cookie یا ?token= query param (برای اشتراک‌گذاری تقویم) */
async function authenticateRequest(request: Request): Promise<AuthUser | { error: string; status: number }> {
  // ۱. سعی از Authorization header / cookie
  const user = await getSessionUser(request)
  if (!('error' in user)) return user

  // ۲. سعی از ?token= query param
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return user // ارسال همان خطای اصلی

  try {
    const payload = await verifyAccessToken(token)
    return {
      id: payload.sub!,
      personnelCode: payload.personnelCode,
      roleKey: payload.roleKey,
      rank: typeof payload.rank === 'number' ? payload.rank : rankForRoleKey(payload.roleKey),
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    }
  } catch {
    return { error: 'توکن نامعتبر یا منقضی شده', status: 401 }
  }
}

// Helper to format date into iCal format: YYYYMMDDTHHMMSS
function formatCalDate(dateStr: string, timeStr: string | null): string {
  const cleanDate = dateStr.replace(/-/g, '') // "2026-06-29" -> "20260629"
  const cleanTime = timeStr ? timeStr.replace(/:/g, '') + '00' : '000000' // "05:30" -> "053000"
  return `${cleanDate}T${cleanTime}`
}

export async function GET(request: Request) {
  const user = await authenticateRequest(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    // Fetch user's assigned trips from published versions only
    const trips = await prisma.trip.findMany({
      where: {
        assignments: {
          some: {
            matchedUserId: user.id,
          },
        },
        rosterVersion: {
          status: 'PUBLISHED',
        },
      },
      include: {
        assignments: {
          where: { matchedUserId: user.id },
        },
        rosterVersion: {
          include: { rosterDay: true },
        },
      },
    })

    if (trips.length === 0) {
      return NextResponse.json(
        { error: 'هیچ سفر زمان‌بندی‌شده‌ای برای شما یافت نشد.' },
        { status: 404 }
      )
    }

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tehran Metro Line 1//Roster Calendar Sync//FA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ]

    for (const trip of trips) {
      const rosterDay = trip.rosterVersion.rosterDay
      const assignment = trip.assignments[0] // Since we filtered by matchedUserId
      if (!rosterDay || !assignment) continue

      const startCal = formatCalDate(rosterDay.gregorianDate.toISOString().split('T')[0], trip.departureTime)
      const endCal = formatCalDate(rosterDay.gregorianDate.toISOString().split('T')[0], trip.arrivalTime)
      const dtstamp = formatCalDate(
        new Date().toISOString().split('T')[0],
        new Date().toTimeString().split(' ')[0].substring(0, 5)
      )

      const roleLabel = assignment.role === 'H1' ? 'راهبر اصلی (H1)' : 'راهبر کمکی (H2)'
      const summary = `قطار ${trip.trainNumber || '—'} - ${roleLabel}`
      const description = `مسیر: ${trip.originStation || '—'} به ${trip.destinationStation || '—'}\\n` +
                          `تاریخ عملیاتی: ${rosterDay.jalaliDate}\\n` +
                          `توضیحات: ${trip.operationalNote || 'بدون توضیحات'}`

      icalContent.push(
        'BEGIN:VEVENT',
        `UID:trip-${trip.id}-${assignment.id}@metro1.ir`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${startCal}`,
        `DTEND:${endCal}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'LOCATION:خط ۱ مترو تهران',
        'END:VEVENT'
      )
    }

    icalContent.push('END:VCALENDAR')
    const responseText = icalContent.join('\r\n')

    return new Response(responseText, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="metro-roster-${user.id}.ics"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در تولید فایل تقویم: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
