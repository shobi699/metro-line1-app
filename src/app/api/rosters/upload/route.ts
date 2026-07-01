import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { parseRosterExcelV2, validateRoster, createRosterDayDraft } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'
import { jdate } from '@/lib/dayjs'

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

    const autoMatchThresholdStr = formData.get('autoMatchThreshold') as string | null
    const reviewMatchThresholdStr = formData.get('reviewMatchThreshold') as string | null

    // Extract visual column mapping indexes
    const rightRowIndex = formData.get('rightRowIndex') as string | null
    const rightTrainIndex = formData.get('rightTrainIndex') as string | null
    const rightRIndex = formData.get('rightRIndex') as string | null
    const rightTIndex = formData.get('rightTIndex') as string | null
    const rightH1Index = formData.get('rightH1Index') as string | null
    const rightAssistTIndex = formData.get('rightAssistTIndex') as string | null
    const rightAssistRIndex = formData.get('rightAssistRIndex') as string | null
    const rightH2Index = formData.get('rightH2Index') as string | null
    const rightDepartureTimeIndex = formData.get('rightDepartureTimeIndex') as string | null
    const rightArrivalTimeIndex = formData.get('rightArrivalTimeIndex') as string | null

    const leftRowIndex = formData.get('leftRowIndex') as string | null
    const leftTrainIndex = formData.get('leftTrainIndex') as string | null
    const leftRIndex = formData.get('leftRIndex') as string | null
    const leftTIndex = formData.get('leftTIndex') as string | null
    const leftH1Index = formData.get('leftH1Index') as string | null
    const leftAssistTIndex = formData.get('leftAssistTIndex') as string | null
    const leftAssistRIndex = formData.get('leftAssistRIndex') as string | null
    const leftH2Index = formData.get('leftH2Index') as string | null
    const leftDepartureTimeIndex = formData.get('leftDepartureTimeIndex') as string | null
    const leftArrivalTimeIndex = formData.get('leftArrivalTimeIndex') as string | null

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
        finalJalaliDate = jdate().format('YYYY/MM/DD')
      }
    }

    const processingNumber = processingNumberStr ? parseInt(processingNumberStr, 10) : 7
    const autoMatchThreshold = autoMatchThresholdStr ? parseInt(autoMatchThresholdStr, 10) : 85
    const reviewMatchThreshold = reviewMatchThresholdStr ? parseInt(reviewMatchThresholdStr, 10) : 70

    // Construct Column Mappings if present
    const rightMapping = rightRowIndex !== null ? {
      block: 'RIGHT' as const,
      rowNoIndex: parseInt(rightRowIndex, 10),
      trainNumberIndex: parseInt(rightTrainIndex || '1', 10),
      rIndex: parseInt(rightRIndex || '2', 10),
      tIndex: parseInt(rightTIndex || '3', 10),
      h1Index: parseInt(rightH1Index || '4', 10),
      assistantTIndex: parseInt(rightAssistTIndex || '5', 10),
      assistantRIndex: parseInt(rightAssistRIndex || '6', 10),
      h2Index: parseInt(rightH2Index || '7', 10),
      departureTimeIndex: parseInt(rightDepartureTimeIndex || '8', 10),
      arrivalTimeIndex: parseInt(rightArrivalTimeIndex || '9', 10),
    } : undefined

    const leftMapping = leftRowIndex !== null ? {
      block: 'LEFT' as const,
      rowNoIndex: parseInt(leftRowIndex, 10),
      trainNumberIndex: parseInt(leftTrainIndex || '11', 10),
      rIndex: parseInt(leftRIndex || '12', 10),
      tIndex: parseInt(leftTIndex || '13', 10),
      h1Index: parseInt(leftH1Index || '14', 10),
      assistantTIndex: parseInt(leftAssistTIndex || '15', 10),
      assistantRIndex: parseInt(leftAssistRIndex || '16', 10),
      h2Index: parseInt(leftH2Index || '17', 10),
      departureTimeIndex: parseInt(leftDepartureTimeIndex || '18', 10),
      arrivalTimeIndex: parseInt(leftArrivalTimeIndex || '19', 10),
    } : undefined

    const buffer = await file.arrayBuffer()
    const parsed = await parseRosterExcelV2(buffer, finalJalaliDate, {
      title: title || undefined,
      schedulingTitle: schedulingTitle || undefined,
      processingNumber,
      rightMapping,
      leftMapping,
      autoMatchThreshold,
      reviewMatchThreshold
    })

    const issues = await validateRoster(parsed.trips, parsed.assignments)
    
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
