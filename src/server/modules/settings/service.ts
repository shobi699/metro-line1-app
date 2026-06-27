import { prisma } from '@/server/db'

export interface SettingUpdate {
  key: string
  value: string | number | boolean
}

const DEFAULT_SETTINGS = [
  {
    key: 'general.appName',
    label: 'نام سامانه',
    description: 'عنوان فارسی اصلی سامانه در بالای صفحات و اپلیکیشن',
    type: 'text',
    value: 'سیر و حرکت خط یک مترو',
    defaultValue: 'سیر و حرکت خط یک مترو',
    category: 'general',
  },
  {
    key: 'general.brandColor',
    label: 'رنگ شاخص برند',
    description: 'کد هگز رنگ اصلی برند خط مترو (مثلاً قرمز برای خط ۱)',
    type: 'color',
    value: '#e53935',
    defaultValue: '#e53935',
    category: 'general',
  },
  {
    key: 'general.maintenanceMode',
    label: 'وضعیت تعمیرات و نگهداری سامانه',
    description: 'در صورت فعال‌سازی، دسترسی پرسنل عادی موقتاً قطع شده و پیام تحت تعمیر نمایش داده می‌شود.',
    type: 'boolean',
    value: false,
    defaultValue: false,
    category: 'general',
  },
  {
    key: 'general.systemNotice',
    label: 'اعلان سراسری سیستم (بنر فوری)',
    description: 'متن اطلاعیه اضطراری که در بالای تمام صفحات وب و اپلیکیشن پرسنل نمایش داده خواهد شد.',
    type: 'text',
    value: 'کلیه راهبران خط ۱ با توجه به برودت هوا موظف به رعایت سرعت مطمئنه در بخش روباز ریل هستند.',
    defaultValue: 'کلیه راهبران خط ۱ با توجه به برودت هوا موظف به رعایت سرعت مطمئنه در بخش روباز ریل هستند.',
    category: 'general',
  },
  {
    key: 'general.occPhone',
    label: 'شماره تماس مرکز فرمان (OCC)',
    description: 'شماره تماس مستقیم خط تلفن اضطراری دیسپچرهای مرکز فرماندهی مترو خط ۱',
    type: 'text',
    value: '02155001122',
    defaultValue: '02155001122',
    category: 'general',
  },
  {
    key: 'general.maxLoginAttempts',
    label: 'حداکثر دفعات تلاش ناموفق برای ورود',
    description: 'تعداد دفعات مجاز ورود کلمه عبور اشتباه پیش از مسدودسازی موقت حساب کاربر',
    type: 'number',
    value: 5,
    defaultValue: 5,
    category: 'general',
    min: 3,
    max: 10,
  },
  {
    key: 'general.sessionTimeout',
    label: 'طول عمر نشست فعال کاربر (دقیقه)',
    description: 'مدت زمان پایداری لاگین کاربر پیش از خروج خودکار امنیتی از سامانه',
    type: 'number',
    value: 120,
    defaultValue: 120,
    category: 'general',
    min: 15,
    max: 480,
  },
  {
    key: 'shifts.minRestHours',
    label: 'حداقل فاصله استراحت قانونی (ساعت)',
    description: 'حداقل ساعت استراحت اجباری بین پایان یک شیفت و شروع شیفت بعدی',
    type: 'number',
    value: 12,
    defaultValue: 12,
    category: 'shifts',
    min: 8,
    max: 24,
  },
  {
    key: 'shifts.maxConsecutiveNights',
    label: 'حداکثر شیفت شب متوالی مجاز',
    description: 'حداکثر تعداد شیفت شب متوالی مجاز برای پرسنل پیش از اعلام تداخل ایمنی',
    type: 'number',
    value: 2,
    defaultValue: 2,
    category: 'shifts',
    min: 1,
    max: 5,
  },
  {
    key: 'shifts.roleParity',
    label: 'الزام به همترازی نقش در جابجایی',
    description: 'در صورت فعال‌سازی، جابجایی شیفت فقط بین پرسنل با رتبه فنی و نقش یکسان مجاز خواهد بود',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'shifts',
  },
  {
    key: 'tickets.allowNoWagon',
    label: 'امکان ثبت تیکت بدون شماره واگن',
    description: 'آیا کاربران می‌توانند خرابی‌هایی را ثبت کنند که مربوط به واگن خاصی نباشد؟',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'tickets',
  },
  {
    key: 'tickets.aiPriorityEnabled',
    label: 'تحلیلگر هوشمند اولویت AI',
    description: 'پیش‌بینی خودکار شدت و اولویت تیکت بر اساس متن گزارش خرابی',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'tickets',
  },
  {
    key: 'tickets.criticalKeywords',
    label: 'کلمات کلیدی اولویت بحرانی',
    description: 'کلمات کلیدی نشان‌دهنده اولویت بحرانی (جدا شده با کاما)',
    type: 'text',
    value: 'آتش,حریق,انفجار,سقوط,برق‌گرفتگی,خروج از ریل,ترمز اضطراری,دود',
    defaultValue: 'آتش,حریق,انفجار,سقوط,برق‌گرفتگی,خروج از ریل,ترمز اضطراری,دود',
    category: 'tickets',
  },
  {
    key: 'tickets.highKeywords',
    label: 'کلمات کلیدی اولویت عمده',
    description: 'کلمات کلیدی نشان‌دهنده اولویت عمده (جدا شده با کاما)',
    type: 'text',
    value: 'آسانسور,پله برقی,سیگنالینگ,تهویه,نشت آب,دوربین,سنسور',
    defaultValue: 'آسانسور,پله برقی,سیگنالینگ,تهویه,نشت آب,دوربین,سنسور',
    category: 'tickets',
  },
  {
    key: 'tickets.mediumKeywords',
    label: 'کلمات کلیدی اولویت جزئی',
    description: 'کلمات کلیدی نشان‌دهنده اولویت جزئی (جدا شده با کاما)',
    type: 'text',
    value: 'روشنایی,مانیتور,ساعت,بلندگو,تلفن,درب,صندلی',
    defaultValue: 'روشنایی,مانیتور,ساعت,بلندگو,تلفن,درب,صندلی',
    category: 'tickets',
  },
  {
    key: 'tickets.lowKeywords',
    label: 'کلمات کلیدی اولویت کم‌اهمیت',
    description: 'کلمات کلیدی نشان‌دهنده اولویت کم‌اهمیت (جدا شده با کاما)',
    type: 'text',
    value: 'نظافت,سطل زباله,پوستر,پله,سنگفرش,پنجره',
    defaultValue: 'نظافت,سطل زباله,پوستر,پله,سنگفرش,پنجره',
    category: 'tickets',
  },
  {
    key: 'chat.maxMessageLength',
    label: 'حداکثر طول پیام چت',
    description: 'حداکثر تعداد نویسه‌های مجاز برای هر پیام ارسالی در روم‌ها',
    type: 'number',
    value: 1000,
    defaultValue: 1000,
    category: 'chat',
    min: 100,
    max: 5000,
  },
  // Mobile settings
  {
    key: 'mobile.enableSos',
    label: 'دکمه اضطراری SOS',
    description: 'فعال یا غیرفعال بودن دکمه اضطراری SOS در اپلیکیشن موبایل پرسنل',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'mobile',
  },
  {
    key: 'mobile.geofencingEnabled',
    label: 'حضور و غیاب Geofencing',
    description: 'ثبت حضور و غیاب هوشمند پرسنل بر اساس موقعیت مکانی جی‌پی‌اس ایستگاه‌ها',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'mobile',
  },
  {
    key: 'mobile.geofencingRadius',
    label: 'شعاع موقعیت‌یاب حضور و غیاب (متر)',
    description: 'حداکثر شعاع فاصله مجاز راهبر از ایستگاه برای چک‌این خودکار',
    type: 'number',
    value: 100,
    defaultValue: 100,
    category: 'mobile',
    min: 20,
    max: 1000,
  },
  {
    key: 'mobile.offlineCacheEnabled',
    label: 'ذخیره آفلاین اطلاعات',
    description: 'فعال‌سازی کش آفلاین دفتر تلفن و شیفت‌های کاری در محیط‌های بدون سیگنال تونل',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'mobile',
  },
  {
    key: 'mobile.sosRecipientPhone',
    label: 'شماره پیامک اضطراری SOS',
    description: 'شماره تلفن مستقیم دیسپچر مرکز فرمان جهت ارسال پیام اضطراری در زمان قطع اینترنت',
    type: 'text',
    value: '09120000000',
    defaultValue: '09120000000',
    category: 'mobile',
  },
  {
    key: 'mobile.activeTheme',
    label: 'تم پیش‌فرض موبایل',
    description: 'تم رنگی پیش‌فرض رابط کاربری موبایل',
    type: 'select',
    value: 'dark',
    defaultValue: 'dark',
    category: 'mobile',
    options: ['dark', 'light', 'system'],
  },
  // Audio Comms and Radio settings
  {
    key: 'comms.voiceChatEnabled',
    label: 'فعال‌سازی چت صوتی',
    description: 'فعال یا غیرفعال بودن قابلیت ضبط و ارسال پیام صوتی (ویس) در چت',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'comms',
  },
  {
    key: 'comms.maxRecordingTime',
    label: 'حداکثر زمان ضبط چت صوتی (ثانیه)',
    description: 'حداکثر زمان مجاز برای ضبط یک پیام صوتی در چت‌روم‌ها',
    type: 'number',
    value: 60,
    defaultValue: 60,
    category: 'comms',
    min: 5,
    max: 300,
  },
  {
    key: 'comms.conferenceEnabled',
    label: 'فعال‌سازی کنفرانس صوتی',
    description: 'فعال یا غیرفعال بودن سیستم کنفرانس صوتی گروهی (هادل دیسپاچینگ)',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'comms',
  },
  {
    key: 'comms.maxConferenceParticipants',
    label: 'حداکثر شرکت‌کنندگان کنفرانس صوتی',
    description: 'حداکثر ظرفیت تعداد پرسنل همزمان در یک اتاق کنفرانس صوتی',
    type: 'number',
    value: 15,
    defaultValue: 15,
    category: 'comms',
    min: 2,
    max: 50,
  },
  {
    key: 'comms.radioEnabled',
    label: 'فعال‌سازی شبیه‌ساز بی‌سیم TETRA',
    description: 'فعال یا غیرفعال بودن شبیه‌ساز سخت‌افزاری بی‌سیم راهبران و دیسپاچینگ',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'comms',
  },
  {
    key: 'comms.radioDefaultChannel',
    label: 'کانال رادیویی پیش‌فرض بی‌سیم',
    description: 'فرکانس کانال پیش‌فرض انتخاب‌شده در زمان روشن شدن بی‌سیم',
    type: 'select',
    value: 'OCC MAIN',
    defaultValue: 'OCC MAIN',
    category: 'comms',
    options: ['OCC MAIN', 'STATION TALK', 'DEPOT & TECH'],
  },
  {
    key: 'comms.radioTransmissionInterval',
    label: 'زمان تناوب پیام‌های دیسپاچینگ (ثانیه)',
    description: 'مدت زمان تقریبی برای شبیه‌سازی مکالمات رادیویی ورودی تصادفی از مرکز فرمان',
    type: 'number',
    value: 10,
    defaultValue: 10,
    category: 'comms',
    min: 3,
    max: 60,
  },
  {
    key: 'comms.radioVibrationEnabled',
    label: 'لرزش فیدبک PTT در موبایل',
    description: 'فعال بودن ویبره گوشی موبایل راهبر در زمان فشردن و نگه داشتن دکمه بی‌سیم',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'comms',
  },
  {
    key: 'general.allowRegistration',
    label: 'امکان ثبت‌نام مستقیم پرسنل',
    description: 'در صورت غیرفعال بودن، ثبت‌نام مستقیم بسته شده و فقط توسط مدیریت انجام می‌شود.',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'general',
  },
  {
    key: 'general.passwordPolicyMinLength',
    label: 'حداقل طول کلمه عبور پرسنل',
    description: 'حداقل تعداد نویسه‌های مجاز کلمه عبور هنگام ثبت‌نام یا بازیابی رمز عبور',
    type: 'number',
    value: 8,
    defaultValue: 8,
    category: 'general',
    min: 6,
    max: 20,
  },
  {
    key: 'shifts.maxConsecutiveDays',
    label: 'حداکثر روزهای متوالی کاری مجاز',
    description: 'حداکثر روزهای مجاز کار متوالی بدون شیفت استراحت (آف) پیش از نقض قوانین شیفت',
    type: 'number',
    value: 6,
    defaultValue: 6,
    category: 'shifts',
    min: 3,
    max: 7,
  },
  {
    key: 'shifts.allowSwapRequests',
    label: 'امکان ثبت درخواست تعویض شیفت',
    description: 'مجاز بودن پرسنل جهت ثبت درخواست‌های جابجایی شیفت در صندوق ورودی پرسنل',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'shifts',
  },
  {
    key: 'tickets.requireImage',
    label: 'اجبار به بارگذاری تصویر نقص فنی',
    description: 'الزامی بودن آپلود تصویر واقعی خرابی هنگام ایجاد تیکت‌های جدید فنی خط ۱',
    type: 'boolean',
    value: false,
    defaultValue: false,
    category: 'tickets',
  },
  {
    key: 'chat.enableFileSharing',
    label: 'امکان اشتراک‌گذاری فایل در چت',
    description: 'امکان ارسال تصاویر، مستندات و فایل‌های پیوست در چت‌روم‌ها توسط پرسنل',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'chat',
  },
  {
    key: 'mobile.forceUpdate',
    label: 'اجبار به آپدیت نسخه موبایل پرسنل',
    description: 'غیرفعال‌سازی دسترسی کلاینت‌های قدیمی و اجبار پرسنل به ارتقا به آخرین نسخه اپلیکیشن',
    type: 'boolean',
    value: false,
    defaultValue: false,
    category: 'mobile',
  },
  {
    key: 'mobile.locationTrackingInterval',
    label: 'بازه زمانی موقعیت‌یابی پس‌زمینه (ثانیه)',
    description: 'مدته زمان تردد برای ثبت و ارسال خودکار لوکیشن جی‌پی‌اس راهبران به مرکز فرمان',
    type: 'number',
    value: 30,
    defaultValue: 30,
    category: 'mobile',
    min: 10,
    max: 300,
  },
  {
    key: 'comms.audioBitrate',
    label: 'کیفیت و نرخ فشرده‌سازی چت صوتی',
    description: 'کیفیت صدای ضبط شده و میزان مصرف ترافیک اینترنت پرسنل در زمان تبادل ویس',
    type: 'select',
    value: '32kbps',
    defaultValue: '32kbps',
    category: 'comms',
    options: ['16kbps', '32kbps', '64kbps'],
  },
  {
    key: 'performance.leaderboardLimit',
    label: 'تعداد پرسنل برتر در لیدربورد',
    description: 'تعداد نمایش پرسنل برتر در جدول رده‌بندی عمومی (لیدربورد)',
    type: 'number',
    value: 5,
    defaultValue: 5,
    category: 'performance',
    min: 3,
    max: 20,
  },
  {
    key: 'performance.maxAppealsPerPeriod',
    label: 'حداکثر اعتراض‌های مجاز در دوره',
    description: 'حداکثر تعداد اعتراض مجاز برای هر پرسنل به نمرات منفی در یک دوره ارزیابی',
    type: 'number',
    value: 3,
    defaultValue: 3,
    category: 'performance',
    min: 1,
    max: 10,
  },
  {
    key: 'performance.showPercentileToEmployee',
    label: 'نمایش صدک رتبه به پرسنل',
    description: 'فعال یا غیرفعال بودن نمایش صدک رتبه در کارت لیدربورد اختصاصی پرسنل',
    type: 'boolean',
    value: true,
    defaultValue: true,
    category: 'performance',
  },
  {
    key: 'directory.visible_fields',
    label: 'فیلدهای نمایشی دفتر تلفن برای پرسنل عادی',
    description: 'لیست کلید فیلدهایی که پرسنل عادی (غیرمدیر) در دفتر تلفن مجاز به دیدن آن‌ها هستند (جدا شده با کاما)',
    type: 'text',
    value: 'phone,email,personnelNo,post,shift,shiftType,group,startLocation,vehicles',
    defaultValue: 'phone,email,personnelNo,post,shift,shiftType,group,startLocation,vehicles',
    category: 'general',
  },
]

