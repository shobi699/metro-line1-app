import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'

export async function POST(request: Request) {
  try {
    // Check permission
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err1 = requirePermission(user, 'learning-admin:manage')
    const err2 = requirePermission(user, 'learning:reports')
    if (err1 && err2) {
      return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
    }

    // Clean up existing learning records to have a clean mock state
    await prisma.certificate.deleteMany().catch(() => {})
    await prisma.examAttempt.deleteMany().catch(() => {})
    await prisma.enrollment.deleteMany().catch(() => {})
    await prisma.exam.deleteMany().catch(() => {})
    await prisma.lesson.deleteMany().catch(() => {})
    await prisma.chapter.deleteMany().catch(() => {})
    await prisma.course.deleteMany().catch(() => {})
    await prisma.questionBank.deleteMany().catch(() => {})

    // Find users to associate with enrollments
    const dbUsers = await prisma.user.findMany({
      take: 10,
      include: { role: true }
    })

    if (dbUsers.length === 0) {
      return NextResponse.json({ error: { message: 'هیچ کاربری در سیستم یافت نشد. ابتدا دیتابیس اصلی را سید کنید.' } }, { status: 400 })
    }

    // 1. Create Question Banks (Mock Questions)
    const questionsSafety = [
      // post-1 questions (مقررات عمومی)
      {
        id: 'q-post1-1',
        category: 'مقررات عمومی',
        kind: 'multiple_choice',
        text: 'در صورت مشاهده سیگنال قرمز ثابت، فاصله مجاز توقف قطار چند متر است؟',
        options: JSON.stringify([
          { id: '1', text: '10 متر', isCorrect: false },
          { id: '2', text: '50 متر', isCorrect: false },
          { id: '3', text: '100 متر', isCorrect: false },
          { id: '4', text: 'توقف فوری قبل از سیگنال', isCorrect: true }
        ]),
        difficulty: 'normal',
        explanation: 'مقررات عمومی سیر و حرکت خط ۱ (سیگنال‌ها)'
      },
      {
        id: 'q-post1-2',
        category: 'مقررات عمومی',
        kind: 'multiple_choice',
        text: 'حداکثر سرعت مجاز در هنگام ورود به سوزن در حالت دستی چند کیلومتر بر ساعت است؟',
        options: JSON.stringify([
          { id: '1', text: '15 کیلومتر بر ساعت', isCorrect: true },
          { id: '2', text: '25 کیلومتر بر ساعت', isCorrect: false },
          { id: '3', text: '40 کیلومتر بر ساعت', isCorrect: false },
          { id: '4', text: '5 کیلومتر بر ساعت', isCorrect: false }
        ]),
        difficulty: 'normal',
        explanation: 'مقررات عمومی سیر و حرکت خط ۱ (سیگنال‌ها)'
      },
      // post-2 questions (عیب‌یابی فنی)
      {
        id: 'q-post2-1',
        category: 'عیب‌یابی فنی',
        kind: 'multiple_choice',
        text: 'کد خطای E102 در نمایشگر کابین به چه معناست؟',
        options: JSON.stringify([
          { id: '1', text: 'نقص ولتاژ کششی', isCorrect: false },
          { id: '2', text: 'مانع در مسیر درب یا عدم قفل درب واگن', isCorrect: true },
          { id: '3', text: 'نشت هوای ترمز', isCorrect: false },
          { id: '4', text: 'نقص سیستم تهویه مطبوع', isCorrect: false }
        ]),
        difficulty: 'normal',
        explanation: 'عیب‌یابی سیستم مکانیزم درب قطارهای سری ۱۰۰'
      },
      {
        id: 'q-post2-2',
        category: 'عیب‌یابی فنی',
        kind: 'multiple_choice',
        text: 'در صورت قفل نشدن درب، راهبر مجاز به چه کاری است؟',
        options: JSON.stringify([
          { id: '1', text: 'ادامه حرکت با سرعت پایین', isCorrect: false },
          { id: '2', text: 'ایزوله کردن واگن مربوطه و ادامه مسیر تا انتهای پایانه', isCorrect: true },
          { id: '3', text: 'تخلیه کامل مسافرین و خروج به سمت دپو', isCorrect: false },
          { id: '4', text: 'خاموش کردن سیستم ایمنی درب', isCorrect: false }
        ]),
        difficulty: 'normal',
        explanation: 'عیب‌یابی سیستم مکانیزم درب قطارهای سری ۱۰۰'
      },
      // post-3 questions (ایمنی و بحران)
      {
        id: 'q-post3-1',
        category: 'ایمنی و بحران',
        kind: 'multiple_choice',
        text: 'اولین اقدام راهبر قطار در هنگام وقوع نقص فنی حاد در تونل چیست؟',
        options: JSON.stringify([
          { id: '1', text: 'تخلیه فوری مسافران', isCorrect: false },
          { id: '2', text: 'ارتباط فوری با مرکز فرمان (OCC) و گزارش وضعیت', isCorrect: true },
          { id: '3', text: 'راه اندازی مجدد برق کششی', isCorrect: false },
          { id: '4', text: 'اعلام خطر با آژیر قطار', isCorrect: false }
        ]),
        difficulty: 'normal',
        explanation: 'پروتکل ایمنی تخلیه مسافرین در داخل تونل مترو'
      },
      // general safety questions
      {
        id: 'q-s-1',
        category: 'safety',
        kind: 'multiple_choice',
        text: 'در صورت مشاهده شیء مشکوک روی ریل در بخش روباز خط ۱، نخستین اقدام چیست؟',
        options: JSON.stringify([
          { id: '1', text: 'گزارش فوری به مرکز فرمان (OCC)', isCorrect: true },
          { id: '2', text: 'ادامه حرکت با سرعت پایین', isCorrect: false },
          { id: '3', text: 'ترمز اضطراری بدون هماهنگی', isCorrect: false },
          { id: '4', text: 'پیاده شدن از قطار برای بررسی', isCorrect: false }
        ]),
        difficulty: 'normal',
        explanation: 'هرگونه خطر روی ریل باید سریعاً به OCC اطلاع داده شود.'
      },
      {
        id: 'q-s-2',
        category: 'safety',
        kind: 'multiple_choice',
        text: 'حداکثر سرعت مجاز هنگام ورود به سوزن سوزن‌بان در حالت دستی چند کیلومتر بر ساعت است؟',
        options: JSON.stringify([
          { id: '1', text: '۱۵ کیلومتر بر ساعت', isCorrect: true },
          { id: '2', text: '۳۰ کیلومتر بر ساعت', isCorrect: false },
          { id: '3', text: '۴۵ کیلومتر بر ساعت', isCorrect: false },
          { id: '4', text: '۵ کیلومتر بر ساعت', isCorrect: false }
        ]),
        difficulty: 'hard',
        explanation: 'سوزن‌های دستی به دلیل عدم قفل الکترومکانیکی نیاز به حداکثر احتیاط و سرعت ۱۵ دارند.'
      },
      {
        id: 'q-s-3',
        category: 'safety',
        kind: 'multiple_choice',
        text: 'کدام رنگ در سیگنال‌های فیزیکی تونل به معنای ایست کامل و قطعی است؟',
        options: JSON.stringify([
          { id: '1', text: 'قرمز زنده', isCorrect: true },
          { id: '2', text: 'زرد چشمک‌زن', isCorrect: false },
          { id: '3', text: 'سبز ممتد', isCorrect: false },
          { id: '4', text: 'آبی کمرنگ', isCorrect: false }
        ]),
        difficulty: 'easy',
        explanation: 'رنگ قرمز در تمامی سیستم‌های ریلی به معنای توقف کامل قطار است.'
      }
    ]

    for (const q of questionsSafety) {
      await prisma.questionBank.create({ data: q })
    }

    // 2. Create Courses
    const courses = [
      {
        key: 'post-1',
        title: 'مقررات عمومی سیر و حرکت خط ۱ (سیگنال‌ها)',
        description: 'مقررات عمومی سیر و حرکت خط ۱ و سیستم‌های سیگنالینگ و سوزن‌بانی.',
        category: 'مقررات عمومی',
        status: 'published',
        passScore: 70,
        recurrenceMonths: 12,
        estMinutes: 45,
        sortOrder: 1
      },
      {
        key: 'post-2',
        title: 'عیب‌یابی سیستم مکانیزم درب قطارهای سری ۱۰۰',
        description: 'عیب‌یابی فنی درب‌های قطارهای نسل اول مترو تهران.',
        category: 'عیب‌یابی فنی',
        status: 'published',
        passScore: 70,
        recurrenceMonths: 24,
        estMinutes: 60,
        sortOrder: 2
      },
      {
        key: 'post-3',
        title: 'پروتکل ایمنی تخلیه مسافرین در داخل تونل مترو',
        description: 'دستورالعمل خروج اضطراری و تخلیه مسافرین از قطارهای متوقف شده در تونل.',
        category: 'ایمنی و بحران',
        status: 'published',
        passScore: 70,
        recurrenceMonths: 12,
        estMinutes: 30,
        sortOrder: 3
      },
      {
        key: 'safety-l1',
        title: 'دوره جامع ایمنی خط ۱ مترو',
        description: 'این دوره شامل قوانین ایمنی سیر و حرکت، علائم اضطراری در تونل و دستورالعمل‌های روباز خط یک تهران است.',
        category: 'ایمنی',
        status: 'published',
        passScore: 80,
        recurrenceMonths: 12,
        estMinutes: 120,
        sortOrder: 4
      },
      {
        key: 'signaling-comms',
        title: 'دستورالعمل سیگنالینگ و بی‌سیم راهبری',
        description: 'آموزش جامع استفاده از کانال‌های رادیویی مترو، اصطلاحات استاندارد مکالمات و علائم الکترونیکی کابین قطار.',
        category: 'فنی',
        status: 'published',
        passScore: 75,
        recurrenceMonths: 24,
        estMinutes: 90,
        sortOrder: 5
      },
      {
        key: 'crisis-tunnel',
        title: 'مدیریت شرایط اضطراری و سوانح ریلی',
        description: 'روش‌های برخورد با آتش‌سوزی در قطار یا ایستگاه، تخلیه مسافران درون تونل و هماهنگی با تیم‌های امدادی.',
        category: 'ایمنی',
        status: 'published',
        passScore: 85,
        recurrenceMonths: 12,
        estMinutes: 150,
        sortOrder: 6
      },
      {
        key: 'pass-rel',
        title: 'اخلاق حرفه‌ای و ارتباط با مسافر در حوادث',
        description: 'آموزش نحوه اطلاع‌رسانی پیج قطار، مدیریت استرس مسافران در زمان توقف‌های طولانی و اصول روانشناختی راهبری.',
        category: 'عمومی',
        status: 'published',
        passScore: 60,
        recurrenceMonths: 0,
        estMinutes: 60,
        sortOrder: 7
      }
    ]

    const createdCourses = []
    for (const c of courses) {
      const dbCourse = await prisma.course.create({ data: c })
      createdCourses.push(dbCourse)

      // Chapters & Lessons
      const chap1 = await prisma.chapter.create({
        data: {
          courseId: dbCourse.id,
          title: 'فصل اول: مفاهیم مقدماتی و آشنایی اولیه',
          sortOrder: 1
        }
      })
      const chap2 = await prisma.chapter.create({
        data: {
          courseId: dbCourse.id,
          title: 'فصل دوم: آیین‌نامه‌ها و قوانین اجرایی قطارها',
          sortOrder: 2
        }
      })

      await prisma.lesson.createMany({
        data: [
          { chapterId: chap1.id, title: 'درس ۱: مقدمه و تعاریف پایه', kind: 'text', contentRef: 'محتوای متنی آشنایی با قوانین و واژگان اولیه مترو.', sortOrder: 1 },
          { chapterId: chap1.id, title: 'درس ۲: اصول عمومی پیشگیری از خطرات', kind: 'video', contentRef: '/uploads/videos/intro.mp4', sortOrder: 2 },
          { chapterId: chap2.id, title: 'درس ۳: سناریوهای عملیاتی و رزمایش‌ها', kind: 'text', contentRef: 'در این درس، سناریوهای مختلف بررسی و تست می‌شوند.', sortOrder: 1 },
        ]
      })

      // Exams
      await prisma.exam.create({
        data: {
          courseId: dbCourse.id,
          title: `آزمون پایانی ${dbCourse.title}`,
          drawRules: JSON.stringify({ category: dbCourse.category }),
          questionCount: 3,
          durationMin: 15,
          passScore: dbCourse.passScore,
          maxAttempts: 3,
          cooldownHrs: 12,
          shuffle: true,
          showAnswers: 'after_pass'
        }
      })
    }

    // Get exams to generate attempts
    const dbExams = await prisma.exam.findMany()

    // 3. Create Enrollments and Mock Attempts for users
    const now = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(now.getDate() - 10)
    const sixMonthsLater = new Date()
    sixMonthsLater.setMonth(now.getMonth() + 6)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(now.getMonth() - 2)

    // User 1 (completed + certified)
    const userCompleted = dbUsers[0]
    const courseCompleted = createdCourses[0]
    const examCompleted = dbExams.find(e => e.courseId === courseCompleted.id)

    if (userCompleted && courseCompleted) {
      const enrollment = await prisma.enrollment.create({
        data: {
          courseId: courseCompleted.id,
          userId: userCompleted.id,
          status: 'completed',
          progressPct: 100,
          enrolledAt: oneMonthAgo,
          completedAt: tenDaysAgo,
          deadlineAt: sixMonthsLater
        }
      })

      if (examCompleted) {
        await prisma.examAttempt.create({
          data: {
            examId: examCompleted.id,
            userId: userCompleted.id,
            enrollmentId: enrollment.id,
            status: 'passed',
            startedAt: tenDaysAgo,
            endedAt: new Date(tenDaysAgo.getTime() + 15 * 60 * 1000), // +15 mins
            score: 95,
            snapshot: JSON.stringify(questionsSafety),
            answers: JSON.stringify({ 'q-s-1': '1', 'q-s-2': '1', 'q-s-3': '2' }) // 2 right, 1 wrong
          }
        })
      }

      await prisma.certificate.create({
        data: {
          courseId: courseCompleted.id,
          userId: userCompleted.id,
          serial: `CERT-METRO-${courseCompleted.key.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          issuedAt: tenDaysAgo,
          expiresAt: sixMonthsLater
        }
      })
    }

    // User 2 (in_progress)
    const userInProgress = dbUsers[1] || dbUsers[0]
    const courseInProgress = createdCourses[1]
    if (userInProgress && courseInProgress) {
      await prisma.enrollment.create({
        data: {
          courseId: courseInProgress.id,
          userId: userInProgress.id,
          status: 'in_progress',
          progressPct: 45,
          enrolledAt: tenDaysAgo,
          deadlineAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000) // +20 days
        }
      })
    }

    // User 3 (expired)
    const userExpired = dbUsers[2] || dbUsers[0]
    const courseExpired = createdCourses[2]
    if (userExpired && courseExpired) {
      await prisma.enrollment.create({
        data: {
          courseId: courseExpired.id,
          userId: userExpired.id,
          status: 'in_progress',
          progressPct: 20,
          enrolledAt: twoMonthsAgo,
          deadlineAt: tenDaysAgo // Expired 10 days ago
        }
      })
    }

    // User 4 (failed attempt)
    const userFailed = dbUsers[3] || dbUsers[0]
    const courseFailed = createdCourses[0] // safety course
    const examFailed = dbExams.find(e => e.courseId === courseFailed.id)
    if (userFailed && courseFailed && userFailed.id !== userCompleted.id) {
      const enrollment = await prisma.enrollment.create({
        data: {
          courseId: courseFailed.id,
          userId: userFailed.id,
          status: 'failed',
          progressPct: 100,
          enrolledAt: tenDaysAgo,
          completedAt: now,
          deadlineAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
        }
      })

      if (examFailed) {
        await prisma.examAttempt.create({
          data: {
            examId: examFailed.id,
            userId: userFailed.id,
            enrollmentId: enrollment.id,
            status: 'failed',
            startedAt: now,
            endedAt: new Date(now.getTime() + 12 * 60 * 1000), // +12 mins
            score: 45,
            snapshot: JSON.stringify(questionsSafety),
            answers: JSON.stringify({ 'q-s-1': '2', 'q-s-2': '3', 'q-s-3': '1' }) // Failed
          }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'داده‌های نمونه مدیریت آموزش با موفقیت ساخته شدند.' })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
