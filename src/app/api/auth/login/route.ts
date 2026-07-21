import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { loginSchema } from '@/lib/zod/auth'
import { verifyPassword } from '@/server/auth/password'
import { issueAccessToken, issueRefreshToken } from '@/server/auth/jwt'
import { coercePermissions, rankForRoleKey } from '@/server/rbac/permissions'
import { checkRateLimit } from '@/server/auth/rate-limit'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { personnelCode, password } = parsed.data

    if (!checkRateLimit(`login:${personnelCode}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'تلاش‌های ورود بیش از حد. لطفاً ۱۵ دقیقه بعد دوباره تلاش کنید' },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { personnelCode },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کد پرسنلی یا رمز عبور اشتباه است', code: 'INVALID_CREDENTIALS' },
        { status: 200 },
      )
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        {
          error:
            'حساب شما هنوز تأیید نشده است. لطفاً منتظر تأیید مدیر سیستم باشید.',
          status: 'pending',
        },
        { status: 403 },
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'حساب شما معلق شده است', status: 'suspended' },
        { status: 403 },
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'کد پرسنلی یا رمز عبور اشتباه است', code: 'INVALID_CREDENTIALS' },
        { status: 200 },
      )
    }

    const permissions = coercePermissions(user.role.permissions)
    const rank = user.role.rank ?? rankForRoleKey(user.role.key)
    const accessToken = await issueAccessToken(
      user.id,
      user.personnelCode,
      user.role.key,
      rank,
      permissions,
    )
    const refreshToken = await issueRefreshToken(user.id, 0)

    prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'login',
      },
    }).catch(() => {})

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        personnelCode: user.personnelCode,
        name: user.name,
        roleKey: user.role.key,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}

