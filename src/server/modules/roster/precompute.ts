/**
 * موتور پیش‌محاسبه لوحه (Roster Platform v2 — فاز ۱)
 *
 * اصل: هزینه محاسبه یک‌بار در لحظه انتشار پرداخت می‌شود — نه در هر بازدید.
 *
 * ۱. RosterSnapshot: JSON کامل لوحه روز → نمای عمومی/سرشیفت/OCC = یک SELECT تک‌ردیفی
 * ۲. MyRosterDay: برش شخصی هر کاربر → «روز من» = یک ردیف، <100ms
 */
import { createHash } from 'crypto'
import { prisma } from '@/server/db'

// ── Types ────────────────────────────────────────────────

export interface SnapshotTrip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: string
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  status: string
  operationalNote: string | null
  assignments: SnapshotAssignment[]
}

export interface SnapshotAssignment {
  id: string
  role: string
  rawName: string | null
  matchedUserId: string | null
  matchedUserName: string | null
  personnelNo: string | null
  matchScore: number | null
  matchStatus: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
}

export interface SnapshotPayload {
  jalaliDate: string
  gregorianDate: string
  title: string | null
  schedulingTitle: string | null
  versionNo: number
  rosterDayId: string
  rosterVersionId: string
  publishedAt: string | null
  trips: SnapshotTrip[]
  stats: {
    totalTrips: number
    tajrishToShahrrey: number
    shahrreyToTajrish: number
    totalAssignments: number
    matchedAssignments: number
    acknowledgedCount: number
    readyCount: number
    handoverCount: number
    disputeCount: number
  }
}

export interface MyRosterPayload {
  jalaliDate: string
  gregorianDate: string
  title: string | null
  schedulingTitle: string | null
  versionNo: number
  rosterDayId: string
  rosterVersionId: string
  trips: MyRosterTrip[]
  totalTrips: number
  nextDepartureTime: string | null
}

export interface MyRosterTrip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: string
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  status: string
  operationalNote: string | null
  myRole: string
  assignmentId: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  coCrew: { role: string; name: string | null }[]
}

// ── Helpers ──────────────────────────────────────────────

function generateEtag(payload: string): string {
  return createHash('md5').update(payload).digest('hex')
}

// ── Build Snapshot ───────────────────────────────────────

/**
 * ساخت RosterSnapshot: JSON کامل لوحه نرمال‌شده
 * idempotent بر اساس versionNo
 */
