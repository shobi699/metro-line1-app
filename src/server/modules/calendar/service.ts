/**
 * سرویس تقویم زندگی شیفت‌محور (فاز ۱ — SHIFT_CALENDAR_DESIGN.md)
 * تجمیع لایه‌ها (شیفت + تعطیلات + رویداد شخصی + رویداد سازمانی) در یک پاسخ،
 * CRUD رویدادهای شخصی و ترجیحات تقویم.
 */
import dayjs from 'dayjs'
import { prisma } from '@/server/db'
import { jdate } from '@/lib/dayjs'
import { groupKeyFor } from '@/lib/shift-grouping'
import { calculateShiftForDate } from '@/server/modules/roster/materialize'
import type { CycleShiftDetail, ShiftTemplateData, ShiftAssignmentData } from '@/features/shifts/types'
import type { PersonalEventInput, PersonalEventUpdateInput, CalendarPreferenceInput } from '@/lib/zod/calendar'
import { Prisma } from '@/generated/prisma/client'

// ── انواع خروجی ────────────────────────────────────────

export interface CalendarShiftEntry {
  code: string
  label: string
  startTime: string
  endTime: string
  /** ساعات کارکرد تقریبی این شیفت */
  hours: number
  source: 'cycle' | 'roster' | 'manual'
  /** true یعنی از سیکل پیش‌بینی شده و هنوز در DB/لوحه ثبت نشده */
  forecast: boolean
}

export interface CalendarHolidayEntry {
  id: string
  title: string
  kind: string
  isOffDay: boolean
  color: string | null
}

export interface CalendarEventEntry {
  id: string
  type: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  color: string | null
  location: string | null
  isDone: boolean
  reminders: unknown
  recurrence: unknown
  /** true اگر این رخداد از تکرار سالانه جلالی بازتولید شده باشد */
  occurrence: boolean
}

export interface CalendarOrgEventEntry {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  color: string | null
  mandatory: boolean
}

export interface CalendarDay {
  /** میلادی YYYY-MM-DD */
  date: string
  /** جلالی YYYY-MM-DD (اعداد ASCII) */
  jalali: string
  /** شاخص روز هفته جلالی: شنبه=۰ ... جمعه=۶ */
  weekday: number
  shift: CalendarShiftEntry | null
  holidays: CalendarHolidayEntry[]
  events: CalendarEventEntry[]
  orgEvents: CalendarOrgEventEntry[]
}

/** ساعات پیش‌فرض هر کد شیفت وقتی جزئیات قالب سیکل در دسترس نیست (هم‌راستا با materialize) */
const FALLBACK_HOURS: Record<string, number> = {
  morning: 9,
  evening: 9,
  night: 12,
  office: 8.75,
  off: 0,
}

const DEFAULT_LAYERS = {
  shift: { on: true },
  holidays: { on: true },
  personal: { on: true },
  org: { on: true },
  tasks: { on: true },
}

// ── لایه شیفت (بهینه بازه‌ای؛ برخلاف resolveShiftForUser تک‌روزه) ──

