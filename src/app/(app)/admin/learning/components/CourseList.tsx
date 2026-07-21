'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, Plus, Trash2, Edit2, Layers, Award, Clock, Users, PlayCircle, Eye
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface CourseListProps {
  courses: any[]
  onEditStructure: (course: any) => void
  onEditSettings: (course: any) => void
  onDeleteCourse: (id: string) => void
  onCreateNew: () => void
}

export function CourseList({
  courses,
  onEditStructure,
  onEditSettings,
  onDeleteCourse,
  onCreateNew
}: CourseListProps) {
  return (
    <div className="space-y-6 font-fa">
      {/* Header and Add Course Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">مدیریت دوره‌ها و ساختار آموزشی</h2>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت دوره‌های جدید و طراحی درختی دروس و آزمون‌ها</p>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ایجاد دوره ریلی جدید</span>
        </Button>
      </div>

      {/* Courses Catalog Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-20 bg-muted/5 border border-dashed border-border/40 rounded-xl">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">هیچ دوره ریلی ثبت نشده است.</p>
          <Button
            onClick={onCreateNew}
            className="mt-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اولین دوره</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const chapterCount = course.chapters?.length || 0
            const lessonCount = course.chapters?.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0) || 0
            
            return (
              <Card key={course.id} className="bg-card/40 border-border/40 shadow-sm relative overflow-hidden group hover:border-red-500/20 transition duration-300 flex flex-col h-full">
                {/* Visual Cover Header */}
                <div className="h-28 bg-gradient-to-br from-red-950/20 to-neutral-900 border-b border-border/20 p-4 flex flex-col justify-between relative shrink-0">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl group-hover:bg-red-500/10 transition" />
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/30 bg-muted/40 font-fa">
                      {course.category || 'عمومی'}
                    </Badge>
                    <Badge className={`text-[10px] py-0 px-2 font-fa ${course.status === 'published' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                      {course.status === 'published' ? 'انتشار یافته' : 'پیش‌نویس'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground block font-mono">ID: {course.key}</span>
                    <h3 className="text-sm font-bold text-white line-clamp-1 mt-0.5">{course.title}</h3>
                  </div>
                </div>

                {/* Course Metadata */}
                <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed text-right min-h-[32px]">
                    {course.description || '(بدون توضیحات)'}
                  </p>

                  <div className="grid grid-cols-2 gap-3.5 border-t border-b border-border/10 py-3 text-[10px] text-muted-foreground font-fa">
                    <div className="flex items-center gap-1.5 justify-start">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>زمان مطالعه:</span>
                      <strong className="text-white">{toFa(course.estMinutes || 30)} دقیقه</strong>
                    </div>
                    <div className="flex items-center gap-1.5 justify-start">
                      <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>حد نصاب قبولی:</span>
                      <strong className="text-white">{toFa(course.passScore || 70)}٪</strong>
                    </div>
                    <div className="flex items-center gap-1.5 justify-start">
                      <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>محتوا:</span>
                      <strong className="text-white">{toFa(chapterCount)} فصل / {toFa(lessonCount)} درس</strong>
                    </div>
                    <div className="flex items-center gap-1.5 justify-start">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>مخاطبین مجاز:</span>
                      <strong className="text-white truncate max-w-[90px]">{course.audience || 'همه پرسنل'}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => onEditSettings(course)}
                        className="bg-muted hover:bg-muted/70 text-white text-[10px] h-8 px-2.5 font-bold gap-1 cursor-pointer"
                        title="ویرایش تنظیمات"
                      >
                        <Edit2 className="w-3 h-3 text-yellow-400" />
                        <span>تنظیمات</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onDeleteCourse(course.id)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] h-8 px-2.5 font-bold gap-1 cursor-pointer border border-rose-500/15"
                        title="حذف دوره"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف</span>
                      </Button>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onEditStructure(course)}
                      className="bg-primary hover:bg-primary-hover text-white text-[10px] h-8 px-3 font-bold gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>طراحی ساختار و محتوا</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
