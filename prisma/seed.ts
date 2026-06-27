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
    'meetings:read',
    'meetings:manage',
    'feedback:read',
    'feedback:respond',
    'notifications:send',
    'chat:access',
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
        name,
        permissions: JSON.stringify(perms),
        rank,
        isSystem: true,
      },
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
        after: { name: op.name, nationalId: op.nationalId },
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

  void tplRotational1

  const anchorA = new Date()
  anchorA.setHours(0, 0, 0, 0)
  anchorA.setDate(anchorA.getDate() - 2)

  const anchorB = new Date(anchorA)
  anchorB.setDate(anchorB.getDate() + 2)

  const anchorC = new Date(anchorA)
  anchorC.setDate(anchorC.getDate() + 4)

  const anchorStaff = new Date(anchorA)
  anchorStaff.setDate(anchorStaff.getDate() - 2)

  await prisma.shiftAssignment.createMany({
    data: [
      { templateId: tplRotational2.id, targetType: 'group', targetId: 'A', anchorDate: anchorA },
      { templateId: tplRotational2.id, targetType: 'group', targetId: 'B', anchorDate: anchorB },
      { templateId: tplRotational2.id, targetType: 'group', targetId: 'C', anchorDate: anchorC },
      { templateId: tplStaff.id, targetType: 'group', targetId: 'Staff', anchorDate: anchorStaff },
    ],
  })

  console.log('Seed complete:')
  console.log(`  Roles: super_admin, admin, operator`)
  console.log(`  Users: ${allOperators.length} (${superAdmin.nationalId} / admin123)`)
  console.log(`  Shifts: ${15 * allOperators.length} rows (today +/- 7 days)`)
  console.log(`  Bulletins: ${bulletins.length}`)
  console.log(`  Tickets: ${tickets.length}`)
  console.log(`  Custom fields: 3`)
  console.log(`  Audit logs: ${operators.length}`)
  console.log(`  Chat rooms: 3 (عمومی، راهبران، مرکز فرمان)`)
  console.log(`  Posts: 3 (اخبار، بخش‌نامه، آموزش)`)
  console.log(`  Shift templates: 3 (نوبتی ۹ ساعت، ۱۲ ساعت، ستادی)`)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
