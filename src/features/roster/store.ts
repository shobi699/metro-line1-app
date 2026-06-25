import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Shift {
  id: string
  date: string
  code: string
  note: string | null
  user?: { id: string; name: string; nationalId: string }
}

interface RosterState {
  shifts: Shift[]
  loading: boolean
  currentMonth: number
  currentYear: number
  setShifts: (shifts: Shift[]) => void
  setLoading: (loading: boolean) => void
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set) => ({
      shifts: [],
      loading: true,
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
      setShifts: (shifts) => set({ shifts }),
      setLoading: (loading) => set({ loading }),
      setCurrentMonth: (currentMonth) => set({ currentMonth }),
      setCurrentYear: (currentYear) => set({ currentYear }),
    }),
    {
      name: 'metro-line1-roster-storage',
    },
  ),
)
