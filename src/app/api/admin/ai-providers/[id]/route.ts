import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const aiProviderSchema = z.object({
  name: z.string().min(1, 'نام پروایدر اجباری است'),
  providerType: z.enum(['gemini', 'openai']),
  baseUrl: z.string().url('آدرس API نامعتبر است'),
  apiKey: z.string().optional().nullable(),
  modelName: z.string().optional().nullable(),
  requestFormat: z.string().default('openai_compatible'),
  priority: z.number().int().default(1),
  isActive: z.boolean().default(true),
  maxRetries: z.number().int().default(3),
  timeoutMs: z.number().int().default(10000),
  costPer1kTokens: z.number().default(0),
  extraHeaders: z.string().optional().nullable(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = aiProviderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const before = await prisma.aiProvider.findUnique({ where: { id } })
    if (!before) {
      return NextResponse.json({ error: 'پروایدر یافت نشد' }, { status: 404 })
    }

    const provider = await prisma.aiProvider.update({
      where: { id },
      data: {
        ...parsed.data,
        consecutiveFailures: 0,
        healthStatus: 'healthy',
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiProvider',
        entityId: id,
        action: 'update',
        before,
        after: parsed.data
      }
    }).catch(() => {})

    return NextResponse.json({ data: provider })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ویرایش پروایدر' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const before = await prisma.aiProvider.findUnique({ where: { id } })
    if (!before) {
      return NextResponse.json({ error: 'پروایدر یافت نشد' }, { status: 404 })
    }

    await prisma.aiProvider.delete({
      where: { id }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiProvider',
        entityId: id,
        action: 'delete',
        before
      }
    }).catch(() => {})

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در حذف پروایدر' }, { status: 500 })
  }
}
