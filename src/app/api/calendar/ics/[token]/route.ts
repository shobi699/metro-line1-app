import { NextResponse } from 'next/server'
import { buildIcsFeed } from '@/server/modules/calendar'

/**
 * GET /api/calendar/ics/[token] — فید ICS فقط‌خواندنی.
 * بدون auth؛ خودِ توکن ۳۲ کاراکتری راز است و از تنظیمات قابل باطل‌کردن.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const cleaned = token.replace(/\.ics$/i, '')

  if (!/^[a-f0-9]{32}$/i.test(cleaned)) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'فید یافت نشد' } },
      { status: 404 },
    )
  }

  const feed = await buildIcsFeed(cleaned)
  if (!feed) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'فید یافت نشد' } },
      { status: 404 },
    )
  }

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="metro-shift-calendar.ics"',
      'Cache-Control': 'private, max-age=900',
    },
  })
}
