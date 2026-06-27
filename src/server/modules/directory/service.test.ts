import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listUsers } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

const mockUsers = [
  {
    id: 'u1',
    nationalId: '1111111111',
    name: 'علی رضایی',
    phone: '09121111111',
    email: 'ali@test.com',
    status: 'active',
    customFields: {
      vehicles: [
        { plateNum1: '12', plateLetter: 'ب', plateNum2: '345', plateCity: '11', carType: 'پراید' },
      ],
    },
    role: { key: 'operator', name: 'راهبر' },
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'u2',
    nationalId: '2222222222',
    name: 'محمد احمدی',
    phone: '09122222222',
    email: null,
    status: 'pending',
    customFields: null,
    role: { key: 'admin', name: 'مدیر' },
    createdAt: new Date('2026-02-01'),
  },
  {
    id: 'u3',
    nationalId: '3333333333',
    name: 'حسین محمدی',
    phone: null,
    email: 'hosein@test.com',
    status: 'active',
    customFields: {
      vehicles: [
        { plateNum1: '56', plateLetter: 'د', plateNum2: '789', plateCity: '77', carType: 'ژیان' },
      ],
    },
    role: { key: 'operator', name: 'راهبر' },
    createdAt: new Date('2026-03-01'),
  },
]

describe('listUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated users without filters', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
    vi.mocked(prisma.user.count).mockResolvedValue(3)

    const result = await listUsers({ page: 1, pageSize: 10 })

    expect(result.users).toHaveLength(3)
    expect(result.total).toBe(3)
    expect(result.totalPages).toBe(1)
  })

  it('searches by name (q param)', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

    const result = await listUsers({ q: 'علی', page: 1, pageSize: 10 })

    expect(result.users).toHaveLength(1)
    expect(result.users[0].name).toBe('علی رضایی')
  })

  it('searches by nationalId', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

    const result = await listUsers({ q: '2222222222', page: 1, pageSize: 10 })

    expect(result.users).toHaveLength(1)
    expect(result.users[0].nationalId).toBe('2222222222')
  })

  it('searches by vehicle plate', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

    const result = await listUsers({ plate: '12ب345', page: 1, pageSize: 10 })

    expect(result.users).toHaveLength(1)
    expect(result.users[0].id).toBe('u1')
  })

  it('filters by role', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
    vi.mocked(prisma.user.count).mockResolvedValue(2)

    const result = await listUsers({ role: 'operator', page: 1, pageSize: 10 })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { key: 'operator' },
        }),
      })
    )
  })

  it('filters by status', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
    vi.mocked(prisma.user.count).mockResolvedValue(1)

    const result = await listUsers({ status: 'pending', page: 1, pageSize: 10 })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      })
    )
  })

  it('paginates results correctly', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers.slice(0, 2) as any)
    vi.mocked(prisma.user.count).mockResolvedValue(3)

    const result = await listUsers({ page: 1, pageSize: 2 })

    expect(result.users).toHaveLength(2)
    expect(result.totalPages).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(2)
  })

  it('returns empty for non-matching search', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

    const result = await listUsers({ q: 'nonexistent', page: 1, pageSize: 10 })

    expect(result.users).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})
