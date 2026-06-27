import { prisma } from '@/server/db'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma/client'

export const shiftNoteSchema = z.object({
  date: z.string().min(1, 'تاریخ الزامی است'),
  content: z.string().min(1, 'محتوای یادداشت الزامی است'),
})

export const shiftTaskSchema = z.object({
  date: z.string().min(1, 'تاریخ الزامی است'),
  title: z.string().min(1, 'عنوان الزامی است'),
  time: z.string().default('08:00'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  type: z.enum(['personal', 'system']).default('personal'),
  overtime: z.number().optional(),
  extraData: z.record(z.string(), z.unknown()).optional(),
})

export async function listNotes(userId: string, startDate: Date, endDate: Date) {
  return prisma.shiftNote.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  })
}

export async function upsertNote(userId: string, data: z.infer<typeof shiftNoteSchema>) {
  const dateObj = new Date(data.date)
  dateObj.setHours(0, 0, 0, 0)

  const existing = await prisma.shiftNote.findUnique({
    where: { userId_date: { userId, date: dateObj } },
  })

  if (existing) {
    return prisma.shiftNote.update({
      where: { id: existing.id },
      data: { content: data.content },
    })
  }

  return prisma.shiftNote.create({
    data: { userId, date: dateObj, content: data.content },
  })
}

export async function deleteNote(id: string, userId: string) {
  const note = await prisma.shiftNote.findUnique({ where: { id } })
  if (!note || note.userId !== userId) {
    throw new Error('یادداشت یافت نشد یا دسترسی ندارید')
  }
  return prisma.shiftNote.delete({ where: { id } })
}

export async function listTasks(userId: string, startDate: Date, endDate: Date) {
  return prisma.shiftTask.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  })
}

export async function createTask(userId: string, data: z.infer<typeof shiftTaskSchema>) {
  const dateObj = new Date(data.date)
  dateObj.setHours(0, 0, 0, 0)

  return prisma.shiftTask.create({
    data: {
      userId,
      date: dateObj,
      title: data.title,
      time: data.time,
      priority: data.priority,
      status: data.status,
      type: data.type,
      overtime: data.overtime,
      extraData: data.extraData as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function updateTask(id: string, userId: string, updates: Partial<z.infer<typeof shiftTaskSchema>>) {
  const task = await prisma.shiftTask.findUnique({ where: { id } })
  if (!task || task.userId !== userId) {
    throw new Error('تسک یافت نشد یا دسترسی ندارید')
  }

  return prisma.shiftTask.update({
    where: { id },
    data: {
      ...(updates.title && { title: updates.title }),
      ...(updates.time && { time: updates.time }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.status && { status: updates.status }),
      ...(updates.type && { type: updates.type }),
      ...(updates.overtime !== undefined && { overtime: updates.overtime }),
      ...(updates.extraData && { extraData: updates.extraData as object }),
    },
  })
}

export async function deleteTask(id: string, userId: string) {
  const task = await prisma.shiftTask.findUnique({ where: { id } })
  if (!task || task.userId !== userId) {
    throw new Error('تسک یافت نشد یا دسترسی ندارید')
  }
  return prisma.shiftTask.delete({ where: { id } })
}
