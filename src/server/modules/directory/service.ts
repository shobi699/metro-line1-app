import { prisma } from '@/server/db'
import type { UserSearchParams } from '@/server/dto/directory'

export interface PaginatedUsers {
  users: Array<{
    id: string
    nationalId: string
    name: string
    phone: string | null
    email: string | null
    status: string
    customFields: Record<string, unknown> | null
    role: { key: string; name: string }
    createdAt: Date
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listUsers(params: UserSearchParams): Promise<PaginatedUsers> {
  const { q, role, status, page, pageSize } = params
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { nationalId: { contains: q } },
      { name: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ]
  }

  if (role) {
    where.role = { key: role }
  }

  if (status) {
    where.status = status
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as never,
      select: {
        id: true,
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
