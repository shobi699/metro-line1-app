import { PrismaClient, Prisma, type ShiftCode } from '@/generated/prisma/client'
import bcrypt from 'bcryptjs'
import { jalaliPeriodId } from '@/lib/dayjs'
import { ensurePersonnelCustomFields } from './modules/custom-fields/service'

const DEMO_PASSWORD = 'admin123'

function logSeed(_message?: string) {
  // silent in production
}

export async function seedDatabase(prisma: PrismaClient, force = false) {
  logSeed('seedDatabase call initiated')
  try {
    if (force) {
      logSeed('Force flag provided. Cleaning up database tables...')
      try {
        await prisma.readReceipt.deleteMany()
        await prisma.safetyBulletin.deleteMany()
        await prisma.knowledgeArticle.deleteMany()
        await prisma.checklistRecord.deleteMany()
        await prisma.checklistTemplate.deleteMany()
        await prisma.performanceAppeal.deleteMany()
        await prisma.performanceLog.deleteMany()
        await prisma.performanceActionType.deleteMany()
        await prisma.competency.deleteMany()
        await prisma.scoreSnapshot.deleteMany()
        await prisma.nomination.deleteMany()
        await prisma.tripAssignment.deleteMany()
        await prisma.trip.deleteMany()
        await prisma.rosterVersion.deleteMany()
        await prisma.rosterDay.deleteMany()
        await prisma.user.deleteMany()
        await prisma.role.deleteMany()
        await prisma.setting.deleteMany()
        await prisma.uiMenuItem.deleteMany().catch(() => {})
        await prisma.uiDashboardWidget.deleteMany().catch(() => {})
        await prisma.uiPageVersion.deleteMany().catch(() => {})
        await prisma.uiPage.deleteMany().catch(() => {})
        await prisma.uiTheme.deleteMany().catch(() => {})
        logSeed('Database clean up completed successfully.')
      } catch (cleanupErr) {
        logSeed(`Error during cleanup: ${cleanupErr}`)
      }
    }
    const count = await prisma.role.count()
    logSeed(`Current role count in database: ${count}`)
    if (count > 0 && !force) {
      logSeed('Database already populated. Ensuring custom fields and settings...')
      try {
        await ensurePersonnelCustomFields()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logSeed(`Failed to ensure personnel custom fields on boot: ${msg}`)
      }
      try {
        const settingsCount = await prisma.setting.count()
        if (settingsCount === 0) {
          logSeed('Settings empty. Seeding default settings...')
          await seedDefaultSettings(prisma)
          logSeed('Default settings seeded successfully.')
        } else {
          logSeed('Settings already exist, skipping.')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logSeed(`Failed to seed settings on boot: ${msg}`)
      }

      // Also check if performance tables need seeding (added after initial DB creation)
      try {
        const competencyCount = await prisma.competency.count()
        if (competencyCount === 0) {
          logSeed('Competency table empty. Seeding performance tables...')
          await seedPerformanceTables(prisma)
          logSeed('Performance tables seeded successfully.')
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logSeed(`Failed to seed performance tables on boot: ${msg}`)
      }

      return
    }

    logSeed('Database empty. Seeding roles and default users...')
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

    // ── Roles ──────────────────────────────────────────────
    const roles = {} as Record<string, string>
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
        'مدیر سیستم',
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
        'manager',
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
        'chief',
        'رئیس',
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
        'supervisor',
        'سرپرست',
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
      [
        'shift_lead',
        'مسئول شیفت',
        {
          users: ['read'],
          shifts: ['read'],
          tickets: ['create', 'read', 'update'],
          bulletins: ['read'],
          imports: ['read'],
          settings: ['read'],
        },
      ],
      [
        'driver',
        'راهبر',
        {
          users: ['read'],
          shifts: ['read'],
          tickets: ['create', 'read', 'update'],
          bulletins: ['read'],
          imports: ['read'],
          settings: ['read'],
        },
      ],
      [
        'expert',
        'کارشناس',
        {
          users: ['read'],
          shifts: ['read'],
          tickets: ['create', 'read', 'update'],
          bulletins: ['read'],
          imports: ['read'],
          settings: ['read'],
        },
      ],
      [
        'dispatch_tech',
        'تکنسین اعزام پذیرش',
        {
          users: ['read'],
          shifts: ['read'],
          tickets: ['create', 'read', 'update'],
          bulletins: ['read'],
          imports: ['read'],
          settings: ['read'],
        },
      ],
      [
        'clerical',
        'دفتری',
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
        where: { key: key as string },
        update: { permissions: JSON.stringify(perms) },
        create: { key: key as string, name, permissions: JSON.stringify(perms) },
      })
      roles[key] = role.id
    }
    logSeed('Roles seeded successfully.')

    // ── Users ──────────────────────────────────────────────
    const superAdmin = await prisma.user.upsert({
      where: { nationalId: '0000000000' },
      update: {
        customFields: {
          personnelNo: '901001',
          phone2: '09191002001',
          post: 'مدیر',
          shift: 'ستادی',
          shiftType: 'ستادی',
          certificate: 'پایه یک',
          group: 1,
          hireDate: '۱۳۹۵/۰۱/۱۵',
          birthDate: '۱۳۵۸/۱۲/۰۵',
          startLocation: 'تجریش'
        }
      },
      create: {
        nationalId: '0000000000',
        name: 'مدیر سیستم',
        phone: '09120000000',
        email: 'admin@metro.ir',
        passwordHash,
        status: 'active',
        roleId: roles.super_admin,
        customFields: {
          personnelNo: '901001',
          phone2: '09191002001',
          post: 'مدیر',
          shift: 'ستادی',
          shiftType: 'ستادی',
          certificate: 'پایه یک',
          group: 1,
          hireDate: '۱۳۹۵/۰۱/۱۵',
          birthDate: '۱۳۵۸/۱۲/۰۵',
          startLocation: 'تجریش'
        }
      },
    })

    const admin = await prisma.user.upsert({
      where: { nationalId: '9999999999' },
      update: {
        customFields: {
          personnelNo: '901002',
          phone2: '09191002002',
          post: 'رئیس',
          shift: 'ستادی',
          shiftType: 'ستادی',
          certificate: 'پایه یک',
          group: 1,
          hireDate: '۱۳۹۸/۰۷/۰۱',
          birthDate: '۱۳۶۳/۰۵/۲۰',
          startLocation: 'تجریش'
        }
      },
      create: {
        nationalId: '9999999999',
        name: 'مدیر خط',
        phone: '09120000009',
        email: 'lineadmin@metro.ir',
        passwordHash,
        status: 'active',
        roleId: roles.admin,
        customFields: {
          personnelNo: '901002',
          phone2: '09191002002',
          post: 'رئیس',
          shift: 'ستادی',
          shiftType: 'ستادی',
          certificate: 'پایه یک',
          group: 1,
          hireDate: '۱۳۹۸/۰۷/۰۱',
          birthDate: '۱۳۶۳/۰۵/۲۰',
          startLocation: 'تجریش'
        }
      },
    })

    const operatorDefinitions = [
      {
        name: 'علی رضایی',
        nationalId: '1111111111',
        phone: '09121000001',
        roleKey: 'driver',
        customFields: {
          personnelNo: '100001',
          phone2: '09191002011',
          post: 'راهبر',
          shift: 'A',
          shiftType: '9 ساعته',
          certificate: 'پایه یک',
          group: 12,
          hireDate: '۱۴۰۰/۱۰/۱۵',
          birthDate: '۱۳۷۲/۰۴/۱۱',
          startLocation: 'شهرری'
        }
      },
      {
        name: 'محمد حسینی',
        nationalId: '2222222222',
        phone: '09121000002',
        roleKey: 'shift_lead',
        customFields: {
          personnelNo: '100002',
          phone2: '09191002012',
          post: 'مسئول شیفت',
          shift: 'B',
          shiftType: '12 ساعته',
          certificate: 'پایه دو',
          group: 3,
          hireDate: '۱۳۹۹/۰۵/۰۱',
          birthDate: '۱۳۶۸/۰۸/۲۲',
          startLocation: 'تجریش'
        }
      },
      {
        name: 'زهرا کریمی',
        nationalId: '3333333333',
        phone: '09121000003',
        roleKey: 'expert',
        customFields: {
          personnelNo: '100003',
          phone2: '09191002013',
          post: 'کارشناس',
          shift: 'C',
          shiftType: '9 ساعته',
          certificate: 'فاقد گواهینامه',
          group: 5,
          hireDate: '۱۴۰۱/۱۲/۰1',
          birthDate: '۱۳۷۵/۰۲/۱۴',
          startLocation: 'پایانه فتح آباد'
        }
      },
      {
        name: 'فاطمه محمدی',
        nationalId: '4444444444',
        phone: '09121000004',
        roleKey: 'dispatch_tech',
        customFields: {
          personnelNo: '100004',
          phone2: '09191002014',
          post: 'تکنسین اعزام پذیرش',
          shift: 'A',
          shiftType: '12 ساعته',
          certificate: 'فاقد گواهینامه',
          group: 2,
          hireDate: '۱۴۰۲/۰۳/۱۰',
          birthDate: '۱۳۷۶/۰۶/۰۵',
          startLocation: 'شاهد باقر شهر'
        }
      },
      {
        name: 'امیر نوری',
        nationalId: '5555555555',
        roleKey: 'supervisor',
        phone: '09121000005',
        customFields: {
          personnelNo: '100005',
          phone2: '09191002015',
          post: 'سرپرست',
          shift: 'B',
          shiftType: '9 ساعته',
          certificate: 'پایه یک',
          group: 1,
          hireDate: '۱۳۹۷/۰۲/۲۰',
          birthDate: '۱۳۶۴/۱۰/۳۰',
          startLocation: 'تجریش'
        }
      },
      {
        name: 'سارا احمدی',
        nationalId: '6666666666',
        roleKey: 'clerical',
        phone: '09121000006',
        customFields: {
          personnelNo: '100006',
          phone2: '09191002016',
          post: 'دفتری',
          shift: 'ستادی',
          shiftType: 'ستادی',
          certificate: 'فاقد گواهینامه',
          group: 4,
          hireDate: '۱۴۰۱/۰۷/۰۱',
          birthDate: '۱۳۷۳/۱۱/۱۲',
          startLocation: 'تجریش'
        }
      }
    ]

    const operators = []
    for (const op of operatorDefinitions) {
      const matchedRoleId = roles[op.roleKey] || roles.operator
      const user = await prisma.user.upsert({
        where: { nationalId: op.nationalId },
        update: {
          roleId: matchedRoleId,
          customFields: op.customFields as unknown as Prisma.InputJsonValue
        },
        create: {
          nationalId: op.nationalId,
          name: op.name,
          phone: op.phone,
          passwordHash,
          status: 'active',
          roleId: matchedRoleId,
          customFields: op.customFields as unknown as Prisma.InputJsonValue
        },
      })
      operators.push(user)
    }

    const allOperators = [superAdmin, admin, ...operators]
    logSeed(`Users seeded: ${allOperators.length}`)

    // ── Shifts (today +/- 7 days) ──────────────────────────
    const shiftCodes = ['morning', 'evening', 'night', 'off'] as const
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
          create: { userId: user.id, date, code: code as ShiftCode },
        })
      }
    }
    logSeed('Shifts seeded.')

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
    logSeed('Safety bulletins seeded.')

    // ── Read receipts ──────────────────────────────────────
    for (const op of operators.slice(0, 4)) {
      await prisma.readReceipt.create({
        data: {
          userId: op.id,
          safetyBulletinId: bulletins[0].id,
        },
      })
    }
    logSeed('Read receipts seeded.')

    // ── Knowledge articles (RAG) ──────────────────────────
    await prisma.knowledgeArticle.deleteMany()
    await prisma.knowledgeArticle.createMany({
      data: [
        {
          title: 'دستورالعمل سرعت‌های مجاز سیر در خط ۱ (بند ۴-۳)',
          slug: 'line1-speed-limits',
          body: `مقررات سرعت‌های مجاز در سیر و حرکت خط ۱ مترو تهران:
۱. حداکثر سرعت سیر تحت سیستم سیگنالینگ ATP و در شرایط عادی ۸۰ کیلومتر بر ساعت است.
۲. سرعت عبور از سوزن‌های انحرافی در ایستگاه‌های دارای خط فرعی، حداکثر ۳۰ کیلومتر بر ساعت می‌باشد.
۳. در زمان خرابی سیگنالینگ و حرکت به صورت دستی با فرمان OCC، سرعت قطار نباید از ۲۵ کیلومتر بر ساعت تجاوز کند.
۴. حداکثر سرعت حرکت در دپوهای فتح‌آباد و کهریزک ۱۵ کیلومتر بر ساعت تعیین شده است.`,
          category: 'operation',
          tags: 'سرعت,سوزن,atp,دپو,سیر',
          authorId: superAdmin.id,
        },
        {
          title: 'پروتکل تخلیه اضطراری مسافران در تونل (بند ۱۲-۵)',
          slug: 'emergency-passenger-evacuation',
          body: `دستورالعمل تخلیه اضطراری مسافران در داخل تونل خط ۱:
۱. در صورت توقف قطار به دلیل حریق یا نقص فنی غیرقابل حرکت، راهبر موظف است فوراً موقعیت بلاک را به OCC گزارش داده و درخواست قطع برق ریل سوم (۷۵۰ ولت DC) را نماید.
۲. تخلیه مسافران تنها پس از اعلام قطع کامل جریان برق توسط مرکز فرمان و تایید نهایی آن مجاز است.
۳. راهبر باید درب‌های خروجی فرار اضطراری جلو یا انتهای قطار را باز کند.
۴. هدایت مسافران باید همواره در جهت خلاف جریان باد و به سمت نزدیک‌ترین ایستگاه یا خروجی اضطراری تونل انجام گیرد.`,
          category: 'safety',
          tags: 'تخلیه,تونل,حریق,اضطراری,ریل سوم',
          authorId: superAdmin.id,
        },
        {
          title: 'پروتکل ارتباطات رادیویی و بی‌سیم راهبری (بند ۷-۱۲)',
          slug: 'driver-radio-protocol',
          body: `مقررات ارتباط رادیویی بی‌سیم بین راهبران و دیسپچرز مرکز فرمان (OCC):
۱. کانال ارتباطی پیش‌فرض رادیو بی‌سیم به صورت نیمه-دوبلکس (Half-Duplex) کار می‌کند. راهبران باید پس از فشردن دکمه PTT ابتدا کد قطار خود را اعلام کنند.
۲. مخابره پیام‌ها باید با نهایت اختصار، وضوح و رعایت کدهای استاندارد باشد.
۳. در زمان شنیده شدن کد اعلام وضعیت اضطراری (کد قرمز یا SOS)، تمامی پرسنل و راهبران باید بلافاصله مکالمات رادیویی غیرحیاتی را متوقف کرده و خط را برای OCC باز نگه دارند.`,
          category: 'operation',
          tags: 'بیسیم,رادیو,occ,ارتباطات,sos',
          authorId: superAdmin.id,
        },
        {
          title: 'کنترل ترمز و توقف در شیب‌های تند خط ۱ (بند ۵-۲)',
          slug: 'steep-slope-braking',
          body: `دستورالعمل کنترل قطار و سیستم ترمز در شیب‌های تند خط ۱ (از تجریش تا قلهک):
۱. شیب مسیر در بخش‌های شمالی خط ۱ تا ۴۵ در هزار می‌رسد. راهبر باید همواره عقربه‌های فشار مخازن ترمز اصلی را بررسی کند که نباید کمتر از ۷.۵ بار باشد.
۲. در صورت افت فشار باد اصلی به کمتر از ۵.۵ بار، قطار به صورت خودکار ترمز اضطراری (Emergency Brake) اعمال می‌کند.
۳. برای شروع حرکت مجدد در شیب، راهبر باید سیستم کشش (Traction) را همزمان با رهاسازی تدریجی ترمز پنوماتیک به کار گیرد تا از پس زدن قطار جلوگیری شود.`,
          category: 'technical',
          tags: 'ترمز,شیب,تجریش,باد,پنوماتیک',
          authorId: superAdmin.id,
        }
      ]
    })
    logSeed('Knowledge articles seeded.')

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
    ])

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
    logSeed('Tickets seeded.')

    // ── Custom field definitions ───────────────────────────
    await ensurePersonnelCustomFields()
    logSeed('Custom field definitions seeded.')

    // ── Competencies & Action Types ────────────────────────
    const competencies = [
      { id: 'discipline', name: 'انضباط', weight: 1.0, direction: 'both' },
      { id: 'productivity', name: 'بهره‌وری', weight: 1.2, direction: 'both' },
      { id: 'quality', name: 'کیفیت', weight: 1.2, direction: 'both' },
      { id: 'innovation', name: 'نوآوری', weight: 1.5, direction: 'positive' },
      { id: 'teamwork', name: 'کار تیمی', weight: 1.0, direction: 'both' },
      { id: 'compliance', name: 'انطباق و امنیت', weight: 2.0, direction: 'negative' },
    ]

    for (const c of competencies) {
      await prisma.competency.upsert({
        where: { id: c.id },
        update: { name: c.name, weight: c.weight, direction: c.direction },
        create: c,
      })
    }
    logSeed('Competencies seeded.')

    const actionTypes = [
      // انضباط (discipline)
      { id: 'a1', competencyId: 'discipline', title: 'حضور به‌موقع در شیفت', defaultScore: 5, maxSeverity: 'L1' },
      { id: 'a6', competencyId: 'discipline', title: 'رعایت دقیق قوانین پوشش و محیط کار', defaultScore: 5, maxSeverity: 'L1' },
      { id: 'a7', competencyId: 'discipline', title: 'آراستگی ظاهر و تجهیز کارگاه', defaultScore: 5, maxSeverity: 'L1' },
      
      // بهره‌وری (productivity)
      { id: 'a2', competencyId: 'productivity', title: 'تحویل زودتر از ددلاین', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a8', competencyId: 'productivity', title: 'همکاری استثنایی در ساعات شلوغی خط', defaultScore: 15, maxSeverity: 'L1' },
      { id: 'a9', competencyId: 'productivity', title: 'انجام وظایف خارج از محدوده موظف', defaultScore: 10, maxSeverity: 'L1' },
      
      // کیفیت (quality)
      { id: 'a3', competencyId: 'quality', title: 'خروجی بی‌نقص / کیفیت بالا', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a10', competencyId: 'quality', title: 'دقت بالا و بازرسی ایمنی پیشگیرانه قطار', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a11', competencyId: 'quality', title: 'نگهداری و مراقبت عالی از تجهیزات کابین', defaultScore: 10, maxSeverity: 'L1' },
      
      // نوآوری (innovation)
      { id: 'a4', competencyId: 'innovation', title: 'پیشنهاد کاهش هزینه/زمان', defaultScore: 20, maxSeverity: 'L1' },
      { id: 'a12', competencyId: 'innovation', title: 'پیشنهاد بهبود ایمنی یا افزایش سرعت سیر', defaultScore: 20, maxSeverity: 'L1' },
      
      // کار تیمی (teamwork)
      { id: 'a5', competencyId: 'teamwork', title: 'کمک به همکار / حلال مشکلات', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a13', competencyId: 'teamwork', title: 'همکاری صمیمانه و روحیه تیمی سازنده', defaultScore: 10, maxSeverity: 'L1' },
      
      // جرایم - انضباط
      { id: 'n1', competencyId: 'discipline', title: 'تأخیر / غیبت غیرموجه', defaultScore: -5, maxSeverity: 'L3' },
      { id: 'n5', competencyId: 'discipline', title: 'نقض آیین‌نامه پوشش یا انضباط کارگاه', defaultScore: -5, maxSeverity: 'L2' },
      
      // جرایم - کیفیت
      { id: 'n2', competencyId: 'quality', title: 'خطای تکراری / سهل‌انگاری', defaultScore: -10, maxSeverity: 'L3' },
      
      // جرایم - کار تیمی
      { id: 'n3', competencyId: 'teamwork', title: 'ایجاد تنش در محیط کار', defaultScore: -10, maxSeverity: 'L2' },
      { id: 'n6', competencyId: 'teamwork', title: 'رفتار غیرحرفه‌ای یا عدم همکاری با تیم', defaultScore: -10, maxSeverity: 'L2' },
      
      // جرایم - بهره‌وری
      { id: 'n7', competencyId: 'productivity', title: 'سهل‌انگاری در انجام وظایف یا تاخیر تحویل', defaultScore: -10, maxSeverity: 'L3' },
      
      // جرایم - انطباق و امنیت
      { id: 'n4', competencyId: 'compliance', title: 'نقض قوانین امنیتی/سازمانی', defaultScore: -20, maxSeverity: 'L3' },
      { id: 'n8', competencyId: 'compliance', title: 'عدم گزارش خرابی یا سهل‌انگاری در ایمنی', defaultScore: -15, maxSeverity: 'L3' },
      { id: 'n9', competencyId: 'compliance', title: 'نقض قوانین سرعت مجاز قطار (بحرانی)', defaultScore: -30, maxSeverity: 'L3' },
    ]

    for (const a of actionTypes) {
      await prisma.performanceActionType.upsert({
        where: { id: a.id },
        update: { title: a.title, defaultScore: a.defaultScore, maxSeverity: a.maxSeverity },
        create: a,
      })
    }
    logSeed('Performance action types seeded.')

    // ── Performance Logs (initial) ───────────────────────
    const currentPeriodId = jalaliPeriodId()
    const logCount = await prisma.performanceLog.count()
    if (logCount === 0 && operators.length >= 3) {
      await prisma.performanceLog.createMany({
        data: [
          {
            employeeId: operators[0].id, // Ali Rezaei
            recordedById: superAdmin.id,
            actionTypeId: 'a1',
            severity: 'L1',
            scoreValue: 5,
            note: 'حضور منظم و سر وقت در کل روزهای هفته',
            periodId: currentPeriodId,
            status: 'active',
          },
          {
            employeeId: operators[0].id, // Ali Rezaei
            recordedById: superAdmin.id,
            actionTypeId: 'a3',
            severity: 'L1',
            scoreValue: 10,
            note: 'انجام اورهال و سرویس فنی بی نقص روی لوکوموتیو خط ۱',
            periodId: currentPeriodId,
            status: 'active',
          },
          {
            employeeId: operators[1].id, // Mohammad Hosseini
            recordedById: superAdmin.id,
            actionTypeId: 'a2',
            severity: 'L1',
            scoreValue: 10,
            note: 'هماهنگی و آماده‌سازی زودتر از موعد لوحه روزانه',
            periodId: currentPeriodId,
            status: 'active',
          },
          {
            employeeId: operators[1].id, // Mohammad Hosseini
            recordedById: superAdmin.id,
            actionTypeId: 'n1',
            severity: 'L1',
            scoreValue: -5,
            note: 'تاخیر ۲۰ دقیقه‌ای در ورود به شیفت صبح',
            periodId: currentPeriodId,
            status: 'active',
          },
          {
            employeeId: operators[2].id, // Zahra Karimi
            recordedById: superAdmin.id,
            actionTypeId: 'a4',
            severity: 'L1',
            scoreValue: 20,
            note: 'ارائه طرح هوشمندسازی تقسیم نیروی کار و کاهش زمان بیکاری راهبران',
            periodId: currentPeriodId,
            status: 'active',
          },
        ]
      })
      logSeed('Initial performance logs seeded.')
    }

    // ── Settings ───────────────────────────────────────────
    await seedDefaultSettings(prisma)
    logSeed('Default settings seeded.')
    await seedUiBuilder(prisma)
    logSeed('UI Builder settings seeded.')

    logSeed('Self-seeded database successfully.')
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    logSeed(`Error during seedDatabase: ${msg}`)
    throw error
  }
}

