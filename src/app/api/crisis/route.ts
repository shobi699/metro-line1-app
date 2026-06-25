import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { activateCrisis, getActiveCrisis, resolveCrisis } from '@/server/modules/crisis/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const crisis = await getActiveCrisis()
  return NextResponse.json({ data: crisis })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 4) {
    return NextResponse.json(
      { error: 'فقط مدیر کل می‌تواند حالت بحران را فعال کند' },
      { status: 403 },
    )
  }

  const body = await request.json()
  const { title, description, level, stationId } = body

  if (!title || !level) {
    return NextResponse.json(
      { error: 'عنوان و سطح بحران الزامی است' },
      { status: 400 },
    )
  }

  const crisis = await activateCrisis({
    title,
    description,
    level,
    stationId,
    activatedBy: user.id,
  })

  return NextResponse.json({ data: crisis }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 4) {
    return NextResponse.json(
      { error: 'فقط مدیر کل می‌تواند حالت بحران را غیرفعال کند' },
      { status: 403 },
    )
  }

  const body = await request.json()
  const { crisisId } = body

  if (!crisisId) {
    return NextResponse.json({ error: 'شناسه بحران الزامی است' }, { status: 400 })
  }

  await resolveCrisis(crisisId)
  return NextResponse.json({ data: { success: true } })
}
