'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { 
  Plus, 
  Trash, 
  Save, 
  GraduationCap, 
  Edit, 
  HelpCircle, 
  CheckCircle2, 
  UploadCloud, 
  FileSpreadsheet, 
  FileText,
  AlertTriangle,
  Loader2,
  FileUp,
  Undo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth'

interface Question {
  id: string
  text: string
  options: string[]
  answer: number // 1-indexed (1-4)
}

interface Course {
  id: string
  key: string
  title: string
  category: string
  questions: Question[]
}

export default function ExamsEditorPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [activeCourseId, setActiveCourseId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importingFile, setImportingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New question form states
  const [newQuestionText, setNewQuestionText] = useState('')
  const [opt1, setOpt1] = useState('')
  const [opt2, setOpt2] = useState('')
  const [opt3, setOpt3] = useState('')
  const [opt4, setOpt4] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState(1)

  // Imported questions preview state
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/admin/exams-editor', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        setCourses(json.data)
        if (!activeCourseId) {
          setActiveCourseId(json.data[0].id)
        }
      } else if (json.error) {
        toast.error(json.error.message || 'خطا در بارگذاری اطلاعات')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطا در بارگذاری اطلاعات دوره‌ها')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeCourse = courses.find((c) => c.id === activeCourseId)

  // Add single question locally to current state
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCourseId) return
    if (!newQuestionText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) {
      toast.error('لطفاً تمامی فیلدها را پر کنید')
      return
    }

    const newQ: Question = {
      id: `q-${Date.now()}`,
      text: newQuestionText,
      options: [opt1, opt2, opt3, opt4],
      answer: correctAnswer,
    }

    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourseId
          ? { ...c, questions: [...c.questions, newQ] }
          : c
      )
    )

    // Clear inputs
    setNewQuestionText('')
    setOpt1('')
    setOpt2('')
    setOpt3('')
    setOpt4('')
    setCorrectAnswer(1)

    toast.success('سوال با موفقیت به پیش‌نویس اضافه شد.')
  }

  // Delete question locally
  const handleDeleteQuestion = (qId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourseId
          ? { ...c, questions: c.questions.filter((q) => q.id !== qId) }
          : c
      )
    )
  }  // Save changes to DB
  const handleSaveChanges = async () => {
    if (!activeCourse) return
    setSaving(true)
    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/admin/exams-editor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: activeCourse.id,
          questions: activeCourse.questions
        })
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast.success(json.message || 'تغییرات با موفقیت ذخیره شدند')
        await loadData()
      } else {
        toast.error(json.error?.message || 'خطا در ذخیره‌سازی')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  // Handle file import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)

    setImportingFile(true)
    try {
      const token = useAuthStore.getState().accessToken
      const res = await fetch('/api/admin/exams-editor/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setImportedQuestions(json.data)
        toast.success(`تعداد ${toFa(json.data.length)} سوال با موفقیت از فایل استخراج شد`)
      } else {
        toast.error(json.error?.message || 'خطا در تحلیل فایل')
      }
    } catch (err) {
      console.error(err)
      toast.error('خطای شبکه در تحلیل فایل')
    } finally {
      setImportingFile(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  // Add all imported questions to the active course quiz
  const handleAcceptImported = () => {
    if (importedQuestions.length === 0 || !activeCourseId) return

    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourseId
          ? { ...c, questions: [...c.questions, ...importedQuestions] }
          : c
      )
    )

    setImportedQuestions([])
    toast.success('سؤالات استخراج‌شده به کوئیز الحاق شدند. برای اتمام دکمه ذخیره نهایی را بزنید.')
  }

  const handleUpdateImportedAnswer = (idx: number, answerVal: number) => {
    setImportedQuestions(prev => 
      prev.map((q, i) => i === idx ? { ...q, answer: answerVal } : q)
    )
  }

  const handleDeleteImportedQ = (idx: number) => {
    setImportedQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری بانک سوالات دوره‌ها...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" dir="rtl">
      <TopAppBar
        title="بانک سوالات و مدیریت کوئیزها"
        subtitle="طراحی و مدیریت کوئیزهای ارزشیابی انتهای فیلم‌های آموزشی"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Right Column: Course Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-card/40 border border-border/40 rounded-lg shadow-sm">
              <CardHeader className="border-b border-border/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                  <GraduationCap className="size-4 text-primary" />
                  محتواهای آموزشی گالری
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1.5 pt-3">
                {courses.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-4 text-center">هیچ دوره‌ای در دیتابیس یافت نشد.</p>
                ) : (
                  courses.map((c) => (
                    <button
                      key={c.id}
                      className={cn(
                        'w-full text-right p-3 rounded-lg text-sm transition-all border cursor-pointer flex flex-col',
                        activeCourseId === c.id
                          ? 'bg-primary/5 text-primary font-semibold border-primary/20 border-r-4 border-l-transparent border-t-transparent border-b-transparent rounded-r-none'
                          : 'text-muted-foreground hover:bg-muted/30 hover:text-white border-transparent'
                      )}
                      onClick={() => {
                        setActiveCourseId(c.id)
                        setImportedQuestions([]) // Clear imports on course change
                      }}
                    >
                      <span className="text-xs text-muted-foreground mb-1">{c.category}</span>
                      <span className="truncate font-medium text-white">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1">
                        تعداد سوالات: {toFa(c.questions.length)} عدد
                      </span>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Importer Section */}
            <Card className="bg-card/40 border border-border/40 rounded-lg shadow-sm">
              <CardHeader className="border-b border-border/30 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                  <UploadCloud className="size-4 text-primary" />
                  ورود سؤالات از فایل
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  می‌توانید سؤالات خود را به‌صورت گروهی از فایل‌های اکسل، ورد (docx) یا PDF وارد کنید.
                </p>

                {/* Dropzone area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border border-dashed border-border/60 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-lg p-6 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center gap-3",
                    importingFile && "opacity-50 pointer-events-none"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.docx,.pdf"
                    className="hidden"
                  />
                  {importingFile ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">در حال تحلیل فایل...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs font-semibold text-white">انتخاب فایل سوالات</span>
                      <span className="text-[10px] text-muted-foreground">اکسل، Word یا PDF</span>
                    </>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground space-y-1 bg-muted/10 p-2.5 rounded-md border border-border/20">
                  <div className="font-semibold text-white mb-1">فرمت‌های استاندارد:</div>
                  <div>• اکسل: ستون اول صورت سوال، ستون‌های بعدی گزینه‌ها و پاسخ.</div>
                  <div>• ورد و PDF: سوال‌ها با شماره شروع شوند و گزینه‌ها الف، ب، ج، د باشند.</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Left Column: Quiz Editor & Imported Questions Preview (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Imported Questions Preview (Show only when imported questions exist) */}
            {importedQuestions.length > 0 && (
              <Card className="border border-emerald-500/30 bg-emerald-500/[0.02] rounded-lg shadow-sm">
                <CardHeader className="border-b border-emerald-500/20 pb-3 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                    <FileText className="size-4" />
                    سؤالات استخراج‌شده از فایل ({toFa(importedQuestions.length)} عدد)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setImportedQuestions([])}
                      className="h-8 text-xs border-border/40 hover:bg-muted/40 cursor-pointer"
                    >
                      <Undo className="size-3.5" />
                      <span>انصراف</span>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAcceptImported}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs cursor-pointer"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>تأیید و الحاق به کوئیز</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[400px] overflow-y-auto space-y-4">
                  {importedQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 border border-emerald-500/20 bg-emerald-500/[0.03] rounded-lg space-y-3 relative group">
                      <button
                        onClick={() => handleDeleteImportedQ(idx)}
                        className="absolute top-4 left-4 text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-md cursor-pointer transition-colors"
                        title="حذف سوال"
                      >
                        <Trash className="size-4" />
                      </button>

                      <div className="text-sm font-bold text-white leading-relaxed pe-10">
                        {toFa(idx + 1)}. {q.text}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={cn(
                              "text-xs p-2.5 rounded border text-muted-foreground",
                              q.answer === oIdx + 1 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold" 
                                : "bg-muted/30 border-border/20"
                            )}
                          >
                            {toFa(oIdx + 1)}) {opt}
                          </div>
                        ))}
                      </div>

                      {/* Dropdown to change correct option if parser got it wrong */}
                      <div className="flex items-center gap-2 pt-2 text-xs border-t border-emerald-500/10">
                        <span className="text-muted-foreground">گزینه صحیح:</span>
                        <select
                          value={q.answer}
                          onChange={(e) => handleUpdateImportedAnswer(idx, Number(e.target.value))}
                          className="px-2.5 py-1 bg-muted/80 border border-border/30 rounded text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                        >
                          <option value={1}>گزینه ۱</option>
                          <option value={2}>گزینه ۲</option>
                          <option value={3}>گزینه ۳</option>
                          <option value={4}>گزینه ۴</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 2. Active Quiz Header & List */}
            {activeCourse && (
              <Card className="bg-card/40 border border-border/40 rounded-lg shadow-sm">
                <CardHeader className="border-b border-border/30 pb-3 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Edit className="size-4 text-primary" />
                    مدیریت آزمون: {activeCourse.title}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    disabled={saving} 
                    className="gap-1.5 h-8 cursor-pointer bg-primary hover:bg-primary-hover text-white shadow" 
                    onClick={handleSaveChanges}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        <span>ذخیره نهایی</span>
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {activeCourse.questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-dashed border-border/40 rounded-lg">
                      <HelpCircle className="size-10 mb-3 opacity-50 text-muted-foreground" />
                      <p className="text-sm font-semibold">هیچ سوالی برای این دوره تعریف نشده است.</p>
                      <p className="text-xs text-muted-foreground mt-1">با فرم زیر سوال اضافه کنید یا فایل سوالات را آپلود کنید.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeCourse.questions.map((q, idx) => (
                        <div key={q.id} className="rounded-lg border border-border p-4 bg-muted/10 hover:bg-muted/20 transition-all duration-150 space-y-3 relative group">
                          <button
                            className="absolute top-4 left-4 text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-md cursor-pointer transition-colors"
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="حذف سوال"
                          >
                            <Trash className="size-4" />
                          </button>
                          
                          <h4 className="text-sm font-semibold text-white pe-10 leading-relaxed">
                            {toFa(idx + 1)}. {q.text}
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.answer === oIdx + 1
                              return (
                                <div
                                  key={oIdx}
                                  className={cn(
                                    'text-xs rounded-md p-2.5 border transition-all',
                                    isCorrect
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-semibold'
                                      : 'bg-muted/30 text-muted-foreground border-border/20',
                                  )}
                                >
                                  {toFa(oIdx + 1)}) {opt}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 3. Add Question Form */}
            {activeCourse && (
              <Card className="bg-card/40 border border-border/40 rounded-lg shadow-sm">
                <CardHeader className="border-b border-border/30 pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Plus className="size-4 text-primary" />
                    افزودن سوال جدید به کوئیز
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="q-text" className="text-right block text-xs font-semibold text-white">متن سوال:</Label>
                      <Textarea
                        id="q-text"
                        placeholder="متن سوال ارزیابی را بنویسید..."
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        className="text-right h-20 w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-red-500 transition resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="opt-1" className="text-right block text-xs font-semibold text-white">گزینه اول:</Label>
                        <Input
                          id="opt-1"
                          placeholder="گزینه ۱"
                          value={opt1}
                          onChange={(e) => setOpt1(e.target.value)}
                          className="text-right h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="opt-2" className="text-right block text-xs font-semibold text-white">گزینه دوم:</Label>
                        <Input
                          id="opt-2"
                          placeholder="گزینه ۲"
                          value={opt2}
                          onChange={(e) => setOpt2(e.target.value)}
                          className="text-right h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="opt-3" className="text-right block text-xs font-semibold text-white">گزینه سوم:</Label>
                        <Input
                          id="opt-3"
                          placeholder="گزینه ۳"
                          value={opt3}
                          onChange={(e) => setOpt3(e.target.value)}
                          className="text-right h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="opt-4" className="text-right block text-xs font-semibold text-white">گزینه چهارم:</Label>
                        <Input
                          id="opt-4"
                          placeholder="گزینه ۴"
                          value={opt4}
                          onChange={(e) => setOpt4(e.target.value)}
                          className="text-right h-9 w-full rounded-lg border border-border bg-muted/20 px-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="correct-opt" className="text-right block text-xs font-semibold text-white">گزینه صحیح:</Label>
                      <select
                        id="correct-opt"
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                        className="h-9 w-full rounded-lg border border-border bg-muted/20 px-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition cursor-pointer"
                      >
                        <option value={1}>گزینه ۱</option>
                        <option value={2}>گزینه ۲</option>
                        <option value={3}>گزینه ۳</option>
                        <option value={4}>گزینه ۴</option>
                      </select>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" size="sm" className="gap-1.5 cursor-pointer bg-primary hover:bg-primary-hover text-white">
                        <Plus className="size-4" />
                        <span>افزودن به لیست</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