async function resolveShiftLayer(
  userId: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
): Promise<Map<string, CalendarShiftEntry>> {
  const result = new Map<string, CalendarShiftEntry>()

  // شیفت‌های ثبت‌شده در DB — یک کوئری برای کل بازه (با یک روز حاشیه برای اختلاف منطقه زمانی)
  const dbShifts = await prisma.shift.findMany({
    where: {
      userId,
      date: { gte: start.subtract(1, 'day').toDate(), lte: end.add(1, 'day').toDate() },
    },
  })
  const dbByDate = new Map<string, (typeof dbShifts)[number]>()
  for (const s of dbShifts) {
    dbByDate.set(dayjs(s.date).format('YYYY-MM-DD'), s)
  }

  // انتساب و قالب سیکل — یک‌بار برای کل بازه
  const [targetUser, assignments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { customFields: true } }),
    prisma.shiftAssignment.findMany({ include: { template: true } }),
  ])
  const customFields = (targetUser?.customFields as Record<string, unknown> | null) ?? null
  const { group, compositeKey } = groupKeyFor(customFields)
  const assignment =
    assignments.find((a) => a.targetType === 'user' && a.targetId === userId) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === compositeKey) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === group) ??
    assignments.find((a) => a.targetType === 'group' && a.targetId === 'A')

  let templateData: ShiftTemplateData | null = null
  let assignmentData: ShiftAssignmentData | null = null
  if (assignment?.template) {
    templateData = {
      id: assignment.template.id,
      name: assignment.template.name,
      type: assignment.template.type as 'rotational' | 'staff',
      length: assignment.template.length,
      shifts: assignment.template.shifts as unknown as CycleShiftDetail[],
    }
    assignmentData = {
      id: assignment.id,
      templateId: assignment.templateId,
      targetType: assignment.targetType as 'user' | 'group',
      targetId: assignment.targetId,
      anchorDate: dayjs(assignment.anchorDate).format('YYYY-MM-DD'),
    }
  }

  const totalDays = end.diff(start, 'day') + 1
  for (let i = 0; i < totalDays; i++) {
    const day = start.add(i, 'day')
    const key = day.format('YYYY-MM-DD')

    const dbShift = dbByDate.get(key)
    if (dbShift) {
      const cycleDetail =
        templateData && assignmentData ? calculateShiftForDate(day, assignmentData, templateData) : null
      const detail = cycleDetail?.code === dbShift.code ? cycleDetail : null
      result.set(key, {
        code: dbShift.code,
        label: detail?.label ?? dbShift.code,
        startTime: detail?.startTime ?? '',
        endTime: detail?.endTime ?? '',
        hours: detail?.hours ?? FALLBACK_HOURS[dbShift.code] ?? 0,
        source: (dbShift.source as 'cycle' | 'roster' | 'manual') ?? 'manual',
        forecast: false,
      })
      continue
    }

    if (templateData && assignmentData) {
      const detail = calculateShiftForDate(day, assignmentData, templateData)
      if (detail) {
        result.set(key, {
          code: detail.code,
          label: detail.label,
          startTime: detail.startTime,
          endTime: detail.endTime,
          hours: detail.hours ?? FALLBACK_HOURS[detail.code] ?? 0,
          source: 'cycle',
          forecast: true,
        })
      }
    }
  }

  return result
}

// ── لایه تعطیلات ───────────────────────────────────────

async function resolveHolidayLayer(
  jalaliKeys: string[],
): Promise<Map<string, CalendarHolidayEntry[]>> {
  const holidays = await prisma.holiday.findMany({ where: { isActive: true } })
  const result = new Map<string, CalendarHolidayEntry[]>()

  for (const jalali of jalaliKeys) {
    const monthDay = jalali.slice(5) // MM-DD
    const matches = holidays.filter((h) =>
      h.recurring ? h.jalaliDate.slice(5) === monthDay : h.jalaliDate === jalali,
    )
    if (matches.length > 0) {
      result.set(
        jalali,
        matches.map((h) => ({
          id: h.id,
          title: h.title,
          kind: h.kind,
          isOffDay: h.isOffDay,
          color: h.color,
        })),
      )
    }
  }

  return result
}

// ── لایه رویدادهای شخصی (با بسط تکرار سالانه جلالی) ───

function toEventEntry(
  e: {
    id: string
    type: string
    title: string
    description: string | null
    startAt: Date
    endAt: Date | null
    allDay: boolean
    color: string | null
    location: string | null
    isDone: boolean
    reminders: unknown
    recurrence: unknown
  },
  occurrence = false,
  occurrenceDate?: string,
): CalendarEventEntry {
  return {
    id: e.id,
    type: e.type,
    title: e.title,
    description: e.description,
    startAt: occurrenceDate ?? e.startAt.toISOString(),
    endAt: e.endAt?.toISOString() ?? null,
    allDay: e.allDay,
    color: e.color,
    location: e.location,
    isDone: e.isDone,
    reminders: e.reminders,
    recurrence: e.recurrence,
    occurrence,
  }
}

