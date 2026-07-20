import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'
import { toEn } from '@/lib/fa'
import type { ExcelImportError, ExcelImportPreview } from '../faults/import-export'

export async function validatePartsExcel(
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

  const existingParts = await prisma.part.findMany({ select: { name: true, partNumber: true } })
  const existingNames = new Set(existingParts.map((p) => p.name.trim().toLowerCase()))
  const existingPartNumbers = new Set(
    existingParts.filter((p) => p.partNumber).map((p) => p.partNumber!.trim().toLowerCase())
  )

  const fileNames = new Set<string>()
  const filePartNumbers = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed + header row

    const name = String(row['نام قطعه'] || row['name'] || '').trim()
    const partNumber = toEn(String(row['شماره قطعه'] || row['partNumber'] || '')).trim()
    const trainType = String(row['نوع قطار'] || row['trainType'] || 'both').trim()
    const description = String(row['توضیحات'] || row['description'] || '').trim()

    if (!name) {
      errors.push({
        row: rowNum,
        keyIdentifier: `ردیف ${rowNum}`,
        reason: 'نام قطعه الزامی است.',
      })
      continue
    }

    const nameLower = name.toLowerCase()
    if (existingNames.has(nameLower) || fileNames.has(nameLower)) {
      errors.push({
        row: rowNum,
        keyIdentifier: name,
        reason: 'نام قطعه تکراری است.',
      })
      continue
    }

    if (partNumber) {
      const partNoLower = partNumber.toLowerCase()
      if (existingPartNumbers.has(partNoLower) || filePartNumbers.has(partNoLower)) {
        errors.push({
          row: rowNum,
          keyIdentifier: partNumber,
          reason: 'شماره قطعه تکراری است.',
        })
        continue
      }
      filePartNumbers.add(partNoLower)
    }

    if (trainType !== 'AC' && trainType !== 'DC' && trainType !== 'both') {
      errors.push({
        row: rowNum,
        keyIdentifier: name,
        reason: 'نوع قطار نامعتبر است (باید AC، DC یا both باشد).',
      })
      continue
    }

    fileNames.add(nameLower)
    validRows.push({
      name,
      partNumber: partNumber || null,
      trainType,
      description: description || null,
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

export async function commitPartsImport(validRows: any[], actorId: string) {
  return await prisma.$transaction(async (tx) => {
    const created = []
    for (const data of validRows) {
      const part = await tx.part.create({
        data: {
          name: data.name,
          partNumber: data.partNumber || null,
          trainType: data.trainType,
          description: data.description || null,
          isActive: true,
        },
      })
      created.push(part)
    }

    await tx.auditLog.create({
      data: {
        actorId,
        entity: 'Part',
        entityId: 'batch',
        action: 'import',
        after: { count: validRows.length },
      },
    })

    return created
  })
}

export async function createPart(data: {
  name: string
  partNumber?: string | null
  trainType: string
  description?: string | null
}, actorId: string) {
  const existing = await prisma.part.findFirst({
    where: {
      OR: [
        { name: data.name },
        data.partNumber ? { partNumber: data.partNumber } : {},
      ].filter((x) => Object.keys(x).length > 0),
    },
  })

  if (existing) {
    if (existing.name === data.name) {
      throw new Error('نام قطعه قبلا ثبت شده است.')
    }
    if (data.partNumber && existing.partNumber === data.partNumber) {
      throw new Error('شماره قطعه قبلا ثبت شده است.')
    }
  }

  const part = await prisma.part.create({
    data: {
      name: data.name,
      partNumber: data.partNumber || null,
      trainType: data.trainType,
      description: data.description || null,
      isActive: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Part',
      entityId: part.id,
      action: 'create',
      after: part,
    },
  })

  return part
}

export async function deletePart(id: string, actorId: string) {
  const part = await prisma.part.update({
    where: { id },
    data: { isActive: false },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Part',
      entityId: part.id,
      action: 'delete',
      after: { id, isActive: false },
    },
  })

  return part
}
