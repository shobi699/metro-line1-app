import { prisma } from '@/server/db'
import { AIGateway } from './gateway'
import { getEmbedding, cosineSimilarity } from './embedding'
import dayjs from 'dayjs'
import { getSettingValue } from '@/server/modules/settings/service'
import { toFa, jalali, faTime, normalizeFarsiString, fuzzyMatchScore } from '@/lib/fa'
import { createFaultReport } from '@/server/modules/faults/service'
import { TROUBLESHOOTING_GRAPH_MD } from './troubleshooting-docs'

export interface PendingAction {
  userId: string
  action: 'create_fault'
  payload: any
  description: string
  createdAt: number
}

export const pendingActions = new Map<string, PendingAction>()

interface CachedFAQ {
  id: string
  question: string
  answer: string
  category: string | null
  articleId: string | null
  embedding: number[]
}

let faqCache: CachedFAQ[] = []
let lastFaqCacheUpdate = 0
const FAQ_CACHE_TTL_MS = 60000 // Cache FAQ embeddings for 1 minute

function maskSensitiveData(text: string): string {
  // Mask national ID (10 digits)
  let masked = text.replace(/\b\d{10}\b/g, '[کد پرسنلی ماسک شده]')
  // Mask phone number (09xxxxxxxx)
  masked = masked.replace(/\b09\d{9}\b/g, '[شماره تلفن ماسک شده]')
  return masked
}

export class AIAssistantService {
  /**
   * Confirm and execute a pending tool action
   */
  static async confirmAction(token: string, userId: string) {
    const action = pendingActions.get(token)
    if (!action) {
      throw new Error('کد اقدام نامعتبر است یا منقضی شده است.')
    }
    if (action.userId !== userId) {
      throw new Error('شما مجاز به تایید این اقدام نیستید.')
    }

    if (action.action === 'create_fault') {
      const result = await createFaultReport(action.payload, userId)
      pendingActions.delete(token)
      return result
    }

    throw new Error('اقدام تعریف نشده است.')
  }

  /**
   * processMessage for backward compatibility (non-streaming clients)
   */
  static async processMessage({
    userId,
    personaKey,
    message,
    threadId,
    history = [],
    imageUrl
  }: {
    userId: string
    personaKey: string
    message: string
    threadId?: string
    history?: Array<{ role: 'user' | 'ai', content: string }>
    imageUrl?: string
  }) {
    let finalContent = ''
    let info: any = {}
    
    const stream = this.processMessageStream({ userId, personaKey, message, threadId, history, imageUrl })
    for await (const chunk of stream) {
      if (chunk.type === 'info') {
        info = chunk.data
      } else if (chunk.type === 'token') {
        finalContent += chunk.data.text
      } else if (chunk.type === 'tool_confirm') {
        return {
          content: `نیازمند تایید اقدام: ${chunk.data.description}`,
          toolConfirm: chunk.data,
          source: 'system',
          confidence: 100,
          handbookSection: 'ابزارهای سیستم'
        }
      } else if (chunk.type === 'done') {
        return {
          content: finalContent || chunk.data.content,
          source: info.source || 'AI',
          confidence: info.confidence || 90,
          handbookSection: info.handbookSection || 'دانش‌نامه'
        }
      } else if (chunk.type === 'error') {
        throw new Error(chunk.data.message || 'خطای سرور هوش مصنوعی')
      }
    }

    return {
      content: finalContent,
      source: info.source || 'AI',
      confidence: info.confidence || 90,
      handbookSection: info.handbookSection || 'دانش‌نامه'
    }
  }

