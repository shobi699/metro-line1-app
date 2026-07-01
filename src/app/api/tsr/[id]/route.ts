import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { deleteTsrEntry } from '@/server/modules/occ/tsr-service'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only roster:write permitted to delete TSR
  const permErr = requirePermission(user, 'roster:write')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { id } = await params
    const success = await deleteTsrEntry(id, user.id)
    if (!success) {
      return NextResponse.json({ error: 'محدودیت سرعت مورد نظر یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ message: 'محدودیت سرعت با موفقیت حذف شد' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در حذف محدودیت سرعت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
