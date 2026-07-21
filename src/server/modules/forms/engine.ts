import { prisma } from '@/server/db'
import type { FormField, FormWorkflow, FormAccess } from '@/lib/zod/forms'
import dayjs from 'dayjs'

/**
 * ارزیابی فیلدهای محاسباتی (Formula) به صورت امن
 */
export function evaluateFormula(formula: string, data: Record<string, any>): number {
  try {
    // جایگزینی نام فیلدها با مقادیر واقعی عددی
    let expression = formula
    const fieldPattern = /\[([a-zA-Z0-9_-]+)\]/g
    let match
    while ((match = fieldPattern.exec(formula)) !== null) {
      const fieldName = match[1]
      const val = Number(data[fieldName] ?? 0)
      expression = expression.replace(match[0], String(val))
    }

    // پاکسازی برای جلوگیری از تزریق کد مخرب - فقط کاراکترهای ریاضی و عددی مجازند
    expression = expression.replace(/[^0-9+\-*/().\s]/g, '')

    // ارزیابی ایمن ریاضی
    const fn = new Function(`return (${expression})`)
    const result = fn()
    return isNaN(result) || !isFinite(result) ? 0 : result
  } catch (err) {
    console.error('[Formula Evaluator] Failed to evaluate formula:', formula, err)
    return 0
  }
}

/**
 * اعتبارسنجی مقادیر فیلدهای ارسالی بر اساس طرح‌واره قالب فرم
 */
