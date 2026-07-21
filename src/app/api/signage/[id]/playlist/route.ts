import { NextResponse } from 'next/server'
import { getSignageScreenPlaylist, pingSignageScreen } from '@/server/modules/signage/service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Register a ping to show the monitor is online
    await pingSignageScreen(id)

    const playlist = await getSignageScreenPlaylist(id)
    return NextResponse.json({ data: playlist })
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
