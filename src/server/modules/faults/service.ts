import { prisma } from '@/server/db'
import { getSettingValue } from '@/server/modules/settings/service'
import { getEmbedding, cosineSimilarity } from '@/server/modules/ai/embedding'
import { AIGateway } from '@/server/modules/ai/gateway'
import type {
  CreateFaultReportInput,
  TransitionInput,
  RepairFaultReportInput,
  DeferFaultReportInput,
  ReopenFaultReportInput,
} from '@/lib/zod/faults'
import type { TicketPriority, FaultStatus, FaultLogAction } from '@/generated/prisma/client'

// Helper: Convert float array to Buffer for SQLite Bytes
function embeddingToBuffer(embedding: number[]): Buffer {
  const floatArray = new Float32Array(embedding)
  return Buffer.from(floatArray.buffer)
}

// Helper: Convert Buffer from SQLite Bytes to float array
function bufferToEmbedding(buffer: Buffer): number[] {
  const floatArray = new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
  )
  return Array.from(floatArray)
}

/**
 * Calculates the SLA due time based on the category (review or repair), priority, and starting time.
 */
export async function calculateSlaDueTime(
  type: 'review' | 'repair',
  priority: TicketPriority,
  startTime: Date
): Promise<Date> {
  const defaultHours =
    type === 'review'
      ? { critical: 1, high: 4, medium: 12, low: 24 }
      : { critical: 4, high: 24, medium: 72, low: 168 }

  const configKey = type === 'review' ? 'faults.sla.review.hours' : 'faults.sla.repair.hours'
  const config = await getSettingValue<Record<string, number>>(configKey, defaultHours)

  const hours = config[priority] ?? defaultHours[priority] ?? 12
  const due = new Date(startTime)
  due.setMilliseconds(due.getMilliseconds() + hours * 60 * 60 * 1000)
  return due
}

/**
 * Recurrence detection for a new fault.
 * Checks if the same train had the same fault code closed within `windowDays`.
 */
export async function detectRecurrence(
  trainId: string,
  faultCodeId: string,
  occurredAt: Date,
  tx?: any,
  windowDays?: number
): Promise<{ recurrenceOfId: string | null; count: number }> {
  const wDays = windowDays !== undefined ? windowDays : await getSettingValue<number>('faults.recurrence.windowDays', 30)
  const windowStart = new Date(occurredAt)
  windowStart.setDate(windowStart.getDate() - wDays)

  const client = tx || prisma
  // Find closed reports on this train with the same code in the window
  const pastReports = await client.faultReport.findMany({
    where: {
      trainId,
      faultCodeId,
      status: 'verified_closed',
      closedAt: {
        gte: windowStart,
        lte: occurredAt,
      },
    },
    orderBy: { occurredAt: 'desc' },
  })

  if (pastReports.length === 0) {
    return { recurrenceOfId: null, count: 0 }
  }

  return {
    recurrenceOfId: pastReports[0].id,
    count: pastReports.length,
  }
}

/**
 * Matches a natural language description to fault codes in the catalog.
 * Uses a 3-layer matching approach:
 * 1. Keywords & Aliases
 * 2. Local Semantic Search (Cosine Similarity)
 * 3. AI Gateway (LLM) Routing
 */
export async function matchFaultCode(text: string): Promise<
  Array<{
    faultCodeId: string
    code: string
    title: string
    confidence: number
    source: 'keyword' | 'semantic' | 'llm'
    reason?: string
  }>
