import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { fatigueLogSchema, submitFatigueLog, analyzeUserFatigue } from '@/server/modules/fatigue/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const analysis = await analyzeUserFatigue(user.id)
    return NextResponse.json({ data: analysis })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || 'خطا در محاسبه شاخص خستگی' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = fatigueLogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const log = await submitFatigueLog(user.id, parsed.data)
    return NextResponse.json({ data: log })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || 'خطا در ثبت خودارزیابی' } },
      { status: 500 }
    )
  }
}
