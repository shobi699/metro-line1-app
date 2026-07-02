import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // e.g. "2026-07"
  
  let fromDate: Date | undefined
  let toDate: Date | undefined

  if (month) {
    const [yyyy, mm] = month.split('-').map(Number)
    fromDate = new Date(yyyy, mm - 1, 1)
    toDate = new Date(yyyy, mm, 1)
  }

  const whereClause: any = { userId: user.id }
  
  if (fromDate && toDate) {
    whereClause.fromDate = {
      gte: fromDate,
      lt: toDate
    }
  }

  const requests = await prisma.leaveRequest.findMany({
    where: whereClause,
    orderBy: { fromDate: 'desc' },
    include: {
      reviewedBy: { select: { name: true } }
    }
  })

  // Group by type for summary (only approved)
  const summary: Record<string, { totalAmount: number, totalCalculated: number, unit: string }> = {}
  
  for (const req of requests) {
    if (req.status === 'approved' && req.amount) {
      if (!summary[req.type]) {
        summary[req.type] = { totalAmount: 0, totalCalculated: 0, unit: req.unit || 'hours' }
      }
      summary[req.type].totalAmount += req.amount
      summary[req.type].totalCalculated += (req.calculatedAmount || req.amount)
    }
  }

  return NextResponse.json({ 
    data: requests,
    summary
  })
}
