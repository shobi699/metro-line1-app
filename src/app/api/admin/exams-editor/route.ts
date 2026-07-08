import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'

export const dynamic = 'force-dynamic'

// GET: Fetch all courses and their questions from the QuestionBank
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    let courses = await prisma.course.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    // Ensure default courses exist
    const defaultCourseKeys = ['post-1', 'post-2', 'post-3']
    const existingKeys = courses.map(c => c.key)
    const missingKeys = defaultCourseKeys.filter(k => !existingKeys.includes(k))

    if (missingKeys.length > 0) {
      const defaultCoursesToSeed = [
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
        }
      ]

      for (const dc of defaultCoursesToSeed) {
        if (missingKeys.includes(dc.key)) {
          await prisma.course.create({ data: dc })
          
          // Seed questions for it
          if (dc.key === 'post-1') {
            await prisma.questionBank.createMany({
              data: [
                {
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
                }
              ]
            })
          } else if (dc.key === 'post-2') {
            await prisma.questionBank.createMany({
              data: [
                {
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
                }
              ]
            })
          } else if (dc.key === 'post-3') {
            await prisma.questionBank.createMany({
              data: [
                {
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
                }
              ]
            })
          }
        }
      }

      // Re-fetch courses
      courses = await prisma.course.findMany({
        orderBy: { sortOrder: 'asc' }
      })
    }

    const questions = await prisma.questionBank.findMany({
      where: { isActive: true }
    })

    // Map questions to courses by category
    const coursesWithQuestions = courses.map(course => {
      // Find questions matching course category
      const courseQuestions = questions.filter(
        q => q.category.toLowerCase() === (course.category || '').toLowerCase() || 
             q.category.toLowerCase() === course.key.toLowerCase()
      )

      const formattedQuestions = courseQuestions.map(q => {
        let optionsList: string[] = []
        let answerIndex = 1

        try {
          const parsed = JSON.parse(q.options)
          if (Array.isArray(parsed)) {
            optionsList = parsed.map((o: any) => o.text)
            const correctIdx = parsed.findIndex((o: any) => o.isCorrect)
            answerIndex = correctIdx !== -1 ? correctIdx + 1 : 1
          } else if (typeof parsed === 'object' && parsed !== null) {
            optionsList = [
              parsed['1'] || parsed['a'] || '',
              parsed['2'] || parsed['b'] || '',
              parsed['3'] || parsed['c'] || '',
              parsed['4'] || parsed['d'] || ''
            ].filter(Boolean)

            const correctKey = parsed.correct || '1'
            if (['1', '2', '3', '4'].includes(correctKey)) {
              answerIndex = parseInt(correctKey)
            } else if (correctKey === 'a') answerIndex = 1
            else if (correctKey === 'b') answerIndex = 2
            else if (correctKey === 'c') answerIndex = 3
            else if (correctKey === 'd') answerIndex = 4
          }
        } catch (e) {
          optionsList = ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴']
        }

        // Pad options to 4 if needed
        while (optionsList.length < 4) {
          optionsList.push(`گزینه ${optionsList.length + 1}`)
        }

        return {
          id: q.id,
          text: q.text,
          options: optionsList.slice(0, 4),
          answer: answerIndex
        }
      })

      return {
        id: course.id,
        key: course.key,
        title: course.title,
        category: course.category || 'عمومی',
        questions: formattedQuestions
      }
    })

    return NextResponse.json({ data: coursesWithQuestions })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

// POST: Save (overwrite) questions for a course category
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const { courseId, questions } = await request.json()
    if (!courseId || !Array.isArray(questions)) {
      return NextResponse.json({ error: { message: 'ورودی‌های نامعتبر' } }, { status: 400 })
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: { message: 'دوره یافت نشد' } }, { status: 404 })
    }

    const categoryKey = course.category || course.key

    // Delete existing questions in this category/course key
    await prisma.questionBank.deleteMany({
      where: {
        OR: [
          { category: categoryKey },
          { category: course.key }
        ]
      }
    })

    // Create new questions
    for (const q of questions) {
      const optionsObj = {
        '1': q.options[0] || 'گزینه ۱',
        '2': q.options[1] || 'گزینه ۲',
        '3': q.options[2] || 'گزینه ۳',
        '4': q.options[3] || 'گزینه ۴',
        'correct': String(q.answer)
      }

      await prisma.questionBank.create({
        data: {
          category: categoryKey,
          kind: 'multiple_choice',
          text: q.text,
          options: JSON.stringify(optionsObj),
          difficulty: 'normal',
          explanation: 'ثبت شده از پرتال مدیریت آزمون'
        }
      })
    }

    return NextResponse.json({ success: true, message: 'تغییرات آزمون و بانک سوالات با موفقیت در دیتابیس ثبت شد.' })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