async function seedDefaultSettings(prisma: PrismaClient) {
  await prisma.setting.deleteMany()
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
}

// Seed performance-specific tables (Competency, PerformanceActionType)
// Called when these tables are empty but DB is already populated (e.g., after schema update)
export async function seedPerformanceTables(prisma: PrismaClient) {
  const competencies = [
    { id: 'discipline', name: 'انضباط فردی', weight: 1.0, direction: 'positive' },
    { id: 'productivity', name: 'بهره‌وری', weight: 1.5, direction: 'positive' },
    { id: 'quality', name: 'کیفیت کار', weight: 1.5, direction: 'positive' },
    { id: 'innovation', name: 'نوآوری', weight: 1.5, direction: 'positive' },
    { id: 'teamwork', name: 'کار تیمی', weight: 1.0, direction: 'both' },
    { id: 'compliance', name: 'انطباق و امنیت', weight: 2.0, direction: 'negative' },
  ]

  for (const c of competencies) {
    await prisma.competency.upsert({
      where: { id: c.id },
      update: { name: c.name, weight: c.weight, direction: c.direction },
      create: c,
    })
  }

  const actionTypes = [
    // انضباط (discipline)
    { id: 'a1', competencyId: 'discipline', title: 'حضور به‌موقع در شیفت', defaultScore: 5, maxSeverity: 'L1' },
    { id: 'a6', competencyId: 'discipline', title: 'رعایت دقیق قوانین پوشش و محیط کار', defaultScore: 5, maxSeverity: 'L1' },
    { id: 'a7', competencyId: 'discipline', title: 'آراستگی ظاهر و تجهیز کارگاه', defaultScore: 5, maxSeverity: 'L1' },
    // بهره‌وری (productivity)
    { id: 'a2', competencyId: 'productivity', title: 'تحویل زودتر از ددلاین', defaultScore: 10, maxSeverity: 'L1' },
    { id: 'a8', competencyId: 'productivity', title: 'همکاری استثنایی در ساعات شلوغی خط', defaultScore: 15, maxSeverity: 'L1' },
    { id: 'a9', competencyId: 'productivity', title: 'انجام وظایف خارج از محدوده موظف', defaultScore: 10, maxSeverity: 'L1' },
    // کیفیت (quality)
    { id: 'a3', competencyId: 'quality', title: 'خروجی بی‌نقص / کیفیت بالا', defaultScore: 10, maxSeverity: 'L1' },
    { id: 'a10', competencyId: 'quality', title: 'دقت بالا و بازرسی ایمنی پیشگیرانه قطار', defaultScore: 10, maxSeverity: 'L1' },
    { id: 'a11', competencyId: 'quality', title: 'نگهداری و مراقبت عالی از تجهیزات کابین', defaultScore: 10, maxSeverity: 'L1' },
    // نوآوری (innovation)
    { id: 'a4', competencyId: 'innovation', title: 'پیشنهاد کاهش هزینه/زمان', defaultScore: 20, maxSeverity: 'L1' },
    { id: 'a12', competencyId: 'innovation', title: 'پیشنهاد بهبود ایمنی یا افزایش سرعت سیر', defaultScore: 20, maxSeverity: 'L1' },
    // کار تیمی (teamwork)
    { id: 'a5', competencyId: 'teamwork', title: 'کمک به همکار / حلال مشکلات', defaultScore: 10, maxSeverity: 'L1' },
    { id: 'a13', competencyId: 'teamwork', title: 'همکاری صمیمانه و روحیه تیمی سازنده', defaultScore: 10, maxSeverity: 'L1' },
    // جرایم
    { id: 'n1', competencyId: 'discipline', title: 'تأخیر / غیبت غیرموجه', defaultScore: -5, maxSeverity: 'L3' },
    { id: 'n5', competencyId: 'discipline', title: 'نقض آیین‌نامه پوشش یا انضباط کارگاه', defaultScore: -5, maxSeverity: 'L2' },
    { id: 'n2', competencyId: 'quality', title: 'خطای تکراری / سهل‌انگاری', defaultScore: -10, maxSeverity: 'L3' },
    { id: 'n3', competencyId: 'teamwork', title: 'ایجاد تنش در محیط کار', defaultScore: -10, maxSeverity: 'L2' },
    { id: 'n6', competencyId: 'teamwork', title: 'رفتار غیرحرفه‌ای یا عدم همکاری با تیم', defaultScore: -10, maxSeverity: 'L2' },
    { id: 'n7', competencyId: 'productivity', title: 'سهل‌انگاری در انجام وظایف یا تاخیر تحویل', defaultScore: -10, maxSeverity: 'L3' },
    { id: 'n4', competencyId: 'compliance', title: 'نقض قوانین امنیتی/سازمانی', defaultScore: -20, maxSeverity: 'L3' },
    { id: 'n8', competencyId: 'compliance', title: 'عدم گزارش خرابی یا سهل‌انگاری در ایمنی', defaultScore: -15, maxSeverity: 'L3' },
    { id: 'n9', competencyId: 'compliance', title: 'نقض قوانین سرعت مجاز قطار (بحرانی)', defaultScore: -30, maxSeverity: 'L3' },
  ]

  for (const a of actionTypes) {
    await prisma.performanceActionType.upsert({
      where: { id: a.id },
      update: { title: a.title, defaultScore: a.defaultScore, maxSeverity: a.maxSeverity },
      create: a,
    })
  }
}