export async function ensureDefaultSettingsExist() {
  try {
    for (const d of DEFAULT_SETTINGS) {
      const existing = await prisma.setting.findUnique({
        where: { key: d.key },
      })
      if (!existing) {
        await prisma.setting.create({
          data: {
            key: d.key,
            label: d.label,
            description: d.description,
            type: d.type,
            value: JSON.stringify(d.value),
            defaultValue: JSON.stringify(d.defaultValue),
            category: d.category,
            min: d.min ?? null,
            max: d.max ?? null,
            options: d.options ? JSON.stringify(d.options) : null,
            isEnabled: true,
          },
        })
      } else {
        // Keep defaultValue in sync with code-level defaults
        const codeDefault = JSON.stringify(d.defaultValue)
        if (existing.defaultValue !== codeDefault) {
          await prisma.setting.update({
            where: { key: d.key },
            data: { defaultValue: codeDefault },
          })
        }
      }
    }
  } catch (err) {
    console.error('Error ensuring default settings exist:', err)
  }
}

export async function getSettings() {
  await ensureDefaultSettingsExist()
  return prisma.setting.findMany({
    orderBy: { key: 'asc' },
  })
}

export async function getSettingValue<T = string | number | boolean>(key: string, fallback: T): Promise<T> {
  try {
    await ensureDefaultSettingsExist()
    const setting = await prisma.setting.findUnique({
      where: { key },
    })

    if (!setting || !setting.isEnabled) {
      return fallback
    }
    return JSON.parse(setting.value) as T
  } catch (error) {
    console.error(`Error getting setting value for key ${key}:`, error)
    return fallback
  }
}

