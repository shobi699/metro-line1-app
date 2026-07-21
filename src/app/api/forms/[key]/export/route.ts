import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import * as XLSX from 'xlsx'
import { jalali, faTime } from '@/lib/fa'

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  submitted: 'ارسال شده',
  in_review: 'در حال بررسی',
  needs_changes: 'نیاز به اصلاح',
  approved: 'تایید نهایی',
  rejected: 'رد شده',
  cancelled: 'لغو شده',
}

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:report')
  if (err) return authErrorResponse(err)

  try {
    const template = await prisma.formTemplate.findUnique({
      where: { key },
      include: {
        versions: { where: { isActive: true }, take: 1 },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'قالب فرم یافت نشد.' }, { status: 404 })
    }

    const activeVersion = template.versions[0]
    if (!activeVersion) {
      return NextResponse.json({ error: 'نسخه فعالی برای این فرم وجود ندارد.' }, { status: 400 })
    }

    const schema = activeVersion.schema as any
    const fields = schema.fields as any[]

    // ۱. هدرها
    const headers = [
      'شماره درخواست',
      'متقاضی',
      'وضعیت',
      'تاریخ ثبت',
      ...fields.map((f) => f.label),
    ]

    // ۲. دریافت داده‌ها
    const submissions = await prisma.formSubmission.findMany({
      where: { templateId: template.id },
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { name: true } },
      },
    })

    // ۳. سطرها
    const rows = submissions.map((sub) => {
      const data = sub.data as Record<string, any>
      const rowValues = fields.map((field) => {
        const val = data[field.name]
        if (val === undefined || val === null) return ''
        if (typeof val === 'boolean') return val ? 'بله' : 'خیر'
        if (Array.isArray(val)) return val.join('، ')
        return String(val)
      })

      return [
        `R-${sub.submissionNo}`,
        sub.submitter.name,
        STATUS_LABELS[sub.status] || sub.status,
        `${jalali(sub.createdAt)} ${faTime(sub.createdAt)}`,
        ...rowValues,
      ]
    })

    // ۴. ساخت شیت اکسل
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws['!dir'] = 'rtl' // جهت راست به چپ برای هماهنگی با زبان فارسی

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, template.title.slice(0, 30))

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(template.title)}.xlsx"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
