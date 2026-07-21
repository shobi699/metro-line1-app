import { NextRequest } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'

export async function getSession() {
  // This is a dummy or context-free implementation if it was used that way
  // But usually it needs request. Next.js App Router might use headers() or cookies()
  const { cookies, headers } = await import('next/headers')
  // We'll just pass a mock request to getSessionUser to keep it simple, or implement properly:
  const req = new NextRequest('http://localhost', {
    headers: await headers()
  })
  const user = await getSessionUser(req as any)
  if ('error' in user) return null
  return user
}

export async function authenticate(req: NextRequest | Request) {
  const user = await getSessionUser(req)
  if ('error' in user) return { user: null }
  return { user }
}
