import { prisma } from '@/server/db'
import type { Prisma } from '@/generated/prisma/client'
import { jalaliPeriodId } from '@/lib/dayjs'
import { getSettingValue } from '@/server/modules/settings/service'

// Competency IDs mapping
export const COMPETENCY_IDS = [
  'discipline',  // انضباط
  'productivity',// بهره‌وری
  'quality',     // کیفیت
  'innovation',  // نوآوری
  'teamwork',    // کار تیمی
  'compliance',  // انطباق و امنیت
]

// Current Jalali period helper (e.g. "1405-04")
export function getCurrentPeriodId(): string {
  // Safe default: return current Jalali year-month
  try {
    return jalaliPeriodId()
  } catch {
    // Fallback to Gregorian if locale not set
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
}

/**
 * 1. Log a new performance action for an employee
 */
export async function logPerformanceAction(data: {
  employeeId: string
  recordedById: string
  actionTypeId: string
  severity: 'L1' | 'L2' | 'L3'
  note?: string
  evidenceUrl?: string
}) {
  const { employeeId, recordedById, actionTypeId, severity, note, evidenceUrl } = data

  return await prisma.$transaction(async (tx) => {
    // Verify employee exists
    const employee = await tx.user.findUnique({
      where: { id: employeeId },
    })
    if (!employee) throw new Error('کارمند یافت نشد')

    // Fetch action type config
    const actionType = await tx.performanceActionType.findUnique({
      where: { id: actionTypeId },
      include: { competency: true },
    })
    if (!actionType) throw new Error('نوع عملکرد یافت نشد')

    // Calculate score value based on direction and severity multiplier
    // Positive actions are always defaultScore. Negative actions are scaled by severity multiplier (L1=1, L2=2, L3=3).
    let scoreValue = actionType.defaultScore
    if (actionType.competency.direction === 'negative' || (actionType.defaultScore < 0)) {
      const multiplier = severity === 'L2' ? 2.0 : severity === 'L3' ? 3.0 : 1.0
      scoreValue = -1 * Math.abs(actionType.defaultScore * multiplier)
    }

    const periodId = getCurrentPeriodId()

    // Create the performance log
    const log = await tx.performanceLog.create({
      data: {
        employeeId,
        recordedById,
        actionTypeId,
        severity,
        scoreValue,
        note,
        evidenceUrl,
        periodId,
        status: 'active',
      },
      include: {
        actionType: {
          include: { competency: true },
        },
        recordedBy: {
          select: { name: true },
        },
      },
    })

    // Create system audit log
    await tx.auditLog.create({
      data: {
        actorId: recordedById,
        entity: 'PerformanceLog',
        entityId: log.id,
        action: 'create',
        after: {
          employeeId,
          actionTypeId,
          severity,
          scoreValue,
          note,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return log
  })
}

/**
 * 2. Get the detailed scorecard for an employee (includes all formulas and radar data)
 */
export async function getEmployeeScorecard(employeeId: string, periodId: string) {
  const baseScore = 100.0

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      customFields: true,
      role: { select: { name: true } },
    },
  })
  if (!employee) throw new Error('کارمند یافت نشد')

  // Fetch all active performance logs for this period
  const logs = await prisma.performanceLog.findMany({
    where: {
      employeeId,
      periodId,
      status: { in: ['active', 'appealed'] },
    },
    include: {
      actionType: {
        include: { competency: true },
      },
      recordedBy: {
        select: { name: true },
      },
      appeals: {
        select: { id: true, status: true, reason: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group logs by direction
  const positiveLogs = logs.filter((l) => l.scoreValue > 0)
  const negativeLogs = logs.filter((l) => l.scoreValue < 0)

  // A. Diminishing returns calculation for positive actions:
  // Group positive logs by competency, order by score value desc, and apply W_c * sum(score / sqrt(i))
  const positiveLogsByCompetency: Record<string, typeof positiveLogs> = {}
  positiveLogs.forEach((log) => {
    const compId = log.actionType.competencyId
    if (!positiveLogsByCompetency[compId]) {
      positiveLogsByCompetency[compId] = []
    }
    positiveLogsByCompetency[compId].push(log)
  })

  // Initialize competency radar values (base 70, capped at 100)
  const competencyRadar: Record<string, number> = {
    discipline: 80,
    productivity: 80,
    quality: 80,
    innovation: 70,
    teamwork: 80,
    compliance: 100,
  }

  let totalPositiveContribution = 0
  const competencyDetails = COMPETENCY_IDS.map((compId) => {
    const compLogs = positiveLogsByCompetency[compId] || []
    // Sort descending by score
    compLogs.sort((a, b) => b.scoreValue - a.scoreValue)

    // Calculate diminishing sum: sum(score_i / sqrt(i))
    let diminishingSum = 0
    compLogs.forEach((log, idx) => {
      const i = idx + 1
      diminishingSum += log.scoreValue / Math.sqrt(i)
    })

    totalPositiveContribution += diminishingSum

    // Update radar competency values based on positive/negative logs in this period
    const compNegatives = negativeLogs.filter((l) => l.actionType.competencyId === compId)
    const negativeImpact = compNegatives.reduce((sum, l) => sum + Math.abs(l.scoreValue), 0)

    // Radar score = Base + Positives (diminished) - Negatives (multiplied by severity)
    let radarScore = competencyRadar[compId] + diminishingSum * 3 - negativeImpact * 2.5
    radarScore = Math.max(0, Math.min(100, Math.round(radarScore)))
    competencyRadar[compId] = radarScore

    return {
      competencyId: compId,
      logsCount: compLogs.length,
      rawSum: compLogs.reduce((sum, l) => sum + l.scoreValue, 0),
      diminishedSum: Math.round(diminishingSum * 10) / 10,
    }
  })

  // B. Time decay (rehabilitation) for negative actions:
  // For this period, we calculate them directly, but we apply severity factors
  const totalNegativeImpact = negativeLogs.reduce((sum, l) => sum + Math.abs(l.scoreValue), 0)

  // C. Calculate Raw Score
  const rawScoreValue = baseScore + totalPositiveContribution - totalNegativeImpact

  // D. Consistency Bonus
  // +20 if there are absolutely zero negative logs in the period
  const hasNegatives = negativeLogs.length > 0
  const consistencyBonusValue = hasNegatives ? 0 : 20

  // E. Streak Bonus
  // +10 if the employee's raw score was >= 120 in the past 2 periods (consecutive)
  let streakBonusValue = 0
  try {
    const pastSnapshots = await prisma.scoreSnapshot.findMany({
      where: {
        employeeId,
        periodId: { not: periodId },
      },
      orderBy: { periodId: 'desc' },
      take: 2,
    })
    const isStreak =
      pastSnapshots.length === 2 && pastSnapshots.every((s) => s.rawScore >= 115)
    if (isStreak) streakBonusValue = 10
  } catch {
    // Silent fallback
  }

  const finalAdjustedScore = Math.max(0, Math.round(rawScoreValue + consistencyBonusValue + streakBonusValue))

  return {
    employee,
    periodId,
    baseScore,
    logs,
    competencyRadar,
    competencyDetails,
    summary: {
      positiveRaw: positiveLogs.reduce((sum, l) => sum + l.scoreValue, 0),
      positiveDiminished: Math.round(totalPositiveContribution * 10) / 10,
      negativeTotal: totalNegativeImpact,
      rawScore: Math.round(rawScoreValue),
      consistencyBonus: consistencyBonusValue,
      streakBonus: streakBonusValue,
      finalScore: finalAdjustedScore,
      isWarning: finalAdjustedScore < 70, // early warning under 70
    },
  }
}

/**
 * 3. Calculate all employee scores for a period and apply Z-score Department Normalization
 */
export async function calculatePeriodScoresAndNormalize(periodId: string) {
  // Fetch all active employees
  const employees = await prisma.user.findMany({
    where: { status: 'active' },
    include: {
      role: true,
    },
  })

  // Group employees by department (we map posts or departments)
  // Since our schema uses customFields for department/post, we group by `post` or a custom department field
  const employeesWithDepts = employees.map((emp) => {
    const dept = ((emp.customFields as Record<string, unknown>)?.post as string) || 'عملیات'
    return { emp, dept }
  })

  // Group by department name
  const deptGroups: Record<string, typeof employeesWithDepts> = {}
  employeesWithDepts.forEach((item) => {
    if (!deptGroups[item.dept]) {
      deptGroups[item.dept] = []
    }
    deptGroups[item.dept].push(item)
  })

  const allSnapshots: {
    employeeId: string
    periodId: string
    rawScore: number
    normalizedScore: number
    percentile: number
  }[] = []

  // For each department, calculate adjusted scores and normalize
  for (const [, group] of Object.entries(deptGroups)) {
    // Calculate adjusted scores for each employee
    const scores = await Promise.all(
      group.map(async (item) => {
        const scorecard = await getEmployeeScorecard(item.emp.id, periodId)
        return {
          employeeId: item.emp.id,
          rawScore: scorecard.summary.rawScore,
          adjustedScore: scorecard.summary.finalScore,
        }
      })
    )

    const count = scores.length
    const adjustedScores = scores.map((s) => s.adjustedScore)

    // Calculate Mean (μ)
    const mean = count > 0 ? adjustedScores.reduce((s, val) => s + val, 0) / count : 100

    // Calculate Standard Deviation (σ)
    let stdDev = 0
    if (count > 1) {
      const sqDiffSum = adjustedScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0)
      stdDev = Math.sqrt(sqDiffSum / (count - 1))
    }

    // Normalize: FinalScore = 50 + 10 * (Adjusted - μ) / σ
    scores.forEach((s) => {
      let normalized = 50.0
      if (stdDev > 0) {
        normalized = 50.0 + 10.0 * ((s.adjustedScore - mean) / stdDev)
      } else {
        // If everyone has the same score, normalize to base 80 or 100 depending on value
        normalized = s.adjustedScore >= 100 ? 80.0 : 50.0
      }

      // Bound between 0 and 100
      normalized = Math.max(0, Math.min(100, Math.round(normalized * 10) / 10))

      // Calculate Percentile
      const lowerScoresCount = adjustedScores.filter((val) => val < s.adjustedScore).length
      const equalScoresCount = adjustedScores.filter((val) => val === s.adjustedScore).length
      // Percentile = (less + equal/2) / total * 100
      const percentile = count > 0 ? Math.round(((lowerScoresCount + equalScoresCount / 2) / count) * 100) : 100

      allSnapshots.push({
        employeeId: s.employeeId,
        periodId,
        rawScore: s.rawScore,
        normalizedScore: normalized,
        percentile,
      })
    })
  }

  // Save all snapshots inside a transaction
  return await prisma.$transaction(async (tx) => {
    const results = []
    for (const snap of allSnapshots) {
      const record = await tx.scoreSnapshot.upsert({
        where: {
          employeeId_periodId: {
            employeeId: snap.employeeId,
            periodId: snap.periodId,
          },
        },
        update: {
          rawScore: snap.rawScore,
          normalizedScore: snap.normalizedScore,
          percentile: snap.percentile,
        },
        create: {
          employeeId: snap.employeeId,
          periodId: snap.periodId,
          rawScore: snap.rawScore,
          normalizedScore: snap.normalizedScore,
          percentile: snap.percentile,
        },
      })
      results.push(record)
    }
    return results
  })
}

/**
 * 4. Fetch the Leaderboard (Top 5 public, current user rank/percentile private)
 */
export async function getLeaderboard(periodId: string, currentUserId: string) {
  // Read dynamic performance settings
  const leaderboardLimit = await getSettingValue<number>('performance.leaderboardLimit', 5)
  const showPercentile = await getSettingValue<boolean>('performance.showPercentileToEmployee', true)

  // Load snapshots for this period
  let snapshots = await prisma.scoreSnapshot.findMany({
    where: { periodId },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          customFields: true,
        },
      },
    },
    orderBy: { normalizedScore: 'desc' },
  })

  // If snapshots don't exist yet, trigger calculation dynamically
  if (snapshots.length === 0) {
    await calculatePeriodScoresAndNormalize(periodId)
    snapshots = await prisma.scoreSnapshot.findMany({
      where: { periodId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            customFields: true,
          },
        },
      },
      orderBy: { normalizedScore: 'desc' },
    })
  }

  // Public leaderboard: dynamic slice based on leaderboardLimit setting
  const topFive = snapshots.slice(0, leaderboardLimit).map((snap, idx) => ({
    rank: idx + 1,
    employeeId: snap.employeeId,
    name: snap.employee.name,
    avatar: snap.employee.name.slice(0, 2),
    dept: ((snap.employee.customFields as Record<string, unknown>)?.post as string) || 'عملیات',
    score: snap.normalizedScore,
  }))

  // Private ranking details for the logged-in user
  const myIndex = snapshots.findIndex((s) => s.employeeId === currentUserId)
  const mySnapshot = myIndex !== -1 ? snapshots[myIndex] : null
  const myPrivateRank = {
    rank: myIndex !== -1 ? myIndex + 1 : null,
    percentile: mySnapshot && showPercentile ? mySnapshot.percentile : 0,
    score: mySnapshot ? mySnapshot.normalizedScore : 0,
    totalCount: snapshots.length,
  }

  return {
    topFive,
    myPrivateRank,
  }
}

/**
 * 5. Auto-Nominate Personnel of the Month with tie-breakers
 */
export async function nominatePersonnel(periodId: string) {
  // Fetch snapshots
  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { periodId },
    include: {
      employee: {
        include: {
          performanceLogsReceived: {
            where: { periodId, status: { in: ['active', 'appealed'] } },
            include: { actionType: true },
          },
        },
      },
    },
    orderBy: { normalizedScore: 'desc' },
  })

  if (snapshots.length === 0) {
    return { success: false, message: 'هیچ امتیازی برای این دوره ثبت نشده است' }
  }

  // Gatekeeping & Filtering
  const eligibleCandidates = snapshots.filter((snap) => {
    const logs = snap.employee.performanceLogsReceived
    // Gate 1: Exclude any employee with an L3 (Severe) negative action
    const hasSevereLog = logs.some((l) => l.severity === 'L3' && l.scoreValue < 0)
    if (hasSevereLog) return false

    // Gate 2: Must have at least 2 logs in the period (avoids empty high scorers who just got base + consistency)
    if (logs.length < 2) return false

    return true
  })

  if (eligibleCandidates.length === 0) {
    return { success: false, message: 'هیچ نامزدی واجد شرایط صلاحیت اولیه (ثبت حداقل ۲ رویداد و فاقد جریمه شدید L3) یافت نشد' }
  }

  // Apply Tie-Breakers to sort eligible candidates
  // 1. Highest normalizedScore
  // 2. Competency Diversity (count of unique competencies with positive logs)
  // 3. Consistency Index (lowest std dev of log scores or highest positive log count)
  // 4. Rotation Rule (fewer nominations in the past 12 months)
  const candidatesEvaluated = await Promise.all(
    eligibleCandidates.map(async (snap) => {
      const logs = snap.employee.performanceLogsReceived
      const positiveLogs = logs.filter((l) => l.scoreValue > 0)

      // A. Competency diversity
      const uniqueCompetencies = new Set(positiveLogs.map((l) => l.actionType.competencyId)).size

      // B. Previous wins count (in current year)
      const currentYear = periodId.split('-')[0]
      const previousWinsCount = await prisma.nomination.count({
        where: {
          employeeId: snap.employeeId,
          periodId: { startsWith: currentYear },
          status: 'approved',
        },
      })

      return {
        snapshot: snap,
        score: snap.normalizedScore,
        diversity: uniqueCompetencies,
        positiveCount: positiveLogs.length,
        previousWins: previousWinsCount,
      }
    })
  )

  // Sort by tie-breaker priority
  candidatesEvaluated.sort((a, b) => {
    // 1. Score desc
    if (b.score !== a.score) return b.score - a.score
    // 2. Previous wins asc (Rotation rule - prefer someone who hasn't won recently)
    if (a.previousWins !== b.previousWins) return a.previousWins - b.previousWins
    // 3. Competency diversity desc
    if (b.diversity !== a.diversity) return b.diversity - a.diversity
    // 4. Positive count desc
    return b.positiveCount - a.positiveCount
  })

  const winner = candidatesEvaluated[0]

  // Create Nomination
  const nomination = await prisma.nomination.upsert({
    where: {
      periodId_employeeId: {
        periodId,
        employeeId: winner.snapshot.employeeId,
      },
    },
    update: {
      rank: 1,
      tiebreakerReason: `امتیاز نرمال‌شده: ${winner.score} · تنوع شایستگی: ${winner.diversity} محور · سوابق برد قبلی امسال: ${winner.previousWins} بار`,
    },
    create: {
      periodId,
      employeeId: winner.snapshot.employeeId,
      rank: 1,
      tiebreakerReason: `امتیاز نرمال‌شده: ${winner.score} · تنوع شایستگی: ${winner.diversity} محور · سوابق برد قبلی امسال: ${winner.previousWins} بار`,
      status: 'nominated',
    },
    include: {
      periodEmployee: {
        select: { id: true, name: true, customFields: true },
      },
    },
  })

  return {
    success: true,
    nomination,
    details: winner,
  }
}

