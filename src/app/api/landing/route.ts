import { NextResponse } from 'next/server'
import { getPublishedLandingData } from '@/server/modules/landing/service'

export async function GET() {
  try {
    const data = await getPublishedLandingData()

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'LANDING_FETCH_FAILED', message } },
      { status: 500 },
    )
  }
}
