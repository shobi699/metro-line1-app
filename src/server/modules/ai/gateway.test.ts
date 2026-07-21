import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIGateway } from './gateway'
import { prisma } from '@/server/db'
import { getAdapter } from './adapters'

vi.mock('@/server/db', () => ({
  prisma: {
    aiProvider: {
      findMany: vi.fn(),
      update: vi.fn(),
    }
  }
}))

vi.mock('./adapters', () => ({
  getAdapter: vi.fn(),
}))

describe('AIGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should route request to highest priority provider', async () => {
    const mockProviders = [
      { id: '1', name: 'Gemini', priority: 1, isActive: true, consecutiveFailures: 0, timeoutMs: 5000 },
      { id: '2', name: 'OpenRouter', priority: 2, isActive: true, consecutiveFailures: 0, timeoutMs: 5000 },
    ]
    vi.mocked(prisma.aiProvider.findMany).mockResolvedValue(mockProviders as any)

    const mockAdapter = {
      chat: vi.fn().mockResolvedValue({ text: 'پاسخ هوش مصنوعی', usedProvider: 'Gemini' })
    }
    vi.mocked(getAdapter).mockResolvedValue(mockAdapter as any)

    const response = await AIGateway.routeRequest('تست')
    expect(response.text).toBe('پاسخ هوش مصنوعی')
    expect(response.usedProvider).toBe('Gemini')
    expect(mockAdapter.chat).toHaveBeenCalledWith('تست', mockProviders[0], undefined)
  })

  it('should fallback to second provider if first one fails', async () => {
    const mockProviders = [
      { id: '1', name: 'Gemini', priority: 1, isActive: true, consecutiveFailures: 0, timeoutMs: 5000 },
      { id: '2', name: 'OpenRouter', priority: 2, isActive: true, consecutiveFailures: 0, timeoutMs: 5000 },
    ]
    vi.mocked(prisma.aiProvider.findMany).mockResolvedValue(mockProviders as any)

    const mockFailedAdapter = {
      chat: vi.fn().mockRejectedValue(new Error('API error'))
    }
    const mockSuccessAdapter = {
      chat: vi.fn().mockResolvedValue({ text: 'پاسخ دوم', usedProvider: 'OpenRouter' })
    }

    vi.mocked(getAdapter)
      .mockResolvedValueOnce(mockFailedAdapter as any)
      .mockResolvedValueOnce(mockSuccessAdapter as any)

    const response = await AIGateway.routeRequest('تست')
    expect(response.text).toBe('پاسخ دوم')
    expect(response.usedProvider).toBe('OpenRouter')
    expect(prisma.aiProvider.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1' } })
    )
  })

  it('should skip provider if circuit breaker is open', async () => {
    const mockProviders = [
      { id: '1', name: 'Gemini', priority: 1, isActive: true, consecutiveFailures: 3, lastFailureAt: new Date(Date.now() - 60000), timeoutMs: 5000 },
      { id: '2', name: 'OpenRouter', priority: 2, isActive: true, consecutiveFailures: 0, timeoutMs: 5000 },
    ]
    vi.mocked(prisma.aiProvider.findMany).mockResolvedValue(mockProviders as any)

    const mockSuccessAdapter = {
      chat: vi.fn().mockResolvedValue({ text: 'پاسخ دوم', usedProvider: 'OpenRouter' })
    }
    vi.mocked(getAdapter).mockResolvedValue(mockSuccessAdapter as any)

    const response = await AIGateway.routeRequest('تست')
    expect(response.text).toBe('پاسخ دوم')
    expect(response.usedProvider).toBe('OpenRouter')
    expect(getAdapter).toHaveBeenCalledTimes(1) // Gemini is skipped entirely
  })
})
