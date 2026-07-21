import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requirePermission } from '@/server/rbac/guard'
import { getAllRadioPhrases, saveRadioPhrase, deleteRadioPhrase } from '@/server/modules/radio/service'
import { z } from 'zod'

const schema = z.object({
  id: z.string().optional(),
  roleKey: z.string().nullable().optional(),
  label: z.string().min(1),
  text: z.string().min(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional()
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'comms:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const data = await getAllRadioPhrases()
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'comms:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'داده‌های نامعتبر', details: parsed.error.format() } }, { status: 400 })
    }
    const result = await saveRadioPhrase(parsed.data)
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'comms:manage')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: { message: 'ID الزامی است' } }, { status: 400 })
    
    await deleteRadioPhrase(id)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
