import { useMemo } from 'react'
import { FilterState } from '../components/ui/SearchFilterBar'

// Helpers to format Persian numbers for comparison
function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  const arabicYe = 'ي'
  const persianYe = 'ی'
  const arabicKe = 'ك'
  const persianKe = 'ک'
  
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g]
  const arabicDigits  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g]
  
  let normalized = text.toLowerCase()
    .replace(new RegExp(arabicYe, 'g'), persianYe)
    .replace(new RegExp(arabicKe, 'g'), persianKe)
    
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i))
  }
  return normalized.trim()
}

// We assume Trip has these basic fields based on our UI components
export interface SearchableTrip {
  id: string
  trainNumber: string | null
  direction: 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'
  departureTime: string | null
  arrivalTime: string | null
  status: string
  isAmended?: boolean
  hasConflict?: boolean
  assignments?: {
    name: string
    role: string
    personnelNo?: string
  }[]
  [key: string]: any // allow other fields
}

export function useRosterSearch<T extends SearchableTrip>(
  trips: T[],
  filters: FilterState
) {
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // 1. Chip Filters (AND logic)
      if (filters.direction !== 'ALL' && trip.direction !== filters.direction) return false
      if (filters.onlyAmended && !trip.isAmended) return false
      if (filters.onlyConflicts && !trip.hasConflict) return false

      // 2. Universal Search
      const query = normalizeText(filters.query)
      if (!query) return true

      // Detect potential query type heuristically
      const isTimeQuery = query.includes(':') || /^\d{2}$/.test(query)
      const isTrainQuery = /^\d{1,3}$/.test(query) && !query.includes(':')
      
      // Match Train Number
      if (isTrainQuery || !isTimeQuery) {
        if (normalizeText(trip.trainNumber).includes(query)) return true
      }

      // Match Time
      if (isTimeQuery || !isTrainQuery) {
        if (normalizeText(trip.departureTime).includes(query) || normalizeText(trip.arrivalTime).includes(query)) return true
      }

      // Match Stations
      const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
      const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
      if (normalizeText(origin).includes(query) || normalizeText(dest).includes(query)) return true

      // Match Status
      const statusFarsi = trip.status === 'CANCELLED' ? 'لغو' : 
                          trip.status === 'EMPTY' ? 'خالی' : 
                          trip.status === 'DEPOT' ? 'دپو' : 
                          trip.status === 'SPECIAL' ? 'فوق' : 'عادی'
      if (normalizeText(statusFarsi).includes(query)) return true

      // Match Crew
      if (trip.assignments) {
        for (const a of trip.assignments) {
          if (
            normalizeText(a.name).includes(query) || 
            normalizeText(a.personnelNo).includes(query) || 
            normalizeText(a.role).includes(query)
          ) {
            return true
          }
        }
      }

      return false
    })
  }, [trips, filters])

  return filteredTrips
}
