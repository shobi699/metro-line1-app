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
      const { votes, anonToken, attachments, formData, ...safeIdea } = idea
      
      return {
        ...safeIdea,
        // Since it's public, maybe they want to see attachments/formData?
        // Let's pass basic formData if needed, but for ideas usually title/body are in the DB.
        // Wait, Feedback model only has `formData` (JSON), it doesn't have `title` and `body` directly as top-level strings? Let's check schema.
        formData: formData as any,
        hasVoted
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedIdeas
    })
  } catch (error: any) {
    console.error('Error fetching ideas:', error)
    return NextResponse.json(
      { error: 'خطای سرور در دریافت ایده‌ها', details: error.message },
      { status: 500 }
    )
  }
}
