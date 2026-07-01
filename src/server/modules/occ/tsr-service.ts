import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/server/db'

export interface TsrEntry {
  id: string
  section: string
  speedLimit: number
  reason: string
  createdAt: string
  createdBy: string
}

const filePath = path.join(process.cwd(), 'src', 'server', 'db', 'tsrs.json')

async function ensureFileExists() {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf-8')
  }
}

export async function getTsrEntries(): Promise<TsrEntry[]> {
  await ensureFileExists()
  const content = await fs.readFile(filePath, 'utf-8')
  try {
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function createTsrEntry(
  section: string,
  speedLimit: number,
  reason: string,
  userId: string,
): Promise<TsrEntry> {
  await ensureFileExists()
  const entries = await getTsrEntries()
  const newEntry: TsrEntry = {
    id: `tsr-${Date.now()}`,
    section,
    speedLimit,
    reason,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  }

  entries.push(newEntry)
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')

  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        entity: 'TSR',
        entityId: newEntry.id,
        action: 'create',
        after: newEntry as any,
      },
    })
  } catch {
    // Audit failure shouldn't crash app
  }

  return newEntry
}

export async function deleteTsrEntry(id: string, userId: string): Promise<boolean> {
  await ensureFileExists()
  const entries = await getTsrEntries()
  const targetIndex = entries.findIndex((e) => e.id === id)
  if (targetIndex === -1) return false

  const targetEntry = entries[targetIndex]
  entries.splice(targetIndex, 1)
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8')

  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        entity: 'TSR',
        entityId: id,
        action: 'delete',
        before: targetEntry as any,
      },
    })
  } catch {
    // Audit failure shouldn't crash app
  }

  return true
}
