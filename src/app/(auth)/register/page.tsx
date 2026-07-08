'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Fingerprint,
  Phone,
  Mail,
  Lock,
  Train,
  Info,
  ArrowLeft,
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nationalId: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [appName, setAppName] = useState('خط‌ یار')
  const [brandColor, setBrandColor] = useState('')

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.appName) setAppName(data.data.appName)
        if (data.data?.brandColor) setBrandColor(data.data.brandColor)
      })
      .catch(() => {})
  }, [])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationalId: form.nationalId,
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در ثبت‌نام')
        return
      }

      router.push('/pending-approval')
    } catch {
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden" dir="rtl">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrL3E_mh6FZzjFwGI_YGzltX-rQHwPMP_TVSvlIkAM6IfOmJK7xqrxn1sTf5vmJC4dza7R-rntBcL5fwOTHDhcEGFUd0-MYpcDgNEDrBkrOFkGgP0oDqaJpJbygNX7cZ1NiLHAXreAnVA9dhbMpA3lOH8dvzEDx0lwiS3tkcFjyHIN16fx15covGYiK_h-9DIIARvUllvt5AsKqYCM3TcM654NV-mwRmzT465vDEckFNiHUHcytdDrUe5B1fAEokpWJQY2LTWFDSQ')",
            filter: 'brightness(0.2) contrast(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-background/85 mix-blend-multiply" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-border bg-surface-container/95 overflow-hidden shadow-2xl flex flex-col md:flex-row animate-[fadeInUp_0.6s_ease-out]">

        {/* Left Banner */}
        <div className="w-full md:w-1/3 bg-accent p-6 md:p-8 flex flex-col justify-between items-start md:items-center relative z-10 overflow-hidden border-b md:border-b-0 md:border-s border-accent/30">
          <div className="flex items-center gap-2 mb-8 md:mb-0 relative z-20">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-accent-foreground"
              style={brandColor ? { backgroundColor: brandColor } : undefined}
            >
              <Train className="size-5 text-accent" />
            </div>
            <span className="text-lg font-bold text-accent-foreground tracking-tight">{appName}</span>
          </div>

          <div className="relative z-20 mt-auto hidden md:block w-full">
            <div className="bg-accent-foreground/15 text-accent-foreground p-4 rounded-xl border border-accent-foreground/20">
              <div className="flex items-start gap-2">
                <Info className="size-4 mt-1 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold mb-1">نیاز به تایید مدیریت</h3>
                  <p className="text-[10px] leading-relaxed opacity-90">
                    ثبت نام شما پس از تایید توسط مدیر سیستم فعال خواهد شد. این فرآیند ممکن است تا ۲۴ ساعت زمان ببرد.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-2/3 p-6 md:p-8 md:ps-10 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-foreground mb-1.5">ایجاد حساب کاربری</h1>
              <p className="text-xs text-foreground-muted">لطفا اطلاعات هویتی خود را برای ثبت در سیستم وارد کنید.</p>

              {/* Mobile info banner */}
              <div className="mt-3 md:hidden bg-critical/10 text-critical p-3 rounded-lg border border-critical/20 flex gap-2 items-start text-xs">
                <Info className="size-4 shrink-0" />
                <span>ثبت نام نیازمند تایید مدیریت است.</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" aria-live="polite" className="mb-4 rounded-lg bg-critical/10 border border-critical/20 p-3 text-xs text-critical">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="name">
                    نام و نام خانوادگی <span className="text-critical">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <User className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5"
                      id="name"
                      type="text"
                      placeholder="مثال: علی رضایی"
                      autoFocus
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* National ID */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="nationalId">
                    کد پرسنلی <span className="text-critical">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <Fingerprint className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5 font-mono"
                      id="nationalId"
                      type="text"
                      placeholder="کد پرسنلی خود را وارد کنید"
                      maxLength={10}
                      value={form.nationalId}
                      onChange={(e) => update('nationalId', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="phone">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <Phone className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5 font-mono"
                      id="phone"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="email">
                    ایمیل (اختیاری)
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <Mail className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5 font-mono"
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="password">
                    رمز عبور <span className="text-critical">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <Lock className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5 font-mono"
                      id="password"
                      type="password"
                      placeholder="حداقل ۶ کاراکتر"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-foreground-muted mb-1" htmlFor="confirmPassword">
                    تکرار رمز عبور <span className="text-critical">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                      <Lock className="size-4" />
                    </span>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant text-foreground text-xs rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent block pr-10 p-2.5 font-mono"
                      id="confirmPassword"
                      type="password"
                      placeholder="تکرار رمز عبور"
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-5 mt-5 border-t border-border flex items-center justify-between">
                <Link href="/login" className="text-xs font-semibold text-foreground-muted hover:text-foreground hover:underline transition-all">
                  بازگشت به ورود
                </Link>
                <button
                  className="bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                      <span>در حال ثبت‌نام...</span>
                    </>
                  ) : (
                    <>
                      <span>ثبت نام</span>
                      <ArrowLeft className="size-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
