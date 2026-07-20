import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { replyToFeedback } from '@/server/modules/feedback/service'
import { prisma } from '@/server/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { reply, isPublicIdea, scoreValue } = body

  if (reply === undefined && isPublicIdea === undefined && scoreValue === undefined) {
    return NextResponse.json({ error: 'حداقل یکی از مقادیر پاسخ، انتشار عمومی یا امتیاز ارزیابی الزامی است' }, { status: 400 })
  }

  if (isPublicIdea !== undefined) {
    await prisma.feedback.update({
      where: { id },
      data: { isPublicIdea: !!isPublicIdea },
    })

    await prisma.feedbackLog.create({
      data: {
        feedbackId: id,
        actorId: user.id,
        action: 'isPublicIdea_changed',
        detail: JSON.stringify({ isPublicIdea }),
      },
    })
  }

  if (scoreValue !== undefined) {
    const feedback = await prisma.feedback.findUnique({
      where: { id }
    })

    if (feedback) {
      // Save/update score value in the feedback's JSON formData
      const currentFormData = (feedback.formData as object) || {}
      const updatedFormData = {
        ...currentFormData,
        managerScore: Number(scoreValue)
      }

      await prisma.feedback.update({
        where: { id },
        data: {
          formData: updatedFormData
        }
      })

      // Create PerformanceLog if user is present (non-anonymous)
      if (feedback.userId) {
        // Ensure competency innovation exists
        await prisma.competency.upsert({
          where: { id: 'innovation' },
          update: {},
          create: {
            id: 'innovation',
            name: 'نوآوری',
            weight: 1.5,
            direction: 'positive'
          }
        })

        // Ensure action type a_idea_evaluate exists
        await prisma.performanceActionType.upsert({
          where: { id: 'a_idea_evaluate' },
          update: {},
          create: {
            id: 'a_idea_evaluate',
            competencyId: 'innovation',
            title: 'ارزیابی ایده توسط مدیر',
            defaultScore: 10,
            maxSeverity: 'L1'
          }
        })

        // Calculate periodId
        const periodId = (() => {
          const d = new Date()
          try {
            const { getCurrentPeriodId } = require('../../../../../server/modules/performance/service')
            return getCurrentPeriodId()
          } catch {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          }
        })()

        // Create the performance log
        await prisma.performanceLog.create({
          data: {
            employeeId: feedback.userId,
            recordedById: user.id, // Recorded by this admin/manager
            actionTypeId: 'a_idea_evaluate',
            severity: 'L1',
            scoreValue: Number(scoreValue),
            note: `امتیاز ارزیابی ایده: ${feedback.title}`,
            periodId,
            status: 'active',
          }
        })
      }
    }
  }

  if (reply !== undefined) {
    if (!reply) {
      return NextResponse.json({ error: 'متن پاسخ الزامی است' }, { status: 400 })
    }
    await replyToFeedback(id, user.id, reply)
  }

  return NextResponse.json({ data: { success: true } })
}
