import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { validateCatalogExcel, commitCatalogImport } from '@/server/modules/faults/import-export'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:manage')
  if (err) return authErrorResponse(err)

  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'validate'

    if (mode === 'validate') {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 })
      }

      const buffer = await file.arrayBuffer()
      const preview = await validateCatalogExcel(buffer)
      return NextResponse.json({ data: preview })
    }

    if (mode === 'commit') {
      const body = await request.json()
      const { validRows } = body
      if (!Array.isArray(validRows) || validRows.length === 0) {
        return NextResponse.json({ error: 'لیست ردیف‌های معتبر خالی است.' }, { status: 400 })
      }

      const result = await commitCatalogImport(validRows, user.id)
      return NextResponse.json({ data: result })
    }

    return NextResponse.json({ error: 'حالت درخواست نامعتبر است' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در عملیات ورود داده' }, { status: 500 })
  }
}
