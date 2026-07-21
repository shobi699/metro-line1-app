import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole } from '@/server/rbac/guard'

export async function GET() {
  try {
    const categories = await prisma.contentCategory.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ data: categories })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در دریافت دسته‌بندی‌ها' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 401 })
    
    if (user.roleKey !== 'super_admin' && user.roleKey !== 'admin') {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    const body = await request.json()
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: { message: 'عنوان و اسلاگ الزامی هستند' } }, { status: 400 })
    }

    const category = await prisma.contentCategory.create({
      data: {
        label: body.title,
        key: body.slug,
        type: body.description || null,
        color: body.color || 'zinc',
      }
    })

    return NextResponse.json({ data: category })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: { message: 'این عنوان یا اسلاگ تکراری است' } }, { status: 400 })
    }
    return NextResponse.json({ error: { message: err?.message || 'خطا در ایجاد دسته‌بندی' } }, { status: 500 })
  }
}
