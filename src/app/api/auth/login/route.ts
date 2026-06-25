import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { loginSchema } from '@/server/dto/auth'
import { verifyPassword } from '@/server/auth/password'
import { issueAccessToken, issueRefreshToken } from '@/server/auth/jwt'
import { coercePermissions, rankForRoleKey } from '@/server/rbac/permissions'

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

    const { nationalId, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { nationalId },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کد ملی یا رمز عبور اشتباه است' },
        { status: 401 },
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
        { error: 'کد ملی یا رمز عبور اشتباه است' },
        { status: 401 },
      )
    }

    const permissions = coercePermissions(user.role.permissions)
    const rank = user.role.rank ?? rankForRoleKey(user.role.key)
    const accessToken = await issueAccessToken(
      user.id,
      user.nationalId,
      user.role.key,
      rank,
      permissions,
    )
    const refreshToken = await issueRefreshToken(user.id, 0)

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'User',
        entityId: user.id,
        action: 'login',
      },
    })

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nationalId: user.nationalId,
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
