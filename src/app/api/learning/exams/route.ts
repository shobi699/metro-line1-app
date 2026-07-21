import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    // 1. Get all enrollments for this user
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            exams: true
          }
        },
        attempts: {
          orderBy: { startedAt: 'desc' },
          include: {
            exam: true
          }
        }
      }
    })

    // 2. Extract pending exams (exams belonging to enrolled courses, where user doesn't have a 'passed' attempt yet)
    const passedExamIds = new Set(
      enrollments.flatMap(e => e.attempts.filter(a => a.status === 'passed').map(a => a.examId))
    )

    const pending: any[] = []
    const completed: any[] = []

    enrollments.forEach(e => {
      // Pending exams in this course
      e.course.exams.forEach(exam => {
        if (!passedExamIds.has(exam.id)) {
          pending.push({
            id: exam.id,
            title: exam.title,
            courseId: e.courseId,
            courseTitle: e.course.title,
            category: e.course.category || 'آموزش تخصصی',
            questionCount: exam.questionCount,
            timeLimitMinutes: exam.durationMin,
            mandatory: e.course.mandatoryFor ? true : false,
          })
        }
      })

      // Completed attempts in this course
      e.attempts.forEach(a => {
        completed.push({
          id: a.id,
          examId: a.examId,
          title: a.exam.title,
          score: a.score || 0,
          status: a.status, // 'passed' | 'failed' | 'in_progress'
          date: new Date(a.startedAt).toLocaleDateString('fa-IR'),
          endedAt: a.endedAt ? new Date(a.endedAt).toLocaleDateString('fa-IR') : null,
          totalQuestions: a.exam.questionCount,
          correctAnswers: a.score ? Math.round((a.score / 100) * a.exam.questionCount) : 0,
          retryAvailableAt: a.status === 'failed' 
            ? new Date(a.startedAt.getTime() + a.exam.cooldownHrs * 60 * 60 * 1000).toLocaleTimeString('fa-IR')
            : null
        })
      })
    })

    return NextResponse.json({
      data: {
        pending,
        completed
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت لیست آزمون‌ها' } },
      { status: 500 }
    )
  }
}
