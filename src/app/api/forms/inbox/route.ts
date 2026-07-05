import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:review')
  if (err) return authErrorResponse(err)

  try {
    const inboxItems = await prisma.formSubmission.findMany({
      where: {
        status: { in: ['submitted', 'in_review'] },
        currentStage: { not: null },
        steps: {
          some: {
            assigneeId: { in: [user.roleKey, user.id] },
            decision: null,
          },
        },
      },
      include: {
        template: { select: { title: true, key: true } },
        submitter: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: inboxItems })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
