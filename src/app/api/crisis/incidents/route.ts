import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    const filter: any = {}
    if (type !== 'all') {
      filter.type = type
    }

    const incidents = await prisma.incidentReport.findMany({
      where: filter,
      orderBy: { dateTime: 'desc' },
      include: {
        reporter: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ data: incidents })
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
      title, 
      type, 
      dateTime, 
      location, 
      trainNo, 
      rootCause, 
      correctiveAction, 
      description 
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'عنوان و نوع گزارش الزامی است' }, { status: 400 })
    }

    const newIncident = await prisma.incidentReport.create({
      data: {
        reporterId: user.id,
        title,
        type,
        dateTime: dateTime ? new Date(dateTime) : new Date(),
        location,
        trainNo,
        rootCause,
        correctiveAction,
        description,
        status: 'under_review',
        timeline: [
          { time: new Date().toISOString(), text: 'گزارش رویداد اولیه در سامانه ثبت گردید.' }
        ]
      },
      include: {
        reporter: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: newIncident })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.roleKey !== 'super_admin' && user.roleKey !== 'admin') {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 })
    }

    const existingIncident = await prisma.incidentReport.findUnique({ where: { id } })
    if (!existingIncident) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 })
    }

    const currentTimeline = Array.isArray(existingIncident.timeline) ? existingIncident.timeline : []
    const statusTexts: Record<string, string> = {
      under_review: 'وضعیت به "در حال بررسی" تغییر یافت',
      action_taken: 'اقدامات اصلاحی ثبت گردید',
      closed: 'پرونده مختومه شد'
    }
    
    const text = statusTexts[status] || `وضعیت تغییر کرد به ${status}`

    const updatedTimeline = [
      ...currentTimeline,
      { time: new Date().toISOString(), text }
    ]

    const updatedIncident = await prisma.incidentReport.update({
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

    return NextResponse.json({ success: true, data: updatedIncident })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
