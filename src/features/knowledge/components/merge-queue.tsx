'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function MergeQueue() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/queue')
      const data = await res.json()
      setQueue(data.pending_merges || [])
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleResolve = async (index: number, approve: boolean) => {
    try {
      await fetch('http://localhost:8000/queue/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_index: index, approve })
      })
      // Refresh
      fetchQueue()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>صف تایید ادغام هویت‌ها (Identity Resolution)</CardTitle>
            <CardDescription>بررسی موجودیت‌های مشابه استخراج شده توسط LLM که نیاز به تایید انسانی دارند.</CardDescription>
          </div>
          <Button variant="outline" onClick={fetchQueue} disabled={loading}>
            {loading ? '...' : 'به‌روزرسانی'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-destructive mb-4">{error}</div>}
        
        {queue.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
            صف خالی است. هیچ هویت مشکوکی یافت نشد.
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item, i) => (
              <div key={i} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium text-lg">هویت استخراج‌شده جدید:</h4>
                  <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                    <span>نام خام: <strong className="text-foreground">{item.entity.name}</strong></span>
                    <span>شناسه: <code className="bg-muted px-1 rounded">{item.entity.norm_key}</code></span>
                    <span>نوع: <Badge variant="secondary">{item.entity.type}</Badge></span>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-3 rounded-md flex-1 text-center">
                  <span className="text-sm">تشابه بالا یافت شد ({Math.round(item.score * 100)}٪)</span>
                  <div className="font-bold text-primary text-lg mt-1">{item.matched_key}</div>
                </div>

                <div className="flex md:flex-col gap-2">
                  <Button onClick={() => handleResolve(i, true)} size="sm">تایید ادغام</Button>
                  <Button onClick={() => handleResolve(i, false)} size="sm" variant="destructive">رد ادغام (موجودیت مجزا)</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
