import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'
import { toEn } from '@/lib/fa'
import { fromJalali } from '@/lib/dayjs'
import { getEmbedding } from '@/server/modules/ai/embedding'
import type { TicketPriority, FaultStatus, TrainStatus } from '@/generated/prisma/client'

// Helper: Convert float array to Buffer for SQLite Bytes
function embeddingToBuffer(embedding: number[]): Buffer {
  const floatArray = new Float32Array(embedding)
  return Buffer.from(floatArray.buffer)
}

export interface ExcelImportError {
  row: number
  keyIdentifier: string
  reason: string
}

export interface ExcelImportPreview<T> {
  batchId: string
  validCount: number
  errorCount: number
  errors: ExcelImportError[]
  validRows: T[]
}

/**
 * Parses Jalali or Gregorian date string into a Date object.
 */
export function parseDate(dateStr: string): Date {
  const cleanStr = toEn(dateStr.trim())
  // Try splitting by slash or dash
  const parts = cleanStr.split(/[\/-]/).map((p) => parseInt(p, 10))
  if (parts.length === 3) {
    const [year, month, day] = parts
    // Check if it's Jalali (year between 1300 and 1500)
    if (year >= 1300 && year <= 1500) {
      return fromJalali(year, month, day).toDate()
    }
    // Else treat as Gregorian
    return new Date(year, month - 1, day)
  }
  
  // Fallback to standard JS Date parsing
  const d = new Date(cleanStr)
  if (isNaN(d.getTime())) {
    return new Date()
  }
  return d
}

/**
 * Normalizes boolean values from Excel inputs.
 */
export function parseExcelBoolean(val: any): boolean {
  if (val === undefined || val === null) return false
  const s = String(val).trim().toLowerCase()
  return (
    s === 'true' ||
    s === '1' ||
    s === 'بله' ||
    s === 'yes' ||
    s === 'ok' ||
    s === 'تایید'
  )
}

/**
 * ── 1. FLEET (TRAIN/WAGON) IMPORT & EXPORT ──
 */
export async function validateTrainsExcel(
  fileBuffer: ArrayBuffer
): Promise<ExcelImportPreview<any>> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('فایل اکسل خالی یا فاقد شیت است.')

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], {
    defval: '',
  })

  const batchId = Math.random().toString(36).substring(7)
  const errors: ExcelImportError[] = []
  const validRows: any[] = []

  const existingTrains = await prisma.train.findMany({ select: { trainNumber: true } })
  const existingSet = new Set(existingTrains.map((t) => t.trainNumber))
  const fileTrainNumbers = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    const trainNumber = toEn(String(row['شماره قطار'] || row['trainNumber'] || '')).trim()
    const fleetSeries = String(row['سری ناوگان'] || row['fleetSeries'] || '').trim()
    const manufacturer = String(row['سازنده'] || row['manufacturer'] || '').trim()
    const rawWagonCount = toEn(String(row['تعداد واگن'] || row['wagonCount'] || '7')).trim()
    const rawStatus = String(row['وضعیت'] || row['status'] || 'active').trim()
    const notes = String(row['توضیحات'] || row['notes'] || '').trim()

    if (!trainNumber) {
      errors.push({ row: rowNum, keyIdentifier: 'نامشخص', reason: 'شماره قطار الزامی است.' })
      continue
    }

    if (existingSet.has(trainNumber)) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'قطار با این شماره قبلاً در سیستم ثبت شده است.' })
      continue
    }

    if (fileTrainNumbers.has(trainNumber)) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'شماره قطار در این فایل تکراری است.' })
      continue
    }

    const wagonCount = parseInt(rawWagonCount, 10)
    if (isNaN(wagonCount) || wagonCount <= 0) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'تعداد واگن باید عدد مثبت باشد.' })
      continue
    }

    // Map status
    let status: TrainStatus = 'active'
    const cleanStatus = rawStatus.toLowerCase()
    if (cleanStatus === 'standby' || cleanStatus === 'آماده‌به‌کار' || cleanStatus === 'آماده به کار') status = 'standby'
    else if (cleanStatus === 'maintenance' || cleanStatus === 'تعمیرات' || cleanStatus === 'در دست تعمیر') status = 'maintenance'
    else if (cleanStatus === 'out_of_service' || cleanStatus === 'خارج از سرویس') status = 'out_of_service'

    fileTrainNumbers.add(trainNumber)
    validRows.push({
      trainNumber,
      fleetSeries: fleetSeries || null,
      manufacturer: manufacturer || null,
      wagonCount,
      status,
      notes: notes || null,
    })
  }

  return {
    batchId,
    validCount: validRows.length,
    errorCount: errors.length,
    errors,
    validRows,
  }
}

