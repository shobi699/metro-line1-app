import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSurvey,
  listActiveSurveys,
  getSurveyByKey,
  submitSurveyResponse,
  getSurveyAnalytics,
} from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    survey: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    surveyInvitee: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    surveyResponse: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.all(actions)),
  },
}))

describe('surveys service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates survey and adds invitees matching targeted audience', async () => {
    const mockSurvey = {
      id: 'srv-1',
      key: 'test-key',
      title: 'Survey 1',
      isAnonymous: true,
    }
    vi.mocked(prisma.survey.create).mockResolvedValue(mockSurvey as any)

    const mockUsers = [
      { id: 'user-1', status: 'active', role: { key: 'operator' }, customFields: { station: 'darvazeh-dowlat', group: 'A' } },
      { id: 'user-2', status: 'active', role: { key: 'admin' }, customFields: { station: 'tajrish', group: 'B' } },
    ]
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)

    await createSurvey({
      key: 'test-key',
      title: 'Survey 1',
      schema: [],
      audience: { roles: ['operator'] },
      createdBy: 'admin-id',
    })

    expect(prisma.survey.create).toHaveBeenCalledOnce()
    expect(prisma.surveyInvitee.createMany).toHaveBeenCalledWith({
      data: [{ surveyId: 'srv-1', userId: 'user-1' }],
    })
  })

  it('submits survey response anonymously', async () => {
    const mockSurvey = {
      id: 'srv-1',
      key: 'test-key',
      isAnonymous: true,
    }
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey as any)

    const mockInvitee = {
      id: 'inv-1',
      surveyId: 'srv-1',
      userId: 'user-1',
      respondedAt: null,
    }
    vi.mocked(prisma.surveyInvitee.findUnique).mockResolvedValue(mockInvitee as any)

    const mockUser = {
      id: 'user-1',
      role: { key: 'operator' },
      customFields: { station: 'darvazeh-dowlat', group: 'A' },
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    await submitSurveyResponse('test-key', 'user-1', { q1: 'yes' }, 120)

    expect(prisma.surveyResponse.create).toHaveBeenCalledWith({
      data: {
        surveyId: 'srv-1',
        userId: null, // Anonymous response
        segment: {
          role: 'operator',
          station: 'darvazeh-dowlat',
          group: 'A',
        },
        answers: { q1: 'yes' },
        durationSec: 120,
      },
    })
  })

  it('masks segment values with less than 5 responses to protect privacy', async () => {
    const mockSurvey = { id: 'srv-1', title: 'Survey 1' }
    vi.mocked(prisma.survey.findUnique).mockResolvedValue(mockSurvey as any)
    vi.mocked(prisma.surveyInvitee.count).mockResolvedValue(10)

    // Segment station "A" has 6 responses (>= 5), and station "B" has only 2 (< 5)
    const mockResponses = [
      ...Array.from({ length: 6 }).map(() => ({
        segment: { role: 'operator', station: 'A', group: 'G1' },
        answers: { q1: 'yes' },
      })),
      ...Array.from({ length: 2 }).map(() => ({
        segment: { role: 'operator', station: 'B', group: 'G2' },
        answers: { q1: 'no' },
      })),
    ]
    vi.mocked(prisma.surveyResponse.findMany).mockResolvedValue(mockResponses as any)

    const analytics = await getSurveyAnalytics('srv-1')
    expect(analytics).not.toBeNull()
    
    // Station A should remain A
    expect(analytics?.responses[0].segment.station).toBe('A')
    
    // Station B should be masked
    expect(analytics?.responses[6].segment.station).toBe('سایر (حفظ حریم خصوصی)')
  })
})
