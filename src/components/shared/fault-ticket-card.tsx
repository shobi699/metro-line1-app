'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Wrench, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FaultTicketCardProps {
  ticketId: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: string
}

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  high: { label: 'بالا', color: 'bg-critical/15 text-critical', icon: AlertTriangle },
  medium: { label: 'متوسط', color: 'bg-warning/15 text-warning', icon: Wrench },
  low: { label: 'پایین', color: 'bg-info/15 text-info', icon: Info },
}

export function FaultTicketCard({
  ticketId,
  description,
  priority,
  status,
}: FaultTicketCardProps) {
  const config = priorityConfig[priority] ?? priorityConfig.low
  const Icon = config.icon

  return (
    <div className={cn(
      'flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-surface-hover',
      priority === 'high' ? 'border-critical/30' : 'border-outline-variant',
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
          priority === 'high' ? 'bg-critical/10' : priority === 'medium' ? 'bg-warning/10' : 'bg-info/10',
        )}>
          <Icon className={cn('size-3.5', config.color.split(' ')[1])} />
        </div>
        <div>
          <div className="font-data-mono text-xs font-bold text-accent">{ticketId}</div>
          <div className="mt-0.5 text-sm">{description}</div>
          <div className="mt-1 text-xs text-foreground-muted">{status}</div>
        </div>
      </div>
      <Badge className={config.color}>
        {config.label}
      </Badge>
    </div>
  )
}
