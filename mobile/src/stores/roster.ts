import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { cachedFetch } from '../shared/cached-fetch'

export interface MyRosterTrip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: string
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  status: string
  operationalNote: string | null
  myRole: string
  assignmentId: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  coCrew: { role: string; name: string | null }[]
}

export interface MyRosterPayload {
  jalaliDate: string
  gregorianDate: string
  title: string | null
  schedulingTitle: string | null
  versionNo: number
  rosterDayId: string
  rosterVersionId: string
  trips: MyRosterTrip[]
  totalTrips: number
  nextDepartureTime: string | null
}

interface RosterState {
  myDays: Record<string, MyRosterPayload>
  lastSyncAt: string | null
  loading: boolean
  error: string | null

  // Actions
  syncUpcoming: () => Promise<void>
  getDay: (jalaliDate: string) => Promise<MyRosterPayload | null>
  clearCache: () => void

  acknowledgeTrip: (jalaliDate: string, tripId: string) => Promise<void>
  readyTrip: (jalaliDate: string, tripId: string) => Promise<void>
  handoverTrip: (jalaliDate: string, tripId: string) => Promise<void>
  disputeTrip: (jalaliDate: string, tripId: string, note: string) => Promise<void>
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      myDays: {},
      lastSyncAt: null,
      loading: false,
      error: null,

      syncUpcoming: async () => {
        set({ loading: true, error: null })
        try {
          const response = await cachedFetch<{ days: MyRosterPayload[] }>('/roster/my/upcoming?days=7')
          if (response && response.days) {
            const newDays = { ...get().myDays }
            for (const day of response.days) {
              const dashedDate = day.jalaliDate.replace(/\//g, '-')
              newDays[dashedDate] = {
                ...day,
                jalaliDate: dashedDate
              }
            }
            set({
              myDays: newDays,
              lastSyncAt: new Date().toISOString(),
              loading: false
            })
          } else {
            set({ loading: false })
          }
        } catch (err: any) {
          set({ error: err.message || 'خطا در همگام‌سازی', loading: false })
        }
      },

      getDay: async (jalaliDate: string) => {
        const dashedDate = jalaliDate.replace(/\//g, '-')
        // Return from cache first (instant)
        const state = get()
        const cachedDay = state.myDays[dashedDate]
        
        // Background sync to update
        try {
          const response = await cachedFetch<MyRosterPayload>(`/roster/my/${dashedDate}`)
          
          if (response && response.rosterDayId) {
            const normalizedPayload = {
              ...response,
              jalaliDate: dashedDate
            }
            set((prev) => ({
              myDays: {
                ...prev.myDays,
                [dashedDate]: normalizedPayload
              }
            }))
            return normalizedPayload
          }
        } catch (err) {
          // Ignore background fetch error
        }

        return cachedDay || null
      },

      clearCache: () => set({ myDays: {}, lastSyncAt: null }),

      acknowledgeTrip: async (jalaliDate, tripId) => {
        const dashedDate = jalaliDate.replace(/\//g, '-')
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[dashedDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [dashedDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, acknowledgedAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/receipt`, { method: 'POST' })
      },

      readyTrip: async (jalaliDate, tripId) => {
        const dashedDate = jalaliDate.replace(/\//g, '-')
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[dashedDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [dashedDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, readyAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/ready`, { method: 'POST' })
      },

      handoverTrip: async (jalaliDate, tripId) => {
        const dashedDate = jalaliDate.replace(/\//g, '-')
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[dashedDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [dashedDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, handoverAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/cabin-handover`, { method: 'POST' })
      },

      disputeTrip: async (jalaliDate, tripId, note) => {
        const dashedDate = jalaliDate.replace(/\//g, '-')
        set((state) => {
          const day = state.myDays[dashedDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [dashedDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, disputed: true, disputeNote: note } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/dispute`, { 
          method: 'POST',
          body: JSON.stringify({ disputeNote: note })
        })
      }

    }),
    {
      name: 'roster-v2-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
