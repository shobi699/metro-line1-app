import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser } from '@/server/rbac/guard'

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 401 })

    if (user.roleKey !== 'super_admin' && user.roleKey !== 'admin') {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    const { id } = await props.params
    const body = await request.json()

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: { message: 'عنوان و اسلاگ الزامی هستند' } }, { status: 400 })
    }

    const updated = await prisma.contentCategory.update({
      where: { id },
      data: {
        label: body.title,
        key: body.slug,
        type: body.description || null,
        color: body.color || 'zinc',
      }
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: { message: 'دسته‌بندی یافت نشد' } }, { status: 404 })
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: { message: 'این عنوان یا اسلاگ تکراری است' } }, { status: 400 })
    }
    return NextResponse.json({ error: { message: err?.message || 'خطا در بروزرسانی دسته‌بندی' } }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 401 })

    if (user.roleKey !== 'super_admin' && user.roleKey !== 'admin') {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    const { id } = await props.params

    await prisma.contentCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: { message: 'دسته‌بندی یافت نشد' } }, { status: 404 })
    }
    return NextResponse.json({ error: { message: err?.message || 'خطا در حذف دسته‌بندی' } }, { status: 500 })
  }
}
