import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { acknowledgeBulletin } from '@/server/modules/safety/bulletins'

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 401 })
    }

    const body = await req.json()
    const { bulletinId } = body
    
    if (!bulletinId) {
      return NextResponse.json({ error: { message: 'شناسه بخشنامه نامعتبر است' } }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || 'Unknown'
    const receipt = await acknowledgeBulletin(bulletinId, session.id, userAgent)
    
    return NextResponse.json({ data: receipt })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
