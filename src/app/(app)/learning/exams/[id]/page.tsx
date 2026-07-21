'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import ExamClient from './ExamClient'
import { Loader2 } from 'lucide-react'

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: examId } = use(params)
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/learning/exams/${examId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.data) {
          setExam(json.data)
        } else {
          router.push('/learning')
        }
      } catch (e) {
        console.error(e)
        router.push('/learning')
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId, accessToken, router])

  if (loading || !exam) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl min-h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-muted-foreground mt-2">
          زمان آزمون: {exam.durationMin} دقیقه | حدنصاب قبولی: {exam.passScore}٪
        </p>
      </div>

      <ExamClient examId={exam.id} durationMin={exam.durationMin} />
    </div>
  )
}
