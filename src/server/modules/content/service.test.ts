import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleLike, createPost } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    postReaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    post: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('content service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds a like when none exists', async () => {
    vi.mocked(prisma.postReaction.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.postReaction.count).mockResolvedValue(1)

    const result = await toggleLike('post-1', 'user-1')

    expect(prisma.postReaction.create).toHaveBeenCalledOnce()
    expect(prisma.postReaction.delete).not.toHaveBeenCalled()
    expect(result).toEqual({ liked: true, likeCount: 1 })
  })

  it('removes an existing like (toggle off)', async () => {
    vi.mocked(prisma.postReaction.findUnique).mockResolvedValue({
      id: 'r1',
      postId: 'post-1',
      userId: 'user-1',
      createdAt: new Date(),
    })
    vi.mocked(prisma.postReaction.count).mockResolvedValue(0)

    const result = await toggleLike('post-1', 'user-1')

    expect(prisma.postReaction.delete).toHaveBeenCalledOnce()
    expect(prisma.postReaction.create).not.toHaveBeenCalled()
    expect(result).toEqual({ liked: false, likeCount: 0 })
  })

  it('generates a unique slug from the title on create', async () => {
    vi.mocked(prisma.post.create).mockImplementation((async (args: any) => {
      const a = args as { data: { slug: string } }
      return { id: 'p1', ...a.data }
    }) as any)

    await createPost(
      {
        type: 'news',
        title: 'اطلاعیه مهم سیر و حرکت',
        body: 'متن',
        published: true,
        mandatory: false,
      },
      'author-1',
    )

    const call = vi.mocked(prisma.post.create).mock.calls[0][0] as {
      data: { slug: string }
    }
    expect(call.data.slug).toMatch(/-[a-f0-9]{6}$/)
    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
  })
})
