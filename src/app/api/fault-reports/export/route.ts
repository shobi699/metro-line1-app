import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { getSettingValue } from '@/server/modules/settings/service'
import { exportToExcel } from '@/server/modules/faults/import-export'
import { jalali } from '@/lib/fa'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:export')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const reportType = searchParams.get('type') // persistent, recurrence, aging, matrix

  try {
    let headers: string[] = []
    let rows: any[][] = []
    let filename = 'report.xlsx'

    if (reportType === 'persistent') {
      const thresholdDays = await getSettingValue<number>('faults.persistent.thresholdDays', 7)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - thresholdDays)

      const reports = await prisma.faultReport.findMany({
        where: {
          OR: [
            { status: 'deferred' },
            {
              status: { in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'] },
              createdAt: { lte: cutoffDate },
            },
          ],
        },
        include: { train: true, wagon: true, faultCode: true },
      })

      headers = ['شماره فالت', 'قطار', 'واگن', 'کد خطا', 'شرح خرابی', 'وضعیت', 'اولویت', 'تاریخ ثبت']
      rows = reports.map((r) => [
        `F-${r.faultNo}`,
        r.train.trainNumber,
        r.wagon?.wagonCode || '—',
        r.faultCode.code,
        r.description,
        r.status,
        r.priority,
        jalali(r.createdAt),
      ])
      filename = 'faults-persistent.xlsx'
    } else if (reportType === 'recurrence') {
      const grouped = await prisma.faultReport.groupBy({
        by: ['trainId', 'faultCodeId'],
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
      })

      headers = ['قطار', 'کد خطا', 'عنوان خطا', 'تعداد تکرار']
      for (const g of grouped) {
        const train = await prisma.train.findUnique({ where: { id: g.trainId } })
        const code = await prisma.faultCode.findUnique({ where: { id: g.faultCodeId } })
        if (train && code) {
          rows.push([train.trainNumber, code.code, code.title, g._count.id])
        }
      }
      filename = 'faults-recurrence.xlsx'
    } else if (reportType === 'aging') {
      const trains = await prisma.train.findMany({
        where: { isActive: true },
        include: { faults: true },
      })

      headers = ['شماره قطار', 'تعداد کل فالت‌ها', 'فالت‌های باز', 'میانگین زمان تعمیر (MTTR - ساعت)', 'نقض SLA']
      for (const t of trains) {
        const total = t.faults.length
        const open = t.faults.filter((f) =>
          ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'].includes(f.status)
        ).length
        const closed = t.faults.filter((f) =>
          ['repaired', 'verified_closed'].includes(f.status) && f.repairStartAt && f.repairEndAt
        )
        
        let totalMs = 0
        closed.forEach((f) => {
          totalMs += f.repairEndAt!.getTime() - f.repairStartAt!.getTime()
        })
        const mttrHours = closed.length > 0 ? (totalMs / (1000 * 60 * 60)) / closed.length : 0
        const breaches = t.faults.filter((f) => f.slaBreached).length

        rows.push([t.trainNumber, total, open, Math.round(mttrHours * 10) / 10, breaches])
      }
      filename = 'trains-aging.xlsx'
    } else {
      return NextResponse.json({ error: 'نوع گزارش نامعتبر است' }, { status: 400 })
    }

    const buffer = exportToExcel(headers, rows)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در خروجی اکسل' }, { status: 500 })
  }
}
