import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
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

const DECISION_LABELS: Record<string, string> = {
  approve: 'تایید شد',
  reject: 'رد شد',
  request_changes: 'نیاز به اصلاح',
  refer: 'ارجاع داده شد',
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: {
        template: true,
        version: true,
        submitter: { select: { name: true, phone: true, role: { select: { name: true } } } },
        steps: {
          orderBy: { createdAt: 'asc' },
          include: { decidedBy: { select: { name: true } } },
        },
      },
    })

    if (!submission) {
      return new Response('درخواست یافت نشد.', { status: 404 })
    }

    const schema = submission.version.schema as any
    const fields = schema.fields as any[]
    const data = submission.data as Record<string, any>

    // ساخت فیلدهای چاپی
    const fieldsHtml = fields
      .map((f) => {
        let val = data[f.name]
        if (val === undefined || val === null) val = '-'
        else if (typeof val === 'boolean') val = val ? 'بله' : 'خیر'
        else if (Array.isArray(val)) val = val.join('، ')

        return `
        <div class="border-b border-gray-200 py-3 flex justify-between text-sm">
          <span class="font-bold text-gray-700">${f.label}:</span>
          <span class="text-gray-900 font-medium">${val}</span>
        </div>
      `
      })
      .join('')

    // ساخت گام‌های گردش‌کار
    const stepsHtml = submission.steps
      .map((step) => {
        const decidedByStr = step.decidedBy?.name ? `توسط ${step.decidedBy.name}` : ''
        const decisionStr = step.decision ? DECISION_LABELS[step.decision] || step.decision : 'در انتظار اقدام'
        const dateStr = step.decidedAt ? `${jalali(step.decidedAt)} ساعت ${faTime(step.decidedAt)}` : '-'

        return `
        <tr class="border-b border-gray-200">
          <td class="px-4 py-2.5 font-bold text-gray-800">${step.stageTitle}</td>
          <td class="px-4 py-2.5">${step.assigneeId || '-'}</td>
          <td class="px-4 py-2.5">
            <span class="px-2 py-1 text-xs font-extrabold rounded ${
              step.decision === 'approve' ? 'bg-green-100 text-green-800' :
              step.decision === 'reject' ? 'bg-red-100 text-red-800' :
              step.decision === 'request_changes' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
            }">${decisionStr}</span>
          </td>
          <td class="px-4 py-2.5 text-xs">${decidedByStr}</td>
          <td class="px-4 py-2.5 text-xs text-gray-500">${dateStr}</td>
          <td class="px-4 py-2.5 text-xs italic text-gray-600">${step.note || '-'}</td>
        </tr>
      `
      })
      .join('')

    const html = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>نسخه چاپی درخواست R-${submission.submissionNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { font-size: 12px; }
            .no-print { display: none; }
            .print-border { border: 1px solid #ccc; }
          }
        </style>
      </head>
      <body class="bg-gray-50 p-6 font-sans">
        <div class="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 print-border">
          {/* Header */}
          <div class="flex justify-between items-center border-b-2 border-gray-300 pb-4 mb-6">
            <div class="text-right">
              <h1 class="text-lg font-extrabold text-gray-900">${submission.template.title}</h1>
              <p class="text-xs text-gray-500 mt-1">سیر و حرکت خط ۱ مترو تهران</p>
            </div>
            <div class="text-left text-xs text-gray-600 space-y-1">
              <div><strong>شماره درخواست:</strong> R-${submission.submissionNo}</div>
              <div><strong>تاریخ ثبت:</strong> ${jalali(submission.createdAt)} ${faTime(submission.createdAt)}</div>
              <div><strong>وضعیت:</strong> ${STATUS_LABELS[submission.status] || submission.status}</div>
            </div>
          </div>

          {/* Submitter */}
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 grid grid-cols-2 gap-4 text-sm mb-6">
            <div><strong class="text-gray-600">متقاضی:</strong> ${submission.submitter.name}</div>
            <div><strong class="text-gray-600">سمت/نقش:</strong> ${submission.submitter.role.name}</div>
            <div><strong class="text-gray-600">شماره تماس:</strong> ${submission.submitter.phone || '-'}</div>
          </div>

          {/* Fields */}
          <div class="mb-8">
            <h2 class="text-sm font-extrabold text-gray-900 border-b border-gray-300 pb-1.5 mb-3">مشخصات و اقلام فرم</h2>
            <div class="grid grid-cols-1 gap-1">
              ${fieldsHtml}
            </div>
          </div>

          {/* Workflow history */}
          <div class="mb-8">
            <h2 class="text-sm font-extrabold text-gray-900 border-b border-gray-300 pb-1.5 mb-3">تاریخچه گردش‌کار و امضاها</h2>
            <table class="w-full text-right text-xs">
              <thead>
                <tr class="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                  <th class="px-4 py-2">مرحله</th>
                  <th class="px-4 py-2">مسئول بررسی</th>
                  <th class="px-4 py-2">اقدام</th>
                  <th class="px-4 py-2">نام بررسی‌کننده</th>
                  <th class="px-4 py-2">تاریخ</th>
                  <th class="px-4 py-2">توضیح</th>
                </tr>
              </thead>
              <tbody>
                ${stepsHtml || '<tr><td colspan="6" class="text-center py-4">فاقد تاریخچه گردش‌کار</td></tr>'}
              </tbody>
            </table>
          </div>

          {/* Footer Print button */}
          <div class="flex justify-end gap-3 mt-8 no-print">
            <button onclick="window.print()" class="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors">
              چاپ درخواست
            </button>
            <button onclick="window.close()" class="px-4 py-2 text-sm font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 rounded cursor-pointer transition-colors">
              بستن پنجره
            </button>
          </div>
        </div>
      </body>
      </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (err: any) {
    return new Response(`خطا در تولید خروجی چاپی: ${err.message}`, { status: 500 })
  }
}
