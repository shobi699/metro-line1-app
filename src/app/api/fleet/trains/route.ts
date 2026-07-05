import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createTrainSchema } from '@/lib/zod/faults'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:read')
  if (err) return authErrorResponse(err)

  const trains = await prisma.train.findMany({
    where: { isActive: true },
    orderBy: { trainNumber: 'asc' },
    include: {
      wagons: {
        orderBy: { position: 'asc' },
      },
    },
  })

  return NextResponse.json({ data: trains })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = createTrainSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { trainNumber, fleetSeries, manufacturer, wagonCount, status, notes } = parsed.data

    const existing = await prisma.train.findUnique({
      where: { trainNumber },
    })

    if (existing) {
      return NextResponse.json({ error: 'شماره قطار قبلا ثبت شده است.' }, { status: 400 })
    }

    const train = await prisma.$transaction(async (tx) => {
      const newTrain = await tx.train.create({
        data: {
          trainNumber,
          fleetSeries,
          manufacturer,
          wagonCount,
          status,
          notes,
        },
      })

      // Create wagons
      for (let pos = 1; pos <= wagonCount; pos++) {
        const wagonCode = `${trainNumber}-${pos}`
        await tx.wagon.create({
          data: {
            trainId: newTrain.id,
            position: pos,
            wagonCode,
            wagonType: pos === 1 || pos === wagonCount ? 'Mc' : pos === 3 || pos === 5 ? 'M' : 'Tp',
          },
        })
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Train',
          entityId: newTrain.id,
          action: 'create',
          after: parsed.data,
        },
      })

      return newTrain
    })

    return NextResponse.json({ data: train }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ثبت قطار' }, { status: 500 })
  }
}
