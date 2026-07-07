import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFeedbackCategories, createFeedback, addFeedbackMessage, voteIdea } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    feedbackCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    feedback: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    feedbackMessage: {
      create: vi.fn(),
    },
    feedbackLog: {
      create: vi.fn(),
    },
    ideaVote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('feedback service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retrieves active feedback categories', async () => {
    const mockCats = [{ id: 'cat-1', key: 'welfare', title: 'Welfare' }]
    vi.mocked(prisma.feedbackCategory.findMany).mockResolvedValue(mockCats as any)

    const result = await getFeedbackCategories()
    expect(result).toHaveLength(1)
    expect(prisma.feedbackCategory.findMany).toHaveBeenCalledOnce()
  })

  it('creates feedback with a sequential feedback number and audit logs', async () => {
    vi.mocked(prisma.feedback.findFirst).mockResolvedValue({ feedbackNo: 1005 } as any)
    vi.mocked(prisma.feedback.create).mockResolvedValue({
      id: 'fb-123',
      feedbackNo: 1006,
      title: 'Suggestion',
    } as any)

    const result = await createFeedback({
      type: 'suggestion',
      title: 'Suggestion',
      body: 'Improve cooling in line 1 trains.',
    })

    expect(result.feedbackNo).toBe(1006)
    expect(prisma.feedback.create).toHaveBeenCalledOnce()
    expect(prisma.feedbackLog.create).toHaveBeenCalledOnce()
  })

  it('adds message to thread and updates status and logs', async () => {
    const mockMsg = { id: 'msg-1', feedbackId: 'fb-123', body: 'Understood' }
    vi.mocked(prisma.feedbackMessage.create).mockResolvedValue(mockMsg as any)

    const result = await addFeedbackMessage('fb-123', {
      senderKind: 'staff',
      senderId: 'user-admin',
      body: 'Understood',
    })

    expect(result.id).toBe('msg-1')
    expect(prisma.feedbackMessage.create).toHaveBeenCalledOnce()
    expect(prisma.feedback.update).toHaveBeenCalledOnce()
    expect(prisma.feedbackLog.create).toHaveBeenCalledOnce()
  })

  it('toggles voting on a feedback idea', async () => {
    // 1. Vote creation scenario
    vi.mocked(prisma.ideaVote.findUnique).mockResolvedValue(null) // Not voted yet

    await voteIdea('fb-123', 'user-1')

    expect(prisma.ideaVote.create).toHaveBeenCalledOnce()
    expect(prisma.feedback.update).toHaveBeenCalledWith({
      where: { id: 'fb-123' },
      data: { ideaVotesCount: { increment: 1 } },
    })

    // 2. Unvote scenario
    vi.clearAllMocks()
    vi.mocked(prisma.ideaVote.findUnique).mockResolvedValue({ feedbackId: 'fb-123', userId: 'user-1' } as any)

    await voteIdea('fb-123', 'user-1')

    expect(prisma.ideaVote.delete).toHaveBeenCalledOnce()
    expect(prisma.feedback.update).toHaveBeenCalledWith({
      where: { id: 'fb-123' },
      data: { ideaVotesCount: { decrement: 1 } },
    })
  })
})
