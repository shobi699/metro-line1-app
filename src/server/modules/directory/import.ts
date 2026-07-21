import * as XLSX from 'xlsx'
import { hashPassword } from '@/server/auth/password'
import { prisma } from '@/server/db'
import { userImportRowSchema } from '@/lib/zod/directory'
import { Prisma } from '@/generated/prisma/client'
import { toEn } from '@/lib/fa'

export interface ImportError {
  row: number
  personnelCode: string
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

  const customFieldDefs = await prisma.customFieldDef.findMany({
    where: { entityType: 'User' },
  })

  const errors: ImportError[] = []
  const validRows: Array<{
    rowNumber: number
    personnelCode: string
    name: string
    phone: string | null
    email: string | null
    roleKey: string
    password: string
    status: 'active' | 'suspended' | 'pending'
    customFields: Record<string, unknown>
  }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // header is row 1
    
    const rawPNo = String(row['کد پرسنلی'] ?? row['personnelNo'] ?? '').trim()
    const personnelNo = toEn(rawPNo)

    const rawNationalId = String(row['کد پرسنلی'] ?? row['personnelCode'] ?? '').trim()
    let personnelCode = toEn(rawNationalId)
    
    // Normalize national ID: pad with leading zeros if it's 8 or 9 digits
    if (personnelCode && personnelCode !== '0') {
      personnelCode = personnelCode.padStart(10, '0')
    }

    // Fallback: if national ID is missing, '0', or invalid, use personnelNo padded to 10 digits
    if (!personnelCode || personnelCode === '0' || personnelCode === '0000000000' || !/^\d{10}$/.test(personnelCode)) {
      if (personnelNo) {
        personnelCode = personnelNo.padStart(10, '0')
      }
    }

    const firstName = String(row['نام'] ?? '').trim()
    const lastName = String(row['نام خانوادگی'] ?? '').trim()
    let name = String(row['name'] ?? '').trim()
    if (!name) {
      name = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '')
    }

    const rawPhone = String(row['تلفن1'] ?? row['موبایل'] ?? row['phone'] ?? '').trim()
    let phone = toEn(rawPhone)
    if (phone && !phone.startsWith('0') && phone.length === 10) {
      phone = '0' + phone
    }

    const email = String(row['ایمیل'] ?? row['email'] ?? '').trim()
    const role = String(row['نقش'] ?? row['role'] ?? 'operator').trim()
    const password = String(row['رمز عبور'] ?? row['password'] ?? '').trim()

    // Map status from وضعيت راهبری
    const rawStatus = String(row['وضعيت راهبری'] ?? row['وضعیت'] ?? row['status'] ?? '').trim()
    let status: 'active' | 'suspended' | 'pending' = 'active'
    if (rawStatus === 'معلق' || rawStatus === 'suspended') {
      status = 'suspended'
    } else if (rawStatus === 'در حال بررسی' || rawStatus === 'pending') {
      status = 'pending'
    }

    // Default password before safeParse to prevent validation failures
    const defaultPassword = password || 'changeme123'

    const parsed = userImportRowSchema.safeParse({
      personnelCode,
      name,
      phone,
      email,
      role,
      password: defaultPassword,
    })

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        personnelCode: personnelCode || '',
        reason: parsed.error.issues.map((e) => e.message).join(', '),
      })
      continue
    }

    const data = parsed.data

    // Check duplicate personnelCode in DB
    const existing = await prisma.user.findUnique({
      where: { personnelCode: data.personnelCode },
    })
    if (existing) {
      errors.push({
        row: rowNumber,
        personnelCode: data.personnelCode,
        reason: 'کد پرسنلی تکراری است',
      })
      continue
    }

    // Check duplicate in current batch
    if (validRows.some((r) => r.personnelCode === data.personnelCode)) {
      errors.push({
        row: rowNumber,
        personnelCode: data.personnelCode,
        reason: 'کد پرسنلی در فایل تکراری است',
      })
      continue
    }

    // Extract custom fields from Excel row
    const userCustomFields: Record<string, unknown> = {}
    for (const def of customFieldDefs) {
      const rawVal = row[def.label] ?? row[def.name]
      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
        let val: string | number | boolean = String(rawVal).trim()
        if (def.type === 'number') {
          const num = Number(val)
          val = isNaN(num) ? val : num
        } else if (def.type === 'boolean') {
          val = val === 'true' || val === '1' || val === 'بله' || val === 'yes'
        }
        userCustomFields[def.name] = val
      } else if (def.defaultValue !== undefined && def.defaultValue !== null && def.defaultValue !== '') {
        let val: string | number | boolean = def.defaultValue
        if (def.type === 'boolean') {
          val = val === 'true' || val === 'بله'
        } else if (def.type === 'number') {
          val = Number(val)
        }
        userCustomFields[def.name] = val
      }
    }

    validRows.push({
      rowNumber,
      personnelCode: data.personnelCode,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      roleKey: data.role,
      password: defaultPassword,
      status,
      customFields: userCustomFields,
    })
  }

  // Create valid users
  let successCount = 0
  
  // Look for driver role first, then operator role as default
  let defaultRole = await prisma.role.findUnique({
    where: { key: 'driver' },
  })
  if (!defaultRole) {
    defaultRole = await prisma.role.findUnique({
      where: { key: 'operator' },
    })
  }

  const { POST_TO_ROLE_KEY } = await import('@/server/rbac/permissions')

  const passwordHashMap = new Map<string, string>()

  for (const row of validRows) {
    try {
      // Map post to role if present
      const postVal = row.customFields?.post
      let resolvedRoleId = null
      if (postVal && typeof postVal === 'string') {
        let mappedRoleKey = POST_TO_ROLE_KEY[postVal]
        if (!mappedRoleKey) {
          // Fallback: check substring match (e.g. "راهبر قطار" matching "راهبر")
          for (const [k, v] of Object.entries(POST_TO_ROLE_KEY)) {
            if (postVal.includes(k) || k.includes(postVal)) {
              mappedRoleKey = v
              break
            }
          }
        }
        if (mappedRoleKey) {
          const matchedRole = await prisma.role.findUnique({
            where: { key: mappedRoleKey },
          })
          if (matchedRole) {
            resolvedRoleId = matchedRole.id
          }
        }
      }

      if (!resolvedRoleId) {
        let role = await prisma.role.findUnique({ where: { key: row.roleKey } })
        if (!role) {
          role = await prisma.role.findFirst({ where: { title: row.roleKey } })
        }
        resolvedRoleId = role?.id ?? defaultRole?.id
      }

      if (!resolvedRoleId) continue

      let passwordHash = passwordHashMap.get(row.password)
      if (!passwordHash) {
        passwordHash = await hashPassword(row.password)
        passwordHashMap.set(row.password, passwordHash)
      }

      await prisma.user.create({
        data: {
          personnelCode: row.personnelCode,
          name: row.name,
          phone: row.phone,
          email: row.email,
          passwordHash,
          status: row.status,
          roleId: resolvedRoleId,
          customFields: row.customFields as Prisma.InputJsonValue,
        },
      })
      successCount++
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({
        row: row.rowNumber,
        personnelCode: row.personnelCode,
        reason: `خطا در ایجاد کاربر: ${message}`,
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
    ['ردیف', 'کد پرسنلی', 'دلیل خطا'],
    ...errors.map((e) => [e.row, e.personnelCode, e.reason]),
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'خطاها')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
