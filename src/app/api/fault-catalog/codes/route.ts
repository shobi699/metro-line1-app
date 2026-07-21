import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFaultCodeSchema } from '@/lib/zod/faults'
import { getEmbedding } from '@/server/modules/ai/embedding'

// Helper: Convert float array to Buffer for SQLite Bytes
function embeddingToBuffer(embedding: number[]): Buffer {
  const floatArray = new Float32Array(embedding)
  return Buffer.from(floatArray.buffer)
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:read')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  const filter: Record<string, any> = { isActive: true }
  if (categoryId) {
    filter.categoryId = categoryId
  }

  const codes = await prisma.faultCode.findMany({
    where: filter,
    orderBy: { code: 'asc' },
    include: { category: true },
  })

  return NextResponse.json({ data: codes })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const manageErr = requirePermission(user, 'fault-catalog:manage')
  const faultsErr = requirePermission(user, 'faults:create')
  if (manageErr && faultsErr) {
    return authErrorResponse(manageErr)
  }

  try {
    const body = await request.json()
    const parsed = createFaultCodeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const {
      code,
      categoryId,
      title,
      description,
      defaultPriority,
      safetyCritical,
      requiresWagon,
      operatorGuide,
      keywords,
      aliases,
    } = parsed.data

    const existing = await prisma.faultCode.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json({ error: 'کد خطا قبلا ثبت شده است.' }, { status: 400 })
    }

    // Generate local semantic embedding
    let embeddingBytes: Buffer | null = null
    try {
      const textToEmbed = `${title} ${keywords || ''} ${aliases || ''}`
      const embedding = await getEmbedding(textToEmbed)
      embeddingBytes = embeddingToBuffer(embedding)
    } catch (err) {
      console.warn('[Fault Code API] Failed to generate embedding on creation:', err)
    }

    const faultCode = await prisma.$transaction(async (tx) => {
      const fc = await tx.faultCode.create({
        data: {
          code,
          categoryId,
          title,
          description,
          defaultPriority,
          safetyCritical,
          requiresWagon,
          operatorGuide,
          keywords,
          aliases,
          embedding: embeddingBytes as any,
        },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultCode',
          entityId: fc.id,
          action: 'create',
          after: parsed.data,
        },
      })

      return fc
    })

    return NextResponse.json({ data: faultCode }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ثبت کد خطا' }, { status: 500 })
  }
}
