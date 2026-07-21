import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'

interface QuizQuestion {
  q: string
  options: string[]
  answerIndex: number
}

function extractQuiz(body: string): QuizQuestion[] | null {
  const match = body.match(/\[quiz\]([\s\S]*?)\[\/quiz\]/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params

  try {
    const bodyData = await request.json()
    const { answers } = bodyData

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'پاسخ‌ها باید در قالب آرایه ارسال شوند' },
        { status: 400 },
      )
    }

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'محتوا یافت نشد' }, { status: 404 })
    }

    const quiz = extractQuiz(post.body)

    if (!quiz || quiz.length === 0) {
      return NextResponse.json(
        { error: 'آزمونی برای این محتوای آموزشی تعریف نشده است' },
        { status: 400 },
      )
    }

    if (answers.length !== quiz.length) {
      return NextResponse.json(
        { error: 'تعداد پاسخ‌های ارسالی با تعداد سوالات آزمون مطابقت ندارد' },
        { status: 400 },
      )
    }

    // Verify answers
    const wrongAnswers: number[] = []
    quiz.forEach((q, idx) => {
      if (answers[idx] !== q.answerIndex) {
        wrongAnswers.push(idx + 1) // 1-indexed for user visibility
      }
    })

    if (wrongAnswers.length > 0) {
      return NextResponse.json({
        success: false,
        message: `پاسخ شما به سوالات شماره (${wrongAnswers.join('، ')}) نادرست بود. لطفا دوباره تلاش کنید.`,
      })
    }

    // Award 50 points if all answers are correct
    const period = new Date().toISOString().substring(0, 7) // e.g., "2026-06"
    const reason = `quiz_completed_post_${post.id}`

    // Check if points were already awarded
    const existingScore = await prisma.gamificationScore.findUnique({
      where: {
        userId_period_reason: {
          userId: user.id,
          period,
          reason,
        },
      },
    })

    if (existingScore) {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        message: 'شما آزمون را با موفقیت پاس کردید! (امتیاز این آزمون قبلاً به حساب شما منظور شده است.)',
      })
    }

    await prisma.$transaction(async (tx) => {
      // Use service in tx if needed, but since service is simple we can call it or manually upsert inside tx
      await tx.gamificationScore.upsert({
        where: {
          userId_period_reason: {
            userId: user.id,
            period,
            reason,
          },
        },
        update: { points: { increment: 50 } },
        create: {
          userId: user.id,
          points: 50,
          reason,
          period,
        },
      })

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Post',
          entityId: post.id,
          action: 'update',
          after: {
            reason: 'Completed training quiz and earned 50 points',
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      pointsAwarded: 50,
      message: 'تبریک! شما به تمامی سوالات پاسخ صحیح دادید و ۵۰ امتیاز دریافت کردید.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
