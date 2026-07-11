import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { getPostAckStats } from '@/server/modules/content/service'
import * as XLSX from 'xlsx'
import { jalali, faTime } from '@/lib/fa'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { id } = await params

  try {
    const stats = await getPostAckStats(id)

    const headers = [
      'نام و نام خانوادگی',
      'کد پرسنلی',
      'نقش/سمت',
      'ایستگاه',
      'وضعیت تایید',
      'تاریخ تایید',
      'دستگاه',
      'آدرس IP',
      'امضا/تعهد',
    ]

    const rows: any[] = []

    // 1. Add Acknowledged Users
    stats.acknowledgedList.forEach((item) => {
      const dateStr = item.ackAt ? `${jalali(item.ackAt)} ${faTime(item.ackAt)}` : ''
      rows.push([
        item.name,
        item.personnelCode,
        item.role,
        item.station,
        'تایید شده',
        dateStr,
        item.device || '',
        item.ip || '',
        item.signature || '',
      ])
    })

    // 2. Add Remaining Users
    stats.remainingList.forEach((item) => {
      rows.push([
        item.name,
        item.personnelCode,
        item.role,
        item.station,
        'منتظر تایید',
        '',
        '',
        '',
        '',
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!dir'] = 'rtl'

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'رسیدها')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(stats.title)}.xlsx"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
