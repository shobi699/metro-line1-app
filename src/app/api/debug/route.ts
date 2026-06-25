import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    
    // Test performance tables
    let competencyCount = 0
    let competencyError = ''
    let actionTypeCount = 0
    
    try {
      competencyCount = await prisma.competency.count()
      actionTypeCount = await prisma.performanceActionType.count()
    } catch (e: unknown) {
      competencyError = e instanceof Error ? e.message : String(e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database query successful',
      user: user?.name,
      competencyCount,
      actionTypeCount,
      competencyError,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      message,
    })
  }
}

// POST /api/debug - Seed performance tables (dev only)
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }
  try {
    // Seed competencies
    const competencies = [
      { id: 'discipline', name: 'انضباط فردی', weight: 1.0, direction: 'positive' },
      { id: 'productivity', name: 'بهره‌وری', weight: 1.5, direction: 'positive' },
      { id: 'quality', name: 'کیفیت کار', weight: 1.5, direction: 'positive' },
      { id: 'innovation', name: 'نوآوری', weight: 1.5, direction: 'positive' },
      { id: 'teamwork', name: 'کار تیمی', weight: 1.0, direction: 'both' },
      { id: 'compliance', name: 'انطباق و امنیت', weight: 2.0, direction: 'negative' },
    ]
    for (const c of competencies) {
      await prisma.competency.upsert({
        where: { id: c.id },
        update: { name: c.name, weight: c.weight, direction: c.direction },
        create: c,
      })
    }

    // Seed action types
    const actionTypes = [
      { id: 'a1', competencyId: 'discipline', title: 'حضور به‌موقع در شیفت', defaultScore: 5, maxSeverity: 'L1' },
      { id: 'a2', competencyId: 'productivity', title: 'تحویل زودتر از ددلاین', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a3', competencyId: 'quality', title: 'خروجی بی‌نقص / کیفیت بالا', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a4', competencyId: 'innovation', title: 'پیشنهاد کاهش هزینه/زمان', defaultScore: 20, maxSeverity: 'L1' },
      { id: 'a5', competencyId: 'teamwork', title: 'کمک به همکار / حلال مشکلات', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a6', competencyId: 'discipline', title: 'رعایت دقیق قوانین پوشش', defaultScore: 5, maxSeverity: 'L1' },
      { id: 'a7', competencyId: 'discipline', title: 'آراستگی ظاهر', defaultScore: 5, maxSeverity: 'L1' },
      { id: 'a8', competencyId: 'productivity', title: 'همکاری استثنایی در ساعات شلوغی خط', defaultScore: 15, maxSeverity: 'L1' },
      { id: 'a9', competencyId: 'productivity', title: 'انجام وظایف خارج از محدوده موظف', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a10', competencyId: 'quality', title: 'دقت بالا و بازرسی ایمنی پیشگیرانه', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a11', competencyId: 'quality', title: 'نگهداری و مراقبت عالی از تجهیزات', defaultScore: 10, maxSeverity: 'L1' },
      { id: 'a12', competencyId: 'innovation', title: 'پیشنهاد بهبود ایمنی یا افزایش سرعت', defaultScore: 20, maxSeverity: 'L1' },
      { id: 'a13', competencyId: 'teamwork', title: 'همکاری صمیمانه و روحیه تیمی', defaultScore: 10, maxSeverity: 'L1' },
      // Negative actions
      { id: 'n1', competencyId: 'discipline', title: 'تأخیر / غیبت غیرموجه', defaultScore: -5, maxSeverity: 'L3' },
      { id: 'n2', competencyId: 'quality', title: 'خطای تکراری / سهل‌انگاری', defaultScore: -10, maxSeverity: 'L3' },
      { id: 'n3', competencyId: 'teamwork', title: 'ایجاد تنش در محیط کار', defaultScore: -10, maxSeverity: 'L2' },
      { id: 'n4', competencyId: 'compliance', title: 'نقض قوانین امنیتی/سازمانی', defaultScore: -20, maxSeverity: 'L3' },
      { id: 'n5', competencyId: 'discipline', title: 'نقض آیین‌نامه پوشش', defaultScore: -5, maxSeverity: 'L2' },
      { id: 'n6', competencyId: 'teamwork', title: 'رفتار غیرحرفه‌ای یا عدم همکاری', defaultScore: -10, maxSeverity: 'L2' },
      { id: 'n7', competencyId: 'productivity', title: 'سهل‌انگاری در انجام وظایف یا تاخیر تحویل', defaultScore: -10, maxSeverity: 'L3' },
      { id: 'n8', competencyId: 'compliance', title: 'عدم گزارش خرابی یا سهل‌انگاری در ایمنی', defaultScore: -15, maxSeverity: 'L3' },
      { id: 'n9', competencyId: 'compliance', title: 'نقض قوانین سرعت مجاز قطار', defaultScore: -30, maxSeverity: 'L3' },
    ]
    for (const a of actionTypes) {
      await prisma.performanceActionType.upsert({
        where: { id: a.id },
        update: { title: a.title, defaultScore: a.defaultScore, maxSeverity: a.maxSeverity },
        create: a,
      })
    }

    const competencyCount = await prisma.competency.count()
    const actionTypeCount = await prisma.performanceActionType.count()
    return NextResponse.json({
      success: true,
      message: 'Performance tables seeded successfully',
      competencyCount,
      actionTypeCount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
