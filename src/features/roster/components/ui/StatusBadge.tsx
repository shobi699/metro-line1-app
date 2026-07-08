import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Ban, CircleDashed, Factory, Star, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TripStatus = 'NORMAL' | 'EMPTY' | 'CANCELLED' | 'DEPOT' | 'SPECIAL' | 'AMENDED'

interface StatusBadgeProps {
  status: TripStatus
  amendmentNumber?: number
  className?: string
  showText?: boolean
}

export function StatusBadge({ status, amendmentNumber, className, showText = true }: StatusBadgeProps) {
  switch (status) {
    case 'CANCELLED':
      return (
        <Badge variant="destructive" className={cn("gap-1 font-mono", className)}>
          <Ban className="h-3 w-3" />
          {showText && <span className="line-through">لغو شده</span>}
        </Badge>
      )
    case 'EMPTY':
      return (
        <Badge variant="secondary" className={cn("gap-1 bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 font-mono", className)}>
          <CircleDashed className="h-3 w-3" />
          {showText && <span>خالی</span>}
        </Badge>
      )
    case 'DEPOT':
      return (
        <Badge className={cn("gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 font-mono", className)}>
          <Factory className="h-3 w-3" />
          {showText && <span>دپو</span>}
        </Badge>
      )
    case 'SPECIAL':
      return (
        <Badge className={cn("gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 font-mono", className)}>
          <Star className="h-3 w-3" />
          {showText && <span>فوق‌العاده</span>}
        </Badge>
      )
    case 'AMENDED':
      return (
        <Badge className={cn("gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 font-mono border border-orange-200 dark:border-orange-900/50", className)}>
          <AlertTriangle className="h-3 w-3" />
          {showText && <span>اصلاحیه {amendmentNumber ? amendmentNumber : ''}</span>}
        </Badge>
      )
    case 'NORMAL':
    default:
      return (
        <Badge variant="outline" className={cn("gap-1 font-mono text-muted-foreground", className)}>
          <CheckCircle2 className="h-3 w-3" />
          {showText && <span>عادی</span>}
        </Badge>
      )
  }
}
