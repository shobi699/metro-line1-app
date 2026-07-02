import { GoogleGenerativeAI } from '@google/generative-ai'

// System prompt اختصاصی خط ۱ مترو تهران
const SYSTEM_PROMPT = `تو دستیار هوشمند عملیاتی خط ۱ مترو تهران هستی. نام تو «دستیار خط ۱» است.

وظایف اصلی تو:
- کمک به راهبران قطار در عیب‌یابی فنی و تفسیر کدهای خطا
- پاسخ‌دهی به سؤالات مربوط به مقررات سیر و حرکت و آیین‌نامه‌های ایمنی
- راهنمایی در شرایط اضطراری طبق پروتکل‌های استاندارد
- پاسخ به سؤالات عمومی مربوط به عملیات مترو

قوانین مهم:
1. همیشه به زبان فارسی پاسخ بده
2. پاسخ‌ها باید دقیق، مختصر و عملیاتی باشند
3. در شرایط بحرانی (حریق، خروج از ریل، برق‌گرفتگی) حتماً تأکید کن که «با مرکز فرمان OCC تماس بگیرید»
4. هرگز خودسرانه دستور عملیاتی خطرناک صادر نکن
5. اگر از پاسخ مطمئن نیستی، صادقانه بگو و به مراجعه به کتابچه راهبری ارجاع بده
6. اعداد را به فارسی بنویس
7. از ایموجی‌های مرتبط (🚇 🔧 ⚠️ ✅) برای خوانایی بهتر استفاده کن

اطلاعات خط ۱:
- خط ۱ مترو تهران از تجریش تا کهریزک
- ۳۲ ایستگاه فعال
- سیستم سیگنالینگ: ATP/ATC
- ناوگان: قطارهای سری ۱۰۰، ۲۰۰ و ۳۰۰
- تغذیه برق: ریل سوم (۷۵۰ ولت DC)
- ساعات کاری: ۵:۳۰ صبح تا ۲۳:۰۰ شب`

interface GeminiResponse {
  reply: string
  confidence: number
  source: 'gemini' | 'local-smart'
}

/**
 * ارسال سؤال به Gemini API با context مترو خط ۱
 * اگر کلید API موجود نباشد، از پاسخ‌دهی هوشمند محلی استفاده می‌کند
 */
export async function generateAIResponse(
  userPrompt: string,
  knowledgeContext: string,
  conversationHistory: Array<{ role: 'user' | 'model'; text: string }>
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY

  // اگر کلید API موجود نباشد، از fallback هوشمند محلی استفاده کن
  if (!apiKey) {
    return generateLocalSmartResponse(userPrompt, knowledgeContext)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    // ساخت پیام‌های مکالمه
    const chatHistory = conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    }))

    const chat = model.startChat({
      history: chatHistory,
    })

    // اضافه کردن context از دانش‌نامه محلی
    let enrichedPrompt = userPrompt
    if (knowledgeContext) {
      enrichedPrompt = `سؤال کاربر: ${userPrompt}\n\nاطلاعات مرتبط از دانش‌نامه محلی خط ۱:\n${knowledgeContext}\n\nلطفاً با استفاده از اطلاعات بالا پاسخ دقیق و عملیاتی بده.`
    }

    const result = await chat.sendMessage(enrichedPrompt)
    const response = result.response
    const text = response.text()

    return {
      reply: text,
      confidence: knowledgeContext ? 92 : 85,
      source: 'gemini',
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    // در صورت خطای API، از fallback محلی استفاده کن
    return generateLocalSmartResponse(userPrompt, knowledgeContext)
  }
}

/**
 * پاسخ‌دهی هوشمند محلی (بدون نیاز به API خارجی)
 * از الگوهای متنی و context دانش‌نامه استفاده می‌کند
 */
