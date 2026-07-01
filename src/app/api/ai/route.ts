import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { aiQuerySchema } from '@/lib/zod/ai'

interface RulebookItem {
  keywords: string[]
  title: string
  resolution: string
  safetyAlert: string
  handbookSection: string
  confidence: number
}

const CRITICAL_KEYWORDS = [
  'حریق',
  'آتش‌سوزی',
  'فرار قطار',
  'برق‌گرفتگی',
  'سقوط مسافر',
  'تصادف',
  'خروج از ریل',
  'سقوط روی ریل',
  'بحران شدید'
]

const RULEBOOK_DATABASE: RulebookItem[] = [
  {
    keywords: ['e102', 'درب', 'درب‌ها', 'باز نشدن'],
    title: 'نقص فنی درب واگن (کد خطای E102)',
    resolution: 'در صورت بروز خطای عدم باز شدن یا بسته نشدن درب‌ها:\n۱. ابتدا وضعیت مسافران را بررسی کرده و اطمینان حاصل کنید هیچ فردی در بین درب‌ها قرار ندارد.\n۲. کلید ایزوله‌سازی درب مربوطه (بایکوت درب) را در کابین راهبر فعال کنید تا قطار اجازه حرکت پیدا کند.\n۳. در ایستگاه انتهایی (تجریش/کهریزک)، وضعیت درب را به صورت مکانیکی بررسی و در سیستم تیکتینگ خرابی ثبت کنید.',
    safetyAlert: '🚨 هشدار ایمنی: حرکت قطار با درب باز یا بایکوت نشده مطلقاً ممنوع است و نقض مقررات ایمنی گروه الف محسوب می‌شود.',
    handbookSection: 'ماده ۱۲ - دستورالعمل درب‌های واگن خط ۱',
    confidence: 98
  },
  {
    keywords: ['e205', 'موتور', 'صدا', 'سر و صدا', 'گیربکس'],
    title: 'صدای غیرعادی موتور یا سیستم محرکه (کد خطای E205)',
    resolution: 'در صورت شنیدن صدای غیرعادی از زیر قطار یا لرزش شدید واگن‌ها:\n۱. سرعت قطار را بلافاصله به کمتر از ۳۰ کیلومتر بر ساعت کاهش دهید.\n۲. در اولین ایستگاه توقف کرده و با دیسپچرز مرکز فرمان (OCC) تماس بگیرید.\n۳. درجه حرارت بلبرینگ‌ها و موتور را چک کنید.',
    safetyAlert: '🚨 هشدار ایمنی: بی‌توجهی به صدای غیرعادی موتور ممکن است منجر به خروج قطار از ریل یا آتش‌سوزی شود.',
    handbookSection: 'ماده ۱۵ - کنترل گیربکس و محور محرک',
    confidence: 95
  },
  {
    keywords: ['e303', 'سنسور حریق', 'اعلام حریق', 'دود'],
    title: 'سیگنال خطا و اعلام حریق (کد خطای E303)',
    resolution: 'در صورت فعال شدن آلارم تشخیص دود یا حریق در واگن‌ها:\n۱. فوراً سرعت قطار را تعدیل کرده و وضعیت را با دوربین کابین چک کنید.\n۲. دکمه تهویه اضطراری را روشن کرده و به ایستگاه بعدی هدایت کنید.\n۳. سیستم آتش‌نشانی ایستگاه مقصد را پیش‌فعال نمایید.',
    safetyAlert: '🚨 هشدار ایمنی: طبق مقررات، هرگز قطار را داخل تونل در زمان حریق متوقف نکنید مگر اینکه سیستم محرکه کلا فلج شده باشد.',
    handbookSection: 'ماده ۹ - بایکوت سیستم آتش‌سوزی قطارهای سری ۳۰۰',
    confidence: 97
  },
  {
    keywords: ['e404', 'کشش', 'کاهش کشش', 'tractive effort', 'نیرو'],
    title: 'افت نیروی کشش قطار (کد خطای E404)',
    resolution: 'در صورت افت ناگهانی نیروی کشش یا قطع شدن ترکشن‌ها:\n۱. کلید ترکشن بایکوت را در کابین یک بار ریست کنید.\n۲. در صورت عدم تغذیه مدار، وضعیت تپ‌چنجر منبع تغذیه بالاسری را بررسی نمایید.\n۳. قطار را با استفاده از ترمزهای کمکی تا نزدیک‌ترین سوزن انتقال دهید.',
    safetyAlert: '💡 راهنما: افت توان کشش قطار معمولاً به دلیل نوسانات ولتاژ ریل سوم رخ می‌دهد.',
    handbookSection: 'ماده ۲۲ - دستورالعمل سیستم ترکشن و برق‌رسانی خط ۱',
    confidence: 92
  },
  {
    keywords: ['v301', 'تهویه', 'گرم', 'کولر', 'اسپلیت'],
    title: 'نقص فنی سیستم تهویه و کولر واگن (کد خطای V301)',
    resolution: 'در صورت قطع شدن سیستم تهویه واگن‌ها:\n۱. پرش فیوز سیستم تهویه (HVAC Break) را بررسی کنید.\n۲. در صورت پرش فیوز، یک بار آن را ریست کنید.\n۳. در صورت رفع نشدن عیب، دریچه‌های تهویه اضطراری واگن را باز کنید.',
    safetyAlert: '💡 راهنمای بهره‌برداری: در فصول گرم، تأمین هوای تازه واگن‌ها در داخل تونل از اهمیت بالایی برخوردار است.',
    handbookSection: 'ماده ۱۸ - سرمایش و گرمایش ناوگان خط ۱',
    confidence: 90
  },
  {
    keywords: ['atp', 'atc', 'سیگنالینگ', 'سیگنال', 's301'],
    title: 'خطای سیستم سیگنالینگ و ATP (کد خطای S301)',
    resolution: 'در صورت قطع ارتباط یا خطای سیستم سیگنالینگ ATP قطار:\n۱. بلافاصله سرعت قطار را به صورت دستی کنترل کنید.\n۲. کلید ATP Bypass را فعال کرده و وضعیت را به مرکز فرمان گزارش دهید.\n۳. با سرعت حداکثر ۲۵ کیلومتر بر ساعت تا اولین ایستگاه حرکت کنید.',
    safetyAlert: '🚨 هشدار ایمنی: حرکت بدون سیستم ATP در شرایط دید ضعیف تونل مستلزم هماهنگی ثانیه‌ای با دیسپچرز مرکز فرمان است.',
    handbookSection: 'ماده ۴ - ایمنی سیستم سیگنالینگ و ارتباطات رادیویی',
    confidence: 96
  },
  {
    keywords: ['ترمز', 'ترمز اضطراری', 'ترمز پنوماتیک', 'brake'],
    title: 'دستورالعمل سیستم ترمز قطار',
    resolution: 'در صورت بروز نقص در ترمزهای الکتریکی:\n۱. ترمز پنوماتیک پشتیبان را فعال کنید.\n۲. عقربه فشار مخزن ترمز در محدوده مجاز (۵ الی ۷ بار) قرار دارد.\n۳. در صورت افت فشار شدید، قطار ترمز اضطراری اعمال می‌کند.',
    safetyAlert: '🚨 هشدار ایمنی: هرگونه نشت هوا در لوله‌های ترمز باید فوراً بررسی شود.',
    handbookSection: 'ماده ۸ - ترمزهای مکانیکی و دیسکی قطارهای دوحالته',
    confidence: 94
  }
]

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = aiQuerySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const rawPrompt = parsed.data.prompt.trim()
    const prompt = rawPrompt.toLowerCase()

    // ۱. بررسی کلمات کلیدی بحرانی و اضطراری — بخش ۱۲.۷ الزامات ایمنی
    const isCritical = CRITICAL_KEYWORDS.some(kw => prompt.includes(kw))
    if (isCritical) {
      const emergencyResponse = `🚨 **هشدار بحران فوری و خطر حادثه:**\n\nدرخواست شما حاوی واژه‌های ایمنی حساس است. طبق بند ۷-۱۲ آیین‌نامه فنی دیسپاچینگ، در این شرایط هوش مصنوعی مجاز به صدور دستورالعمل خودسرانه نیست.\n\n**اقدام فوری:** لطفاً بلافاصله از طریق بی‌سیم یا خط تلفن مستقیم با **مرکز فرمان (OCC) یا سرشیفت خط ۱** تماس بگیرید!`
      
      // لاگ کردن درخواست حساس جهت ممیزی ایمنی ادمین
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'AI_QUERY',
          entityId: 'critical',
          action: 'create',
          after: { prompt: rawPrompt, type: 'CRITICAL' },
        }
      }).catch(() => {})

      return NextResponse.json({
        data: {
          reply: emergencyResponse,
          source: 'OCC_EMERGENCY',
          matched: true,
          confidence: 100,
          handbookSection: 'بند ۱-۷ قوانین اضطراری خط ۱',
          isCritical: true
        }
      })
    }

    // ۲. جستجو در بانک اطلاعاتی محلی (کدهای خطا)
    const rulebookMatch = RULEBOOK_DATABASE.find(item =>
      item.keywords.some(keyword => prompt.includes(keyword))
    )

    if (rulebookMatch) {
      // لاگ سوالات برای بهبود آموزش
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'AI_QUERY',
          entityId: 'rulebook',
          action: 'create',
          after: { query: rulebookMatch.title, type: 'RULEBOOK' },
        }
      }).catch(() => {})

      return NextResponse.json({
        data: {
          reply: `**دستورالعمل استخراج شده: ${rulebookMatch.title}**\n\n${rulebookMatch.resolution}\n\n${rulebookMatch.safetyAlert}`,
          source: 'rulebook',
          matched: true,
          confidence: rulebookMatch.confidence,
          handbookSection: rulebookMatch.handbookSection
        }
      })
    }

    // ۳. جستجو در دانش‌نامه (RAG با توکنایز کردن کلمات کلیدی فارسی)
    const cleanPrompt = rawPrompt.replace(/[?؟.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    const stopWords = ['در', 'به', 'با', 'از', 'تا', 'چقدر', 'است', 'چیست', 'کردن', 'چگونه', 'و', 'یا', 'یک', 'این', 'آن', 'ها', 'های', 'را', 'که', 'چه', 'چند', 'کدام']
    const keywords = cleanPrompt
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.includes(w))

    const searchConditions = keywords.length > 0
      ? keywords.flatMap(kw => [
          { title: { contains: kw } },
          { body: { contains: kw } },
          { tags: { contains: kw } }
        ])
      : [
          { title: { contains: rawPrompt } },
          { body: { contains: rawPrompt } },
          { tags: { contains: rawPrompt } }
        ]

    const knowledgeArticles = await prisma.knowledgeArticle.findMany({
      where: {
        OR: searchConditions
      },
      take: 3,
      select: {
        title: true,
        body: true,
        category: true,
        slug: true,
      },
    })

    if (knowledgeArticles.length > 0) {
      const articlesText = knowledgeArticles.map((a, i) =>
        `${i + 1}. **${a.title}** (${a.category ?? 'عمومی'})\n${a.body.substring(0, 200)}...`
      ).join('\n\n')

      return NextResponse.json({
        data: {
          reply: `**مقالات مرتبط یافت شد:**\n\n${articlesText}\n\nبرای مشاهده کامل مقالات به بخش دانش‌نامه مراجعه کنید.`,
          source: 'knowledge',
          matched: true,
          articles: knowledgeArticles.map(a => ({ slug: a.slug, title: a.title })),
          confidence: 85,
          handbookSection: 'دانش‌نامه محلی پرسنل خط ۱'
        }
      })
    }

    // ۴. پاسخ پیش‌فرض
    const fallbackReply = `درخواست شما: "${parsed.data.prompt}" بررسی شد.\n\nمن کدهای خطای خط ۱ مترو تهران را می‌شناسم:\n• **E102** — درب واگن\n• **E205** — صدای موتور\n• **E303** — اعلام حریق\n• **E404** — افت کشش\n• **V301** — تهویه\n• **S301** — سیگنالینگ\n• **ترمز** — سیستم ترمز\n\nلطفاً کد خطا یا موضوع مورد نظر را وارد کنید.\n\nدر صورت وجود موارد اضطراری، دکمه **SOS** را بفشارید.`

    return NextResponse.json({
      data: {
        reply: fallbackReply,
        source: 'fallback',
        matched: false,
        confidence: 50,
        handbookSection: 'راهنمای عمومی هوش مصنوعی'
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    )
  }
}
