import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'

export const dynamic = 'force-dynamic'

/**
 * GET: Retrieve active SOS emergency alerts.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const sosAlerts = await prisma.crisisEvent.findMany({
      where: {
        resolvedAt: null,
        level: 'critical',
        title: { startsWith: 'SOS' },
      },
      include: {
        activator: {
          select: {
            id: true,
            name: true,
            phone: true,
            nationalId: true,
          },
        },
      },
      orderBy: { activatedAt: 'desc' },
    })

    return NextResponse.json({ data: sosAlerts })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت هشدارهای اضطراری: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Trigger a new SOS emergency alert.
 * Accessible by any logged-in user (bypasses rank checks for emergency reporting).
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const { reason, trainNumber, latitude, longitude, blockCode, stationId } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'علت وضعیت اضطراری الزامی است' },
        { status: 400 }
      )
    }

    // Resolve any previous active SOS alerts from the same user to avoid duplicates
    await prisma.crisisEvent.updateMany({
      where: {
        activatedBy: user.id,
        resolvedAt: null,
        level: 'critical',
        title: { startsWith: 'SOS' },
      },
      data: {
        resolvedAt: new Date(),
      },
    })

    // Construct the metadata payload
    const payload = {
      latitude: latitude || null,
      longitude: longitude || null,
      blockCode: blockCode || 'نامشخص',
      trainNumber: trainNumber || 'نامشخص',
      reason,
      senderName: 'راهبر سیستم',
      senderPhone: 'نامشخص',
    }

    const title = `SOS: ${reason}`
    const description = JSON.stringify(payload)

    const alert = await prisma.crisisEvent.create({
      data: {
        title,
        description,
        level: 'critical',
        stationId: stationId || null,
        activatedBy: user.id,
      },
      include: {
        activator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Optional: Write an audit log for the SOS activation
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'CrisisEvent',
        entityId: alert.id,
        action: 'create',
      },
    }).catch(() => {})

    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت وضعیت اضطراری: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Acknowledge and resolve an active SOS emergency alert.
 * Accessible by OCC dispatchers or admins.
 */
export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only dispatchers/operators (rank >= 0) and admins can resolve SOS alerts
  if (user.rank < 0) {
    return NextResponse.json(
      { error: 'شما دسترسی کافی برای رفع وضعیت اضطرار را ندارید' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { alertId } = body

    if (!alertId) {
      return NextResponse.json(
        { error: 'شناسه هشدار الزامی است' },
        { status: 400 }
      )
    }

    const alert = await prisma.crisisEvent.findUnique({
      where: { id: alertId },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    const updated = await prisma.crisisEvent.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
      },
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'CrisisEvent',
        entityId: alertId,
        action: 'update',
      },
    }).catch(() => {})

    return NextResponse.json({ data: { success: true, updated } })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در رفع وضعیت اضطراری: ' + error.message },
      { status: 500 }
    )
  }
}
