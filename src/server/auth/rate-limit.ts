interface WindowEntry {
  count: number
  resetAt: number
}

const windows = new Map<string, WindowEntry>()

/**
 * Fixed-window rate limiter. Returns true if the call is allowed.
 * Prunes expired entries opportunistically to bound memory.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now()
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.resetAt < now) windows.delete(k)
    }
  }
  const entry = windows.get(key)
  if (!entry || entry.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  entry.count++
  return entry.count <= maxAttempts
}

/** Test helper — clears all windows. */
export function resetRateLimits() {
  windows.clear()
}
