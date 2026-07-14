'use client'

import { useState } from 'react'
import { 
  ArrowRight, Save, Plus, ArrowUp, ArrowDown, Trash2, Eye, FileText, Video, HelpCircle, Layers, Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { toFa } from '@/lib/fa'

interface StructureEditorProps {
  course: any
  chapters: any[]
  saving: boolean
  onChaptersChange: (chapters: any[]) => void
  onSave: () => void
  onCancel: () => void
  onOpenVisualBuilder: (chapterIdx: number, lessonIdx: number) => void
}

export function StructureEditor({
  course,
  chapters,
  saving,
  onChaptersChange,
  onSave,
  onCancel,
  onOpenVisualBuilder
}: StructureEditorProps) {

  const handleAddChapter = () => {
    const sortOrder = chapters.length + 1
    onChaptersChange([...chapters, {
      id: '',
      title: `فصل جدید ${toFa(sortOrder)}`,
      sortOrder,
      lessons: []
    }])
  }

  const handleMoveChapter = (idx: number, dir: 'up' | 'down') => {
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= chapters.length) return
    const updated = [...chapters]
    const temp = updated[idx]
    updated[idx] = updated[nextIdx]
    updated[nextIdx] = temp
    
    updated.forEach((c, i) => { c.sortOrder = i + 1 })
    onChaptersChange(updated)
  }

  const handleDeleteChapter = (idx: number) => {
    if (!confirm('آیا از حذف این فصل و تمامی دروس آن مطمئن هستید؟')) return
    const updated = chapters.filter((_, i) => i !== idx)
    updated.forEach((c, i) => { c.sortOrder = i + 1 })
    onChaptersChange(updated)
  }

  const handleChapterTitleChange = (idx: number, title: string) => {
    const updated = [...chapters]
    updated[idx].title = title
    onChaptersChange(updated)
  }

  // Lessons
  const handleAddLesson = (chapterIdx: number) => {
    const chapter = chapters[chapterIdx]
    const sortOrder = (chapter.lessons?.length || 0) + 1
    const newLesson = {
      id: '',
      title: `درس جدید ${toFa(sortOrder)}`,
      kind: 'text',
      contentRef: '',
      minSeconds: 30,
      sortOrder
    }
    const updated = [...chapters]
    updated[chapterIdx].lessons = [...(chapter.lessons || []), newLesson]
    onChaptersChange(updated)
  }

  const handleMoveLesson = (chapterIdx: number, lessonIdx: number, dir: 'up' | 'down') => {
    const lessons = chapters[chapterIdx].lessons || []
    const nextIdx = dir === 'up' ? lessonIdx - 1 : lessonIdx + 1
    if (nextIdx < 0 || nextIdx >= lessons.length) return
    const updatedLessons = [...lessons]
    const temp = updatedLessons[lessonIdx]
    updatedLessons[lessonIdx] = updatedLessons[nextIdx]
    updatedLessons[nextIdx] = temp
    
    updatedLessons.forEach((l, i) => { l.sortOrder = i + 1 })
    const updated = [...chapters]
    updated[chapterIdx].lessons = updatedLessons
    onChaptersChange(updated)
  }

  const handleDeleteLesson = (chapterIdx: number, lessonIdx: number) => {
    if (!confirm('آیا از حذف این درس اطمینان دارید؟')) return
    const lessons = chapters[chapterIdx].lessons || []
    const updatedLessons = lessons.filter((_, i) => i !== lessonIdx)
    updatedLessons.forEach((l, i) => { l.sortOrder = i + 1 })
    const updated = [...chapters]
    updated[chapterIdx].lessons = updatedLessons
    onChaptersChange(updated)
  }

  const handleLessonFieldChange = (chapterIdx: number, lessonIdx: number, field: string, val: any) => {
    const updated = [...chapters]
    updated[chapterIdx].lessons[lessonIdx][field] = val
    onChaptersChange(updated)
  }

  return (
    <div className="space-y-6 font-fa">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">طراحی و ویرایش ساختار دوره: {course.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">افزودن فصول، درس‌ها و تعیین محتوا به صورت بصری</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer text-xs"
          >
            انصراف
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-hover text-white cursor-pointer text-xs font-bold gap-1.5"
          >
            {saving ? (
              <span className="flex items-center gap-1">
                <Settings2 className="w-3.5 h-3.5 animate-spin" />
                <span>در حال ذخیره...</span>
              </span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره نهایی ساختار دوره</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chapters and Lessons List */}
        <div className="lg:col-span-3 space-y-6">
          {chapters.length === 0 ? (
            <div className="text-center py-20 bg-muted/5 border border-dashed border-border/40 rounded-xl">
              <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">هیچ فصلی در این دوره تعریف نشده است.</p>
              <Button
                onClick={handleAddChapter}
                className="mt-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن اولین فصل</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, cIdx) => (
                <Card key={cIdx} className="bg-card/40 border-border/40 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/15 border-b border-border/10 py-3 px-4 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-bold text-primary font-mono shrink-0">فصل {toFa(cIdx + 1)}:</span>
                      <input
                        type="text"
                        value={chapter.title}
                        onChange={(e) => handleChapterTitleChange(cIdx, e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary text-sm font-bold text-white focus:outline-none py-0.5 flex-1 max-w-md"
                        placeholder="عنوان فصل..."
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveChapter(cIdx, 'up')}
                        disabled={cIdx === 0}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                        title="انتقال به بالا"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveChapter(cIdx, 'down')}
                        disabled={cIdx === chapters.length - 1}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                        title="انتقال به پایین"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(cIdx)}
                        className="p-1 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                        title="حذف فصل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {/* Lessons of Chapter */}
                    {(!chapter.lessons || chapter.lessons.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">هیچ درسی در این فصل وجود ندارد.</p>
                    ) : (
                      <div className="space-y-2">
                        {chapter.lessons.map((lesson: any, lIdx: number) => {
                          return (
                            <div
                              key={lIdx}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-lg gap-4"
                            >
                              <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
                                <span className="text-[10px] text-muted-foreground font-mono shrink-0">درس {toFa(lIdx + 1)}:</span>
                                <input
                                  type="text"
                                  value={lesson.title}
                                  onChange={(e) => handleLessonFieldChange(cIdx, lIdx, 'title', e.target.value)}
                                  className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary text-xs text-white focus:outline-none py-0.5 flex-1 min-w-[150px]"
                                  placeholder="عنوان درس..."
                                />
                                <div className="flex gap-2 items-center">
                                  <select
                                    value={lesson.kind}
                                    onChange={(e) => handleLessonFieldChange(cIdx, lIdx, 'kind', e.target.value)}
                                    className="p-1 bg-muted border border-border/40 rounded text-[10px] text-white focus:outline-none"
                                  >
                                    <option value="text">نوشتار/چندرسانه‌ای</option>
                                    <option value="video">ویدئو مستقیم</option>
                                    <option value="pdf">فایل PDF</option>
                                    <option value="quiz">آزمونک ارزیابی</option>
                                  </select>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-muted-foreground">حداقل مطالعه:</span>
                                    <input
                                      type="number"
                                      value={lesson.minSeconds || 30}
                                      onChange={(e) => handleLessonFieldChange(cIdx, lIdx, 'minSeconds', parseInt(e.target.value) || 0)}
                                      className="w-12 p-1 bg-muted border border-border/40 rounded text-[10px] text-center text-white"
                                      placeholder="ثانیه"
                                    />
                                    <span className="text-[9px] text-muted-foreground">ثانیه</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                  type="button"
                                  onClick={() => onOpenVisualBuilder(cIdx, lIdx)}
                                  className="bg-accent/15 hover:bg-accent/30 text-accent border border-accent/20 text-[10px] h-7 px-2 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>محتوای بصری (Visual)</span>
                                </Button>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(cIdx, lIdx, 'up')}
                                    disabled={lIdx === 0}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveLesson(cIdx, lIdx, 'down')}
                                    disabled={lIdx === chapter.lessons.length - 1}
                                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(cIdx, lIdx)}
                                    className="p-1 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddLesson(cIdx)}
                      className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-transparent cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن درس جدید به این فصل</span>
                    </button>
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={handleAddChapter}
                className="w-full border border-dashed border-border/40 hover:border-primary/40 bg-muted/5 hover:bg-primary/5 text-muted-foreground hover:text-white text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن فصل ریلی جدید</span>
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Help */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/40 border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-1">
                <FileText className="w-4 h-4 text-primary" />
                <span>مفاهیم ساختار ریلی</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] text-muted-foreground space-y-3.5 leading-normal">
              <div>
                <strong className="text-white block mb-1">فصول (Chapters):</strong>
                سازماندهی کلی مطالب دوره (مثلا: قوانین علائم، سرعت‌های مجاز، سوانح ریلی).
              </div>
              <div>
                <strong className="text-white block mb-1">درس‌ها (Lessons):</strong>
                بخش‌های زیرمجموعه فصل‌ها که محتوای یادگیری در آن‌هاست.
              </div>
              <div>
                <strong className="text-white block mb-1">حداقل زمان مطالعه:</strong>
                زمان مورد نیاز برای مطالعه درس به ثانیه، تا زمان نگذرد درس برای کاربر ثبت‌نام شده تکمیل نخواهد شد.
              </div>
              <div className="p-2.5 bg-yellow-950/10 border-r-2 border-yellow-500/50 rounded">
                <span className="text-[10px] text-yellow-500 font-bold block mb-1">⚠️ ذخیره نهایی:</span>
                تغییر ساختار درختی و دروس تا زمانی که دکمه سبز رنگ «ذخیره نهایی ساختار دوره» را در بالای صفحه کلیک نکنید، در پایگاه داده ثبت نخواهد شد.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