export async function commitTrainsImport(validRows: any[], actorId: string) {
  return await prisma.$transaction(async (tx) => {
    let successCount = 0

    for (const row of validRows) {
      const train = await tx.train.create({
        data: {
          trainNumber: row.trainNumber,
          fleetSeries: row.fleetSeries,
          manufacturer: row.manufacturer,
          wagonCount: row.wagonCount,
          status: row.status,
          notes: row.notes,
        },
      })

      // Create wagons
      for (let pos = 1; pos <= row.wagonCount; pos++) {
        const wagonCode = `${row.trainNumber}-${pos}`
        await tx.wagon.create({
          data: {
            trainId: train.id,
            position: pos,
            wagonCode,
            wagonType: pos === 1 || pos === row.wagonCount ? 'Mc' : pos === 3 || pos === 5 ? 'M' : 'Tp',
          },
        })
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          entity: 'Train',
          entityId: train.id,
          action: 'create',
          after: row,
        },
      })

      successCount++
    }

    return { successCount }
  })
}

/**
 * ── 2. FAULT CATALOG IMPORT & EXPORT ──
 */
export async function validateCatalogExcel(
  fileBuffer: ArrayBuffer
): Promise<ExcelImportPreview<any>> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('فایل اکسل خالی یا فاقد شیت است.')

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], {
    defval: '',
  })

  const batchId = Math.random().toString(36).substring(7)
  const errors: ExcelImportError[] = []
  const validRows: any[] = []
  const fileCodes = new Set<string>()

  const existingCodes = await prisma.faultCode.findMany({ select: { code: true } })
  const codeSet = new Set(existingCodes.map((c) => c.code))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const code = String(row['کد خطا'] || row['code'] || '').trim().toUpperCase()
    const categoryCode = String(row['دسته‌بندی (کد)'] || row['categoryCode'] || '').trim().toUpperCase()
    const categoryTitle = String(row['دسته‌بندی (عنوان)'] || row['categoryTitle'] || '').trim()
    const title = String(row['عنوان خطا'] || row['title'] || '').trim()
    const description = String(row['شرح خطا'] || row['description'] || '').trim()
    const rawPriority = String(row['اولویت پیش‌فرض'] || row['defaultPriority'] || 'medium').trim().toLowerCase()
    const safetyCritical = parseExcelBoolean(row['ایمنی‌محور'] || row['safetyCritical'])
    const requiresWagon = parseExcelBoolean(row['نیاز به واگن'] === undefined ? true : (row['نیاز به واگن'] || row['requiresWagon']))
    const operatorGuide = String(row['راهنمای اقدام فوری'] || row['operatorGuide'] || '').trim()
    const keywords = String(row['کلیدواژه‌ها'] || row['keywords'] || '').trim()
    const aliases = String(row['نام‌های مستعار'] || row['aliases'] || '').trim()

    if (!code) {
      errors.push({ row: rowNum, keyIdentifier: 'نامشخص', reason: 'کد خطا الزامی است.' })
      continue
    }

    if (!categoryCode || !categoryTitle) {
      errors.push({ row: rowNum, keyIdentifier: code, reason: 'کد و عنوان دسته‌بندی الزامی هستند.' })
      continue
    }

    if (!title) {
      errors.push({ row: rowNum, keyIdentifier: code, reason: 'عنوان خطا الزامی است.' })
      continue
    }

    if (codeSet.has(code)) {
      errors.push({ row: rowNum, keyIdentifier: code, reason: 'کد خطا قبلاً در سیستم ثبت شده است.' })
      continue
    }

    if (fileCodes.has(code)) {
      errors.push({ row: rowNum, keyIdentifier: code, reason: 'کد خطا در این فایل تکراری است.' })
      continue
    }

    let defaultPriority: TicketPriority = 'medium'
    if (rawPriority === 'low' || rawPriority === 'کم') defaultPriority = 'low'
    else if (rawPriority === 'high' || rawPriority === 'زیاد') defaultPriority = 'high'
    else if (rawPriority === 'critical' || rawPriority === 'بحرانی') defaultPriority = 'critical'

    fileCodes.add(code)
    validRows.push({
      code,
      categoryCode,
      categoryTitle,
      title,
      description: description || null,
      defaultPriority,
      safetyCritical,
      requiresWagon,
      operatorGuide: operatorGuide || null,
      keywords: keywords || null,
      aliases: aliases || null,
    })
  }

  return {
    batchId,
    validCount: validRows.length,
    errorCount: errors.length,
    errors,
    validRows,
  }
}

