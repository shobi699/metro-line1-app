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

interface QueueEntry {
  url: string
  method: string
  body: string | null
  headers: Record<string, string>
  timestamp: number
}

interface OfflineCacheState {
  cache: Record<string, CacheEntry>
  queue: QueueEntry[]
  isInitialized: boolean
  init: () => Promise<void>
  getCached: <T>(key: string) => T | null
  setCache: (key: string, data: unknown) => Promise<void>
  clearCache: (key: string) => Promise<void>
  enqueue: (url: string, method: string, body: string | null, headers: Record<string, string>) => Promise<void>
  processQueue: (token: string | null) => Promise<number>
  getQueueLength: () => number
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

      const queue: QueueEntry[] = queueEntries ? JSON.parse(queueEntries) : []

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

  async enqueue(url: string, method: string, body: string | null, headers: Record<string, string>) {
    const entry: QueueEntry = { url, method, body, headers, timestamp: Date.now() }
    const newQueue = [...get().queue, entry]
    set({ queue: newQueue })

    try {
      await AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(newQueue))
    } catch {}
  },

  async processQueue(token: string | null) {
    const { queue } = get()
    if (queue.length === 0) return 0

    const remaining: QueueEntry[] = []
    let processed = 0

    for (const entry of queue) {
      try {
        const headers: Record<string, string> = { ...entry.headers }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(entry.url, {
          method: entry.method,
          headers,
          body: entry.body,
        })

        if (res.ok) {
          processed++
        } else {
          remaining.push(entry)
        }
      } catch {
        remaining.push(entry)
      }
    }

    set({ queue: remaining })
    try {
      await AsyncStorage.setItem(QUEUE_PREFIX + 'keys', JSON.stringify(remaining))
    } catch {}

    return processed
  },

  getQueueLength() {
    return get().queue.length
  },
}))
