import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'
import type { ShiftCode } from '@/generated/prisma/client'
import { jalaliToDate, fuzzyMatchScore, normalizeFarsiString } from '@/lib/fa'
import { jdate, dayjs, gregStr } from '@/lib/dayjs'

export interface ColumnMapping {
  block: 'RIGHT' | 'LEFT'
  rowNoIndex: number
  trainNumberIndex: number
  rIndex: number
  tIndex: number
  h1Index: number
  h2Index: number
  departureTimeIndex: number
  arrivalTimeIndex: number
}

// Default layout indexes based on 'loheadi (2).xlsx' structure
export const DEFAULT_RIGHT_MAPPING: ColumnMapping = {
  block: 'RIGHT',
  rowNoIndex: 0,
  trainNumberIndex: 1,
  rIndex: 2,
  tIndex: 3,
  h1Index: 4,
  h2Index: 7,
  departureTimeIndex: 8,
  arrivalTimeIndex: 9,
}

export const DEFAULT_LEFT_MAPPING: ColumnMapping = {
  block: 'LEFT',
  rowNoIndex: 10,
  trainNumberIndex: 11,
  rIndex: 12,
  tIndex: 13,
  h1Index: 14,
  h2Index: 17,
  departureTimeIndex: 18,
  arrivalTimeIndex: 19,
}

export interface ValidationIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  type: string
  message: string
  affectedTripId?: string
  affectedUserId?: string
  suggestedAction?: string
}

// Helper to convert Excel decimal time or string to HH:mm:ss format
function formatExcelTime(val: any): string {
  if (val === undefined || val === null || val === '') return ''
  
  if (typeof val === 'number') {
    // Excel fraction of a day
    const totalSeconds = Math.round(val * 24 * 3600)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0')
    ].join(':')
  }
  
  const str = String(val).trim()
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':')
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1]}:00`
    }
    return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2]}`
  }
  return str
}

// Fuzzy matches a raw name against active database users
async function matchDriver(rawName: string, dbUsers: any[]): Promise<{
  userId?: string
  personnelNo?: string
  score: number
  status: 'AUTO_MATCHED' | 'NEEDS_REVIEW' | 'UNMATCHED'
}> {
  const normalizedRaw = normalizeFarsiString(rawName)
  if (!normalizedRaw || normalizedRaw.length < 2) {
    return { score: 0, status: 'UNMATCHED' }
  }

  let bestUser: any = null
  let bestScore = 0

  for (const user of dbUsers) {
    const score = fuzzyMatchScore(normalizedRaw, user.name)
    if (score > bestScore) {
      bestScore = score
      bestUser = user
    }
  }

  if (bestScore >= 85) {
    return {
      userId: bestUser.id,
      personnelNo: bestUser.nationalId,
      score: bestScore,
      status: 'AUTO_MATCHED'
    }
  } else if (bestScore >= 70) {
    return {
      userId: bestUser.id,
      personnelNo: bestUser.nationalId,
      score: bestScore,
      status: 'NEEDS_REVIEW'
    }
  }

  return {
    score: bestScore,
    status: 'UNMATCHED'
  }
}

