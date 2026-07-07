import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    // List active personas
    const personas = await prisma.aiPersona.findMany({
      where: { isActive: true },
      select: {
        id: true,
        key: true,
        title: true,
        icon: true,
        roleKeys: true,
      }
    })

    // Filter by user role if we wanted to (currently just returns all and client filters, or we can filter here)
    const userRole = decoded.role as string
    const allowedPersonas = personas.filter(p => {
      try {
        const allowedRoles = JSON.parse(p.roleKeys) as string[]
        return allowedRoles.includes('*') || allowedRoles.includes(userRole)
      } catch (e) {
        return false
      }
    })

    return NextResponse.json({ data: allowedPersonas })
  } catch (error: any) {
    console.error('[GET /api/ai/personas] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'خطای سرور' } },
      { status: 500 }
    )
  }
}
