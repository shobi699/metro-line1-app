import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { z } from 'zod'

const aiPersonaSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, 'کلید پرسونای دستیار اجباری است'),
  title: z.string().min(1, 'عنوان دستیار اجباری است'),
  icon: z.string().optional().nullable(),
  systemPrompt: z.string().min(1, 'پرامپت سیستم اجباری است'),
  roleKeys: z.string().default('[]'),
  knowledgeCats: z.string().default('[]'),
  tools: z.string().default('[]'),
  economyModel: z.string().optional().nullable(),
  strongModel: z.string().optional().nullable(),
  monthlyTokenCap: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const personas = await prisma.aiPersona.findMany({
      orderBy: { key: 'asc' }
    })
    return NextResponse.json({ data: personas })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت پرسوناها' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = aiPersonaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { id, ...data } = parsed.data
    const persona = await prisma.aiPersona.create({
      data
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiPersona',
        entityId: persona.id,
        action: 'create',
        after: parsed.data
      }
    }).catch(() => {})

    return NextResponse.json({ data: persona })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ایجاد پرسونای جدید' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'شناسه پرسونا الزامی است' }, { status: 400 })
    }

    const existing = await prisma.aiPersona.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'پرسونا یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.aiPersona.update({
      where: { id },
      data
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'AiPersona',
        entityId: id,
        action: 'update',
        before: existing,
        after: updated
      }
    }).catch(() => {})

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در بروزرسانی پرسونا' }, { status: 500 })
  }
}
