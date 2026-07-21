'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, Clock, AlertTriangle, Train, Timer } from 'lucide-react'
import { TripAssignmentData } from './TripCard'
import { CrewCell } from './ui/CrewCell'
import { TripStatus, StatusBadge } from './ui/StatusBadge'

interface NextDepartureHeroProps {
  id: string
  trainNumber: string | null
  direction: 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'
  departureTime: string | null
  myRole: 'H1' | 'H2' | 'T' | 'R'
  status: TripStatus
  amendmentNumber?: number
  isAmended?: boolean
  operationalNote?: string | null
  coworkers: TripAssignmentData[]
  className?: string
  onClick?: () => void
}

function parseTimeToDate(timeString: string | null): Date | null {
  if (!timeString) return null
  const [hours, minutes] = timeString.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return null
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  return now
}

export function NextDepartureHero({
  trainNumber,
  direction,
  departureTime,
  myRole,
  status,
  amendmentNumber,
  isAmended,
  operationalNote,
  coworkers,
  className,
  onClick
}: NextDepartureHeroProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState(false)

  const origin = direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
  const dest = direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
  const isCancelled = status === 'CANCELLED'

  useEffect(() => {
    if (!departureTime || isCancelled) {
      setTimeLeft('')
      setIsUrgent(false)
      return
    }

    const targetDate = parseTimeToDate(departureTime)
    if (!targetDate) return

    const timer = setInterval(() => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()
      
      if (diffMs <= 0) {
        setTimeLeft('زمان اعزام فرا رسیده')
        setIsUrgent(true)
        clearInterval(timer)
        return
      }

      const diffMins = Math.floor(diffMs / 60000)
      const diffSecs = Math.floor((diffMs % 60000) / 1000)
      
      setIsUrgent(diffMins <= 15)
      setTimeLeft(`${diffMins} دقیقه و ${diffSecs} ثانیه دیگر`)
    }, 1000)

    return () => clearInterval(timer)
  }, [departureTime, isCancelled])

  return (
    <Card className={cn(
      "overflow-hidden border-2 shadow-lg",
      isCancelled ? "border-red-500/50 bg-red-50 dark:bg-red-950/20" : 
      isAmended ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : 
      "border-primary/50 bg-gradient-to-br from-background to-primary/5",
      onClick && "cursor-pointer hover:shadow-xl transition-all",
      className
    )} onClick={onClick}>
      {/* Top Banner for modifications */}
      {(isAmended || isCancelled) && (
        <div className={cn(
          "px-4 py-2 text-sm font-bold flex items-center gap-2",
          isCancelled ? "bg-red-500 text-white" : "bg-orange-500 text-white"
        )}>
          <AlertTriangle className="h-4 w-4" />
          {isCancelled ? "این سفر لغو شده است" : `سفر تغییر کرده است (اصلاحیه ${amendmentNumber || ''})`}
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Main Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2.5 rounded-xl">
                <Train className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                  اعزام بعدی شما
                  <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-bold">
                    نقش: {myRole}
                  </span>
                  {status !== 'NORMAL' && (
                     <StatusBadge status={status} amendmentNumber={amendmentNumber} />
                  )}
                </div>
                <div className="text-2xl font-bold flex items-center gap-3">
                  <span>{origin}</span>
                  <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                  <span>{dest}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">ساعت حرکت</span>
                <div className={cn(
                  "text-4xl font-black font-mono tracking-tight",
                  isCancelled ? "text-muted-foreground line-through" : ""
                )}>
                  {departureTime || '--:--'}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">شماره قطار</span>
                <div className="text-3xl font-bold font-mono text-primary">
                  {trainNumber || '---'}
                </div>
              </div>
            </div>
            
            {operationalNote && (
              <div className="mt-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-300 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="font-medium">{operationalNote}</span>
              </div>
            )}
          </div>

          {/* Sidebar Info (Timer & Crew) */}
          <div className="flex flex-col gap-4 w-full md:w-64 shrink-0">
            {!isCancelled && timeLeft && (
              <div className={cn(
                "p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-colors",
                isUrgent ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50" : "bg-card border-border"
              )}>
                <div className={cn(
                  "flex items-center gap-1.5 font-bold text-sm",
                  isUrgent ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                )}>
                  <Timer className={cn("h-4 w-4", isUrgent && "animate-pulse")} />
                  زمان تا حرکت
                </div>
                <div className={cn(
                  "font-mono font-bold",
                  isUrgent ? "text-red-600 dark:text-red-400 text-lg" : "text-base"
                )}>
                  {timeLeft}
                </div>
              </div>
            )}

            {coworkers.length > 0 && (
              <div className="bg-card p-3 rounded-xl border space-y-2">
                <div className="text-xs font-bold text-muted-foreground mb-2 px-1">هم‌خدمه‌های این سفر</div>
                <div className="space-y-2">
                  {coworkers.map(c => (
                    <CrewCell key={c.id} name={c.name} role={c.role} isAmended={c.isAmended} hasConflict={c.hasConflict} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
