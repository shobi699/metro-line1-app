import { useOfflineCacheStore } from '../stores/offline-cache'
import { useNetworkStore } from '../stores/network'
import { useAuthStore } from '../stores/auth'
import { API_URL } from './config'

export async function cachedFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const cacheStore = useOfflineCacheStore.getState()
  const networkStore = useNetworkStore.getState()
  const authStore = useAuthStore.getState()

  const url = `${API_URL}${path}`
  const cacheKey = `fetch:${path}:${JSON.stringify(options.body || '')}`
  const token = authStore.accessToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  if (networkStore.isOffline) {
    const cached = cacheStore.getCached<T>(cacheKey)
    if (cached) return cached

    if (options.method && options.method !== 'GET') {
      await cacheStore.enqueue(url, options.method, options.body as string | null, headers)
    }
    return null
  }

  try {
    const res = await fetch(url, { ...options, headers })

    if (!res.ok) return null

    const data = await res.json()
    const payload = data?.data ?? data

    if (!options.method || options.method === 'GET') {
      await cacheStore.setCache(cacheKey, payload)
    }

    return payload as T
  } catch {
    const cached = cacheStore.getCached<T>(cacheKey)
    return cached
  }
}

export async function syncPendingMutations(): Promise<number> {
  const { processQueue } = useOfflineCacheStore.getState()
  const { accessToken } = useAuthStore.getState()
  return processQueue(accessToken)
}
