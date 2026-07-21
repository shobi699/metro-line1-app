import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './src/generated/prisma/client'
import path from 'node:path'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  const superAdminRole = await prisma.role.findUnique({ where: { key: 'super_admin' } })
  console.log('SUPER ADMIN:', superAdminRole)
}

main().catch(console.error)
