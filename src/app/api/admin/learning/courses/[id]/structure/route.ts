import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { id } = await params

  try {
    const chapters = await prisma.chapter.findMany({
      where: { courseId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    return NextResponse.json({ data: chapters })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const err = requirePermission(user, 'learning-admin:manage')
  if (err && user.roleKey !== 'admin' && user.roleKey !== 'super_admin') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { id: courseId } = await params

  try {
    const body = await request.json()
    const { chapters } = body

    if (!Array.isArray(chapters)) {
      return NextResponse.json({ error: { message: 'ساختار نامعتبر' } }, { status: 400 })
    }

    // We sync the DB using a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get existing chapters in DB
      const dbChapters = await tx.chapter.findMany({
        where: { courseId },
        include: { lessons: true }
      })

      const payloadChapterIds = chapters.map(c => c.id).filter(Boolean)
      const dbChapterIds = dbChapters.map(c => c.id)

      // Chapters to delete
      const chapterIdsToDelete = dbChapterIds.filter(id => !payloadChapterIds.includes(id))
      if (chapterIdsToDelete.length > 0) {
        await tx.chapter.deleteMany({
          where: { id: { in: chapterIdsToDelete } }
        })
      }

      // 2. Loop through chapters in payload
      for (const chap of chapters) {
        let chapterId = chap.id

        if (chapterId && dbChapterIds.includes(chapterId)) {
          // Update chapter
          await tx.chapter.update({
            where: { id: chapterId },
            data: {
              title: chap.title,
              sortOrder: chap.sortOrder
            }
          })
        } else {
          // Create chapter
          const newChap = await tx.chapter.create({
            data: {
              courseId,
              title: chap.title,
              sortOrder: chap.sortOrder
            }
          })
          chapterId = newChap.id
        }

        // Now sync lessons for this chapter
        const payloadLessonIds = chap.lessons?.map((l: any) => l.id).filter(Boolean) || []
        
        // Find existing lessons in this chapter in DB
        const dbLessons = dbChapters.find(c => c.id === chap.id)?.lessons || []
        const dbLessonIds = dbLessons.map(l => l.id)

        // Lessons to delete
        const lessonIdsToDelete = dbLessonIds.filter(id => !payloadLessonIds.includes(id))
        if (lessonIdsToDelete.length > 0) {
          await tx.lesson.deleteMany({
            where: { id: { in: lessonIdsToDelete } }
          })
        }

        // Loop through lessons in payload
        if (chap.lessons && Array.isArray(chap.lessons)) {
          for (const les of chap.lessons) {
            if (les.id && dbLessonIds.includes(les.id)) {
              // Update lesson
              await tx.lesson.update({
                where: { id: les.id },
                data: {
                  title: les.title,
                  kind: les.kind,
                  contentRef: les.contentRef,
                  minSeconds: les.minSeconds ? parseInt(les.minSeconds) : null,
                  sortOrder: les.sortOrder,
                  chapterId: chapterId
                }
              })
            } else {
              // Create lesson
              await tx.lesson.create({
                data: {
                  chapterId,
                  title: les.title,
                  kind: les.kind,
                  contentRef: les.contentRef,
                  minSeconds: les.minSeconds ? parseInt(les.minSeconds) : null,
                  sortOrder: les.sortOrder
                }
              })
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: 'ساختار دوره با موفقیت به روز رسانی شد' })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}
