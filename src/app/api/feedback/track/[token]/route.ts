import { NextResponse } from 'next/server'
import { getFeedbackByToken } from '@/server/modules/feedback/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const resolvedParams = await params
  try {
    const feedback = await getFeedbackByToken(resolvedParams.token)
    return NextResponse.json({ data: feedback })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در پیگیری بازخورد ناشناس' } },
      { status: 404 }
    )
  }
}
