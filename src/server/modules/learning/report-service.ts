import { prisma } from '@/server/db'

export const getOverallStats = async () => {
  const [coursesCount, examsCount, certsCount, enrollments] = await Promise.all([
    prisma.course.count(),
    prisma.exam.count(),
    prisma.certificate.count(),
    prisma.enrollment.findMany({ select: { status: true } }),
  ])

  const totalEnrollments = enrollments.length
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0

  return {
    coursesCount,
    examsCount,
    certsCount,
    totalEnrollments,
    completionRate
  }
}

export const getComplianceMatrix = async () => {
  // We need to fetch all enrollments and check their status/deadlines
  const enrollments = await prisma.enrollment.findMany({
    include: {
      course: { select: { title: true, id: true } }
    }
  })

  // We could just group them by status
  const compliance = {
    in_progress: 0,
    completed: 0,
    failed: 0,
    expired: 0
  }

  const now = new Date()

  const list = enrollments.map(e => {
    let currentStatus = e.status
    if (currentStatus === 'in_progress' && e.deadlineAt && new Date(e.deadlineAt) < now) {
      currentStatus = 'expired'
    }

    if (currentStatus === 'in_progress') compliance.in_progress++
    if (currentStatus === 'completed') compliance.completed++
    if (currentStatus === 'failed') compliance.failed++
    if (currentStatus === 'expired') compliance.expired++

    return {
      userId: e.userId,
      courseId: e.courseId,
      courseTitle: e.course?.title,
      status: currentStatus,
      deadlineAt: e.deadlineAt
    }
  })

  return {
    summary: compliance,
    details: list
  }
}

export const getItemAnalysis = async (examId: string) => {
  // Item analysis checks every question in exam attempts to see how many got it right
  const attempts = await prisma.examAttempt.findMany({
    where: { examId, endedAt: { not: null } },
    select: { snapshot: true, answers: true }
  })

  const stats: Record<string, { correct: number, total: number, text: string }> = {}

  attempts.forEach(attempt => {
    let questions: any[] = []
    let answers: Record<string, string> = {}
    
    try {
      if (attempt.snapshot) questions = JSON.parse(attempt.snapshot)
      if (attempt.answers) answers = JSON.parse(attempt.answers)
    } catch (err) {}

    if (Array.isArray(questions)) {
      questions.forEach(q => {
        if (!stats[q.id]) {
          stats[q.id] = { correct: 0, total: 0, text: q.text }
        }
        
        stats[q.id].total++
        
        const correctOption = q.options?.find((o: any) => o.isCorrect)
        if (correctOption && answers[q.id] === correctOption.id) {
          stats[q.id].correct++
        } else if (correctOption && answers[q.id] === correctOption.text) {
          stats[q.id].correct++
        }
      })
    }
  })

  return Object.values(stats).map(s => ({
    text: s.text,
    correctRate: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    totalAttempts: s.total
  }))
}
