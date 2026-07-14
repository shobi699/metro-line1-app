import { prisma } from '@/server/db'
import { awardPoints } from './gamification-service'

export async function startExam(userId: string, examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId }
  })
  
  if (!exam) throw new Error('آزمون یافت نشد')

  // Check cooldown & max attempts
  const previousAttempts = await prisma.examAttempt.findMany({
    where: { userId, examId },
    orderBy: { startedAt: 'desc' }
  })

  if (previousAttempts.length >= exam.maxAttempts) {
    throw new Error('شما حداکثر دفعات مجاز این آزمون را استفاده کرده‌اید')
  }

  if (previousAttempts.length > 0) {
    const lastAttempt = previousAttempts[0]
    const hoursSinceLast = (new Date().getTime() - lastAttempt.startedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLast < exam.cooldownHrs && lastAttempt.status !== 'in_progress') {
      throw new Error(`باید ${exam.cooldownHrs} ساعت تا آزمون مجدد صبر کنید`)
    }
    // If there is an in_progress attempt, maybe return it instead of starting a new one?
    if (lastAttempt.status === 'in_progress') {
      return lastAttempt
    }
  }

  let courseCategory = ''
  if (exam.courseId) {
    const course = await prisma.course.findUnique({ where: { id: exam.courseId } })
    if (course) {
      courseCategory = course.title
    }
  }

  let allQuestions = await prisma.questionBank.findMany({
    where: {
      isActive: true,
      ...(courseCategory ? { category: courseCategory } : {})
    },
    select: {
      id: true,
      text: true,
      options: true,
      kind: true,
      mediaUrl: true
    }
  })

  if (allQuestions.length === 0) {
    allQuestions = await prisma.questionBank.findMany({
      where: { isActive: true },
      select: {
        id: true,
        text: true,
        options: true,
        kind: true,
        mediaUrl: true
      }
    })
  }

  // Shuffle and pick
  const shuffled = allQuestions.sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, exam.questionCount)

  // We store the full selected questions in the snapshot so grading can happen later.
  const attempt = await prisma.examAttempt.create({
    data: {
      userId,
      examId,
      status: 'in_progress',
      snapshot: JSON.stringify(selected),
    }
  })

  return attempt
}

export async function submitExam(userId: string, attemptId: string, userAnswers: Record<string, string>) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true, enrollment: true }
  })

  if (!attempt) throw new Error('تلاش آزمون یافت نشد')
  if (attempt.userId !== userId) throw new Error('عدم دسترسی')
  if (attempt.status !== 'in_progress') throw new Error('این آزمون قبلا ثبت شده است')

  const snapshot: any[] = JSON.parse(attempt.snapshot)
  let correctCount = 0

  snapshot.forEach(q => {
    const optionsObj = JSON.parse(q.options)
    let correctAnswerId = ''
    if (Array.isArray(optionsObj)) {
      const correctOpt = optionsObj.find((opt: any) => opt.isCorrect)
      if (correctOpt) {
        correctAnswerId = String(correctOpt.id)
      }
    } else {
      correctAnswerId = String(optionsObj.correct)
    }
    const userAnswer = userAnswers[q.id]
    if (String(userAnswer) === correctAnswerId) {
      correctCount++
    }
  })

  const score = Math.round((correctCount / snapshot.length) * 100)
  const isPassed = score >= attempt.exam.passScore

  const updatedAttempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: isPassed ? 'passed' : 'failed',
      score,
      endedAt: new Date(),
      answers: JSON.stringify(userAnswers)
    }
  })

  // Update enrollment if there is one
  if (isPassed && attempt.enrollmentId) {
    await prisma.enrollment.update({
      where: { id: attempt.enrollmentId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progressPct: 100
      }
    })

    // Issue certificate if course is attached
    if (attempt.exam.courseId) {
      // Assuming a generic certificate template or logic
      const serial = `CERT-${attempt.exam.courseId.substring(0, 4)}-${userId.substring(0, 4)}-${new Date().getTime().toString().substring(8)}`
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 2) // Default 2 years
      
      await prisma.certificate.upsert({
        where: {
          courseId_userId: {
            courseId: attempt.exam.courseId,
            userId
          }
        },
        update: {},
        create: {
          courseId: attempt.exam.courseId,
          userId,
          serial,
          expiresAt
        }
      })
    }
  }

  if (isPassed) {
    // Award 100 points for passing, extra 50 if score is 100%
    const points = score === 100 ? 150 : 100
    await awardPoints(userId, points, `قبولی در آزمون ${attempt.examId}`)
  }

  return updatedAttempt
}
