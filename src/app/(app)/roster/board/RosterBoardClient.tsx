'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { jdate } from '@/lib/dayjs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/features/auth'

import { RegionalBoard } from '@/features/roster/components/RegionalBoard'
import { SearchFilterBar, FilterState } from '@/features/roster/components/ui/SearchFilterBar'
import { useRosterSearch } from '@/features/roster/hooks/useRosterSearch'
import { PendingSwapsList } from '@/components/roster/PendingSwapsList'

export default function RosterBoardClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [trips, setTrips] = useState<any[]>([])
  
  // Universal Search Filters
  const [filters, setFilters] = useState<FilterState>({
    query: searchParams.get('q') || '',
    direction: (searchParams.get('dir') as 'ALL' | 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY') || 'ALL',
    onlyAmended: searchParams.get('amended') === 'true',
    onlyConflicts: searchParams.get('conflicts') === 'true',
  })

  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated() && isAuthenticated && user) {
      if (user.roleKey !== 'supervisor' && user.roleKey !== 'occ' && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
        toast.error('شما دسترسی کافی برای مشاهده تابلوی ناحیه را ندارید')
        router.push('/dashboard')
      }
    }
  }, [user, isAuthenticated, router])

  useEffect(() => {
    fetchBoardData()
  }, [])

  const fetchBoardData = async () => {
    try {
      const today = jdate().format('YYYY/MM/DD')
      const token = useAuthStore.getState().accessToken
      const res = await fetch(`/api/roster/day/${encodeURIComponent(today)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (res.ok && data.trips) {
        setTrips(data.trips)
      } else if (res.ok) {
        // empty
        setTrips([])
      } else {
        toast.error(data.error || 'خطا در دریافت اطلاعات لوحه')
      }
    } catch (err) {
      toast.error('خطای شبکه')
    } finally {
      setLoading(false)
    }
  }

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

  // Filter trips locally
  const filteredTrips = useRosterSearch(trips, filters)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-xl bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ms-3 text-foreground-muted font-medium">در حال دریافت داده‌های زنده ناحیه...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Toolbar */}
      <div className="bg-surface p-4 border border-outline-variant rounded-xl shadow-sm">
        <SearchFilterBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          resultCount={filteredTrips.length}
        />
      </div>

      {/* Pending Swaps Review Board */}
      <PendingSwapsList />

      {/* Board */}
      <RegionalBoard 
        trips={filteredTrips} 
        issues={[]} // we could pass validation issues if API provides them
        // Internal search logic of RegionalBoard is disabled as we filter before passing
      />
    </div>
  )
}
