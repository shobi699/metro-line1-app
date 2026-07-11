import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (!can(user, 'iam:users')) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'هیچ فایلی ارسال نشده است' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data: any[] = XLSX.utils.sheet_to_json(worksheet)

    const errors: { row: number; reason: string }[] = []
    const validRows: any[] = []

    // Cache roles to validate role assignments
    const allRoles = await prisma.role.findMany()
    const roleKeyToId = Object.fromEntries(allRoles.map(r => [r.key, r.id]))

    const defaultRole = allRoles.find(r => r.key === 'operator') || allRoles[0]
    if (!defaultRole) {
      return NextResponse.json({ error: 'هیچ نقشی در سیستم تعریف نشده است' }, { status: 500 })
    }

    // Pass 1: Validation (Dry Run)
    let rowIndex = 2 // Row 1 is header
    for (const row of data) {
      const personnelCode = row['کد پرسنلی']?.toString()?.trim()
      const name = row['نام و نام خانوادگی']?.toString()?.trim()
      const roleKey = row['شناسه نقش']?.toString()?.trim() || 'operator'

      if (!personnelCode) {
        errors.push({ row: rowIndex, reason: 'کد پرسنلی اجباری است' })
      } else if (personnelCode.length < 3) {
        errors.push({ row: rowIndex, reason: 'کد پرسنلی نامعتبر است' })
      }

      if (!name) {
        errors.push({ row: rowIndex, reason: 'نام و نام خانوادگی اجباری است' })
      }

      let mappedRoleId = defaultRole.id
      if (roleKey) {
        if (!roleKeyToId[roleKey]) {
          errors.push({ row: rowIndex, reason: `شناسه نقش '${roleKey}' یافت نشد` })
        } else {
          mappedRoleId = roleKeyToId[roleKey]
        }
      }

      if (personnelCode && name) {
        validRows.push({
          personnelCode,
          name,
          roleId: mappedRoleId,
          phone: row['تلفن']?.toString()?.trim() || null,
          email: row['ایمیل']?.toString()?.trim() || null,
          plateSearch: row['پلاک خودرو']?.toString()?.trim() || '',
          row: rowIndex
        })
      }

      rowIndex++
    }

    // Pass 2: Check database for duplicates
    if (validRows.length > 0) {
      const existingCodes = await prisma.user.findMany({
        where: { personnelCode: { in: validRows.map(r => r.personnelCode) } },
        select: { personnelCode: true }
      })
      const existingSet = new Set(existingCodes.map(r => r.personnelCode))

      for (const row of validRows) {
        if (existingSet.has(row.personnelCode)) {
          errors.push({ row: row.row, reason: `کاربر با کد پرسنلی ${row.personnelCode} قبلا ثبت شده است` })
        }
      }
    }

    // According to RULE, if any error exists, do not commit.
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'فایل حاوی خطا است. هیچ رکوردی ذخیره نشد.',
        errors
      }, { status: 400 })
    }

    // Pass 3: Commit
    const defaultPasswordHash = await bcrypt.hash('123456', 10)
    
    // We create them in bulk
    const createdCount = await prisma.user.createMany({
      data: validRows.map(r => ({
        personnelCode: r.personnelCode,
        name: r.name,
        roleId: r.roleId,
        phone: r.phone,
        email: r.email,
        plateSearch: r.plateSearch,
        passwordHash: defaultPasswordHash,
        status: 'active' // Activated by default if imported by admin
      }))
    })

    return NextResponse.json({
      success: true,
      message: `${createdCount.count} کاربر با موفقیت اضافه شدند`,
      errors: []
    })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'خطا در خواندن فایل' }, { status: 500 })
  }
}
