import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })

  // Create roles
  const superAdminRole = await prisma.role.upsert({
    where: { key: 'super_admin' },
    update: {},
    create: {
      key: 'super_admin',
      name: 'مدیر ارشد',
      permissions: JSON.stringify({
        users: ['create', 'read', 'update', 'delete'],
        shifts: ['create', 'read', 'update', 'delete'],
        tickets: ['create', 'read', 'update', 'delete'],
        bulletins: ['create', 'read', 'update', 'delete'],
        imports: ['create', 'read'],
        settings: ['read', 'update'],
      }),
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { key: 'admin' },
    update: {},
    create: {
      key: 'admin',
      name: 'مدیر',
      permissions: JSON.stringify({
        users: ['read', 'update'],
        shifts: ['create', 'read', 'update'],
        tickets: ['create', 'read', 'update'],
        bulletins: ['create', 'read', 'update'],
        imports: ['create', 'read'],
        settings: ['read'],
      }),
    },
  })

  const operatorRole = await prisma.role.upsert({
    where: { key: 'operator' },
    update: {},
    create: {
      key: 'operator',
      name: 'اپراتور',
      permissions: JSON.stringify({
        users: ['read'],
        shifts: ['read'],
        tickets: ['create', 'read', 'update'],
        bulletins: ['read'],
        imports: ['read'],
        settings: ['read'],
      }),
    },
  })

  // Create super_admin user
  const passwordHash = await bcrypt.hash('admin123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { nationalId: '0000000000' },
    update: {},
    create: {
      nationalId: '0000000000',
      name: 'مدیر سیستم',
      phone: '09120000000',
      email: 'admin@metro.ir',
      passwordHash,
      status: 'active',
      roleId: superAdminRole.id,
    },
  })

  console.log('Seeded:')
  console.log(`  Roles: ${superAdminRole.key}, ${adminRole.key}, ${operatorRole.key}`)
  console.log(`  Super admin: ${superAdmin.name} (${superAdmin.nationalId})`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
