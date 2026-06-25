import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low/50 p-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-container-high">
        <Icon className="size-7 text-foreground-muted" />
      </div>
      <h3 className="font-label-md text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-foreground-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