function generateLocalSmartResponse(
  userPrompt: string,
  knowledgeContext: string
): GeminiResponse {
  const prompt = userPrompt.toLowerCase().trim()

  // سلام و احوال‌پرسی
  const greetings = ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'شب بخیر', 'خسته نباشید', 'hello', 'hi']
  if (greetings.some((g) => prompt.includes(g))) {
    return {
      reply: `🚇 سلام! دستیار هوشمند خط ۱ مترو تهران در خدمت شماست.\n\nمن می‌توانم در موارد زیر به شما کمک کنم:\n\n🔧 **عیب‌یابی فنی** — کدهای خطا مثل E102، E205، V301\n📋 **مقررات و آیین‌نامه** — قوانین سیر و حرکت\n⚠️ **شرایط اضطراری** — پروتکل‌های بحران\n🚂 **اطلاعات ناوگان** — مشخصات قطارها و سیستم‌ها\n\nلطفاً سؤال خود را مطرح کنید یا یکی از دکمه‌های سریع پایین را لمس کنید.`,
      confidence: 100,
      source: 'local-smart',
    }
  }

  // سؤالات درباره ایستگاه‌ها
  if (prompt.includes('ایستگاه') || prompt.includes('تجریش') || prompt.includes('کهریزک')) {
    return {
      reply: `🚇 **اطلاعات ایستگاه‌های خط ۱ مترو تهران:**\n\nخط ۱ مترو تهران از ایستگاه **تجریش** (شمال) تا ایستگاه **کهریزک** (جنوب) امتداد دارد و شامل **۳۲ ایستگاه** فعال است.\n\nبرخی ایستگاه‌های مهم:\n• تجریش — ایستگاه انتهایی شمال\n• ولیعصر — تقاطع با خط ۳\n• امام خمینی — تقاطع با خط ۲\n• شهید بهشتی — تقاطع با خط ۴\n• کهریزک — ایستگاه انتهایی جنوب\n\nبرای اطلاعات دقیق‌تر درباره یک ایستگاه خاص، نام آن را بفرمایید.`,
      confidence: 95,
      source: 'local-smart',
    }
  }

  // سؤالات درباره شیفت و ساعت کاری
  if (prompt.includes('ساعت') || prompt.includes('شیفت') || prompt.includes('کاری')) {
    return {
      reply: `🕐 **ساعات بهره‌برداری خط ۱:**\n\n• شروع سرویس‌دهی: **۵:۳۰ صبح**\n• پایان سرویس‌دهی: **۲۳:۰۰ شب**\n• فاصله حرکت قطارها ساعات اوج: **۳ تا ۵ دقیقه**\n• فاصله حرکت قطارها ساعات خلوت: **۷ تا ۱۰ دقیقه**\n\nبرای مشاهده برنامه شیفت خود، به بخش «شیفت و تقویم من» مراجعه کنید.`,
      confidence: 90,
      source: 'local-smart',
    }
  }

  // اگر context از دانش‌نامه داریم
  if (knowledgeContext) {
    return {
      reply: `📖 **نتایج جستجو در دانش‌نامه خط ۱:**\n\n${knowledgeContext}\n\n---\n💡 برای اطلاعات دقیق‌تر، لطفاً سؤال خود را با جزئیات بیشتری مطرح کنید یا کد خطای مربوطه را وارد نمایید.`,
      confidence: 80,
      source: 'local-smart',
    }
  }

  // پاسخ پیش‌فرض هوشمند
  return {
    reply: `🤖 متوجه سؤال شما شدم: «${userPrompt}»\n\nمن در حال حاضر در موارد زیر می‌توانم به شما کمک کنم:\n\n🔧 **کدهای خطای فنی:**\n• E102 — نقص درب واگن\n• E205 — صدای غیرعادی موتور\n• E303 — سنسور حریق\n• E404 — افت نیروی کشش\n• V301 — سیستم تهویه\n• S301 — سیگنالینگ ATP\n\n⚠️ **شرایط اضطراری:**\n• حریق، خروج از ریل، برق‌گرفتگی\n\n📋 **مقررات عملیاتی:**\n• ترمز، سرعت مجاز، بایکوت\n\nلطفاً یکی از کدهای خطا یا موضوعات بالا را وارد کنید تا راهنمایی دقیق دریافت نمایید.\n\n> 💡 نکته: با اضافه شدن کلید API هوش مصنوعی، امکان پاسخ‌دهی به تمام سؤالات آزاد فراهم خواهد شد.`,
    confidence: 60,
    source: 'local-smart',
  }
}
