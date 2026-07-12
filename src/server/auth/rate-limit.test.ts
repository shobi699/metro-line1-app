import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, resetRateLimits } from './rate-limit'

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimits()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to maxAttempts calls within the window and rejects the next one', () => {
    const key = 'user1'
    const maxAttempts = 3
    const windowMs = 1000

    // 1st attempt
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    // 2nd attempt
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    // 3rd attempt
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    // 4th attempt - should fail
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(false)
  })

  it('resets the limit after windowMs elapses', () => {
    const key = 'user2'
    const maxAttempts = 2
    const windowMs = 1000

    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(false)

    // Advance time by 1001ms
    vi.advanceTimersByTime(1001)

    // Should be allowed again
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
  })

  it('ensures independent keys do not interfere with each other', () => {
    const key1 = 'userA'
    const key2 = 'userB'
    const maxAttempts = 1
    const windowMs = 1000

    expect(checkRateLimit(key1, maxAttempts, windowMs)).toBe(true)
    expect(checkRateLimit(key1, maxAttempts, windowMs)).toBe(false)

    // key2 should still be allowed since it's independent
    expect(checkRateLimit(key2, maxAttempts, windowMs)).toBe(true)
    expect(checkRateLimit(key2, maxAttempts, windowMs)).toBe(false)
  })

  it('clears state on resetRateLimits', () => {
    const key = 'user3'
    const maxAttempts = 1
    const windowMs = 1000

    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(false)

    resetRateLimits()

    // Should be allowed again
    expect(checkRateLimit(key, maxAttempts, windowMs)).toBe(true)
  })
})
