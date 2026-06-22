import { prisma } from '@/server/db'
import type { RoleKey } from '@/generated/prisma/client'

export interface ShiftWithUser {
  id: string
  date: Date
  code: string
  note: string | null
  user: { id: string; name: string; nationalId: string }
}

export async function getUserShifts(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<ShiftWithUser[]> {
  return prisma.shift.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      user: { select: { id: true, name: true, nationalId: true } },
    },
    orderBy: { date: 'asc' },
  })
}

export async function getAllShifts(
  startDate: Date,
  endDate: Date,
  roleFilter?: RoleKey,
): Promise<ShiftWithUser[]> {
  const where: Record<string, unknown> = {
    date: { gte: startDate, lte: endDate },
  }

  if (roleFilter) {
    where.user = { role: { key: roleFilter } }
  }

  return prisma.shift.findMany({
    where: where as never,
    include: {
      user: { select: { id: true, name: true, nationalId: true } },
    },
    orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }],
  })
}

export async function getShiftsByMonth(
  year: number,
  month: number,
  userId?: string,
): Promise<ShiftWithUser[]> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  if (userId) {
    return getUserShifts(userId, startDate, endDate)
  }
  return getAllShifts(startDate, endDate)
}
