import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getFeedbackCategories } from '@/server/modules/feedback/service'

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
