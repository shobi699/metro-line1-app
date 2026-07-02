import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../shared/config'

export interface LeaveRequest {
  id: string
  userId: string
  type: string
  fromDate: string
  toDate: string
  reason?: string
  amount?: number
  unit?: string
  calculatedAmount?: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
}

interface LeaveState {
  leaves: LeaveRequest[]
  isLoading: boolean
  
  fetchLeaves: (token: string, monthPrefix?: string) => Promise<void>
  addLeave: (token: string, leave: Omit<LeaveRequest, 'id' | 'userId' | 'status'>) => Promise<boolean>
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  leaves: [],
  isLoading: false,

  async fetchLeaves(token: string, monthPrefix?: string) {
    set({ isLoading: true })
    try {
      const url = monthPrefix ? `${API_URL}/api/leaves?month=${monthPrefix}` : `${API_URL}/api/leaves`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        set({ leaves: json.data || [] })
      }
    } catch (e) {
      console.error('fetchLeaves err:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  async addLeave(token: string, leave) {
    try {
      const res = await fetch(`${API_URL}/api/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(leave)
      })
      if (res.ok) {
        const json = await res.json()
        set({ leaves: [json.data, ...get().leaves] })
        return true
      }
      return false
    } catch (e) {
      console.error('addLeave err:', e)
      return false
    }
  }
}))
