import path from 'path'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const dbPath = path.resolve(__dirname, '../prisma/dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Publishing existing draft posts...')
  const result = await prisma.post.updateMany({
    where: { status: 'draft', published: true },
    data: { status: 'published' }
  })
  console.log(`Updated ${result.count} posts to published status.`)

  // Sync training/gallery posts to Course table
  const trainingPosts = await prisma.post.findMany({
    where: { type: { in: ['training', 'gallery'] } }
  })

  for (const post of trainingPosts) {
    console.log(`Syncing training post: ${post.title}`)
    let quizQuestions: any[] = []
    let cleanBody = post.body || ''
    const quizMatch = cleanBody.match(/\[quiz\]([\s\S]*?)\[\/quiz\]/)
    if (quizMatch) {
      try {
        quizQuestions = JSON.parse(quizMatch[1].trim())
      } catch {}
    }

    const course = await prisma.course.upsert({
      where: { key: post.id },
      update: {
        title: post.title,
        description: post.excerpt || post.title,
        coverUrl: post.coverUrl,
        category: post.category || 'عمومی',
        status: post.status === 'published' ? 'published' : 'draft',
        passScore: 70,
        estMinutes: Math.max(10, Math.round(cleanBody.length / 400)),
      },
      create: {
        key: post.id,
        title: post.title,
        description: post.excerpt || post.title,
        coverUrl: post.coverUrl,
        category: post.category || 'عمومی',
        status: post.status === 'published' ? 'published' : 'draft',
        passScore: 70,
        estMinutes: Math.max(10, Math.round(cleanBody.length / 400)),
        createdBy: 'admin',
      },
    })

    let chapter = await prisma.chapter.findFirst({
      where: { courseId: course.id }
    })
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'بخش اول: آموزش ویدیویی و مستندات',
          sortOrder: 1,
        }
      })
    }

    const isVideo = post.mediaUrl && (post.mediaUrl.endsWith('.mp4') || post.mediaType?.includes('video'))
    await prisma.lesson.deleteMany({ where: { chapterId: chapter.id } })
    await prisma.lesson.create({
      data: {
        chapterId: chapter.id,
        title: post.title,
        kind: isVideo ? 'video' : 'text',
        contentRef: post.mediaUrl || post.body,
        minSeconds: 120,
        sortOrder: 1,
      }
    })

    if (quizQuestions.length > 0) {
      await prisma.exam.upsert({
        where: { id: post.id },
        update: {
          courseId: course.id,
          title: `آزمون صلاحیت: ${post.title}`,
          questionCount: quizQuestions.length,
          durationMin: 15,
          passScore: 70,
          drawRules: '[]',
        },
        create: {
          id: post.id,
          courseId: course.id,
          title: `آزمون صلاحیت: ${post.title}`,
          questionCount: quizQuestions.length,
          durationMin: 15,
          passScore: 70,
          drawRules: '[]',
          maxAttempts: 3,
          cooldownHrs: 0,
        }
      })

      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i]
        const qKey = `q-${post.id}-${i}`
        const formattedOptions = q.options.map((optText: string, oIdx: number) => ({
          id: String(oIdx),
          text: optText,
          isCorrect: oIdx === q.answerIndex
        }))

        await prisma.questionBank.upsert({
          where: { id: qKey },
          update: {
            category: course.title,
            text: q.q,
            options: JSON.stringify(formattedOptions),
            isActive: true,
          },
          create: {
            id: qKey,
            category: course.title,
            kind: 'multiple_choice',
            text: q.q,
            options: JSON.stringify(formattedOptions),
            isActive: true,
          }
        })
      }
    }
  }
  console.log('Migration completed successfully!')
}

main().catch(console.error)
