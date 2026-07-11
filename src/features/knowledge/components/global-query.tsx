'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

export function GlobalQuery() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')

    const formData = new FormData(e.currentTarget)
    const payload = {
      query: formData.get('query'),
    }

    try {
      const res = await fetch('http://localhost:8000/global-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>جستجو و خلاصه‌سازی کلان (Global RAG)</CardTitle>
        <CardDescription>طرح پرسش‌های تحلیلی و کلان که نیازمند درک تمامی اسناد و گراف‌های موجود هستند. (مانند: روند کلی قراردادهای نگهداشت چیست؟)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">پرسش کلان شما</Label>
            <div className="flex gap-2">
              <Input 
                id="query" 
                name="query" 
                required 
                placeholder="مثال: وضعیت کلی خرابی‌ها در بخشنامه‌ها چگونه بررسی می‌شود؟" 
              />
              <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                <Search className="h-4 w-4" />
                {loading ? 'در حال تحلیل...' : 'تحلیل کلان (L4)'}
              </Button>
            </div>
          </div>
        </form>

        {error && <div className="mt-4 text-destructive text-sm">{error}</div>}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-muted/30 border rounded-md">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Search className="h-4 w-4" /> پاسخ تحلیلی استخراج شده:
              </h4>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.summary}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground flex gap-4 bg-muted p-2 rounded">
              <span>مسیر پاسخ: <strong className="text-foreground">{result.source}</strong></span>
              <span>زمان پردازش بسته به حجم گراف متغیر است (LLM Map-Reduce).</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
