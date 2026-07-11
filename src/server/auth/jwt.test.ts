import { describe, it, expect, beforeAll } from 'vitest'
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt'

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only'
})

describe('JWT', () => {
  it('issues and verifies access token', async () => {
    const token = await issueAccessToken('user-1', '0000000000', 'admin', 1, [])
    const payload = await verifyAccessToken(token)

    expect(payload.sub).toBe('user-1')
    expect(payload.personnelCode).toBe('0000000000')
    expect(payload.roleKey).toBe('admin')
  })

  it('issues and verifies refresh token', async () => {
    const token = await issueRefreshToken('user-1', 0)
    const payload = await verifyRefreshToken(token)

    expect(payload.sub).toBe('user-1')
    expect(payload.tokenVersion).toBe(0)
  })

  it('rejects invalid access token', async () => {
    await expect(verifyAccessToken('invalid-token')).rejects.toThrow()
  })

  it('rejects invalid refresh token', async () => {
    await expect(verifyRefreshToken('invalid-token')).rejects.toThrow()
  })

  it('rejects token signed with wrong secret', async () => {
    const { SignJWT } = await import('jose')
    const badToken = await new SignJWT({ sub: 'user-1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode('wrong-secret'))

    await expect(verifyAccessToken(badToken)).rejects.toThrow()
  })
})
