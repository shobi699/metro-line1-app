import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { getPendingBulletins } from '@/server/modules/safety/bulletins'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 401 })
    }

    const bulletins = await getPendingBulletins(session.id)
    return NextResponse.json({ data: bulletins })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
