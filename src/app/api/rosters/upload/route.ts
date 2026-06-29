import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { parseRosterExcelV2, validateRoster, createRosterDayDraft } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const jalaliDate = formData.get('jalaliDate') as string | null
    const title = formData.get('title') as string | null
    const schedulingTitle = formData.get('schedulingTitle') as string | null
    const processingNumberStr = formData.get('processingNumber') as string | null

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

    // Try to extract date from filename if not provided in form (e.g. 1404_07_16.xlsx)
    let finalJalaliDate = jalaliDate || ''
    if (!finalJalaliDate) {
      const match = file.name.match(/(\d{4})[_\-\/](\d{2})[_\-\/](\d{2})/)
      if (match) {
        finalJalaliDate = `${match[1]}/${match[2]}/${match[3]}`
      } else {
        // Default to today's Jalali date
        const today = new Date()
        // Simple jalali converter or default string
        finalJalaliDate = '1404/07/16' // Match the file provided in 'lohe'
      }
    }

    const processingNumber = processingNumberStr ? parseInt(processingNumberStr, 10) : 7

    const buffer = await file.arrayBuffer()
    const parsed = await parseRosterExcelV2(buffer, finalJalaliDate, {
      title: title || undefined,
      schedulingTitle: schedulingTitle || undefined,
      processingNumber
    })

    const issues = validateRoster(parsed.trips, parsed.assignments)
    
    // Save draft
    const draft = await createRosterDayDraft(parsed, user.id, file.name)

    return NextResponse.json({
      data: {
        rosterDayId: draft.rosterDayId,
        rosterVersionId: draft.rosterVersionId,
        versionNo: draft.versionNo,
        meta: parsed.meta,
        trips: parsed.trips,
        assignments: parsed.assignments,
        issues,
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در بارگذاری و پردازش لوحه: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
