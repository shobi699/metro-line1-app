import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { aiQuerySchema } from '@/lib/zod/ai'

const RULEBOOK_DATABASE = [
  {
    keywords: ['e102', 'درب', 'درب‌ها', 'باز نشدن'],
    title: 'نقص فنی درب واگن (کد خطای E102)',
    resolution: 'در صورت بروز خطای عدم باز شدن یا بسته نشدن درب‌ها:\n۱. ابتدا وضعیت مسافران را بررسی کرده و اطمینان حاصل کنید هیچ فردی در بین درب‌ها قرار ندارد.\n۲. کلید ایزوله‌سازی درب مربوطه (بایکوت درب) را در کابین راهبر فعال کنید تا قطار اجازه حرکت پیدا کند.\n۳. در ایستگاه انتهایی (تجریش/کهریزک)، وضعیت درب را به صورت مکانیکی بررسی و در سیستم تیکتینگ خرابی ثبت کنید.',
    safetyAlert: '🚨 هشدار ایمنی: حرکت قطار با درب باز یا بایکوت نشده مطلقاً ممنوع است و نقض مقررات ایمنی گروه الف محسوب می‌شود.'
  },
  {
    keywords: ['e205', 'موتور', 'صدا', 'سر و صدا', 'گیربکس'],
    title: 'صدای غیرعادی موتور یا سیستم محرکه (کد خطای E205)',
    resolution: 'در صورت شنیدن صدای غیرعادی از زیر قطار یا لرزش شدید واگن‌ها:\n۱. سرعت قطار را بلافاصله به کمتر از ۳۰ کیلومتر بر ساعت کاهش دهید.\n۲. در اولین ایستگاه توقف کرده و با دیسپچرز مرکز فرمان (OCC) تماس بگیرید.\n۳. درجه حرارت بلبرینگ‌ها و موتور را چک کنید.',
    safetyAlert: '🚨 هشدار ایمنی: بی‌توجهی به صدای غیرعادی موتور ممکن است منجر به خروج قطار از ریل یا آتش‌سوزی شود.'
  },
  {
    keywords: ['v301', 'تهویه', 'گرم', 'کولر', 'اسپلیت'],
    title: 'نقص فنی سیستم تهویه و کولر واگن (کد خطای V301)',
    resolution: 'در صورت قطع شدن سیستم تهویه واگن‌ها:\n۱. پرش فیوز سیستم تهویه (HVAC Break) را بررسی کنید.\n۲. در صورت پرش فیوز، یک بار آن را ریست کنید.\n۳. در صورت رفع نشدن عیب، دریچه‌های تهویه اضطراری واگن را باز کنید.',
    safetyAlert: '💡 راهنمای بهره‌برداری: در فصول گرم، تأمین هوای تازه واگن‌ها در داخل تونل از اهمیت بالایی برخوردار است.'
  },
  {
    keywords: ['atp', 'atc', 'سیگنالینگ', 'سیگنال', 's301'],
    title: 'خطای سیستم سیگنالینگ و ATP (کد خطای S301)',
    resolution: 'در صورت قطع ارتباط یا خطای سیستم سیگنالینگ ATP قطار:\n۱. بلافاصله سرعت قطار را به صورت دستی کنترل کنید.\n۲. کلید ATP Bypass را فعال کرده و وضعیت را به مرکز فرمان گزارش دهید.\n۳. با سرعت حداکثر ۲۵ کیلومتر بر ساعت تا اولین ایستگاه حرکت کنید.',
    safetyAlert: '🚨 هشدار ایمنی: حرکت بدون سیستم ATP در شرایط دید ضعیف تونل مستلزم هماهنگی ثانیه‌ای با دیسپچرز مرکز فرمان است.'
  },
  {
    keywords: ['ترمز', 'ترمز اضطراری', 'ترمز پنوماتیک', 'brake'],
    title: 'دستورالعمل سیستم ترمز قطار',
    resolution: 'در صورت بروز نقص در ترمزهای الکتریکی:\n۱. ترمز پنوماتیک پشتیبان را فعال کنید.\n۲. عقربه فشار مخزن ترمز در محدوده مجاز (۵ الی ۷ بار) قرار دارد.\n۳. در صورت افت فشار شدید، قطار ترمز اضطراری اعمال می‌کند.',
    safetyAlert: '🚨 هشدار ایمنی: هرگونه نشت هوا در لوله‌های ترمز باید فوراً بررسی شود.'
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

    const prompt = parsed.data.prompt.toLowerCase().trim()

    // 1. جستجو در بانک اطلاعاتی محلی (کدهای خطا)
    const rulebookMatch = RULEBOOK_DATABASE.find(item =>
      item.keywords.some(keyword => prompt.includes(keyword))
    )

    if (rulebookMatch) {
      return NextResponse.json({
        data: {
          reply: `**دستورالعمل استخراج شده: ${rulebookMatch.title}**\n\n${rulebookMatch.resolution}\n\n${rulebookMatch.safetyAlert}`,
          source: 'rulebook',
          matched: true,
        }
      })
    }

    // 2. جستجو در دانش‌نامه
    const knowledgeArticles = await prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          { title: { contains: parsed.data.prompt } },
          { body: { contains: parsed.data.prompt } },
          { tags: { contains: parsed.data.prompt } },
        ],
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
        }
      })
    }

    // 3. پاسخ پیش‌فرض
    const fallbackReply = `درخواست شما: "${parsed.data.prompt}" بررسی شد.\n\nمن کدهای خطای خط ۱ مترو تهران را می‌شناسم:\n• **E102** — درب واگن\n• **E205** — صدای موتور\n• **V301** — تهویه\n• **S301** — سیگنالینگ\n• **ترمز** — سیستم ترمز\n\nلطفاً کد خطا یا موضوع مورد نظر را وارد کنید.\n\nدر صورت وجود موارد اضطراری، دکمه **SOS** را بفشارید.`

    return NextResponse.json({
      data: {
        reply: fallbackReply,
        source: 'fallback',
        matched: false,
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    )
  }
}
