import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ruleSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  isEnabled: z.boolean(),
  severity: z.enum(['warning', 'error']),
  params: z.string().nullable().optional(),
  category: z.string(),
})

const bulkUpdateSchema = z.object({
  rules: z.array(ruleSchema)
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires admin to manage rules
  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    let rules = await prisma.rosterValidationRule.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    if (rules.length === 0) {
      const defaultRules = [
        {
          key: 'incomplete_crew',
          label: 'نقص در ترکیب خدمه قطار (عدم وجود H1 یا H2)',
          description: 'بررسی می‌کند که آیا قطارهای فعال در مسیر حتماً راننده H1 (و H2 در صورت لزوم) داشته باشند.',
          severity: 'error',
          isEnabled: true,
          category: 'crew',
          sortOrder: 1,
        },
        {
          key: 'crew_overlap',
          label: 'همپوشانی زمانی راهبران',
          description: 'بررسی می‌کند که یک راهبر به طور همزمان در دو قطار با زمان‌های تداخل داشته تخصیص داده نشده باشد.',
          severity: 'error',
          isEnabled: true,
          category: 'crew',
          sortOrder: 2,
        },
        {
          key: 'rest_time',
          label: 'حداقل زمان استراحت بین سفرها',
          description: 'حداقل زمان استراحت بین سفرها برای یک راهبر (مثلاً ۵ دقیقه) را کنترل می‌کند.',
          severity: 'warning',
          isEnabled: true,
          category: 'fatigue',
          sortOrder: 3,
          params: JSON.stringify({ minRestMinutes: 5, minInterdayRestHours: 11 }),
        },
        {
          key: 'max_driving_hours',
          label: 'حداکثر ساعت راهبری روزانه',
          description: 'مجموع ساعت رانندگی روزانه راهبر نباید از حد مجاز (مثلا ۸ ساعت) تجاوز کند.',
          severity: 'warning',
          isEnabled: true,
          category: 'fatigue',
          sortOrder: 4,
          params: JSON.stringify({ maxHours: 8, maxConsecutiveTrips: 4 }),
        },
        {
          key: 'invalid_personnel_no',
          label: 'صحت کد پرسنلی / پرسنلی راهبران',
          description: 'کد پرسنلی راهبران تخصیص یافته باید دقیقاً ۱۰ رقم عددی باشد.',
          severity: 'error',
          isEnabled: true,
          category: 'general',
          sortOrder: 5,
        },
        {
          key: 'inactive_driver',
          label: 'تخصیص راهبر غیرفعال',
          description: 'بررسی می‌کند که راهبر تخصیص داده شده در وضعیت فعال (Active) باشد.',
          severity: 'error',
          isEnabled: true,
          category: 'general',
          sortOrder: 6,
        },
        {
          key: 'chronological_order',
          label: 'صعودی بودن زمان اعزام قطارها',
          description: 'بررسی می‌کند که زمان اعزام قطارها بر اساس شماره ردیف صعودی باشد.',
          severity: 'warning',
          isEnabled: true,
          category: 'time',
          sortOrder: 7,
        }
      ]

      await prisma.rosterValidationRule.createMany({
        data: defaultRules
      })

      rules = await prisma.rosterValidationRule.findMany({
        orderBy: { sortOrder: 'asc' }
      })
    }

    return NextResponse.json({ data: rules })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت قواعد اعتبارسنجی', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
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
        await tx.rosterValidationRule.update({
          where: { id: rule.id },
          data: {
            isEnabled: rule.isEnabled,
            severity: rule.severity,
            params: rule.params,
          }
        })
      }
      
      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'RosterValidationRule',
          entityId: 'BULK_UPDATE',
          action: 'update',
          after: { count: rules.length }
        }
      })
    })

    return NextResponse.json({ message: 'قواعد با موفقیت به‌روزرسانی شدند' })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ذخیره قواعد اعتبارسنجی', details: error.message },
      { status: 500 }
    )
  }
}
