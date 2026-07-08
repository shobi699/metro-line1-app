'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Calendar as CalendarIcon, ArrowRight, CheckCircle } from 'lucide-react'
import { jalali } from '@/lib/fa'
import { toast } from 'sonner'
import Link from 'next/link'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

import { TripDetailsSheet } from '@/features/roster/components/TripDetailsSheet'
import { NextDepartureHero } from '@/features/roster/components/NextDepartureHero'
import { TripCard, TripAssignmentData } from '@/features/roster/components/TripCard'
import { SearchFilterBar, FilterState } from '@/features/roster/components/ui/SearchFilterBar'
import { useRosterSearch } from '@/features/roster/hooks/useRosterSearch'

// Mock fetching logic, reusing our types
function MyDayPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<any[]>([])
  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    query: searchParams.get('q') || '',
    direction: (searchParams.get('dir') as 'ALL' | 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY') || 'ALL',
    onlyAmended: searchParams.get('amended') === 'true',
    onlyConflicts: searchParams.get('conflicts') === 'true',
  })

  // Trip Details Sheet State
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Whenever local filters state changes, update the URL (debounce or push directly)
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    if (newFilters.query) params.set('q', newFilters.query)
    if (newFilters.direction && newFilters.direction !== 'ALL') params.set('dir', newFilters.direction)
    if (newFilters.onlyAmended) params.set('amended', 'true')
    if (newFilters.onlyConflicts) params.set('conflicts', 'true')
    
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }

  useEffect(() => {
    fetchMyDay()
  }, [])

  const fetchMyDay = async () => {
    try {
      const today = jalali(new Date())
      const res = await fetch(`/api/roster/my/${today}`)
      const data = await res.json()
      if (res.ok) {
        setTrips(data.trips || [])
      } else {
        toast.error(data.error || 'خطا در دریافت برنامه لوحه')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setLoading(false)
    }
  }

  // Find Next Departure
  const nextTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null
    // Find first trip that hasn't arrived/completed yet
    // For simplicity, we just find the first one that doesn't have handoverAt
    return trips.find(t => !t.handoverAt) || trips[0]
  }, [trips])

  // Use the search hook
  const filteredTrips = useRosterSearch(trips, filters)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ms-2 text-muted-foreground">در حال بارگذاری روز من...</span>
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">روز من</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">امروز سفری ندارید</h2>
            <p className="text-muted-foreground">
              هیچ اعزامی برای شما در لوحه‌ی امروز ثبت نشده است. در صورت نیاز با برنامه‌ریز یا سرشیفت تماس بگیرید.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">برنامه روز من</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            شما {trips.length} اعزام در لوحه امروز دارید
          </p>
        </div>
      </div>

      {/* Next Departure Hero */}
      {nextTrip && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <NextDepartureHero 
            id={nextTrip.id}
            trainNumber={nextTrip.trainNumber}
            direction={nextTrip.direction}
            departureTime={nextTrip.departureTime}
            myRole={nextTrip.myRole}
            status={nextTrip.status}
            amendmentNumber={nextTrip.isAmended ? 1 : undefined} // Assuming 1 for UI mock if boolean
            isAmended={nextTrip.isAmended}
            operationalNote={nextTrip.operationalNote}
            onClick={() => {
              setSelectedTrip(nextTrip)
              setIsSheetOpen(true)
            }}
            coworkers={(nextTrip.coCrew || []).map((c: any, idx: number) => ({
              id: String(idx),
              role: c.role,
              name: c.name || 'تخصیص‌نیافته'
            }))}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-4 pb-2 border-b">
        <SearchFilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          resultCount={filteredTrips.length} 
        />
      </div>

      {/* Trips List */}
      <div className="space-y-4 mt-6">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-muted/20">
            <p className="text-muted-foreground">موردی مطابق جستجوی شما یافت نشد.</p>
          </div>
        ) : (
          filteredTrips.map(trip => (
            <TripCard
              key={trip.id}
              id={trip.id}
              trainNumber={trip.trainNumber}
              direction={trip.direction}
              departureTime={trip.departureTime}
              arrivalTime={trip.arrivalTime}
              status={trip.status}
              isPast={!!trip.handoverAt}
              isAmended={trip.isAmended}
              amendmentNumber={trip.isAmended ? 1 : undefined}
              operationalNote={trip.operationalNote}
              myRole={trip.myRole}
              onClick={() => {
                setSelectedTrip(trip)
                setIsSheetOpen(true)
              }}
              assignments={(trip.coCrew || []).map((c: any, idx: number) => ({
                id: String(idx),
                role: c.role,
                name: c.name || 'تخصیص‌نیافته'
              }))}
            />
          ))
        )}
      </div>

      <TripDetailsSheet 
        trip={selectedTrip ? {
          ...selectedTrip,
          assignments: (selectedTrip.coCrew || []).map((c: any, idx: number) => ({
            id: String(idx),
            role: c.role,
            name: c.name || 'تخصیص‌نیافته'
          }))
        } : null} 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />

    </div>
  )
}

export default function MyDayPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ms-2 text-muted-foreground">در حال آماده‌سازی...</span>
      </div>
    }>
      <MyDayPageContent />
    </React.Suspense>
  )
}
