import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { parseRosterExcel, applyRosterToShifts } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const rosterFiles = await prisma.rosterFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        uploader: {
          select: { name: true },
        },
      },
    })
    return NextResponse.json({ data: rosterFiles })
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه لوحه‌ها' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'فایل ارسال نشد' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    return NextResponse.json(
      { error: 'فرمت فایل نامعتبر است. فقط فایل Excel پذیرفته می‌شود.' },
      { status: 400 },
    )
  }

  try {
    const buffer = await file.arrayBuffer()
    const parsed = parseRosterExcel(buffer)

    if (parsed.rows.length === 0 && parsed.unmapped.length > 0) {
      return NextResponse.json({
        data: {
          rosterFileId: '',
          successCount: 0,
          errorCount: parsed.unmapped.length,
          totalRows: 0,
          errors: parsed.unmapped.map((u) => ({
            row: u.row,
            nationalId: '',
            reason: u.reason,
          })),
          needsReview: false,
          rows: [],
        },
      })
    }

    // This creates the rosterFile draft and returns the ID without committing to Shift table yet
    const result = await applyRosterToShifts(parsed, user.id)

    // Merge unmapped into errors
    const allErrors = [
      ...result.errors,
      ...parsed.unmapped.map((u) => ({
        row: u.row,
        nationalId: '',
        reason: u.reason,
      })),
    ]

    // Add audit log for roster draft creation
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'RosterFile',
        entityId: result.rosterFileId,
        action: 'create',
        after: {
          fileName: file.name,
          successCount: result.successCount,
          errorCount: allErrors.length,
          status: 'draft',
        },
      },
    })

    return NextResponse.json({
      data: {
        rosterFileId: result.rosterFileId,
        successCount: result.successCount,
        errorCount: allErrors.length,
        totalRows: result.totalRows,
        errors: allErrors,
        needsReview: parsed.unmapped.length > 0 || allErrors.length > 0,
        rows: parsed.rows, // Returned for client-side preview
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در پردازش و استخراج لوحه شیفت: ' + message },
      { status: 500 }
    )
  }
}
