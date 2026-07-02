import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { aiQuerySchema } from '@/lib/zod/ai'
import { getEmbedding, cosineSimilarity } from '@/server/modules/ai/embedding'
import { AIGateway } from '@/server/modules/ai/gateway'
import { getSettingValue } from '@/server/modules/settings/service'

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

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface Article {
  title: string
  body: string
  category: string | null
  slug: string
  tags: string | null
}

function rankArticles(articles: Article[], keywords: string[]) {
  return articles.map(art => {
    let score = 0;
    const titleLower = art.title.toLowerCase();
    const bodyLower = art.body.toLowerCase();
    const tagsLower = (art.tags || '').toLowerCase();
    
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      
      // Title match: high weight
      if (titleLower.includes(kwLower)) {
        score += 15;
      }
      
      // Tag match: medium weight
      if (tagsLower.includes(kwLower)) {
        score += 8;
      }
      
      // Body occurrences count: 1 point per match
      try {
        const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = bodyLower.match(new RegExp(escaped, 'g'));
        if (matches) {
          score += matches.length;
        }
      } catch (e) {
        if (bodyLower.includes(kwLower)) {
          score += 1;
        }
      }
    }
    
    return { ...art, score };
  })
  .filter(art => art.score > 0)
  .sort((a, b) => b.score - a.score);
}

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
    const conversationId = parsed.data.conversationId || `${user.id}-${Date.now()}`

    // Ensure conversation exists in DB
    await prisma.aiConversation.upsert({
      where: { id: conversationId },
      update: {},
      create: {
        id: conversationId,
        userId: user.id
      }
    })

    const searchPriority = await getSettingValue<string>('ai.searchPriority', 'database')
    let questionEmbedding: number[] = []

    // ۱. بررسی کلمات کلیدی بحرانی و اضطراری
    const isCritical = CRITICAL_KEYWORDS.some(kw => prompt.includes(kw))
    if (isCritical) {
      const emergencyResponse = `🚨 **هشدار بحران فوری و خطر حادثه:**\n\nدرخواست شما حاوی واژه‌های ایمنی حساس است. طبق بند ۷-۱۲ آیین‌نامه فنی دیسپاچینگ، در این شرایط هوش مصنوعی مجاز به صدور دستورالعمل خودسرانه نیست.\n\n**اقدام فوری:** لطفاً بلافاصله از طریق بی‌سیم یا خط تلفن مستقیم با **مرکز فرمان (OCC) یا سرشیفت خط ۱** تماس بگیرید!`
      
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'AI_QUERY',
          entityId: 'critical',
          action: 'create',
          after: { prompt: rawPrompt, type: 'CRITICAL' },
        }
      }).catch(() => {})

      const aiMsg = await prisma.aiMessage.create({
        data: {
          conversationId,
          role: 'model',
          text: emergencyResponse,
          source: 'OCC_EMERGENCY',
          confidence: 100,
          handbookSection: 'بند ۱-۷ قوانین اضطراری خط ۱'
        }
      })

      return NextResponse.json({
        data: {
          id: aiMsg.id,
          reply: emergencyResponse,
          source: 'OCC_EMERGENCY',
          matched: true,
          confidence: 100,
          handbookSection: 'بند ۱-۷ قوانین اضطراری خط ۱',
          isCritical: true,
          conversationId
        }
      })
    }

    // ۲. سناریوی اولویت‌دار بر اساس تنظیمات مدیر
    if (searchPriority === 'database') {
      // الف. بررسی کدهای خطا و مقررات ثابت محلی (RULEBOOK)
      const rulebookMatch = RULEBOOK_DATABASE.find(item =>
        item.keywords.some(keyword => prompt.includes(keyword))
      )

      if (rulebookMatch) {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            entity: 'AI_QUERY',
            entityId: 'rulebook',
            action: 'create',
            after: { query: rulebookMatch.title, type: 'RULEBOOK' },
          }
        }).catch(() => {})

        await prisma.aiMessage.create({
          data: { conversationId, role: 'user', text: rawPrompt }
        })
        const aiMsg = await prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'model',
            text: `**${rulebookMatch.title}**\n\n${rulebookMatch.resolution}\n\n${rulebookMatch.safetyAlert}`,
            source: 'rulebook',
            confidence: rulebookMatch.confidence,
            handbookSection: rulebookMatch.handbookSection
          }
        })

        return NextResponse.json({
          data: {
            id: aiMsg.id,
            reply: aiMsg.text,
            source: 'rulebook',
            matched: true,
            confidence: rulebookMatch.confidence,
            handbookSection: rulebookMatch.handbookSection,
            conversationId
          }
        })
      }

      // ب. بررسی Semantic Cache (کش معنایی سوالات قبلی)
      let cachedAnswer = null
      let maxSim = 0

      try {
        questionEmbedding = await getEmbedding(rawPrompt)
        const caches = await prisma.aiKnowledgeCache.findMany()
        for (const cache of caches) {
          try {
            const vec = JSON.parse(cache.questionEmbedding)
            const sim = cosineSimilarity(questionEmbedding, vec)
            if (sim > maxSim && sim > 0.90) { // Threshold 90%
              maxSim = sim
              cachedAnswer = cache
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Embedding error (ignoring cache):', err)
      }

      if (cachedAnswer) {
        await prisma.aiKnowledgeCache.update({
          where: { id: cachedAnswer.id },
          data: { hitCount: { increment: 1 }, lastUsedAt: new Date() }
        })

        await prisma.aiMessage.create({
          data: { conversationId, role: 'user', text: rawPrompt }
        })
        const aiMsg = await prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'model',
            text: cachedAnswer.answerText,
            source: 'semantic_cache',
            confidence: maxSim * 100,
            handbookSection: 'پاسخ کش شده'
          }
        })

        return NextResponse.json({
          data: {
            id: aiMsg.id,
            reply: cachedAnswer.answerText,
            source: 'semantic_cache',
            matched: true,
            confidence: maxSim * 100,
            handbookSection: 'پاسخ کش شده',
            conversationId
          }
        })
      }

      // ج. جستجو در پایگاه دانش دیتابیس (Knowledge Base)
      const cleanPrompt = rawPrompt.replace(/[?؟.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      const stopWords = ['در', 'به', 'با', 'از', 'تا', 'چقدر', 'است', 'چیست', 'کردن', 'چگونه', 'و', 'یا', 'یک', 'این', 'آن', 'ها', 'های', 'را', 'که', 'چه', 'چند', 'کدام', 'من', 'شما', 'لطفا', 'لطفاً']
      const keywords = cleanPrompt
        .split(/\s+/)
        .filter(w => w.length > 1 && !stopWords.includes(w))

      if (keywords.length > 0) {
        const searchConditions = keywords.flatMap(kw => [
          { title: { contains: kw } },
          { body: { contains: kw } },
          { tags: { contains: kw } }
        ])

        const rawArticles = await prisma.knowledgeArticle.findMany({
          where: { OR: searchConditions },
          take: 15,
          select: {
            title: true,
            body: true,
            category: true,
            slug: true,
            tags: true,
          },
        })

        const ranked = rankArticles(rawArticles, keywords)

        if (ranked.length > 0) {
          // بررسی اینکه آیا پروایدر فعال و واقعی هوش مصنوعی وجود دارد
          const activeProvider = await prisma.aiProvider.findFirst({ where: { isActive: true } })
          const hasRealAI = activeProvider && (activeProvider.providerType === 'ollama' || (activeProvider.apiKey && activeProvider.apiKey !== 'fake-key'))

          if (!hasRealAI) {
            const article = ranked[0]
            const dbReply = `**[پاسخ مستقیم دیتابیس (بهترین تطبیق): ${article.title}]**\n\n${article.body}`

            await prisma.aiMessage.create({
              data: { conversationId, role: 'user', text: rawPrompt }
            })
            const aiMsg = await prisma.aiMessage.create({
              data: {
                conversationId,
                role: 'model',
                text: dbReply,
                source: 'knowledge',
                confidence: 100,
                handbookSection: article.category ?? 'دانش‌نامه محلی'
              }
            })

            await prisma.auditLog.create({
              data: {
                actorId: user.id,
                entity: 'AI_QUERY',
                entityId: 'knowledge',
                action: 'create',
                after: { prompt: rawPrompt, type: 'KNOWLEDGE_DIRECT' },
              }
            }).catch(() => {})

            return NextResponse.json({
              data: {
                id: aiMsg.id,
                reply: dbReply,
                source: 'knowledge',
                matched: true,
                confidence: 100,
                handbookSection: article.category ?? 'دانش‌نامه محلی',
                conversationId
              }
            })
          }
        }
      }
    } else {
      // سناریوی اولویت هوش مصنوعی (AI First)
      // در این سناریو ابتدا کش معنایی بررسی می‌شود، اگر پاسخی نبود با کمک RAG به هوش مصنوعی وصل می‌شویم
      let cachedAnswer = null
      let maxSim = 0

      try {
        questionEmbedding = await getEmbedding(rawPrompt)
        const caches = await prisma.aiKnowledgeCache.findMany()
        for (const cache of caches) {
          try {
            const vec = JSON.parse(cache.questionEmbedding)
            const sim = cosineSimilarity(questionEmbedding, vec)
            if (sim > maxSim && sim > 0.90) {
              maxSim = sim
              cachedAnswer = cache
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Embedding error:', err)
      }

      if (cachedAnswer) {
        await prisma.aiKnowledgeCache.update({
          where: { id: cachedAnswer.id },
          data: { hitCount: { increment: 1 }, lastUsedAt: new Date() }
        })

        await prisma.aiMessage.create({
          data: { conversationId, role: 'user', text: rawPrompt }
        })
        const aiMsg = await prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'model',
            text: cachedAnswer.answerText,
            source: 'semantic_cache',
            confidence: maxSim * 100,
            handbookSection: 'پاسخ کش شده'
          }
        })

        return NextResponse.json({
          data: {
            id: aiMsg.id,
            reply: cachedAnswer.answerText,
            source: 'semantic_cache',
            matched: true,
            confidence: maxSim * 100,
            handbookSection: 'پاسخ کش شده',
            conversationId
          }
        })
      }
    }

    // اگر اولویت با دیتابیس بود ولی چیزی پیدا نشد، یا اولویت با AI بود و کش معنایی خالی بود:
    // ۳. کوئری RAG روی دیتابیس برای فراهم کردن فکت‌های زمینه هوش مصنوعی
    const cleanPrompt = rawPrompt.replace(/[?؟.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    const stopWords = ['در', 'به', 'با', 'از', 'تا', 'چقدر', 'است', 'چیست', 'کردن', 'چگونه', 'و', 'یا', 'یک', 'این', 'آن', 'ها', 'های', 'را', 'که', 'چه', 'چند', 'کدام', 'من', 'شما', 'لطفا', 'لطفاً']
    const keywords = cleanPrompt
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.includes(w))

    let knowledgeContext = ''
    let matchedArticles: Article[] = []

    if (keywords.length > 0) {
      const searchConditions = keywords.flatMap(kw => [
        { title: { contains: kw } },
        { body: { contains: kw } },
        { tags: { contains: kw } }
      ])

      const rawArticles = await prisma.knowledgeArticle.findMany({
        where: { OR: searchConditions },
        take: 15,
        select: {
          title: true,
          body: true,
          category: true,
          slug: true,
          tags: true,
        },
      })

      matchedArticles = rankArticles(rawArticles, keywords)

      if (matchedArticles.length > 0) {
        // استفاده از ۳ مقاله با بالاترین میزان تطابق به عنوان متن زمینه
        knowledgeContext = matchedArticles.slice(0, 3).map((a, i) =>
          `${i + 1}. **${a.title}** (${a.category ?? 'عمومی'})\n${a.body.substring(0, 800)}`
        ).join('\n\n')
      }
    }

    // گرفتن بردار امبدینگ سوال کاربر اگر قبلاً تولید نشده باشد (برای ذخیره در کش بعد از پاسخ AI)
    if (questionEmbedding.length === 0) {
      try {
        questionEmbedding = await getEmbedding(rawPrompt)
      } catch (e) {}
    }

    // ۵. دریافت تاریخچه و ساخت Prompt برای Gateway
    const historyRecords = await prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20
    })
    
    const promptForAI = `
تو دستیار هوشمند عملیاتی خط ۱ مترو تهران هستی.
قوانین: همیشه فارسی پاسخ بده. اعداد فارسی باشند. در شرایط بحرانی بگو با OCC تماس بگیرند.

تاریخچه مکالمه:
${historyRecords.map(h => `${h.role}: ${h.text}`).join('\n')}

اطلاعات دیتابیس (در صورت وجود):
${knowledgeContext}

سؤال کاربر:
${rawPrompt}
`

    try {
      // ۶. ارسال به AI Gateway
      const aiResponse = await AIGateway.routeRequest(promptForAI)

      // ۷. ذخیره پاسخ جدید در Semantic Cache
      if (questionEmbedding.length > 0) {
        await prisma.aiKnowledgeCache.create({
          data: {
            questionText: rawPrompt,
            questionEmbedding: JSON.stringify(questionEmbedding),
            answerText: aiResponse.text,
            source: 'ai_generated',
            providerUsed: aiResponse.usedProvider,
            confidenceScore: aiResponse.confidence || 90
          }
        }).catch(() => {})
      }

      // ذخیره در تاریخچه مکالمه
      await prisma.aiMessage.create({
        data: { conversationId, role: 'user', text: rawPrompt }
      })
      const aiMsg = await prisma.aiMessage.create({
        data: {
          conversationId,
          role: 'model',
          text: aiResponse.text,
          source: aiResponse.usedProvider,
          confidence: aiResponse.confidence || 90,
          handbookSection: knowledgeContext ? 'دانش‌نامه محلی پرسنل' : 'هوش مصنوعی'
        }
      })

      // لاگ سؤالات
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'AI_QUERY',
          entityId: aiResponse.usedProvider,
          action: 'create',
          after: { prompt: rawPrompt, source: aiResponse.usedProvider, hasContext: !!knowledgeContext },
        }
      }).catch(() => {})

      return NextResponse.json({
        data: {
          id: aiMsg.id,
          reply: aiResponse.text,
          source: aiResponse.usedProvider,
          matched: true,
          confidence: aiResponse.confidence || 90,
          handbookSection: knowledgeContext ? 'دانش‌نامه محلی پرسنل' : 'هوش مصنوعی',
          conversationId
        }
      })
    } catch (aiError: any) {
      console.warn('AI Gateway call failed. Attempting database fallback:', aiError)

      // ۸. پیاده‌سازی مکانیزم زاپاس دیتابیس (Database Fallback) در صورت شکست هوش مصنوعی
      if (matchedArticles.length > 0) {
        const article = matchedArticles[0]
        const dbReply = `⚠️ **[پاسخ از پایگاه دانش دیتابیس (حالت زاپاس): ${article.title}]**\n\n${article.body}`

        await prisma.aiMessage.create({
          data: { conversationId, role: 'user', text: rawPrompt }
        })
        const aiMsg = await prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'model',
            text: dbReply,
            source: 'knowledge',
            confidence: 90,
            handbookSection: article.category ?? 'دانش‌نامه محلی'
          }
        })

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            entity: 'AI_QUERY',
            entityId: 'knowledge_fallback',
            action: 'create',
            after: { prompt: rawPrompt, type: 'KNOWLEDGE_FALLBACK', error: aiError.message },
          }
        }).catch(() => {})

        return NextResponse.json({
          data: {
            id: aiMsg.id,
            reply: dbReply,
            source: 'knowledge',
            matched: true,
            confidence: 90,
            handbookSection: article.category ?? 'دانش‌نامه محلی',
            conversationId
          }
        })
      }

      // در صورتی که دیتابیس هم هیچ تطبیقی پیدا نکند، خطای اصلی را باز می‌گردانیم
      throw aiError
    }

  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json(
      { error: err.message || 'خطای غیرمنتظره در سرور' },
      { status: 500 }
    )
  }
}
