interface OtpEntry {
  code: string
  expiresAt: number
  phone: string
}

interface ResetEntry {
  nationalId: string
  expiresAt: number
}

export interface OtpAdapter {
  getOtp(key: string): Promise<OtpEntry | null>
  setOtp(key: string, entry: OtpEntry): Promise<void>
  deleteOtp(key: string): Promise<void>
  getReset(token: string): Promise<ResetEntry | null>
  setReset(token: string, entry: ResetEntry): Promise<void>
  deleteReset(token: string): Promise<void>
}

import type { KvNamespace } from '../cloudflare-types'

/** Cloudflare KV adapter — uses KV binding with TTL for automatic expiration. */
class KvAdapter implements OtpAdapter {
  constructor(private kv: KvNamespace) {}

  async getOtp(key: string): Promise<OtpEntry | null> {
    return this.kv.get(`otp:${key}`, 'json') as Promise<OtpEntry | null>
  }

  async setOtp(key: string, entry: OtpEntry): Promise<void> {
    const ttl = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
    await this.kv.put(`otp:${key}`, JSON.stringify(entry), { expirationTtl: ttl })
  }

  async deleteOtp(key: string): Promise<void> {
    await this.kv.delete(`otp:${key}`)
  }

  async getReset(token: string): Promise<ResetEntry | null> {
    return this.kv.get(`rst:${token}`, 'json') as Promise<ResetEntry | null>
  }

  async setReset(token: string, entry: ResetEntry): Promise<void> {
    const ttl = Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000))
    await this.kv.put(`rst:${token}`, JSON.stringify(entry), { expirationTtl: ttl })
  }

  async deleteReset(token: string): Promise<void> {
    await this.kv.delete(`rst:${token}`)
  }
}

/** In-memory adapter for local development without KV. */
class MemoryAdapter implements OtpAdapter {
  private otps = new Map<string, OtpEntry>()
  private resets = new Map<string, ResetEntry>()

  async getOtp(key: string): Promise<OtpEntry | null> {
    return this.otps.get(key) ?? null
  }

  async setOtp(key: string, entry: OtpEntry): Promise<void> {
    this.otps.set(key, entry)
  }

  async deleteOtp(key: string): Promise<void> {
    this.otps.delete(key)
  }

  async getReset(token: string): Promise<ResetEntry | null> {
    return this.resets.get(token) ?? null
  }

  async setReset(token: string, entry: ResetEntry): Promise<void> {
    this.resets.set(token, entry)
  }

  async deleteReset(token: string): Promise<void> {
    this.resets.delete(token)
  }
}

function resolve(): OtpAdapter {
  const kv = (globalThis as unknown as { KV?: KvNamespace }).KV
  return kv ? new KvAdapter(kv) : new MemoryAdapter()
}

export const otpStore = resolve()
