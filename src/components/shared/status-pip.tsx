import { cn } from '@/lib/utils'

type StatusLevel = 'ok' | 'warn' | 'error'

interface StatusPipProps {
  status: StatusLevel
  pulse?: boolean
  label?: string
  className?: string
}

const pipColors: Record<StatusLevel, string> = {
  ok: 'bg-success',
  warn: 'bg-warning',
  error: 'bg-critical',
}

const glowColors: Record<StatusLevel, string> = {
  ok: 'shadow-[0_0_8px_oklch(0.58_0.19_145/0.5)]',
  warn: 'shadow-[0_0_8px_oklch(0.72_0.16_75/0.5)]',
  error: 'shadow-[0_0_8px_oklch(0.50_0.25_25/0.5)]',
}

const pulseAnimation: Record<StatusLevel, string> = {
  ok: 'pulse-green',
  warn: 'pulse-amber',
  error: 'pulse-red',
}

export function StatusPip({ status, pulse = false, label, className }: StatusPipProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'size-2 rounded-full',
          pipColors[status],
          glowColors[status],
          pulse && pulseAnimation[status],
        )}
      />
      {label && (
        <span className="font-mono text-xs text-foreground-muted">{label}</span>
      )}
    </div>
  )
}
