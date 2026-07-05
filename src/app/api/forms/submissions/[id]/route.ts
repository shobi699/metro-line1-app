import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { validateSubmissionData, evaluateFormula } from '@/server/modules/forms/engine'
import type { FormWorkflow } from '@/lib/zod/forms'
import dayjs from 'dayjs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // دسترسی: یا باید مدیر/بررسی‌کننده باشد یا متقاضی خود فالت/فرم باشد
  const formsViewAll = requirePermission(user, 'forms:view-all')
  
  try {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: {
        template: { select: { title: true, key: true } },
        version: true,
        submitter: { select: { name: true, role: { select: { name: true, key: true } } } },
        steps: {
          orderBy: { createdAt: 'asc' },
          include: { decidedBy: { select: { name: true } } },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { name: true } } },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'درخواست یافت نشد.' }, { status: 404 })
    }

    if (submission.submitterId !== user.id && formsViewAll) {
      return NextResponse.json({ error: 'شما دسترسی به این درخواست را ندارید.' }, { status: 403 })
    }

    return NextResponse.json({ data: submission })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: { version: true },
    })

    if (!submission) {
      return NextResponse.json({ error: 'درخواست یافت نشد.' }, { status: 404 })
    }

    if (submission.submitterId !== user.id) {
      return NextResponse.json({ error: 'شما فقط مجاز به اصلاح درخواست خود هستید.' }, { status: 403 })
    }

    if (submission.status !== 'needs_changes' && submission.status !== 'draft') {
      return NextResponse.json({ error: 'فقط درخواست‌های پیش‌نویس یا نیاز به اصلاح قابل ویرایش هستند.' }, { status: 400 })
    }

    const body = await request.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: 'ارسال داده‌های جدید الزامی است.' }, { status: 400 })
    }

    const schema = submission.version.schema as any
    const workflow = submission.version.workflow as any as FormWorkflow

    // ۱. محاسبات فیلدهای فرمول
    const processedData = { ...data }
    for (const field of schema.fields) {
      if (field.type === 'formula' && field.formula) {
        processedData[field.name] = evaluateFormula(field.formula, processedData)
      }
    }

    // ۲. اعتبارسنجی
    const validation = validateSubmissionData(schema.fields, processedData)
    if (!validation.valid) {
      return NextResponse.json({ validationErrors: validation.errors }, { status: 400 })
    }

    // ۳. ذخیره و راه‌اندازی مجدد گردش‌کار
    const submitTransition = workflow.transitions.find((t) => !t.from && t.on === 'submit')
    if (!submitTransition) {
      return NextResponse.json({ error: 'گذار اولیه در گردشکار تعریف نشده است.' }, { status: 400 })
    }

    const initialStage = submitTransition.to
    const stageDef = workflow.stages.find((s) => s.key === initialStage)!
    const slaDueAt = stageDef.sla ? dayjs().add(stageDef.sla.hours, 'hours').toDate() : null

    // به‌روزرسانی در تراکنش
    const updated = await prisma.$transaction(async (tx) => {
      // به‌روزرسانی پاسخ
      const sub = await tx.formSubmission.update({
        where: { id },
        data: {
          data: processedData,
          status: 'submitted',
          currentStage: initialStage,
          slaDueAt,
        },
      })

      // ایجاد گام بررسی جدید
      await tx.formApproval.create({
        data: {
          submissionId: id,
          stageKey: initialStage,
          stageTitle: stageDef.title,
          assigneeId: stageDef.assignTo,
        },
      })

      // ثبت لاگ ویرایش
      await tx.formLog.create({
        data: {
          submissionId: id,
          actorId: user.id,
          action: 'edited',
          fromStage: submission.currentStage,
          toStage: initialStage,
          note: 'ویرایش، تکمیل و ارسال مجدد درخواست',
        },
      })

      // ثبت لاگ ممیزی سیستمی
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FormSubmission',
          entityId: id,
          action: 'update',
          before: submission.data as any,
          after: processedData as any,
        },
      })

      return sub
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
