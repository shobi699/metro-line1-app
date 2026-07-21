import { prisma } from '@/server/db'
import { randomBytes } from 'node:crypto'

export interface CourseData {
  id: string
  key: string
  title: string
  description: string | null
  coverUrl: string | null
  category: string | null
  passScore: number
}

/**
 * Get all courses available, optionally filtered by user role
 */
export async function getCourses(roleKey?: string) {
  const where: Record<string, any> = { status: 'published' }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      chapters: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      },
    },
  })
  
  if (roleKey) {
    return courses.filter(c => !c.audience || c.audience.includes(roleKey))
  }
  return courses
}

/**
 * Get details of a single course
 */
export async function getCourseDetail(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      enrollments: {
        where: { userId },
        include: {
          attempts: true
        }
      },
      certificates: {
        where: { userId },
      },
      exams: true,
    },
  })

  if (!course) {
    throw new Error('دوره یافت نشد')
  }

  return course
}

/**
 * Update user's enrollment progress on a course
 */
export async function updateEnrollmentProgress(params: {
  userId: string
  courseId: string
  progressPct: number
  completed?: boolean
}) {
  const enrollment = await prisma.enrollment.upsert({
    where: {
      courseId_userId: {
        courseId: params.courseId,
        userId: params.userId,
      },
    },
    update: {
      progressPct: params.progressPct,
      status: params.completed ? 'completed' : 'active',
      completedAt: params.completed ? new Date() : undefined,
    },
    create: {
      courseId: params.courseId,
      userId: params.userId,
      progressPct: params.progressPct,
      status: params.completed ? 'completed' : 'active',
      completedAt: params.completed ? new Date() : undefined,
    },
  })

  return enrollment
}