export async function commitCatalogImport(validRows: any[], actorId: string) {
  return await prisma.$transaction(async (tx) => {
    let successCount = 0
    const categoryCache = new Map<string, string>()

    for (const row of validRows) {
      // 1. Resolve or create category
      let categoryId = categoryCache.get(row.categoryCode)
      if (!categoryId) {
        const cat = await tx.faultCategory.upsert({
          where: { code: row.categoryCode },
          update: { title: row.categoryTitle },
          create: { code: row.categoryCode, title: row.categoryTitle },
        })
        categoryId = cat.id
        categoryCache.set(row.categoryCode, categoryId)
      }

      // 2. Compute semantic embedding offline if possible
      let embeddingBytes: Buffer | null = null
      try {
        const textToEmbed = `${row.title} ${row.keywords || ''} ${row.aliases || ''}`
        const embedding = await getEmbedding(textToEmbed)
        embeddingBytes = embeddingToBuffer(embedding)
      } catch (err) {
        console.warn(`[Catalog Import] Failed to generate embedding for ${row.code}:`, err)
      }

      // 3. Create Fault Code
      const fc = await tx.faultCode.create({
        data: {
          categoryId,
          code: row.code,
          title: row.title,
          description: row.description,
          defaultPriority: row.defaultPriority,
          safetyCritical: row.safetyCritical,
          requiresWagon: row.requiresWagon,
          operatorGuide: row.operatorGuide,
          keywords: row.keywords,
          aliases: row.aliases,
          embedding: embeddingBytes as any,
        },
      })

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          entity: 'FaultCode',
          entityId: fc.id,
          action: 'create',
          after: row,
        },
      })

      successCount++
    }

    return { successCount }
  })
}

/**
 * ── 3. FAULT REPORTS IMPORT & ROLLBACK ──
 */
