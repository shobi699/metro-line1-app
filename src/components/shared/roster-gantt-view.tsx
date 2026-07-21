import { useState, useMemo, useEffect } from 'react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  MessageSquare, 
  Activity,
  User,
  Train,
  Check,
  UserCheck,
  TrendingUp,
  ChevronLeft,
  Info
} from 'lucide-react'

interface TripAssignment {
  id: string
  role: 'H1' | 'H2' | 'T' | 'R' | 'T_TYPE' | 'R_CHAR'
  rawName: string | null
  matchedUserId: string | null
  personnelNo: string | null
  matchStatus: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  matchedUser?: {
    name: string
  }
}

interface Trip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  operationalNote: string | null
  status: string
  assignments: TripAssignment[]
}

interface ValidationIssue {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  type: string
  message: string
  affectedTripId?: string
  affectedUserId?: string
}

interface RosterGanttViewProps {
  trips: Trip[]
  issues?: ValidationIssue[]
  isAdmin?: boolean
  searchQuery?: string
  onCommentClick?: (tripId: string, operationalNote: string | null, status: string) => void
  onRefresh?: () => void
}

const TIMELINE_START_HOUR = 5 // 05:00
const TIMELINE_END_HOUR = 24  // 24:00 (12:00 AM)
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR
const TOTAL_MINUTES = TOTAL_HOURS * 60

// Helper to convert "HH:MM:SS" or "HH:MM" to minutes from midnight
function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return 0
  const parts = timeStr.split(':').map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0
  return parts[0] * 60 + parts[1]
}

