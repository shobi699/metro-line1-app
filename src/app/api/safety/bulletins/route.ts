import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { createBulletin, getAllBulletins } from '@/server/modules/safety/bulletins'
import { createBulletinSchema } from '@/lib/zod/safety'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.roleKey !== 'admin' && session.roleKey !== 'super_admin')) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 403 })
    }

    const bulletins = await getAllBulletins()
    return NextResponse.json({ data: bulletins })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || (session.roleKey !== 'admin' && session.roleKey !== 'super_admin')) {
      return NextResponse.json({ error: { message: 'عدم دسترسی' } }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createBulletinSchema.parse(body)

    const bulletin = await createBulletin(parsed, session.id)
    return NextResponse.json({ data: bulletin })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: { message: error.issues[0].message } }, { status: 400 })
    }
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

