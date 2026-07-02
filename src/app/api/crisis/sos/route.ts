import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { sendMessage } from '@/server/modules/chat/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const { lat, lng, note } = body

    // 1. Find or create the OCC Emergency Global Room
    let occRoom = await prisma.chatRoom.findFirst({
      where: { kind: 'emergency', name: 'OCC Emergency' }
    })

    if (!occRoom) {
      occRoom = await prisma.chatRoom.create({
        data: {
          name: 'OCC Emergency',
          type: 'group',
          kind: 'emergency'
        }
      })
    }

    // 2. Add sender to room if not present
    const member = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: occRoom.id, userId: user.id } }
    })
    
    if (!member) {
      await prisma.chatMember.create({
        data: {
          roomId: occRoom.id,
          userId: user.id
        }
      })
    }

    // 3. Construct emergency message
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const userName = dbUser?.name || 'راهبر ناشناس'

    let messageBody = `🚨 هشدار اضطراری (SOS) از طرف ${userName}`
    if (lat && lng) {
      messageBody += `\n📍 موقعیت: ${lat}, ${lng}`
    }
    if (note) {
      messageBody += `\n📝 توضیحات: ${note}`
    }

    // 4. Send message with priority 'emergency'
    const msg = await sendMessage(
      occRoom.id,
      user.id,
      {
        body: messageBody,
        priority: 'emergency',
        tags: ['SOS']
      }
    )

    // Optionally: push push-notifications here to all admins/operators

    return NextResponse.json({ success: true, data: msg })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