// Parses Roster Excel buffer and performs initial extraction & fuzzy matching
export async function parseRosterExcelV2(
  buffer: ArrayBuffer,
  jalaliDate: string,
  options?: {
    rightMapping?: ColumnMapping
    leftMapping?: ColumnMapping
    title?: string
    schedulingTitle?: string
    processingNumber?: number
  }
) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  
  // Convert to 2D array (header: 1 forces array representation, defval keeps empty cells)
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })
  
  const rightMapping = options?.rightMapping || DEFAULT_RIGHT_MAPPING
  const leftMapping = options?.leftMapping || DEFAULT_LEFT_MAPPING
  
  const dbUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, nationalId: true }
  })
  
  const extractedTrips: any[] = []
  const extractedAssignments: any[] = []
  
  // Find rows where data begins
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    
    // Parse Right Block (SHAHRREY_TO_TAJRISH)
    const rightRowNo = parseInt(String(row[rightMapping.rowNoIndex] || ''), 10)
    if (!isNaN(rightRowNo) && rightRowNo > 0) {
      const trainNo = String(row[rightMapping.trainNumberIndex] || '').trim()
      const rawH1 = String(row[rightMapping.h1Index] || '').trim()
      const rawH2 = String(row[rightMapping.h2Index] || '').trim()
      const rawT = String(row[rightMapping.tIndex] || '').trim()
      const rawR = String(row[rightMapping.rIndex] || '').trim()
      const depTime = formatExcelTime(row[rightMapping.departureTimeIndex])
      const arrTime = formatExcelTime(row[rightMapping.arrivalTimeIndex])
      
      if (trainNo || rawH1 || depTime || arrTime) {
        const tripTempId = `right-${rightRowNo}-${i}`
        extractedTrips.push({
          tempId: tripTempId,
          rowNo: rightRowNo,
          trainNumber: trainNo || null,
          direction: 'SHAHRREY_TO_TAJRISH',
          originStation: 'SHAHRREY',
          destinationStation: 'TAJRISH',
          departureTime: depTime || null,
          arrivalTime: arrTime || null,
          status: 'NORMAL',
          operationalNote: rawT === 'خ' ? 'دیسپچ از دپو' : rawT === 'P' ? 'شانت' : null
        })
        
        if (rawH1) {
          const match = await matchDriver(rawH1, dbUsers)
          extractedAssignments.push({
            tripTempId,
            role: 'H1',
            rawName: rawH1,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawH2) {
          const match = await matchDriver(rawH2, dbUsers)
          extractedAssignments.push({
            tripTempId,
            role: 'H2',
            rawName: rawH2,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawT) {
          extractedAssignments.push({
            tripTempId,
            role: 'T',
            rawName: rawT,
            matchStatus: 'UNMATCHED'
          })
        }
        
        if (rawR) {
          extractedAssignments.push({
            tripTempId,
            role: 'R',
            rawName: rawR,
            matchStatus: 'UNMATCHED'
          })
        }
      }
    }
    
    // Parse Left Block (TAJRISH_TO_SHAHRREY)
    const leftRowNo = parseInt(String(row[leftMapping.rowNoIndex] || ''), 10)
    if (!isNaN(leftRowNo) && leftRowNo > 0) {
      const trainNo = String(row[leftMapping.trainNumberIndex] || '').trim()
      const rawH1 = String(row[leftMapping.h1Index] || '').trim()
      const rawH2 = String(row[leftMapping.h2Index] || '').trim()
      const rawT = String(row[leftMapping.tIndex] || '').trim()
      const rawR = String(row[leftMapping.rIndex] || '').trim()
      const depTime = formatExcelTime(row[leftMapping.departureTimeIndex])
      const arrTime = formatExcelTime(row[leftMapping.arrivalTimeIndex])
      
      if (trainNo || rawH1 || depTime || arrTime) {
        const tripTempId = `left-${leftRowNo}-${i}`
        extractedTrips.push({
          tempId: tripTempId,
          rowNo: leftRowNo,
          trainNumber: trainNo || null,
          direction: 'TAJRISH_TO_SHAHRREY',
          originStation: 'TAJRISH',
          destinationStation: 'SHAHRREY',
          departureTime: depTime || null,
          arrivalTime: arrTime || null,
          status: 'NORMAL',
          operationalNote: rawT === 'خ' ? 'دیسپچ از دپو' : rawT === 'P' ? 'شانت' : null
        })
        
        if (rawH1) {
          const match = await matchDriver(rawH1, dbUsers)
          extractedAssignments.push({
            tripTempId,
            role: 'H1',
            rawName: rawH1,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawH2) {
          const match = await matchDriver(rawH2, dbUsers)
          extractedAssignments.push({
            tripTempId,
            role: 'H2',
            rawName: rawH2,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawT) {
          extractedAssignments.push({
            tripTempId,
            role: 'T',
            rawName: rawT,
            matchStatus: 'UNMATCHED'
          })
        }
        
        if (rawR) {
          extractedAssignments.push({
            tripTempId,
            role: 'R',
            rawName: rawR,
            matchStatus: 'UNMATCHED'
          })
        }
      }
    }
  }
  
  return {
    trips: extractedTrips,
    assignments: extractedAssignments,
    meta: {
      jalaliDate,
      title: options?.title || 'گزارش لوحه اعزام',
      schedulingTitle: options?.schedulingTitle || 'روز عادی',
      processingNumber: options?.processingNumber || 7
    }
  }
}

// Checks safety constraints and return warnings/errors
export function validateRoster(trips: any[], assignments: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  
  // Group assignments by matchedUserId to run driver validation
  const driverMap = new Map<string, any[]>()
  
  assignments.forEach((assign) => {
    if (!assign.matchedUserId) return
    const trip = trips.find((t) => t.tempId === assign.tripTempId || t.id === assign.tripId)
    if (!trip || !trip.departureTime || !trip.arrivalTime) return
    
    if (!driverMap.has(assign.matchedUserId)) {
      driverMap.set(assign.matchedUserId, [])
    }
    driverMap.get(assign.matchedUserId)!.push({ assign, trip })
  })
  
  for (const [userId, tripsList] of driverMap.entries()) {
    // Sort by departure time
    tripsList.sort((a, b) => a.trip.departureTime.localeCompare(b.trip.departureTime))
    
    for (let i = 0; i < tripsList.length; i++) {
      const current = tripsList[i]
      
      // Check 1: Overlaps
      for (let j = i + 1; j < tripsList.length; j++) {
        const next = tripsList[j]
        if (current.trip.arrivalTime > next.trip.departureTime) {
          issues.push({
            severity: 'CRITICAL',
            type: 'overlap',
            message: `تداخل زمانی سفرهای راهبر: قطار ${current.trip.trainNumber || 'نامشخص'} (${current.trip.departureTime} - ${current.trip.arrivalTime}) و قطار ${next.trip.trainNumber || 'نامشخص'} (${next.trip.departureTime} - ${next.trip.arrivalTime}) برای یک راهبر ثبت شده است.`,
            affectedTripId: current.trip.tempId || current.trip.id,
            affectedUserId: userId,
            suggestedAction: 'یکی از سفرها را به راهبر دیگری تخصیص دهید.'
          })
        }
      }
      
      // Check 2: Turnaround / Rest limits between consecutive trips
      if (i < tripsList.length - 1) {
        const next = tripsList[i + 1]
        
        // Calculate turnaround time in minutes
        const currArr = current.trip.arrivalTime.split(':').map(Number)
        const nextDep = next.trip.departureTime.split(':').map(Number)
        const currMinutes = currArr[0] * 60 + currArr[1]
        const nextMinutes = nextDep[0] * 60 + nextDep[1]
        const diff = nextMinutes - currMinutes
        
        if (diff >= 0 && diff < 5) {
          issues.push({
            severity: 'WARNING',
            type: 'fatigue_turnaround',
            message: `زمان شانت و استراحت بسیار کوتاه (${diff} دقیقه) بین قطار ${current.trip.trainNumber} و قطار ${next.trip.trainNumber} برای این راهبر.`,
            affectedTripId: next.trip.tempId || next.trip.id,
            affectedUserId: userId,
            suggestedAction: 'راهبر جایگزین یا زمان شانت طولانی‌تری در نظر بگیرید.'
          })
        }
      }
    }
    
    // Check 3: Maximum daily driving time (e.g. limit to 8 hours total)
    let totalMinutes = 0
    tripsList.forEach((item) => {
      const dep = item.trip.departureTime.split(':').map(Number)
      const arr = item.trip.arrivalTime.split(':').map(Number)
      totalMinutes += (arr[0] * 60 + arr[1]) - (dep[0] * 60 + dep[1])
    })
    
    if (totalMinutes > 480) {
      issues.push({
        severity: 'ERROR',
        type: 'fatigue_limit',
        message: `مجموع زمان رانندگی روزانه راهبر (${Math.round(totalMinutes / 60)} ساعت) از حد مجاز قانونی (۸ ساعت) فراتر رفته است.`,
        affectedUserId: userId,
        suggestedAction: 'برخی از سفرهای این راهبر را حذف یا جابجا کنید.'
      })
    }
  }
  
  return issues
}

// Writes parsed draft into staging tables in database
export async function createRosterDayDraft(
  parsed: any,
  uploaderId: string,
  fileName: string
) {
  const [jy, jm, jd] = parsed.meta.jalaliDate.split('/').map(Number)
  const gregorianDate = jalaliToDate(jy, jm, jd)
  
  // Start transactional draft save
  return await prisma.$transaction(async (tx) => {
    // 1. Create or get RosterDay
    const rosterDay = await tx.rosterDay.upsert({
      where: { jalaliDate: parsed.meta.jalaliDate },
      update: {
        title: parsed.meta.title,
        schedulingTitle: parsed.meta.schedulingTitle,
        processingNumber: parsed.meta.processingNumber,
        status: 'DRAFT',
      },
      create: {
        jalaliDate: parsed.meta.jalaliDate,
        gregorianDate,
        title: parsed.meta.title,
        schedulingTitle: parsed.meta.schedulingTitle,
        processingNumber: parsed.meta.processingNumber,
        status: 'DRAFT',
      }
    })
    
    // Calculate version number
    const prevVersions = await tx.rosterVersion.findMany({
      where: { rosterDayId: rosterDay.id },
      orderBy: { versionNo: 'desc' },
      take: 1
    })
    const nextVerNo = prevVersions.length > 0 ? prevVersions[0].versionNo + 1 : 1
    
    // 2. Create RosterVersion
    const rosterVersion = await tx.rosterVersion.create({
      data: {
        rosterDayId: rosterDay.id,
        versionNo: nextVerNo,
        originalFileName: fileName,
        status: 'PARSED',
        uploadedById: uploaderId
      }
    })
    
    // 3. Create Trips and Assignments
    const tempToRealTripId = new Map<string, string>()
    
    for (const trip of parsed.trips) {
      const createdTrip = await tx.trip.create({
        data: {
          rosterVersionId: rosterVersion.id,
          rowNo: trip.rowNo,
          trainNumber: trip.trainNumber,
          direction: trip.direction,
          originStation: trip.originStation,
          destinationStation: trip.destinationStation,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          status: trip.status,
          operationalNote: trip.operationalNote
        }
      })
      tempToRealTripId.set(trip.tempId, createdTrip.id)
    }
    
    for (const assign of parsed.assignments) {
      const tripId = tempToRealTripId.get(assign.tripTempId)
      if (!tripId) continue
      
      await tx.tripAssignment.create({
        data: {
          tripId,
          role: assign.role,
          rawName: assign.rawName,
          matchedUserId: assign.matchedUserId,
          personnelNo: assign.personnelNo,
          matchScore: assign.matchScore,
          matchStatus: assign.matchStatus
        }
      })
    }
    
    return {
      rosterDayId: rosterDay.id,
      rosterVersionId: rosterVersion.id,
      versionNo: nextVerNo
    }
  })
}

// Finalizes Roster Version, flags as published and updates standard Shifts calendar table
export async function publishRosterVersion(rosterVersionId: string, publisherId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get version details
    const version = await tx.rosterVersion.findUnique({
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
    
    if (!version) throw new Error('نسخه لوحه یافت نشد')
    
    // 2. Set version to Published
    await tx.rosterVersion.update({
      where: { id: rosterVersionId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: publisherId
      }
    })
    
    // Update parent RosterDay status
    await tx.rosterDay.update({
      where: { id: version.rosterDayId },
      data: { status: 'PUBLISHED' }
    })
    
    // 3. Map trips to shift codes and upsert into Shift table for each driver
    const driverFirstTripTime = new Map<string, string>() // userId -> earliest trip depTime
    
    for (const trip of version.trips) {
      for (const assign of trip.assignments) {
        if (!assign.matchedUserId) continue
        
        // Only map H1 and H2 drivers to standard calendar shifts
        if (assign.role !== 'H1' && assign.role !== 'H2') continue
        
        const depTime = trip.departureTime || '08:00:00'
        const existingDep = driverFirstTripTime.get(assign.matchedUserId)
        
        if (!existingDep || depTime < existingDep) {
          driverFirstTripTime.set(assign.matchedUserId, depTime)
        }
      }
    }
    
    // Upsert into Shift
    for (const [userId, depTime] of driverFirstTripTime.entries()) {
      const hour = parseInt(depTime.split(':')[0], 10)
      
      let code: ShiftCode = 'morning'
      if (hour >= 13 && hour < 21) {
        code = 'evening'
      } else if (hour >= 21 || hour < 5) {
        code = 'night'
      }
      
      await tx.shift.upsert({
        where: {
          userId_date: {
            userId,
            date: version.rosterDay.gregorianDate
          }
        },
        update: {
          code,
          source: 'roster',
          note: `سفر تعیین شده در لوحه نسخه ${version.versionNo}`
        },
        create: {
          userId,
          date: version.rosterDay.gregorianDate,
          code,
          source: 'roster',
          note: `سفر تعیین شده در لوحه نسخه ${version.versionNo}`
        }
      })
    }
    
    // 4. Create Audit Log
    await tx.auditLog.create({
      data: {
        actorId: publisherId,
        entity: 'RosterVersion',
        entityId: rosterVersionId,
        action: 'update',
        after: {
          versionNo: version.versionNo,
          rosterDayId: version.rosterDayId,
          status: 'PUBLISHED'
        }
      }
    })
    
    return { success: true }
  })
}
