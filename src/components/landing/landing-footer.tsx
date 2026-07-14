'use client'

import Link from 'next/link'
import { jalali } from '@/lib/fa'

export interface FooterLink {
  label: string
  href: string
}

interface LandingFooterProps {
  text: string
  links: FooterLink[]
}

export function LandingFooter({ text, links }: LandingFooterProps) {
  const year = jalali(new Date()).split('/')[0]

  return (
    <footer className="relative z-10 border-t border-white/10 bg-gradient-to-b from-transparent to-white/[0.02]" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12">
        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
            <svg viewBox="0 0 40 40" className="size-5 text-accent" fill="currentColor">
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
        </div>

        {links.length > 0 && (
          <nav aria-label="لینک‌های فوتر">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/60 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="h-px w-full max-w-sm bg-gradient-to-l from-transparent via-white/10 to-transparent" />

        <p className="text-center text-xs text-white/30">
          © {year} — {text}
        </p>
      </div>
    </footer>
  )
}
