import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'

const dispatchSchema = z.object({
  rosterVersionId: z.string().min(1),
  channels: z.array(z.string()).min(1),
  changesOnly: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)
    
    const roleErr = requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)

    const body = await req.json()
    const result = dispatchSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const { rosterVersionId, channels, changesOnly } = result.data

    // Fetch the roster version to know its date and users
    const rosterVersion = await prisma.rosterVersion.findUnique({
      where: { id: rosterVersionId },
      include: {
        rosterDay: true,
        trips: {
          include: {
            assignments: true
          }
        }
      }
    })

    if (!rosterVersion) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 })
    }

    // Group assignments by user to create dynamic payloads
    const userTrips = new Map<string, any[]>()
    
    rosterVersion.trips.forEach(trip => {
      trip.assignments.forEach(assignment => {
        if (assignment.matchedUserId) {
          const trips = userTrips.get(assignment.matchedUserId) || []
          trips.push(trip)
          userTrips.set(assignment.matchedUserId, trips)
        }
      })
    })

    // Prepare notifications
    const notificationsToCreate = Array.from(userTrips.entries()).map(([userId, trips]) => {
      // Sort trips by departure time to find the first one
      trips.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
      
      const tripCount = trips.length;
      let summaryText = `جزئیات اعزام شما در لوحه (نسخه ${rosterVersion.versionNo}) ثبت شده است.`;
      
      if (tripCount > 0) {
         const firstTrip = trips[0];
         const origin = firstTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش';
         const dest = firstTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری';
         const trainNo = firstTrip.trainNumber || 'نامشخص';
         
         summaryText = `${tripCount} اعزام ثبت شد. اولین: ${firstTrip.departureTime} ${origin}→${dest} قطار ${trainNo}.`;
      }

      return {
        userId,
        type: 'info' as any, // assuming type maps to NotificationType enum
        title: `لوحه ${rosterVersion.rosterDay.jalaliDate} | ${tripCount} اعزام`,
        body: summaryText,
        link: `/schedule/${rosterVersion.rosterDay.jalaliDate}`,
        isRead: false
      }
    })

    // Batch insert notifications
    if (notificationsToCreate.length > 0) {
      // Create in-app notifications
      await prisma.notification.createMany({
        data: notificationsToCreate
      })

      // We can also insert into NotificationOutbox for push/sms if needed
      if (channels.includes('PUSH') || channels.includes('SMS')) {
        const outboxData = notificationsToCreate.map(notif => {
          return {
            eventKey: 'roster.published',
            userId: notif.userId,
            channel: channels.includes('PUSH') ? 'push' : 'sms',
            payload: {
              rosterVersionId,
              date: rosterVersion.rosterDay.jalaliDate,
              title: notif.title,
              body: notif.body
            },
            status: 'queued'
          }
        })
        await prisma.notificationOutbox.createMany({
          data: outboxData
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dispatch successful',
      data: {
        affectedUsers: new Set(notificationsToCreate.map(n => n.userId)).size,
        notificationsSent: notificationsToCreate.length,
        channelsUsed: channels
      }
    })
  } catch (error: any) {
    console.error('Dispatch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
