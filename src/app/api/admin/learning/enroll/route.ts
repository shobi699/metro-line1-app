import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'
import { z } from 'zod'

const enrollSchema = z.object({
  userId: z.string().cuid().or(z.string().uuid()),
  courseId: z.string().cuid(),
  deadlineDays: z.number().int().positive().optional()
})

// GET: Fetch users and courses for enrollment dropdowns
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const [users, courses] = await Promise.all([
      prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, nationalId: true }
      }),
      prisma.course.findMany({
        select: { id: true, title: true, key: true }
      })
    ])

    return NextResponse.json({ data: { users, courses } })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

// POST: Enroll a user in a course
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const body = await request.json()
    const parsed = enrollSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'ورودی‌های نامعتبر', details: parsed.error.format() } }, { status: 400 })
    }

    const { userId, courseId, deadlineDays } = parsed.data

    // Check if user and course exist
    const [targetUser, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } })
    ])

    if (!targetUser) return NextResponse.json({ error: { message: 'کاربر یافت نشد' } }, { status: 404 })
    if (!course) return NextResponse.json({ error: { message: 'دوره یافت نشد' } }, { status: 404 })

    // Check if enrollment already exists
    const existing = await prisma.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } }
    })

    if (existing) {
      return NextResponse.json({ error: { message: 'این کاربر قبلاً در این دوره ثبت‌نام شده است' } }, { status: 400 })
    }

    // Calculate deadline
    let deadlineAt: Date | null = null
    if (deadlineDays) {
      deadlineAt = new Date()
      deadlineAt.setDate(deadlineAt.getDate() + deadlineDays)
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'active',
        progressPct: 0,
        deadlineAt
      },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } }
      }
    })

    return NextResponse.json({ data: enrollment })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
