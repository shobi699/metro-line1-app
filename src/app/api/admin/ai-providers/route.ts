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

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const providers = await prisma.aiProvider.findMany({
      orderBy: { priority: 'asc' }
    })
    return NextResponse.json({ data: providers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت پروایدرها' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const provider = await prisma.aiProvider.create({
      data: parsed.data
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiProvider',
        entityId: provider.id,
        action: 'create',
        after: parsed.data
      }
    }).catch(() => {})

    return NextResponse.json({ data: provider })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ایجاد پروایدر' }, { status: 500 })
  }
}