/**
 * 6. File a Performance Appeal
 */
export async function filePerformanceAppeal(logId: string, employeeId: string, reason: string) {
  return await prisma.$transaction(async (tx) => {
    const log = await tx.performanceLog.findUnique({
      where: { id: logId },
    })

    if (!log) throw new Error('رکورد عملکرد یافت نشد')
    if (log.employeeId !== employeeId) throw new Error('شما مجاز به ثبت اعتراض روی این رکورد نیستید')
    // Read max appeals setting
    const maxAppeals = await getSettingValue<number>('performance.maxAppealsPerPeriod', 3)

    // Count existing appeals for this employee in the same period
    const existingAppealsCount = await tx.performanceAppeal.count({
      where: {
        employeeId,
        log: {
          periodId: log.periodId,
        },
      },
    })

    if (existingAppealsCount >= maxAppeals) {
      throw new Error(`شما به سقف مجاز ثبت اعتراض (حداکثر ${maxAppeals} اعتراض) در این دوره رسیده‌اید.`)
    }

    // Create appeal
    const appeal = await tx.performanceAppeal.create({
      data: {
        logId,
        employeeId,
        reason,
        status: 'pending',
      },
    })

    // Update log status to appealed
    await tx.performanceLog.update({
      where: { id: logId },
      data: { status: 'appealed' },
    })

    return appeal
  })
}

/**
 * 7. Review an appeal (HR/Admin)
 */
export async function reviewPerformanceAppeal(
  appealId: string,
  reviewerId: string,
  status: 'approved' | 'rejected',
  note?: string
) {
  return await prisma.$transaction(async (tx) => {
    const appeal = await tx.performanceAppeal.findUnique({
      where: { id: appealId },
    })
    if (!appeal) throw new Error('درخواست اعتراض یافت نشد')

    // Update appeal status
    const updatedAppeal = await tx.performanceAppeal.update({
      where: { id: appealId },
      data: {
        status,
        reviewedById: reviewerId,
        note,
        resolvedAt: new Date(),
      },
    })

    // If approved, mark the log as overturned (removes its score impact)
    if (status === 'approved') {
      await tx.performanceLog.update({
        where: { id: appeal.logId },
        data: { status: 'overturned' },
      })
    } else {
      // If rejected, return log to active status
      await tx.performanceLog.update({
        where: { id: appeal.logId },
        data: { status: 'active' },
      })
    }

    return updatedAppeal
  })
}
