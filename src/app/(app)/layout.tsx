'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { Sidebar, MobileHeader } from '@/components/shared/sidebar'
import { MobileBottomNav } from '@/components/shared/mobile-bottom-nav'
import { BulletinGuard } from '@/components/shared/bulletin-guard'
import { AlertTriangle, X, ShieldAlert } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)
  const [hydrated, setHydrated] = useState(false)

  const [config, setConfig] = useState<{
    maintenanceMode?: boolean
    systemNotice?: string
  } | null>(null)
  const [showNotice, setShowNotice] = useState(true)

  // منتظر ماندن برای لود شدن وضعیت احراز هویت از LocalStorage
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => {
        setHydrated(true)
      })
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated || !accessToken || !refreshToken) {
      router.push('/login')
      return
    }

    async function checkAndRefreshToken() {
      const token = useAuthStore.getState().accessToken
      const refreshTok = useAuthStore.getState().refreshToken
      if (!token || !refreshTok) return

      try {
        const payloadBase64 = token.split('.')[1]
        // Decode base64 unicode properly
        const decoded = JSON.parse(atob(payloadBase64))
        const exp = decoded.exp
        
        // If expired or expiring in less than 60 seconds, refresh it
        if (exp && (Date.now() / 1000) >= exp - 60) {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTok }),
          })

          if (res.ok) {
            const data = await res.json()
            if (data.accessToken && data.refreshToken) {
              setAuth(
                useAuthStore.getState().user!,
                data.accessToken,
                data.refreshToken
              )
            }
          } else {
            // Refresh failed (refresh token expired/revoked) -> logout
            logout()
            router.push('/login')
          }
        }
      } catch (err) {
        console.error('Error checking/refreshing token:', err)
      }
    }

    async function fetchConfig() {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const data = await res.json()
          setConfig(data.data)
        }
      } catch {}
    }

    void checkAndRefreshToken()
    void fetchConfig()

    const interval = setInterval(() => {
      void checkAndRefreshToken()
    }, 30000) // check every 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, accessToken, refreshToken, router, hydrated])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
          <span className="text-xs text-foreground-muted">در حال بازخوانی نشست کاربری...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  // Check Maintenance Mode
  const isUserAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'
  const isMaintenanceActive = config?.maintenanceMode === true && !isUserAdmin

  if (isMaintenanceActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center" dir="rtl">
        <div className="w-full max-w-md rounded-lg border border-critical/30 bg-surface-container-low/40 backdrop-blur-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-[3px] w-full bg-gradient-to-l from-critical via-transparent to-critical" />
          <div className="flex flex-col items-center gap-3 text-critical">
            <ShieldAlert className="size-12 animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">عملیات اورهال و نگهداری سامانه</h1>
          </div>
          
          <p className="text-xs text-foreground-muted leading-relaxed">
            سامانه سیر و حرکت خط ۱ مترو تهران هم‌اکنون به دلیل انجام عملیات ارتقای فنی و نگهداری دوره‌ای موقتاً خارج از دسترس پرسنل عادی قرار دارد.
          </p>

          <div className="bg-critical/5 border border-critical/15 p-4 rounded-lg text-xs text-critical">
            ⚠️ زمان تخمینی بازگشت به شرایط عادی متعاقباً از طریق بی‌سیم یا ابلاغیه‌های حضوری اعلام خواهد شد.
          </div>

          <div className="text-[10px] text-foreground-muted font-mono tracking-wider">
            SYSTEM MAINTENANCE MODE ACTIVE
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      {/* Global System Notice Banner */}
      {config?.systemNotice && showNotice && (
        <div className="relative w-full bg-critical/10 border-b border-critical/20 text-critical text-xs px-4 py-2 flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 animate-bounce" />
            <span className="font-semibold text-foreground-muted">اعلان سراسری مرکز فرمان:</span>
            <span className="font-medium text-foreground">{config.systemNotice}</span>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-foreground-muted hover:text-critical p-1 rounded hover:bg-critical/5 transition-colors cursor-pointer shrink-0"
            title="بستن اعلان"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-1">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
        >
          پرش به محتوا
        </a>
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col min-w-0">
          <MobileHeader />
          <main id="main-content" className="flex flex-1 flex-col pb-14 md:pb-0 min-w-0 w-full">
            <BulletinGuard>{children}</BulletinGuard>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </div>
  )
}
