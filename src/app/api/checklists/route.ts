import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import {
  listTemplates,
  createTemplate,
  submitChecklist,
  getUserChecklistHistory,
} from '@/server/modules/checklists/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') ?? 'templates'

  if (view === 'history') {
    const history = await getUserChecklistHistory(user.id)
    return NextResponse.json({ data: history })
  }

  const templates = await listTemplates()
  return NextResponse.json({ data: templates })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { 
    action, name, description, templateId, trainId, stationId, 
    items, geoLocation, trainType, stationLocation, 
    completionTimeSeconds, autoTicketGenerated 
  } = body

  // Check if it's an admin template creation action
  if (action === 'create_template' || (!templateId && name && items)) {
    const adminError = await requireRole(user, 'admin')
    if (adminError) return authErrorResponse(adminError)

    if (!name || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'نام قالب و تسک‌های چک‌لیست الزامی است' },
        { status: 400 },
      )
    }

    const template = await createTemplate({
      name,
      trainType,
      stationLocation,
      description,
      items: items.map((item: Record<string, unknown>) => ({
        label: String(item.label),
        required: !!item.required,
        requirePhoto: !!item.requirePhoto,
      })),
    })

    return NextResponse.json({ data: template }, { status: 201 })
  }

  // Otherwise, it is a standard checklist record submission (operator)
  if (!templateId || !items) {
    return NextResponse.json(
      { error: 'شناسه قالب و آیتم‌ها الزامی است' },
      { status: 400 },
    )
  }

  const record = await submitChecklist({
    templateId,
    userId: user.id,
    trainId,
    stationId,
    items: items.map((item: Record<string, unknown>) => ({
      label: String(item.label),
      checked: !!item.checked,
      note: String(item.note || ''),
      photoAttached: !!item.photoAttached,
    })),
    geoLocation,
    completionTimeSeconds,
    autoTicketGenerated,
  })

  return NextResponse.json({ data: record }, { status: 201 })
}

