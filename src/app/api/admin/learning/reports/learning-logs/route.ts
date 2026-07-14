import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return authErrorResponse(user)
    const err = requirePermission(user, 'learning-admin:manage')
    if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    // Fetch all enrollments with courses, users and attempts
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: {
          select: {
            name: true,
            personnelCode: true,
            role: { select: { title: true } }
          }
        },
        course: {
          select: {
            title: true,
            category: true,
            estMinutes: true,
            passScore: true
          }
        },
        attempts: {
          orderBy: { startedAt: 'desc' },
          select: {
            score: true,
            status: true,
            endedAt: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    // Fetch all certificates
    const certificates = await prisma.certificate.findMany({
      select: {
        userId: true,
        courseId: true,
        serial: true,
        issuedAt: true,
        expiresAt: true
      }
    })

    // Map logs with exam scores, certificates, and quality indicators
    const reportData = enrollments.map((en) => {
      const matchedCert = certificates.find(
        (c) => c.userId === en.userId && c.courseId === en.courseId
      )

      // Find highest score from attempts
      const scores = en.attempts.map((a) => a.score || 0)
      const maxScore = scores.length > 0 ? Math.max(...scores) : null

      // Estimate spent minutes (actual time or dummy if in progress/completed)
      let timeSpentMin = 0
      if (en.status === 'completed') {
        timeSpentMin = en.course.estMinutes || 30
      } else {
        timeSpentMin = Math.round(((en.progressPct || 0) / 100) * (en.course.estMinutes || 30))
      }

      // Quality rating based on completion score
      let qualityRating = 'در حال ارزیابی'
      if (en.status === 'completed') {
        if (maxScore && maxScore >= 90) qualityRating = 'عالی'
        else if (maxScore && maxScore >= 80) qualityRating = 'خوب'
        else qualityRating = 'متوسط/پذیرفته‌شده'
      } else if (en.status === 'failed') {
        qualityRating = 'نیاز به تلاش مجدد'
      }

      return {
        id: en.id,
        userId: en.userId,
        courseId: en.courseId,
        userName: en.user.name,
        personnelCode: en.user.personnelCode,
        userRole: en.user.role.title,
        courseTitle: en.course.title,
        courseCategory: en.course.category,
        enrolledAt: en.enrolledAt,
        completedAt: en.completedAt,
        deadlineAt: en.deadlineAt,
        status: en.status,
        progressPct: en.progressPct,
        maxScore,
        passScore: en.course.passScore,
        timeSpentMin,
        qualityRating,
        certSerial: matchedCert?.serial || null,
        certIssuedAt: matchedCert?.issuedAt || null,
        certExpiresAt: matchedCert?.expiresAt || null
      }
    })

    return NextResponse.json({ data: reportData })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
