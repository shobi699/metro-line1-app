import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'

export async function exportUsersToExcel(): Promise<ArrayBuffer> {
  const users = await prisma.user.findMany({
    select: {
      nationalId: true,
      name: true,
      phone: true,
      email: true,
      status: true,
      customFields: true,
      role: { select: { key: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'کد ملی',
    'نام',
    'موبایل',
    'ایمیل',
    'نقش',
    'وضعیت',
    'تاریخ ایجاد',
  ]

  // Collect all custom field keys
  const customFieldKeys = new Set<string>()
  for (const user of users) {
    if (user.customFields && typeof user.customFields === 'object') {
      for (const key of Object.keys(
        user.customFields as Record<string, unknown>,
      )) {
        customFieldKeys.add(key)
      }
    }
  }

  const allHeaders = [...headers, ...Array.from(customFieldKeys)]

  const rows = users.map((u) => {
    const base = [
      u.nationalId,
      u.name,
      u.phone ?? '',
      u.email ?? '',
      u.role.name,
      u.status,
      u.createdAt.toISOString().split('T')[0],
    ]

    const customValues = Array.from(customFieldKeys).map((key) => {
      const cf = u.customFields as Record<string, unknown> | null
      return cf?.[key] != null ? String(cf[key]) : ''
    })

    return [...base, ...customValues]
  })

  const ws = XLSX.utils.aoa_to_sheet([allHeaders, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'کاربران')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
