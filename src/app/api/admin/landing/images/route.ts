import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  caption: z.string().optional(),
  alt: z.string().min(1),
  mediaUrl: z.string().min(1),
  thumbUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const images = await prisma.orbitImage.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ data: images })
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

  const image = await prisma.orbitImage.create({ data: parsed.data })

  await prisma.auditLog.create({
    data: { actorId: user.id, entity: 'OrbitImage', entityId: image.id, action: 'create', after: image as object },
  })

  return NextResponse.json({ data: image }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه تصویر الزامی است' } }, { status: 400 })

  const before = await prisma.orbitImage.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'تصویر یافت نشد' } }, { status: 404 })

  const updated = await prisma.orbitImage.update({ where: { id }, data: updates })

  await prisma.auditLog.create({
    data: { actorId: user.id, entity: 'OrbitImage', entityId: id, action: 'update', before: before as object, after: updated as object },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'landing:manage')
  if (permErr) return authErrorResponse(permErr)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: { code: 'MISSING_ID', message: 'شناسه تصویر الزامی است' } }, { status: 400 })

  const before = await prisma.orbitImage.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'تصویر یافت نشد' } }, { status: 404 })

  await prisma.orbitImage.delete({ where: { id } })

  await prisma.auditLog.create({
    data: { actorId: user.id, entity: 'OrbitImage', entityId: id, action: 'delete', before: before as object },
  })

  return NextResponse.json({ data: { deleted: true } })
}
