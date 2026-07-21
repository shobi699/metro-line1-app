import { prisma } from '@/server/db'

import { chatBus } from '@/server/realtime/bus'

// Ensure registries are initialized
import { PusheDriver } from './drivers/pushe'
import { NajvaDriver } from './drivers/najva'
import { SelfHostedDriver } from './drivers/selfhosted'
import { KavenegarDriver, MeliPayamakDriver, SmsIrDriver } from './drivers/sms'

if (!(globalThis as any).pushDrivers) {
  (globalThis as any).pushDrivers = {
    pushe: new PusheDriver(),
    najva: new NajvaDriver(),
    selfhosted: new SelfHostedDriver(),
  }
}

if (!(globalThis as any).smsDrivers) {
  (globalThis as any).smsDrivers = {
    kavenegar: new KavenegarDriver(),
    melipayamak: new MeliPayamakDriver(),
    smsir: new SmsIrDriver(),
  }
}

export const pushDrivers = (globalThis as any).pushDrivers as {
  pushe: PusheDriver
  najva: NajvaDriver
  selfhosted: SelfHostedDriver
}

export const smsDrivers = (globalThis as any).smsDrivers as {
  kavenegar: KavenegarDriver
  melipayamak: MeliPayamakDriver
  smsir: SmsIrDriver
}

/**
 * Render templates by replacing {variable} with provided values
 */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  let result = text
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), val)
  }
  return result
}

/**
 * Determine if current local time is in quiet hours.
 * If user works night shift today, bypass quiet hours.
 */
export function isInQuietHours(
  quietHours: { from: string; to: string } | null,
  hasNightShiftToday: boolean
): boolean {
  if (!quietHours) return false
  if (hasNightShiftToday) return false // Night shift workers bypass quiet hours

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [fromH, fromM] = quietHours.from.split(':').map(Number)
  const [toH, toM] = quietHours.to.split(':').map(Number)
  const fromTime = fromH * 60 + fromM
  const toTime = toH * 60 + toM

  if (fromTime <= toTime) {
    return currentTime >= fromTime && currentTime <= toTime
  } else {
    return currentTime >= fromTime || currentTime <= toTime
  }
}

/**
 * Single entry point to trigger an event notification
 */
