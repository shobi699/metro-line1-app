import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFormSubmission } from '@/server/modules/forms/engine'
import { submitFormSchema } from '@/lib/zod/forms'

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:view-own')
  if (err) return authErrorResponse(err)

  try {
    const template = await prisma.formTemplate.findUnique({
      where: { key },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'قالب فرم یافت نشد.' }, { status: 404 })
    }

    const activeVersion = template.versions[0]
    if (!activeVersion) {
      return NextResponse.json({ error: 'نسخه فعالی برای این فرم وجود ندارد.' }, { status: 400 })
    }

    const access = activeVersion.access as any
    const canSubmit = access?.whoCanSubmit?.includes('*') || access?.whoCanSubmit?.includes(user.roleKey)

    return NextResponse.json({
      data: {
        id: template.id,
        key: template.key,
        title: template.title,
        description: template.description,
        category: template.category,
        icon: template.icon,
        allowMobile: template.allowMobile,
        schema: activeVersion.schema,
        workflow: activeVersion.workflow,
        canSubmit,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:submit')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = submitFormSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const isDraft = request.headers.get('x-draft') === 'true'
    const submission = await createFormSubmission(
      key,
      user.id,
      parsed.data.data,
      parsed.data.targetDate,
      parsed.data.amount,
      isDraft
    )

    // ایجاد لاگ ممیزی سیستمی عمومی
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'FormSubmission',
        entityId: submission.id,
        action: 'create',
        after: parsed.data.data as any,
      },
    })

    return NextResponse.json({ data: submission })
  } catch (err: any) {
    // بازگرداندن خطاهای ولیدیشن با فرمت خوانا
    try {
      const parsedErr = JSON.parse(err.message)
      if (parsedErr.validationErrors) {
        return NextResponse.json({ validationErrors: parsedErr.validationErrors }, { status: 400 })
      }
    } catch {}

    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