export async function validateFaultReportsExcel(
  fileBuffer: ArrayBuffer
): Promise<ExcelImportPreview<any>> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('فایل اکسل خالی یا فاقد شیت است.')

  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], {
    defval: '',
  })

  const batchId = Math.random().toString(36).substring(7)
  const errors: ExcelImportError[] = []
  const validRows: any[] = []

  const trains = await prisma.train.findMany({ select: { id: true, trainNumber: true } })
  const trainMap = new Map(trains.map((t) => [t.trainNumber, t.id]))

  const wagons = await prisma.wagon.findMany({ select: { id: true, trainId: true, position: true } })
  const wagonMap = new Map(wagons.map((w) => [`${w.trainId}-${w.position}`, w.id]))

  const faultCodes = await prisma.faultCode.findMany({ select: { id: true, code: true, requiresWagon: true } })
  const codeMap = new Map(faultCodes.map((f) => [f.code, f]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const trainNumber = toEn(String(row['شماره قطار'] || row['trainNumber'] || '')).trim()
    const wagonPosRaw = toEn(String(row['موقعیت واگن'] || row['wagonPosition'] || '')).trim()
    const faultCodeStr = String(row['کد خطا'] || row['faultCode'] || '').trim().toUpperCase()
    const description = String(row['شرح خرابی'] || row['description'] || '').trim()
    const locationNote = String(row['موقعیت وقوع'] || row['locationNote'] || '').trim()
    const occurredAtRaw = String(row['تاریخ وقوع'] || row['occurredAt'] || '').trim()
    const priorityRaw = String(row['اولویت'] || row['priority'] || '').trim().toLowerCase()
    const impactRaw = String(row['اثر بر سرویس'] || row['serviceImpact'] || 'none').trim().toLowerCase()
    
    // Repair details for historical imports
    const actionsTaken = String(row['اقدامات انجام‌شده'] || row['actionsTaken'] || '').trim()
    const rootCause = String(row['علت ریشه‌ای'] || row['rootCause'] || '').trim()
    const repairedAtRaw = String(row['تاریخ رفع'] || row['repairedAt'] || '').trim()

    if (!trainNumber) {
      errors.push({ row: rowNum, keyIdentifier: 'نامشخص', reason: 'شماره قطار الزامی است.' })
      continue
    }

    const trainId = trainMap.get(trainNumber)
    if (!trainId) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: `قطار با شماره ${trainNumber} یافت نشد.` })
      continue
    }

    if (!faultCodeStr) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'کد خطا الزامی است.' })
      continue
    }

    const fc = codeMap.get(faultCodeStr)
    if (!fc) {
      errors.push({ row: rowNum, keyIdentifier: faultCodeStr, reason: `کد خطا ${faultCodeStr} در کاتالوگ یافت نشد.` })
      continue
    }

    let wagonId: string | null = null
    const position = parseInt(wagonPosRaw, 10)
    if (fc.requiresWagon) {
      if (isNaN(position) || position < 1 || position > 10) {
        errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'موقعیت واگن نامعتبر یا خالی است در حالی که کد خطا نیاز به واگن دارد.' })
        continue
      }
      wagonId = wagonMap.get(`${trainId}-${position}`) || null
      if (!wagonId) {
        errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: `واگن شماره ${position} در ترکیب قطار ${trainNumber} یافت نشد.` })
        continue
      }
    }

    if (!description) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'شرح خرابی الزامی است.' })
      continue
    }

    if (!occurredAtRaw) {
      errors.push({ row: rowNum, keyIdentifier: trainNumber, reason: 'تاریخ وقوع الزامی است.' })
      continue
    }

    const occurredAt = parseDate(occurredAtRaw)
    
    // Priority mapping
    let priority: TicketPriority = 'medium'
    if (priorityRaw === 'low' || priorityRaw === 'کم') priority = 'low'
    else if (priorityRaw === 'high' || priorityRaw === 'زیاد') priority = 'high'
    else if (priorityRaw === 'critical' || priorityRaw === 'بحرانی') priority = 'critical'

    // Impact mapping
    let serviceImpact = 'none'
    if (impactRaw === 'delay' || impactRaw === 'تاخیر') serviceImpact = 'delay'
    else if (impactRaw === 'evacuated' || impactRaw === 'تخلیه مسافر' || impactRaw === 'تخلیه') serviceImpact = 'evacuated'
    else if (impactRaw === 'removed_from_service' || impactRaw === 'خروج از سرویس') serviceImpact = 'removed_from_service'

    // Historical details
    let isHistorical = false
    let repairEndAt: Date | null = null
    if (actionsTaken && rootCause && repairedAtRaw) {
      isHistorical = true
      repairEndAt = parseDate(repairedAtRaw)
    }

    validRows.push({
      trainId,
      trainNumber,
      wagonId,
      wagonPosition: isNaN(position) ? null : position,
      faultCodeId: fc.id,
      faultCode: faultCodeStr,
      description,
      locationNote: locationNote || null,
      occurredAt,
      priority,
      serviceImpact,
      isHistorical,
      actionsTaken: actionsTaken || null,
      rootCause: rootCause || null,
      repairEndAt,
    })
  }

  return {
    batchId,
    validCount: validRows.length,
    errorCount: errors.length,
    errors,
    validRows,
  }
}

