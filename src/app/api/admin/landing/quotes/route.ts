import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const createSchema = z.object({
  text: z.string().min(1),
  author: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const quotes = await prisma.heroQuote.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ data: quotes })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const quote = await prisma.heroQuote.create({ data: parsed.data })
  return NextResponse.json({ data: quote }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه نقل‌قول الزامی است' } }, { status: 400 })

  const updated = await prisma.heroQuote.update({ where: { id }, data: updates })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه نقل‌قول الزامی است' } }, { status: 400 })

  await prisma.heroQuote.delete({ where: { id } })
  return NextResponse.json({ data: { deleted: true } })
}
