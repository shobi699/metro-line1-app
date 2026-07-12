import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './src/generated/prisma/client'
import path from 'node:path'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  await prisma.role.update({
    where: { key: 'super_admin' },
    data: { permissions: JSON.stringify(['*']) }
  })
  
  console.log('Super Admin role permissions updated to [*]')
}

main().catch(console.error)
