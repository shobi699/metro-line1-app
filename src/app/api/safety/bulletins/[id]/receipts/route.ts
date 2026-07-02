import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { getBulletinReceipts } from '@/server/modules/safety/bulletins'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || (session.roleKey !== 'admin' && session.roleKey !== 'super_admin')) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 403 })
    }

    const { id } = await params
    const data = await getBulletinReceipts(id)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
