import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const sort = searchParams.get('sort') || 'votes' // 'votes', 'recent', 'oldest'

  try {
    const ideas = await prisma.feedback.findMany({
      where: {
        isPublicIdea: true
      },
      include: {
        category: {
          select: { id: true, title: true, icon: true }
        },
        user: {
          select: { name: true }
        },
        votes: {
          where: { userId: user.id },
          select: { userId: true } // Check if current user voted
        }
      },
      orderBy: sort === 'recent' 
        ? { createdAt: 'desc' }
        : sort === 'oldest'
        ? { createdAt: 'asc' }
        : { ideaVotesCount: 'desc' }
    })

    const formattedIdeas = ideas.map(idea => {
      const hasVoted = idea.votes.length > 0
      
      // Strip out sensitive info just in case
      const { votes: _votes, anonToken: _anonToken, attachments: _attachments, formData, ...safeIdea } = idea
      
      return {
        ...safeIdea,
        user: safeIdea.isAnonymous ? null : safeIdea.user,
        formData: formData as unknown,
        hasVoted
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedIdeas
    })
  } catch (error: unknown) {
    console.error('Error fetching ideas:', error)
    const message = error instanceof Error ? error.message : 'خطای نامشخص'
    return NextResponse.json(
      { error: 'خطای سرور در دریافت ایده‌ها', details: message },
      { status: 500 }
    )
  }
}
