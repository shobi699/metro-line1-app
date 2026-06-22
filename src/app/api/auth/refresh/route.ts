import { NextResponse } from 'next/server'
import { refreshSchema } from '@/server/dto/auth'
import { verifyRefreshToken, issueAccessToken, issueRefreshToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = refreshSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { refreshToken } = parsed.data

  const payload = await verifyRefreshToken(refreshToken).catch(() => null)
  if (!payload) {
    return NextResponse.json(
      { error: 'توکن تازه‌سازی نامعتبر یا منقضی شده' },
      { status: 401 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub! },
    include: { role: true },
  })

  if (!user || user.status !== 'active') {
    return NextResponse.json(
      { error: 'کاربر یافت نشد یا غیرفعال است' },
      { status: 401 },
    )
  }

  const newAccessToken = await issueAccessToken(
    user.id,
    user.nationalId,
    user.role.key,
  )
  const newRefreshToken = await issueRefreshToken(user.id, payload.tokenVersion)

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  })
}
