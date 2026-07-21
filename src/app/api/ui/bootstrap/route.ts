import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const theme = await prisma.uiTheme.findFirst() || {
      primaryColor: '#ae0011',
      accentColor: '#575e70',
      radius: 12,
      fontSize: 'md',
      darkModeDefault: false,
      logoUrl: '',
    }

    const menuItems = await prisma.uiMenuItem.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({
      data: {
        theme,
        menuItems,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات راه‌اندازی پویا: ' + error.message },
      { status: 500 }
    )
  }
}
