import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { registerSchema } from '@/server/dto/auth'
import { hashPassword } from '@/server/auth/password'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { nationalId, name, phone, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { nationalId } })
  if (existing) {
    return NextResponse.json(
      { error: 'کاربری با این کد ملی قبلاً ثبت‌نام کرده است' },
      { status: 409 },
    )
  }

  const defaultRole = await prisma.role.findUnique({
    where: { key: 'operator' },
  })
  if (!defaultRole) {
    return NextResponse.json(
      { error: 'خطای سیستمی: نقش پیش‌فرض یافت نشد' },
      { status: 500 },
    )
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      nationalId,
      name,
      phone: phone || null,
      email: email || null,
      passwordHash,
      status: 'pending',
      roleId: defaultRole.id,
    },
    select: { id: true, nationalId: true, name: true, status: true },
  })

  return NextResponse.json(
    {
      message: 'ثبت‌نام با موفقیت انجام شد. منتظر تأیید مدیر باشید.',
      user,
    },
    { status: 201 },
  )
}