async function resolvePersonalLayer(
  userId: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
): Promise<Map<string, CalendarEventEntry[]>> {
  const events = await prisma.personalEvent.findMany({
    where: {
      userId,
      OR: [
        { startAt: { gte: start.subtract(1, 'day').toDate(), lte: end.add(1, 'day').toDate() } },
        { type: 'birthday' },
        { recurrence: { not: Prisma.DbNull } },
      ],
    },
    orderBy: { startAt: 'asc' },
  })

  const result = new Map<string, CalendarEventEntry[]>()
  const push = (dateKey: string, entry: CalendarEventEntry) => {
    const list = result.get(dateKey) ?? []
    list.push(entry)
    result.set(dateKey, list)
  }

  const totalDays = end.diff(start, 'day') + 1

  for (const e of events) {
    const rec = e.recurrence as {
      freq?: 'yearly' | 'monthly' | 'weekly' | 'daily'
      interval?: number
      until?: string
    } | null
    // تولد همیشه تکرار سالانه جلالی دارد؛ بقیه بر اساس قانون recurrence (همیشه جلالی‌آگاه)
    const freq = e.type === 'birthday' ? 'yearly' : rec?.freq
    const interval = Math.max(1, rec?.interval ?? 1)
    const until = rec?.until ? dayjs(rec.until).endOf('day') : null

    const originalKey = dayjs(e.startAt).format('YYYY-MM-DD')
    const originalDay = dayjs(originalKey)

    if (!freq) {
      if (!originalDay.isBefore(start.startOf('day')) && !originalDay.isAfter(end.endOf('day'))) {
        push(originalKey, toEventEntry(e))
      }
      continue
    }

    // بسط تکرار: پیمایش روزهای بازه و تطبیق با قانون (بازه حداکثر ۴۰۰ روز است)
    const eventJ = jdate(e.startAt)
    for (let i = 0; i < totalDays; i++) {
      const day = start.add(i, 'day')
      if (day.isBefore(originalDay)) continue
      if (until && day.isAfter(until)) continue

      const dayJ = jdate(day.toDate())
      const diffDays = day.diff(originalDay, 'day')
      let matches = false

      switch (freq) {
        case 'yearly':
          // هر سال جلالی، همان ماه/روز جلالی («هر سال ۵ مرداد»)
          matches =
            dayJ.month() === eventJ.month() &&
            dayJ.date() === eventJ.date() &&
            (dayJ.year() - eventJ.year()) % interval === 0
          break
        case 'monthly': {
          // هر ماه جلالی، همان روزِ ماه («هر ماه ۱۵ام» — قسط)
          const monthDiff = (dayJ.year() - eventJ.year()) * 12 + (dayJ.month() - eventJ.month())
          matches = dayJ.date() === eventJ.date() && monthDiff % interval === 0
          break
        }
        case 'weekly':
          matches = diffDays % 7 === 0 && (diffDays / 7) % interval === 0
          break
        case 'daily':
          matches = diffDays % interval === 0
          break
      }

      if (!matches) continue
      const key = day.format('YYYY-MM-DD')
      push(key, toEventEntry(e, key !== originalKey, day.toISOString()))
    }
  }

  return result
}

// ── لایه رویدادهای سازمانی ─────────────────────────────

interface OrgAudience {
  roles?: string[]
  groups?: string[]
  userIds?: string[]
}

function audienceIncludes(audience: OrgAudience, userId: string, roleKey: string, group: string): boolean {
  const roles = audience.roles ?? []
  const groups = audience.groups ?? []
  const userIds = audience.userIds ?? []
  // مخاطب خالی = همه
  if (roles.length === 0 && groups.length === 0 && userIds.length === 0) return true
  return roles.includes(roleKey) || groups.includes(group) || userIds.includes(userId)
}

async function resolveOrgLayer(
  userId: string,
  roleKey: string,
  group: string,
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
): Promise<Map<string, CalendarOrgEventEntry[]>> {
  const events = await prisma.orgEvent.findMany({
    where: {
      isActive: true,
      startAt: { gte: start.subtract(1, 'day').toDate(), lte: end.add(1, 'day').toDate() },
    },
    orderBy: { startAt: 'asc' },
  })

  const result = new Map<string, CalendarOrgEventEntry[]>()
  for (const e of events) {
    if (!audienceIncludes((e.audience as OrgAudience) ?? {}, userId, roleKey, group)) continue
    const key = dayjs(e.startAt).format('YYYY-MM-DD')
    const list = result.get(key) ?? []
    list.push({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt?.toISOString() ?? null,
      allDay: e.allDay,
      color: e.color,
      mandatory: e.mandatory,
    })
    result.set(key, list)
  }

  return result
}

// ── endpoint تجمیعی ────────────────────────────────────

