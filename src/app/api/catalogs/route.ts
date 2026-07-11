import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { verifyAccessToken } from '@/server/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional: Restrict creation to admins (we can use role checks here if needed)
    // if (decoded.roleKey !== 'super_admin' && decoded.roleKey !== 'admin') { ... }

    const body = await req.json()
    const { title, category, content } = body

    if (!title || !category || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const newCatalog = await prisma.technicalCatalog.create({
      data: {
        title,
        category,
        content,
        authorId: decoded.sub
      }
    })

    return NextResponse.json(newCatalog)
  } catch (error) {
    console.error('Error saving catalog:', error)
    return NextResponse.json({ error: 'Failed to save catalog' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const catalogs = await prisma.technicalCatalog.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json({ data: catalogs })
  } catch (error) {
    console.error('Error fetching catalogs:', error)
    return NextResponse.json({ error: 'Failed to fetch catalogs' }, { status: 500 })
  }
}
