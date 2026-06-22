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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <Icon className="mb-3 size-10 text-foreground-muted" />
      <h3 className="text-sm font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-foreground-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
