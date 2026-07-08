import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const amendmentRuleSchema = z.object({
  id: z.string(),
  amendmentKind: z.string(),
  requireApproval: z.boolean(),
  approverRoleKey: z.string().nullable().optional(),
  maxHoursAfterPublish: z.number().nullable().optional(),
  standardReasons: z.string().nullable().optional(), // Expected JSON array
})

const bulkUpdateSchema = z.object({
  rules: z.array(amendmentRuleSchema)
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    let rules = await prisma.rosterAmendmentRule.findMany({
      orderBy: { amendmentKind: 'asc' }
    })

    if (rules.length === 0) {
      const defaultKinds = [
        { key: 'trip_time', label: 'تغییر ساعت سفر', requireApproval: true, maxHoursAfterPublish: 24 },
        { key: 'trip_status', label: 'تغییر وضعیت سفر', requireApproval: true, maxHoursAfterPublish: 24 },
        { key: 'crew_replace', label: 'جابجایی هم‌خدمه', requireApproval: true, maxHoursAfterPublish: 48 },
        { key: 'crew_add', label: 'افزودن هم‌خدمه', requireApproval: true, maxHoursAfterPublish: 48 },
        { key: 'crew_remove', label: 'حذف هم‌خدمه', requireApproval: true, maxHoursAfterPublish: 48 },
        { key: 'trip_add', label: 'افزودن سفر جدید', requireApproval: true, maxHoursAfterPublish: 12 },
        { key: 'trip_remove', label: 'حذف سفر', requireApproval: true, maxHoursAfterPublish: 12 },
        { key: 'note', label: 'افزودن/تغییر یادداشت عملیاتی', requireApproval: false, maxHoursAfterPublish: null },
      ]

      const defaultRules = defaultKinds.map(kind => ({
        amendmentKind: kind.key,
        requireApproval: kind.requireApproval,
        approverRoleKey: 'admin',
        maxHoursAfterPublish: kind.maxHoursAfterPublish,
        standardReasons: JSON.stringify(["خطای انسانی", "تغییر برنامه قطار", "درخواست مرخصی اورژانسی", "نقص فنی قطار"])
      }))

      await prisma.rosterAmendmentRule.createMany({
        data: defaultRules
      })

      rules = await prisma.rosterAmendmentRule.findMany({
        orderBy: { amendmentKind: 'asc' }
      })
    }

    return NextResponse.json({ data: rules })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت قواعد اصلاحیه', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = bulkUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'اطلاعات ارسالی نامعتبر است', details: parsed.error }, { status: 400 })
    }

    const { rules } = parsed.data

    await prisma.$transaction(async (tx) => {
      for (const rule of rules) {
        if (rule.id.startsWith('new-')) {
          await tx.rosterAmendmentRule.create({
            data: {
              amendmentKind: rule.amendmentKind,
              requireApproval: rule.requireApproval,
              approverRoleKey: rule.approverRoleKey,
              maxHoursAfterPublish: rule.maxHoursAfterPublish,
              standardReasons: rule.standardReasons,
            }
          })
        } else {
          await tx.rosterAmendmentRule.update({
            where: { id: rule.id },
            data: {
              requireApproval: rule.requireApproval,
              approverRoleKey: rule.approverRoleKey,
              maxHoursAfterPublish: rule.maxHoursAfterPublish,
              standardReasons: rule.standardReasons,
            }
          })
        }
      }
      
      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'RosterAmendmentRule',
          entityId: 'BULK_UPDATE',
          action: 'update',
          after: { count: rules.length }
        }
      })
    })

    return NextResponse.json({ message: 'قواعد اصلاحیه با موفقیت به‌روزرسانی شدند' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ذخیره قواعد اصلاحیه', details: error.message },
      { status: 500 }
    )
  }
}