export async function notifyEvent(
  eventKey: string,
  audienceOverride?: string[] | null,
  vars: Record<string, string> = {}
): Promise<void> {
  // 1. Fetch template & rule
  let template = await prisma.notificationTemplate.findUnique({ where: { eventKey } })
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        eventKey,
        title: `اطلاعیه رویداد ${eventKey}`,
        body: `جزئیات رویداد ${eventKey} ثبت گردید.`,
        smsText: `رویداد ${eventKey} رخ داد.`,
      },
    })
  }

  if (!template.isActive) return

  let rule = await prisma.notificationRule.findUnique({ where: { eventKey } })
  if (!rule) {
    rule = await prisma.notificationRule.create({
      data: {
        eventKey,
        severity: 'normal',
        channels: ['inapp', 'push'],
        respectQuietHours: true,
      },
    })
  }

  if (!rule.isActive) return

  // 2. Resolve audience
  let targetUserIds: string[] = []
  if (audienceOverride && audienceOverride.length > 0) {
    targetUserIds = audienceOverride
  } else {
    const ruleAudience = rule.audience as string[] | null
    if (ruleAudience && ruleAudience.length > 0 && !ruleAudience.includes('all')) {
      // It can be roles or specific user IDs
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { id: { in: ruleAudience } },
            { role: { key: { in: ruleAudience } } },
          ],
          status: 'active',
        },
        select: { id: true },
      })
      targetUserIds = users.map((u) => u.id)
    } else {
      // Default: all active users
      const users = await prisma.user.findMany({
        where: { status: 'active' },
        select: { id: true },
      })
      targetUserIds = users.map((u) => u.id)
    }
  }

  const channels = rule.channels as string[]
  const severity = rule.severity

  // 3. Process each target user
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const userId of targetUserIds) {
    // Check user preference
    const pref = await prisma.notificationPreference.findUnique({ where: { userId } })
    const userPrefChannels = pref ? (pref.channels as Record<string, string[]>) : null
    const allowedChannels = userPrefChannels?.[eventKey] ?? channels

    // Check night shift status today
    const shift = await prisma.shift.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        code: 'night',
      },
    })
    const hasNightShiftToday = !!shift

    // Check quiet hours
    let isSleeping = false
    if (rule.respectQuietHours && severity !== 'critical') {
      const quietHours = pref?.quietHours as { from: string; to: string } | null
      isSleeping = isInQuietHours(quietHours, hasNightShiftToday)
    }

    // Render text contents
    const title = renderTemplate(template.title, vars)
    const body = renderTemplate(template.body, vars)
    const smsText = template.smsText ? renderTemplate(template.smsText, vars) : body
    const link = template.link ? renderTemplate(template.link, vars) : null

    // Dispatch channels
    for (const channel of allowedChannels) {
      if (channel === 'inapp') {
        // Create in-app notification
        const notif = await prisma.notification.create({
          data: {
            userId,
            title,
            body,
            link,
            type: severity as any,
          },
        })

        // Queue in Outbox
        await prisma.notificationOutbox.create({
          data: {
            eventKey,
            userId,
            channel: 'inapp',
            payload: { notifId: notif.id, title, body, link },
            status: 'sent',
            sentAt: new Date(),
          },
        })

        // Real-time dispatch via chatBus SSE
        chatBus.emit('notification', {
          userId,
          notification: {
            id: notif.id,
            type: severity,
            title,
            body,
            link,
            isRead: false,
            createdAt: notif.createdAt.toISOString(),
          },
        })
      }

      if (channel === 'push') {
        const outbox = await prisma.notificationOutbox.create({
          data: {
            eventKey,
            userId,
            channel: 'push',
            payload: { title, body, link, severity },
            status: isSleeping ? 'queued' : 'queued', // We queue it, then attempt immediately if not sleeping
          },
        })

        if (!isSleeping) {
          await attemptPushDelivery(outbox.id, userId, { title, body, link, severity })
        }
      }

      if (channel === 'sms') {
        const outbox = await prisma.notificationOutbox.create({
          data: {
            eventKey,
            userId,
            channel: 'sms',
            payload: { text: smsText },
            status: severity === 'critical' && rule.smsIfUnseenMinutes
              ? 'pending_unseen_sms'
              : isSleeping ? 'queued' : 'queued',
          },
        })

        // If it's not delayed/sleeping or critical backup, send now
        if (outbox.status === 'queued' && !isSleeping) {
          await attemptSmsDelivery(outbox.id, userId, smsText)
        }
      }
    }
  }
}

/**
 * Handle push delivery with Circuit Breaker and Fallback Chain
 */
export async function attemptPushDelivery(
  outboxId: string,
  userId: string,
  msg: { title: string; body: string; link?: string | null; severity?: string }
): Promise<void> {
  const devices = await prisma.notificationDevice.findMany({
    where: { userId, isActive: true },
  })

  if (devices.length === 0) {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'failed', lastError: 'No active devices registered' },
    })
    return
  }

  // Get active driver settings
  const activePushSetting = await prisma.setting.findUnique({
    where: { key: 'notification_active_push_driver' },
  })
  const preferredDriver = (activePushSetting?.value ? JSON.parse(activePushSetting.value) : 'pushe') as 'pushe' | 'najva' | 'selfhosted'

  // Get fallback chain
  const chainSetting = await prisma.setting.findUnique({
    where: { key: 'notification_push_fallback_chain' },
  })
  const fallbackChain = (chainSetting?.value
    ? JSON.parse(chainSetting.value)
    : ['pushe', 'najva', 'selfhosted']) as ('pushe' | 'najva' | 'selfhosted')[]

  // Reorder chain so preferred is first
  const orderedChain = [preferredDriver, ...fallbackChain.filter((d) => d !== preferredDriver)]

  let lastError = ''
  let success = false
  let usedDriver = ''
  let messageId = ''

  for (const driverKey of orderedChain) {
    const driver = pushDrivers[driverKey]
    if (!driver) continue

    const health = await driver.healthCheck()
    if (health.status === 'red') {
      lastError = `Skipped ${driverKey} (Circuit Breaker open)`
      continue
    }

    const targets = devices.map((d) => ({
      userId: d.userId,
      token: d.token,
      platform: d.platform,
    }))

    const report = await driver.send(
      {
        title: msg.title,
        body: msg.body,
        link: msg.link,
        severity: msg.severity as any,
      },
      targets
    )

    if (report.success) {
      success = true
      usedDriver = driverKey
      messageId = report.driverMessageId || ''
      break
    } else {
      lastError = report.error || `${driverKey} failed`
    }
  }

  if (success) {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: {
        status: 'sent',
        driver: usedDriver,
        payload: { ...msg, driverMessageId: messageId },
        sentAt: new Date(),
      },
    })
  } else {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'failed', lastError },
    })
  }
}

