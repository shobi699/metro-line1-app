import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:view-own')
  if (err) return authErrorResponse(err)

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const templateId = url.searchParams.get('templateId')

    const where: any = {
      submitterId: user.id,
    }
    if (status) where.status = status
    if (templateId) where.templateId = templateId

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { title: true, key: true },
        },
      },
    })

    return NextResponse.json({ data: submissions })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