export async function updateSettings(updates: SettingUpdate[], actorId: string) {
  const results = []

  for (const update of updates) {
    const setting = await prisma.setting.findUnique({
      where: { key: update.key },
    })

    if (!setting) {
      throw new Error(`تنظیم با کلید ${update.key} یافت نشد.`)
    }

    // Validate based on type
    const val = update.value
    if (setting.type === 'number') {
      const numVal = Number(val)
      if (isNaN(numVal)) {
        throw new Error(`مقدار تنظیمی ${setting.label} باید عدد باشد.`)
      }
      if (setting.min !== null && numVal < setting.min) {
        throw new Error(`مقدار تنظیمی ${setting.label} نباید کمتر از ${setting.min} باشد.`)
      }
      if (setting.max !== null && numVal > setting.max) {
        throw new Error(`مقدار تنظیمی ${setting.label} نباید بیشتر از ${setting.max} باشد.`)
      }
    } else if (setting.type === 'boolean') {
      if (typeof val !== 'boolean') {
        throw new Error(`مقدار تنظیمی ${setting.label} باید مقدار صحیح/غلط باشد.`)
      }
    } else if (setting.type === 'color') {
      if (typeof val !== 'string' || !/^#[0-9a-fA-F]{3,6}$/.test(val)) {
        throw new Error(`مقدار تنظیمی ${setting.label} باید کد رنگ معتبر هگز باشد.`)
      }
    } else if (setting.type === 'select') {
      if (setting.options) {
        const options = JSON.parse(setting.options) as string[]
        if (!options.includes(String(val))) {
          throw new Error(`مقدار تنظیمی ${setting.label} معتبر نیست.`)
        }
      }
    } else if (setting.type === 'text') {
      if (typeof val !== 'string') {
        throw new Error(`مقدار تنظیمی ${setting.label} باید متن باشد.`)
      }
    }

    const serializedValue = JSON.stringify(val)
    const originalValue = setting.value

    const updated = await prisma.setting.update({
      where: { key: update.key },
      data: { value: serializedValue },
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        entity: 'Setting',
        entityId: setting.id,
        action: 'update',
        before: { value: originalValue },
        after: { value: serializedValue },
      },
    })

    results.push(updated)
  }

  return results
}

export async function resetSetting(key: string, actorId: string) {
  const setting = await prisma.setting.findUnique({
    where: { key },
  })

  if (!setting) {
    throw new Error(`تنظیم با کلید ${key} یافت نشد.`)
  }

  const originalValue = setting.value

  const updated = await prisma.setting.update({
    where: { key },
    data: { value: setting.defaultValue },
  })

  // Write audit log
  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'Setting',
      entityId: setting.id,
      action: 'update',
      before: { value: originalValue },
      after: { value: setting.defaultValue },
    },
  })

  return updated
}

export async function resetAllSettings(actorId: string) {
  const settings = await prisma.setting.findMany()
  const results = []

  for (const setting of settings) {
    const originalValue = setting.value

    const updated = await prisma.setting.update({
      where: { id: setting.id },
      data: { value: setting.defaultValue },
    })

    if (originalValue !== setting.defaultValue) {
      await prisma.auditLog.create({
        data: {
          actorId,
          entity: 'Setting',
          entityId: setting.id,
          action: 'update',
          before: { value: originalValue },
          after: { value: setting.defaultValue },
        },
      })
    }

    results.push(updated)
  }

  return results
}

