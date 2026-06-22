import * as XLSX from 'xlsx'
import { hashPassword } from '@/server/auth/password'
import { prisma } from '@/server/db'
import { userImportRowSchema } from '@/server/dto/directory'
import { Prisma, type RoleKey } from '@/generated/prisma/client'

export interface ImportError {
  row: number
  nationalId: string
  reason: string
}

export interface ImportResult {
  successCount: number
  errorCount: number
  errors: ImportError[]
  totalRows: number
}

export async function importUsersFromExcel(
  fileBuffer: ArrayBuffer,
  actorId: string,
): Promise<ImportResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      successCount: 0,
      errorCount: 0,
      errors: [],
      totalRows: 0,
    }
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: '' },
  )

  if (rows.length === 0) {
    return {
      successCount: 0,
      errorCount: 0,
      errors: [],
      totalRows: 0,
    }
  }

  const importJob = await prisma.importJob.create({
    data: {
      fileName: 'excel-import',
      fileType: 'xlsx',
      status: 'processing',
      rowCount: rows.length,
      actorId,
    },
  })

  const errors: ImportError[] = []
  const validRows: Array<{
    nationalId: string
    name: string
    phone: string | null
    email: string | null
    roleKey: string
    password: string
  }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // header is row 1
    const nationalId = String(row['کد ملی'] ?? row['nationalId'] ?? '')

    const parsed = userImportRowSchema.safeParse({
      nationalId,
      name: String(row['نام'] ?? row['name'] ?? ''),
      phone: String(row['موبایل'] ?? row['phone'] ?? ''),
      email: String(row['ایمیل'] ?? row['email'] ?? ''),
      role: String(row['نقش'] ?? row['role'] ?? 'operator'),
      password: String(row['رمز عبور'] ?? row['password'] ?? ''),
    })

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        nationalId,
        reason: parsed.error.issues.map((e) => e.message).join(', '),
      })
      continue
    }

    const data = parsed.data

    // Check duplicate nationalId in DB
    const existing = await prisma.user.findUnique({
      where: { nationalId: data.nationalId },
    })
    if (existing) {
      errors.push({
        row: rowNumber,
        nationalId: data.nationalId,
        reason: 'کد ملی تکراری است',
      })
      continue
    }

    // Check duplicate in current batch
    if (validRows.some((r) => r.nationalId === data.nationalId)) {
      errors.push({
        row: rowNumber,
        nationalId: data.nationalId,
        reason: 'کد ملی در فایل تکراری است',
      })
      continue
    }

    const defaultPassword = data.password || 'changeme123'
    validRows.push({
      nationalId: data.nationalId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      roleKey: data.role,
      password: defaultPassword,
    })
  }

  // Create valid users
  let successCount = 0
  const defaultRole = await prisma.role.findUnique({
    where: { key: 'operator' },
  })

  for (const row of validRows) {
    try {
      const role = await prisma.role.findUnique({ where: { key: row.roleKey as RoleKey } })
      const roleId = role?.id ?? defaultRole?.id
      if (!roleId) continue

      const passwordHash = await hashPassword(row.password)
      await prisma.user.create({
        data: {
          nationalId: row.nationalId,
          name: row.name,
          phone: row.phone,
          email: row.email,
          passwordHash,
          status: 'active',
          roleId,
        },
      })
      successCount++
    } catch {
      errors.push({
        row: successCount + errors.length + 2,
        nationalId: row.nationalId,
        reason: 'خطا در ایجاد کاربر',
      })
    }
  }

  await prisma.importJob.update({
    where: { id: importJob.id },
    data: {
      status: errors.length === 0 ? 'completed' : 'failed',
      rowCount: rows.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? JSON.stringify(errors) : Prisma.JsonNull,
    },
  })

  return {
    successCount,
    errorCount: errors.length,
    errors,
    totalRows: rows.length,
  }
}

export function generateErrorReport(errors: ImportError[]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ردیف', 'کد ملی', 'دلیل خطا'],
    ...errors.map((e) => [e.row, e.nationalId, e.reason]),
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'خطاها')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