export async function getCalendarRange(params: {
  userId: string
  roleKey: string
  from: string
  to: string
  layers?: string[]
}): Promise<{ from: string; to: string; days: CalendarDay[] }> {
  const start = dayjs(params.from).startOf('day')
  const end = dayjs(params.to).startOf('day')
  const totalDays = end.diff(start, 'day') + 1

  if (totalDays < 1 || totalDays > 400) {
    throw new Error('بازه درخواستی نامعتبر است (حداکثر ۴۰۰ روز)')
  }

  const active = (layer: string) => !params.layers || params.layers.includes(layer)

  const dayKeys: { date: string; jalali: string; weekday: number }[] = []
  for (let i = 0; i < totalDays; i++) {
    const day = start.add(i, 'day')
    const j = jdate(day.toDate())
    dayKeys.push({
      date: day.format('YYYY-MM-DD'),
      jalali: j.format('YYYY-MM-DD'),
      weekday: (day.day() + 1) % 7, // شنبه=۰ ... جمعه=۶
    })
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { customFields: true },
  })
  const { group } = groupKeyFor((targetUser?.customFields as Record<string, unknown> | null) ?? null)

  const [shiftMap, holidayMap, personalMap, orgMap] = await Promise.all([
    active('shift') ? resolveShiftLayer(params.userId, start, end) : new Map<string, CalendarShiftEntry>(),
    active('holidays')
      ? resolveHolidayLayer(dayKeys.map((d) => d.jalali))
      : new Map<string, CalendarHolidayEntry[]>(),
    active('personal')
      ? resolvePersonalLayer(params.userId, start, end)
      : new Map<string, CalendarEventEntry[]>(),
    active('org')
      ? resolveOrgLayer(params.userId, params.roleKey, group, start, end)
      : new Map<string, CalendarOrgEventEntry[]>(),
  ])

  const days: CalendarDay[] = dayKeys.map((d) => ({
    date: d.date,
    jalali: d.jalali,
    weekday: d.weekday,
    shift: shiftMap.get(d.date) ?? null,
    holidays: holidayMap.get(d.jalali) ?? [],
    events: personalMap.get(d.date) ?? [],
    orgEvents: orgMap.get(d.date) ?? [],
  }))

  return { from: params.from, to: params.to, days }
}

// ── CRUD رویدادهای شخصی ────────────────────────────────

export async function createPersonalEvent(userId: string, input: PersonalEventInput) {
  return prisma.personalEvent.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      allDay: input.allDay,
      color: input.color,
      location: input.location,
      recurrence: input.recurrence ? (input.recurrence as Prisma.InputJsonValue) : Prisma.DbNull,
      reminders: input.reminders ? (input.reminders as Prisma.InputJsonValue) : Prisma.DbNull,
      isPrivate: input.isPrivate,
    },
  })
}

export async function listPersonalEvents(userId: string, from: Date, to: Date) {
  return prisma.personalEvent.findMany({
    where: { userId, startAt: { gte: from, lte: to } },
    orderBy: { startAt: 'asc' },
  })
}

/** رویداد فقط توسط مالک قابل تغییر است؛ در غیر این صورت null برمی‌گردد. */
export async function updatePersonalEvent(
  id: string,
  userId: string,
  input: PersonalEventUpdateInput,
) {
  const existing = await prisma.personalEvent.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) return null

  const updated = await prisma.personalEvent.update({
    where: { id },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
      ...(input.endAt !== undefined && { endAt: input.endAt ? new Date(input.endAt) : null }),
      ...(input.allDay !== undefined && { allDay: input.allDay }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.recurrence !== undefined && {
        recurrence: input.recurrence ? (input.recurrence as Prisma.InputJsonValue) : Prisma.DbNull,
      }),
      ...(input.reminders !== undefined && {
        reminders: input.reminders ? (input.reminders as Prisma.InputJsonValue) : Prisma.DbNull,
      }),
      ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
      ...(input.isDone !== undefined && { isDone: input.isDone }),
    },
  })
  return { before: existing, after: updated }
}

export async function deletePersonalEvent(id: string, userId: string) {
  const existing = await prisma.personalEvent.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) return null
  await prisma.personalEvent.delete({ where: { id } })
  return existing
}

export async function togglePersonalTaskDone(id: string, userId: string, isDone: boolean) {
  const existing = await prisma.personalEvent.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) return null
  return prisma.personalEvent.update({ where: { id }, data: { isDone } })
}

// ── ترجیحات تقویم ──────────────────────────────────────

export async function getCalendarPreference(userId: string) {
  const pref = await prisma.calendarPreference.findUnique({ where: { userId } })
  if (pref) return pref
  return prisma.calendarPreference.create({
    data: { userId, layers: DEFAULT_LAYERS },
  })
}

export async function updateCalendarPreference(userId: string, input: CalendarPreferenceInput) {
  const current = await getCalendarPreference(userId)
  const currentLayers = (current.layers as Record<string, unknown>) ?? DEFAULT_LAYERS
  return prisma.calendarPreference.update({
    where: { userId },
    data: {
      ...(input.layers !== undefined && {
        layers: { ...currentLayers, ...input.layers } as Prisma.InputJsonValue,
      }),
      ...(input.defaultView !== undefined && { defaultView: input.defaultView }),
      ...(input.weekStart !== undefined && { weekStart: input.weekStart }),
      ...(input.widgetConfig !== undefined && {
        widgetConfig: input.widgetConfig as Prisma.InputJsonValue,
      }),
    },
  })
}
