import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getCourses } from '@/server/modules/learning/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const roleKey = user.roleKey
    const courses = await getCourses(roleKey)
    return NextResponse.json({ data: courses })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت لیست دوره‌ها' } },
      { status: 500 }
    )
  }
}
