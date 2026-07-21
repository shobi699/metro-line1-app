import { prisma } from '@/server/db'
import dayjs from 'dayjs'

export type SwapRuleResult = {
  success: boolean
  errorCode?: string
  errorMessage?: string
}

const MIN_REST_HOURS = 8
const MAX_CONSECUTIVE_DAYS = 6

export async function validateSwapRequest(
  requesterId: string,
  targetId: string,
  sourceAssignmentId: string,
  targetAssignmentId: string
): Promise<SwapRuleResult> {
  // 1. Fetch assignments
  const sourceAssignment = await prisma.tripAssignment.findUnique({
    where: { id: sourceAssignmentId },
    include: { trip: true }
  })
  
  const targetAssignment = await prisma.tripAssignment.findUnique({
    where: { id: targetAssignmentId },
    include: { trip: true }
  })

  if (!sourceAssignment || !targetAssignment) {
    return { success: false, errorCode: 'NOT_FOUND', errorMessage: 'سفرهای موردنظر یافت نشدند.' }
  }

  // Ensure they belong to the correct users
  if (sourceAssignment.matchedUserId !== requesterId) {
    return { success: false, errorCode: 'INVALID_OWNER', errorMessage: 'شما مالک این سفر نیستید.' }
  }

  if (targetAssignment.matchedUserId !== targetId) {
    return { success: false, errorCode: 'INVALID_TARGET', errorMessage: 'سفر مقصد متعلق به شخص انتخاب‌شده نیست.' }
  }

  // 2. Rule: Role Parity
  if (sourceAssignment.role !== targetAssignment.role) {
    return { 
      success: false, 
      errorCode: 'ROLE_MISMATCH', 
      errorMessage: `عدم تطابق نقش: شما نمی‌توانید نقش ${sourceAssignment.role} را با ${targetAssignment.role} جابه‌جا کنید.` 
    }
  }

  // Fetch roster days for the trips
  const sourceRosterVersion = await prisma.rosterVersion.findUnique({
    where: { id: sourceAssignment.trip.rosterVersionId },
    include: { rosterDay: true }
  })
  const targetRosterVersion = await prisma.rosterVersion.findUnique({
    where: { id: targetAssignment.trip.rosterVersionId },
    include: { rosterDay: true }
  })

  if (!sourceRosterVersion || !targetRosterVersion) {
    return { success: false, errorCode: 'NOT_FOUND', errorMessage: 'روز لوحه یافت نشد.' }
  }

  const sDepTime = sourceAssignment.trip.departureTime || '00:00'
  const tDepTime = targetAssignment.trip.departureTime || '00:00'

  // 3. Date / Time Parsing for Trips
  const sourceDate = dayjs(sourceRosterVersion.rosterDay.gregorianDate)
  const [sHour, sMin] = sDepTime.split(':').map(Number)
  const sourceDeparture = sourceDate.hour(sHour || 0).minute(sMin || 0)

  const targetDate = dayjs(targetRosterVersion.rosterDay.gregorianDate)
  const [tHour, tMin] = tDepTime.split(':').map(Number)
  const targetDeparture = targetDate.hour(tHour || 0).minute(tMin || 0)

  // 4. Rule: Rest Hours (Minimum 8 hours between shifts)
  // Fetch surrounding shifts for requester (they are receiving the target shift)
  const requesterSurroundingShifts = await prisma.tripAssignment.findMany({
    where: {
      matchedUserId: requesterId,
      id: { not: sourceAssignmentId },
      trip: {
        rosterVersion: {
          rosterDay: {
            gregorianDate: {
              gte: targetDate.subtract(1, 'day').toDate(),
              lte: targetDate.add(1, 'day').toDate()
            }
          }
        }
      }
    },
    include: { trip: true }
  })

  for (const shift of requesterSurroundingShifts) {
    const shiftRosterVersion = await prisma.rosterVersion.findUnique({
      where: { id: shift.trip.rosterVersionId },
      include: { rosterDay: true }
    })
    if (!shiftRosterVersion) continue

    const shiftDate = dayjs(shiftRosterVersion.rosterDay.gregorianDate)
    const shiftDepTime = shift.trip.departureTime || '00:00'
    const [h, m] = shiftDepTime.split(':').map(Number)
    const shiftTime = shiftDate.hour(h || 0).minute(m || 0)
    
    const diffHours = Math.abs(targetDeparture.diff(shiftTime, 'hour', true))
    if (diffHours < MIN_REST_HOURS) {
      return {
        success: false,
        errorCode: 'REST_HOURS_VIOLATION',
        errorMessage: `نقض قانون استراحت: شما بین سفر جدید و سفر ساعت ${shiftDepTime} روز ${shiftRosterVersion.rosterDay.jalaliDate} کمتر از ۸ ساعت استراحت خواهید داشت.`
      }
    }
  }

  // Fetch surrounding shifts for target (they are receiving the source shift)
  const targetSurroundingShifts = await prisma.tripAssignment.findMany({
    where: {
      matchedUserId: targetId,
      id: { not: targetAssignmentId },
      trip: {
        rosterVersion: {
          rosterDay: {
            gregorianDate: {
              gte: sourceDate.subtract(1, 'day').toDate(),
              lte: sourceDate.add(1, 'day').toDate()
            }
          }
        }
      }
    },
    include: { trip: true }
  })

  for (const shift of targetSurroundingShifts) {
    const shiftRosterVersion = await prisma.rosterVersion.findUnique({
      where: { id: shift.trip.rosterVersionId },
      include: { rosterDay: true }
    })
    if (!shiftRosterVersion) continue

    const shiftDate = dayjs(shiftRosterVersion.rosterDay.gregorianDate)
    const shiftDepTime = shift.trip.departureTime || '00:00'
    const [h, m] = shiftDepTime.split(':').map(Number)
    const shiftTime = shiftDate.hour(h || 0).minute(m || 0)
    
    const diffHours = Math.abs(sourceDeparture.diff(shiftTime, 'hour', true))
    if (diffHours < MIN_REST_HOURS) {
      return {
        success: false,
        errorCode: 'REST_HOURS_VIOLATION',
        errorMessage: `نقض قانون استراحت برای همکار: بین سفر جدید و سفر ساعت ${shiftDepTime} شخص دوم کمتر از ۸ ساعت فاصله است.`
      }
    }
  }

  return { success: true }
}
