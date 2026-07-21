import { NextResponse } from 'next/server'
import { pairSignageScreen } from '@/server/modules/signage/service'
import { z } from 'zod'

const pairSchema = z.object({
  pairCode: z.string().length(6, 'کد جفت‌سازی باید ۶ رقم باشد'),
  name: z.string().min(1, 'نام صفحه الزامی است'),
  location: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = pairSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const screen = await pairSignageScreen(parsed.data.pairCode, parsed.data.name, parsed.data.location)
    return NextResponse.json({ data: screen })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
