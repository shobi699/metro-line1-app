'use client'

import { ShiftCalendar } from '@/components/shared/shift-calendar'

export default function AdminShiftsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold tracking-tight">
        تقویم شیفت (مدیریت)
      </h1>
      <ShiftCalendar isAdmin />
    </div>
  )
}
