'use client'

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const STATIC_PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  width: 2 + seededRandom(i * 5) * 4,
  height: 2 + seededRandom(i * 5 + 1) * 4,
  top: seededRandom(i * 5 + 2) * 100,
  left: seededRandom(i * 5 + 3) * 100,
  opacity: 0.3 + seededRandom(i * 5 + 4) * 0.5,
}))

interface FallbackPosterProps {
  title?: string
  subtitle?: string
}

export function FallbackPoster({
  title = 'مدار خط یک',
  subtitle = 'سامانه سیر و حرکت خط ۱ مترو تهران',
}: FallbackPosterProps) {
  return (
    <div className="relative flex h-[70vh] min-h-[500px] w-full items-center justify-center overflow-hidden md:h-[80vh]">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a0a0a] to-black" />

      <div className="absolute inset-0 overflow-hidden">
        {STATIC_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/20"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              top: `${p.top}%`,
              left: `${p.left}%`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <div className="flex size-24 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 shadow-[0_0_60px_rgba(229,57,53,0.3)]">
          <svg viewBox="0 0 40 40" className="size-12 text-accent" fill="currentColor">
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
        <h2 className="text-2xl font-bold text-white md:text-3xl">
          {title}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-white/60">
          {subtitle}
        </p>
      </div>
    </div>
  )
}
