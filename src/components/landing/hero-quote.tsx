'use client'

import { useState, useEffect, useMemo } from 'react'

interface QuoteData {
  id: string
  text: string
  author?: string | null
}

interface HeroQuoteProps {
  quotes: QuoteData[]
  mode?: 'fixed' | 'random'
}

export function HeroQuote({ quotes, mode = 'random' }: HeroQuoteProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const shuffled = useMemo(() => {
    if (mode === 'random' && quotes.length > 1) {
      return [...quotes].sort((a, b) => {
        const ha = a.id.charCodeAt(0) + a.id.charCodeAt(a.id.length - 1)
        const hb = b.id.charCodeAt(0) + b.id.charCodeAt(b.id.length - 1)
        return ha - hb
      })
    }
    return quotes
  }, [quotes, mode])

  useEffect(() => {
    if (shuffled.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % shuffled.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [shuffled.length])

  if (shuffled.length === 0) return null

  const current = shuffled[currentIndex]

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 text-center" dir="rtl">
      <blockquote className="relative">
        <span className="absolute -start-4 -top-4 text-5xl font-bold text-accent/20 leading-none select-none">
          «
        </span>
        <p
          className="text-xl font-semibold leading-relaxed text-foreground md:text-2xl transition-opacity duration-700"
          key={current.id}
        >
          {current.text}
        </p>
        <span className="absolute -bottom-4 -end-4 text-5xl font-bold text-accent/20 leading-none select-none">
          »
        </span>
      </blockquote>
      {current.author && (
        <footer className="mt-6 text-sm text-foreground-muted">
          — {current.author}
        </footer>
      )}
    </div>
  )
}
