import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCourses, getCourseDetail, updateVideoProgress } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    courseVideo: {
      findMany: vi.fn(),
    },
    videoProgress: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    certificate: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('learning service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retrieves active courses with their videos', async () => {
    const mockCourses = [
      { id: 'c-1', title: 'Course 1', videos: [{ id: 'v-1', title: 'Video 1' }] },
    ]
    vi.mocked(prisma.course.findMany).mockResolvedValue(mockCourses as any)

    const result = await getCourses()
    expect(result).toHaveLength(1)
    expect(result[0].videos).toHaveLength(1)
    expect(prisma.course.findMany).toHaveBeenCalledOnce()
  })

  it('updates video progress and issues certificate if passing conditions are met', async () => {
    // Mock progress upsert
    vi.mocked(prisma.videoProgress.upsert).mockResolvedValue({
      id: 'p-1',
      videoId: 'v-1',
      userId: 'user-1',
      watchedPct: 100,
      completed: true,
      quizScore: 90,
      video: {
        id: 'v-1',
        course: {
          id: 'c-1',
          passScore: 70,
          certValidityMonths: 12,
        },
      },
    } as any)

    // Mock mandatory videos list: just v-1
    vi.mocked(prisma.courseVideo.findMany).mockResolvedValue([
      { id: 'v-1' },
    ] as any)

    // Mock user progress on course mandatory videos: v-1 complete with score 90
    vi.mocked(prisma.videoProgress.findMany).mockResolvedValue([
      { videoId: 'v-1', completed: true, quizScore: 90 },
    ] as any)

    // No existing certificate
    vi.mocked(prisma.certificate.findUnique).mockResolvedValue(null)

    await updateVideoProgress({
      userId: 'user-1',
      videoId: 'v-1',
      watchedPct: 100,
      completed: true,
      quizScore: 90,
    })

    // Assert certificate creation was triggered
    expect(prisma.certificate.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
  })
})
