import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { getTsrEntries, createTsrEntry } from '@/server/modules/occ/tsr-service'
import { z } from 'zod'

const tsrInputSchema = z.object({
  section: z.string().min(1, 'نام قطعه الزامی است'),
  speedLimit: z.number().int().min(5, 'حداقل سرعت ۵ کیلومتر بر ساعت است').max(120),
  reason: z.string().min(1, 'علت محدودیت سرعت الزامی است'),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const list = await getTsrEntries()
    return NextResponse.json({ data: list })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت لیست محدودیت‌های سرعت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only roster:write permitted to change TSR
  const permErr = requirePermission(user, 'roster:write')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const parsed = tsrInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { section, speedLimit, reason } = parsed.data
    const entry = await createTsrEntry(section, speedLimit, reason, user.id)

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت محدودیت سرعت جدید: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
