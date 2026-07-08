import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requirePermission } from '@/server/rbac/guard'
import { updateFeedbackCategory, deleteFeedbackCategory } from '@/server/modules/feedback/service'

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'feedback:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const updatedCategory = await updateFeedbackCategory(params.id, body)
    return NextResponse.json({ data: updatedCategory })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ویرایش دسته‌بندی' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'feedback:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    await deleteFeedbackCategory(params.id)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در حذف دسته‌بندی' } },
      { status: 500 }
    )
  }
}
