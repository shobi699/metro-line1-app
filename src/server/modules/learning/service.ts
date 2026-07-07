import { prisma } from '@/server/db'
import { randomBytes } from 'node:crypto'

export interface CourseData {
  id: string
  title: string
  description: string | null
  icon: string | null
  certValidityMonths: number
  passScore: number
}

/**
 * Get all courses available, optionally filtered by user role
 */
export async function getCourses(roleKey?: string) {
  const where: Record<string, any> = { isActive: true }
  if (roleKey) {
    where.audiences = {
      some: {
        roleKey,
      },
    }
  }

  return prisma.course.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      videos: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

/**
 * Get details of a single course with videos and user progress
 */
export async function getCourseDetail(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      videos: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          progress: {
            where: { userId },
          },
        },
      },
      certificates: {
        where: { userId },
      },
    },
  })

  if (!course) {
    throw new Error('دوره یافت نشد')
  }

  return course
}

/**
 * Update user's watching progress on a video, and evaluate for course completion/certification
 */
export async function updateVideoProgress(params: {
  userId: string
  videoId: string
  watchedPct: number
  completed?: boolean
  quizScore?: number
}) {
  const progress = await prisma.videoProgress.upsert({
    where: {
      videoId_userId: {
        videoId: params.videoId,
        userId: params.userId,
      },
    },
    update: {
      watchedPct: params.watchedPct,
      completed: params.completed ?? false,
      quizScore: params.quizScore !== undefined ? params.quizScore : undefined,
    },
    create: {
      videoId: params.videoId,
      userId: params.userId,
      watchedPct: params.watchedPct,
      completed: params.completed ?? false,
      quizScore: params.quizScore,
    },
    include: {
      video: {
        include: {
          course: true,
        },
      },
    },
  })

  // Evaluate if course is completed and candidate for certification
  const course = progress.video.course
  const mandatoryVideos = await prisma.courseVideo.findMany({
    where: {
      courseId: course.id,
      mandatory: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  })

  const userProgress = await prisma.videoProgress.findMany({
    where: {
      userId: params.userId,
      video: {
        courseId: course.id,
        mandatory: true,
      },
    },
  })

  const allMandatoryCompleted = mandatoryVideos.every((mv) => {
    const up = userProgress.find((p) => p.videoId === mv.id)
    return up && up.completed
  })

  if (allMandatoryCompleted) {
    // Check passing score
    const scores = userProgress.filter((up) => up.quizScore !== null).map((up) => up.quizScore as number)
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100

    if (avgScore >= course.passScore) {
      // Issue certificate if it doesn't already exist
      const existingCert = await prisma.certificate.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId: params.userId,
          },
        },
      })

      if (!existingCert) {
        const serial = `CERT-${course.id.substring(0, 4)}-${params.userId.substring(0, 4)}-${randomBytes(4).toString('hex').toUpperCase()}`
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + course.certValidityMonths)

        await prisma.certificate.create({
          data: {
            courseId: course.id,
            userId: params.userId,
            serial,
            expiresAt,
          },
        })

        // Also add an audit log
        await prisma.auditLog.create({
          data: {
            actorId: params.userId,
            entity: 'Course',
            entityId: course.id,
            action: 'create',
            metadata: { event: 'learning:certificate_issued', serial },
          },
        })
      }
    }
  }

  return progress
}
