import { prisma } from '@/server/db'

// ── Types (§۸.۲ مقایسه نسخه‌ها) ──────────────────────────

export type TripFieldKey =
  | 'trainNumber'
  | 'direction'
  | 'departureTime'
  | 'arrivalTime'
  | 'operationalNote'
  | 'status'
  | 'h1'
  | 'h2'

export interface TripFieldChange {
  field: TripFieldKey
  from: string | null
  to: string | null
}

export interface ChangedTrip {
  tripId: string
  rowNo: number
  trainNumber: string | null
  direction: string
  fields: TripFieldChange[]
}

export interface TripSummary {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: string
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  operationalNote: string | null
  status: string
  assignments: {
    role: string
    rawName: string | null
    matchedUserId: string | null
    matchStatus: string
  }[]
}

export interface RosterDiff {
  oldVersionNo: number
  newVersionNo: number
  added: TripSummary[]
  removed: TripSummary[]
  changed: ChangedTrip[]
  /** شناسه راهبرهایی که حداقل یک سفرشان تغییر/حذف/اضافه شده — برای اعلان هدفمند */
  affectedUserIds: string[]
}

// ── Helpers ─────────────────────────────────────────────

/** کلید منطقی تطبیق سفر بین دو نسخه: شماره ردیف + جهت */
function tripKey(t: TripSummary): string {
  return `${t.rowNo}::${t.direction}`
}

/** نام راهبر یک نقش خاص از روی assignments */
function driverForRole(
  trip: TripSummary,
  role: string,
): { name: string | null; userId: string | null } {
  const a = trip.assignments.find((x) => x.role === role)
  return {
    name: a?.rawName ?? null,
    userId: a?.matchedUserId ?? null,
  }
}

function summaryFromTrip(t: any): TripSummary {
  return {
    id: t.id,
    rowNo: t.rowNo,
    trainNumber: t.trainNumber,
    direction: t.direction,
    originStation: t.originStation,
    destinationStation: t.destinationStation,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    operationalNote: t.operationalNote,
    status: t.status,
    assignments: (t.assignments ?? []).map((a: any) => ({
      role: a.role,
      rawName: a.rawName,
      matchedUserId: a.matchedUserId,
      matchStatus: a.matchStatus,
    })),
  }
}

async function loadVersion(
  tx: typeof prisma,
  versionId: string,
): Promise<{ versionNo: number; trips: TripSummary[] } | null> {
  const v = await (tx as any).rosterVersion.findUnique({
    where: { id: versionId },
    include: {
      trips: {
        orderBy: { rowNo: 'asc' },
        include: { assignments: true },
      },
    },
  })
  if (!v) return null
  return { versionNo: v.versionNo, trips: v.trips.map(summaryFromTrip) }
}

// ── Core diff ───────────────────────────────────────────

/**
 * مقایسه دو نسخه لوحه و تولید تغییرات طبق §۸.۲.
 * خروجی شامل سفرهای اضافه/حذف‌شده، فیلدهای تغییرکرده و راهبران متأثر.
 */
export function computeDiff(
  oldV: { versionNo: number; trips: TripSummary[] },
  newV: { versionNo: number; trips: TripSummary[] },
): RosterDiff {
  const oldMap = new Map<string, TripSummary>()
  for (const t of oldV.trips) oldMap.set(tripKey(t), t)

  const newMap = new Map<string, TripSummary>()
  for (const t of newV.trips) newMap.set(tripKey(t), t)

  const added: TripSummary[] = []
  const removed: TripSummary[] = []
  const changed: ChangedTrip[] = []
  const affected = new Set<string>()

  for (const [key, t] of newMap) {
    const oldT = oldMap.get(key)
    if (!oldT) {
      added.push(t)
      for (const a of t.assignments) if (a.matchedUserId) affected.add(a.matchedUserId)
      continue
    }

    const fields: TripFieldChange[] = []

    const scalarFields: TripFieldKey[] = [
      'trainNumber',
      'direction',
      'departureTime',
      'arrivalTime',
      'operationalNote',
      'status',
    ]
    for (const f of scalarFields) {
      const from = (oldT as any)[f] ?? null
      const to = (t as any)[f] ?? null
      if ((from ?? '') !== (to ?? '')) {
        fields.push({ field: f, from, to })
      }
    }

    // H1 / H2 driver changes
    for (const role of ['H1', 'H2'] as const) {
      const oldD = driverForRole(oldT, role)
      const newD = driverForRole(t, role)
      if ((oldD.name ?? '') !== (newD.name ?? '')) {
        fields.push({
          field: role.toLowerCase() as TripFieldKey,
          from: oldD.name,
          to: newD.name,
        })
        if (oldD.userId) affected.add(oldD.userId)
        if (newD.userId) affected.add(newD.userId)
      }
    }

    if (fields.length > 0) {
      changed.push({
        tripId: t.id,
        rowNo: t.rowNo,
        trainNumber: t.trainNumber,
        direction: t.direction,
        fields,
      })
    }
  }

  for (const [key, t] of oldMap) {
    if (!newMap.has(key)) {
      removed.push(t)
      for (const a of t.assignments) if (a.matchedUserId) affected.add(a.matchedUserId)
    }
  }

  return {
    oldVersionNo: oldV.versionNo,
    newVersionNo: newV.versionNo,
    added,
    removed,
    changed,
    affectedUserIds: [...affected],
  }
}

/**
 * بارگذاری دو نسخه از دیتابیس و مقایسه.
 * اگر `againstVersionId` نباشد، نسخه قبلی منتشرشده همان روز مقایسه می‌شود.
 */
export async function diffRosterVersions(
  newVersionId: string,
  againstVersionId?: string,
): Promise<RosterDiff | null> {
  const newV = await loadVersion(prisma, newVersionId)
  if (!newV) return null

  let oldId = againstVersionId

  if (!oldId) {
    const target = await prisma.rosterVersion.findUnique({
      where: { id: newVersionId },
      select: { rosterDayId: true, versionNo: true },
    })
    if (target) {
      const prev = await prisma.rosterVersion.findFirst({
        where: {
          rosterDayId: target.rosterDayId,
          versionNo: { lt: target.versionNo },
        },
        orderBy: { versionNo: 'desc' },
        select: { id: true },
      })
      oldId = prev?.id
    }
  }

  if (!oldId) {
    // نسخه اول است؛ همه سفرها «اضافه‌شده» محسوب می‌شوند
    return computeDiff({ versionNo: 0, trips: [] }, newV)
  }

  const oldV = await loadVersion(prisma, oldId)
  if (!oldV) return computeDiff({ versionNo: 0, trips: [] }, newV)

  return computeDiff(oldV, newV)
}
