import { create } from 'zustand'
import { cachedFetch } from '../shared/cached-fetch'

export interface FormField {
  name: string
  label: string
  type: string
  required: boolean
  options?: string[]
  visibleWhen?: { field: string; equals: string | boolean }
}

export interface FormTemplate {
  id: string
  key: string
  title: string
  description: string | null
  category: string | null
  icon: string | null
  allowMobile: boolean
}

export interface FormSubmission {
  id: string
  submissionNo: number
  status: string
  currentStage: string | null
  submitter?: { name: string; nationalId: string }
  template: { title: string; key: string }
  submittedAt: string
  createdAt: string
}

interface FormsState {
  // Available forms to fill
  templates: FormTemplate[]
  templatesLoading: boolean
  
  // User's submitted forms
  mySubmissions: FormSubmission[]
  mySubmissionsLoading: boolean

  // Inbox (forms waiting for current user action)
  inbox: FormSubmission[]
  inboxLoading: boolean

  fetchTemplates: () => Promise<void>
  fetchMySubmissions: () => Promise<void>
  fetchInbox: () => Promise<void>
  getFormByKey: (key: string) => Promise<any>
  submitForm: (key: string, data: any) => Promise<{ success: boolean; error?: string }>
  getSubmissionDetails: (id: string) => Promise<any>
  submitFormAction: (id: string, actionData: { decision: string, note?: string, referTo?: string }) => Promise<{ success: boolean; error?: string }>
}

export const useFormsStore = create<FormsState>((set, get) => ({
  templates: [],
  templatesLoading: false,
  mySubmissions: [],
  mySubmissionsLoading: false,
  inbox: [],
  inboxLoading: false,

  fetchTemplates: async () => {
    set({ templatesLoading: true })
    try {
      const res = await cachedFetch('/api/forms') as any
      if (res.ok) {
        set({ templates: res.data?.data || [] })
      }
    } catch (err) {
      console.warn('Error fetching forms', err)
    } finally {
      set({ templatesLoading: false })
    }
  },

  fetchMySubmissions: async () => {
    set({ mySubmissionsLoading: true })
    try {
      const res = await cachedFetch('/api/forms/submissions/my') as any
      if (res.ok) {
        set({ mySubmissions: res.data?.data || [] })
      }
    } catch (err) {
      console.warn('Error fetching my submissions', err)
    } finally {
      set({ mySubmissionsLoading: false })
    }
  },

  fetchInbox: async () => {
    set({ inboxLoading: true })
    try {
      const res = await cachedFetch('/api/forms/inbox') as any
      if (res.ok) {
        set({ inbox: res.data?.data || [] })
      }
    } catch (err) {
      console.warn('Error fetching inbox', err)
    } finally {
      set({ inboxLoading: false })
    }
  },

  getFormByKey: async (key: string) => {
    try {
      const res = await cachedFetch(`/api/forms/${key}`) as any
      if (res.ok) {
        return res.data?.data
      }
      return null
    } catch (err) {
      console.warn('Error fetching form by key', err)
      return null
    }
  },

  submitForm: async (key: string, data: any) => {
    try {
      // For submission we use normal fetch because we don't want caching
      const authStore = require('./auth').useAuthStore.getState()
      const token = authStore.accessToken
      if (!token) throw new Error('عدم احراز هویت')

      const API_URL = require('../shared/config').API_URL
      const res = await fetch(`${API_URL}/api/forms/${key}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const json = await res.json()
      if (res.ok) {
        return { success: true }
      } else {
        return { success: false, error: json.error || 'خطا در ثبت فرم' }
      }
    } catch (err: any) {
      console.warn('Error submitting form', err)
      return { success: false, error: err instanceof Error ? err.message : 'خطای سرور' }
    }
  },

  getSubmissionDetails: async (id: string) => {
    try {
      // no caching for details since it might change
      const authStore = require('./auth').useAuthStore.getState()
      const token = authStore.accessToken
      if (!token) return null

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/forms/submissions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      })
      const res = await response.json()
      if (response.ok) {
        return res.data
      }
      return null
    } catch (err) {
      console.warn('Error fetching submission details', err)
      return null
    }
  },

  submitFormAction: async (id: string, actionData: { decision: string, note?: string, referTo?: string }) => {
    try {
      const authStore = require('./auth').useAuthStore.getState()
      const token = authStore.accessToken
      if (!token) throw new Error('عدم احراز هویت')

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/forms/submissions/${id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(actionData)
      })

      const res = await response.json()
      if (response.ok) {
        // Refresh inbox after action
        get().fetchInbox()
        return { success: true }
      } else {
        return { success: false, error: res.error?.message || 'خطا در ثبت اقدام' }
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'خطای سرور' }
    }
  }
}))
