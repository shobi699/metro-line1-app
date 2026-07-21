import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const courses = await prisma.course.findMany({
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
        exams: true
      }
    })
    return NextResponse.json({ data: courses })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      key,
      title,
      category,
      description,
      coverUrl,
      passScore,
      recurrenceMonths,
      estMinutes,
      audience,
      status
    } = body

    if (!key || !title) {
      return NextResponse.json({ error: { message: 'کلید و عنوان دوره اجباری هستند' } }, { status: 400 })
    }

    // Check if key already exists
    const existing = await prisma.course.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json({ error: { message: 'دوره با این کلید قبلاً ثبت شده است' } }, { status: 400 })
    }

    // Find highest sortOrder and add 1
    const highestSort = await prisma.course.findFirst({
      orderBy: { sortOrder: 'desc' }
    })
    const sortOrder = highestSort ? highestSort.sortOrder + 1 : 1

    const course = await prisma.course.create({
      data: {
        key,
        title,
        category: category || 'عمومی',
        description: description || '',
        coverUrl: coverUrl || '',
        passScore: passScore ? parseInt(passScore) : 70,
        recurrenceMonths: recurrenceMonths ? parseInt(recurrenceMonths) : 12,
        estMinutes: estMinutes ? parseInt(estMinutes) : 30,
        audience: audience || '',
        status: status || 'draft',
        mandatoryFor: body.mandatoryFor || '',
        sortOrder,
        createdBy: user.personnelCode || 'admin'
      }
    })

    // Auto-create default final exam with custom configs
    await prisma.exam.create({
      data: {
        courseId: course.id,
        title: `آزمون پایانی ${course.title}`,
        drawRules: JSON.stringify({ category: course.category }),
        questionCount: body.examQuestionCount ? parseInt(body.examQuestionCount) : 10,
        durationMin: body.examDurationMin ? parseInt(body.examDurationMin) : 20,
        passScore: course.passScore,
        maxAttempts: body.examMaxAttempts ? parseInt(body.examMaxAttempts) : 3,
        cooldownHrs: body.examCooldownHrs ? parseInt(body.examCooldownHrs) : 24,
        shuffle: true,
        showAnswers: 'after_pass'
      }
    })

    return NextResponse.json({ data: course })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
