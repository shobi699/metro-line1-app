import { prisma } from '@/server/db'

export interface AttendanceData {
  id: string
  userId: string
  stationId: string | null
  checkInGeo: string | null
  checkInTime: Date
  checkOutGeo: string | null
  checkOutTime: Date | null
  method: string
  note: string | null
}

export async function checkIn(data: {
  userId: string
  stationId?: string
  geoLocation?: string
  method?: string
}): Promise<AttendanceData> {
  return prisma.attendanceRecord.create({
    data: {
      userId: data.userId,
      stationId: data.stationId,
      checkInGeo: data.geoLocation,
      method: data.method ?? 'gps',
    },
    select: {
      id: true,
      userId: true,
      stationId: true,
      checkInGeo: true,
      checkInTime: true,
      checkOutGeo: true,
      checkOutTime: true,
      method: true,
      note: true,
    },
  })
}

export async function checkOut(
  userId: string,
  geoLocation?: string,
): Promise<void> {
  const lastRecord = await prisma.attendanceRecord.findFirst({
    where: { userId, checkOutTime: null },
    orderBy: { checkInTime: 'desc' },
  })

  if (lastRecord) {
    await prisma.attendanceRecord.update({
      where: { id: lastRecord.id },
      data: {
        checkOutTime: new Date(),
        checkOutGeo: geoLocation,
      },
    })
  }
}

export async function getUserAttendance(
  userId: string,
  options?: { startDate?: Date; endDate?: Date; limit?: number },
): Promise<AttendanceData[]> {
  const where: Record<string, unknown> = { userId }
  if (options?.startDate || options?.endDate) {
    where.checkInTime = {}
    if (options.startDate) (where.checkInTime as Record<string, Date>).gte = options.startDate
    if (options.endDate) (where.checkInTime as Record<string, Date>).lte = options.endDate
  }

  return prisma.attendanceRecord.findMany({
    where,
    orderBy: { checkInTime: 'desc' },
    take: options?.limit ?? 30,
    select: {
      id: true,
      userId: true,
      stationId: true,
      checkInGeo: true,
      checkInTime: true,
      checkOutGeo: true,
      checkOutTime: true,
      method: true,
      note: true,
    },
  })
}

export async function getTodayAttendance(
  userId: string,
): Promise<AttendanceData | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.attendanceRecord.findFirst({
    where: {
      userId,
      checkInTime: { gte: today },
    },
    orderBy: { checkInTime: 'desc' },
    select: {
      id: true,
      userId: true,
      stationId: true,
      checkInGeo: true,
      checkInTime: true,
      checkOutGeo: true,
      checkOutTime: true,
      method: true,
      note: true,
    },
  })
}
