import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { publishRosterVersion } from '@/server/modules/roster/service'
import { diffRosterVersions } from '@/server/modules/roster/diff'
import { createBulkNotifications } from '@/server/modules/notifications/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

// POST /api/rosters/[id]/publish
// انتشار نسخه لوحه + اعمال تغییرات تقویم + اعلان هدفمند. §۸.۱ و §۸.۳
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params

    // پیش از انتشار، نسخه قبلی منتشرشده را شناسایی می‌کنیم (برای diff بعدی)
    const target = await prisma.rosterVersion.findUnique({
      where: { id },
      select: { rosterDayId: true, versionNo: true },
    })
    let prevVersionId: string | undefined
    if (target) {
      const prev = await prisma.rosterVersion.findFirst({
        where: {
          rosterDayId: target.rosterDayId,
          status: 'PUBLISHED',
          versionNo: { lt: target.versionNo },
        },
        orderBy: { versionNo: 'desc' },
        select: { id: true },
      })
      prevVersionId = prev?.id
    }

    const result = await publishRosterVersion(id, user.id)

    // ۲. اعلان هدفمند §۸.۳
    if (result.notifiedUserIds && result.notifiedUserIds.length > 0) {
      const rosterDay = await prisma.rosterDay.findUnique({
        where: { id: (await prisma.rosterVersion.findUnique({ where: { id }, select: { rosterDayId: true } }))!.rosterDayId },
        select: { jalaliDate: true },
      })
      const dateLabel = rosterDay?.jalaliDate ?? ''

      if (prevVersionId) {
        // نسخه قبلی منتشرشده وجود داشت → اعلان فقط به افراد متأثر
        const diff = await diffRosterVersions(id, prevVersionId)
        if (diff && diff.affectedUserIds.length > 0) {
          await createBulkNotifications(diff.affectedUserIds, {
            type: 'warning',
            title: 'تغییر لوحه اعزام',
            body: `نسخه ${diff.newVersionNo} لوحه ${dateLabel} منتشر شد. سفر شما تغییر کرده است. لطفاً بررسی کنید.`,
            link: '/roster',
          })
        }
      } else {
        // اولین انتشار → اعلان به همه راهبران
        await createBulkNotifications(result.notifiedUserIds, {
          type: 'info',
          title: 'انتشار لوحه اعزام',
          body: `لوحه ${dateLabel} منتشر شد. لطفاً سفرهای خود را مشاهده و تأیید رؤیت کنید.`,
          link: '/roster',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'نسخه لوحه با موفقیت تایید و در تقویم راهبران اعمال گردید.',
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در انتشار لوحه: ' + (error.message || String(error)) },
      { status: 500 },
    )
  }
}
