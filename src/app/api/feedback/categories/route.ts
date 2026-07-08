import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requirePermission } from '@/server/rbac/guard'
import { getFeedbackCategories, createFeedbackCategory } from '@/server/modules/feedback/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const categories = await getFeedbackCategories()
    return NextResponse.json({ data: categories })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت دسته‌بندی‌های بازخورد' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'feedback:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const newCategory = await createFeedbackCategory(body)
    return NextResponse.json({ data: newCategory })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت دسته‌بندی' } },
      { status: 500 }
    )
  }
}
