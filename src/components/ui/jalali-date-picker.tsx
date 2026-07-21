"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { jdate, gregStr } from "@/lib/dayjs"
import { toFa, jalali } from "@/lib/fa"

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
]

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

interface JalaliDatePickerProps {
  value?: string // format: YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ...",
  className,
  id,
  disabled = false,
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Parse current value or default to today in Jalali calendar
  const initialDate = React.useMemo(() => {
    if (value) {
      const parsed = jdate(value)
      if (parsed.isValid()) return parsed
    }
    return jdate()
  }, [value])

  // View state keeps track of the month/year currently showing in calendar
  const [viewDate, setViewDate] = React.useState(() => initialDate)

  // Sync viewDate when popover opens or value changes
  React.useEffect(() => {
    if (isOpen) {
      setViewDate(initialDate)
    }
  }, [isOpen, initialDate])

  const handlePrevMonth = () => {
    setViewDate((prev) => prev.subtract(1, "month"))
  }

  const handleNextMonth = () => {
    setViewDate((prev) => prev.add(1, "month"))
  }

  const handleMonthChange = (month: number) => {
    setViewDate((prev) => prev.month(month))
  }

  const handleYearChange = (year: number) => {
    setViewDate((prev) => prev.year(year))
  }

  const handleSelectDay = (day: number) => {
    const selected = viewDate.date(day)
    onChange(gregStr(selected))
    setIsOpen(false)
  }

  const handleGoToToday = () => {
    const today = jdate()
    onChange(gregStr(today))
    setViewDate(today)
    setIsOpen(false)
  }

  // Generate range of years (-15 to +10 from current view year)
  const years = React.useMemo(() => {
    const currentYear = jdate().year()
    const list: number[] = []
    for (let y = currentYear - 15; y <= currentYear + 10; y++) {
      list.push(y)
    }
    return list
  }, [])

  // Calculate calendar grid parameters
  const grid = React.useMemo(() => {
    const firstDay = viewDate.date(1)
    const firstDayOfWeek = (firstDay.day() + 1) % 7 // Saturday=0 ... Friday=6
    const daysInMonth = viewDate.daysInMonth()

    const cells: (number | null)[] = []
    // Add empty placeholders before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null)
    }
    // Add actual days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d)
    }

    return cells
  }, [viewDate])

  // Selected date parsed value (for highlighting in grid)
  const selectedParsed = React.useMemo(() => {
    if (!value) return null
    const parsed = jdate(value)
    return parsed.isValid() ? parsed : null
  }, [value])

  const isSelected = (day: number) => {
    if (!selectedParsed) return false
    return (
      selectedParsed.date() === day &&
      selectedParsed.month() === viewDate.month() &&
      selectedParsed.year() === viewDate.year()
    )
  }

  const isToday = (day: number) => {
    const today = jdate()
    return (
      today.date() === day &&
      today.month() === viewDate.month() &&
      today.year() === viewDate.year()
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button
          id={id}
          type="button"
          disabled={disabled}
          variant="outline"
          className={cn(
            "w-full justify-start text-right font-data-mono h-10 border-border bg-background px-3 font-normal cursor-pointer focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ms-0 me-2 size-4 text-foreground-muted" />
          <span className="flex-1 text-start">
            {value ? jalali(value) : placeholder}
          </span>
        </Button>
      } />
      <PopoverContent className="w-72 p-3 bg-popover border border-border rounded-xl shadow-lg select-none" align="start">
        {/* Header Controls */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 text-foreground hover:bg-muted/70 rounded-lg cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            <select
              value={viewDate.month()}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="bg-surface border border-border/40 text-xs font-bold text-foreground focus:outline-none focus:border-accent cursor-pointer rounded-lg px-2 py-1"
            >
              {JALALI_MONTHS.map((name, idx) => (
                <option key={idx} value={idx} className="bg-popover text-foreground">
                  {name}
                </option>
              ))}
            </select>
            <select
              value={viewDate.year()}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="bg-surface border border-border/40 text-xs font-bold text-foreground focus:outline-none focus:border-accent cursor-pointer rounded-lg px-2 py-1 font-data-mono"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-popover text-foreground">
                  {toFa(y)}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 text-foreground hover:bg-muted/70 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
          {/* Weekday headers */}
          {WEEKDAYS.map((day, idx) => (
            <div key={idx} className="text-[10px] font-bold text-foreground-muted py-1">
              {day}
            </div>
          ))}

          {/* Grid cells */}
          {grid.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="h-8" />
            }

            const selected = isSelected(day)
            const today = isToday(day)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "h-8 text-xs font-data-mono font-medium rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-muted/70",
                  selected && "bg-accent text-accent-foreground hover:bg-accent/90 font-bold",
                  today && !selected && "border border-accent text-accent font-bold"
                )}
              >
                {toFa(day)}
              </button>
            )
          })}
        </div>

        {/* Footer: Today button */}
        <div className="border-t border-border/30 pt-2 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGoToToday}
            className="text-[10px] font-bold text-accent hover:bg-accent/10 h-7 w-full cursor-pointer"
          >
            انتخاب امروز ({jalali(new Date().toISOString())})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
