import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  feedback: z.number().int().min(-1).max(1), // 1 for thumbs up, -1 for thumbs down
})

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = feedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { messageId, feedback } = parsed.data

    // Make sure the message exists and belongs to the user
    const message = await prisma.aiMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.conversation.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update feedback
    await prisma.aiMessage.update({
      where: { id: messageId },
      data: { feedback }
    })

    return NextResponse.json({ data: { success: true } })

  } catch (err) {
    console.error('AI feedback route error:', err)
    return NextResponse.json(
      { error: 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    )
  }
}
