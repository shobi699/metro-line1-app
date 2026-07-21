import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './src/generated/prisma/client'
import path from 'node:path'
import { coercePermissions } from './src/server/rbac/permissions'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  const adminRole = await prisma.role.findUnique({ where: { key: 'admin' } })
  if (adminRole) {
    const perms = coercePermissions(adminRole.permissions)
    const newPerms = Array.from(new Set([...perms, 'calendar-admin:holidays', 'calendar-admin:events', 'calendar-admin:config', 'calendar:personal', 'calendar:view', 'calendar:view-team']))
    await prisma.role.update({
      where: { key: 'admin' },
      data: { permissions: JSON.stringify(newPerms) }
    })
    console.log('Admin role permissions updated!')
  } else {
    console.log('Admin role not found')
  }
}

main().catch(console.error)
