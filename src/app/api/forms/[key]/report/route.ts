import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'forms:report')
  if (err) return authErrorResponse(err)

  try {
    const template = await prisma.formTemplate.findUnique({
      where: { key },
    })

    if (!template) {
      return NextResponse.json({ error: 'قالب فرم یافت نشد.' }, { status: 404 })
    }

    // ۱. تعداد کل درخواست‌ها
    const totalCount = await prisma.formSubmission.count({
      where: { templateId: template.id },
    })

    // ۲. توزیع وضعیت‌ها
    const statusGroups = await prisma.formSubmission.groupBy({
      by: ['status'],
      where: { templateId: template.id },
      _count: true,
    })

    const statusCounts = statusGroups.reduce((acc, curr) => {
      acc[curr.status] = curr._count
      return acc;
    }, {} as Record<string, number>)

    // ۳. جمع مقدار فیلد کلیدی عددی
    const totalAmount = await prisma.formSubmission.aggregate({
      where: { templateId: template.id, status: 'approved' },
      _sum: { amount: true },
      _avg: { amount: true },
    })

    // ۴. لیست آخرین درخواست‌ها با نام متقاضی
    const recents = await prisma.formSubmission.findMany({
      where: { templateId: template.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: { select: { name: true } },
      },
    })

    return NextResponse.json({
      data: {
        totalCount,
        statusCounts,
        approvedSum: totalAmount._sum.amount ?? 0,
        approvedAvg: totalAmount._avg.amount ?? 0,
        recents: recents.map((r) => ({
          id: r.id,
          submissionNo: r.submissionNo,
          submitterName: r.submitter.name,
          status: r.status,
          amount: r.amount,
          submittedAt: r.submittedAt,
        })),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
