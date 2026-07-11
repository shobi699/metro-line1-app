import { config } from 'dotenv'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const DEMO_PASSWORD = 'admin123'

async function main() {
  const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  const prisma = new PrismaClient({ adapter })
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // Clear non-upsert tables to allow repeat execution without constraint failures
  await prisma.shiftAssignment.deleteMany().catch(() => {})
  await prisma.shiftTemplate.deleteMany().catch(() => {})
  await prisma.setting.deleteMany().catch(() => {})
  await prisma.message.deleteMany().catch(() => {})
  await prisma.chatRoom.deleteMany().catch(() => {})
  await prisma.auditLog.deleteMany().catch(() => {})
  await prisma.customFieldDef.deleteMany().catch(() => {})
  await prisma.swapRequest.deleteMany().catch(() => {})
  await prisma.ticketLog.deleteMany().catch(() => {})
  await prisma.ticket.deleteMany().catch(() => {})
  await prisma.readReceipt.deleteMany().catch(() => {})
  await prisma.safetyBulletin.deleteMany().catch(() => {})
  await prisma.post.deleteMany().catch(() => {})
  
  // Clear UI Builder tables
  await prisma.uiMenuItem.deleteMany().catch(() => {})
  await prisma.uiDashboardWidget.deleteMany().catch(() => {})
  await prisma.uiPageVersion.deleteMany().catch(() => {})
  await prisma.uiPage.deleteMany().catch(() => {})
  await prisma.uiTheme.deleteMany().catch(() => {})

  // ── Roles (dynamic RBAC: flat permission keys) ─────────
  const roles = {} as Record<string, string>
  const adminPerms = [
    'users:read',
    'users:update',
    'shifts:create',
    'shifts:read',
    'shifts:update',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'bulletins:create',
    'bulletins:read',
    'bulletins:update',
    'posts:create',
    'posts:read',
    'posts:update',
    'posts:delete',
    'imports:create',
    'imports:read',
    'settings:read',
    'settings:update',
    'meetings:create',
    'meetings:read',
    'meetings:manage',
    'calendar:personal',
    'calendar:view',
    'calendar:view-team',
    'calendar-admin:holidays',
    'calendar-admin:events',
    'calendar-admin:config',
    'feedback:read',
    'feedback:respond',
    'notifications:send',
    'chat:access',
    'faults:create',
    'faults:read',
    'faults:review',
    'faults:repair',
    'faults:verify',
    'faults:defer',
    'faults:reopen',
    'fleet:manage',
    'fleet:read',
    'fault-catalog:manage',
    'fault-catalog:read',
    'fault-reports:view',
    'fault-reports:export',
  ]

  const operatorPerms = [
    'users:read',
    'shifts:read',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'bulletins:read',
    'posts:read',
    'imports:read',
    'settings:read',
    'meetings:create',
    'feedback:create',
    'chat:access',
    'faults:create',
    'faults:read',
    'fleet:read',
    'fault-catalog:read',
  ]


  for (const [key, name, perms, rank] of [
    ['super_admin', 'مدیر ارشد', ['*'], 2],
    ['admin', 'مدیر سیستم', adminPerms, 1],
    ['manager', 'مدیر', adminPerms, 1],
    ['chief', 'رئیس', adminPerms, 1],
    ['supervisor', 'سرپرست', adminPerms, 1],
    ['operator', 'اپراتور', operatorPerms, 0],
    ['shift_lead', 'مسئول شیفت', operatorPerms, 0],
    ['driver', 'راهبر', operatorPerms, 0],
    ['expert', 'کارشناس', operatorPerms, 0],
    ['dispatch_tech', 'تکنسین اعزام پذیرش', operatorPerms, 0],
    ['clerical', 'دفتری', operatorPerms, 0],
  ] as const) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { permissions: JSON.stringify(perms), rank, isSystem: true },
      create: {
        key,
        title: name,
        permissions: JSON.stringify(perms),
        rank,
        isSystem: true,
      },
    })
    roles[key] = role.id
  }

  // ── Users ──────────────────────────────────────────────
  const operatorNames: Array<{ name: string; personnelCode: string; phone: string }> = [
    { name: 'علی رضایی', personnelCode: '1111111111', phone: '09121000001' },
    { name: 'محمد حسینی', personnelCode: '2222222222', phone: '09121000002' },
    { name: 'زهرا کریمی', personnelCode: '3333333333', phone: '09121000003' },
    { name: 'فاطمه محمدی', personnelCode: '4444444444', phone: '09121000004' },
    { name: 'امیر نوری', personnelCode: '5555555555', phone: '09121000005' },
    { name: 'سارا احمدی', personnelCode: '6666666666', phone: '09121000006' },
  ]

  const superAdmin = await prisma.user.upsert({
    where: { personnelCode: '0000000000' },
    update: {},
    create: {
      personnelCode: '0000000000',
      name: 'مدیر سیستم',
      phone: '09120000000',
      email: 'admin@metro.ir',
      passwordHash,
      status: 'active',
      roleId: roles.super_admin,
    },
  })

  const admin = await prisma.user.upsert({
    where: { personnelCode: '9999999999' },
    update: {},
    create: {
      personnelCode: '9999999999',
      name: 'مدیر خط',
      phone: '09120000009',
      email: 'lineadmin@metro.ir',
      passwordHash,
      status: 'active',
      roleId: roles.admin,
    },
  })

  const operators = []
  for (let i = 0; i < operatorNames.length; i++) {
    const op = operatorNames[i]
    // چرخش گروه و نوع شیفت: A/B/C چرخشی + هر چهارمین نفر ستادی
    const isStaff = i % 4 === 3
    const group = isStaff ? 'ستادی' : (['A', 'B', 'C'][i % 3])
    const shiftType = isStaff ? 'ستادی' : (i % 2 === 0 ? '9-15' : '12-24')
    const user = await prisma.user.upsert({
      where: { personnelCode: op.personnelCode },
      update: {},
      create: {
        personnelCode: op.personnelCode,
        name: op.name,
        phone: op.phone,
        passwordHash,
        status: 'active',
        roleId: roles.operator,
        customFields: { shift: group, shiftType },
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
      { entityType: 'User', name: 'personnelNo', label: 'کد پرسنلی', type: 'text', required: false, sortOrder: 0 },
      { entityType: 'User', name: 'idNumber', label: 'شماره شناسنامه', type: 'text', required: false, sortOrder: 1 },
      { entityType: 'User', name: 'fatherName', label: 'نام پدر', type: 'text', required: false, sortOrder: 2 },
      { entityType: 'User', name: 'shiftType', label: 'نوع شيفت', type: 'text', required: false, sortOrder: 3 },
      { entityType: 'User', name: 'shift', label: 'نام شيفت', type: 'text', required: false, sortOrder: 4 },
      { entityType: 'User', name: 'group', label: 'كد گروه راهبري', type: 'text', required: false, sortOrder: 5 },
      { entityType: 'User', name: 'post', label: 'عنوان پست', type: 'text', required: false, sortOrder: 6 },
      { entityType: 'User', name: 'drivingStatus', label: 'وضعيت راهبری', type: 'text', required: false, sortOrder: 7 },
      { entityType: 'User', name: 'birthDate', label: 'تاریخ تولد', type: 'text', required: false, sortOrder: 8 },
      { entityType: 'User', name: 'birthPlace', label: 'محل تولد', type: 'text', required: false, sortOrder: 9 },
      { entityType: 'User', name: 'issueDate', label: 'تاریخ صدور', type: 'text', required: false, sortOrder: 10 },
      { entityType: 'User', name: 'maritalStatus', label: 'وضعیت تاهل \r\n تعداد فرزند', type: 'text', required: false, sortOrder: 11 },
      { entityType: 'User', name: 'phone2', label: 'تلفن2', type: 'text', required: false, sortOrder: 12 },
      { entityType: 'User', name: 'phone3', label: 'تلفن3', type: 'text', required: false, sortOrder: 13 },
      { entityType: 'User', name: 'phone4', label: 'تلفن4', type: 'text', required: false, sortOrder: 14 },
      { entityType: 'User', name: 'education', label: 'اطلاعات \r\n تحصیلی', type: 'text', required: false, sortOrder: 15 },
      { entityType: 'User', name: 'hireDate', label: 'تاریخ استخدام \r\nگروه شغلی', type: 'text', required: false, sortOrder: 16 },
      { entityType: 'User', name: 'licenseDates', label: 'تاریخ پایه دو\r\nتاریخ پایه یک', type: 'text', required: false, sortOrder: 17 },
      { entityType: 'User', name: 'carSpecs', label: 'مشخصات \r\n خودرو', type: 'text', required: false, sortOrder: 18 },
      { entityType: 'User', name: 'insuranceNo', label: 'گروه خونی \r\nشماره بیمه', type: 'text', required: false, sortOrder: 19 },
      { entityType: 'User', name: 'address', label: 'آدرس پستی', type: 'text', required: false, sortOrder: 20 },
      { entityType: 'User', name: 'medicalExamValidity', label: 'اعتبار معاينه پزشكي', type: 'text', required: false, sortOrder: 21 },
      { entityType: 'User', name: 'startLocation', label: 'ايستگاه شروع', type: 'text', required: false, sortOrder: 22 },
      { entityType: 'User', name: 'driverPercent', label: 'درصد راهبر', type: 'text', required: false, sortOrder: 23 },
      { entityType: 'User', name: 'coDriverPercent', label: 'درصد كمك راهبري', type: 'text', required: false, sortOrder: 24 },
      { entityType: 'User', name: 'traineeDriverPercent', label: 'درصد راهبري آموزشي', type: 'text', required: false, sortOrder: 25 },
      { entityType: 'User', name: 'licenseClass1Date', label: 'تاریخ اخذ گواهینامه پایه1', type: 'text', required: false, sortOrder: 26 },
      { entityType: 'User', name: 'licenseClass2Date', label: 'تاریخ اخذ گواهینامه پایه2', type: 'text', required: false, sortOrder: 27 },
      { entityType: 'User', name: 'age', label: 'سن', type: 'text', required: false, sortOrder: 28 },
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
        after: { name: op.name, personnelCode: op.personnelCode },
      },
    })
  }

  // ── Chat rooms ─────────────────────────────────────────
  const adminIds = new Set([superAdmin.id, admin.id])

  const generalRoom = await prisma.chatRoom.create({
    data: {
      name: 'عمومی',
      type: 'group',
      kind: 'general',
      members: {
        create: allOperators.map((u) => ({
          userId: u.id,
          isAdmin: adminIds.has(u.id),
        })),
      },
    },
  })

  await prisma.chatRoom.create({
    data: {
      name: 'راهبران',
      type: 'group',
      kind: 'operators',
      members: {
        create: [admin, ...operators].map((u) => ({
          userId: u.id,
          isAdmin: u.id === admin.id,
        })),
      },
    },
  })

  await prisma.chatRoom.create({
    data: {
      name: 'مرکز فرمان (OCC)',
      type: 'group',
      kind: 'occ',
      members: {
        create: [superAdmin, admin].map((u) => ({
          userId: u.id,
          isAdmin: true,
        })),
      },
    },
  })

  await prisma.message.create({
    data: {
      roomId: generalRoom.id,
      senderId: admin.id,
      body: 'به سامانه گفت‌وگوی سیر و حرکت خط ۱ خوش آمدید.',
    },
  })

  // ── Content posts ──────────────────────────────────────
  await prisma.post.createMany({
    data: [
      {
        type: 'news',
        title: 'افتتاح سامانه یکپارچه سیر و حرکت خط ۱',
        slug: 'launch-line1-superapp-001abc',
        excerpt: 'سامانه پرسنلی و اطلاع‌رسانی خط ۱ به‌صورت رسمی آغاز به کار کرد.',
        body: 'با هدف یکپارچه‌سازی ارتباطات، آموزش و امور اداری، سامانه جدید معاونت سیر و حرکت خط ۱ راه‌اندازی شد. در این فاز ماژول‌های دفتر تلفن، چت، لوحه و ابلاغیه در دسترس است.',
        category: 'سازمانی',
        published: true,
        mandatory: false,
        authorId: admin.id,
      },
      {
        type: 'circular',
        title: 'بخش‌نامه رعایت فاصله ایمن در سکوها',
        slug: 'circular-platform-safety-002def',
        excerpt: 'دستورالعمل جدید فاصله ایمن مسافران از لبه سکو ابلاغ شد.',
        body: 'کلیه راهبران و پرسنل ایستگاه موظف‌اند نسبت به اطلاع‌رسانی فاصله ایمن مسافران از لبه سکو اقدام کنند. این بخش‌نامه از تاریخ ابلاغ لازم‌الاجراست.',
        category: 'ایمنی',
        published: true,
        mandatory: true,
        authorId: superAdmin.id,
      },
      {
        type: 'training',
        title: 'آموزش رویه توقف اضطراری قطار',
        slug: 'training-emergency-stop-003ghi',
        excerpt: 'ویدیو و دستورالعمل گام‌به‌گام توقف اضطراری قطار.',
        body: 'در این دوره آموزشی، مراحل صحیح توقف اضطراری قطار، اطلاع‌رسانی به مرکز فرمان و اقدامات ایمنی پس از توقف تشریح می‌شود.',
        category: 'فنی',
        published: true,
        mandatory: false,
        authorId: admin.id,
      },
    ],
  })

  // ── Settings ───────────────────────────────────────────
  await prisma.setting.createMany({
    data: [
      {
        key: 'general.appName',
        label: 'نام سامانه',
        description: 'عنوان فارسی اصلی سامانه در بالای صفحات و اپلیکیشن',
        type: 'text',
        value: JSON.stringify('سیر و حرکت خط یک مترو'),
        defaultValue: JSON.stringify('سیر و حرکت خط یک مترو'),
        category: 'general',
        isEnabled: true,
      },
      {
        key: 'general.brandColor',
        label: 'رنگ شاخص برند',
        description: 'کد هگز رنگ اصلی برند خط مترو (مثلاً قرمز برای خط ۱)',
        type: 'color',
        value: JSON.stringify('#e53935'),
        defaultValue: JSON.stringify('#e53935'),
        category: 'general',
        isEnabled: true,
      },
      {
        key: 'shifts.minRestHours',
        label: 'حداقل فاصله استراحت قانونی (ساعت)',
        description: 'حداقل ساعت استراحت اجباری بین پایان یک شیفت و شروع شیفت بعدی',
        type: 'number',
        value: JSON.stringify(12),
        defaultValue: JSON.stringify(12),
        category: 'shifts',
        min: 8,
        max: 24,
        isEnabled: true,
      },
      {
        key: 'tickets.allowNoWagon',
        label: 'امکان ثبت تیکت بدون شماره واگن',
        description: 'آیا کاربران می‌توانند خرابی‌هایی را ثبت کنند که مربوط به واگن خاصی نباشد؟',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'tickets.aiPriorityEnabled',
        label: 'تحلیلگر هوشمند اولویت AI',
        description: 'پیش‌بینی خودکار شدت و اولویت تیکت بر اساس متن گزارش خرابی',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'tickets.criticalKeywords',
        label: 'کلمات کلیدی اولویت بحرانی',
        description: 'کلمات کلیدی نشان‌دهنده اولویت بحرانی (جدا شده با کاما)',
        type: 'text',
        value: JSON.stringify('آتش,حریق,انفجار,سقوط,برق‌گرفتگی,خروج از ریل,ترمز اضطراری,دود'),
        defaultValue: JSON.stringify('آتش,حریق,انفجار,سقوط,برق‌گرفتگی,خروج از ریل,ترمز اضطراری,دود'),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'tickets.highKeywords',
        label: 'کلمات کلیدی اولویت عمده',
        description: 'کلمات کلیدی نشان‌دهنده اولویت عمده (جدا شده با کاما)',
        type: 'text',
        value: JSON.stringify('آسانسور,پله برقی,سیگنالینگ,تهویه,نشت آب,دوربین,سنسور'),
        defaultValue: JSON.stringify('آسانسور,پله برقی,سیگنالینگ,تهویه,نشت آب,دوربین,سنسور'),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'tickets.mediumKeywords',
        label: 'کلمات کلیدی اولویت جزئی',
        description: 'کلمات کلیدی نشان‌دهنده اولویت جزئی (جدا شده با کاما)',
        type: 'text',
        value: JSON.stringify('روشنایی,مانیتور,ساعت,بلندگو,تلفن,درب,صندلی'),
        defaultValue: JSON.stringify('روشنایی,مانیتور,ساعت,بلندگو,تلفن,درب,صندلی'),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'tickets.lowKeywords',
        label: 'کلمات کلیدی اولویت کم‌اهمیت',
        description: 'کلمات کلیدی نشان‌دهنده اولویت کم‌اهمیت (جدا شده با کاما)',
        type: 'text',
        value: JSON.stringify('نظافت,سطل زباله,پوستر,پله,سنگفرش,پنجره'),
        defaultValue: JSON.stringify('نظافت,سطل زباله,پوستر,پله,سنگفرش,پنجره'),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'chat.maxMessageLength',
        label: 'حداکثر طول پیام چت',
        description: 'حداکثر تعداد نویسه‌های مجاز برای هر پیام ارسالی در روم‌ها',
        type: 'number',
        value: JSON.stringify(1000),
        defaultValue: JSON.stringify(1000),
        category: 'chat',
        min: 100,
        max: 5000,
        isEnabled: true,
      },
      {
        key: 'mobile.enableSos',
        label: 'دکمه اضطراری SOS',
        description: 'فعال یا غیرفعال بودن دکمه اضطراری SOS در اپلیکیشن موبایل پرسنل',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.geofencingEnabled',
        label: 'حضور و غیاب Geofencing',
        description: 'ثبت حضور و غیاب هوشمند پرسنل بر اساس موقعیت مکانی جی‌پی‌اس ایستگاه‌ها',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.geofencingRadius',
        label: 'شعاع موقعیت‌یاب حضور و غیاب (متر)',
        description: 'حداکثر شعاع فاصله مجاز راهبر از ایستگاه برای چک‌این خودکار',
        type: 'number',
        value: JSON.stringify(100),
        defaultValue: JSON.stringify(100),
        category: 'mobile',
        min: 20,
        max: 1000,
        isEnabled: true,
      },
      {
        key: 'mobile.offlineCacheEnabled',
        label: 'ذخیره آفلاین اطلاعات',
        description: 'فعال‌سازی کش آفلاین دفتر تلفن و شیفت‌های کاری در محیط‌های بدون سیگنال تونل',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.sosRecipientPhone',
        label: 'شماره پیامک اضطراری SOS',
        description: 'شماره تلفن مستقیم دیسپچر مرکز فرمان جهت ارسال پیام اضطراری در زمان قطع اینترنت',
        type: 'text',
        value: JSON.stringify('09120000000'),
        defaultValue: JSON.stringify('09120000000'),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.activeTheme',
        label: 'تم پیش‌فرض موبایل',
        description: 'تم رنگی پیش‌فرض رابط کاربری موبایل',
        type: 'select',
        value: JSON.stringify('dark'),
        defaultValue: JSON.stringify('dark'),
        category: 'mobile',
        options: JSON.stringify(['dark', 'light', 'system']),
        isEnabled: true,
      },
      {
        key: 'mobile.dashboard.banner.enabled',
        label: 'نمایش بنر داشبورد',
        description: 'فعال یا غیرفعال بودن بنر تصویری در پایین داشبورد اپلیکیشن موبایل',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(false),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.dashboard.banner.url',
        label: 'لینک تصویر بنر داشبورد',
        description: 'آدرس اینترنتی (URL) تصویر بنر. برای نمایش بهتر از نسبت ابعاد مستطیل افقی استفاده کنید.',
        type: 'text',
        value: JSON.stringify('https://picsum.photos/id/1050/800/250'),
        defaultValue: JSON.stringify(''),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'mobile.dashboard.banner.link',
        label: 'لینک هدف بنر داشبورد',
        description: 'آدرس وب‌سایتی که با کلیک روی بنر باز می‌شود.',
        type: 'text',
        value: JSON.stringify('https://metro.tehran.ir'),
        defaultValue: JSON.stringify(''),
        category: 'mobile',
        isEnabled: true,
      },
      {
        key: 'shifts.showHolidays',
        label: 'نمایش تعطیلات در تقویم موبایل',
        description: 'آیا تعطیلات رسمی و مناسبت‌ها در تقویم موبایل پرسنل نمایش داده شود؟',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'shifts',
        isEnabled: true,
      },
      {
        key: 'faults.workflow.requireFinalVerification',
        label: 'الزام به تایید نهایی فالت‌ها',
        description: 'آیا رفع فالت نیاز به تایید نهایی توسط مدیر/ناظر دارد؟',
        type: 'boolean',
        value: JSON.stringify(true),
        defaultValue: JSON.stringify(true),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'faults.sla.review.hours',
        label: 'مهلت بازبینی فالت (ساعت)',
        description: 'مهلت بازبینی بر اساس اولویت به صورت ساختار JSON',
        type: 'text',
        value: JSON.stringify({ critical: 1, high: 4, medium: 12, low: 24 }),
        defaultValue: JSON.stringify({ critical: 1, high: 4, medium: 12, low: 24 }),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'faults.sla.repair.hours',
        label: 'مهلت تعمیر فالت (ساعت)',
        description: 'مهلت رفع خرابی بر اساس اولویت به صورت ساختار JSON',
        type: 'text',
        value: JSON.stringify({ critical: 4, high: 24, medium: 72, low: 168 }),
        defaultValue: JSON.stringify({ critical: 4, high: 24, medium: 72, low: 168 }),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'faults.recurrence.windowDays',
        label: 'پنجره تشخیص فالت تکراری (روز)',
        description: 'بازه زمانی برای بررسی وقوع خرابی مشابه در قطار',
        type: 'number',
        value: JSON.stringify(30),
        defaultValue: JSON.stringify(30),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'faults.persistent.thresholdDays',
        label: 'آستانه ماندگار شدن فالت (روز)',
        description: 'تعداد روزهای باز بودن فالت برای طبقه‌بندی به عنوان ماندگار',
        type: 'number',
        value: JSON.stringify(7),
        defaultValue: JSON.stringify(7),
        category: 'tickets',
        isEnabled: true,
      },
      {
        key: 'faults.autoAssign.byCategory',
        label: 'تخصیص خودکار تیم تعمیرات',
        description: 'نگاشت دسته‌بندی خرابی به نقش پرسنل فنی به صورت JSON',
        type: 'text',
        value: JSON.stringify({ BRK: 'expert', DRS: 'expert', HVAC: 'expert', SIG: 'expert', TRC: 'expert', BOG: 'expert', PAN: 'expert' }),
        defaultValue: JSON.stringify({ BRK: 'expert', DRS: 'expert', HVAC: 'expert', SIG: 'expert', TRC: 'expert', BOG: 'expert', PAN: 'expert' }),
        category: 'tickets',
        isEnabled: true,
      }
    ]
  })

  // ── Shift Cycle Templates (server-side source of truth) ─────────
  const tplRotational1 = await prisma.shiftTemplate.create({
    data: {
      name: 'سیکل ۶ روزه عملیاتی - تیپ ۱ (نوبتی)',
      type: 'rotational',
      length: 6,
      shifts: [
        { day: 1, code: 'morning', label: 'صبح‌کار (۹ ساعته)', hours: 9, startTime: '07:00', endTime: '16:00' },
        { day: 2, code: 'morning', label: 'صبح‌کار (۹ ساعته)', hours: 9, startTime: '07:00', endTime: '16:00' },
        { day: 3, code: 'evening', label: 'عصرکار (۹ ساعته)', hours: 9, startTime: '16:00', endTime: '01:00' },
        { day: 4, code: 'evening', label: 'عصرکار (۹ ساعته)', hours: 9, startTime: '16:00', endTime: '01:00' },
        { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ],
    },
  })

  const tplRotational2 = await prisma.shiftTemplate.create({
    data: {
      name: 'سیکل ۶ روزه عملیاتی - تیپ ۲ (۱۲ ساعته)',
      type: 'rotational',
      length: 6,
      shifts: [
        { day: 1, code: 'morning', label: 'روزکار (۱۲ ساعته)', hours: 12, startTime: '07:00', endTime: '19:00' },
        { day: 2, code: 'morning', label: 'روزکار (۱۲ ساعته)', hours: 12, startTime: '07:00', endTime: '19:00' },
        { day: 3, code: 'night', label: 'شب‌کار (۱۲ ساعته)', hours: 12, startTime: '19:00', endTime: '07:00' },
        { day: 4, code: 'night', label: 'شب‌کار (۱۲ ساعته)', hours: 12, startTime: '19:00', endTime: '07:00' },
        { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ],
    },
  })

  const tplStaff = await prisma.shiftTemplate.create({
    data: {
      name: 'سیکل ۷ روزه ثابت ستادی (اداری)',
      type: 'staff',
      length: 7,
      shifts: [
        { day: 1, code: 'office', label: 'اداری (شنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 2, code: 'office', label: 'اداری (یکشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 3, code: 'office', label: 'اداری (دوشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 4, code: 'office', label: 'اداری (سه‌شنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 5, code: 'office', label: 'اداری (چهارشنبه)', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 6, code: 'off', label: 'تعطیل (پنجشنبه)', hours: 0, startTime: '', endTime: '' },
        { day: 7, code: 'off', label: 'تعطیل (جمعه)', hours: 0, startTime: '', endTime: '' },
      ],
    },
  })

  const anchorA = new Date()
  anchorA.setHours(0, 0, 0, 0)
  anchorA.setDate(anchorA.getDate() - 2)

  const anchorB = new Date(anchorA)
  anchorB.setDate(anchorB.getDate() + 2)

  const anchorC = new Date(anchorA)
  anchorC.setDate(anchorC.getDate() + 4)

  const anchorStaff = new Date(anchorA)
  anchorStaff.setDate(anchorStaff.getDate() - 2)

  // انتساب بر اساس کلید ترکیبی «{نوع شیفت}:{گروه}»:
  // نوع 9-15 → الگوی ۹ ساعته، نوع 12-24 → الگوی ۱۲ ساعته، ستادی → الگوی ستادی.
  await prisma.shiftAssignment.createMany({
    data: [
      // گروه‌های ۹ ساعته
      { templateId: tplRotational1.id, targetType: 'group', targetId: '9-15:A', anchorDate: anchorA },
      { templateId: tplRotational1.id, targetType: 'group', targetId: '9-15:B', anchorDate: anchorB },
      { templateId: tplRotational1.id, targetType: 'group', targetId: '9-15:C', anchorDate: anchorC },
      // گروه‌های ۱۲ ساعته
      { templateId: tplRotational2.id, targetType: 'group', targetId: '12-24:A', anchorDate: anchorA },
      { templateId: tplRotational2.id, targetType: 'group', targetId: '12-24:B', anchorDate: anchorB },
      { templateId: tplRotational2.id, targetType: 'group', targetId: '12-24:C', anchorDate: anchorC },
      // ستادی
      { templateId: tplStaff.id, targetType: 'group', targetId: 'ستادی:ستادی', anchorDate: anchorStaff },
    ],
  })

  // ── Seed UI Builder defaults ──────────────────────
  await prisma.uiTheme.create({
    data: {
      primaryColor: '#ae0011',
      accentColor: '#575e70',
      radius: 12,
      fontSize: 'md',
      darkModeDefault: false,
      logoUrl: '',
    }
  })

  await prisma.uiMenuItem.createMany({
    data: [
      { label: 'پروفایل', icon: 'User', route: 'ProfileScreen', orderIndex: 4, isVisible: true },
      { label: 'گفتگو', icon: 'MessageSquare', route: 'ChatScreen', orderIndex: 3, isVisible: true },
      { label: 'اعلان‌ها', icon: 'Bell', route: 'NotificationsScreen', orderIndex: 2, isVisible: true },
      { label: 'شیفت‌ها', icon: 'Calendar', route: 'CalendarScreen', orderIndex: 1, isVisible: true },
      { label: 'داشبورد', icon: 'LayoutDashboard', route: 'HomeScreen', orderIndex: 0, isVisible: true },
    ]
  })

  await prisma.uiDashboardWidget.createMany({
    data: [
      { widgetType: 'stat_card', title: 'شیفت امروز', size: 'md', orderIndex: 0, isVisible: true, configJson: JSON.stringify({ source: 'shift' }) },
      { widgetType: 'chart', title: 'عملکرد هفتگی کیلومتر رانندگی', size: 'md', orderIndex: 1, isVisible: true, configJson: JSON.stringify({ type: 'bar', source: 'kpi' }) },
      { widgetType: 'list', title: 'آخرین بخشنامه‌های ایمنی', size: 'lg', orderIndex: 2, isVisible: true, configJson: JSON.stringify({ limit: 3, source: 'bulletins' }) },
    ]
  })

  console.log('Seed complete:')
  console.log(`  Roles: super_admin, admin, operator`)
  console.log(`  Users: ${allOperators.length} (${superAdmin.personnelCode} / admin123)`)
  console.log(`  Shifts: ${15 * allOperators.length} rows (today +/- 7 days)`)
  console.log(`  Bulletins: ${bulletins.length}`)
  console.log(`  Tickets: ${tickets.length}`)
  console.log(`  Custom fields: 3`)
  console.log(`  Audit logs: ${operators.length}`)
  console.log(`  Chat rooms: 3 (عمومی، راهبران، مرکز فرمان)`)
  console.log(`  Posts: 3 (اخبار، بخش‌نامه، آموزش)`)
  console.log(`  Shift templates: 3 (نوبتی ۹ ساعت، ۱۲ ساعت، ستادی)`)
  console.log(`  UI Builder Default Menu, Theme and Widgets Seeded.`)

  // Seed Fleet & Fault Catalog
  await seedFaultSubsystemData(prisma)

  await prisma.$disconnect()
}

async function seedFaultSubsystemData(prisma: any) {
  // 1. Seed Trains & Wagons
  const trainsData = [
    { number: '101', series: 'DC01', manufacturer: 'CNR' },
    { number: '102', series: 'DC01', manufacturer: 'CNR' },
    { number: '103', series: 'DC01', manufacturer: 'CNR' },
    { number: '104', series: 'AC02', manufacturer: 'CRRC' },
    { number: '105', series: 'AC02', manufacturer: 'CRRC' },
    { number: '106', series: 'AC02', manufacturer: 'CRRC' },
    { number: '107', series: 'AC02', manufacturer: 'CRRC' },
    { number: '108', series: 'AC02', manufacturer: 'CRRC' },
    { number: '109', series: 'AC02', manufacturer: 'CRRC' },
    { number: '110', series: 'AC02', manufacturer: 'CRRC' },
  ]

  for (const t of trainsData) {
    const train = await prisma.train.upsert({
      where: { trainNumber: t.number },
      update: { fleetSeries: t.series, manufacturer: t.manufacturer },
      create: { trainNumber: t.number, fleetSeries: t.series, manufacturer: t.manufacturer, status: 'active' },
    })

    // Upsert 7 wagons for each train
    for (let pos = 1; pos <= 7; pos++) {
      const wagonCode = `${t.number}-${pos}`
      await prisma.wagon.upsert({
        where: { trainId_position: { trainId: train.id, position: pos } },
        update: { wagonCode },
        create: { trainId: train.id, position: pos, wagonCode, wagonType: pos === 1 || pos === 7 ? 'Mc' : pos === 3 || pos === 5 ? 'M' : 'Tp' },
      })
    }
  }

  // 2. Seed Fault Categories
  const categories = [
    { code: 'BRK', title: 'ترمز' },
    { code: 'DRS', title: 'درب‌ها' },
    { code: 'TRC', title: 'کشش (Traction)' },
    { code: 'HVAC', title: 'تهویه مطبوع' },
    { code: 'SIG', title: 'سیگنالینگ و ارتباطات' },
    { code: 'BOG', title: 'بوژی و چرخ‌ها' },
    { code: 'PAN', title: 'پانتوگراف و شبکه برق' },
  ]

  const categoryMap = new Map<string, string>()
  for (const c of categories) {
    const cat = await prisma.faultCategory.upsert({
      where: { code: c.code },
      update: { title: c.title },
      create: { code: c.code, title: c.title },
    })
    categoryMap.set(c.code, cat.id)
  }

  // 3. Seed Fault Codes
  const faultCodes = [
    { categoryCode: 'BRK', code: 'BRK-012', title: 'عدم آزادسازی ترمز واگن', defaultPriority: 'high', safetyCritical: true, requiresWagon: true, keywords: 'ترمز, قفل, چسبیدن, سیلندر', aliases: 'ترمز ول نمیکنه | چرخ قفله | ترمز چسبیده', operatorGuide: 'سوپاپ ترمز واگن مربوطه را بکشید و مجدد تست کنید.' },
    { categoryCode: 'BRK', code: 'BRK-007', title: 'گیرپاژ کفشک ترمز', defaultPriority: 'critical', safetyCritical: true, requiresWagon: true, keywords: 'کفشک, گیرپاژ, سیلندر, داغ', aliases: 'کفشک ترمز چسبیده | لنت داغ شده | دود لنت' },
    { categoryCode: 'DRS', code: 'DRS-004', title: 'گیر مکانیکی درب', defaultPriority: 'medium', safetyCritical: false, requiresWagon: true, keywords: 'درب, گیر, مانع, باز', aliases: 'درب گیر کرده | در باز نمیشه | مانع بین در' },
    { categoryCode: 'DRS', code: 'DRS-001', title: 'خرابی لیمیت سوئیچ درب', defaultPriority: 'medium', safetyCritical: false, requiresWagon: true, keywords: 'لیمیت, سوئیچ, درب, بازخورد', aliases: 'چراغ درب روشن میمونه | فیدبک درب | لیمیت درب' },
    { categoryCode: 'HVAC', code: 'HVAC-001', title: 'عدم کارکرد کمپرسور تهویه', defaultPriority: 'low', safetyCritical: false, requiresWagon: true, keywords: 'تهویه, کولر, گرم, کمپرسور', aliases: 'باد تهویه گرمه | کولر کار نمیکنه | کمپرسور خراب' },
    { categoryCode: 'SIG', code: 'SIG-001', title: 'قطع ارتباط رادیویی قطار', defaultPriority: 'high', safetyCritical: true, requiresWagon: false, keywords: 'رادیو, بی سیم, بیسیم, سیگنال', aliases: 'بیسیم قطعه | ارتباط با OCC قطعه | آنتن بیسیم نداریم' },
    { categoryCode: 'TRC', code: 'TRC-001', title: 'خطای اینورتر کشش', defaultPriority: 'high', safetyCritical: true, requiresWagon: true, keywords: 'اینورتر, کشش, تراکشن, موتور', aliases: 'تراکشن فالت | موتور کار نمیکنه | خطای اینورتر' },
    { categoryCode: 'BOG', code: 'BOG-003', title: 'قفل بوژی', defaultPriority: 'critical', safetyCritical: true, requiresWagon: true, keywords: 'بوژی, چرخ, قفل, بلبرینگ', aliases: 'بوژی قفله | دمای بلبرینگ بالا | چرخ نمیچرخه' },
    { categoryCode: 'PAN', code: 'PAN-001', title: 'خرابی بوق پانتوگراف', defaultPriority: 'critical', safetyCritical: true, requiresWagon: false, keywords: 'پانتوگراف, بوق, شبکه, برق', aliases: 'پانتو بوق زده | آرک پانتوگراف | برق قطع شده' },
  ]

  for (const f of faultCodes) {
    const categoryId = categoryMap.get(f.categoryCode)
    if (!categoryId) continue

    await prisma.faultCode.upsert({
      where: { code: f.code },
      update: {
        title: f.title,
        defaultPriority: f.defaultPriority,
        safetyCritical: f.safetyCritical,
        requiresWagon: f.requiresWagon,
        keywords: f.keywords,
        aliases: f.aliases,
        operatorGuide: f.operatorGuide,
      },
      create: {
        categoryId,
        code: f.code,
        title: f.title,
        defaultPriority: f.defaultPriority as any,
        safetyCritical: f.safetyCritical,
        requiresWagon: f.requiresWagon,
        keywords: f.keywords,
        aliases: f.aliases,
        operatorGuide: f.operatorGuide,
      },
    })
  }

  // ── Seed Feedback Categories ──────────────────────────
  const feedbackCategories = [
    { key: 'safety_issue', title: 'گزارش مشکل ایمنی', icon: 'ShieldAlert', assigneeRole: 'supervisor', slaHours: { firstResponse: 12, resolve: 48 }, confidential: true, allowAnonymous: true },
    { key: 'welfare', title: 'شکایت رفاهی', icon: 'Heart', assigneeRole: 'expert', slaHours: { firstResponse: 24, resolve: 120 }, confidential: false, allowAnonymous: true },
    { key: 'ceo_message', title: 'پیام به مدیرعامل', icon: 'UserCheck', assigneeRole: 'manager', slaHours: { firstResponse: 72, resolve: 240 }, confidential: true, allowAnonymous: true },
  ]
  for (const fc of feedbackCategories) {
    await prisma.feedbackCategory.upsert({
      where: { key: fc.key },
      update: {
        title: fc.title,
        icon: fc.icon,
        assigneeRole: fc.assigneeRole,
        slaHours: fc.slaHours,
        confidential: fc.confidential,
        allowAnonymous: fc.allowAnonymous,
      },
      create: {
        key: fc.key,
        title: fc.title,
        icon: fc.icon,
        assigneeRole: fc.assigneeRole,
        slaHours: fc.slaHours,
        confidential: fc.confidential,
        allowAnonymous: fc.allowAnonymous,
      },
    })
  }

  // ── Seed Meeting Rooms ──────────────────────────
  const meetingRooms = [
    { name: 'اتاق جلسات دپو غرب', location: 'ساختمان اداری دپو، طبقه ۱', capacity: 12 },
    { name: 'اتاق جلسات ایستگاه امام خمینی', location: 'ایستگاه امام خمینی، اتاق سرپرستی', capacity: 6 },
  ]
  for (const room of meetingRooms) {
    const existing = await prisma.meetingRoom.findFirst({ where: { name: room.name } })
    if (!existing) {
      await prisma.meetingRoom.create({ data: room })
    }
  }

  // ── Seed Meeting Types ──────────────────────────
  const meetingTypes = [
    { key: 'public_visit', title: 'ملاقات مردمی با مدیر', durationMin: 15, whoCanBook: ['operator', 'driver'], approval: 'host' },
    { key: 'technical', title: 'جلسه فنی و هماهنگی', durationMin: 60, whoCanBook: ['supervisor', 'manager'], approval: 'auto' },
  ]
  for (const mt of meetingTypes) {
    await prisma.meetingType.upsert({
      where: { key: mt.key },
      update: {
        title: mt.title,
        durationMin: mt.durationMin,
        whoCanBook: mt.whoCanBook,
        approval: mt.approval,
      },
      create: {
        key: mt.key,
        title: mt.title,
        durationMin: mt.durationMin,
        whoCanBook: mt.whoCanBook,
        approval: mt.approval,
      },
    })
  }

  // ── Seed Document Types ──────────────────────────
  const docTypes = [
    { key: 'national_card', title: 'کارت ملی', hasExpiry: false, needsReview: true },
    { key: 'health_cert', title: 'کارت سلامت و طب کار', hasExpiry: true, remindDays: [60, 30, 7], needsReview: true },
    { key: 'operator_license_A', title: 'گواهینامه راهبری پایه ۱', hasExpiry: true, remindDays: [90, 60, 30], needsReview: true },
  ]
  for (const dt of docTypes) {
    await prisma.documentType.upsert({
      where: { key: dt.key },
      update: {
        title: dt.title,
        hasExpiry: dt.hasExpiry,
        remindDays: dt.remindDays,
        needsReview: dt.needsReview,
      },
      create: {
        key: dt.key,
        title: dt.title,
        hasExpiry: dt.hasExpiry,
        remindDays: dt.remindDays,
        needsReview: dt.needsReview,
      },
    })
  }

  // ── Seed Radio Channels ──────────────────────────
  const radioChannels = [
    { key: 'occ-main', label: 'کانال اصلی راهبران (CH 1)', code: '440.125 MHz', color: 'red', sortOrder: 1 },
    { key: 'station-talk', label: 'کانال خدمات ایستگاهی (CH 2)', code: '442.250 MHz', color: 'blue', sortOrder: 2 },
    { key: 'depot-tech', label: 'کانال دپو و مانور (CH 3)', code: '445.500 MHz', color: 'green', sortOrder: 3 },
  ]
  for (const rc of radioChannels) {
    await prisma.radioChannel.upsert({
      where: { key: rc.key },
      update: {
        label: rc.label,
        code: rc.code,
        color: rc.color,
        sortOrder: rc.sortOrder,
      },
      create: {
        key: rc.key,
        label: rc.label,
        code: rc.code,
        color: rc.color,
        sortOrder: rc.sortOrder,
      },
    })
  }

  // ── Seed Radio Phrases ──────────────────────────
  const radioPhrases = [
    { label: 'دریافت شد', text: 'پیام شما دریافت شد، تمام.' },
    { label: 'موقعیت حادثه', text: 'در موقعیت کیلومتر ... متوقف شده‌ام، لطفا پشتیبانی هماهنگ کنید.' },
    { label: 'توقف اضطراری', text: 'توقف اضطراری اعلام می‌کنم، ریل سوم بی برق شود.' },
  ]
  for (const rp of radioPhrases) {
    const existing = await prisma.radioPhrase.findFirst({ where: { label: rp.label } })
    if (!existing) {
      await prisma.radioPhrase.create({ data: rp })
    }
  }

  // ── Seed Content Categories ──────────────────────────
  const contentCategories = [
    { key: 'news', label: 'اخبار سازمانی', color: 'blue', type: 'news' },
    { key: 'technical', label: 'آموزش‌های فنی', color: 'green', type: 'training' },
    { key: 'circular', label: 'بخشنامه‌های عمومی', color: 'purple', type: null },
  ]
  for (const cc of contentCategories) {
    await prisma.contentCategory.upsert({
      where: { key: cc.key },
      update: {
        label: cc.label,
        color: cc.color,
        type: cc.type,
      },
      create: {
        key: cc.key,
        label: cc.label,
        color: cc.color,
        type: cc.type,
      },
    })
  }

  // ── Seed Courses and Videos ──────────────────────────
  const courses = [
    {
      title: 'دوره جامع عیب‌یابی درب‌های سری ۳۰۰',
      description: 'آموزش نحوه عیب‌یابی لیمیت سوئیچ‌ها و شیر بایکوت درب واگن‌ها در زمان اضطراری.',
      icon: 'GraduationCap',
      certValidityMonths: 12,
      passScore: 70,
    },
  ]
  for (const c of courses) {
    const existing = await prisma.course.findFirst({ where: { title: c.title } })
    if (!existing) {
      const course = await prisma.course.create({
        data: {
          title: c.title,
          description: c.description,
          icon: c.icon,
          certValidityMonths: c.certValidityMonths,
          passScore: c.passScore,
        },
      })
      // Add a video
      await prisma.courseVideo.create({
        data: {
          courseId: course.id,
          title: 'بخش اول: معرفی لیمیت سوئیچ‌های مغناطیسی درب واگن ۳',
          excerpt: 'معرفی عملکرد و کد خطای مربوط به عدم بسته شدن فیدبک درب.',
          mediaUrl: '/videos/sample.mp4',
          coverUrl: '/images/cover.png',
          durationSeconds: 120,
          mandatory: true,
          points: 15,
          quiz: [
            { q: 'شیر بایکوت درب در کدام بخش واگن قرار دارد؟', options: ['زیر صندلی مسافران', 'کنار درب خروجی', 'کابین راننده'], correct: 0 },
          ],
        },
      })
    }
  }
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
