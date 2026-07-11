import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'
import type { ShiftCode } from '@/generated/prisma/client'
import { jalaliToDate, fuzzyMatchScore, normalizeFarsiString } from '@/lib/fa'
import { jdate, dayjs, gregStr } from '@/lib/dayjs'
import { getSettingValue } from '@/server/modules/settings'
import { checkForMeetingShiftConflicts } from '../meetings/service'

export interface ColumnMapping {
  block: 'RIGHT' | 'LEFT'
  rowNoIndex: number
  trainNumberIndex: number
  rIndex: number
  tIndex: number
  h1Index: number
  h2Index: number
  assistantTIndex: number
  assistantRIndex: number
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
  assistantTIndex: 5,
  assistantRIndex: 6,
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
  assistantTIndex: 15,
  assistantRIndex: 16,
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
export async function matchDriver(
  rawName: string,
  dbUsers: any[],
  autoMatchThreshold = 85,
  reviewMatchThreshold = 70
): Promise<{
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

  if (bestScore >= autoMatchThreshold) {
    return {
      userId: bestUser.id,
      personnelNo: bestUser.personnelCode,
      score: bestScore,
      status: 'AUTO_MATCHED'
    }
  } else if (bestScore >= reviewMatchThreshold) {
    return {
      userId: bestUser.id,
      personnelNo: bestUser.personnelCode,
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
    autoMatchThreshold?: number
    reviewMatchThreshold?: number
  }
) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('فایل اکسل ارسالی هیچ صفحه‌ای (Sheet) ندارد.')
  }
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('صفحه لوحه در فایل اکسل یافت نشد.')
  }
  
  // Convert to 2D array (header: 1 forces array representation, defval keeps empty cells)
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })
  if (!rows || rows.length < 3) {
    throw new Error('تعداد ردیف‌های فایل اکسل لوحه بسیار کم است. ردیف‌های فایل باید شامل هدر و حداقل چند رکورد معتبر باشند.')
  }
  
  const rightMapping = options?.rightMapping || DEFAULT_RIGHT_MAPPING
  const leftMapping = options?.leftMapping || DEFAULT_LEFT_MAPPING
  
  const autoMatchThreshold = options?.autoMatchThreshold ?? 85
  const reviewMatchThreshold = options?.reviewMatchThreshold ?? 70
  
  const dbUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, personnelCode: true }
  })
  
  const extractedTrips: any[] = []
  const extractedAssignments: any[] = []
  
  const isValidDriverName = (name: string): boolean => {
    if (!name) return false
    const cleaned = name.replace(/[\s,،\-.\/\\_()]+/g, '').trim()
    return cleaned.length >= 2
  }

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
      const rawAssistT = String(row[rightMapping.assistantTIndex] || '').trim()
      const rawAssistR = String(row[rightMapping.assistantRIndex] || '').trim()
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
          direction: 'TAJRISH_TO_SHAHRREY',
          originStation: 'TAJRISH',
          destinationStation: 'SHAHRREY',
          departureTime: depTime || null,
          arrivalTime: arrTime || null,
          status: 'NORMAL',
          operationalNote: rawT === 'خ' ? 'دیسپچ از دپو' : rawT === 'P' ? 'شانت' : null
        })
        
        if (rawH1 && isValidDriverName(rawH1)) {
          const match = await matchDriver(rawH1, dbUsers, autoMatchThreshold, reviewMatchThreshold)
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
        
        if (rawH2 && isValidDriverName(rawH2)) {
          const match = await matchDriver(rawH2, dbUsers, autoMatchThreshold, reviewMatchThreshold)
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

        if (rawAssistT && isValidDriverName(rawAssistT)) {
          const match = await matchDriver(rawAssistT, dbUsers, autoMatchThreshold, reviewMatchThreshold)
          extractedAssignments.push({
            tripTempId,
            role: 'T',
            rawName: rawAssistT,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }

        if (rawAssistR && isValidDriverName(rawAssistR)) {
          const match = await matchDriver(rawAssistR, dbUsers, autoMatchThreshold, reviewMatchThreshold)
          extractedAssignments.push({
            tripTempId,
            role: 'R',
            rawName: rawAssistR,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawT) {
          extractedAssignments.push({
            tripTempId,
            role: 'T_TYPE',
            rawName: rawT,
            matchStatus: 'UNMATCHED'
          })
        }
        
        if (rawR) {
          extractedAssignments.push({
            tripTempId,
            role: 'R_CHAR',
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
      const rawAssistT = String(row[leftMapping.assistantTIndex] || '').trim()
      const rawAssistR = String(row[leftMapping.assistantRIndex] || '').trim()
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
          direction: 'SHAHRREY_TO_TAJRISH',
          originStation: 'SHAHRREY',
          destinationStation: 'TAJRISH',
          departureTime: depTime || null,
          arrivalTime: arrTime || null,
          status: 'NORMAL',
          operationalNote: rawT === 'خ' ? 'دیسپچ از دپو' : rawT === 'P' ? 'شانت' : null
        })
        
        if (rawH1 && isValidDriverName(rawH1)) {
          const match = await matchDriver(rawH1, dbUsers, autoMatchThreshold, reviewMatchThreshold)
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
        
        if (rawH2 && isValidDriverName(rawH2)) {
          const match = await matchDriver(rawH2, dbUsers, autoMatchThreshold, reviewMatchThreshold)
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

        if (rawAssistT && isValidDriverName(rawAssistT)) {
          const match = await matchDriver(rawAssistT, dbUsers, autoMatchThreshold, reviewMatchThreshold)
          extractedAssignments.push({
            tripTempId,
            role: 'T',
            rawName: rawAssistT,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }

        if (rawAssistR && isValidDriverName(rawAssistR)) {
          const match = await matchDriver(rawAssistR, dbUsers, autoMatchThreshold, reviewMatchThreshold)
          extractedAssignments.push({
            tripTempId,
            role: 'R',
            rawName: rawAssistR,
            matchedUserId: match.userId || null,
            personnelNo: match.personnelNo || null,
            matchScore: match.score,
            matchStatus: match.status
          })
        }
        
        if (rawT) {
          extractedAssignments.push({
            tripTempId,
            role: 'T_TYPE',
            rawName: rawT,
            matchStatus: 'UNMATCHED'
          })
        }
        
        if (rawR) {
          extractedAssignments.push({
            tripTempId,
            role: 'R_CHAR',
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
function timeToMinutes(value?: string | null): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

export async function validateRoster(trips: any[], assignments: any[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = []

  // ۱. تشخیص ساختار لوحه و قالب فایل — بخش ۸.۱ سند tosee.md
  if (trips.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      type: 'invalid_template',
      message: 'قالب فایل اکسل نامعتبر است یا ستون‌ها به درستی نگاشت نشده‌اند. هیچ سفری استخراج نگردید.',
      suggestedAction: 'فایل نمونه لوحه را دانلود کرده و ساختار ستون‌های اکسل را مجدداً بررسی نمایید.'
    })
    return issues
  }

  // Load rules configuration from database
  const dbRules = prisma.rosterValidationRule
    ? await prisma.rosterValidationRule.findMany({ where: { isEnabled: true } })
    : []
  const ruleMap = new Map(dbRules.map(r => [r.key, r]))

  const isRuleEnabled = (key: string) => {
    if (dbRules.length === 0) return true
    return ruleMap.has(key)
  }

  const getRuleSeverity = (key: string, defaultSeverity: 'error' | 'warning' | 'info') => {
    const rule = ruleMap.get(key)
    if (!rule) return defaultSeverity.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO'
    return rule.severity.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO'
  }

  const getRuleParam = <T>(key: string, paramKey: string, defaultValue: T): T => {
    const rule = ruleMap.get(key)
    if (rule && rule.params) {
      try {
        const parsed = JSON.parse(rule.params)
        if (parsed && parsed[paramKey] !== undefined) {
          return parsed[paramKey] as T
        }
      } catch {
        // ignore
      }
    }
    return defaultValue
  }

  // ۲. اعتبارسنجی شماره پرسنلی (کد پرسنلی ۱۰ رقمی) — بخش ۸.۱
  const activeUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, personnelCode: true, role: { select: { key: true } } }
  })

  if (isRuleEnabled('invalid_personnel_no')) {
    const severity = getRuleSeverity('invalid_personnel_no', 'error')
    for (const assign of assignments) {
      if (assign.matchedUserId) {
        const matched = activeUsers.find((u) => u.id === assign.matchedUserId)
        if (matched) {
          const personnelNo = matched.personnelCode || ''
          const isValid10Digits = /^\d{10}$/.test(personnelNo)
          if (!isValid10Digits) {
            issues.push({
              severity,
              type: 'invalid_personnel_no',
              message: `شماره ملی/پرسنلی راهبر "${matched.name}" نامعتبر است (${personnelNo || 'خالی'}). کد پرسنلی باید دقیقاً ۱۰ رقم عددی باشد.`,
              affectedUserId: matched.id,
              suggestedAction: 'اطلاعات پرسنلی کاربر را در دفتر تلفن ویرایش و تصحیح نمایید.'
            })
          }
        }
      }
    }
  }

  // ۳. تشخیص افراد بدون شیفت / راهبران بدون تخصیص — بخش ۸.۱
  if (isRuleEnabled('idle_driver')) {
    const severity = getRuleSeverity('idle_driver', 'info')
    const assignedUserIds = new Set(assignments.map((a) => a.matchedUserId).filter(Boolean))
    const idleOperators = activeUsers.filter(
      (u) => (u.role?.key === 'user' || u.role?.key === 'operator') && !assignedUserIds.has(u.id)
    )

    for (const idle of idleOperators) {
      issues.push({
        severity,
        type: 'idle_driver',
        message: `راهبر فعال "${idle.name}" در این لوحه به هیچ قطاری تخصیص داده نشده و در حالت آماده‌باش است.`,
        affectedUserId: idle.id,
        suggestedAction: 'در صورت نیاز به شانت یا پشتیبانی، این راهبر را به قطارهای کمکی اختصاص دهید.'
      })
    }
  }

  const seenRows = new Map<string, string>()
  const directionBuckets = new Map<string, any[]>()

  for (const trip of trips) {
    const tripId = trip.tempId || trip.id
    const rowKey = `${trip.rowNo}:${trip.direction}`
    if (seenRows.has(rowKey)) {
      issues.push({
        severity: 'ERROR',
        type: 'duplicate_row',
        message: `ردیف ${trip.rowNo} در جهت ${trip.direction || 'نامشخص'} تکراری است.`,
        affectedTripId: tripId,
        suggestedAction: 'ردیف تکراری را در پیش‌نمایش بررسی و اصلاح کنید.'
      })
    }
    seenRows.set(rowKey, tripId)

    if (!trip.direction) {
      issues.push({
        severity: 'ERROR',
        type: 'missing_direction',
        message: `جهت حرکت برای ردیف ${trip.rowNo} مشخص نشده است.`,
        affectedTripId: tripId,
        suggestedAction: 'نگاشت بلوک راست/چپ را بررسی کنید.'
      })
    }

    if (!trip.departureTime || !trip.arrivalTime) {
      issues.push({
        severity: 'ERROR',
        type: 'missing_time',
        message: `زمان حرکت یا رسیدن در ردیف ${trip.rowNo} کامل نیست.`,
        affectedTripId: tripId,
        suggestedAction: 'سلول‌های زمان را در فایل لوحه بررسی کنید.'
      })
    }

    const dep = timeToMinutes(trip.departureTime)
    const arr = timeToMinutes(trip.arrivalTime)
    if (dep !== null && arr !== null && arr < dep) {
      if (isRuleEnabled('chronological_order')) {
        const severity = getRuleSeverity('chronological_order', 'warning')
        issues.push({
          severity,
          type: 'arrival_before_departure',
          message: `زمان رسیدن ردیف ${trip.rowNo} قبل از زمان حرکت ثبت شده است.`,
          affectedTripId: tripId,
          suggestedAction: 'در صورت عبور از نیمه‌شب، زمان عملیاتی را دستی بررسی کنید.'
        })
      }
    }

    if (!directionBuckets.has(trip.direction || 'UNKNOWN')) {
      directionBuckets.set(trip.direction || 'UNKNOWN', [])
    }
    directionBuckets.get(trip.direction || 'UNKNOWN')!.push(trip)
  }

  if (isRuleEnabled('chronological_order')) {
    const severity = getRuleSeverity('chronological_order', 'warning')
    for (const [, bucket] of directionBuckets.entries()) {
      const sorted = [...bucket].sort((a, b) => a.rowNo - b.rowNo)
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const current = sorted[i]
        const prevDep = timeToMinutes(prev.departureTime)
        const currentDep = timeToMinutes(current.departureTime)
        if (prevDep !== null && currentDep !== null && currentDep < prevDep) {
          issues.push({
            severity,
            type: 'non_ascending_time',
            message: `زمان حرکت در ردیف ${current.rowNo} نسبت به ردیف قبل صعودی نیست.`,
            affectedTripId: current.tempId || current.id,
            suggestedAction: 'ترتیب صفحات و ترکیب ردیف‌های لوحه را بررسی کنید.'
          })
        }
      }
    }
  }

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

  // Validate driver active status (§۷.۲)
  if (isRuleEnabled('inactive_driver')) {
    const severity = getRuleSeverity('inactive_driver', 'error')
    const driverUserIds = Array.from(driverMap.keys())
    if (driverUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: driverUserIds } },
        select: { id: true, name: true, status: true }
      })
      for (const u of users) {
        if (u.status !== 'active') {
          issues.push({
            severity,
            type: 'inactive_driver',
            message: `راهبر تخصیص‌یافته "${u.name}" در وضعیت فعال (Active) قرار ندارد.`,
            affectedUserId: u.id,
            suggestedAction: 'وضعیت راهبر را در دفتر تلفن بررسی و فعال کنید.'
          })
        }
      }
    }
  }

  // Validate interday shift transition rest (§۷.۳)
  if (isRuleEnabled('rest_time')) {
    const severity = getRuleSeverity('rest_time', 'warning')
    const minInterdayRestHours = getRuleParam<number>('rest_time', 'minInterdayRestHours', 11)

    let targetDate: Date | null = null
    const firstTrip = trips[0]
    if (firstTrip && firstTrip.rosterVersionId) {
      const version = await prisma.rosterVersion.findUnique({
        where: { id: firstTrip.rosterVersionId },
        include: { rosterDay: true }
      })
      if (version) targetDate = version.rosterDay.gregorianDate
    }

    if (targetDate) {
      const yesterday = new Date(targetDate)
      yesterday.setDate(yesterday.getDate() - 1)

      const yesterdayVersion = await prisma.rosterVersion.findFirst({
        where: {
          rosterDay: { gregorianDate: yesterday },
          status: 'PUBLISHED'
        },
        orderBy: { versionNo: 'desc' },
        include: {
          trips: {
            include: { assignments: true }
          }
        }
      })

      if (yesterdayVersion) {
        for (const [userId, todayTrips] of driverMap.entries()) {
          const yesterdayTrips = yesterdayVersion.trips.filter((t) =>
            t.assignments.some((a) => a.matchedUserId === userId)
          )
          if (yesterdayTrips.length > 0) {
            yesterdayTrips.sort((a, b) => (a.arrivalTime || '').localeCompare(b.arrivalTime || ''))
            const lastYesterdayTrip = yesterdayTrips[yesterdayTrips.length - 1]
            
            todayTrips.sort((a, b) => (a.trip.departureTime || '').localeCompare(b.trip.departureTime || ''))
            const firstTodayTrip = todayTrips[0].trip

            if (lastYesterdayTrip.arrivalTime && firstTodayTrip.departureTime) {
              const lastArrParts = lastYesterdayTrip.arrivalTime.split(':').map(Number)
              const firstDepParts = firstTodayTrip.departureTime.split(':').map(Number)
              
              const lastArrMinutes = lastArrParts[0] * 60 + lastArrParts[1]
              const firstDepMinutes = firstDepParts[0] * 60 + firstDepParts[1]
              const restMinutes = (1440 - lastArrMinutes) + firstDepMinutes
              const restHours = restMinutes / 60

              if (restHours < minInterdayRestHours) {
                issues.push({
                  severity,
                  type: 'fatigue_interday_rest',
                  message: `استراحت بین‌روزی بسیار کوتاه (${restHours.toFixed(1)} ساعت) بین آخرین سفر دیروز ساعت ${lastYesterdayTrip.arrivalTime} و اولین سفر امروز ساعت ${firstTodayTrip.departureTime} برای این راهبر. (حداقل مجاز: ${minInterdayRestHours} ساعت)`,
                  affectedUserId: userId,
                  affectedTripId: firstTodayTrip.tempId || firstTodayTrip.id,
                  suggestedAction: 'این راهبر را از اولین سفرها معاف کرده یا شیفت او را ویرایش کنید.'
                })
              }
            }
          }
        }
      }
    }
  }

  // Validate turnaround and max daily driving
  const checkRestTime = isRuleEnabled('rest_time')
  const minRestTime = getRuleParam<number>('rest_time', 'minRestMinutes', 5)
  const checkMaxDriving = isRuleEnabled('max_driving_hours')
  const maxDailyDrivingHours = getRuleParam<number>('max_driving_hours', 'maxHours', 8)
  const maxDailyMinutes = maxDailyDrivingHours * 60
  const maxConsecutiveTrips = getRuleParam<number>('max_driving_hours', 'maxConsecutiveTrips', 4)

  const restSeverity = getRuleSeverity('rest_time', 'warning')
  const drivingSeverity = getRuleSeverity('max_driving_hours', 'warning')

  for (const [userId, tripsList] of driverMap.entries()) {
    tripsList.sort((a, b) => a.trip.departureTime.localeCompare(b.trip.departureTime))

    let consecutiveTrips = 1
    for (let i = 0; i < tripsList.length; i++) {
      const current = tripsList[i]

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

      if (i < tripsList.length - 1) {
        const next = tripsList[i + 1]
        const currMinutes = timeToMinutes(current.trip.arrivalTime)
        const nextMinutes = timeToMinutes(next.trip.departureTime)
        const diff = currMinutes !== null && nextMinutes !== null ? nextMinutes - currMinutes : null

        if (checkRestTime && diff !== null && diff >= 0 && diff < minRestTime) {
          issues.push({
            severity: restSeverity,
            type: 'fatigue_turnaround',
            message: `زمان شانت و استراحت بسیار کوتاه (${diff} دقیقه) بین قطار ${current.trip.trainNumber} و قطار ${next.trip.trainNumber} برای این راهبر. (حداقل مجاز: ${minRestTime} دقیقه)`,
            affectedTripId: next.trip.tempId || next.trip.id,
            affectedUserId: userId,
            suggestedAction: 'راهبر جایگزین یا زمان شانت طولانی‌تری در نظر بگیرید.'
          })
        }

        if (diff !== null && diff >= minRestTime) {
          consecutiveTrips = 1
        } else {
          consecutiveTrips += 1
        }

        if (checkMaxDriving && consecutiveTrips > maxConsecutiveTrips) {
          issues.push({
            severity: drivingSeverity,
            type: 'fatigue_consecutive_trips',
            message: `تعداد سفرهای پشت‌سرهم راهبر از ${maxConsecutiveTrips} سفر بیشتر شده است.`,
            affectedTripId: next.trip.tempId || next.trip.id,
            affectedUserId: userId,
            suggestedAction: 'برای کاهش خستگی، یک سفر میانی را به راهبر جایگزین بدهید.'
          })
        }
      }
    }

    if (checkMaxDriving) {
      let totalMinutes = 0
      tripsList.forEach((item) => {
        const dep = timeToMinutes(item.trip.departureTime)
        const arr = timeToMinutes(item.trip.arrivalTime)
        if (dep !== null && arr !== null && arr >= dep) {
          totalMinutes += arr - dep
        }
      })

      if (totalMinutes > maxDailyMinutes) {
        issues.push({
          severity: drivingSeverity,
          type: 'fatigue_limit',
          message: `مجموع زمان رانندگی روزانه راهبر (${Math.round(totalMinutes / 60)} ساعت) از حد مجاز قانونی (${maxDailyDrivingHours} ساعت) فراتر رفته است.`,
          affectedUserId: userId,
          suggestedAction: 'برخی از سفرهای این راهبر را حذف یا جابجا کنید.'
        })
      }
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
// With targeted diff-based notifications (§۸.۳, §۱۳.۴)
export async function publishRosterVersion(rosterVersionId: string, publisherId: string) {
  const result = await prisma.$transaction(async (tx) => {
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
    
    // 2. Find previous published version for diff
    const previousPublished = await tx.rosterVersion.findFirst({
      where: {
        rosterDayId: version.rosterDayId,
        status: 'PUBLISHED',
        id: { not: rosterVersionId },
      },
      orderBy: { versionNo: 'desc' },
      select: { id: true, versionNo: true },
    })
    
    // 3. Set version to Published
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
    
    // 4. Map trips to shift codes and upsert into Shift table for each driver
    const driverFirstTripTime = new Map<string, string>() // userId -> earliest trip depTime
    
    for (const trip of version.trips) {
      for (const assign of trip.assignments) {
        if (!assign.matchedUserId) continue
        
        // Map H1, H2, T, and R drivers to standard calendar shifts
        if (assign.role !== 'H1' && assign.role !== 'H2' && assign.role !== 'T' && assign.role !== 'R') continue
        
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
    
    // 5. Create Audit Log
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

    // 6. Collect all assigned driver IDs
    const allDriverUserIds = new Set<string>()
    for (const trip of version.trips) {
      for (const assign of trip.assignments) {
        if (assign.matchedUserId) allDriverUserIds.add(assign.matchedUserId)
      }
    }

    return {
      success: true,
      versionNo: version.versionNo,
      jalaliDate: version.rosterDay.jalaliDate,
      rosterDayId: version.rosterDayId,
      rosterDate: version.rosterDay.gregorianDate,
      allDriverUserIds: [...allDriverUserIds],
      previousPublishedId: previousPublished?.id ?? null,
    }
  })

  // 7. Check for meeting shift conflicts
  for (const userId of result.allDriverUserIds) {
    try {
      await checkForMeetingShiftConflicts(userId, result.rosterDate)
    } catch (e) {
      console.error(`Error checking meeting conflicts for user ${userId}:`, e)
    }
  }

  // 8. Send targeted notifications OUTSIDE transaction (§۸.۳)
  const { createNotification, createBulkNotifications } = await import('@/server/modules/notifications/service')
  const { diffRosterVersions } = await import('./diff')

  const rosterLink = `/roster?date=${result.jalaliDate}`

  if (result.previousPublishedId) {
    // Diff against previous → notify only affected drivers
    const diff = await diffRosterVersions(rosterVersionId, result.previousPublishedId)

    if (diff && diff.affectedUserIds.length > 0) {
      const changeSummary = [
        diff.added.length > 0 ? `${diff.added.length} سفر جدید` : '',
        diff.removed.length > 0 ? `${diff.removed.length} سفر حذف شده` : '',
        diff.changed.length > 0 ? `${diff.changed.length} سفر تغییریافته` : '',
      ].filter(Boolean).join('، ')

      for (const userId of diff.affectedUserIds) {
        await createNotification({
          userId,
          type: 'warning',
          title: `تغییر لوحه ${result.jalaliDate} (نسخه ${result.versionNo})`,
          body: `لوحه اعزام به‌روزرسانی شد: ${changeSummary}. لطفاً سفرهای خود را بررسی کنید.`,
          link: rosterLink,
        })
      }
    }
  } else {
    // First publish → notify all assigned drivers
    if (result.allDriverUserIds.length > 0) {
      await createBulkNotifications(result.allDriverUserIds, {
        type: 'info',
        title: `لوحه اعزام ${result.jalaliDate} منتشر شد`,
        body: `لوحه اعزام روزانه نسخه ${result.versionNo} منتشر شد. لطفاً سفرهای خود را مشاهده و تأیید رؤیت کنید.`,
        link: rosterLink,
      })
    }
  }

  // 8. Precompute Snapshots for fast reads (Roster Platform v2 — فاز ۱)
  try {
    const { precomputeOnPublish } = await import('./precompute')
    await precomputeOnPublish(rosterVersionId)
  } catch (error) {
    console.error(`[RosterPublish] Precompute failed for version ${rosterVersionId}:`, error)
    // Don't throw, let the publish succeed. It can be retried or fallback to live query.
  }

  return { success: true, notifiedUserIds: result.allDriverUserIds }
}

