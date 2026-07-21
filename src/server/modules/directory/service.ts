import { prisma } from '@/server/db'
import type { UserSearchParams } from '@/lib/zod/directory'

export interface PaginatedUsers {
  users: Array<{
    id: string
    personnelCode: string
    name: string
    phone: string | null
    email: string | null
    status: string
    customFields: Record<string, unknown> | null
    role: { key: string; title: string }
    createdAt: Date
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listUsers(params: UserSearchParams): Promise<PaginatedUsers> {
  const { q, role, status, plate, page, pageSize } = params
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (role) {
    where.role = { key: role }
  }

  if (status) {
    where.status = status
  }

  // If there is search query (q) or vehicle plate query (plate), do in-memory filtering for robustness with JSON
  if (q || plate) {
    const allUsers = await prisma.user.findMany({
      where: where as never,
      select: {
        id: true,
        personnelCode: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        customFields: true,
        role: { select: { key: true, title: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const normalizedQ = q ? q.toLowerCase().trim() : ''
    const normalizedPlate = plate ? plate.toLowerCase().trim() : ''

    const filtered = allUsers.filter((u) => {
      const customFields = (u.customFields as Record<string, unknown>) || {}
      const vehicles = (customFields.vehicles as Record<string, unknown>[]) || []

      // 1. General search q
      if (normalizedQ) {
        let match = false
        if (u.name.toLowerCase().includes(normalizedQ)) match = true
        if (u.personnelCode.includes(normalizedQ)) match = true
        if (u.phone?.includes(normalizedQ)) match = true
        if (u.email?.toLowerCase().includes(normalizedQ)) match = true
        
        // Search inside vehicles array
        const vehicleMatch = vehicles.some((v: Record<string, unknown>) => {
          const plateStr = `${v.plateNum1 || ''}${v.plateLetter || ''}${v.plateNum2 || ''}${v.plateCity || ''}`.toLowerCase()
          const carPlate = ((v.carPlate as string) || '').toLowerCase()
          const carType = ((v.carType as string) || '').toLowerCase()
          return plateStr.includes(normalizedQ) || carPlate.includes(normalizedQ) || carType.includes(normalizedQ)
        })
        if (vehicleMatch) match = true

        if (!match) return false
      }

      // 2. Specific Plate search
      if (normalizedPlate) {
        // Check vehicles array
        const vehicleMatch = vehicles.some((v: Record<string, unknown>) => {
          const plateStr = `${v.plateNum1 || ''}${v.plateLetter || ''}${v.plateNum2 || ''}${v.plateCity || ''}`.toLowerCase()
          const carPlate = ((v.carPlate as string) || '').toLowerCase()
          return plateStr.includes(normalizedPlate) || carPlate.includes(normalizedPlate)
        })
        // Also check legacy flat carPlate field
        const legacyPlate = ((customFields.carPlate as string) || '').toLowerCase().replace(/\s+/g, '')
        const legacyMatch = legacyPlate.includes(normalizedPlate.replace(/\s+/g, ''))
        if (!vehicleMatch && !legacyMatch) return false
      }

      return true
    })

    const total = filtered.length
    const paginatedUsers = filtered.slice(skip, skip + pageSize)

    return {
      users: paginatedUsers.map((u) => ({
        ...u,
        customFields: (u.customFields as Record<string, unknown>) ?? null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // Otherwise, run standard database pagination for performance
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      select: {
        id: true,
        personnelCode: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        customFields: true,
        role: { select: { key: true, title: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where: where as never }),
  ])

  return {
    users: users.map((u) => ({
      ...u,
      customFields: (u.customFields as Record<string, unknown>) ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
