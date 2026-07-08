import { z } from 'zod'
import { prisma } from '@/server/db'

export const fatigueLogSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.enum(['good', 'fair', 'poor']),
  fatigueLevel: z.number().min(1).max(5),
  hasHeadacheOrColds: z.boolean(),
})

export type FatigueLogInput = z.infer<typeof fatigueLogSchema>

export async function submitFatigueLog(userId: string, data: FatigueLogInput) {
  // Compute base score
  let score = 20
  if (data.sleepHours < 6) score += 30
  else if (data.sleepHours < 8) score += 15

  if (data.sleepQuality === 'poor') score += 20
  else if (data.sleepQuality === 'fair') score += 10

  score += (data.fatigueLevel - 1) * 10
  if (data.hasHeadacheOrColds) score += 15

  const boundedScore = Math.min(score, 100)

  const log = await prisma.fatigueLog.create({
    data: {
      userId,
      sleepHours: data.sleepHours,
      sleepQuality: data.sleepQuality,
      fatigueLevel: data.fatigueLevel,
      hasHeadacheOrColds: data.hasHeadacheOrColds,
      score: boundedScore,
    },
  })

  return log
}

export async function analyzeUserFatigue(userId: string) {
  // 1. Get recent self-evaluations
  const latestLog = await prisma.fatigueLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // 2. Fetch last 7 days shifts
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentShifts = await prisma.shift.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo },
    },
    orderBy: { date: 'asc' },
  })

  let totalScore = latestLog?.score ?? 20 // Default score if no log
  const alerts = []

  // Check shift patterns
  let consecutiveDays = 0
  let nightShifts = 0

  for (let i = 0; i < recentShifts.length; i++) {
    const shift = recentShifts[i]
    if (shift.code !== 'off') {
      consecutiveDays++
    } else {
      consecutiveDays = 0
    }

    if (shift.code === 'night') {
      nightShifts++
    }
  }

  // Penalty for consecutive days
  if (consecutiveDays >= 6) {
    totalScore += 20
    alerts.push({
      id: 'w-consec',
      title: 'توالی شیفت‌های طولانی',
      desc: `شما ${consecutiveDays} روز متوالی شیفت داشته‌اید. خطر خستگی تجمیعی بالا است.`,
      severity: 'high',
    })
  } else if (consecutiveDays >= 4) {
    totalScore += 10
    alerts.push({
      id: 'w-consec-4',
      title: 'افزایش توالی شیفت‌ها',
      desc: `شما ${consecutiveDays} روز متوالی شیفت داشته‌اید. لطفا در شیفت‌های بعدی مراقب سلامت خود باشید.`,
      severity: 'medium',
    })
  }

  // Penalty for too many night shifts in a week
  if (nightShifts >= 3) {
    totalScore += 15
    alerts.push({
      id: 'w-night',
      title: 'توالی شیفت‌های شبانه',
      desc: `شما در ۷ روز گذشته ${nightShifts} شیفت شب داشته‌اید. الگوهای خواب نامنظم خطر انحراف از توجه سیگنالینگ را بالا می‌برد.`,
      severity: 'high',
    })
  } else if (nightShifts >= 2) {
    totalScore += 5
    alerts.push({
      id: 'w-night-2',
      title: 'شیفت‌های شبانه',
      desc: 'شیفت‌های شبانه روی کیفیت خواب اثر منفی می‌گذارند.',
      severity: 'low',
    })
  }

  totalScore = Math.min(totalScore, 100)

  return {
    score: totalScore,
    latestLog,
    alerts,
    recentShifts: recentShifts.map((s) => ({
      date: s.date.toISOString(),
      code: s.code,
    })),
  }
}
