import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFaultCodeSchema } from '@/lib/zod/faults'
import { getEmbedding } from '@/server/modules/ai/embedding'

// Helper: Convert float array to Buffer for SQLite Bytes
function embeddingToBuffer(embedding: number[]): Buffer {
  const floatArray = new Float32Array(embedding)
  return Buffer.from(floatArray.buffer)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:manage')
  if (err) return authErrorResponse(err)

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = createFaultCodeSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.faultCode.findUnique({ where: { id } })
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: 'کد خطا یافت نشد.' }, { status: 404 })
    }

    // Merge updates
    const merged = { ...existing, ...parsed.data }

    // Regenerate semantic embedding if relevant fields changed
    let embeddingBytes: Buffer | null = existing.embedding ? Buffer.from(existing.embedding) : null
    if (parsed.data.title || parsed.data.keywords || parsed.data.aliases) {
      try {
        const textToEmbed = `${merged.title} ${merged.keywords || ''} ${merged.aliases || ''}`
        const embedding = await getEmbedding(textToEmbed)
        embeddingBytes = embeddingToBuffer(embedding)
      } catch (err) {
        console.warn('[Fault Code Edit] Failed to generate embedding on update:', err)
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.faultCode.update({
        where: { id },
        data: {
          ...parsed.data,
          embedding: embeddingBytes as any,
        },
      })

      const { embedding: _existingEmb, ...existingLog } = existing
      const { embedding: _uEmb, ...uLog } = u

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultCode',
          entityId: id,
          action: 'update',
          before: existingLog as any,
          after: uLog as any,
        },
      })

      return u
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ویرایش کد خطا' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:manage')
  if (err) return authErrorResponse(err)

  const { id } = await params

  try {
    const existing = await prisma.faultCode.findUnique({ where: { id } })
    if (!existing || !existing.isActive) {
      return NextResponse.json({ error: 'کد خطا یافت نشد.' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.faultCode.update({
        where: { id },
        data: { isActive: false },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultCode',
          entityId: id,
          action: 'delete',
          reason: 'حذف نرم‌افزاری کد خطا',
        },
      })
    })

    return NextResponse.json({ data: { success: true } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در حذف کد خطا' }, { status: 500 })
  }
}
