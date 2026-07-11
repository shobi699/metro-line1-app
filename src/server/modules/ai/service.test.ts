import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIAssistantService, pendingActions } from './service'
import { prisma } from '@/server/db'
import { AIGateway } from './gateway'
import { getEmbedding, cosineSimilarity } from './embedding'
import { getSettingValue } from '@/server/modules/settings/service'
import { createFaultReport } from '@/server/modules/faults/service'
import dayjs from 'dayjs'

vi.mock('@/server/db', () => ({
  prisma: {
    aiPersona: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    shift: {
      findFirst: vi.fn(),
    },
    train: {
      findUnique: vi.fn(),
    },
    faultReport: {
      findMany: vi.fn(),
    },
    faultCode: {
      findMany: vi.fn(),
    },
    aiKnowledgeCache: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    knowledgeFAQ: {
      findMany: vi.fn(),
    },
    aiInteraction: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    aiChunk: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('./gateway', () => ({
  AIGateway: {
    routeRequestStream: vi.fn(),
    routeRequest: vi.fn(),
  },
}))

vi.mock('./embedding', () => ({
  getEmbedding: vi.fn(),
  cosineSimilarity: vi.fn(),
}))

vi.mock('@/server/modules/settings/service', () => ({
  getSettingValue: vi.fn((key, fallback) => Promise.resolve(fallback)),
}))

vi.mock('@/server/modules/faults/service', () => ({
  createFaultReport: vi.fn(),
}))

describe('AIAssistantService Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pendingActions.clear()
  })

  const mockPersona = {
    id: 'p1',
    key: 'operator',
    title: 'دستیار راهبر',
    systemPrompt: 'شما یک دستیار هستید.',
    roleKeys: JSON.stringify(['operator']),
    knowledgeCats: JSON.stringify(['general']),
    tools: JSON.stringify(['create_fault']),
    economyModel: 'ollama',
    strongModel: 'gemini',
    monthlyTokenCap: 50000,
    isActive: true,
  }

  const mockUser = {
    id: 'u1',
    role: { key: 'operator' },
  }

  describe('processMessageStream', () => {
    it('returns error if persona not found or inactive', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(null)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'nonexistent',
        message: 'سلام',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks[0]).toEqual({
        type: 'error',
        data: { message: 'پرسونای مورد نظر یافت نشد یا غیرفعال است.' },
      })
    })

    it('returns error if user role is not authorized for the persona', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        role: { key: 'manager' }, // Manager is not allowed in mockPersona
      } as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'سلام',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks[0]).toEqual({
        type: 'error',
        data: { message: 'شما دسترسی به این دستیار هوشمند را ندارید.' },
      })
    })

    // --- L0 Tests ---
    it('L0: handles tomorrow shift query', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.shift.findFirst).mockResolvedValue({
        id: 's1',
        userId: 'u1',
        date: new Date(),
        code: 'morning',
        note: 'شیفت روتین',
      } as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'شیفت فردام چیه؟',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const infoChunk = chunks.find((c) => c.type === 'info')
      const tokenChunk = chunks.find((c) => c.type === 'token')
      const doneChunk = chunks.find((c) => c.type === 'done')

      expect(infoChunk?.data.layer).toBe('L0')
      expect(infoChunk?.data.source).toBe('سیستم لوحه زنده')
      expect(tokenChunk?.data.text).toContain('صبح‌کار')
      expect(tokenChunk?.data.text).toContain('شیفت روتین')
      expect(doneChunk?.data.content).toBe(tokenChunk?.data.text)
    })

    it('L0: handles train faults query', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.train.findUnique).mockResolvedValue({
        id: 't1',
        trainNumber: '110',
        status: 'active',
      } as any)
      vi.mocked(prisma.faultReport.findMany).mockResolvedValue([
        {
          id: 'fr1',
          status: 'submitted',
          description: 'صدای غیرعادی ترمز',
          faultCode: { code: 'BRK-01', title: 'اشکال در سیستم ترمز' },
        },
      ] as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'فالت قطار ۱۱۰ رو بگو',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const infoChunk = chunks.find((c) => c.type === 'info')
      const tokenChunk = chunks.find((c) => c.type === 'token')

      expect(infoChunk?.data.layer).toBe('L0')
      expect(infoChunk?.data.source).toBe('سیستم ثبت خرابی')
      expect(tokenChunk?.data.text).toContain('BRK-01')
      expect(tokenChunk?.data.text).toContain('صدای غیرعادی ترمز')
    })

    it('L0: registers draft fault report action requiring confirmation', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.train.findUnique).mockResolvedValue({
        id: 't1',
        trainNumber: '110',
        status: 'active',
      } as any)
      vi.mocked(prisma.faultCode.findMany).mockResolvedValue([
        { id: 'fc1', code: 'BRK-01', title: 'گزارش خرابی ترمز قطار ۱۱۰', keywords: 'ترمز, ایست', isActive: true },
      ] as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'گزارش خرابی ترمز قطار ۱۱۰',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const confirmChunk = chunks.find((c) => c.type === 'tool_confirm')
      expect(confirmChunk).toBeDefined()
      expect(confirmChunk?.data.actionToken).toBeDefined()
      expect(confirmChunk?.data.description).toContain('آیا مایلید فالت BRK-01 (گزارش خرابی ترمز قطار ۱۱۰) را برای قطار شماره ۱۱۰ ثبت کنید؟')

      // Check it was stored in pendingActions
      const token = confirmChunk?.data.actionToken
      expect(pendingActions.has(token)).toBe(true)
    })

    // --- L1 Tests ---
    it('L1: matches semantic cache if within similarity threshold', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(getEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
      vi.mocked(cosineSimilarity).mockReturnValue(0.95) // Above 0.92 threshold

      vi.mocked(prisma.aiKnowledgeCache.findMany).mockResolvedValue([
        {
          id: 'c1',
          personaKey: 'operator',
          questionText: 'سوال مشابه قبلی',
          questionEmbedding: JSON.stringify([0.1, 0.2, 0.3]),
          answerText: 'پاسخ کش شده',
          source: 'cache_source',
          ttlAt: null,
        },
      ] as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'یک سوال با پاسخ کش شده',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const infoChunk = chunks.find((c) => c.type === 'info')
      const tokenChunk = chunks.find((c) => c.type === 'token')

      expect(infoChunk?.data.layer).toBe('L1')
      expect(tokenChunk?.data.text).toBe('پاسخ کش شده')
      expect(prisma.aiKnowledgeCache.update).toHaveBeenCalled()
    })

    // --- L2 Tests ---
    it('L2: matches FAQ database semantically if cache misses', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.aiKnowledgeCache.findMany).mockResolvedValue([])
      vi.mocked(getEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
      
      // FAQ setup: first embedding generated is query, second is FAQ question
      vi.mocked(getEmbedding)
        .mockResolvedValueOnce([0.1, 0.2, 0.3]) // Query
        .mockResolvedValueOnce([0.1, 0.2, 0.35]) // FAQ Question

      vi.mocked(cosineSimilarity).mockReturnValue(0.91) // FAQ Threshold is 0.90

      vi.mocked(prisma.knowledgeFAQ.findMany).mockResolvedValue([
        {
          id: 'faq1',
          question: 'طول قطارها چقدر است؟',
          answer: 'طول قطارها حدود ۱۴۰ متر است.',
          category: 'فنی',
          articleId: null,
        },
      ] as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'اندازه طول قطار چقدره؟',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const infoChunk = chunks.find((c) => c.type === 'info')
      const tokenChunk = chunks.find((c) => c.type === 'token')

      expect(infoChunk?.data.layer).toBe('L2')
      expect(tokenChunk?.data.text).toBe('طول قطارها حدود ۱۴۰ متر است.')
    })

    // --- Budget & Masking & RAG & LLM Tests ---
    it('Budget: blocks requests if monthly quota exceeded', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.aiKnowledgeCache.findMany).mockResolvedValue([])
      vi.mocked(getEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
      vi.mocked(cosineSimilarity).mockReturnValue(0.5) // Miss L1 & L2

      // Mock user monthly usage above cap
      vi.mocked(prisma.aiInteraction.findMany).mockResolvedValue([
        { tokensIn: 60000, tokensOut: 50000 },
      ] as any)
      vi.mocked(getSettingValue).mockImplementation(async (key, fallback) => {
        if (key === 'ai.budget.userMonthlyCap') return 100000
        return fallback
      })

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'هر سوالی',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const infoChunk = chunks.find((c) => c.type === 'info')
      expect(infoChunk?.data.layer).toBe('BudgetExceeded')
      expect(chunks.find((c) => c.type === 'token')?.data.text).toContain('سهمیه مصرف هوش مصنوعی شما')
    })

    it('L3/L4 RAG and masking: masks sensitive data, matches chunks, streams LLM', async () => {
      vi.mocked(prisma.aiPersona.findUnique).mockResolvedValue(mockPersona as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.aiKnowledgeCache.findMany).mockResolvedValue([])
      vi.mocked(prisma.knowledgeFAQ.findMany).mockResolvedValue([])
      vi.mocked(prisma.aiInteraction.findMany).mockResolvedValue([]) // No usage

      // Mock local embedding and cosine similarity
      vi.mocked(getEmbedding).mockResolvedValue([0.1, 0.2, 0.3])
      vi.mocked(cosineSimilarity).mockReturnValue(0.7) // Above 0.40 chunk filter

      // Mock RAG source and chunks
      vi.mocked(prisma.aiChunk.findMany).mockResolvedValue([
        {
          id: 'chunk1',
          sourceId: 'src1',
          text: 'سند عمومی بخش ۱',
          embedding: JSON.stringify([0.1, 0.2, 0.3]),
          source: { id: 'src1', title: 'سند راهنما', category: 'general', accessRoles: null, isActive: true },
        },
      ] as any)

      // Mock AIGateway streaming response
      const mockStream = async function* () {
        yield { provider: 'gemini', token: 'این ' }
        yield { provider: 'gemini', token: 'پاسخ است.' }
      }
      vi.mocked(AIGateway.routeRequestStream).mockReturnValue(mockStream() as any)

      const stream = AIAssistantService.processMessageStream({
        userId: 'u1',
        personaKey: 'operator',
        message: 'کد پرسنلی من 1234567890 است، راهنما چیه؟',
      })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      // Check masking on gateway call
      expect(AIGateway.routeRequestStream).toHaveBeenCalled()
      const callPrompt = vi.mocked(AIGateway.routeRequestStream).mock.calls[0][0]
      expect(callPrompt).toContain('[کد پرسنلی ماسک شده]')
      expect(callPrompt).not.toContain('1234567890')

      // Check chunk retrieval output
      const infoChunk = chunks.find((c) => c.type === 'info')
      expect(infoChunk?.data.layer).toBe('L3') // Normal length, economy model

      const tokens = chunks.filter((c) => c.type === 'token').map((c) => c.data.text).join('')
      expect(tokens).toBe('این پاسخ است.')

      // Check cache creation is triggered
      expect(prisma.aiKnowledgeCache.create).toHaveBeenCalled()
    })
  })

  describe('confirmAction', () => {
    it('throws error if token is invalid', async () => {
      await expect(AIAssistantService.confirmAction('invalid_token', 'u1')).rejects.toThrow(
        'کد اقدام نامعتبر است یا منقضی شده است.'
      )
    })

    it('throws error if user is not the action initiator', async () => {
      pendingActions.set('token123', {
        userId: 'u1',
        action: 'create_fault',
        payload: {},
        description: 'تست',
        createdAt: Date.now(),
      })

      await expect(AIAssistantService.confirmAction('token123', 'different_user')).rejects.toThrow(
        'شما مجاز به تایید این اقدام نیستید.'
      )
    })

    it('executes create_fault and deletes token', async () => {
      const payload = { trainId: 't1', faultCodeId: 'fc1' }
      pendingActions.set('token123', {
        userId: 'u1',
        action: 'create_fault',
        payload,
        description: 'تست',
        createdAt: Date.now(),
      })

      vi.mocked(createFaultReport).mockResolvedValue({ id: 'fr-new' } as any)

      const result = await AIAssistantService.confirmAction('token123', 'u1')
      expect(createFaultReport).toHaveBeenCalledWith(payload, 'u1')
      expect(result).toEqual({ id: 'fr-new' })
      expect(pendingActions.has('token123')).toBe(false)
    })
  })
})
