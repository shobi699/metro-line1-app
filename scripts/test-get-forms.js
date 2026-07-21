import { prisma } from '../src/server/db'
import { rankForRoleKey } from '../src/server/rbac/permissions'

const ROLES = [
  'driver',
  'shift_lead',
  'expert',
  'dispatch_tech',
  'clerical',
  'operator',
  'supervisor',
  'chief',
  'manager',
  'admin',
  'super_admin'
]

async function testFilter(roleKey) {
  const user = {
    id: 'test-user-id',
    nationalId: '1234567890',
    roleKey: roleKey,
    rank: rankForRoleKey(roleKey),
    permissions: ['forms:view-own', 'forms:submit']
  }

  const templates = await prisma.formTemplate.findMany({
    where: { isActive: true },
    include: {
      versions: {
        where: { isActive: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const allowedTemplates = templates.filter((template) => {
    const activeVersion = template.versions[0]
    if (!activeVersion) return false
    const access = activeVersion.access
    if (!access || !access.whoCanSubmit) return false
    
    return access.whoCanSubmit.includes('*') || access.whoCanSubmit.includes(user.roleKey)
  })

  console.log(`Role: ${roleKey.padEnd(15)} => Allowed Forms: ${allowedTemplates.length}`)
}

async function run() {
  console.log('--- TESTING ALL ROLES ---')
  for (const role of ROLES) {
    await testFilter(role)
  }
}

run()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect())
