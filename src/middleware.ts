import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/config',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'توکن احراز هویت یافت نشد' },
      { status: 401 },
    )
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'خطای سرور' },
      { status: 500 },
    )
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return NextResponse.next()
  } catch {
    return NextResponse.json(
      { error: 'توکن نامعتبر یا منقضی شده' },
      { status: 401 },
    )
  }
}

export const config = {
  matcher: '/api/:path*',
}
