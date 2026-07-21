import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const mappingSchema = z.object({
  block: z.enum(['RIGHT', 'LEFT']),
  rowNoIndex: z.number().int().min(0),
  trainNumberIndex: z.number().int().min(0),
  rIndex: z.number().int().min(0),
  tIndex: z.number().int().min(0),
  h1Index: z.number().int().min(0),
  assistantTIndex: z.number().int().min(0),
  assistantRIndex: z.number().int().min(0),
  h2Index: z.number().int().min(0),
  departureTimeIndex: z.number().int().min(0),
  arrivalTimeIndex: z.number().int().min(0),
})

const templateCreateSchema = z.object({
  name: z.string().min(1, 'نام الگو الزامی است'),
  description: z.string().nullable().optional(),
  sourceType: z.enum(['EXCEL', 'PDF']).default('EXCEL'),
  rightMapping: mappingSchema.optional().nullable(),
  leftMapping: mappingSchema.optional().nullable(),
  pageWidth: z.number().int().optional().nullable(),
  pageHeight: z.number().int().optional().nullable(),
  rightBlock: z.any().optional().nullable(),
  leftBlock: z.any().optional().nullable(),
  headerZones: z.any().optional().nullable(),
  pdfColumns: z.any().optional().nullable(),
})

const DEFAULT_RIGHT_MAPPING = {
  block: 'RIGHT',
  rowNoIndex: 0,
  trainNumberIndex: 1,
  rIndex: 2,
  tIndex: 3,
  h1Index: 4,
  assistantTIndex: 5,
  assistantRIndex: 6,
  h2Index: 7,
  departureTimeIndex: 8,
  arrivalTimeIndex: 9,
}

const DEFAULT_LEFT_MAPPING = {
  block: 'LEFT',
  rowNoIndex: 10,
  trainNumberIndex: 11,
  rIndex: 12,
  tIndex: 13,
  h1Index: 14,
  assistantTIndex: 15,
  assistantRIndex: 16,
  h2Index: 17,
  departureTimeIndex: 18,
  arrivalTimeIndex: 19,
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    let templates = await prisma.rosterTemplate.findMany({
      orderBy: { createdAt: 'asc' }
    })

    // Auto-seed default template if empty
    if (templates.length === 0) {
      const defaultTpl = await prisma.rosterTemplate.create({
        data: {
          name: 'الگوی استاندارد خط ۱',
          description: 'الگوی پیش‌فرض استخراج لوحه دوطرفه ۲۱ ستونه مترو تهران خط ۱',
          sourceType: 'EXCEL',
          rightMapping: DEFAULT_RIGHT_MAPPING,
          leftMapping: DEFAULT_LEFT_MAPPING,
          isActive: true
        }
      })
      templates = [defaultTpl]
    }

    return NextResponse.json({ data: templates })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت الگوها: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = templateCreateSchema.parse(body)

    const template = await prisma.rosterTemplate.upsert({
      where: { name: parsed.name },
      update: {
        description: parsed.description,
        sourceType: parsed.sourceType,
        rightMapping: parsed.rightMapping ?? undefined,
        leftMapping: parsed.leftMapping ?? undefined,
        pageWidth: parsed.pageWidth,
        pageHeight: parsed.pageHeight,
        rightBlock: parsed.rightBlock ?? undefined,
        leftBlock: parsed.leftBlock ?? undefined,
        headerZones: parsed.headerZones ?? undefined,
        pdfColumns: parsed.pdfColumns ?? undefined,
      },
      create: {
        name: parsed.name,
        description: parsed.description,
        sourceType: parsed.sourceType,
        rightMapping: parsed.rightMapping ?? undefined,
        leftMapping: parsed.leftMapping ?? undefined,
        pageWidth: parsed.pageWidth,
        pageHeight: parsed.pageHeight,
        rightBlock: parsed.rightBlock ?? undefined,
        leftBlock: parsed.leftBlock ?? undefined,
        headerZones: parsed.headerZones ?? undefined,
        pdfColumns: parsed.pdfColumns ?? undefined,
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'RosterTemplate',
        entityId: template.id,
        action: 'create',
        after: parsed
      }
    })

    return NextResponse.json({
      success: true,
      message: 'الگوی نگاشت با موفقیت ذخیره شد.',
      data: template
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'خطا در اعتبارسنجی داده‌ها' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'خطا در ذخیره‌سازی الگو: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
