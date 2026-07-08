import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const articleUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  body: z.string().min(5).optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  confidentialityLevel: z.string().optional(),
  relatedPostId: z.string().optional(),
})

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const { id } = await context.params
    const json = await request.json()
    const parsed = articleUpdateSchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'اطلاعات ورودی نامعتبر است', details: parsed.error.issues } }, { status: 400 })
    }

    if (parsed.data.slug) {
      const exists = await prisma.knowledgeArticle.findUnique({ where: { slug: parsed.data.slug } })
      if (exists && exists.id !== id) {
        return NextResponse.json({ error: { message: 'این نامک (Slug) متعلق به مقاله دیگری است' } }, { status: 400 })
      }
    }

    const updated = await prisma.knowledgeArticle.update({
      where: { id },
      data: parsed.data
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: { message: 'مقاله یافت نشد' } }, { status: 404 })
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const { id } = await context.params
    await prisma.knowledgeArticle.delete({ where: { id } })

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: { message: 'مقاله یافت نشد' } }, { status: 404 })
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
