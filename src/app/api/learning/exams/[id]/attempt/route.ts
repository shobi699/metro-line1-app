import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { startExam } from '@/server/modules/learning/exam-service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params

  try {
    const attempt = await startExam(user.id, resolvedParams.id)
    
    // Remove correct answers from snapshot before sending to client
    const snapshot = JSON.parse(attempt.snapshot)
    const sanitizedSnapshot = snapshot.map((q: any) => {
      let optionsObj = {}
      try {
        optionsObj = JSON.parse(q.options)
        delete (optionsObj as any).correct
      } catch (e) {}
      return { ...q, options: JSON.stringify(optionsObj) }
    })
    
    return NextResponse.json({ 
      data: { 
        ...attempt, 
        snapshot: JSON.stringify(sanitizedSnapshot) 
      } 
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در شروع آزمون' } },
      { status: 400 }
    )
  }
}
