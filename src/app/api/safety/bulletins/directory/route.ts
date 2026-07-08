import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { prisma } from '@/server/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 401 })
    }

    const bulletins = await prisma.safetyBulletin.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: {
        readReceipts: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ data: bulletins })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
