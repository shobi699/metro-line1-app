import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'
import { getItemAnalysis } from '@/server/modules/learning/report-service'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err1 = requirePermission(user, 'learning-admin:manage')
    const err2 = requirePermission(user, 'learning:reports')
    if (err1 && err2) {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    const url = new URL(request.url)
    const examId = url.searchParams.get('examId')
    
    if (!examId) {
      return NextResponse.json({ error: { message: 'شناسه آزمون الزامی است' } }, { status: 400 })
    }

    const data = await getItemAnalysis(examId)
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
