import { chatBus } from '@/server/realtime/bus'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: screenId } = await params

  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  // Send connection established ping
  writer.write(encoder.encode('data: {"type": "connected"}\n\n'))

  const handleSignageUpdate = (evt: { screenId: string }) => {
    if (evt.screenId === screenId || evt.screenId === 'all') {
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'playlist_refresh' })}\n\n`))
      } catch {
        // stream might be closed
      }
    }
  }

  const handleEmergency = (evt: { title: string; body: string; active: boolean }) => {
    try {
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'emergency', data: evt })}\n\n`))
    } catch {
      // stream might be closed
    }
  }

  chatBus.on('signage-update', handleSignageUpdate)
  chatBus.on('emergency-broadcast', handleEmergency)

  request.signal.addEventListener('abort', () => {
    chatBus.off('signage-update', handleSignageUpdate)
    chatBus.off('emergency-broadcast', handleEmergency)
    try {
      writer.close()
    } catch {
      // already closed
    }
  })

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
