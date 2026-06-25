'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Plus, Trash, Save, GraduationCap, Edit, HelpCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'

interface Question {
  id: string
  text: string
  options: string[]
  answer: number // 1-indexed (1-4)
}

interface Course {
  id: string
  title: string
  category: string
  questions: Question[]
}

const INITIAL_COURSES: Course[] = [
  {
    id: 'post-1',
    title: 'مقررات عمومی سیر و حرکت خط ۱ (سیگنال‌ها)',
    category: 'مقررات عمومی',
    questions: [
      {
        id: 'q1-1',
        text: 'در صورت مشاهده سیگنال قرمز ثابت، فاصله مجاز توقف قطار چند متر است؟',
        options: ['10 متر', '50 متر', '100 متر', 'توقف فوری قبل از سیگنال'],
        answer: 4,
      },
      {
        id: 'q1-2',
        text: 'حداکثر سرعت مجاز در هنگام ورود به سوزن در حالت دستی چند کیلومتر بر ساعت است؟',
        options: ['15 کیلومتر بر ساعت', '25 کیلومتر بر ساعت', '40 کیلومتر بر ساعت', '5 کیلومتر بر ساعت'],
        answer: 1,
      },
    ],
  },
  {
    id: 'post-2',
    title: 'عیب‌یابی سیستم مکانیزم درب قطارهای سری ۱۰۰',
    category: 'عیب‌یابی فنی',
    questions: [
      {
        id: 'q2-1',
        text: 'کد خطای E102 در نمایشگر کابین به چه معناست؟',
        options: ['نقص ولتاژ کششی', 'مانع در مسیر درب یا عدم قفل درب واگن', 'نشت هوای ترمز', 'نقص سیستم تهویه مطبوع'],
        answer: 2,
      },
      {
        id: 'q2-2',
        text: 'در صورت قفل نشدن درب، راهبر مجاز به چه کاری است؟',
        options: [
          'ادامه حرکت با سرعت پایین',
          'ایزوله کردن واگن مربوطه و ادامه مسیر تا انتهای پایانه',
          'تخلیه کامل مسافرین و خروج به سمت دپو',
          'خاموش کردن سیستم ایمنی درب',
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'post-3',
    title: 'پروتکل ایمنی تخلیه مسافرین در داخل تونل مترو',
    category: 'ایمنی و بحران',
    questions: [
      {
        id: 'q3-1',
        text: 'اولین اقدام راهبر قطار در هنگام وقوع نقص فنی حاد در تونل چیست؟',
        options: ['تخلیه فوری مسافران', 'ارتباط فوری با مرکز فرمان (OCC) و گزارش وضعیت', 'راه اندازی مجدد برق کششی', 'اعلام خطر با آژیر قطار'],
        answer: 2,
      },
    ],
  },
]

export default function ExamsEditorPage() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES)
  const [activeCourseId, setActiveCourseId] = useState<string>('post-1')
  const [successMessage, setSuccessMessage] = useState('')

  // Form states for a new question
  const [newQuestionText, setNewQuestionText] = useState('')
  const [opt1, setOpt1] = useState('')
  const [opt2, setOpt2] = useState('')
  const [opt3, setOpt3] = useState('')
  const [opt4, setOpt4] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState(1)

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0]

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim()) return

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
          : c,
      ),
    )

    // Clear inputs
    setNewQuestionText('')
    setOpt1('')
    setOpt2('')
    setOpt3('')
    setOpt4('')
    setCorrectAnswer(1)

    setSuccessMessage('سوال با موفقیت به پیش‌نویس آزمون اضافه شد.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteQuestion = (qId: string) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === activeCourseId
          ? { ...c, questions: c.questions.filter((q) => q.id !== qId) }
          : c,
      ),
    )
  }

  const handleSaveChanges = () => {
    setSuccessMessage('تغییرات آزمون و بانک سوالات با موفقیت ذخیره و در سامانه کاربران منتشر گردید.')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="بانک سوالات و مدیریت کوئیزها"
        subtitle="طراحی و مدیریت کوئیزهای ارزشیابی انتهای فیلم‌های آموزشی"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-xs text-success animate-in fade-in duration-150">
            <CheckCircle className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Right Column (in RTL is start): Courses selection list (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="border-b border-border-subtle/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <GraduationCap className="size-4 text-accent" />
                  محتواهای آموزشی گالری
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1.5 pt-3">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    className={cn(
                      'w-full text-right p-3 rounded-lg text-sm transition-all duration-150 border cursor-pointer',
                      activeCourseId === c.id
                        ? 'bg-accent/5 text-accent font-semibold border-accent/20 border-r-4 border-l-transparent border-t-transparent border-b-transparent rounded-r-none'
                        : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground border-transparent',
                    )}
                    onClick={() => setActiveCourseId(c.id)}
                  >
                    <div className="text-xs text-foreground-muted mb-1">{c.category}</div>
                    <div className="truncate font-medium">{c.title}</div>
                    <div className="text-[10px] text-foreground-muted font-mono mt-1">
                      تعداد سوالات: {toFa(c.questions.length)} عدد
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Left Column (in RTL is end): Quiz Editor (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Active Quiz Header & List */}
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="border-b border-border-subtle/50 pb-3 flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Edit className="size-4 text-accent" />
                  مدیریت آزمون: {activeCourse.title}
                </CardTitle>
                <Button size="sm" variant="default" className="gap-1.5 h-8 cursor-pointer" onClick={handleSaveChanges}>
                  <Save className="size-4" />
                  <span>ذخیره نهایی</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {activeCourse.questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-foreground-muted">
                    <HelpCircle className="size-10 mb-2 opacity-50 text-foreground-muted" />
                    <p className="text-sm">هیچ سوالی برای این دوره تعریف نشده است.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCourse.questions.map((q, idx) => (
                      <div key={q.id} className="rounded-lg border border-border p-4 bg-surface/40 hover:bg-surface/60 transition-all duration-150 space-y-3 relative group">
                        <button
                          className="absolute top-4 left-4 text-critical hover:bg-critical/10 p-1.5 rounded-md cursor-pointer transition-colors"
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="حذف سوال"
                        >
                          <Trash className="size-4" />
                        </button>
                        <h4 className="text-sm font-semibold text-foreground pe-10 leading-relaxed">
                          {toFa(idx + 1)}. {toFa(q.text)}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = q.answer === oIdx + 1
                            return (
                              <div
                                key={oIdx}
                                className={cn(
                                  'text-xs rounded-md p-2.5 border transition-all duration-150',
                                  isCorrect
                                    ? 'bg-success/10 text-success border-success/30 font-semibold'
                                    : 'bg-background-subtle/50 text-foreground-muted border-border-subtle',
                                )}
                              >
                                {toFa(oIdx + 1)}) {toFa(opt)}
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

            {/* Add Question Form */}
            <Card className="bg-surface/50 backdrop-blur-md border border-border-subtle rounded-lg">
              <CardHeader className="border-b border-border-subtle/50 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Plus className="size-4 text-accent" />
                  افزودن سوال جدید به کوئیز
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-text" className="text-right block text-xs font-semibold text-foreground">متن سوال:</Label>
                    <Textarea
                      id="q-text"
                      placeholder="متن سوال ارزیابی را بنویسید..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="text-right h-20 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="opt-1" className="text-right block text-xs font-semibold text-foreground">گزینه اول:</Label>
                      <Input
                        id="opt-1"
                        placeholder="گزینه ۱"
                        value={opt1}
                        onChange={(e) => setOpt1(e.target.value)}
                        className="text-right h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="opt-2" className="text-right block text-xs font-semibold text-foreground">گزینه دوم:</Label>
                      <Input
                        id="opt-2"
                        placeholder="گزینه ۲"
                        value={opt2}
                        onChange={(e) => setOpt2(e.target.value)}
                        className="text-right h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="opt-3" className="text-right block text-xs font-semibold text-foreground">گزینه سوم:</Label>
                      <Input
                        id="opt-3"
                        placeholder="گزینه ۳"
                        value={opt3}
                        onChange={(e) => setOpt3(e.target.value)}
                        className="text-right h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="opt-4" className="text-right block text-xs font-semibold text-foreground">گزینه چهارم:</Label>
                      <Input
                        id="opt-4"
                        placeholder="گزینه ۴"
                        value={opt4}
                        onChange={(e) => setOpt4(e.target.value)}
                        className="text-right h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="correct-opt" className="text-right block text-xs font-semibold text-foreground">گزینه صحیح:</Label>
                    <select
                      id="correct-opt"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150 cursor-pointer"
                    >
                      <option value={1}>گزینه ۱</option>
                      <option value={2}>گزینه ۲</option>
                      <option value={3}>گزینه ۳</option>
                      <option value={4}>گزینه ۴</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="sm" className="gap-1.5 cursor-pointer">
                      <Plus className="size-4" />
                      <span>افزودن به لیست</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

