import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import {
  validateFaultReportsExcel,
  commitFaultReportsImport,
  rollbackFaultReportsImport,
} from '@/server/modules/faults/import-export'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'validate'

    if (mode === 'validate') {
      const err = requirePermission(user, 'imports:create')
      if (err) return authErrorResponse(err)

      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 })
      }

      const buffer = await file.arrayBuffer()
      const preview = await validateFaultReportsExcel(buffer)
      return NextResponse.json({ data: preview })
    }

    if (mode === 'commit') {
      const err = requirePermission(user, 'imports:create')
      if (err) return authErrorResponse(err)

      const body = await request.json()
      const { validRows, batchId } = body
      if (!Array.isArray(validRows) || validRows.length === 0 || !batchId) {
        return NextResponse.json({ error: 'شناسه دسته یا لیست ردیف‌ها معتبر نیست.' }, { status: 400 })
      }

      const result = await commitFaultReportsImport(validRows, batchId, user.id)
      return NextResponse.json({ data: result })
    }

    if (mode === 'rollback') {
      const err = requirePermission(user, 'settings:update') // admin boundary
      if (err) return authErrorResponse(err)

      const body = await request.json()
      const { batchId } = body
      if (!batchId) {
        return NextResponse.json({ error: 'شناسه دسته ایمپورت الزامی است.' }, { status: 400 })
      }

      const result = await rollbackFaultReportsImport(batchId, user.id)
      return NextResponse.json({ data: result })
    }

    return NextResponse.json({ error: 'حالت درخواست نامعتبر است' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در عملیات ورود داده' }, { status: 500 })
  }
}
