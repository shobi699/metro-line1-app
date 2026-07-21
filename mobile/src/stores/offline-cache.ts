import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../shared/config'

const CACHE_PREFIX = 'metro_cache_'
const QUEUE_PREFIX = 'metro_queue_'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
}

export interface PendingOp {
  id: string            // UUID — idempotency key
  type: 'receipt' | 'ready' | 'handover' | 'dispute' | 'delay' | 'checklist' | 'attendance'
  tripId: string
  url: string
  method: string
  payload: any
  headers: Record<string, string>
  timestamp: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict'
  conflictReason?: string
}

interface OfflineCacheState {
  cache: Record<string, CacheEntry>
  queue: PendingOp[]
  isInitialized: boolean
  init: () => Promise<void>
  getCached: <T>(key: string) => T | null
  setCache: (key: string, data: unknown) => Promise<void>
  clearCache: (key: string) => Promise<void>
  enqueue: (
    type: PendingOp['type'],
    tripId: string,
    url: string,
    method: string,
    payload: any,
    headers: Record<string, string>
  ) => Promise<void>
  processQueue: (token: string | null) => Promise<number>
  getQueueLength: () => number
  markConflict: (opId: string, reason: string) => void
  removeOp: (opId: string) => Promise<void>
}

export const useOfflineCacheStore = create<OfflineCacheState>((set, get) => ({
  cache: {},
  queue: [],
  isInitialized: false,

  async init() {
    try {
      const [cacheEntries, queueEntries] = await Promise.all([
        AsyncStorage.getItem(CACHE_PREFIX + 'keys'),
        AsyncStorage.getItem(QUEUE_PREFIX + 'keys'),
      ])

      const cache: Record<string, CacheEntry> = {}
      if (cacheEntries) {
        const keys: string[] = JSON.parse(cacheEntries)
        for (const key of keys) {
          const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
          if (raw) cache[key] = JSON.parse(raw)
        }
      }

      const queue: PendingOp[] = queueEntries ? JSON.parse(queueEntries) : []

      set({ cache, queue, isInitialized: true })
    } catch {
      set({ isInitialized: true })
    }
  },

  getCached<T>(key: string): T | null {
    const entry = get().cache[key]
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) return null
    return entry.data as T
  },

  async setCache(key: string, data: unknown) {
    const entry: CacheEntry = { data, timestamp: Date.now() }
    const newCache = { ...get().cache, [key]: entry }
    set({ cache: newCache })

    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry)),
        AsyncStorage.setItem(CACHE_PREFIX + 'keys', JSON.stringify(Object.keys(newCache))),
      ])
    } catch {}
  },

  async clearCache(key: string) {
    const newCache = { ...get().cache }
    delete newCache[key]
    set({ cache: newCache })

    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_PREFIX + key),
        AsyncStorage.setItem(CACHE_PREFIX + 'keys', JSON.stringify(Object.keys(newCache))),
      ])
    } catch {}
  },

  async enqueue(type, tripId, url, method, payload, headers) {
    const idempotencyKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    const entry: PendingOp = {
      id: idempotencyKey,
      type,
      tripId,
      url,
      method,
      payload,
      headers,
      timestamp: Date.now(),
      syncStatus: 'pending'
    }
    const newQueue = [...get().queue, entry]
    set({ queue: newQueue })

    try {
      await AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(newQueue))
    } catch {}
  },

  async processQueue(token: string | null) {
    const { queue } = get()
    if (queue.length === 0) return 0

    const remaining: PendingOp[] = []
    let processed = 0

    for (const entry of queue) {
      if (entry.syncStatus === 'conflict') {
        remaining.push(entry)
        continue
      }

      try {
        const headers: Record<string, string> = { 
          ...entry.headers,
          'X-Idempotency-Key': entry.id // Send idempotency key in headers
        }
        if (token) headers['Authorization'] = `Bearer ${token}`

        // Update status to syncing
        entry.syncStatus = 'syncing'
        set({ queue: [...queue] })

        const res = await fetch(entry.url, {
          method: entry.method,
          headers,
          body: entry.payload ? JSON.stringify(entry.payload) : null,
        })

        if (res.ok) {
          processed++
          entry.syncStatus = 'synced'
        } else {
          // Check for validation/version conflict response from backend
          if (res.status === 409 || res.status === 422) {
            const errJson = await res.json().catch(() => ({}))
            entry.syncStatus = 'conflict'
            entry.conflictReason = errJson.error || 'تعارض در نسخه لوحه'
            remaining.push(entry)
          } else {
            entry.syncStatus = 'pending'
            remaining.push(entry)
          }
        }
      } catch {
        entry.syncStatus = 'pending'
        remaining.push(entry)
      }
    }

    // Filter out synced operations
    const nextQueue = remaining.filter(op => op.syncStatus !== 'synced')
    set({ queue: nextQueue })
    try {
      await AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(nextQueue))
    } catch {}

    return processed
  },

  getQueueLength() {
    return get().queue.length
  },

  markConflict(opId, reason) {
    const nextQueue = get().queue.map(op => 
      op.id === opId ? { ...op, syncStatus: 'conflict' as const, conflictReason: reason } : op
    )
    set({ queue: nextQueue })
    AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(nextQueue)).catch(() => {})
  },

  async removeOp(opId) {
    const nextQueue = get().queue.filter(op => op.id !== opId)
    set({ queue: nextQueue })
    try {
      await AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(nextQueue))
    } catch {}
  }
}))