export async function seedUiBuilder(prisma: PrismaClient) {
  // Check if UI theme already seeded
  const themeCount = await prisma.uiTheme.count()
  if (themeCount > 0) return

  // Seed Theme
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

  // Seed Default Menu Items
  await prisma.uiMenuItem.createMany({
    data: [
      { label: 'پروفایل', icon: 'User', route: 'ProfileScreen', orderIndex: 4, isVisible: true },
      { label: 'گفتگو', icon: 'MessageSquare', route: 'ChatScreen', orderIndex: 3, isVisible: true },
      { label: 'اعلان‌ها', icon: 'Bell', route: 'NotificationsScreen', orderIndex: 2, isVisible: true },
      { label: 'شیفت‌ها', icon: 'Calendar', route: 'CalendarScreen', orderIndex: 1, isVisible: true },
      { label: 'داشبورد', icon: 'LayoutDashboard', route: 'HomeScreen', orderIndex: 0, isVisible: true },
    ]
  })

  // Seed Default Widgets
  await prisma.uiDashboardWidget.createMany({
    data: [
      { widgetType: 'stat_card', title: 'شیفت امروز', size: 'md', orderIndex: 0, isVisible: true, configJson: { source: 'shift' } },
      { widgetType: 'chart', title: 'عملکرد هفتگی کیلومتر رانندگی', size: 'md', orderIndex: 1, isVisible: true, configJson: { type: 'bar', source: 'kpi' } },
      { widgetType: 'list', title: 'آخرین بخشنامه‌های ایمنی', size: 'lg', orderIndex: 2, isVisible: true, configJson: { limit: 3, source: 'bulletins' } },
    ]
  })
}
