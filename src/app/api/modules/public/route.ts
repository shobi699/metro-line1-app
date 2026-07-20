import { NextResponse } from 'next/server'
import { getModuleFlags } from '@/server/modules/modules/service'

export async function GET() {
  try {
    const flags = await getModuleFlags()
    return NextResponse.json({
      data: {
        flags: flags.map((f) => ({
          id: f.id,
          enabled: f.enabled,
          matchingPrefixes: f.matchingPrefixes,
        })),
      },
    })
  } catch (err) {
    console.error('[GET /api/modules/public] Error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'خطا در دریافت وضعیت ماژول‌ها' } },
      { status: 500 }
    )
  }
}
