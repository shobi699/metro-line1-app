import React from 'react'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface CrewCellProps {
  name: string
  role: 'H1' | 'H2' | 'T' | 'R'
  isAmended?: boolean
  hasConflict?: boolean
  className?: string
}

export function CrewCell({ name, role, isAmended, hasConflict, className }: CrewCellProps) {
  const roleColorMap = {
    H1: 'bg-primary/10 text-primary',
    H2: 'bg-primary/10 text-primary',
    T: 'bg-secondary text-secondary-foreground',
    R: 'bg-muted text-muted-foreground',
  }

  const roleLabelMap = {
    H1: 'اصلی',
    H2: 'دوم',
    T: 'کمکی',
    R: 'رزرو',
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md border text-sm transition-colors",
      hasConflict ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" : "border-border/50 bg-background/50",
      isAmended && !hasConflict ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20" : "",
      className
    )}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        roleColorMap[role]
      )}>
        {role}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate" title={name}>{name}</span>
        <span className="text-[10px] text-muted-foreground leading-none">{roleLabelMap[role]}</span>
      </div>
    </div>
  )
}
