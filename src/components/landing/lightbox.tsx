'use client'

import { useEffect, useCallback } from 'react'
import { X, ExternalLink } from 'lucide-react'

interface LightboxImage {
  id: string
  title: string
  caption?: string | null
  alt: string
  mediaUrl: string
  linkUrl?: string | null
}

interface LandingLightboxProps {
  image: LightboxImage
  onClose: () => void
}

export function LandingLightbox({ image, onClose }: LandingLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
    >
      <div
        className="relative mx-4 max-h-[90vh] max-w-3xl overflow-hidden rounded-xl bg-surface-container-low shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="absolute start-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          aria-label="بستن"
        >
          <X className="size-5" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.mediaUrl}
          alt={image.alt}
          className="max-h-[60vh] w-full object-contain bg-black"
        />

        <div className="space-y-2 p-5">
          <h3 className="text-lg font-bold text-foreground">{image.title}</h3>
          {image.caption && (
            <p className="text-sm leading-relaxed text-foreground-muted">
              {image.caption}
            </p>
          )}
          {image.linkUrl && (
            <a
              href={image.linkUrl}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              مشاهده بیشتر
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
