import { prisma } from '@/server/db'
import { Prisma } from '@/generated/prisma/client'
import type { HolidayInput, HolidayUpdateInput, OrgEventAdminInput, OrgEventAdminUpdateInput } from '@/lib/zod/calendar'

// ── تعطیلات CRUD ──────────────────────────────────────

export async function listHolidays(params?: { kind?: string; year?: string }) {
  const where: Prisma.HolidayWhereInput = {}
  if (params?.kind) where.kind = params.kind
  if (params?.year) where.jalaliDate = { startsWith: params.year }
  return prisma.holiday.findMany({ where, orderBy: { jalaliDate: 'asc' } })
}

export async function createHoliday(input: HolidayInput, actorId: string) {
  const holiday = await prisma.holiday.create({
    data: {
      jalaliDate: input.jalaliDate,
      title: input.title,
      kind: input.kind,
      isOffDay: input.isOffDay,
      recurring: input.recurring,
      hijriBased: input.hijriBased,
      color: input.color,
      isActive: input.isActive,
    },
  })
  await prisma.auditLog.create({
    data: { actorId, entity: 'Holiday', entityId: holiday.id, action: 'create', before: {}, after: holiday as unknown as Prisma.InputJsonValue },
  })
  return holiday
}

export async function updateHoliday(id: string, input: HolidayUpdateInput, actorId: string) {
  const existing = await prisma.holiday.findUnique({ where: { id } })
  if (!existing) return null
  const updated = await prisma.holiday.update({
    where: { id },
    data: {
      ...(input.jalaliDate !== undefined && { jalaliDate: input.jalaliDate }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.kind !== undefined && { kind: input.kind }),
      ...(input.isOffDay !== undefined && { isOffDay: input.isOffDay }),
      ...(input.recurring !== undefined && { recurring: input.recurring }),
      ...(input.hijriBased !== undefined && { hijriBased: input.hijriBased }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
  await prisma.auditLog.create({
    data: { actorId, entity: 'Holiday', entityId: id, action: 'update', before: existing as unknown as Prisma.InputJsonValue, after: updated as unknown as Prisma.InputJsonValue },
  })
  return updated
}

export async function deleteHoliday(id: string, actorId: string) {
  const existing = await prisma.holiday.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.holiday.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { actorId, entity: 'Holiday', entityId: id, action: 'delete', before: existing as unknown as Prisma.InputJsonValue, after: {} },
  })
  return existing
}

export interface HolidayImportRow {
  jalaliDate: string
  title: string
  kind?: string
  isOffDay?: boolean
  recurring?: boolean
  hijriBased?: boolean
}

export interface HolidayImportResult {
  total: number
  created: number
  updated: number
  errors: { row: number; message: string }[]
}

export async function importHolidays(rows: HolidayImportRow[], actorId: string): Promise<HolidayImportResult> {
  const result: HolidayImportResult = { total: rows.length, created: 0, updated: 0, errors: [] }

  // 1. Validation Phase
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.jalaliDate || !row.title || row.jalaliDate === 'undefined' || row.title === 'undefined') {
      result.errors.push({ row: i + 1, message: 'تاریخ جلالی و عنوان الزامی است (یا نام ستون‌ها مطابقت ندارد)' })
      continue
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.jalaliDate)) {
      result.errors.push({ row: i + 1, message: `قالب تاریخ نامعتبر: ${row.jalaliDate} (باید فرمت 1405-01-01 باشد)` })
      continue
    }
  }

  // If there are validation errors, abort immediately (No partial commits)
  if (result.errors.length > 0) {
    return result
  }

  // 2. Execution Phase (Transactional)
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const existing = await tx.holiday.findFirst({ where: { jalaliDate: row.jalaliDate, title: row.title } })
      if (existing) {
        await tx.holiday.update({
          where: { id: existing.id },
          data: {
            kind: row.kind ?? existing.kind,
            isOffDay: row.isOffDay ?? existing.isOffDay,
            recurring: row.recurring ?? existing.recurring,
            hijriBased: row.hijriBased ?? existing.hijriBased,
          },
        })
        result.updated++
      } else {
        await tx.holiday.create({
          data: {
            jalaliDate: row.jalaliDate,
            title: row.title,
            kind: row.kind ?? 'official',
            isOffDay: row.isOffDay ?? true,
            recurring: row.recurring ?? true,
            hijriBased: row.hijriBased ?? false,
          },
        })
        result.created++
      }
    }

    await tx.auditLog.create({
      data: { actorId, entity: 'Holiday', entityId: 'import', action: 'import', before: {}, after: { total: result.total, created: result.created, updated: result.updated, errorCount: result.errors.length } as Prisma.InputJsonValue },
    })
  }, {
    maxWait: 5000,
    timeout: 60000, // 60 seconds timeout to handle large sync operations
  })

  return result
}

// ── رویدادهای سازمانی CRUD ────────────────────────────

export async function listOrgEvents(params?: { from?: string; to?: string; mandatory?: boolean }) {
  const where: Prisma.OrgEventWhereInput = {}
  if (params?.from || params?.to) {
    where.startAt = {}
    if (params.from) where.startAt.gte = new Date(params.from)
    if (params.to) where.startAt.lte = new Date(params.to)
  }
  if (params?.mandatory !== undefined) where.mandatory = params.mandatory
  return prisma.orgEvent.findMany({
    where,
    orderBy: { startAt: 'desc' },
    include: { _count: { select: { seenRecords: true } } },
  })
}

