import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { PrismaClient, type RoleKey } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const DEMO_PASSWORD = 'demo1234'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // ── Roles ──────────────────────────────────────────────
  const roles = {} as Record<RoleKey, string>
  for (const [key, name, perms] of [
    [
      'super_admin',
      'مدیر ارشد',
      {
        users: ['create', 'read', 'update', 'delete'],
        shifts: ['create', 'read', 'update', 'delete'],
        tickets: ['create', 'read', 'update', 'delete'],
        bulletins: ['create', 'read', 'update', 'delete'],
        imports: ['create', 'read'],
        settings: ['read', 'update'],
      },
    ],
    [
      'admin',
      'مدیر',
      {
        users: ['read', 'update'],
        shifts: ['create', 'read', 'update'],
        tickets: ['create', 'read', 'update'],
        bulletins: ['create', 'read', 'update'],
        imports: ['create', 'read'],
        settings: ['read'],
      },
    ],
    [
      'operator',
      'اپراتور',
      {
        users: ['read'],
        shifts: ['read'],
        tickets: ['create', 'read', 'update'],
        bulletins: ['read'],
        imports: ['read'],
        settings: ['read'],
      },
    ],
  ] as const) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {},
      create: { key, name, permissions: JSON.stringify(perms) },
    })
    roles[key] = role.id
  }

  // ── Users ──────────────────────────────────────────────
  const operatorNames: Array<{ name: string; nationalId: string; phone: string }> = [
    { name: 'علی رضایی', nationalId: '1111111111', phone: '09121000001' },
    { name: 'محمد حسینی', nationalId: '2222222222', phone: '09121000002' },
    { name: 'زهرا کریمی', nationalId: '3333333333', phone: '09121000003' },
    { name: 'فاطمه محمدی', nationalId: '4444444444', phone: '09121000004' },
    { name: 'امیر نوری', nationalId: '5555555555', phone: '09121000005' },
    { name: 'سارا احمدی', nationalId: '6666666666', phone: '09121000006' },
  ]

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
      roleId: roles.super_admin,
    },
  })

  const admin = await prisma.user.upsert({
    where: { nationalId: '9999999999' },
    update: {},
    create: {
      nationalId: '9999999999',
      name: 'مدیر خط',
      phone: '09120000009',
      email: 'lineadmin@metro.ir',
      passwordHash,
      status: 'active',
      roleId: roles.admin,
    },
  })

  const operators = []
  for (const op of operatorNames) {
    const user = await prisma.user.upsert({
      where: { nationalId: op.nationalId },
      update: {},
      create: {
        nationalId: op.nationalId,
        name: op.name,
        phone: op.phone,
        passwordHash,
        status: 'active',
        roleId: roles.operator,
      },
    })
    operators.push(user)
  }

  const allOperators = [superAdmin, admin, ...operators]

  // ── Shifts (today +/- 7 days) ──────────────────────────
  const shiftCodes: Array<'morning' | 'evening' | 'night' | 'off'> = [
    'morning', 'evening', 'night', 'off',
  ]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let offset = -7; offset <= 7; offset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + offset)
    date.setHours(0, 0, 0, 0)

    for (let i = 0; i < allOperators.length; i++) {
      const user = allOperators[i]
      const code = shiftCodes[(i + offset + 10) % shiftCodes.length]
      await prisma.shift.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: {},
        create: { userId: user.id, date, code },
      })
    }
  }

  // ── Safety bulletins ───────────────────────────────────
  const bulletins = await Promise.all([
    prisma.safetyBulletin.create({
      data: {
        title: 'رعایت اصول ایمنی در تعمیرگاه',
        body: 'استفاده از کلاه ایمنی و کفش ایمنی در تمام بخش‌های تعمیرگاه الزامی است. لطفاً قبل از شروع کار، تجهیزات ایمنی خود را بررسی کنید.',
        active: true,
      },
    }),
    prisma.safetyBulletin.create({
      data: {
        title: 'بروزرسانی دستورالعمل توقف اضطراری',
        body: 'دستورالعمل جدید توقف اضطراری قطار در ایستگاه‌ها منتشر شده است. تمام پرسنل باید این دستورالعمل را مطالعه و تأیید کنند.',
        active: true,
      },
    }),
    prisma.safetyBulletin.create({
      data: {
        title: 'گزارش ماهانه ایمنی',
        body: 'گزارش ماهانه ایمنی خط ۱ تهیه شده و نتایج نشان‌دهنده کاهش ۱۵٪ حوادث نسبت به ماه قبل است.',
        active: false,
      },
    }),
  ])

  // ── Read receipts (operators have read bulletin 1) ─────
  for (const op of operators.slice(0, 4)) {
    await prisma.readReceipt.create({
      data: {
        userId: op.id,
        safetyBulletinId: bulletins[0].id,
      },
    })
  }

  // ── Tickets ────────────────────────────────────────────
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        title: 'خرابی درب قطار ۱۰۲',
        description: 'درب سمت راست قطار ۱۰۲ در ایستگاه تجریش باز نمی‌شود.',
        priority: 'high',
        status: 'open',
        wagonCode: '102',
        creatorId: operators[0].id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'چراغ خاموش سکوی شمالی',
        description: 'سه چراغ سکوی شمالی ایستگاه تجریش خاموش شده‌اند.',
        priority: 'medium',
        status: 'in_progress',
        wagonCode: null,
        creatorId: operators[1].id,
      },
    }),
    prisma.ticket.create({
      data: {
        title: 'سر و صدای غیرعادی موتور',
        description: 'motor قطار ۲۰۵ صدای غیرعادی تولید می‌کند. نیاز به بازرسی فنی.',
        priority: 'critical',
        status: 'open',
        wagonCode: '205',
        creatorId: operators[2].id,
      },
    }),
    prisma.ticket.create({
        data: {
          title: 'شکستگی شیشه پنجره',
          description: 'شیشه پنجره واگن ۳ قطار ۱۰۸ شکسته است.',
          priority: 'low',
          status: 'resolved',
          wagonCode: '108',
          creatorId: operators[3].id,
        },
      }),
    prisma.ticket.create({
      data: {
        title: 'مشکل سیستم تهویه',
        description: 'سیستم تهویه واگن ۲ قطار ۳۰۱ کار نمی‌کند.',
        priority: 'medium',
        status: 'open',
        wagonCode: '301',
        creatorId: operators[4].id,
      },
    }),
  ])

  // ── Ticket logs ────────────────────────────────────────
  for (const ticket of tickets) {
    await prisma.ticketLog.create({
      data: {
        ticketId: ticket.id,
        actorId: ticket.creatorId,
        action: 'created',
        note: 'تیکت ایجاد شد',
      },
    })
  }

  // Log status change for in_progress ticket
  await prisma.ticketLog.create({
    data: {
      ticketId: tickets[1].id,
      actorId: admin.id,
      action: 'status_changed',
      note: 'در حال بررسی',
    },
  })

  // Log resolved ticket
  await prisma.ticketLog.create({
    data: {
      ticketId: tickets[3].id,
      actorId: admin.id,
      action: 'status_changed',
      note: 'شیشه تعویض شد',
    },
  })

  // ── Swap requests ──────────────────────────────────────
  const operatorShifts = await prisma.shift.findMany({
    where: { userId: { in: operators.slice(0, 2).map((u) => u.id) } },
    orderBy: { date: 'asc' },
    take: 4,
  })

  if (operatorShifts.length >= 4) {
    await prisma.swapRequest.create({
      data: {
        requesterId: operators[0].id,
        targetId: operators[1].id,
        sourceShiftId: operatorShifts[0].id,
        targetShiftId: operatorShifts[1].id,
        status: 'pending',
        note: 'مرخصی شخصی',
      },
    })
  }

  // ── Custom field definitions ───────────────────────────
  await prisma.customFieldDef.createMany({
    data: [
      {
        entityType: 'user',
        name: 'station',
        label: 'ایستگاه',
        type: 'text',
        required: false,
        sortOrder: 0,
      },
      {
        entityType: 'user',
        name: 'line',
        label: 'خط',
        type: 'select',
        options: JSON.stringify(['خط ۱', 'خط ۲', 'خط ۳', 'خط ۴']),
        required: false,
        sortOrder: 1,
      },
      {
        entityType: 'user',
        name: 'emergencyContact',
        label: 'تماس اضطراری',
        type: 'text',
        required: false,
        sortOrder: 2,
      },
    ],
  })

  // ── Audit logs ─────────────────────────────────────────
  for (const op of operators) {
    await prisma.auditLog.create({
      data: {
        actorId: superAdmin.id,
        entity: 'User',
        entityId: op.id,
        action: 'create',
        after: { name: op.name, nationalId: op.nationalId },
      },
    })
  }

  console.log('Seed complete:')
  console.log(`  Roles: super_admin, admin, operator`)
  console.log(`  Users: ${allOperators.length} (${superAdmin.nationalId} / admin123)`)
  console.log(`  Shifts: ${15 * allOperators.length} rows (today +/- 7 days)`)
  console.log(`  Bulletins: ${bulletins.length}`)
  console.log(`  Tickets: ${tickets.length}`)
  console.log(`  Custom fields: 3`)
  console.log(`  Audit logs: ${operators.length}`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