/**
 * Handle SMS delivery with Circuit Breaker and Fallback Chain
 */
export async function attemptSmsDelivery(outboxId: string, userId: string, text: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.phone) {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'failed', lastError: 'User phone number not found' },
    })
    return
  }

  const activeSmsSetting = await prisma.setting.findUnique({
    where: { key: 'notification_active_sms_driver' },
  })
  const preferredDriver = (activeSmsSetting?.value ? JSON.parse(activeSmsSetting.value) : 'kavenegar') as 'kavenegar' | 'melipayamak' | 'smsir'

  const chainSetting = await prisma.setting.findUnique({
    where: { key: 'notification_sms_fallback_chain' },
  })
  const fallbackChain = (chainSetting?.value
    ? JSON.parse(chainSetting.value)
    : ['kavenegar', 'melipayamak', 'smsir']) as ('kavenegar' | 'melipayamak' | 'smsir')[]

  const orderedChain = [preferredDriver, ...fallbackChain.filter((d) => d !== preferredDriver)]

  let lastError = ''
  let success = false
  let usedDriver = ''

  for (const driverKey of orderedChain) {
    const driver = smsDrivers[driverKey]
    if (!driver) continue

    const health = await driver.healthCheck()
    if (health.status === 'red') {
      lastError = `Skipped ${driverKey} (Circuit Breaker open)`
      continue
    }

    const report = await driver.send({ text, to: [user.phone] })
    if (report.success) {
      success = true
      usedDriver = driverKey
      break
    } else {
      lastError = report.error || `${driverKey} failed`
    }
  }

  if (success) {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'sent', driver: usedDriver, sentAt: new Date() },
    })
  } else {
    await prisma.notificationOutbox.update({
      where: { id: outboxId },
      data: { status: 'failed', lastError },
    })
  }
}

/**
 * Cron task simulation to process backup SMS notifications
 * that have not been seen within the N minutes window.
 */
export async function processUnseenBackupSms(): Promise<void> {
  const pendingSMS = await prisma.notificationOutbox.findMany({
    where: {
      channel: 'sms',
      status: 'pending_seen_sms',
    },
  })

  for (const outbox of pendingSMS) {
    const rule = await prisma.notificationRule.findUnique({ where: { eventKey: outbox.eventKey } })
    const waitMinutes = rule?.smsIfUnseenMinutes ?? 0

    const thresholdTime = new Date(outbox.createdAt.getTime() + waitMinutes * 60 * 1000)
    if (new Date() >= thresholdTime) {
      // Check if user has read the corresponding in-app notification
      const inappNotif = await prisma.notification.findFirst({
        where: {
          userId: outbox.userId,
          title: { contains: outbox.eventKey }, // or link matching or eventKey reference
          isRead: true,
        },
      })

      if (inappNotif) {
        // User has seen it! Cancel SMS backup
        await prisma.notificationOutbox.update({
          where: { id: outbox.id },
          data: { status: 'expired', lastError: 'Notification seen in-app; SMS canceled' },
        })
      } else {
        // User hasn't seen it! Trigger SMS immediately
        const payload = outbox.payload as Record<string, any>
        await attemptSmsDelivery(outbox.id, outbox.userId, payload?.text || '')
      }
    }
  }
}
