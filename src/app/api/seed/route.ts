import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { seedDatabase } from '@/server/db-seed'

export async function GET() {
  try {
    await seedDatabase(prisma, true)
    const articlesCount = await prisma.knowledgeArticle.count()
    const usersCount = await prisma.user.count()
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      knowledgeArticlesCount: articlesCount,
      usersCount
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || String(err),
      stack: err.stack
    }, { status: 500 })
  }
}
