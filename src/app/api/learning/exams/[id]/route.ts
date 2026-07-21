import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })

    const resolvedParams = await params
    
    const exam = await prisma.exam.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        title: true,
        durationMin: true,
        passScore: true,
        questionCount: true,
        maxAttempts: true
      }
    })

    if (!exam) {
      return NextResponse.json({ error: { message: 'آزمون یافت نشد' } }, { status: 404 })
    }

    return NextResponse.json({ data: exam })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
