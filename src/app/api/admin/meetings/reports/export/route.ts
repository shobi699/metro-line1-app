import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import * as XLSX from 'xlsx'
import { jalali, toFa } from '@/lib/fa'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin' && user.roleKey !== 'manager') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const typeId = searchParams.get('typeId') || undefined
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const where: any = {}
  if (typeId) where.typeId = typeId
  if (fromStr || toStr) {
    where.scheduledAt = {}
    if (fromStr) where.scheduledAt.gte = new Date(fromStr)
    if (toStr) where.scheduledAt.lte = new Date(toStr)
  }

  const meetings = await prisma.meetingRequest.findMany({
    where,
    include: {
      requester: { select: { name: true, personnelCode: true } },
      targetManager: { select: { name: true } },
      room: { select: { name: true } },
      meetingType: { select: { title: true } }
    },
    orderBy: { scheduledAt: 'desc' }
  })

  const headers = [
    'ردیف',
    'موضوع',
    'توضیحات',
    'درخواست‌دهنده',
    'کد پرسنلی',
    'میزبان',
    'نوع جلسه',
    'اتاق جلسه',
    'تاریخ برگزاری',
    'ساعت برگزاری',
    'مدت (دقیقه)',
    'وضعیت',
    'علت لغو',
    'صورت‌جلسه'
  ]

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    rescheduled: 'زمان پیشنهادی جایگزین',
    completed: 'پایان‌یافته'
  }

  const rows = meetings.map((m, index) => {
    const meetTime = m.scheduledAt.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    const dateStr = jalali(m.scheduledAt)

    return [
      index + 1,
      m.title,
      m.description ?? '',
      m.requester?.name ?? '',
      m.requester?.personnelCode ?? '',
      m.targetManager?.name ?? '',
      m.meetingType?.title ?? '',
      m.room?.name ?? '',
      dateStr,
      meetTime,
      m.durationMinutes,
      statusLabels[m.status] || m.status,
      m.cancelReason ?? '',
      m.outcomeNote ?? ''
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'گزارش جلسات')

  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="meetings-report.xlsx"',
    },
  })
}
