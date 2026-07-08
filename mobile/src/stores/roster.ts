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
              newDays[day.jalaliDate] = day
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
        // Return from cache first (instant)
        const state = get()
        const cachedDay = state.myDays[jalaliDate]
        
        // Background sync to update
        try {
          // If we had ETag support in cachedFetch we would use it here.
          // For now just fetch normally and update cache.
          const response = await cachedFetch<MyRosterPayload>(`/roster/my/${jalaliDate}`)
          
          // Wait, the API returns the bare payload. If not found, it returns an empty object with nextDepartureTime: null
          if (response && response.rosterDayId) {
            set((prev) => ({
              myDays: {
                ...prev.myDays,
                [jalaliDate]: response
              }
            }))
            return response
          }
        } catch (err) {
          // Ignore background fetch error
        }

        return cachedDay || null
      },

      clearCache: () => set({ myDays: {}, lastSyncAt: null }),

      acknowledgeTrip: async (jalaliDate, tripId) => {
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[jalaliDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [jalaliDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, acknowledgedAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/receipt`, { method: 'POST' })
      },

      readyTrip: async (jalaliDate, tripId) => {
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[jalaliDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [jalaliDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, readyAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/ready`, { method: 'POST' })
      },

      handoverTrip: async (jalaliDate, tripId) => {
        const now = new Date().toISOString()
        set((state) => {
          const day = state.myDays[jalaliDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [jalaliDate]: {
                ...day,
                trips: day.trips.map(t => t.id === tripId ? { ...t, handoverAt: now } : t)
              }
            }
          }
        })
        await cachedFetch(`/trips/${tripId}/cabin-handover`, { method: 'POST' })
      },

      disputeTrip: async (jalaliDate, tripId, note) => {
        set((state) => {
          const day = state.myDays[jalaliDate]
          if (!day) return state
          return {
            myDays: {
              ...state.myDays,
              [jalaliDate]: {
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
