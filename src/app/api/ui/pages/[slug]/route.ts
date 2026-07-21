import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const page = await prisma.uiPage.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!page) {
      // If it doesn't exist, return a default empty layout schema for that page
      return NextResponse.json({
        data: {
          slug,
          title: slug === 'dashboard' ? 'داشبورد' : 'صفحه سفارشی',
          layoutType: 'dashboard',
          components: [],
        },
      })
    }

    const latestVersion = page.versions[0]
    const schema = latestVersion
      ? typeof latestVersion.schemaJson === 'string'
        ? JSON.parse(latestVersion.schemaJson)
        : latestVersion.schemaJson
      : { components: [] }

    return NextResponse.json({
      data: {
        id: page.id,
        slug: page.slug,
        title: page.title,
        layoutType: page.layoutType,
        status: page.status,
        components: schema.components || [],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات صفحه: ' + error.message },
      { status: 500 }
    )
  }
}
