import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const visibilitySchema = z.object({
  id: z.string(),
  roleKey: z.string(),
  visibleCols: z.string(), // expected to be JSON stringified array
  regionFilter: z.string().nullable().optional(),
  showCrewNames: z.boolean(),
  showNotes: z.boolean(),
  defaultView: z.string(),
})

const bulkUpdateSchema = z.object({
  matrices: z.array(visibilitySchema)
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    let matrices = await prisma.rosterVisibilityMatrix.findMany({
      orderBy: { roleKey: 'asc' }
    })

    if (matrices.length === 0) {
      const allRoles = ['admin', 'planner', 'occ', 'supervisor', 'operator', 'station_manager']
      const defaultCols = ["rowNo", "trainNumber", "direction", "originStation", "destinationStation", "departureTime", "arrivalTime", "status", "h1", "h2", "t", "r"]
      
      const defaultMatrices = allRoles.map(role => ({
        roleKey: role,
        visibleCols: JSON.stringify(defaultCols),
        regionFilter: null,
        showCrewNames: role !== 'operator' && role !== 'station_manager', // Operators and station managers shouldn't see all crew names by default
        showNotes: true,
        defaultView: role === 'operator' ? 'list' : 'timeline'
      }))

      await prisma.rosterVisibilityMatrix.createMany({
        data: defaultMatrices
      })

      matrices = await prisma.rosterVisibilityMatrix.findMany({
        orderBy: { roleKey: 'asc' }
      })
    }

    return NextResponse.json({ data: matrices })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت ماتریس دید', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = bulkUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'اطلاعات ارسالی نامعتبر است', details: parsed.error }, { status: 400 })
    }

    const { matrices } = parsed.data

    await prisma.$transaction(async (tx) => {
      for (const matrix of matrices) {
        if (matrix.id.startsWith('new-')) {
           await tx.rosterVisibilityMatrix.create({
             data: {
               roleKey: matrix.roleKey,
               visibleCols: matrix.visibleCols,
               regionFilter: matrix.regionFilter,
               showCrewNames: matrix.showCrewNames,
               showNotes: matrix.showNotes,
               defaultView: matrix.defaultView,
             }
           })
        } else {
           await tx.rosterVisibilityMatrix.update({
             where: { id: matrix.id },
             data: {
               visibleCols: matrix.visibleCols,
               regionFilter: matrix.regionFilter,
               showCrewNames: matrix.showCrewNames,
               showNotes: matrix.showNotes,
               defaultView: matrix.defaultView,
             }
           })
        }
      }
      
      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'RosterVisibilityMatrix',
          entityId: 'BULK_UPDATE',
          action: 'update',
          after: { count: matrices.length }
        }
      })
    })

    return NextResponse.json({ message: 'ماتریس دید با موفقیت به‌روزرسانی شد' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ذخیره ماتریس دید', details: error.message },
      { status: 500 }
    )
  }
}
