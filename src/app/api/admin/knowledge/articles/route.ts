import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { z } from 'zod'

const articleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  body: z.string().min(5),
  category: z.string().optional(),
  tags: z.string().optional(),
  confidentialityLevel: z.string().default('internal'),
  relatedPostId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'knowledge:read') // fallback to generic
    // We will just require admin access for now if the specific permission isn't strictly defined
    const adminErr = requirePermission(user, 'users:read') 
    // Wait, let's just use user.rank check or just check if they are logged in since they are hitting /admin/
    // We'll enforce a generic admin requirement:
    if (user.rank < 50) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const articles = await prisma.knowledgeArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true } } }
    })
    
    return NextResponse.json({ data: articles })
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
    const parsed = articleSchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: { message: 'اطلاعات ورودی نامعتبر است', details: parsed.error.issues } }, { status: 400 })
    }

    const exists = await prisma.knowledgeArticle.findUnique({ where: { slug: parsed.data.slug } })
    if (exists) {
      return NextResponse.json({ error: { message: 'این نامک (Slug) تکراری است' } }, { status: 400 })
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        body: parsed.data.body,
        category: parsed.data.category,
        tags: parsed.data.tags,
        confidentialityLevel: parsed.data.confidentialityLevel,
        relatedPostId: parsed.data.relatedPostId,
        authorId: user.id
      }
    })

    return NextResponse.json({ data: article }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
