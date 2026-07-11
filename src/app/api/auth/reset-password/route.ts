import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { resetPasswordSchema } from '@/lib/zod/auth'
import { otpStore } from '@/server/auth/otp-store'
import { hashPassword } from '@/server/auth/password'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { token, password } = parsed.data

    const tokenData = await otpStore.getReset(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'توکن بازنشانی نامعتبر یا منقضی شده است' },
        { status: 400 },
      )
    }

    if (tokenData.expiresAt < Date.now()) {
      await otpStore.deleteReset(token)
      return NextResponse.json(
        { error: 'توکن بازنشانی منقضی شده است. لطفا دوباره مراحل بازیابی را آغاز کنید' },
        { status: 400 },
      )
    }

    const { personnelCode } = tokenData

    // Find the user to reset password for
    const user = await prisma.user.findUnique({
      where: { personnelCode },
    })

    if (!user) {
      await otpStore.deleteReset(token)
      return NextResponse.json(
        { error: 'کاربر مورد نظر یافت نشد' },
        { status: 404 },
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    // Update password in database
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      })

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'User',
          entityId: user.id,
          action: 'update',
          after: {
            reason: 'Password reset via OTP verification',
          },
        },
      })
    })

    // Consume the token
    await otpStore.deleteReset(token)

    return NextResponse.json({
      success: true,
      message: 'رمز عبور شما با موفقیت بازنشانی شد. اکنون می‌توانید با رمز عبور جدید وارد شوید.',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