> {
  if (!text || !text.trim()) return []

  const activeCodes = await prisma.faultCode.findMany({
    where: { isActive: true },
    include: { category: true },
  })

  const normalizedInput = text.toLowerCase()
  const results: Array<{
    faultCodeId: string
    code: string
    title: string
    confidence: number
    source: 'keyword' | 'semantic' | 'llm'
    reason?: string
    score: number
  }> = []

  // ── Layer 1: Keyword and Alias matching ──
  for (const fc of activeCodes) {
    let matched = false
    let score = 0

    // Check code or title contains
    if (normalizedInput.includes(fc.code.toLowerCase()) || normalizedInput.includes(fc.title.toLowerCase())) {
      matched = true
      score = 0.95
    }

    // Check keywords
    if (fc.keywords) {
      const kws = fc.keywords.split(',').map((k) => k.trim().toLowerCase())
      const matchedKws = kws.filter((kw) => kw && normalizedInput.includes(kw))
      if (matchedKws.length > 0) {
        matched = true
        score = Math.max(score, 0.7 + 0.05 * matchedKws.length)
      }
    }

    // Check aliases
    if (fc.aliases) {
      const als = fc.aliases.split('|').map((a) => a.trim().toLowerCase())
      const matchedAls = als.filter((al) => al && normalizedInput.includes(al))
      if (matchedAls.length > 0) {
        matched = true
        score = Math.max(score, 0.85)
      }
    }

    if (matched) {
      results.push({
        faultCodeId: fc.id,
        code: fc.code,
        title: fc.title,
        confidence: Math.round(score * 100),
        source: 'keyword',
        score,
      })
    }
  }

  // Sort keywords matching by score desc
  results.sort((a, b) => b.score - a.score)
  if (results.length > 0 && results[0].score >= 0.85) {
    return results.slice(0, 3)
  }

  // ── Layer 2: Local Semantic Search (Cosine Similarity) ──
  try {
    const inputEmbedding = await getEmbedding(text)
    const semanticResults: typeof results = []

    for (const fc of activeCodes) {
      if (!fc.embedding) continue
      const codeVec = bufferToEmbedding(fc.embedding as Buffer)
      const sim = cosineSimilarity(inputEmbedding, codeVec)

      if (sim >= 0.45) {
        semanticResults.push({
          faultCodeId: fc.id,
          code: fc.code,
          title: fc.title,
          confidence: Math.round(sim * 100),
          source: 'semantic',
          score: sim,
        })
      }
    }

    semanticResults.sort((a, b) => b.score - a.score)
    
    // Merge results, preferring higher scores
    const mergedMap = new Map<string, typeof results[0]>()
    for (const r of [...results, ...semanticResults]) {
      const existing = mergedMap.get(r.faultCodeId)
      if (!existing || existing.score < r.score) {
        mergedMap.set(r.faultCodeId, r)
      }
    }

    const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.score - a.score)
    if (mergedList.length > 0 && mergedList[0].score >= 0.55) {
      return mergedList.slice(0, 3)
    }

    // ── Layer 3: AI Gateway (LLM) ──
    const top20Codes = mergedList.length > 0 
      ? mergedList.slice(0, 20) 
      : activeCodes.slice(0, 20).map(c => ({
          faultCodeId: c.id,
          code: c.code,
          title: c.title,
          confidence: 50,
          source: 'semantic' as const,
          score: 0.5
        }))

    const codesListPrompt = top20Codes
      .map((c) => `- کد: ${c.code} | عنوان: ${c.title}`)
      .join('\n')

    const prompt = `بر اساس شرح زیر از خرابی قطار مترو، و لیست کدهای خطای پیشنهادی کاتالوگ، ۳ مورد از مناسب‌ترین کدهای خطا را با دلیل انتخاب کن.
شرح خرابی: "${text}"

کدهای پیشنهادی کاتالوگ:
${codesListPrompt}

فرمت پاسخ باید دقیقاً یک آرایه معتبر JSON به شکل زیر باشد (هیچ توضیح اضافی، متن مقدمه، مؤخره، یا مارک‌داون \`\`\`json و غیره ننویس. فقط و فقط آرایه خام JSON را برگردان):
[
  { "code": "کد خطا مثلا DRS-004", "reason": "علت انتخاب کوتاه به فارسی" }
]`

    const aiResponse = await AIGateway.routeRequest(prompt)
    if (aiResponse && aiResponse.text) {
      // Parse clean JSON
      let jsonStr = aiResponse.text.trim()
      // Strip markdown code block wrappers if any
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```$/, '').trim()
      }

      const parsedLlm = JSON.parse(jsonStr)
      if (Array.isArray(parsedLlm)) {
        const llmResults: typeof results = []
        for (const item of parsedLlm) {
          const matchedCode = activeCodes.find((c) => c.code === item.code)
          if (matchedCode) {
            llmResults.push({
              faultCodeId: matchedCode.id,
              code: matchedCode.code,
              title: matchedCode.title,
              confidence: 90, // high confidence from LLM
              source: 'llm',
              reason: item.reason,
              score: 0.9,
            })
          }
        }
        if (llmResults.length > 0) {
          return llmResults.slice(0, 3)
        }
      }
    }
  } catch (err) {
    console.error('[Fault Matching] Semantic/LLM matching failed:', err)
  }

  // Fallback to top keyword matches or empty list
  return results.slice(0, 3)
}

/**
 * Creates a new fault report. Runs in transaction for safe sequential F-numbering.
 */
export async function createFaultReport(data: CreateFaultReportInput, reporterId: string) {
  // Pre-fetch settings outside the transaction to avoid database deadlocks in SQLite
  const windowDays = await getSettingValue<number>('faults.recurrence.windowDays', 30)
  const defaultHours = { critical: 1, high: 4, medium: 12, low: 24 }
  const reviewSlaConfig = await getSettingValue<Record<string, number>>('faults.sla.review.hours', defaultHours)

  return await prisma.$transaction(async (tx) => {
    // 1. Programmatic unique F-numbering (SQLite safe autoincrement)
    const lastReport = await tx.faultReport.findFirst({
      orderBy: { faultNo: 'desc' },
      select: { faultNo: true },
    })
    const faultNo = lastReport ? lastReport.faultNo + 1 : 1001

    // 2. Fetch default priority from fault code
    const faultCode = await tx.faultCode.findUnique({
      where: { id: data.faultCodeId },
    })
    if (!faultCode) throw new Error('کد خطای انتخاب‌شده یافت نشد.')

    // 3. Check recurrence
    const recurrence = await detectRecurrence(data.trainId, data.faultCodeId, data.occurredAt, tx, windowDays)
    
    // Determine priority (escalate by 1 level if recurrence count >= 2)
    let priority: TicketPriority = data.priority || (faultCode.defaultPriority as TicketPriority)
    if (!data.priority && recurrence.count >= 2) {
      if (priority === 'low') priority = 'medium'
      else if (priority === 'medium') priority = 'high'
      else if (priority === 'high' || priority === 'critical') priority = 'critical'
    }

    // 4. Calculate SLA due time for review using pre-fetched config
    const hours = reviewSlaConfig[priority] ?? defaultHours[priority] ?? 12
    const slaDueAt = new Date(data.occurredAt)
    slaDueAt.setMilliseconds(slaDueAt.getMilliseconds() + hours * 60 * 60 * 1000)

    // 5. Create report
    const report = await tx.faultReport.create({
      data: {
        faultNo,
        trainId: data.trainId,
        wagonId: data.wagonId || null,
        faultCodeId: data.faultCodeId,
        status: 'submitted',
        priority,
        reporterId,
        description: data.description,
        locationNote: data.locationNote || null,
        occurredAt: data.occurredAt,
        serviceImpact: data.serviceImpact || 'none',
        photoUrls: (data.photoUrls as any) || undefined,
        annotations: (data.annotations as any) || undefined,
        recurrenceOfId: recurrence.recurrenceOfId,
        slaDueAt,
      },
      include: {
        train: true,
        wagon: true,
        faultCode: true,
        reporter: { select: { id: true, name: true } },
      },
    })

    // 6. Log event
    const recurrenceNote = recurrence.count > 0 
      ? ` [تشخیص فالت تکراری: ${recurrence.count} تکرار قبلی در ۳۰ روز اخیر]` 
      : ''
    
    await tx.faultLog.create({
      data: {
        faultId: report.id,
        actorId: reporterId,
        action: 'created',
        toStatus: 'submitted',
        note: `ثبت اولیه گزارش خرابی${recurrenceNote}. شرح: ${data.description}`,
      },
    })

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: reporterId,
        entity: 'FaultReport',
        entityId: report.id,
        action: 'create',
        after: { faultNo, trainId: data.trainId, faultCodeId: data.faultCodeId, priority },
      },
    })

    return report
  })
}

/**
 * Execute status transitions with permission guards, validation, and history logs.
 */
export async function executeWorkflowTransition(
  faultId: string,
  action: TransitionInput['action'],
  actorId: string,
  actorRoleKey: string,
  actorRank: number,
  payload?: any
) {
  // Pre-fetch settings outside the transaction to avoid database deadlocks in SQLite
  const autoAssignMapping = await getSettingValue<Record<string, string>>('faults.autoAssign.byCategory', {})
  const defaultHours = { critical: 4, high: 24, medium: 72, low: 168 }
  const repairSlaConfig = await getSettingValue<Record<string, number>>('faults.sla.repair.hours', defaultHours)
  const requireVerify = await getSettingValue<boolean>('faults.workflow.requireFinalVerification', true)

  return await prisma.$transaction(async (tx) => {
    const report = await tx.faultReport.findUnique({
      where: { id: faultId },
      include: { faultCode: true },
    })

    if (!report) throw new Error('گزارش فالت یافت نشد')

    const oldStatus = report.status
    let newStatus: FaultStatus = oldStatus
    let logAction: FaultLogAction = 'status_changed'
    let logNote = ''
    const updateData: Record<string, any> = {}

    // Transition Guards and State Machine logic
    switch (action) {
      case 'approve': {
        // Operator registers, supervisor reviews
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'supervisor' && actorRoleKey !== 'shift_lead') {
          throw new Error('شما دسترسی بازبینی و تایید فالت را ندارید.')
        }
        if (oldStatus !== 'submitted' && oldStatus !== 'under_review') {
          throw new Error('فالت در وضعیت مناسب جهت تایید نیست.')
        }

        newStatus = 'approved'
        updateData.reviewerId = actorId
        updateData.reviewedAt = new Date()

        if (payload?.priority) {
          updateData.priority = payload.priority
        }
        if (payload?.reviewNote) {
          updateData.reviewNote = payload.reviewNote
        }
        
        // Auto-assign based on setting category mapping
        const targetRoleKey = autoAssignMapping[report.faultCode.code.split('-')[0]] || 'expert'
        
        // Find a user with this role key
        const assignee = await tx.user.findFirst({
          where: { role: { key: targetRoleKey } },
          select: { id: true },
        })
        if (assignee) {
          updateData.assigneeId = assignee.id
          logNote = `تایید و تخصیص خودکار به پرسنل فنی (${targetRoleKey})`
        } else if (payload?.assigneeId) {
          updateData.assigneeId = payload.assigneeId
          logNote = 'تایید فالت و ارجاع به کارشناس تعمیرات'
        } else {
          logNote = 'تایید فالت و قرار گرفتن در صف ارجاع کار'
        }

        // Calculate SLA for repair using pre-fetched config
        const targetPriority = (updateData.priority || report.priority) as TicketPriority
        const hours = repairSlaConfig[targetPriority] ?? defaultHours[targetPriority] ?? 72
        const slaDueAt = new Date()
        slaDueAt.setMilliseconds(slaDueAt.getMilliseconds() + hours * 60 * 60 * 1000)
        updateData.slaDueAt = slaDueAt
        updateData.slaBreached = false
        break
      }

      case 'reject': {
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'supervisor' && actorRoleKey !== 'shift_lead') {
          throw new Error('شما دسترسی رد کردن فالت را ندارید.')
        }
        if (oldStatus !== 'submitted' && oldStatus !== 'under_review') {
          throw new Error('فالت در وضعیت مناسب جهت رد کردن نیست.')
        }

        newStatus = 'rejected'
        updateData.reviewerId = actorId
        updateData.reviewedAt = new Date()
        updateData.closedAt = new Date()
        updateData.reviewNote = payload?.reviewNote || 'رد فالت نامعتبر یا تکراری'
        logNote = `گزارش فالت رد شد. دلیل: ${updateData.reviewNote}`
        break
      }

      case 'needs_info': {
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'supervisor' && actorRoleKey !== 'shift_lead') {
          throw new Error('شما دسترسی به ثبت بازخورد نیاز به اطلاعات ندارید.')
        }
        if (oldStatus !== 'submitted' && oldStatus !== 'under_review') {
          throw new Error('فالت در وضعیت مناسب جهت نیاز به اطلاعات نیست.')
        }

        newStatus = 'needs_info'
        updateData.reviewNote = payload?.reviewNote || 'نیاز به تکمیل اطلاعات راهبر'
        logNote = `برگشت جهت تکمیل اطلاعات. یادداشت سرشیفت: ${updateData.reviewNote}`
        break
      }

      case 'resolve_info': {
        // Operator completed info
        if (actorId !== report.reporterId && actorRank < 1) {
          throw new Error('فقط راهبر ثبت‌کننده می‌تواند اطلاعات فالت را تکمیل کند.')
        }
        if (oldStatus !== 'needs_info') {
          throw new Error('فالت در وضعیت نیاز به اطلاعات نیست.')
        }

        newStatus = 'under_review'
        logNote = 'اطلاعات توسط ثبت‌کننده تکمیل شد و مجدداً جهت بررسی ارسال گردید.'
        break
      }

      case 'start_repair': {
        // Maintenance specialist starts repair
        if (oldStatus !== 'approved' && oldStatus !== 'deferred') {
          throw new Error('عملیات تعمیر فقط روی فالت‌های تایید شده یا ماندگار مجاز است.')
        }

        newStatus = 'in_repair'
        updateData.assigneeId = actorId
        updateData.repairStartAt = new Date()
        logAction = 'assigned'
        logNote = 'کارشناس تعمیرات شروع به رفع خرابی قطار کرد.'
        break
      }

      case 'complete_repair': {
        // Maintenance specialist completes repair
        if (oldStatus !== 'in_repair') {
          throw new Error('جهت ثبت اقدامات ابتدا باید تعمیر فالت را شروع کنید.')
        }

        const repairPayload = payload as RepairFaultReportInput
        if (!repairPayload.actionsTaken || !repairPayload.rootCause) {
          throw new Error('ثبت اقدامات انجام‌شده و علت ریشه‌ای خرابی الزامی است.')
        }

        newStatus = 'repaired'
        updateData.repairEndAt = new Date()
        updateData.actionsTaken = repairPayload.actionsTaken
        updateData.rootCause = repairPayload.rootCause
        updateData.partsUsed = (repairPayload.partsUsed || []) as any
        logNote = `ثبت اقدامات فنی و اعلام رفع خرابی. علت ریشه‌ای: ${repairPayload.rootCause}`

        // Check if final verification is required using pre-fetched config
        if (!requireVerify) {
          newStatus = 'verified_closed'
          updateData.verifierId = actorId
          updateData.verifiedAt = new Date()
          updateData.closedAt = new Date()
          logNote += ' (تایید خودکار و بستن فالت بر اساس تنظیمات سیستم)'
        }
        break
      }

      case 'verify': {
        // Supervisor/Manager verify closure
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'supervisor' && actorRoleKey !== 'manager') {
          throw new Error('شما دسترسی تایید نهایی و بستن فالت را ندارید.')
        }
        if (oldStatus !== 'repaired') {
          throw new Error('فالت ابتدا باید در وضعیت رفع‌شده باشد.')
        }

        newStatus = 'verified_closed'
        updateData.verifierId = actorId
        updateData.verifiedAt = new Date()
        updateData.closedAt = new Date()
        logNote = 'رفع خرابی تایید شد و فالت قطار رسماً بسته گردید.'
        break
      }

      case 'defer': {
        // Manager defers technical issues
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'manager') {
          throw new Error('فقط مدیر سامانه دسترسی ماندگار کردن فالت را دارد.')
        }
        if (oldStatus !== 'in_repair' && oldStatus !== 'approved') {
          throw new Error('فالت فقط در مراحل کار کارشناسی و تایید شده می‌تواند ماندگار شود.')
        }

        // Safety-critical check
        if (report.faultCode.safetyCritical && actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin') {
          throw new Error('خرابی‌های ایمنی‌محور مجاز به ثبت به عنوان فالت ماندگار نیستند مگر با مجوز مدیر ارشد.')
        }

        const deferPayload = payload as DeferFaultReportInput
        if (!deferPayload.deferReason || !deferPayload.deferUntil) {
          throw new Error('ثبت دلیل ماندگاری و تاریخ سررسید الزامی است.')
        }

        newStatus = 'deferred'
        logAction = 'deferred'
        updateData.deferReason = deferPayload.deferReason
        updateData.deferUntil = deferPayload.deferUntil
        logNote = `فالت قطار ماندگار شد. دلیل: ${deferPayload.deferReason} | مهلت بازبینی: ${new Date(deferPayload.deferUntil).toLocaleDateString('fa-IR')}`
        break
      }

      case 'reopen': {
        if (actorRoleKey !== 'super_admin' && actorRoleKey !== 'admin' && actorRoleKey !== 'supervisor') {
          throw new Error('شما دسترسی بازگشایی فالت را ندارید.')
        }
        if (oldStatus !== 'verified_closed' && oldStatus !== 'rejected') {
          throw new Error('فقط فالت‌های بسته شده یا رد شده قابلیت بازگشایی دارند.')
        }

        // Verify within 30 days of closure
        const closedAt = report.closedAt || report.reviewedAt || new Date()
        const daysSinceClosed = (Date.now() - closedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceClosed > 30) {
          throw new Error('فالت‌هایی که از تاریخ بسته‌شدن آن‌ها بیش از ۳۰ روز گذشته است قابل بازگشایی نیستند. باید فالت جدید ثبت شود.')
        }

        newStatus = 'reopened'
        logAction = 'reopened'
        logNote = `فالت قطار بازگشایی شد. دلیل: ${payload?.note || 'بازگشایی مجدد'}`
        break
      }

      default:
        throw new Error('گذار نامعتبر است.')
    }

    // Apply updates to DB
    const updatedReport = await tx.faultReport.update({
      where: { id: faultId },
      data: {
        status: newStatus,
        ...updateData,
      },
      include: {
        train: true,
        wagon: true,
        faultCode: true,
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    })

    // Log the event in FaultLog
    await tx.faultLog.create({
      data: {
        faultId,
        actorId,
        action: logAction,
        fromStatus: oldStatus,
        toStatus: newStatus,
        note: logNote,
        changes: payload || undefined,
      },
    })

    // Audit trail
    await tx.auditLog.create({
      data: {
        actorId,
        entity: 'FaultReport',
        entityId: faultId,
        action: 'update',
        before: { status: oldStatus },
        after: { status: newStatus },
      },
    })

    return updatedReport
  })
}

/**
 * Checks for breached SLAs and logs them.
 */
export async function checkBreachedSlas() {
  const now = new Date()
  const openReports = await prisma.faultReport.findMany({
    where: {
      status: {
        in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info'],
      },
      slaDueAt: { lte: now },
      slaBreached: false,
    },
  })

  for (const report of openReports) {
    await prisma.$transaction(async (tx) => {
      await tx.faultReport.update({
        where: { id: report.id },
        data: { slaBreached: true },
      })

      await tx.faultLog.create({
        data: {
          faultId: report.id,
          actorId: 'system',
          action: 'sla_breached',
          note: `نقض مهلت زمانی SLA در وضعیت جاری (${report.status}) رخ داده است.`,
        },
      })
    })
  }
}
