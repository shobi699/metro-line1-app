import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:submit')
  if (err) return authErrorResponse(err)

  try {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json({ error: 'درخواست یافت نشد.' }, { status: 404 })
    }

    if (submission.submitterId !== user.id) {
      return NextResponse.json({ error: 'شما فقط مجاز به لغو درخواست خود هستید.' }, { status: 403 })
    }

    if (submission.status === 'approved' || submission.status === 'rejected' || submission.status === 'cancelled') {
      return NextResponse.json({ error: 'درخواست‌های نهایی شده یا لغو شده را نمی‌توانید تغییر دهید.' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.formSubmission.update({
        where: { id },
        data: {
          status: 'cancelled',
          currentStage: null,
          slaDueAt: null,
          closedAt: new Date(),
        },
      })

      // ثبت لاگ گردش‌کار
      await tx.formLog.create({
        data: {
          submissionId: id,
          actorId: user.id,
          action: 'cancelled',
          note: 'لغو درخواست توسط متقاضی',
        },
      })

      // لاگ ممیزی
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormSubmission',
          entityId: id,
          action: 'update',
          after: { status: 'cancelled' },
        },
      })

      return s
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
