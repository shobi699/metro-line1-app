import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createPart } from '@/server/modules/parts/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Everyone authenticated can view parts
  const { searchParams } = new URL(request.url)
  const trainType = searchParams.get('trainType') // "AC", "DC", "both"

  try {
    const parts = await prisma.part.findMany({
      where: {
        isActive: true,
        trainType: trainType ? { in: [trainType, 'both'] } : undefined,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: parts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در دریافت لیست قطعات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Allow fleet:manage or faults:create to add parts
  const manageErr = requirePermission(user, 'fleet:manage')
  const faultsErr = requirePermission(user, 'faults:create')
  if (manageErr && faultsErr) {
    return authErrorResponse(manageErr)
  }

  try {
    const body = await request.json()
    const { name, partNumber, trainType, description } = body

    if (!name) {
      return NextResponse.json({ error: 'نام قطعه الزامی است' }, { status: 400 })
    }
    if (trainType !== 'AC' && trainType !== 'DC' && trainType !== 'both') {
      return NextResponse.json({ error: 'نوع قطار نامعتبر است' }, { status: 400 })
    }

    const part = await createPart({ name, partNumber, trainType, description }, user.id)
    return NextResponse.json({ data: part }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ثبت قطعه جدید' }, { status: 500 })
  }
}