export async function buildSnapshot(
  rosterDayId: string,
  versionNo: number,
): Promise<{ snapshotId: string; etag: string }> {
  // بارگذاری RosterDay + آخرین نسخه منتشرشده + همه سفرها + انتساب‌ها
  const rosterDay = await prisma.rosterDay.findUnique({
    where: { id: rosterDayId },
    include: {
      versions: {
        where: { versionNo },
        take: 1,
        include: {
          trips: {
            orderBy: { departureTime: 'asc' },
            include: {
              assignments: {
                include: {
                  matchedUser: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!rosterDay || rosterDay.versions.length === 0) {
    throw new Error(`RosterDay ${rosterDayId} با نسخه ${versionNo} یافت نشد`)
  }

  const version = rosterDay.versions[0]

  // ساخت trips نرمال‌شده
  const trips: SnapshotTrip[] = version.trips.map((trip) => ({
    id: trip.id,
    rowNo: trip.rowNo,
    trainNumber: trip.trainNumber,
    direction: trip.direction,
    originStation: trip.originStation,
    destinationStation: trip.destinationStation,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    status: trip.status,
    operationalNote: trip.operationalNote,
    assignments: trip.assignments.map((a) => ({
      id: a.id,
      role: a.role,
      rawName: a.rawName,
      matchedUserId: a.matchedUserId,
      matchedUserName: a.matchedUser?.name ?? null,
      personnelNo: a.personnelNo,
      matchScore: a.matchScore,
      matchStatus: a.matchStatus,
      acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
      readyAt: a.readyAt?.toISOString() ?? null,
      handoverAt: a.handoverAt?.toISOString() ?? null,
      disputed: a.disputed,
      disputeNote: a.disputeNote,
    })),
  }))

  // آمار
  let acknowledgedCount = 0
  let readyCount = 0
  let handoverCount = 0
  let disputeCount = 0
  let totalAssignments = 0
  let matchedAssignments = 0

  for (const trip of trips) {
    for (const a of trip.assignments) {
      totalAssignments++
      if (a.matchedUserId) matchedAssignments++
      if (a.acknowledgedAt) acknowledgedCount++
      if (a.readyAt) readyCount++
      if (a.handoverAt) handoverCount++
      if (a.disputed) disputeCount++
    }
  }

  const payload: SnapshotPayload = {
    jalaliDate: rosterDay.jalaliDate,
    gregorianDate: rosterDay.gregorianDate.toISOString(),
    title: rosterDay.title,
    schedulingTitle: rosterDay.schedulingTitle,
    versionNo,
    rosterDayId: rosterDay.id,
    rosterVersionId: version.id,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    trips,
    stats: {
      totalTrips: trips.length,
      tajrishToShahrrey: trips.filter((t) => t.direction === 'TAJRISH_TO_SHAHRREY').length,
      shahrreyToTajrish: trips.filter((t) => t.direction === 'SHAHRREY_TO_TAJRISH').length,
      totalAssignments,
      matchedAssignments,
      acknowledgedCount,
      readyCount,
      handoverCount,
      disputeCount,
    },
  }

  const payloadStr = JSON.stringify(payload)
  const etag = generateEtag(payloadStr)

  // Upsert snapshot — idempotent
  const snapshot = await prisma.rosterSnapshot.upsert({
    where: { rosterDayId },
    update: {
      versionNo,
      payload: payloadStr,
      etag,
      builtAt: new Date(),
    },
    create: {
      rosterDayId,
      versionNo,
      payload: payloadStr,
      etag,
    },
  })

  return { snapshotId: snapshot.id, etag }
}

// ── Build MyRosterDay ───────────────────────────────────

/**
 * ساخت MyRosterDay: برش شخصی برای هر کاربر حاضر در لوحه
 */
export async function buildMyRosterDays(
  rosterDayId: string,
  versionNo: number,
): Promise<{ userCount: number }> {
  const rosterDay = await prisma.rosterDay.findUnique({
    where: { id: rosterDayId },
    include: {
      versions: {
        where: { versionNo },
        take: 1,
        include: {
          trips: {
            orderBy: { departureTime: 'asc' },
            include: {
              assignments: {
                include: {
                  matchedUser: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!rosterDay || rosterDay.versions.length === 0) {
    throw new Error(`RosterDay ${rosterDayId} با نسخه ${versionNo} یافت نشد`)
  }

  const version = rosterDay.versions[0]
  const jalaliDate = rosterDay.jalaliDate

  // گروه‌بندی سفرها بر اساس userId
  const userTripsMap = new Map<string, MyRosterTrip[]>()

  for (const trip of version.trips) {
    for (const assignment of trip.assignments) {
      if (!assignment.matchedUserId) continue

      const userId = assignment.matchedUserId

      if (!userTripsMap.has(userId)) {
        userTripsMap.set(userId, [])
      }

      // همخدمه (co-crew): سایر انتساب‌های همان سفر
      const coCrew = trip.assignments
        .filter((a) => a.id !== assignment.id && a.matchedUserId)
        .map((a) => ({
          role: a.role,
          name: a.matchedUser?.name ?? a.rawName ?? null,
        }))

      userTripsMap.get(userId)!.push({
        id: trip.id,
        rowNo: trip.rowNo,
        trainNumber: trip.trainNumber,
        direction: trip.direction,
        originStation: trip.originStation,
        destinationStation: trip.destinationStation,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        operationalNote: trip.operationalNote,
        myRole: assignment.role,
        assignmentId: assignment.id,
        acknowledgedAt: assignment.acknowledgedAt?.toISOString() ?? null,
        readyAt: assignment.readyAt?.toISOString() ?? null,
        handoverAt: assignment.handoverAt?.toISOString() ?? null,
        disputed: assignment.disputed,
        disputeNote: assignment.disputeNote,
        coCrew,
      })
    }
  }

  // محاسبه سفر بعدی (اولین سفر بدون handover)
  function findNextDeparture(trips: MyRosterTrip[]): string | null {
    const upcoming = trips.find((t) => !t.handoverAt && t.departureTime)
    return upcoming?.departureTime ?? null
  }

  // Batch upsert — هر کاربر یک MyRosterDay
  const upsertPromises: Promise<unknown>[] = []

  for (const [userId, userTrips] of userTripsMap) {
    // مرتب‌سازی بر اساس ساعت حرکت
    userTrips.sort((a, b) => (a.departureTime ?? '').localeCompare(b.departureTime ?? ''))

    const payload: MyRosterPayload = {
      jalaliDate,
      gregorianDate: rosterDay.gregorianDate.toISOString(),
      title: rosterDay.title,
      schedulingTitle: rosterDay.schedulingTitle,
      versionNo,
      rosterDayId: rosterDay.id,
      rosterVersionId: version.id,
      trips: userTrips,
      totalTrips: userTrips.length,
      nextDepartureTime: findNextDeparture(userTrips),
    }

    const payloadStr = JSON.stringify(payload)
    const etag = generateEtag(payloadStr)

    upsertPromises.push(
      prisma.myRosterDay.upsert({
        where: { userId_jalaliDate: { userId, jalaliDate } },
        update: {
          versionNo,
          payload: payloadStr,
          etag,
          builtAt: new Date(),
        },
        create: {
          userId,
          jalaliDate,
          versionNo,
          payload: payloadStr,
          etag,
        },
      }),
    )
  }

  await Promise.all(upsertPromises)

  return { userCount: userTripsMap.size }
}

// ── Precompute on Publish ───────────────────────────────

/**
 * نقطه ورود اصلی: پس از انتشار نسخه لوحه فراخوانی شود.
 * idempotent — می‌توان بدون خطر دوبار اجرا کرد.
 */
export async function precomputeOnPublish(
  rosterVersionId: string,
): Promise<{
  snapshotId: string
  etag: string
  userCount: number
  durationMs: number
}> {
  const start = Date.now()

  // یافتن نسخه و روز مربوطه
  const version = await prisma.rosterVersion.findUnique({
    where: { id: rosterVersionId },
    select: { rosterDayId: true, versionNo: true },
  })

  if (!version) {
    throw new Error(`RosterVersion ${rosterVersionId} یافت نشد`)
  }

  // ۱. ساخت Snapshot
  const { snapshotId, etag } = await buildSnapshot(version.rosterDayId, version.versionNo)

  // ۲. ساخت MyRosterDay ها
  const { userCount } = await buildMyRosterDays(version.rosterDayId, version.versionNo)

  const durationMs = Date.now() - start

  return { snapshotId, etag, userCount, durationMs }
}

/**
 * به‌روزرسانی دلتای MyRosterDay: فقط کاربران متاثر
 * (برای استفاده در اصلاحیه — فاز ۲)
 */
export async function rebuildMyRosterDayForUsers(
  rosterDayId: string,
  versionNo: number,
  userIds: string[],
): Promise<void> {
  if (userIds.length === 0) return

  // بازسازی کامل — اما فقط برای کاربران مشخص‌شده
  const rosterDay = await prisma.rosterDay.findUnique({
    where: { id: rosterDayId },
    include: {
      versions: {
        where: { versionNo },
        take: 1,
        include: {
          trips: {
            orderBy: { departureTime: 'asc' },
            include: {
              assignments: {
                where: { matchedUserId: { in: userIds } },
                include: {
                  matchedUser: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!rosterDay || rosterDay.versions.length === 0) return

  const version = rosterDay.versions[0]
  const jalaliDate = rosterDay.jalaliDate

  // همه انتساب‌ها (برای co-crew نیاز است)
  const allTripsWithAssignments = await prisma.trip.findMany({
    where: { rosterVersionId: version.id },
    include: {
      assignments: {
        include: { matchedUser: { select: { id: true, name: true } } },
      },
    },
  })

  const allTripsMap = new Map(allTripsWithAssignments.map((t) => [t.id, t]))

  for (const userId of userIds) {
    const userTrips: MyRosterTrip[] = []

    for (const trip of version.trips) {
      for (const assignment of trip.assignments) {
        if (assignment.matchedUserId !== userId) continue

        const fullTrip = allTripsMap.get(trip.id)
        const coCrew = (fullTrip?.assignments ?? [])
          .filter((a) => a.id !== assignment.id && a.matchedUserId)
          .map((a) => ({
            role: a.role,
            name: a.matchedUser?.name ?? a.rawName ?? null,
          }))

        userTrips.push({
          id: trip.id,
          rowNo: trip.rowNo,
          trainNumber: trip.trainNumber,
          direction: trip.direction,
          originStation: trip.originStation,
          destinationStation: trip.destinationStation,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          status: trip.status,
          operationalNote: trip.operationalNote,
          myRole: assignment.role,
          assignmentId: assignment.id,
          acknowledgedAt: assignment.acknowledgedAt?.toISOString() ?? null,
          readyAt: assignment.readyAt?.toISOString() ?? null,
          handoverAt: assignment.handoverAt?.toISOString() ?? null,
          disputed: assignment.disputed,
          disputeNote: assignment.disputeNote,
          coCrew,
        })
      }
    }

    userTrips.sort((a, b) => (a.departureTime ?? '').localeCompare(b.departureTime ?? ''))

    const nextDeparture = userTrips.find((t) => !t.handoverAt && t.departureTime)?.departureTime ?? null

    const payload: MyRosterPayload = {
      jalaliDate,
      gregorianDate: rosterDay.gregorianDate.toISOString(),
      title: rosterDay.title,
      schedulingTitle: rosterDay.schedulingTitle,
      versionNo,
      rosterDayId: rosterDay.id,
      rosterVersionId: version.id,
      trips: userTrips,
      totalTrips: userTrips.length,
      nextDepartureTime: nextDeparture,
    }

    const payloadStr = JSON.stringify(payload)
    const etag = generateEtag(payloadStr)

    await prisma.myRosterDay.upsert({
      where: { userId_jalaliDate: { userId, jalaliDate } },
      update: {
        versionNo,
        payload: payloadStr,
        etag,
        builtAt: new Date(),
      },
      create: {
        userId,
        jalaliDate,
        versionNo,
        payload: payloadStr,
        etag,
      },
    })
  }
}
