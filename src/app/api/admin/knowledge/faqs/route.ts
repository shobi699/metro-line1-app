import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const faqSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
  category: z.string().optional(),
  articleId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const faqs = await prisma.knowledgeFAQ.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ data: faqs })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const json = await request.json()
    const parsed = faqSchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'اطلاعات ورودی نامعتبر است', details: parsed.error.issues } }, { status: 400 })
    }

    const faq = await prisma.knowledgeFAQ.create({
      data: parsed.data
    })

    return NextResponse.json({ data: faq }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
