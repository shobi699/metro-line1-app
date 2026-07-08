import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, Clock, MapPin, AlertTriangle } from 'lucide-react'
import { StatusBadge, TripStatus } from './ui/StatusBadge'
import { CrewCell } from './ui/CrewCell'

export interface TripAssignmentData {
  id: string
  role: 'H1' | 'H2' | 'T' | 'R'
  name: string
  personnelNo?: string
  isAmended?: boolean
  hasConflict?: boolean
}

export interface TripCardProps {
  id: string
  trainNumber: string | null
  direction: 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'
  departureTime: string | null
  arrivalTime: string | null
  status: TripStatus
  amendmentNumber?: number
  isPast?: boolean
  isAmended?: boolean
  operationalNote?: string | null
  assignments?: TripAssignmentData[]
  myRole?: 'H1' | 'H2' | 'T' | 'R'
  className?: string
  onClick?: () => void
}

export function TripCard({
  trainNumber,
  direction,
  departureTime,
  arrivalTime,
  status,
  amendmentNumber,
  isPast,
  isAmended,
  operationalNote,
  assignments = [],
  myRole,
  className,
  onClick
}: TripCardProps) {
  
  const origin = direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
  const dest = direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md cursor-pointer",
        isPast ? "opacity-60 bg-muted/30" : "bg-card",
        isAmended && "border-orange-500/50 ring-1 ring-orange-500/20",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "h-1 w-full",
        status === 'CANCELLED' ? "bg-red-500" : 
        isAmended ? "bg-orange-500" : 
        "bg-primary/20"
      )} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">
              {departureTime || '—'}
            </span>
            <span className="text-muted-foreground">تا</span>
            <span className="font-mono text-muted-foreground">
              {arrivalTime || '—'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isAmended && (
              <span className="text-xs font-bold text-orange-500 flex items-center gap-1 bg-orange-500/10 px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" />
                اصلاحیه {amendmentNumber ? amendmentNumber : ''}
              </span>
            )}
            {status !== 'NORMAL' && (
              <StatusBadge status={status} amendmentNumber={amendmentNumber} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary/50 px-2 py-1 rounded-md">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{origin}</span>
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground mx-0.5" />
            <span>{dest}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm font-mono bg-secondary/50 px-2 py-1 rounded-md">
            <span className="text-muted-foreground">قطار</span>
            <span className="font-bold">{trainNumber || '—'}</span>
          </div>
          
          {myRole && (
            <div className="ms-auto flex items-center gap-1 text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
              نقش من: {myRole}
            </div>
          )}
        </div>

        {assignments.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            {assignments.map(a => (
              <CrewCell 
                key={a.id} 
                name={a.name} 
                role={a.role} 
                isAmended={a.isAmended} 
                hasConflict={a.hasConflict} 
              />
            ))}
          </div>
        )}
        
        {operationalNote && (
          <div className="mt-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200/50 dark:border-amber-900/50 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{operationalNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
