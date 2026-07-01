import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { acceptTripSwapRequest } from '@/server/modules/swap/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { id } = await params
    const updated = await acceptTripSwapRequest(id, user.id)
    return NextResponse.json({
      message: 'درخواست جابجایی با موفقیت توسط شما تایید شد.',
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'خطا در تایید درخواست جابجایی' },
      { status: 400 }
    )
  }
}
