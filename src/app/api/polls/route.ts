import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createPoll, listActivePolls, vote } from '@/server/modules/polls/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const polls = await listActivePolls(user.id)
  return NextResponse.json({ data: polls })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, options, expiresAt } = body

  if (!title || !options || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json(
      { error: 'عنوان و حداقل ۲ گزینه الزامی است' },
      { status: 400 },
    )
  }

  const poll = await createPoll({
    title,
    description,
    options,
    createdById: user.id,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  })

  return NextResponse.json({ data: poll }, { status: 201 })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { pollId, optionId } = body

  if (!pollId || !optionId) {
    return NextResponse.json(
      { error: 'شناسه نظرسنجی و گزینه الزامی است' },
      { status: 400 },
    )
  }

  await vote(pollId, optionId, user.id)
  return NextResponse.json({ data: { success: true } })
}
