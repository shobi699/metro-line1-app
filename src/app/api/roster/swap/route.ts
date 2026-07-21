import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { validateSwapRequest } from '@/server/modules/roster/swapEngine'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)

    // Admins can see all pending swaps, others only their own
    const isAdmin = ['super_admin', 'admin', 'manager'].includes(user.roleKey)
    
    const whereClause = isAdmin ? { status: 'pending' as const } : { 
      OR: [{ requesterId: user.id }, { targetId: user.id }],
      status: 'pending' as const
    }

    const swaps = await prisma.tripSwapRequest.findMany({
      where: whereClause,
      include: {
        requester: { select: { id: true, name: true, phone: true } },
        target: { select: { id: true, name: true, phone: true } },
        sourceAssignment: { include: { trip: true } },
        targetAssignment: { include: { trip: true } },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: swaps })
  } catch (error: any) {
    console.error('Swap GET error:', error)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}

const swapRequestSchema = z.object({
  targetId: z.string().min(1),
  sourceAssignmentId: z.string().min(1),
  targetAssignmentId: z.string().min(1),
  note: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)

    const body = await req.json()
    const result = swapRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const { targetId, sourceAssignmentId, targetAssignmentId, note } = result.data
    const requesterId = user.id

    // Check if swap already exists
    const existingSwap = await prisma.tripSwapRequest.findFirst({
      where: {
        requesterId,
        targetId,
        sourceAssignmentId,
        targetAssignmentId,
        status: 'pending'
      }
    })

    if (existingSwap) {
      return NextResponse.json({ error: 'این درخواست جابه‌جایی قبلاً ثبت شده و در انتظار تایید است.' }, { status: 400 })
    }

    // 1. Run Rule Engine
    const ruleResult = await validateSwapRequest(requesterId, targetId, sourceAssignmentId, targetAssignmentId)

    if (!ruleResult.success) {
      return NextResponse.json({
        error: ruleResult.errorMessage || 'درخواست مغایر با قوانین ایمنی است.',
        errorCode: ruleResult.errorCode
      }, { status: 400 })
    }

    // 2. Create Swap Request
    const swapRequest = await prisma.tripSwapRequest.create({
      data: {
        requesterId,
        targetId,
        sourceAssignmentId,
        targetAssignmentId,
        note,
        status: 'pending'
      }
    })

    // 3. Notify Target User
    // We can push to the notification table directly
    await prisma.notification.create({
      data: {
        userId: targetId,
        type: 'warning' as any,
        title: 'درخواست جابه‌جایی شیفت',
        body: `همکار شما درخواست جابه‌جایی یک سفر با شما را دارد. لطفاً بررسی کنید.`,
        link: '/roster/swaps'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'درخواست جابه‌جایی با موفقیت ثبت شد و در انتظار تایید است.',
      data: swapRequest
    })
  } catch (error: any) {
    console.error('Swap request error:', error)
    return NextResponse.json(
      { error: 'خطای سرور', details: error.message },
      { status: 500 }
    )
  }
}
