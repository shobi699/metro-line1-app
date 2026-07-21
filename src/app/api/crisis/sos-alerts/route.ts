import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { sendMessage } from '@/server/modules/chat/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const alerts = await prisma.sOSAlert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ data: alerts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const { 
      reporterShift, 
      reporterRole, 
      locationCoordinates, 
      batteryPercentage, 
      networkStatus, 
      audioMemoUrl 
    } = body

    // Create the structured alert
    const newAlert = await prisma.sOSAlert.create({
      data: {
        reporterId: user.id,
        reporterShift,
        reporterRole,
        locationCoordinates,
        batteryPercentage,
        networkStatus,
        audioMemoUrl,
        status: 'submitted',
        timeline: [
          { time: new Date().toISOString(), text: 'سیگنال اضطراری SOS با تایید کاربر ارسال شد.' },
          { time: new Date().toISOString(), text: 'اطلاعات تله‌متری کابین ثبت گردید.' },
          { time: new Date().toISOString(), text: 'سیگنال به OCC مخابره شد.' }
        ]
      },
      include: {
        reporter: {
          select: { name: true }
        }
      }
    })

    // Also send legacy chat message to OCC room
    try {
      let occRoom = await prisma.chatRoom.findFirst({
        where: { kind: 'emergency', name: 'OCC Emergency' }
      })
      if (!occRoom) {
        occRoom = await prisma.chatRoom.create({
          data: { name: 'OCC Emergency', type: 'group', kind: 'emergency' }
        })
      }
      
      const member = await prisma.chatMember.findUnique({
        where: { roomId_userId: { roomId: occRoom.id, userId: user.id } }
      })
      if (!member) {
        await prisma.chatMember.create({ data: { roomId: occRoom.id, userId: user.id } })
      }

      const userName = newAlert.reporter.name || 'راهبر ناشناس'
      let messageBody = `🚨 هشدار اضطراری (SOS) از طرف ${userName}`
      if (locationCoordinates) messageBody += `\n📍 موقعیت: ${locationCoordinates}`
      if (batteryPercentage) messageBody += `\n🔋 باتری: ${batteryPercentage}%`

      await sendMessage(occRoom.id, user.id, {
        body: messageBody,
        priority: 'emergency',
        tags: ['SOS']
      })
    } catch (e) {
      console.error("Failed to sync SOS with Chat system:", e)
    }

    return NextResponse.json({ success: true, data: newAlert })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only OCC or Admins should update status
  if (user.roleKey !== 'super_admin' && user.roleKey !== 'admin') {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status, text } = body

    if (!id || !status || !text) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    const existingAlert = await prisma.sOSAlert.findUnique({ where: { id } })
    if (!existingAlert) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
    }

    const currentTimeline = Array.isArray(existingAlert.timeline) ? existingAlert.timeline : []
    const updatedTimeline = [
      ...currentTimeline,
      { time: new Date().toISOString(), text }
    ]

    const updatedAlert = await prisma.sOSAlert.update({
      where: { id },
      data: {
        status,
        timeline: updatedTimeline
      },
      include: {
        reporter: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedAlert })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