export async function commitFaultReportsImport(
  validRows: any[],
  batchId: string,
  actorId: string
) {
  return await prisma.$transaction(async (tx) => {
    let successCount = 0

    for (const row of validRows) {
      // 1. Programmatic unique F-numbering (SQLite safe autoincrement)
      const lastReport = await tx.faultReport.findFirst({
        orderBy: { faultNo: 'desc' },
        select: { faultNo: true },
      })
      const faultNo = lastReport ? lastReport.faultNo + 1 : 1001

      // 2. Set statuses
      const status: FaultStatus = row.isHistorical ? 'verified_closed' : 'submitted'
      const closedAt = row.isHistorical ? row.repairEndAt : null
      const verifiedAt = row.isHistorical ? row.repairEndAt : null
      const repairStartAt = row.isHistorical ? row.occurredAt : null

      const report = await tx.faultReport.create({
        data: {
          faultNo,
          trainId: row.trainId,
          wagonId: row.wagonId,
          faultCodeId: row.faultCodeId,
          status,
          priority: row.priority,
          reporterId: actorId,
          description: row.description,
          locationNote: row.locationNote,
          occurredAt: row.occurredAt,
          serviceImpact: row.serviceImpact,
          actionsTaken: row.actionsTaken,
          rootCause: row.rootCause,
          repairStartAt,
          repairEndAt: row.repairEndAt,
          verifierId: row.isHistorical ? actorId : null,
          verifiedAt,
          closedAt,
        },
      })

      // 3. Create Creation Log with batch ID so we can rollback
      await tx.faultLog.create({
        data: {
          faultId: report.id,
          actorId,
          action: 'created',
          toStatus: status,
          note: `وارد شده از اکسل - دسته ${batchId}`,
        },
      })

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          entity: 'FaultReport',
          entityId: report.id,
          action: 'create',
          after: { faultNo, batchId, status },
        },
      })

      successCount++
    }

    return { successCount }
  })
}

/**
 * Rolls back an import batch by deleting reports created in it.
 */
export async function rollbackFaultReportsImport(batchId: string, actorId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find all logs with the batch ID note
    const logs = await tx.faultLog.findMany({
      where: {
        action: 'created',
        note: `وارد شده از اکسل - دسته ${batchId}`,
      },
      select: { faultId: true },
    })

    const faultIds = logs.map((l) => l.faultId)
    if (faultIds.length === 0) {
      throw new Error(`دسته ایمپورت با شناسه ${batchId} یافت نشد یا قبلاً حذف شده است.`)
    }

    // Delete reports (cascade deletes logs)
    const { count } = await tx.faultReport.deleteMany({
      where: { id: { in: faultIds } },
    })

    // Log the rollback in audit logs
    await tx.auditLog.create({
      data: {
        actorId,
        entity: 'FaultImportBatch',
        entityId: batchId,
        action: 'delete',
        before: { count },
        reason: 'لغو دسته جمعی بارگذاری اکسل',
      },
    })

    return { deletedCount: count }
  })
}

/**
 * Generates Excel error report byte buffer.
 */
export function generateExcelErrorReport(errors: ExcelImportError[]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ردیف', 'شناسه کلیدی', 'علت خطا'],
    ...errors.map((e) => [e.row, e.keyIdentifier, e.reason]),
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'خطاها')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}

/**
 * Helper to export any matrix or timeline to Excel.
 */
export function exportToExcel(
  headers: string[],
  rows: any[][],
  sheetName: string = 'گزارش'
): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  
  // Set sheet direction to RTL
  ws['!dir'] = 'rtl'

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
