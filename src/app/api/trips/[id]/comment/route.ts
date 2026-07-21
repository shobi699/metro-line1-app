import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { id } = await params
    const body = await request.json()
    const { operationalNote, status } = body

    const trip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!trip) {
      return NextResponse.json({ error: 'سفر یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        operationalNote: operationalNote !== undefined ? operationalNote : trip.operationalNote,
        status: status !== undefined ? status : trip.status
      }
    })

    return NextResponse.json({
      success: true,
      message: 'توضیحات و وضعیت سفر با موفقیت ویرایش شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت کامنت سفر: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
