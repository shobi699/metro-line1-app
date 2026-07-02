import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const types = await prisma.performanceActionType.findMany({
      include: { competency: true }
    })

    return NextResponse.json({ data: types })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

