import { prisma } from '@/server/db'

export interface PollData {
  id: string
  title: string
  description: string | null
  isActive: boolean
  expiresAt: Date | null
  createdAt: Date
  options: Array<{
    id: string
    label: string
    _count: { votes: number }
  }>
  creator?: { name: string }
  totalVotes: number
  userVote?: string | null
}

export async function createPoll(data: {
  title: string
  description?: string
  options: string[]
  createdById: string
  expiresAt?: Date
}): Promise<PollData> {
  const poll = await prisma.poll.create({
    data: {
      title: data.title,
      description: data.description,
      createdById: data.createdById,
      expiresAt: data.expiresAt,
      options: {
        create: data.options.map((label) => ({ label })),
      },
    },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { name: true } },
    },
  })

  return {
    ...poll,
    totalVotes: poll.options.reduce((sum, o) => sum + o._count.votes, 0),
  }
}

export async function listActivePolls(
  userId?: string,
): Promise<PollData[]> {
  const polls = await prisma.poll.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const mapped = polls.map((poll) => ({
    ...poll,
    totalVotes: poll.options.reduce((sum, o) => sum + o._count.votes, 0),
    userVote: null as string | null,
  }))

  if (!userId) return mapped

  return Promise.all(
    mapped.map(async (poll) => {
      const vote = await prisma.pollVote.findUnique({
        where: { pollId_userId: { pollId: poll.id, userId } },
        select: { optionId: true },
      })
      return { ...poll, userVote: vote?.optionId ?? null }
    }),
  )
}

export async function vote(
  pollId: string,
  optionId: string,
  userId: string,
): Promise<void> {
  await prisma.pollVote.upsert({
    where: { pollId_userId: { pollId, userId } },
    update: { optionId },
    create: { pollId, optionId, userId },
  })
}

export async function getPollResults(pollId: string): Promise<{
  poll: PollData
  results: Array<{ id: string; label: string; votes: number; percentage: number }>
} | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { name: true } },
    },
  })

  if (!poll) return null

  const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0)
  const results = poll.options.map((o) => ({
    id: o.id,
    label: o.label,
    votes: o._count.votes,
    percentage: totalVotes > 0 ? Math.round((o._count.votes / totalVotes) * 100) : 0,
  }))

  return {
    poll: { ...poll, totalVotes, userVote: null },
    results,
  }
}

export async function deactivatePoll(pollId: string): Promise<void> {
  await prisma.poll.update({
    where: { id: pollId },
    data: { isActive: false },
  })
}
