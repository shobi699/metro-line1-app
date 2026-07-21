'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Phone,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Train,
  CheckCircle2,
} from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1) // 1: Send OTP, 2: Verify OTP, 3: Reset Password, 4: Success
  const [personnelCode, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [appName, setAppName] = useState('خط‌ یار')
  const [brandColor, setBrandColor] = useState('')
  const [debugOtpCode, setDebugOtpCode] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.appName) setAppName(data.data.appName)
        if (data.data?.brandColor) setBrandColor(data.data.brandColor)
      })
      .catch(() => {})
  }, [])

  // Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setDebugOtpCode('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnelCode, phone }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در ارسال کد تایید')
        return
      }

      setInfoMessage(data.message)
      if (data.debugOtp) {
        setDebugOtpCode(data.debugOtp)
      }
      setStep(2)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnelCode, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'کد تایید معتبر نیست')
        return
      }

      setResetToken(data.token)
      setStep(3)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن همخوانی ندارند')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در بازنشانی رمز عبور')
        return
      }

      setStep(4)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`خطا در اتصال به سرور: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrL3E_mh6FZzjFwGI_YGzltX-rQHwPMP_TVSvlIkAM6IfOmJK7xqrxn1sTf5vmJC4dza7R-rntBcL5fwOTHDhcEGFUd0-MYpcDgNEDrBkrOFkGgP0oDqaJpJbygNX7cZ1NiLHAXreAnVA9dhbMpA3lOH8dvzEDx0lwiS3tkcFjyHIN16fx15covGYiK_h-9DIIARvUllvt5AsKqYCM3TcM654NV-mwRmzT465vDEckFNiHUHcytdDrUe5B1fAEokpWJQY2LTWFDSQ')",
            filter: 'brightness(0.25) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-background/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Forgot Password Container */}
      <div className="relative z-10 w-full max-w-md px-6 py-12 animate-[fadeInUp_0.6s_ease-out]">
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div className="rounded-xl border border-border bg-surface-container/90 p-8 shadow-lg backdrop-blur-md">
          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div
              className="mb-2 flex size-14 items-center justify-center rounded-full shadow-md transition-transform duration-300 hover:scale-105"
              style={brandColor ? { backgroundColor: brandColor } : undefined}
            >
              <Train className="size-7 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              بازیابی رمز عبور
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
              سامانه پرسنلی {appName}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div role="alert" aria-live="polite" className="mt-4 rounded-lg border border-critical/20 bg-critical/10 p-3.5 text-xs leading-relaxed text-critical">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mt-4 rounded-lg border border-accent/20 bg-accent/10 p-3.5 text-xs leading-relaxed text-accent">
              {infoMessage}
            </div>
          )}

          {/* Step 1: Send OTP Form */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground-muted" htmlFor="personnelCode">
                  کد پرسنلی
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <Fingerprint className="size-4" />
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono text-right"
                    id="personnelCode"
                    type="text"
                    placeholder="کد پرسنلی خود را وارد کنید"
                    maxLength={10}
                    value={personnelCode}
                    onChange={(e) => setNationalId(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground-muted" htmlFor="phone">
                  شماره موبایل
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <Phone className="size-4" />
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono text-right"
                    id="phone"
                    type="text"
                    placeholder="مثال: 09123456789"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <>
                    <span>ارسال کد تایید پیامکی</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground-muted" htmlFor="code">
                  کد تایید یکبار مصرف پیامکی
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <KeyRound className="size-4" />
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono text-center tracking-widest"
                    id="code"
                    type="text"
                    placeholder="کد ۶ رقمی"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {debugOtpCode && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-center">
                  <p className="text-xs text-yellow-500">
                    کد تایید شبیه‌سازی شده جهت دیباگ سریع: <strong>{debugOtpCode}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  className="flex h-11 w-1/3 items-center justify-center gap-1 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-all hover:bg-surface-hover active:scale-[0.98]"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="size-4" />
                  <span>بازگشت</span>
                </button>
                <button
                  className="flex h-11 w-2/3 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                  ) : (
                    <span>تایید کد و ادامه</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password Form */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground-muted" htmlFor="password">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <Lock className="size-4" />
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-10 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors hover:text-foreground focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground-muted" htmlFor="confirmPassword">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <Lock className="size-4" />
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                    <span>در حال تغییر رمز...</span>
                  </>
                ) : (
                  <span>ذخیره رمز عبور جدید</span>
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success Message */}
          {step === 4 && (
            <div className="mt-6 flex flex-col items-center justify-center text-center gap-4 animate-[scaleUp_0.4s_ease-out]">
              <style>{`
                @keyframes scaleUp {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
              `}</style>
              <CheckCircle2 className="size-16 text-success" />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-foreground">
                  تغییر رمز با موفقیت انجام شد
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  رمز عبور جدید شما ثبت شد. اکنون می‌توانید با اطلاعات کاربری جدید وارد سامانه شوید.
                </p>
              </div>

              <Link
                href="/login"
                className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98]"
              >
                ورود به سامانه
              </Link>
            </div>
          )}

          {/* Login Link */}
          {step !== 4 && (
            <div className="mt-5 border-t border-border-subtle pt-5 text-center">
              <p className="text-xs font-medium text-foreground-muted">
                یا به صفحه{' '}
                <Link href="/login" className="font-bold text-accent hover:underline transition-colors">
                  ورود به سیستم
                </Link>{' '}
                بازگردید.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-foreground-muted/50">
            نسخه ۱.۱.۰ (عملیاتی)
          </p>
        </div>
      </div>
    </div>
  )
}
