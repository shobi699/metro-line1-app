import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { registerSchema } from '@/lib/zod/auth'
import { hashPassword } from '@/server/auth/password'
import { getSettingValue } from '@/server/modules/settings/service'

export async function POST(request: Request) {
  const allowRegistration = await getSettingValue('general.allowRegistration', true)
  if (!allowRegistration) {
    return NextResponse.json(
      { error: 'ثبت‌نام مستقیم پرسنل در حال حاضر غیرفعال است.' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { nationalId, name, phone, email, password } = parsed.data

  const passwordPolicyMinLength = await getSettingValue('general.passwordPolicyMinLength', 8)
  if (password.length < passwordPolicyMinLength) {
    return NextResponse.json(
      { error: `کلمه عبور باید حداقل ${passwordPolicyMinLength} نویسه باشد.` },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { nationalId } })
  if (existing) {
    return NextResponse.json(
      { error: 'کاربری با این کد پرسنلی قبلاً ثبت‌نام کرده است' },
      { status: 409 },
    )
  }

  let defaultRole = await prisma.role.findUnique({
    where: { key: 'operator' },
  })
  if (!defaultRole) {
    const { seedDatabase } = await import('@/server/db-seed')
    await seedDatabase(prisma, true)
    defaultRole = await prisma.role.findUnique({
      where: { key: 'operator' },
    })
  }
  if (!defaultRole) {
    const allRoles = await prisma.role.findMany()
    return NextResponse.json(
      { error: `خطای سیستمی: نقش پیش‌فرض یافت نشد. نقش‌های موجود: ${JSON.stringify(allRoles)}` },
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
