'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import {
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  LogIn,
  Train,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [personnelCode, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [appName, setAppName] = useState('خط‌ یار')
  const [brandColor, setBrandColor] = useState('')
  const [allowRegistration, setAllowRegistration] = useState(true)
  const [appLogoUrl, setAppLogoUrl] = useState('/logo.png')
  const [authBackgroundUrl, setAuthBackgroundUrl] = useState('')
  const [authWelcomeText, setAuthWelcomeText] = useState('سیستم مدیریت یکپارچه مترو')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.appName) setAppName(data.data.appName)
        if (data.data?.brandColor) setBrandColor(data.data.brandColor)
        if (data.data?.allowRegistration !== undefined) setAllowRegistration(data.data.allowRegistration)
        if (data.data?.appLogoUrl) setAppLogoUrl(data.data.appLogoUrl)
        if (data.data?.authBackgroundUrl) setAuthBackgroundUrl(data.data.authBackgroundUrl)
        if (data.data?.authWelcomeText) setAuthWelcomeText(data.data.authWelcomeText)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personnelCode, password }),
      })

      let data
      const responseText = await res.text()
      try {
        data = JSON.parse(responseText)
      } catch {
        setError(`خطای سرور (${res.status}): ${responseText.substring(0, 150)}`)
        return
      }

      if (!res.ok) {
        setError(data.error || 'خطای ورود به سیستم')
        return
      }

      setAuth(data.user, data.accessToken, data.refreshToken)
      router.push('/dashboard')
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
            backgroundImage: `url('${authBackgroundUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBrL3E_mh6FZzjFwGI_YGzltX-rQHwPMP_TVSvlIkAM6IfOmJK7xqrxn1sTf5vmJC4dza7R-rntBcL5fwOTHDhcEGFUd0-MYpcDgNEDrBkrOFkGgP0oDqaJpJbygNX7cZ1NiLHAXreAnVA9dhbMpA3lOH8dvzEDx0lwiS3tkcFjyHIN16fx15covGYiK_h-9DIIARvUllvt5AsKqYCM3TcM654NV-mwRmzT465vDEckFNiHUHcytdDrUe5B1fAEokpWJQY2LTWFDSQ"}')`,
            filter: 'brightness(0.25) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-background/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Login Container */}
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
              className="mb-2 flex size-14 items-center justify-center rounded-full shadow-md transition-transform duration-300 hover:scale-105 overflow-hidden bg-background"
            >
              <img src={appLogoUrl || "/logo.png"} className="size-11 object-contain" alt="Logo" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {appName}
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
              {authWelcomeText}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" aria-live="polite" className="mt-4 rounded-lg border border-critical/20 bg-critical/10 p-3.5 text-xs leading-relaxed text-critical">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {/* National ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground-muted" htmlFor="personnelCode">
                کد پرسنلی
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <Fingerprint className="size-4" />
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background pe-10 ps-3 text-sm text-foreground transition-colors placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  id="personnelCode"
                  type="text"
                  placeholder="کد پرسنلی خود را وارد کنید"
                  maxLength={10}
                  autoFocus
                  value={personnelCode}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground-muted" htmlFor="password">
                رمز عبور
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

            {/* Forgot Password */}
            <div className="flex justify-start">
              <Link
                href="/forgot-password"
                className="text-xs text-accent hover:underline transition-colors"
              >
                رمز عبور خود را فراموش کرده‌اید؟
              </Link>
            </div>

            {/* Submit */}
            <button
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-foreground transition-all hover:bg-accent-hover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                  <span>در حال ورود...</span>
                </>
              ) : (
                <>
                  <span>ورود به سیستم</span>
                  <LogIn className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          {allowRegistration && (
            <div className="mt-5 border-t border-border-subtle pt-5 text-center">
              <p className="text-xs font-medium text-foreground-muted">
                حساب کاربری ندارید؟{' '}
                <Link href="/register" className="font-bold text-accent hover:underline transition-colors">
                  ثبت نام کنید
                </Link>
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
