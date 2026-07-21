import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { sendOtpSchema } from '@/lib/zod/auth'
import { otpStore } from '@/server/auth/otp-store'
import { checkRateLimit } from '@/server/auth/rate-limit'

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

    const { personnelCode, phone } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        personnelCode,
        phone,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'کد پرسنلی یا شماره همراه وارد شده با اطلاعات ثبت‌شده همخوانی ندارد' },
        { status: 404 },
      )
    }

    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'حساب کاربری شما معلق شده است و امکان بازیابی رمز عبور وجود ندارد' },
        { status: 403 },
      )
    }

    if (!checkRateLimit(`otp-send:${personnelCode}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'درخواست‌های بیش از حد. لطفاً بعداً دوباره تلاش کنید' },
        { status: 429 },
      )
    }

    // Generate a 6-digit OTP code using CSPRNG
    const otpCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes TTL

    // Store via adapter (KV on Cloudflare, in-memory locally)
    await otpStore.setOtp(personnelCode, {
      code: otpCode,
      expiresAt,
      phone,
      attempts: 0,
    })

    return NextResponse.json({
      message: 'کد تایید یکبار مصرف پیامکی با موفقیت ارسال شد.',
      ...(process.env.NODE_ENV !== 'production' ? { debugOtp: otpCode } : {}),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