export function validateSubmissionData(fields: FormField[], data: Record<string, any>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const val = data[field.name]

    // ۱. بررسی الزامی بودن
    if (field.required) {
      if (val === undefined || val === null || val === '') {
        errors[field.name] = `پر کردن فیلد «${field.label}» الزامی است.`
        continue
      }
      if (Array.isArray(val) && val.length === 0) {
        errors[field.name] = `انتخاب حداقل یک مورد در «${field.label}» الزامی است.`
        continue
      }
    }

    // اگر خالی باشد و الزامی نباشد، نیازی به اعتبارسنجی‌های دیگر ندارد
    if (val === undefined || val === null || val === '') {
      continue
    }

    // ۲. اعتبارسنجی عدد
    if (field.type === 'number') {
      const num = Number(val)
      if (isNaN(num)) {
        errors[field.name] = `مقدار فیلد «${field.label}» باید عدد باشد.`
      } else if (field.validation) {
        if (field.validation.min !== undefined && num < field.validation.min) {
          errors[field.name] = `حداقل مقدار مجاز برای «${field.label}» برابر با ${field.validation.min} است.`
        }
        if (field.validation.max !== undefined && num > field.validation.max) {
          errors[field.name] = `حداکثر مقدار مجاز برای «${field.label}» برابر با ${field.validation.max} است.`
        }
      }
    }

    // ۳. اعتبارسنجی متن
    if (field.type === 'text' || field.type === 'textarea') {
      const str = String(val)
      if (field.validation) {
        if (field.validation.maxLength !== undefined && str.length > field.validation.maxLength) {
          errors[field.name] = `طول فیلد «${field.label}» نمی‌تواند بیشتر از ${field.validation.maxLength} کاراکتر باشد.`
        }
        if (field.validation.regex) {
          try {
            const rx = new RegExp(field.validation.regex)
            if (!rx.test(str)) {
              errors[field.name] = `فرمت فیلد «${field.label}» نامعتبر است.`
            }
          } catch {
            console.warn(`[Form Engine] Invalid regex in field definition: ${field.validation.regex}`)
          }
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * ایجاد درخواست جدید در پایگاه داده
 */
export async function createFormSubmission(
  templateKey: string,
  submitterId: string,
  inputData: Record<string, any>,
  targetDateStr?: string | null,
  amount?: number | null,
  isDraft = false
) {
  return await prisma.$transaction(async (tx) => {
    // ۱. دریافت قالب فرم
    const template = await tx.formTemplate.findUnique({
      where: { key: templateKey },
      include: { versions: { where: { isActive: true }, take: 1 } },
    })

    if (!template) {
      throw new Error(`قالب فرم با کلید «${templateKey}» یافت نشد.`)
    }

    const activeVersion = template.versions[0]
    if (!activeVersion) {
      throw new Error(`هیچ نسخه فعالی برای قالب فرم «${template.title}» تعریف نشده است.`)
    }

    const schema = activeVersion.schema as any as { fields: FormField[] }
    const workflow = activeVersion.workflow as any as FormWorkflow
    const access = activeVersion.access as any as FormAccess

    // ۲. بررسی دسترسی ثبت کاربر
    const submitter = await tx.user.findUnique({
      where: { id: submitterId },
      include: { role: true },
    })

    if (!submitter) {
      throw new Error('کاربر ثبت‌کننده یافت نشد.')
    }

    if (!access.whoCanSubmit.includes('*') && !access.whoCanSubmit.includes(submitter.role.key)) {
      throw new Error('شما دسترسی ثبت این فرم را ندارید.')
    }

    // ۳. محاسبات فیلدهای فرمول قبل از ولیدیشن
    const processedData = { ...inputData }
    for (const field of schema.fields) {
      if (field.type === 'formula' && field.formula) {
        processedData[field.name] = evaluateFormula(field.formula, processedData)
      }
    }

    // ۴. اعتبارسنجی مقادیر فرم (اگر پیش‌نویس نباشد)
    if (!isDraft) {
      const validation = validateSubmissionData(schema.fields, processedData)
      if (!validation.valid) {
        throw new Error(JSON.stringify({ validationErrors: validation.errors }))
      }
    }

    // ۵. محاسبه مقدار عددی کلیدی برای گزارش‌ها
    let finalAmount = amount
    if (!finalAmount) {
      // تلاش برای خواندن از فیلد عددی کلیدی یا فیلد فرمول
      const numericField = schema.fields.find((f) => f.type === 'number' || f.type === 'formula')
      if (numericField) {
        finalAmount = Number(processedData[numericField.name] ?? 0)
      }
    }

    // ۶. شماره سریال درخواست (sequential number)
    const maxSub = await tx.formSubmission.aggregate({
      _max: { submissionNo: true },
    })
    const submissionNo = (maxSub._max.submissionNo ?? 2000) + 1

    // ۷. تعیین مرحله اولیه در صورت ثبت قطعی
    let initialStage: string | null = null
    let slaDueAt: Date | null = null
    const status = isDraft ? 'draft' : 'submitted'

    if (!isDraft) {
      const submitTransition = workflow.transitions.find((t) => !t.from && t.on === 'submit')
      if (submitTransition) {
        initialStage = submitTransition.to
        
        // اعمال قواعد شرطی (Workflow Rules)
        if (workflow.rules) {
          for (const rule of workflow.rules) {
            const fieldVal = processedData[rule.if.field]
            let conditionMet = false

            if (rule.if.operator === 'gt' && Number(fieldVal) > Number(rule.if.value)) conditionMet = true
            if (rule.if.operator === 'lt' && Number(fieldVal) < Number(rule.if.value)) conditionMet = true
            if (rule.if.operator === 'eq' && fieldVal === rule.if.value) conditionMet = true
            if (rule.if.operator === 'neq' && fieldVal !== rule.if.value) conditionMet = true

            if (conditionMet && rule.then.addStage) {
              // در این نسخه، اگر قاعده برقرار باشد، می‌توان مرحله جاری را تغییر داد یا مرحله واسط تزریق کرد
              // در اینجا اگر افزودن مرحله خاصی مد نظر بود، می‌توانیم مستقیماً به آن ارجاع دهیم
              if (initialStage === 'supervisor' && rule.then.addStage === 'manager') {
                // تزریق مرحله یا تغییر گام بعدی
              }
            }
          }
        }

        const stageDef = workflow.stages.find((s) => s.key === initialStage)
        if (stageDef?.sla) {
          slaDueAt = dayjs().add(stageDef.sla.hours, 'hours').toDate()
        }
      }
    }

    // ۸. ایجاد فرم
    const submission = await tx.formSubmission.create({
      data: {
        submissionNo,
        templateId: template.id,
        versionId: activeVersion.id,
        submitterId,
        status: status as any,
        currentStage: initialStage,
        data: processedData as any,
        targetDate: targetDateStr ? new Date(targetDateStr) : null,
        amount: finalAmount,
        slaDueAt,
      },
    })

    // ۹. ایجاد گام اول در FormApproval در صورت ثبت قطعی
    if (!isDraft && initialStage) {
      const stageDef = workflow.stages.find((s) => s.key === initialStage)!
      await tx.formApproval.create({
        data: {
          submissionId: submission.id,
          stageKey: initialStage,
          stageTitle: stageDef.title,
          assigneeId: stageDef.assignTo, // ذخیره نقش مسئول (مانند 'supervisor')
        },
      })

      // ایجاد لاگ حسابرسی ثبت
      await tx.formLog.create({
        data: {
          submissionId: submission.id,
          actorId: submitterId,
          action: 'submitted',
          toStage: initialStage,
          note: `ثبت و ارسال درخواست جدید با شماره R-${submissionNo}`,
        },
      })
    } else if (isDraft) {
      // لاگ پیش‌نویس
      await tx.formLog.create({
        data: {
          submissionId: submission.id,
          actorId: submitterId,
          action: 'draft',
          note: 'ایجاد پیش‌نویس اولیه درخواست',
        },
      })
    }

    return submission
  })
}

/**
 * اجرای یکی از گذارهای گردش‌کار تایید (Approve, Reject, Refer, Request Changes)
 */
export async function executeWorkflowAction(
  submissionId: string,
  actorId: string,
  actionInput: { decision: 'approve' | 'reject' | 'request_changes' | 'refer'; note?: string; referTo?: string }
) {
  return await prisma.$transaction(async (tx) => {
    const submission = await tx.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        template: true,
        version: true,
        submitter: { include: { role: true } },
      },
    })

    if (!submission) {
      throw new Error('درخواست مورد نظر یافت نشد.')
    }

    const workflow = submission.version.workflow as any as FormWorkflow
    const currentStageKey = submission.currentStage

    if (!currentStageKey) {
      throw new Error('این درخواست در هیچ مرحله فعالی از گردش‌کار قرار ندارد.')
    }

    // ۱. بررسی دسترسی مسئول بررسی
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      include: { role: true },
    })

    if (!actor) {
      throw new Error('بررسی‌کننده یافت نشد.')
    }

    const stageDef = workflow.stages.find((s) => s.key === currentStageKey)
    if (!stageDef) {
      throw new Error('پیکربندی مرحله جاری گردش‌کار یافت نشد.')
    }

    // بررسی انطباق نقش کاربری با نقش منتسب به مرحله
    const isAssigned = stageDef.assignTo === actor.role.key || stageDef.assignTo === actorId
    const isReferral = currentStageKey.endsWith('-refer')
    
    // اگر نقش مدیر ارشد باشد، دسترسی جامع دارد
    const hasAdminAccess = actor.role.key === 'super_admin' || actor.role.key === 'admin'

    if (!isAssigned && !isReferral && !hasAdminAccess) {
      throw new Error('شما مجاز به انجام عملیات روی این مرحله از درخواست نیستید.')
    }

    const { decision, note, referTo } = actionInput

    // ۲. به‌روزرسانی وضعیت مرحله جاری در FormApproval
    const pendingApproval = await tx.formApproval.findFirst({
      where: {
        submissionId,
        stageKey: currentStageKey,
        decision: null,
      },
    })

    if (pendingApproval) {
      await tx.formApproval.update({
        where: { id: pendingApproval.id },
        data: {
          decision,
          note,
          decidedById: actorId,
          decidedAt: new Date(),
        },
      })
    }

    let nextStageKey: string | null = null
    let newStatus = submission.status

    if (decision === 'refer') {
      if (!referTo) {
        throw new Error('انتخاب نقش یا پرسنل جهت ارجاع الزامی است.')
      }

      // ایجاد مرحله واسط ارجاع
      nextStageKey = `${currentStageKey}-refer`
      await tx.formApproval.create({
        data: {
          submissionId,
          stageKey: nextStageKey,
          stageTitle: `ارجاع از مرحله ${stageDef.title}`,
          assigneeId: referTo,
        },
      })

      // ثبت لاگ ارجاع
      await tx.formLog.create({
        data: {
          submissionId,
          actorId,
          action: 'referred',
          fromStage: currentStageKey,
          toStage: nextStageKey,
          note: `ارجاع پرونده به «${referTo}» جهت بررسی و بازخورد. توضیح: ${note || ''}`,
        },
      })
    } else if (isReferral && decision === 'approve') {
      // بازگشت از ارجاع به مرحله اصلی
      const originalStageKey = currentStageKey.replace('-refer', '')
      nextStageKey = originalStageKey

      const origStageDef = workflow.stages.find((s) => s.key === originalStageKey)!
      await tx.formApproval.create({
        data: {
          submissionId,
          stageKey: originalStageKey,
          stageTitle: origStageDef.title,
          assigneeId: origStageDef.assignTo,
        },
      })

      await tx.formLog.create({
        data: {
          submissionId,
          actorId,
          action: 'commented',
          fromStage: currentStageKey,
          toStage: originalStageKey,
          note: `پاسخ به ارجاع و بازگرداندن پرونده به کارتابل اصلی. دیدگاه: ${note || ''}`,
        },
      })
    } else {
      // ۳. تشخیص مرحله بعدی بر اساس گذارهای تعریف شده
      const transition = workflow.transitions.find(
        (t) => t.from === currentStageKey && t.on === decision
      )

      if (!transition) {
        throw new Error(`گذری برای عمل «${decision}» در مرحله «${currentStageKey}» یافت نشد.`)
      }

      const target = transition.to

      if (target === 'END_APPROVED') {
        newStatus = 'approved'
        nextStageKey = null
      } else if (target === 'END_REJECTED') {
        newStatus = 'rejected'
        nextStageKey = null
      } else if (target === 'BACK_TO_SUBMITTER') {
        newStatus = 'needs_changes'
        nextStageKey = null
      } else {
        // رفتن به مرحله بعدی
        nextStageKey = target
        newStatus = 'in_review'
      }

      // اعمال قوانین داینامیک شرطی برای بررسی مراحل بعدی (مثال: اگر فیلدی برقرار بود، مرحله مدیرStation واسط اضافه شود)
      if (nextStageKey && workflow.rules) {
        const formData = submission.data as Record<string, any>
        for (const rule of workflow.rules) {
          const fieldVal = formData[rule.if.field]
          let conditionMet = false

          if (rule.if.operator === 'gt' && Number(fieldVal) > Number(rule.if.value)) conditionMet = true
          if (rule.if.operator === 'lt' && Number(fieldVal) < Number(rule.if.value)) conditionMet = true
          if (rule.if.operator === 'eq' && fieldVal === rule.if.value) conditionMet = true
          if (rule.if.operator === 'neq' && fieldVal !== rule.if.value) conditionMet = true

          if (conditionMet && rule.then.addStage && nextStageKey === 'hr') {
            // تزریق مرحله واسط پیش از HR
            nextStageKey = rule.then.addStage
          }
        }
      }

      // ایجاد لاگ
      await tx.formLog.create({
        data: {
          submissionId,
          actorId,
          action: decision,
          fromStage: currentStageKey,
          toStage: nextStageKey,
          note: note || `اقدام تایید/تغییر در گردشکار (${decision})`,
        },
      })

      // ایجاد گام جدید یا بستن نهایی درخواست
      if (nextStageKey) {
        const nextStageDef = workflow.stages.find((s) => s.key === nextStageKey)!
        let newSlaDueAt: Date | null = null
        if (nextStageDef.sla) {
          newSlaDueAt = dayjs().add(nextStageDef.sla.hours, 'hours').toDate()
        }

        await tx.formApproval.create({
          data: {
            submissionId,
            stageKey: nextStageKey,
            stageTitle: nextStageDef.title,
            assigneeId: nextStageDef.assignTo,
          },
        })

        await tx.formSubmission.update({
          where: { id: submissionId },
          data: {
            status: newStatus as any,
            currentStage: nextStageKey,
            slaDueAt: newSlaDueAt,
          },
        })
      } else {
        // بستن و بایگانی درخواست
        await tx.formSubmission.update({
          where: { id: submissionId },
          data: {
            status: newStatus as any,
            currentStage: null,
            slaDueAt: null,
            closedAt: new Date(),
          },
        })
      }
    }

    return await tx.formSubmission.findUnique({
      where: { id: submissionId },
      include: { steps: true, logs: true },
    })
  })
}