  /**
   * processMessageStream (SSE Stream generator)
   */
  static async *processMessageStream({
    userId,
    personaKey,
    message,
    threadId,
    history = [],
    imageUrl
  }: {
    userId: string
    personaKey: string
    message: string
    threadId?: string
    history?: Array<{ role: 'user' | 'ai', content: string }>
    imageUrl?: string
  }): AsyncGenerator<any, void, unknown> {
    const startTime = Date.now()

    // 0. Resolve Conversation Thread
    let activeThreadId = threadId
    if (!activeThreadId || activeThreadId === 'new') {
      const conv = await prisma.aiConversation.create({
        data: {
          userId,
        }
      })
      activeThreadId = conv.id
    } else {
      const conv = await prisma.aiConversation.findUnique({ where: { id: activeThreadId } })
      if (!conv || conv.userId !== userId) {
        yield { type: 'error', data: { message: 'گفتگو یافت نشد یا شما دسترسی ندارید.' } }
        return
      }
    }

    // Yield the thread ID back to the client immediately
    yield { type: 'info', data: { thread_id: activeThreadId } }

    // Save user message
    await prisma.aiMessage.create({
      data: {
        conversationId: activeThreadId,
        role: 'user',
        text: message,
      }
    })

    // 1. Load Persona
    const persona = await prisma.aiPersona.findUnique({ where: { key: personaKey } })
    if (!persona || !persona.isActive) {
      yield { type: 'error', data: { message: 'پرسونای مورد نظر یافت نشد یا غیرفعال است.' } }
      return
    }

    // 2. Load User Role
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })
    const userRole = dbUser?.role.key || 'operator'

    // Check Persona permission
    let allowedRoles: string[] = []
    try {
      allowedRoles = JSON.parse(persona.roleKeys)
    } catch (e) {}

    if (allowedRoles.length > 0 && !allowedRoles.includes('*') && !allowedRoles.includes(userRole)) {
      yield { type: 'error', data: { message: 'شما دسترسی به این دستیار هوشمند را ندارید.' } }
      return
    }

    const cleanMsg = normalizeFarsiString(message)

    // --- L0: Live Data Intent Recognition ---
    const isTomorrowShift = (cleanMsg.includes('شیفت') || cleanMsg.includes('کار') || cleanMsg.includes('برنامه')) && cleanMsg.includes('فردا')
    const isTodayShift = (cleanMsg.includes('شیفت') || cleanMsg.includes('کار') || cleanMsg.includes('برنامه')) && cleanMsg.includes('امروز')
    
    if (isTomorrowShift || isTodayShift) {
      const targetDate = isTomorrowShift 
        ? dayjs().add(1, 'day').startOf('day').toDate() 
        : dayjs().startOf('day').toDate()
        
      const targetDateStr = isTomorrowShift ? 'فردا' : 'امروز'
      const jalaliDateStr = jalali(targetDate)
      
      const shift = await prisma.shift.findFirst({
        where: {
          userId,
          date: {
            gte: dayjs(targetDate).startOf('day').toDate(),
            lt: dayjs(targetDate).endOf('day').toDate()
          }
        }
      })
      
      let replyText = ''
      if (shift) {
        const translateShiftCode = (code: string) => {
          switch (code) {
            case 'morning': return 'صبح‌کار (۰۶:۰۰ تا ۱۴:۰۰)'
            case 'evening': return 'عصرکار (۱۴:۰۰ تا ۲۲:۰۰)'
            case 'night': return 'شب‌کار (۲۲:۰۰ تا ۰۶:۰۰ فردا)'
            case 'off': return 'استراحت / آف'
            case 'office': return 'روزکار اداری (۰۷:۳۰ تا ۱۵:۳۰)'
            default: return code
          }
        }
        replyText = `برنامه شیفت شما برای ${targetDateStr} (${jalaliDateStr}):\nکد شیفت: ${translateShiftCode(shift.code)}\n${shift.note ? `توضیحات: ${shift.note}` : ''}`
      } else {
        replyText = `برای ${targetDateStr} (${jalaliDateStr}) شیفتی برای شما در سیستم ثبت نشده است. لطفاً لوحه را بررسی فرمایید.`
      }
      
      yield {
        type: 'info',
        data: { layer: 'L0', source: 'سیستم لوحه زنده', confidence: 100, handbookSection: 'برنامه‌ریزی شیفت' }
      }
      yield { type: 'token', data: { text: replyText } }

      // Save AI message
      await prisma.aiMessage.create({
        data: {
          conversationId: activeThreadId,
          role: 'ai',
          text: replyText,
          source: 'سیستم لوحه زنده',
          confidence: 100,
          handbookSection: 'برنامه‌ریزی شیفت'
        }
      })

      yield { type: 'done', data: { content: replyText, id: 'l0-shift' } }
      
      await this.logInteraction(userId, personaKey, 'L0', Date.now() - startTime, 0, 0, 0, 'live_roster')
      return
    }

    const trainMatch = cleanMsg.match(/قطار\s*(?:شماره\s*)?(\d+)/)
    const isFaultQuery = cleanMsg.includes('فالت') || 
                         cleanMsg.includes('خرابی') || 
                         cleanMsg.includes('مشکل') || 
                         cleanMsg.includes('نقص') ||
                         cleanMsg.includes('امرجنسی') ||
                         cleanMsg.includes('ترمز') ||
                         cleanMsg.includes('فشار هوا') ||
                         cleanMsg.includes('ترکشن') ||
                         cleanMsg.includes('ارور')
    const isRegisterFaultAction = (cleanMsg.includes('ثبت') || cleanMsg.includes('گزارش') || cleanMsg.includes('ایجاد')) && isFaultQuery
    
    if (trainMatch && isFaultQuery && !isRegisterFaultAction) {
      const trainNumber = trainMatch[1]
      const train = await prisma.train.findUnique({
        where: { trainNumber }
      })
      
      let replyText = ''
      if (!train) {
        replyText = `قطار شماره ${trainNumber} در سیستم یافت نشد.`
      } else {
        const activeFaults = await prisma.faultReport.findMany({
          where: {
            trainId: train.id,
            status: { notIn: ['verified_closed', 'rejected'] }
          },
          include: { faultCode: true }
        })
        
        const translateStatus = (status: string) => {
          switch (status) {
            case 'submitted': return 'ثبت شده'
            case 'under_review': return 'در حال بررسی'
            case 'needs_info': return 'نیازمند اطلاعات'
            case 'approved': return 'تایید شده'
            case 'in_repair': return 'در حال تعمیر'
            case 'repaired': return 'تعمیر شده'
            case 'deferred': return 'به تعویق افتاده'
            case 'reopened': return 'بازگشایی شده'
            default: return status
          }
        }

        const translateTrainStatus = (status: string) => {
          switch (status) {
            case 'active': return 'فعال در خط'
            case 'standby': return 'آماده‌باش (استندبای)'
            case 'maintenance': return 'تحت تعمیرات کارگاهی'
            case 'out_of_service': return 'خارج از سرویس'
            default: return status
          }
        }
        
        replyText = `وضعیت قطار شماره ${toFa(trainNumber)}: ${translateTrainStatus(train.status)}\n\n`
        if (activeFaults.length === 0) {
          replyText += `در حال حاضر هیچ فالت فعال یا گزارش خرابی باز برای این قطار ثبت نشده است.`
        } else {
          replyText += `گزارش‌های خرابی فعال (${toFa(activeFaults.length)} مورد):\n`
          activeFaults.forEach((f, idx) => {
            replyText += `${toFa(idx + 1)}. فالت ${f.faultCode.code}: ${f.faultCode.title} (وضعیت: ${translateStatus(f.status)})\n`
            if (f.description) replyText += `   توضیح: ${f.description}\n`
          })
        }
      }
      
      yield {
        type: 'info',
        data: { layer: 'L0', source: 'سیستم ثبت خرابی', confidence: 100, handbookSection: 'فالت ناوگان' }
      }
      yield { type: 'token', data: { text: replyText } }

      await prisma.aiMessage.create({
        data: {
          conversationId: activeThreadId,
          role: 'ai',
          text: replyText,
          source: 'سیستم ثبت خرابی',
          confidence: 100,
          handbookSection: 'فالت ناوگان'
        }
      })

      yield { type: 'done', data: { content: replyText, id: 'l0-faults' } }
      
      await this.logInteraction(userId, personaKey, 'L0', Date.now() - startTime, 0, 0, 0, 'live_fleet')
      return
    }

    // --- L0: Tool Action Registration ---
    
    let enabledTools: string[] = []
    try {
      enabledTools = JSON.parse(persona.tools)
    } catch (e) {}
    
    if (isRegisterFaultAction && trainMatch && enabledTools.includes('create_fault')) {
      const trainNumber = trainMatch[1]
      const train = await prisma.train.findUnique({
        where: { trainNumber }
      })
      
      if (train) {
        const faultCodes = await prisma.faultCode.findMany({ where: { isActive: true } })
        let bestFaultCode = null
        let highestScore = 0
        
        for (const fc of faultCodes) {
          const score = fuzzyMatchScore(message, fc.title) + (fc.keywords ? fuzzyMatchScore(message, fc.keywords) : 0)
          if (score > highestScore) {
            highestScore = score
            bestFaultCode = fc
          }
        }
        
        if (bestFaultCode && highestScore > 40) {
          const actionToken = 'action_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
          const payload = {
            trainId: train.id,
            faultCodeId: bestFaultCode.id,
            description: `گزارش شده توسط دستیار هوشمند: ${message}`,
            occurredAt: new Date().toISOString(),
            serviceImpact: 'none'
          }
          
          pendingActions.set(actionToken, {
            userId,
            action: 'create_fault',
            payload,
            description: `ثبت فالت ${bestFaultCode.code} (${bestFaultCode.title}) برای قطار ${trainNumber}`,
            createdAt: Date.now()
          })
          
          yield {
            type: 'tool_confirm',
            data: {
              actionToken,
              description: `آیا مایلید فالت ${bestFaultCode.code} (${bestFaultCode.title}) را برای قطار شماره ${toFa(trainNumber)} ثبت کنید؟`,
              payload
            }
          }
          return
        }
      }
    }

    // Generate Query Embedding
    let questionEmbeddingArray: number[] = []
    try {
      questionEmbeddingArray = await getEmbedding(message)
    } catch (e) {
      console.error('Embedding Generation Error', e)
    }

    // --- L1: Semantic Cache ---
    if (questionEmbeddingArray.length > 0) {
      const cacheThreshold = await getSettingValue<number>('ai.cache.threshold', 0.92)
      const cachedAnswers = await prisma.aiKnowledgeCache.findMany({
        where: { 
          personaKey,
          OR: [
            { ttlAt: null },
            { ttlAt: { gt: new Date() } }
          ]
        }
      })
  
      let bestMatch = { score: 0, cache: null as any }
      for (const cache of cachedAnswers) {
        try {
          const cacheEmbedding = JSON.parse(cache.questionEmbedding)
          const score = cosineSimilarity(questionEmbeddingArray, cacheEmbedding)
          if (score > bestMatch.score) {
            bestMatch = { score, cache }
          }
        } catch (e) {}
      }
  
      if (bestMatch.score >= cacheThreshold && bestMatch.cache) {
        await prisma.aiKnowledgeCache.update({
          where: { id: bestMatch.cache.id },
          data: { hitCount: { increment: 1 }, lastUsedAt: new Date() }
        })
        
        yield {
          type: 'info',
          data: { 
            layer: 'L1', 
            source: bestMatch.cache.source, 
            confidence: Math.round(bestMatch.score * 100),
            handbookSection: 'پاسخ ذخیره شده در کش' 
          }
        }
        yield { type: 'token', data: { text: bestMatch.cache.answerText } }
        
        await prisma.aiMessage.create({
          data: {
            conversationId: activeThreadId,
            role: 'ai',
            text: bestMatch.cache.answerText,
            source: bestMatch.cache.source,
            confidence: Math.round(bestMatch.score * 100),
            handbookSection: 'پاسخ ذخیره شده در کش'
          }
        })

        yield { type: 'done', data: { content: bestMatch.cache.answerText, id: 'l1-cache' } }
        
        await this.logInteraction(userId, personaKey, 'L1', Date.now() - startTime, 0, 0, 0, 'semantic_cache')
        return
      }
    }

    // --- L2: FAQ Semantic Matches ---
    if (questionEmbeddingArray.length > 0) {
      const faqThreshold = await getSettingValue<number>('ai.faq.threshold', 0.90)
      
      // Sync cache
      const now = Date.now()
      if (faqCache.length === 0 || now - lastFaqCacheUpdate > FAQ_CACHE_TTL_MS) {
        try {
          const faqs = await prisma.knowledgeFAQ.findMany()
          const updatedCache: CachedFAQ[] = []
          for (const faq of faqs) {
            try {
              const embedding = await getEmbedding(faq.question)
              updatedCache.push({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                articleId: faq.articleId,
                embedding
              })
            } catch (err) {}
          }
          faqCache = updatedCache
          lastFaqCacheUpdate = now
        } catch (err) {
          console.error('FAQ load error', err)
        }
      }

      let bestFaq = { score: 0, faq: null as any }
      for (const fc of faqCache) {
        const score = cosineSimilarity(questionEmbeddingArray, fc.embedding)
        if (score > bestFaq.score) {
          bestFaq = { score, faq: fc }
        }
      }

      if (bestFaq.score >= faqThreshold && bestFaq.faq) {
        const section = bestFaq.faq.category || 'پرسش‌های متداول'
        yield {
          type: 'info',
          data: {
            layer: 'L2',
            source: 'faq',
            confidence: Math.round(bestFaq.score * 100),
            handbookSection: section
          }
        }
        yield { type: 'token', data: { text: bestFaq.faq.answer } }
        
        await prisma.aiMessage.create({
          data: {
            conversationId: activeThreadId,
            role: 'ai',
            text: bestFaq.faq.answer,
            source: 'faq',
            confidence: Math.round(bestFaq.score * 100),
            handbookSection: section
          }
        })

        yield { type: 'done', data: { content: bestFaq.faq.answer, id: 'l2-faq' } }

        await this.logInteraction(userId, personaKey, 'L2', Date.now() - startTime, 0, 0, 0, 'faq_match')
        return
      }
    }

    // --- Budget / Quota checks ---
    const startOfMonth = dayjs().startOf('month').toDate()
    const endOfMonth = dayjs().endOf('month').toDate()

    const userInteractions = await prisma.aiInteraction.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      },
      select: { tokensIn: true, tokensOut: true }
    })

    const userTokensUsed = userInteractions.reduce((sum, item) => sum + item.tokensIn + item.tokensOut, 0)
    const userMonthlyCap = await getSettingValue<number>('ai.budget.userMonthlyCap', 100000)

    if (userTokensUsed >= userMonthlyCap) {
      const errReply = 'سهمیه مصرف هوش مصنوعی شما در این ماه به پایان رسیده است. لطفا با مدیر سیستم تماس بگیرید.'
      yield {
        type: 'info',
        data: { layer: 'BudgetExceeded', source: 'system', confidence: 100, handbookSection: 'بودجه و سهمیه' }
      }
      yield { type: 'token', data: { text: errReply } }
      yield { type: 'done', data: { content: errReply, id: 'budget-exceeded' } }
      return
    }

    // Budget warning / model downgrade (80%)
    let forceEconomy = false
    if (userTokensUsed >= 0.8 * userMonthlyCap && userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'manager') {
      forceEconomy = true
    }

    if (persona.monthlyTokenCap && userTokensUsed >= persona.monthlyTokenCap) {
      const errReply = 'سهمیه توکن پرسونای شما در این ماه به پایان رسیده است.'
      yield {
        type: 'info',
        data: { layer: 'BudgetExceeded', source: 'system', confidence: 100, handbookSection: 'بودجه و سهمیه' }
      }
      yield { type: 'token', data: { text: errReply } }
      yield { type: 'done', data: { content: errReply, id: 'budget-exceeded' } }
      return
    }

    // --- L3-G: Local Graph Query (Knowledge Engine) ---
    let graphFacts: any[] = []
    try {
      if (!isFaultQuery && !forceEconomy) {
        // Query the sidecar Python Knowledge Engine
        const graphRes = await fetch('http://localhost:8000/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cleanMsg, access_roles: allowedRoles })
        })
        if (graphRes.ok) {
          const graphData = await graphRes.json()
          if (graphData.subgraph_facts && graphData.subgraph_facts.length > 0) {
            graphFacts = graphData.subgraph_facts
          }
        }
      }
    } catch (e) {
      console.warn('[AI] Graph Knowledge Engine not reachable', e)
    }

    // --- L3/L4: RAG Retrieval & Setup ---
    let contextText = ''
    let sourceRefs: string[] = []
    let isConfidentialContext = false

    try {
      const allowedCategories = JSON.parse(persona.knowledgeCats) as string[]
      const chunks = await prisma.aiChunk.findMany({
        where: {
          source: { 
            isActive: true, 
            category: { in: allowedCategories } 
          }
        },
        include: { source: true }
      })

      const chunkMatches = chunks.map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding)
        const score = questionEmbeddingArray.length > 0 ? cosineSimilarity(questionEmbeddingArray, chunkEmbedding) : 0
        return { score, chunk }
      })
      .filter(m => m.score > 0.40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

      if (chunkMatches.length > 0) {
        contextText = chunkMatches.map(c => `[منبع: ${c.chunk.source.title}] ${c.chunk.text}`).join('\n\n')
        sourceRefs = Array.from(new Set(chunkMatches.map(c => c.chunk.sourceId)))
        
        // Check confidentiality
        isConfidentialContext = chunkMatches.some(c => 
          c.chunk.source.accessRoles?.includes('confidential') || 
          c.chunk.source.accessRoles?.includes('secret')
        )
      }
      
      // Append graph facts to context
      if (graphFacts.length > 0) {
        contextText += '\n\n--- اطلاعات مستخرج از گراف دانش (L3-G) ---\n'
        contextText += JSON.stringify(graphFacts, null, 2)
        sourceRefs.push('graph_knowledge')
      }
      
    } catch (e) {
      console.error('[AI] RAG context error', e)
    }

    // Model selection
    let modelClass: 'economy' | 'strong' = 'economy'
    
    // Upgrade to L4 rules
    const isComplex = message.length > 200 || 
                      cleanMsg.includes('تحلیل') || 
                      cleanMsg.includes('مقایسه') || 
                      cleanMsg.includes('علت') || 
                      cleanMsg.includes('چرا') ||
                      isFaultQuery

    if (isComplex && !forceEconomy) {
      modelClass = 'strong'
    }

    // Choose preferred model string
    let preferredModel = modelClass === 'strong' 
      ? (persona.strongModel || 'gemini') 
      : (persona.economyModel || 'ollama')

    // Privacy rule: force Ollama local if confidential category is matches
    if (isConfidentialContext) {
      preferredModel = 'ollama' // Force local model
    }

    // Data privacy masking
    const cleanPrompt = maskSensitiveData(message)

    let finalSystemPrompt = persona.systemPrompt
    
    if (isFaultQuery) {
      // Fetch dynamic technical catalogs from database
      let dynamicCatalogsStr = ''
      try {
        const dynamicCatalogs = await prisma.technicalCatalog.findMany({
          where: { category: 'troubleshooting' }
        })
        if (dynamicCatalogs.length > 0) {
          dynamicCatalogsStr = '\n\n--- کاتالوگ‌های فنی ثبت شده در سیستم ---\n' + dynamicCatalogs.map(c => `عنوان: ${c.title}\n${c.content}`).join('\n\n')
        }
      } catch (e) {
        console.error('Failed to load dynamic catalogs', e)
      }

      finalSystemPrompt += `\n\nدستورالعمل بسیار مهم (Interactive Troubleshooting Rule):
شما یک دستیار فنی خبره برای راهبران قطار هستید. راهبر با یک خرابی مواجه شده است.

وظایف شما:
1. اصطلاحات محاوره‌ای راهبر را متوجه شوید (مثلاً "امرجنسی" = "ترمز اضطراری" ، "گیج پایین" = "افت فشار هوا" ، "ترکشن نمی‌گیره" = "عدم ترکشن‌گیری" ، "ارور درها" = "خطای در").
2. ابتدا نوع قطار (AC یا DC) را مشخص کنید. اگر راهبر در پیام خود نگفته است، فقط و فقط بپرسید: "قطار شما AC است یا DC؟" (هیچ سوال اضافی مثل کد دیسپاچینگ نپرسید!).
3. گراف عیب‌یابی مربوط به مشکل راهبر را از متن زیر پیدا کنید (مثلاً گراف "افت فشار هوا").
4. اولین سوالی که گراف برای تصمیم‌گیری لازم دارد را از راهبر بپرسید (مثلاً "وضعیت گیج فشار چگونه است؟").
5. هرگز راهنمایی‌های نامربوط یا سوالات اضافی (مانند "چه صدایی می‌شنوید؟"، "کدام ایستگاه هستید؟") نپرسید مگر اینکه در گراف نوشته شده باشد.
6. هرگز همهٔ گام‌ها را یک‌جا ندهید. قدم‌به‌قدم بر اساس جواب راهبر پیش بروید.
7. بسیار مهم: در انتهای هر پیام که سوالی می‌پرسید، حتماً گزینه‌های احتمالی برای جواب راهبر را در قالب [گزینه‌ها: گزینه۱ | گزینه۲] بنویسید تا سیستم آن‌ها را به دکمه تبدیل کند.
مثال: [گزینه‌ها: AC | DC] یا [گزینه‌ها: روشن | خاموش]

--- درخت تصمیم و گراف‌های عیب‌یابی ---
${TROUBLESHOOTING_GRAPH_MD}
${dynamicCatalogsStr}

--- اطلاعات مرجع تکمیلی و راهنمای جامع ---
${contextText || 'منبع متنی یافت نشد.'}
-----------------------------------------
`
    } else {
      finalSystemPrompt += `\n\nدستورالعمل بسیار مهم (Grounding & Diagnostic Rule):
شما یک دستیار فنی تعاملی هستید. پاسخ‌های شما باید منحصراً و فقط بر اساس «اطلاعات مرجع» زیر باشد.
قانون طلایی ضد توهم: اگر جواب سوال کاربر در متن مرجع وجود ندارد یا متن مرجع خالی است، تحت هیچ شرایطی از خودتان اطلاعات اختراع نکنید (اصطلاحاً هفل‌هشت جواب ندهید). در این حالت صریحاً بگویید: "من در پایگاه دانش خود اطلاعاتی در این زمینه ندارم."
اگر سوال یا گزارش راهبر گنگ یا ناقص است، سریعاً راه‌حل ندهید؛ بلکه سوال بپرسید تا مشکل شفاف شود.
اگر واقعاً راه‌حلی یافت نشد، ارجاع به دیسپچر OCC دهید.

--- اطلاعات مرجع آیین‌نامه مترو خط ۱ ---
${contextText || 'هیچ منبع متنی مستقیمی برای پاسخ به این سوال یافت نشد. اکیداً از خودتان حدس نزنید.'}
-----------------------------------------
`
    }

    // Format history
    let historyText = ''
    if (history && history.length > 0) {
      // Limit to last 5 messages to save tokens
      const recentHistory = history.slice(-5)
      historyText = 'تاریخچه گفتگو:\n' + recentHistory.map(h => `${h.role === 'user' ? 'راهبر' : 'دستیار'}: ${h.content}`).join('\n') + '\n\n'
    }

    const fullPrompt = `${finalSystemPrompt}\n\n${historyText}پیام جدید راهبر: ${cleanPrompt}\nپاسخ دستیار:`

    // Emit interaction info
    const currentLayer = modelClass === 'strong' ? 'L4' : 'L3'
    yield {
      type: 'info',
      data: {
        layer: currentLayer,
        source: preferredModel,
        confidence: contextText ? 85 : 60,
        handbookSection: contextText ? 'دستورالعمل ناوگان خط ۱' : 'هوش مصنوعی'
      }
    }

    let finalResponseText = ''
    let actualProviderName = preferredModel

    try {
      const sseStream = AIGateway.routeRequestStream(fullPrompt, preferredModel)
      for await (const chunk of sseStream) {
        actualProviderName = chunk.provider
        finalResponseText += chunk.token
        yield { type: 'token', data: { text: chunk.token } }
      }
    } catch (err: any) {
      console.warn('Streaming error, fallback to static chat:', err)
      // Fallback
      const staticResponse = await AIGateway.routeRequest(fullPrompt, preferredModel)
      actualProviderName = staticResponse.usedProvider
      finalResponseText = staticResponse.text
      yield { type: 'token', data: { text: finalResponseText } }
    }

    // Save to Semantic Cache
    if (questionEmbeddingArray.length > 0 && finalResponseText) {
      try {
        await prisma.aiKnowledgeCache.create({
          data: {
            personaKey,
            questionText: message,
            questionEmbedding: JSON.stringify(questionEmbeddingArray),
            answerText: finalResponseText,
            source: 'ai_generated',
            providerUsed: actualProviderName,
            ttlAt: dayjs().add(7, 'days').toDate(),
            confidenceScore: contextText ? 0.85 : 0.6,
            sourceRefs: JSON.stringify(sourceRefs)
          }
        })
      } catch (e) {
        console.error('[AI] Failed to save semantic cache', e)
      }
    }

    // Log Interaction
    const latencyMs = Date.now() - startTime
    const tokensIn = Math.round(fullPrompt.length / 4)
    const tokensOut = Math.round(finalResponseText.length / 4)
    const costEst = actualProviderName.toLowerCase().includes('gemini') ? (tokensIn + tokensOut) * 0.0000001 : 0 // local is free

    await this.logInteraction(userId, personaKey, currentLayer, latencyMs, tokensIn, tokensOut, costEst, actualProviderName)

    await prisma.aiMessage.create({
      data: {
        conversationId: activeThreadId,
        role: 'ai',
        text: finalResponseText,
        source: preferredModel,
        confidence: contextText ? 85 : 60,
        handbookSection: contextText ? 'دستورالعمل ناوگان خط ۱' : 'هوش مصنوعی'
      }
    })

    yield {
      type: 'done',
      data: {
        content: finalResponseText,
        id: 'llm-' + Date.now()
      }
    }
  }

  private static async logInteraction(
    userId: string,
    personaKey: string,
    layer: string,
    latencyMs: number,
    tokensIn: number,
    tokensOut: number,
    costEst: number,
    provider?: string
  ) {
    try {
      await prisma.aiInteraction.create({
        data: {
          userId,
          personaKey,
          layer,
          latencyMs,
          tokensIn,
          tokensOut,
          costEst,
          provider
        }
      })
    } catch (e) {
      console.error('[AI] Failed to log interaction', e)
    }
  }
}
