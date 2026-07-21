import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Ticket {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  wagonCode: string | null
  photoUrl: string | null
  annotations: string | null
  createdAt: string
  creator: { id: string; name: string; personnelCode: string }
  _count: { logs: number }
}

interface TicketStats {
  open: number
  inProgress: number
  resolved: number
  closed: number
  total: number
}

interface TicketsState {
  tickets: Ticket[]
  stats: TicketStats
  loading: boolean
  statusFilter: string
  setTickets: (tickets: Ticket[]) => void
  setStats: (stats: TicketStats) => void
  setLoading: (loading: boolean) => void
  setStatusFilter: (filter: string) => void
}

export const useTicketsStore = create<TicketsState>()(
  persist(
    (set) => ({
      tickets: [],
      stats: { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 },
      loading: true,
      statusFilter: '',
      setTickets: (tickets) => set({ tickets }),
      setStats: (stats) => set({ stats }),
      setLoading: (loading) => set({ loading }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
    }),
    {
      name: 'metro-line1-tickets-storage',
    },
  ),
)
