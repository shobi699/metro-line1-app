import { NextResponse } from 'next/server'
import { verifyOtpSchema } from '@/lib/zod/auth'
import { otpStore } from '@/server/auth/otp-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = verifyOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { personnelCode, code } = parsed.data

    const otpData = await otpStore.getOtp(personnelCode)

    if (!otpData) {
      return NextResponse.json(
        { error: 'کد تایید معتبری برای این کد پرسنلی درخواست نشده یا منقضی شده است' },
        { status: 400 },
      )
    }

    if (otpData.expiresAt < Date.now()) {
      await otpStore.deleteOtp(personnelCode)
      return NextResponse.json(
        { error: 'کد تایید منقضی شده است. لطفا مجددا تلاش کنید' },
        { status: 400 },
      )
    }

    if ((otpData.attempts ?? 0) >= 5) {
      await otpStore.deleteOtp(personnelCode)
      return NextResponse.json(
        { error: 'تعداد تلاش‌های مجاز به پایان رسید. کد جدید درخواست کنید' },
        { status: 429 },
      )
    }

    if (otpData.code !== code) {
      await otpStore.setOtp(personnelCode, { ...otpData, attempts: (otpData.attempts ?? 0) + 1 })
      return NextResponse.json(
        { error: 'کد تایید وارد شده اشتباه است' },
        { status: 400 },
      )
    }

    // OTP is verified. Remove from store
    await otpStore.deleteOtp(personnelCode)

    // Generate a temporary secure token for password resetting
    const resetToken = crypto.randomUUID()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity

    // Store the reset token
    await otpStore.setReset(resetToken, {
      personnelCode,
      expiresAt,
    })

    return NextResponse.json({
      message: 'کد تایید با موفقیت تایید شد.',
      token: resetToken,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
