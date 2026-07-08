'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, SlidersHorizontal, FilterX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type FilterState = {
  query: string
  direction: 'ALL' | 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'
  onlyAmended: boolean
  onlyConflicts: boolean
}

interface SearchFilterBarProps {
  filters: FilterState
  onFilterChange: (newFilters: FilterState) => void
  resultCount?: number
  className?: string
}

export function SearchFilterBar({ filters, onFilterChange, resultCount, className }: SearchFilterBarProps) {
  
  const updateFilter = (updates: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...updates })
  }

  const activeFilterCount = (filters.direction !== 'ALL' ? 1 : 0) + (filters.onlyAmended ? 1 : 0) + (filters.onlyConflicts ? 1 : 0)

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input 
          type="text"
          className="ps-10 h-12 bg-background/60 backdrop-blur-md border-border/50 focus-visible:ring-primary/20 text-base"
          placeholder="جستجو در قطار، نام، ساعت (مثال: ۱۱۸، رضایی، ۱۴:)"
          value={filters.query}
          onChange={(e) => updateFilter({ query: e.target.value })}
        />
        {filters.query && (
          <button 
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => updateFilter({ query: '' })}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-e pe-2 me-1 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>فیلترها</span>
        </div>

        {/* Direction Chips */}
        <Badge 
          variant={filters.direction === 'ALL' ? 'default' : 'outline'}
          className="cursor-pointer shrink-0 transition-colors"
          onClick={() => updateFilter({ direction: 'ALL' })}
        >
          همه مسیرها
        </Badge>
        <Badge 
          variant={filters.direction === 'SHAHRREY_TO_TAJRISH' ? 'default' : 'outline'}
          className="cursor-pointer shrink-0 transition-colors"
          onClick={() => updateFilter({ direction: 'SHAHRREY_TO_TAJRISH' })}
        >
          شهرری ← تجریش
        </Badge>
        <Badge 
          variant={filters.direction === 'TAJRISH_TO_SHAHRREY' ? 'default' : 'outline'}
          className="cursor-pointer shrink-0 transition-colors"
          onClick={() => updateFilter({ direction: 'TAJRISH_TO_SHAHRREY' })}
        >
          تجریش ← شهرری
        </Badge>

        {/* Special Filters */}
        <Badge 
          variant={filters.onlyAmended ? 'default' : 'outline'}
          className={cn("cursor-pointer shrink-0 transition-colors", filters.onlyAmended && "bg-orange-500 hover:bg-orange-600 text-white border-transparent")}
          onClick={() => updateFilter({ onlyAmended: !filters.onlyAmended })}
        >
          ▲ فقط تغییرکرده
        </Badge>
        
        <Badge 
          variant={filters.onlyConflicts ? 'destructive' : 'outline'}
          className="cursor-pointer shrink-0 transition-colors"
          onClick={() => updateFilter({ onlyConflicts: !filters.onlyConflicts })}
        >
          ⚠️ فقط مشکل‌دار
        </Badge>

        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0 ms-auto"
            onClick={() => updateFilter({ direction: 'ALL', onlyAmended: false, onlyConflicts: false, query: '' })}
          >
            <FilterX className="h-3.5 w-3.5 me-1" />
            پاک‌کردن
          </Button>
        )}
      </div>
      
      {resultCount !== undefined && (
        <div className="text-xs text-muted-foreground px-1">
          {resultCount} نتیجه یافت شد
        </div>
      )}
    </div>
  )
}
