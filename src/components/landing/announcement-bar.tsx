'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'

interface AnnouncementBarProps {
  text: string
  href?: string | null
}

export function AnnouncementBar({ text, href }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !text) return null

  const content = (
    <span className="text-sm font-medium text-white">{text}</span>
  )

  return (
    <div
      className="relative z-30 flex items-center justify-center gap-2 bg-accent px-10 py-2 text-center"
      dir="rtl"
      role="status"
    >
      <Megaphone className="size-4 shrink-0 text-white/80" aria-hidden />
      {href ? (
        <Link href={href} className="underline-offset-4 hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="بستن اطلاعیه"
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
