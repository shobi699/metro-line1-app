import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { listTasks, createTask, updateTask, deleteTask, shiftTaskSchema } from '@/server/modules/roster'
import { z } from 'zod'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'startDate و endDate الزامی است' } },
      { status: 400 },
    )
  }

  const startDate = new Date(startDateParam)
  const endDate = new Date(endDateParam)

  const tasks = await listTasks(user.id, startDate, endDate)
  return NextResponse.json({ data: tasks })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = shiftTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const task = await createTask(user.id, parsed.data)
    return NextResponse.json({ data: task })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}

const updateTaskSchema = z.object({
  id: z.string().min(1),
  updates: z.record(z.string(), z.unknown()),
})

export async function PUT(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = updateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const task = await updateTask(parsed.data.id, user.id, parsed.data.updates as Record<string, unknown>)
    return NextResponse.json({ data: task })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'شناسه تسک الزامی است' } },
      { status: 400 },
    )
  }

  try {
    await deleteTask(id, user.id)
    return NextResponse.json({ data: { success: true } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message } },
      { status: 404 },
    )
  }
}
