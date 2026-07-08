import { useState, useMemo } from 'react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { Search, Columns, Settings, AlertTriangle, User, Train } from 'lucide-react'

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

interface RegionalBoardProps {
  trips: Trip[]
  issues?: ValidationIssue[]
  searchQuery?: string
  onCrewClick?: (trip: Trip, role: string) => void
}

const AVAILABLE_COLUMNS = [
  { id: 'rowNo', label: 'ردیف' },
  { id: 'trainNumber', label: 'قطار' },
  { id: 'direction', label: 'مسیر' },
  { id: 'departureTime', label: 'اعزام' },
  { id: 'arrivalTime', label: 'رسید' },
  { id: 'H1', label: 'H1 (راهبر)' },
  { id: 'H2', label: 'H2' },
  { id: 'T', label: 'T' },
  { id: 'R', label: 'R' },
  { id: 'status', label: 'وضعیت' }
]

export function RegionalBoard({
  trips,
  issues = [],
  searchQuery = '',
  onCrewClick
}: RegionalBoardProps) {
  const [visibleCols, setVisibleCols] = useState<string[]>(['rowNo', 'trainNumber', 'direction', 'departureTime', 'H1', 'status'])
  const [colChooserOpen, setColChooserOpen] = useState(false)

  const filteredTrips = useMemo(() => {
    if (!searchQuery) return trips
    const q = searchQuery.toLowerCase()
    return trips.filter(t => {
      const tNum = t.trainNumber?.toLowerCase() || ''
      const names = t.assignments.map(a => (a.matchedUser?.name || a.rawName || '').toLowerCase()).join(' ')
      return tNum.includes(q) || names.includes(q)
    })
  }, [trips, searchQuery])

  const toggleColumn = (colId: string) => {
    setVisibleCols(prev => 
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    )
  }

  const getCrewName = (trip: Trip, role: string) => {
    const ass = trip.assignments.find(a => a.role === role)
    if (!ass) return '—'
    return ass.matchedUser?.name || ass.rawName || '—'
  }

  const hasIssues = (tripId: string) => {
    return issues.some(iss => iss.affectedTripId === tripId && (iss.severity === 'CRITICAL' || iss.severity === 'ERROR'))
  }

  return (
    <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col relative min-h-[400px]">
      {/* Header toolbar */}
      <div className="flex justify-between items-center p-3 border-b border-outline-variant bg-surface-container/50">
        <div className="flex items-center gap-2">
          <Settings className="size-4 text-accent" />
          <h3 className="text-xs font-bold text-foreground">تابلوی ناحیه (Regional Board)</h3>
          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full mr-2">
            {toFa(filteredTrips.length)} سفر
          </span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setColChooserOpen(!colChooserOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Columns className="size-3.5" />
            انتخاب ستون‌ها
          </button>

          {colChooserOpen && (
            <div className="absolute top-full mt-1 left-0 w-48 bg-surface border border-outline-variant shadow-lg rounded-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-foreground-muted mb-2 px-1">ستون‌های نمایشی</div>
              <div className="space-y-1">
                {AVAILABLE_COLUMNS.map(col => (
                  <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-container rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={visibleCols.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded border-outline-variant text-accent focus:ring-accent cursor-pointer"
                    />
                    <span className="text-xs font-medium text-foreground select-none">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-right text-xs">
          <thead className="bg-surface-container-low text-foreground-muted sticky top-0 z-10 border-b border-outline-variant shadow-sm">
            <tr>
              {AVAILABLE_COLUMNS.map(col => (
                visibleCols.includes(col.id) && (
                  <th key={col.id} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {filteredTrips.map(trip => {
              const isProblematic = hasIssues(trip.id)
              
              return (
                <tr 
                  key={trip.id} 
                  className={cn(
                    "hover:bg-surface-container-high/30 transition-colors",
                    isProblematic ? "bg-critical/10 hover:bg-critical/20" : ""
                  )}
                >
                  {AVAILABLE_COLUMNS.map(col => {
                    if (!visibleCols.includes(col.id)) return null
                    
                    let content: React.ReactNode = null
                    let isClickable = false
                    
                    switch (col.id) {
                      case 'rowNo':
                        content = toFa(trip.rowNo)
                        break
                      case 'trainNumber':
                        content = <span className="font-bold text-accent">{toFa(trip.trainNumber || '—')}</span>
                        break
                      case 'direction':
                        content = trip.direction === 'TAJRISH_TO_SHAHRREY' ? 'تجریش → ری' : 'ری → تجریش'
                        break
                      case 'departureTime':
                        content = <span className="font-mono font-bold text-foreground">{toFa(trip.departureTime?.substring(0,5) || '—')}</span>
                        break
                      case 'arrivalTime':
                        content = <span className="font-mono text-foreground-muted">{toFa(trip.arrivalTime?.substring(0,5) || '—')}</span>
                        break
                      case 'status':
                        content = (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold inline-block min-w-[60px] text-center",
                            trip.status === 'CANCELLED' ? "bg-neutral-800 text-neutral-400" :
                            isProblematic ? "bg-critical text-critical-on" :
                            "bg-success/20 text-success"
                          )}>
                            {trip.status === 'CANCELLED' ? 'لغو شده' : isProblematic ? 'نقص خدمه' : 'عادی'}
                          </span>
                        )
                        break
                      case 'H1':
                      case 'H2':
                      case 'T':
                      case 'R':
                        isClickable = true
                        const name = getCrewName(trip, col.id)
                        content = (
                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            {col.id === 'H1' ? <Train className="size-3 text-foreground-muted" /> : <User className="size-3 text-foreground-muted opacity-60" />}
                            <span className={cn("truncate", name === '—' && "text-critical font-bold opacity-80")}>{name}</span>
                          </div>
                        )
                        break
                    }

                    return (
                      <td 
                        key={col.id} 
                        className={cn(
                          "py-2.5 px-3 align-middle",
                          isClickable && "cursor-pointer hover:bg-accent/10 transition-colors border-l border-r border-transparent hover:border-accent/20"
                        )}
                        onClick={() => {
                          if (isClickable && onCrewClick) onCrewClick(trip, col.id)
                        }}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            
            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length} className="py-12 text-center text-foreground-muted">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Search className="size-8 opacity-20" />
                    <p className="text-sm font-semibold">هیچ سفری با این جستجو یافت نشد.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
