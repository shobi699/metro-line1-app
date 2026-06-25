import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { sendOtpSchema } from '@/server/dto/auth'
import { otps } from '@/server/auth/otp-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = sendOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      )
    }

    const { nationalId, phone } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        nationalId,
        phone,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کد ملی یا شماره همراه وارد شده با اطلاعات ثبت‌شده همخوانی ندارد' },
        { status: 404 },
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'حساب کاربری شما معلق شده است و امکان بازیابی رمز عبور وجود ندارد' },
        { status: 403 },
      )
    }

    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes TTL

    // Store in global memory map
    otps.set(nationalId, {
      code: otpCode,
      expiresAt,
      phone,
    })

    return NextResponse.json({
      message: 'کد تایید یکبار مصرف پیامکی با موفقیت ارسال شد.',
      debugOtp: otpCode, // For testing purposes
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
