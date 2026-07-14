'use client'

import { useState, useEffect, useSyncExternalStore, lazy, Suspense } from 'react'
import { HeroQuote } from './hero-quote'
import { CtaRow } from './cta-row'
import { FallbackPoster } from './fallback-poster'
import { AnnouncementBar } from './announcement-bar'
import { FeaturesSection, type LandingFeature } from './features-section'
import { StatsSection, type LandingStat } from './stats-section'
import { LandingFooter, type FooterLink } from './landing-footer'
import { useAuthStore } from '@/features/auth'
import { ChevronDown } from 'lucide-react'

const OrbitScene = lazy(() =>
  import('./orbit-scene').then((m) => ({ default: m.OrbitScene })),
)

const MetroTunnelScene = lazy(() =>
  import('./metro-tunnel-scene').then((m) => ({ default: m.MetroTunnelScene })),
)

interface LandingData {
  images: Array<{
    id: string
    title: string
    caption?: string | null
    alt: string
    mediaUrl: string
    linkUrl?: string | null
  }>
  quotes: Array<{
    id: string
    text: string
    author?: string | null
  }>
  ctas: Array<{
    id: string
    label: string
    href: string
    icon?: string | null
    variant: string
    authOnly: boolean
  }>
  settings: Record<string, unknown>
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
function getReducedMotionServer() {
  return false
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionServer)
}

function useWebGLSupport() {
  const [supported] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      return !!gl
    } catch {
      return false
    }
  })
  return supported
}

export function LandingPage() {
  const [data, setData] = useState<LandingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [heroOverride, setHeroOverride] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const reducedMotion = useReducedMotion()
  const webglSupported = useWebGLSupport()

  // Allow previewing a hero mode without changing the saved setting: ?hero=tunnel
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('hero')
    if (q === 'tunnel' || q === 'orbit') setHeroOverride(q)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/landing')
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        }
      } catch {
        // fallback to empty data
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
          <p className="text-sm text-white/50">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  const fallbackMode = (data?.settings?.fallbackMode as string) ?? 'auto'
  const shouldShow3D =
    fallbackMode === 'always3d' ||
    (fallbackMode !== 'always2d' && webglSupported && !reducedMotion)

  const heroMode = heroOverride ?? (data?.settings?.heroMode as string) ?? 'orbit'

  const quoteMode = (data?.settings?.quoteMode as 'fixed' | 'random') ?? 'random'

  const headerTitle = (data?.settings?.headerTitle as string) ?? 'مدار خط یک'
  const heroTitle = (data?.settings?.heroTitle as string) ?? 'مدار خط یک'
  const heroSubtitle = (data?.settings?.heroSubtitle as string) ?? 'سامانه سیر و حرکت خط ۱ مترو تهران'
  const footerText = (data?.settings?.footerText as string) ?? 'سامانه سیر و حرکت خط ۱ مترو تهران — مدار خط یک'

  const announcementEnabled = data?.settings?.announcementEnabled === true
  const announcementText = (data?.settings?.announcementText as string) ?? ''
  const announcementHref = (data?.settings?.announcementHref as string) ?? ''
  const featuresTitle = (data?.settings?.featuresTitle as string) ?? 'یک سامانه برای همهٔ عملیات خط ۱'
  const features = Array.isArray(data?.settings?.features)
    ? (data.settings.features as LandingFeature[])
    : []
  const stats = Array.isArray(data?.settings?.stats)
    ? (data.settings.stats as LandingStat[])
    : []
  const footerLinks = Array.isArray(data?.settings?.footerLinks)
    ? (data.settings.footerLinks as FooterLink[])
    : []

  const hasLowerSections = features.length > 0 || stats.length > 0

  return (
    <div className="relative min-h-screen bg-black" dir="rtl">
      {/* ── Announcement ── */}
      {announcementEnabled && announcementText && (
        <AnnouncementBar text={announcementText} href={announcementHref || null} />
      )}

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 shadow-[0_0_20px_-4px_rgba(229,57,53,0.5)]">
              <svg viewBox="0 0 40 40" className="size-6 text-accent" fill="currentColor">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
                <text
                  x="20"
                  y="25"
                  textAnchor="middle"
                  className="fill-current text-[14px] font-bold"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  M
                </text>
              </svg>
            </div>
            <span className="text-lg font-bold text-white">{headerTitle}</span>
          </div>

          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
            >
              ادامه به داشبورد
            </a>
          ) : (
            <a
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_4px_20px_-6px_rgba(229,57,53,0.7)] transition-colors hover:bg-accent-hover"
            >
              ورود
            </a>
          )}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0204]/60 to-black pointer-events-none" />
        {/* ambient accent glows */}
        <div className="pointer-events-none absolute -top-24 start-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 end-0 size-[24rem] rounded-full bg-accent/5 blur-[100px]" />

        {/* Quote */}
        {data?.quotes && data.quotes.length > 0 && (
          <div className="relative z-20">
            <HeroQuote quotes={data.quotes} mode={quoteMode} />
          </div>
        )}

        {/* 3D Scene / Fallback */}
        <div className="relative z-10">
          {shouldShow3D ? (
            <Suspense fallback={<FallbackPoster title={heroTitle} subtitle={heroSubtitle} />}>
              {heroMode === 'tunnel' ? (
                <MetroTunnelScene reducedMotion={reducedMotion} />
              ) : (
                <OrbitScene
                  images={data?.images ?? []}
                  settings={{
                    particleCount: (data?.settings?.particleCount as number) ?? 1200,
                    sphereRadius: (data?.settings?.sphereRadius as number) ?? 3,
                    autoRotateSpeed: (data?.settings?.autoRotateSpeed as number) ?? 0.3,
                  }}
                />
              )}
            </Suspense>
          ) : (
            <FallbackPoster title={heroTitle} subtitle={heroSubtitle} />
          )}
        </div>

        {/* CTA Buttons */}
        {data?.ctas && data.ctas.length > 0 && (
          <div className="relative z-20">
            <CtaRow ctas={data.ctas} isAuthenticated={isAuthenticated} />
          </div>
        )}

        {/* Scroll hint */}
        {hasLowerSections && (
          <div className="relative z-20 flex justify-center pb-6 animate-bounce">
            <a
              href="#stats"
              className="rounded-full bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              aria-label="ادامه صفحه"
            >
              <ChevronDown className="size-5" />
            </a>
          </div>
        )}
      </section>

      {/* ── Stats ── */}
      <div id="stats">
        <StatsSection stats={stats} />
      </div>

      {/* ── Features ── */}
      <FeaturesSection title={featuresTitle} features={features} />

      {/* ── Footer ── */}
      <LandingFooter text={footerText} links={footerLinks} />
    </div>
  )
}