export async function createOrgEvent(input: OrgEventAdminInput, actorId: string) {
  const event = await prisma.orgEvent.create({
    data: {
      title: input.title,
      description: input.description,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      allDay: input.allDay,
      audience: input.audience as Prisma.InputJsonValue,
      color: input.color,
      mandatory: input.mandatory,
      createdBy: actorId,
    },
  })
  await prisma.auditLog.create({
    data: { actorId, entity: 'OrgEvent', entityId: event.id, action: 'create', before: {}, after: event as unknown as Prisma.InputJsonValue },
  })
  return event
}

export async function updateOrgEvent(id: string, input: OrgEventAdminUpdateInput, actorId: string) {
  const existing = await prisma.orgEvent.findUnique({ where: { id } })
  if (!existing) return null
  const updated = await prisma.orgEvent.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
      ...(input.endAt !== undefined && { endAt: input.endAt ? new Date(input.endAt) : null }),
      ...(input.allDay !== undefined && { allDay: input.allDay }),
      ...(input.audience !== undefined && { audience: input.audience as Prisma.InputJsonValue }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.mandatory !== undefined && { mandatory: input.mandatory }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  })
  await prisma.auditLog.create({
    data: { actorId, entity: 'OrgEvent', entityId: id, action: 'update', before: existing as unknown as Prisma.InputJsonValue, after: updated as unknown as Prisma.InputJsonValue },
  })
  return updated
}

export async function deleteOrgEvent(id: string, actorId: string) {
  const existing = await prisma.orgEvent.findUnique({ where: { id } })
  if (!existing) return null
  await prisma.orgEvent.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { actorId, entity: 'OrgEvent', entityId: id, action: 'delete', before: existing as unknown as Prisma.InputJsonValue, after: {} },
  })
  return existing
}

export async function markOrgEventSeen(eventId: string, userId: string) {
  return prisma.orgEventSeen.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: {},
    create: { eventId, userId },
  })
}

export async function getOrgEventSeenReport(eventId: string) {
  const event = await prisma.orgEvent.findUnique({
    where: { id: eventId },
    include: { seenRecords: { include: { event: false }, orderBy: { seenAt: 'desc' } } },
  })
  if (!event) return null

  const seenUserIds = event.seenRecords.map((r) => r.userId)
  const seenUsers = seenUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: seenUserIds } },
        select: { id: true, name: true, personnelCode: true },
      })
    : []

  const userMap = new Map(seenUsers.map((u) => [u.id, u]))

  return {
    eventId,
    title: event.title,
    mandatory: event.mandatory,
    totalSeen: event.seenRecords.length,
    records: event.seenRecords.map((r) => ({
      userId: r.userId,
      userName: userMap.get(r.userId)?.name ?? '—',
      personnelCode: userMap.get(r.userId)?.personnelCode ?? '—',
      seenAt: r.seenAt.toISOString(),
    })),
  }
}

// ── تنظیمات تقویم (calendar.* settings) ───────────────

export interface CalendarConfig {
  shiftHours: Record<string, { start: string; end: string; hours: number }>
  smartRules: { bridgeFinder: boolean; conflictWarning: boolean }
  widgetPolicy: { enabled: boolean; updateIntervalMinutes: number }
  icsPolicy: { enabled: boolean; maxTokensPerUser: number }
}

const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  shiftHours: {
    morning: { start: '06:30', end: '14:30', hours: 8 },
    evening: { start: '14:30', end: '22:30', hours: 8 },
    night: { start: '22:30', end: '06:30', hours: 8 },
    office: { start: '07:30', end: '16:15', hours: 8.75 },
    off: { start: '', end: '', hours: 0 },
  },
  smartRules: { bridgeFinder: true, conflictWarning: true },
  widgetPolicy: { enabled: true, updateIntervalMinutes: 30 },
  icsPolicy: { enabled: true, maxTokensPerUser: 1 },
}

export async function getCalendarConfig(): Promise<CalendarConfig> {
  const setting = await prisma.setting.findUnique({ where: { key: 'calendar.config' } })
  if (!setting) return DEFAULT_CALENDAR_CONFIG
  try {
    return { ...DEFAULT_CALENDAR_CONFIG, ...JSON.parse(setting.value) }
  } catch {
    return DEFAULT_CALENDAR_CONFIG
  }
}

export async function updateCalendarConfig(partial: Partial<CalendarConfig>, actorId: string) {
  const current = await getCalendarConfig()
  const merged: CalendarConfig = {
    shiftHours: { ...current.shiftHours, ...(partial.shiftHours ?? {}) },
    smartRules: { ...current.smartRules, ...(partial.smartRules ?? {}) },
    widgetPolicy: { ...current.widgetPolicy, ...(partial.widgetPolicy ?? {}) },
    icsPolicy: { ...current.icsPolicy, ...(partial.icsPolicy ?? {}) },
  }
  const serialized = JSON.stringify(merged)

  await prisma.setting.upsert({
    where: { key: 'calendar.config' },
    update: { value: serialized },
    create: {
      key: 'calendar.config',
      label: 'تنظیمات تقویم',
      description: 'ساعات شیفت، قوانین هوشمند، ویجت و ICS',
      type: 'text',
      value: serialized,
      defaultValue: JSON.stringify(DEFAULT_CALENDAR_CONFIG),
      category: 'calendar',
    },
  })

  await prisma.auditLog.create({
    data: { actorId, entity: 'Setting', entityId: 'calendar.config', action: 'update', before: current as unknown as Prisma.InputJsonValue, after: merged as unknown as Prisma.InputJsonValue },
  })

  return merged
}
