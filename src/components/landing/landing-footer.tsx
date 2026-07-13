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
    <footer className="relative z-10 border-t border-white/10" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8">
        {links.length > 0 && (
          <nav aria-label="لینک‌های فوتر">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
        <p className="text-xs text-white/30">
          © {year} — {text}
        </p>
      </div>
    </footer>
  )
}
