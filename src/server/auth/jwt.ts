import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface AccessTokenPayload extends JWTPayload {
  sub: string
  nationalId: string
  roleKey: string
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string
  tokenVersion: number
}

const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set')
  return new TextEncoder().encode(secret)
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function issueAccessToken(
  userId: string,
  nationalId: string,
  roleKey: string,
): Promise<string> {
  return new SignJWT({ sub: userId, nationalId, roleKey })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(getAccessSecret())
}

export async function issueRefreshToken(
  userId: string,
  tokenVersion: number,
): Promise<string> {
  return new SignJWT({ sub: userId, tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getRefreshSecret())
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret())
  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret())
  return payload as RefreshTokenPayload
}
