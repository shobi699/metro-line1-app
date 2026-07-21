import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { AIAssistantService } from '@/server/modules/ai/service'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const body = await req.json()
    const { actionToken } = body
    if (!actionToken) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'پارامتر actionToken الزامی است' } }, { status: 400 })
    }

    const result = await AIAssistantService.confirmAction(actionToken, decoded.sub as string)

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('[POST /api/ai/tools/confirm] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'خطا در ثبت تایید اقدام' } },
      { status: 500 }
    )
  }
}
