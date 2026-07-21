'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Question {
  id: string
  text: string
  options: string // JSON string
  kind: string
}

interface ExamAttempt {
  id: string
  status: string
  score: number | null
}

export default function ExamClient({ examId, durationMin }: { examId: string, durationMin: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  const [timeLeft, setTimeLeft] = useState(durationMin * 60)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // Start Exam
  const startExam = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learning/exams/${examId}/attempt`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'خطا در شروع آزمون')
      
      setAttempt(json.data)
      setQuestions(JSON.parse(json.data.snapshot))
      setTimeLeft(durationMin * 60)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Submit Exam
  const submitExam = async () => {
    if (!attempt) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/learning/exams/attempt/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'خطا در ثبت آزمون')
      
      setResult(json.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Timer Effect
  useEffect(() => {
    if (!attempt || result || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          submitExam() // Auto submit when time is up
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [attempt, result, timeLeft])

  // Formatting Time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Not started yet
  if (!attempt && !result) {
    return (
      <Card className="w-full max-w-xl mx-auto mt-10 text-center shadow-lg">
        <CardHeader>
          <CardTitle>آماده‌اید؟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            پس از فشردن دکمه شروع، زمان شما محاسبه خواهد شد و امکان توقف وجود ندارد.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>خطا</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button size="lg" onClick={startExam} disabled={loading} className="w-full sm:w-auto px-12">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'شروع آزمون'}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Results screen
  if (result) {
    const isPassed = result.status === 'passed'
    return (
      <Card className="w-full max-w-xl mx-auto mt-10 text-center shadow-lg border-2" style={{ borderColor: isPassed ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
        <CardHeader className="pb-2">
          <div className="mx-auto bg-background p-4 rounded-full mb-4">
            {isPassed ? (
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto" />
            )}
          </div>
          <CardTitle className="text-3xl">{isPassed ? 'قبول شدید!' : 'متأسفانه قبول نشدید'}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="text-6xl font-bold text-primary mb-2">
            {result.score}٪
          </div>
          <p className="text-muted-foreground">
            {isPassed 
              ? 'تبریک! شما این دوره را با موفقیت به پایان رساندید و گواهینامه برای شما صادر شد.'
              : 'شما نمره قبولی را کسب نکردید. می‌توانید مجدداً در این آزمون شرکت کنید.'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-4">
          <Button size="lg" onClick={() => router.push('/learning')} className="w-full sm:w-auto px-12">
            بازگشت به مرکز آموزش
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Active Exam
  const currentQ = questions[currentQIndex]
  let currentOptions = {}
  try {
    currentOptions = JSON.parse(currentQ.options)
  } catch (e) {}

  const handleOptionChange = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
  }

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) setCurrentQIndex(prev => prev + 1)
  }
  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex(prev => prev - 1)
  }

  const progressPct = ((currentQIndex + 1) / questions.length) * 100

  return (
    <div className="flex flex-col flex-grow relative pb-20">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b border-border mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          <span className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-500' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="flex flex-col items-end w-1/2 md:w-1/3 gap-1">
          <div className="text-sm text-muted-foreground">سوال {currentQIndex + 1} از {questions.length}</div>
          <Progress value={progressPct} className="h-2 w-full" />
        </div>
      </div>

      <Card className="flex-grow shadow-md border-border/50">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed font-normal">
            {currentQ.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <RadioGroup 
            value={answers[currentQ.id] || ''} 
            onValueChange={handleOptionChange}
            className="space-y-4"
          >
            {Object.entries(currentOptions).map(([key, text]) => (
              <div key={key} className={`flex items-center space-x-2 space-x-reverse border rounded-lg p-4 transition-colors ${answers[currentQ.id] === key ? 'bg-primary/5 border-primary' : 'border-border hover:bg-muted/50'}`}>
                <RadioGroupItem value={key} id={`option-${key}`} />
                <Label htmlFor={`option-${key}`} className="flex-grow cursor-pointer text-base">
                  {text as string}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-20">
        <div className="container mx-auto max-w-4xl flex justify-between items-center">
          <Button variant="outline" onClick={handlePrev} disabled={currentQIndex === 0}>
            سوال قبلی
          </Button>
          
          {currentQIndex === questions.length - 1 ? (
            <Button onClick={submitExam} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-32 shadow-md">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'پایان و ثبت آزمون'}
            </Button>
          ) : (
            <Button onClick={handleNext} className="min-w-32 shadow-md">
              سوال بعدی
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="fixed top-20 right-4 left-4 z-50 max-w-md mx-auto">
          <Alert variant="destructive" className="shadow-lg animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