export function RosterGanttView({
  trips,
  issues = [],
  isAdmin = false,
  searchQuery = '',
  onCommentClick,
  onRefresh
}: RosterGanttViewProps) {
  const [groupBy, setGroupBy] = useState<'train' | 'driver'>('train')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [nowMinutes, setNowMinutes] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date()
      setNowMinutes(d.getHours() * 60 + d.getMinutes())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // 1. Group trips
  const groups = useMemo(() => {
    if (groupBy === 'train') {
      const trainMap: Record<string, Trip[]> = {}
      trips.forEach((trip) => {
        const train = trip.trainNumber || 'نامشخص'
        if (!trainMap[train]) trainMap[train] = []
        trainMap[train].push(trip)
      })
      
      // Sort trains numerically/alphabetically
      return Object.entries(trainMap)
        .map(([name, groupTrips]) => ({
          id: name,
          label: `قطار ${name}`,
          trips: groupTrips.sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime))
        }))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    } else {
      const driverMap: Record<string, { name: string; trips: Trip[] }> = {}
      
      trips.forEach((trip) => {
        trip.assignments.forEach((ass) => {
          if (ass.matchedUserId && (ass.role === 'H1' || ass.role === 'H2' || ass.role === 'T' || ass.role === 'R')) {
            const driverId = ass.matchedUserId
            const driverName = ass.matchedUser?.name || ass.rawName || 'راهبر نامشخص'
            if (!driverMap[driverId]) {
              driverMap[driverId] = { name: driverName, trips: [] }
            }
            // Avoid duplicate trips in the list
            if (!driverMap[driverId].trips.some(t => t.id === trip.id)) {
              driverMap[driverId].trips.push(trip)
            }
          }
        })
      })

      return Object.entries(driverMap)
        .map(([id, data]) => ({
          id,
          label: data.name,
          trips: data.trips.sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime))
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fa'))
    }
  }, [trips, groupBy])

  // Calculate position styles for a trip block
  const getTripBlockStyles = (trip: Trip) => {
    const startMin = timeToMinutes(trip.departureTime)
    const endMin = timeToMinutes(trip.arrivalTime) || (startMin + 60) // Fallback if no arrival time

    const timelineStartMin = TIMELINE_START_HOUR * 60
    
    // Calculate percentage offset and width
    const leftPercent = Math.max(0, Math.min(100, ((startMin - timelineStartMin) / TOTAL_MINUTES) * 100))
    const widthPercent = Math.max(1, Math.min(100, ((endMin - startMin) / TOTAL_MINUTES) * 100))

    // Determine colors
    const hasCritical = issues.some(iss => iss.affectedTripId === trip.id && (iss.severity === 'CRITICAL' || iss.severity === 'ERROR'))
    const hasWarning = issues.some(iss => iss.affectedTripId === trip.id && iss.severity === 'WARNING')
    const hasDisputed = trip.assignments.some(a => a.disputed)
    const hasUnassignedH1 = !trip.assignments.some(a => a.role === 'H1' && a.matchedUserId)

    // Check if trip matches search query
    let isMatched = true
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const tNum = trip.trainNumber?.toLowerCase() || ''
      const names = trip.assignments.map(a => (a.matchedUser?.name || a.rawName || '').toLowerCase()).join(' ')
      isMatched = tNum.includes(q) || names.includes(q)
    }

    let borderClass = 'border-accent/40 bg-accent/15 text-accent'
    let statusDot = 'bg-accent'

    if (trip.status === 'CANCELLED') {
      borderClass = 'border-neutral-700 bg-neutral-800/40 text-foreground-muted opacity-60'
      statusDot = 'bg-neutral-600'
    } else if (hasCritical || hasUnassignedH1) {
      borderClass = 'border-critical/60 bg-critical/20 text-critical font-bold shadow-[0_0_8px_rgba(220,38,38,0.15)] animate-pulse'
      statusDot = 'bg-critical'
    } else if (hasDisputed || hasWarning) {
      borderClass = 'border-warning/60 bg-warning/20 text-warning font-bold'
      statusDot = 'bg-warning'
    } else if (trip.assignments.some(a => a.role === 'H1' && a.readyAt)) {
      borderClass = 'border-success/60 bg-success/20 text-success'
      statusDot = 'bg-success'
    }

    if (!isMatched) {
      borderClass += ' opacity-20'
    } else if (searchQuery) {
      borderClass += ' ring-2 ring-accent shadow-[0_0_8px_rgba(255,255,255,0.4)] z-20'
    }

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      className: borderClass,
      statusDot
    }
  }

  // Handle dispute resolution from details pane
  async function handleResolveDispute(assignmentId: string) {
    if (typeof window === 'undefined') return
    setActionLoading(assignmentId)
    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch(`/api/trips/${assignmentId}/resolve-dispute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        if (onRefresh) onRefresh()
        // Update selected trip state
        if (selectedTrip) {
          const updatedAss = selectedTrip.assignments.map(a => 
            a.id === assignmentId ? { ...a, disputed: false } : a
          )
          setSelectedTrip({ ...selectedTrip, assignments: updatedAss })
        }
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const hoursArray = Array.from({ length: TOTAL_HOURS }, (_, i) => TIMELINE_START_HOUR + i)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* 1. Main Timeline Board */}
      <div className="lg:col-span-3 bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Header Controls */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface-container/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            <h3 className="text-xs font-bold text-foreground">خط‌زمان گراف اعزام‌های روز جاری</h3>
          </div>
          <div className="flex bg-surface-container-low border border-outline-variant p-0.5 rounded-lg text-[10px]">
            <button
              onClick={() => setGroupBy('train')}
              className={cn(
                "px-2.5 py-1 rounded cursor-pointer transition-all font-semibold",
                groupBy === 'train' ? "bg-accent text-accent-foreground font-bold shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              گروه‌بندی قطارها
            </button>
            <button
              onClick={() => setGroupBy('driver')}
              className={cn(
                "px-2.5 py-1 rounded cursor-pointer transition-all font-semibold",
                groupBy === 'driver' ? "bg-accent text-accent-foreground font-bold shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              گروه‌بندی راهبران
            </button>
          </div>
        </div>

        {/* Gantt Timeline Map */}
        <div className="overflow-x-auto select-none min-h-[400px]">
          <div className="min-w-[850px] relative flex flex-col">
            
            {/* Timeline hour headers */}
            <div className="flex border-b border-outline-variant bg-surface-container-low/50" dir="ltr">
              <div className="w-24 border-r border-outline-variant flex-shrink-0 py-2 px-3 text-[10px] font-bold text-foreground text-right" dir="rtl">
                {groupBy === 'train' ? 'شماره قطار' : 'نام راهبر'}
              </div>
              <div className="flex-1 relative flex">
                {hoursArray.map((hour) => (
                  <div 
                    key={hour} 
                    className="flex-1 border-r border-outline-variant/40 py-2 text-center text-[10px] font-mono text-foreground-muted"
                  >
                    {toFa(String(hour).padStart(2, '0'))}:۰۰
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline rows */}
            <div className="divide-y divide-outline-variant/60 relative">
              
              {/* Now Line */}
              {nowMinutes >= TIMELINE_START_HOUR * 60 && nowMinutes <= TIMELINE_END_HOUR * 60 && (
                <div className="absolute top-0 bottom-0 left-[96px] right-0 pointer-events-none z-30">
                   <div 
                     className="absolute top-0 bottom-0 flex flex-col items-center -ml-[4px]"
                     style={{ left: `${((nowMinutes - (TIMELINE_START_HOUR * 60)) / TOTAL_MINUTES) * 100}%` }}
                   >
                      <div className="size-2 rounded-full bg-critical shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse -mt-1" />
                      <div className="w-[1.5px] bg-critical/60 h-full shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                   </div>
                </div>
              )}

              {groups.map((group) => (
                <div key={group.id} className="flex hover:bg-surface-container-high/15 transition-colors group/row" dir="ltr">
                  
                  {/* Row Label (Train/Driver name) */}
                  <div className="w-24 border-r border-outline-variant bg-surface-container-low/20 flex-shrink-0 py-3 px-3 text-[10px] font-bold text-foreground truncate text-right flex items-center justify-end gap-1" dir="rtl">
                    {groupBy === 'train' ? <Train className="size-3 text-accent" /> : <User className="size-3 text-info" />}
                    <span>{toFa(group.label)}</span>
                  </div>

                  {/* Row timeline area */}
                  <div className="flex-1 relative h-12 flex items-center">
                    
                    {/* Hour grid vertical lines background */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {hoursArray.map((hour) => (
                        <div key={hour} className="flex-1 border-r border-outline-variant/15 h-full" />
                      ))}
                    </div>

                    {/* Roster trip blocks */}
                    {group.trips.map((trip) => {
                      const block = getTripBlockStyles(trip)
                      
                      return (
                        <button
                          key={trip.id}
                          onClick={() => setSelectedTrip(trip)}
                          style={{ left: block.left, width: block.width }}
                          className={cn(
                            "absolute h-8 rounded-lg border text-[9px] px-2 flex flex-col justify-center items-start overflow-hidden hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer z-10 text-left font-sans select-none",
                            block.className,
                            selectedTrip?.id === trip.id ? "ring-2 ring-accent ring-offset-2 ring-offset-neutral-900 z-20" : ""
                          )}
                          title={`${trip.trainNumber || ''} | ${trip.departureTime || ''} - ${trip.arrivalTime || ''}`}
                        >
                          <div className="flex items-center gap-1 w-full truncate">
                            <span className={cn("size-1.5 rounded-full", block.statusDot)} />
                            <span className="font-bold text-foreground font-mono">
                              {toFa(trip.trainNumber || '')}
                            </span>
                            <span className="text-[8px] opacity-75 font-mono truncate" dir="rtl">
                              {toFa((trip.departureTime || '').slice(0, 5))}
                            </span>
                          </div>
                          
                          <div className="text-[7px] opacity-80 truncate w-full text-right" dir="rtl">
                            {trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'رفت' : 'برگشت'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Legend Panel */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low/40 flex flex-wrap gap-4 text-[10px] text-foreground-muted justify-center">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent/20 border border-accent/60" />
            <span>نرمال (پیش‌رو)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-success/20 border border-success/60 animate-pulse" />
            <span>حرکت کرده / مستقر در کابین</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-warning/20 border border-warning/60" />
            <span>دارای مغایرت / هشدار زمان استراحت</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-critical/20 border border-critical/60" />
            <span>بحرانی / فاقد راهبر اصلی H1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-neutral-800 border border-neutral-700 opacity-60" />
            <span>غیرعملیاتی / شانت / لغو شده</span>
          </div>
        </div>

      </div>

      {/* 2. Side Trip Detail Card */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm p-4 min-h-[400px]">
        {selectedTrip ? (
          <div className="space-y-4 animate-in fade-in duration-150" dir="rtl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <span className="text-[10px] text-foreground-muted">جزئیات سفر ردیف {toFa(selectedTrip.rowNo)}</span>
                <h4 className="text-sm font-bold text-accent font-mono mt-0.5">قطار {toFa(selectedTrip.trainNumber || '—')}</h4>
              </div>
              <span className={cn(
                "px-2 py-0.5 border rounded-full text-[9px] font-bold",
                selectedTrip.status === 'NORMAL' ? "text-success bg-success/10 border-success/20" :
                selectedTrip.status === 'DELAYED' ? "text-warning bg-warning/10 border-warning/20" :
                "text-critical bg-critical/10 border-critical/20"
              )}>
                {selectedTrip.status === 'NORMAL' ? 'فعال' :
                 selectedTrip.status === 'DELAYED' ? 'تاخیر' : 'کنسل'}
              </span>
            </div>

            {/* Time and Route */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground-muted">مسیر حرکت:</span>
                <span className="font-semibold text-foreground">
                  {selectedTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری 📍 تجریش' : 'تجریش 📍 شهرری'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground-muted">ساعت حرکت:</span>
                <span className="font-bold text-success font-mono">
                  {selectedTrip.departureTime ? toFa(selectedTrip.departureTime.slice(0, 5)) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-foreground-muted">ساعت رسیدن:</span>
                <span className="font-bold text-foreground-muted font-mono">
                  {selectedTrip.arrivalTime ? toFa(selectedTrip.arrivalTime.slice(0, 5)) : '—'}
                </span>
              </div>
            </div>

            {/* Crews assigned */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-foreground-muted">وضعیت پرسنل اعزامی:</h5>
              
              {['H1', 'H2', 'T', 'R'].map((role) => {
                const ass = selectedTrip.assignments.find(a => a.role === role)
                const roleLabels: Record<string, string> = {
                  H1: 'راهبر اول (H1)',
                  H2: 'راهبر دوم (H2)',
                  T: 'کمکی T',
                  R: 'کمکی R'
                }

                if (!ass) {
                  return (
                    <div key={role} className="flex justify-between items-center p-2 rounded-lg border border-dashed border-outline-variant text-[11px]">
                      <span className="text-foreground-muted">{roleLabels[role]}</span>
                      <span className={cn(
                        "text-[9px] italic",
                        role === 'H1' ? "text-critical" : "text-foreground-muted/40"
                      )}>
                        {role === 'H1' ? 'فاقد راننده!' : '—'}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={role} className="flex flex-col p-2.5 rounded-lg border border-outline-variant bg-surface-container-low/40 gap-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-foreground">{roleLabels[role]}</span>
                      <span className="text-foreground-muted">{ass.matchedUser?.name || ass.rawName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] border-t border-outline-variant/30 pt-1.5">
                      <div className="flex items-center gap-3">
                        <span className={ass.acknowledgedAt ? "text-success font-semibold" : "text-foreground-muted"}>
                          رویت: {ass.acknowledgedAt ? '✓' : '✗'}
                        </span>
                        <span className={ass.readyAt ? "text-info font-semibold" : "text-foreground-muted"}>
                          آمادگی: {ass.readyAt ? '✓' : '✗'}
                        </span>
                      </div>
                      
                      {ass.disputed && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-warning font-bold bg-warning/10 px-1 border border-warning/20 rounded">دارای مغایرت</span>
                          {isAdmin && (
                            <button
                              disabled={actionLoading !== null}
                              onClick={() => handleResolveDispute(ass.id)}
                              className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-[8px] font-bold cursor-pointer transition-all hover:bg-accent/90"
                            >
                              {actionLoading === ass.id ? '...' : 'تایید/رفع'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Note & Comment */}
            {selectedTrip.operationalNote && (
              <div className="bg-warning/5 border border-warning/10 rounded-lg p-3 text-[11px] leading-relaxed text-foreground-muted flex gap-1.5">
                <Info className="size-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-warning">پیام عملیاتی:</span> {selectedTrip.operationalNote}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isAdmin && onCommentClick && (
              <button
                onClick={() => onCommentClick(selectedTrip.id, selectedTrip.operationalNote, selectedTrip.status)}
                className="w-full py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high rounded-lg text-xs font-bold text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <MessageSquare className="size-4 text-accent" />
                <span>ثبت پیام عملیاتی / تاخیر قطار</span>
              </button>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-foreground-muted">
            <Clock className="size-10 text-outline-variant mb-2 animate-pulse" />
            <h4 className="text-xs font-bold text-foreground">جزئیات سفر</h4>
            <p className="text-[10px] max-w-[150px] mt-1 leading-relaxed">
              برای مشاهده جزئیات، زمان‌بندی و راهبران، بر روی یکی از سفرهای قطار در جدول گراف کلیک کنید.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
