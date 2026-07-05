import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { executeWorkflowAction } from '@/server/modules/forms/engine'
import { approvalActionSchema } from '@/lib/zod/forms'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:review')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = approvalActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const result = await executeWorkflowAction(id, user.id, parsed.data)

    // ثبت لاگ ممیزی ادمین/کاربر
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'FormSubmission',
        entityId: id,
        action: 'update',
        after: parsed.data as any,
      },
    })

    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
