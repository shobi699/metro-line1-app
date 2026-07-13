import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const createSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  icon: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  authOnly: z.boolean().default(false),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const ctas = await prisma.landingCta.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ data: ctas })
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

  const cta = await prisma.landingCta.create({ data: parsed.data })
  return NextResponse.json({ data: cta }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه دکمه الزامی است' } }, { status: 400 })

  const updated = await prisma.landingCta.update({ where: { id }, data: updates })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه دکمه الزامی است' } }, { status: 400 })

  await prisma.landingCta.delete({ where: { id } })
  return NextResponse.json({ data: { deleted: true } })
}
