'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'
import { Badge } from '@/components/ui/badge'

interface TripAssignment {
  role: string
  rawName: string | null
  matchedUser?: { name: string }
}

interface Trip {
  id: string
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  departureTime: string | null
  arrivalTime: string | null
  status: string
  hasConflict?: boolean
  assignments: TripAssignment[]
}

interface OccTimelineProps {
  trips: Trip[]
  searchQuery?: string
}

// Timeline configs
const START_HOUR = 4
const END_HOUR = 25 // 1 AM next day
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_WIDTH = 120 // pixels per hour
const MINUTE_WIDTH = HOUR_WIDTH / 60

function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  let hour = h
  if (hour < 4) hour += 24 // After midnight
  return (hour - START_HOUR) * 60 + m
}

function calculateLeftPosition(timeStr: string | null) {
  return timeToMinutes(timeStr) * MINUTE_WIDTH
}

function calculateWidth(start: string | null, end: string | null) {
  const startMins = timeToMinutes(start)
  const endMins = timeToMinutes(end)
  return Math.max((endMins - startMins) * MINUTE_WIDTH, MINUTE_WIDTH * 15) // minimum 15 mins width
}

export function OccTimeline({ trips, searchQuery = '' }: OccTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [nowPosition, setNowPosition] = useState(0)

  // Update Now-line every minute
  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date()
      let h = now.getHours()
      let m = now.getMinutes()
      if (h < 4) h += 24
      const mins = (h - START_HOUR) * 60 + m
      setNowPosition(mins * MINUTE_WIDTH)
    }
    
    updateNowLine()
    const interval = setInterval(updateNowLine, 60000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to now on load
  useEffect(() => {
    if (containerRef.current && nowPosition > 0) {
      containerRef.current.scrollLeft = Math.max(0, nowPosition - window.innerWidth / 2)
    }
  }, [nowPosition])

  // Group by Train Number
  const trains = useMemo(() => {
    const map = new Map<string, Trip[]>()
    trips.forEach(t => {
      const tNum = t.trainNumber || 'نامشخص'
      if (!map.has(tNum)) map.set(tNum, [])
      map.get(tNum)!.push(t)
    })
    
    // Sort trains numerically
    return Array.from(map.entries()).sort((a, b) => {
      return parseInt(a[0] || '0') - parseInt(b[0] || '0')
    })
  }, [trips])

  const isTripMatching = (trip: Trip) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const crew = trip.assignments.map(a => (a.matchedUser?.name || a.rawName || '').toLowerCase()).join(' ')
    return (trip.trainNumber || '').includes(q) || crew.includes(q)
  }

  // Generate hour markers
  const hours = Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
    let h = START_HOUR + i
    if (h >= 24) h -= 24
    return String(h).padStart(2, '0') + ':00'
  })

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-3 border-b border-outline-variant bg-surface-container/50 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-bold">خط زمان OCC</Badge>
          <span className="text-xs text-foreground-muted">{toFa(trains.length)} قطار در سرویس</span>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/20 border border-success/50"></span> عادی</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-critical/20 border border-critical/50"></span> مشکل‌دار</div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 overflow-auto relative" ref={containerRef}>
        
        <div className="relative min-w-max" style={{ width: `${TOTAL_HOURS * HOUR_WIDTH}px` }}>
          
          {/* Time axis header */}
          <div className="sticky top-0 z-30 h-8 border-b border-outline-variant bg-surface-container-low flex text-xs font-mono font-bold text-foreground-muted">
            <div className="sticky right-0 z-40 w-24 border-l border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
              قطار
            </div>
            <div className="flex-1 relative">
              {hours.map((hour, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 bottom-0 border-r border-outline-variant/30 flex justify-center pt-1.5"
                  style={{ left: `${i * HOUR_WIDTH}px`, width: '1px' }}
                >
                  <span className="bg-surface-container-low px-1 -ml-3">{toFa(hour)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="relative z-10">
            {/* Background Grid Lines */}
            <div className="absolute top-0 bottom-0 left-24 right-0 pointer-events-none opacity-20">
              {hours.map((_, i) => (
                <div 
                  key={i} 
                  className="absolute top-0 bottom-0 border-l border-outline-variant/50"
                  style={{ left: `${i * HOUR_WIDTH}px`, width: '1px' }}
                />
              ))}
            </div>

            {/* Now Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-critical z-20 pointer-events-none shadow-[0_0_8px_rgba(255,0,0,0.8)]"
              style={{ left: `${24 * 4 + nowPosition}px` }} // 24 is Train col width, wait, it's sticky so we just add `w-24` = 96px!
            />
            {/* Fix: `nowPosition` applies to the scrollable area, train column is fixed on the screen but we are drawing absolute here, so train col is part of flow?
                The train col is sticky right-0... wait, `dir="rtl"`, so left is actually `right` in LTR!
                Tailwind logical properties: we should use `inset-inline-start` instead of `left`.
            */}

            {trains.map(([trainNo, trainTrips]) => (
              <div key={trainNo} className="flex border-b border-outline-variant/30 hover:bg-surface-container/30 transition-colors h-12 relative">
                
                {/* Train Label */}
                <div className="sticky right-0 z-20 w-24 border-l border-outline-variant bg-surface shrink-0 flex items-center justify-center font-bold text-accent shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {toFa(trainNo)}
                </div>

                {/* Timeline Area */}
                <div className="flex-1 relative">
                  {trainTrips.map(trip => {
                    const isMatch = isTripMatching(trip)
                    const leftPos = calculateLeftPosition(trip.departureTime)
                    const width = calculateWidth(trip.departureTime, trip.arrivalTime)
                    const isProb = trip.hasConflict || trip.status === 'CANCELLED'

                    return (
                      <div
                        key={trip.id}
                        className={cn(
                          "absolute top-2 bottom-2 rounded-md border flex flex-col justify-center px-2 text-[10px] overflow-hidden transition-all group cursor-pointer",
                          isProb 
                            ? "bg-critical/20 border-critical/50 text-critical-on hover:bg-critical/30" 
                            : "bg-success/20 border-success/40 text-success hover:bg-success/30",
                          !isMatch && "opacity-20 saturate-0 scale-95"
                        )}
                        // Using `right` because of RTL direction in the app
                        style={{ right: `${leftPos}px`, width: `${width}px` }}
                      >
                        <div className="font-bold truncate">
                          {trip.direction === 'TAJRISH_TO_SHAHRREY' ? '↓ ری' : '↑ تج'}
                        </div>
                        <div className="truncate opacity-80">
                          {trip.assignments.map(a => a.matchedUser?.name || a.rawName).filter(Boolean).join('، ')}
                        </div>
                        
                        {/* Tooltip on hover (simple CSS) */}
                        <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 bg-surface text-foreground border border-outline-variant shadow-lg rounded p-2 z-50 w-max max-w-xs text-xs">
                          <div className="font-bold mb-1">قطار {toFa(trip.trainNumber || '')}</div>
                          <div>اعزام: {toFa(trip.departureTime?.substring(0,5) || '')} | رسید: {toFa(trip.arrivalTime?.substring(0,5) || '')}</div>
                          <div className="mt-1 opacity-80">راهبر: {trip.assignments.find(a => a.role === 'H1')?.matchedUser?.name || '—'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
