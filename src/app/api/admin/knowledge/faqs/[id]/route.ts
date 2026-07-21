import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const faqUpdateSchema = z.object({
  question: z.string().min(5).optional(),
  answer: z.string().min(5).optional(),
  category: z.string().optional(),
  articleId: z.string().optional(),
})

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const { id } = await context.params
    const json = await request.json()
    const parsed = faqUpdateSchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'اطلاعات ورودی نامعتبر است', details: parsed.error.issues } }, { status: 400 })
    }

    const updated = await prisma.knowledgeFAQ.update({
      where: { id },
      data: parsed.data
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: { message: 'سوال یافت نشد' } }, { status: 404 })
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const { id } = await context.params
    await prisma.knowledgeFAQ.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: { message: 'سوال یافت نشد' } }, { status: 404 })
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
