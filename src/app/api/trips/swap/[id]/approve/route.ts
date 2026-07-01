import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { approveTripSwapRequest } from '@/server/modules/swap/service'
import { z } from 'zod'

const approveInputSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Enforce RBAC guard
  const permErr = requirePermission(user, 'roster:write')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = approveInputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { decision } = parsed.data
    const updated = await approveTripSwapRequest(id, user.id, decision)

    return NextResponse.json({
      message: decision === 'approved' ? 'درخواست جابجایی با موفقیت تایید و لوحه روزانه بروزرسانی شد.' : 'درخواست جابجایی رد شد.',
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'خطا در ثبت تصمیم جابجایی' },
      { status: 400 }
    )
  }
}
