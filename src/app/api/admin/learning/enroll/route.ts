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
        select: { id: true, name: true, personnelCode: true }
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

// POST: Enroll users in a course (single, bulk list, or role-based)
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, deadlineDays, userId, bulkUserIds, roleKey } = body

    if (!courseId) {
      return NextResponse.json({ error: { message: 'شناسه دوره الزامی است' } }, { status: 400 })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: { message: 'دوره یافت نشد' } }, { status: 404 })
    }

    // Determine target users
    let targetUserIds: string[] = []

    if (roleKey) {
      const role = await prisma.role.findUnique({ where: { key: roleKey } })
      if (!role) {
        return NextResponse.json({ error: { message: 'نقش سازمانی یافت نشد' } }, { status: 404 })
      }
      const usersInRole = await prisma.user.findMany({
        where: { roleId: role.id, status: 'active' },
        select: { id: true }
      })
      targetUserIds = usersInRole.map(u => u.id)
    } else if (bulkUserIds && Array.isArray(bulkUserIds)) {
      targetUserIds = bulkUserIds
    } else if (userId) {
      targetUserIds = [userId]
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: { message: 'هیچ کاربری برای ثبت‌نام یافت نشد' } }, { status: 400 })
    }

    // Calculate deadline
    let deadlineAt: Date | null = null
    if (deadlineDays) {
      deadlineAt = new Date()
      deadlineAt.setDate(deadlineAt.getDate() + parseInt(deadlineDays))
    }

    let successCount = 0
    let skippedCount = 0

    // Loop through users and enroll them
    for (const targetUserId of targetUserIds) {
      try {
        // Check if enrollment already exists
        const existing = await prisma.enrollment.findUnique({
          where: { courseId_userId: { courseId, userId: targetUserId } }
        })

        if (existing) {
          skippedCount++
          continue
        }

        // Create enrollment and dispatch notification in transaction
        await prisma.$transaction([
          prisma.enrollment.create({
            data: {
              userId: targetUserId,
              courseId,
              status: 'active',
              progressPct: 0,
              deadlineAt
            }
          }),
          prisma.notification.create({
            data: {
              userId: targetUserId,
              title: 'ثبت‌نام در دوره ریلی جدید',
              body: `شما در دوره ریلی "${course.title}" ثبت‌نام شده‌اید. مهلت مطالعه: ${deadlineDays ? deadlineDays + ' روز' : 'نامحدود'}`,
              type: 'info',
              link: `/learning/courses/${course.id}`
            }
          })
        ])
        successCount++
      } catch (e) {
        skippedCount++
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        successCount,
        skippedCount,
        message: `ثبت‌نام با موفقیت انجام شد (${successCount} موفق، ${skippedCount} نادیده گرفته شد)`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
