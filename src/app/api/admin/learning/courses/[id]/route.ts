import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { id } = await params

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

    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { message: 'دوره یافت نشد' } }, { status: 404 })
    }

    // Check if key is changing and is unique
    if (key && key !== existing.key) {
      const keyDuplicate = await prisma.course.findUnique({ where: { key } })
      if (keyDuplicate) {
        return NextResponse.json({ error: { message: 'دوره دیگری با این کلید وجود دارد' } }, { status: 400 })
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        key: key || undefined,
        title: title || undefined,
        category: category !== undefined ? category : undefined,
        description: description !== undefined ? description : undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
        passScore: passScore !== undefined ? parseInt(passScore) : undefined,
        recurrenceMonths: recurrenceMonths !== undefined ? parseInt(recurrenceMonths) : undefined,
        estMinutes: estMinutes !== undefined ? parseInt(estMinutes) : undefined,
        audience: audience !== undefined ? audience : undefined,
        status: status || undefined,
        mandatoryFor: body.mandatoryFor !== undefined ? body.mandatoryFor : undefined,
      }
    })

    // Also update attached final exam settings if provided
    const finalExam = await prisma.exam.findFirst({ where: { courseId: id } })
    if (finalExam) {
      await prisma.exam.update({
        where: { id: finalExam.id },
        data: {
          questionCount: body.examQuestionCount !== undefined ? parseInt(body.examQuestionCount) : undefined,
          durationMin: body.examDurationMin !== undefined ? parseInt(body.examDurationMin) : undefined,
          passScore: passScore !== undefined ? parseInt(passScore) : undefined,
          maxAttempts: body.examMaxAttempts !== undefined ? parseInt(body.examMaxAttempts) : undefined,
          cooldownHrs: body.examCooldownHrs !== undefined ? parseInt(body.examCooldownHrs) : undefined,
        }
      })
    } else if (passScore !== undefined) {
      await prisma.exam.updateMany({
        where: { courseId: id },
        data: { passScore: parseInt(passScore) }
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { message: 'دوره یافت نشد' } }, { status: 404 })
    }

    // Cascade constraints on schema handle deletions of chapters/lessons/exams
    await prisma.course.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'دوره با موفقیت حذف شد' })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
