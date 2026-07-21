import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { submitChecklistRecordSchema } from '@/lib/zod'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)

    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get('templateId')

    const isAdmin = ['admin', 'super_admin'].includes(user.roleKey)
    
    const where: any = {}
    if (!isAdmin) {
      where.userId = user.id
    }
    if (templateId) {
      where.templateId = templateId
    }

    const records = await prisma.checklistRecord.findMany({
      where,
      include: {
        template: { select: { name: true } },
        user: { select: { name: true, customFields: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ data: records })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)

    const body = await req.json()
    const parsed = submitChecklistRecordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const data = parsed.data

    const template = await prisma.checklistTemplate.findUnique({ where: { id: data.templateId } })
    if (!template || !template.isActive) {
      return NextResponse.json({ error: { message: 'Template not found or inactive' } }, { status: 404 })
    }

    const record = await prisma.checklistRecord.create({
      data: {
        templateId: data.templateId,
        userId: user.id,
        trainId: data.trainId,
        stationId: data.stationId,
        geoLocation: data.geoLocation,
        items: data.items as any,
      }
    })

    // Optionally grant gamification points for completing a checklist
    await prisma.gamificationScore.create({
      data: {
        userId: user.id,
        points: 5,
        reason: `تکمیل چک‌لیست: ${template.name}`,
        period: new Date().toISOString().slice(0, 7) // "2026-07"
      }
    }).catch(() => { /* ignore unique constraint */ })

    return NextResponse.json({ data: record })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

