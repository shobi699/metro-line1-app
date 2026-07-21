'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function IngestForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const payload = {
      text: formData.get('text'),
      source_doc: formData.get('source_doc'),
      page: Number(formData.get('page') || 1),
      valid_from: formData.get('valid_from') || undefined
    }

    try {
      // Direct call to local knowledge engine for PoC
      const res = await fetch('http://localhost:8000/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ورود سند جدید (Ingestion)</CardTitle>
        <CardDescription>متن بخشنامه، قرارداد یا سند را وارد کنید تا استخراج موجودیت‌ها، روابط و بردارها انجام شود.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source_doc">نام سند (مثال: بخشنامه سرعت مجاز)</Label>
              <Input id="source_doc" name="source_doc" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page">شماره صفحه</Label>
              <Input id="page" name="page" type="number" defaultValue={1} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valid_from">تاریخ ابلاغ / شروع اعتبار (اختیاری)</Label>
            <Input id="valid_from" name="valid_from" placeholder="مثال: ۱۴۰۳-۰۵-۱۰" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">متن سند</Label>
            <Textarea 
              id="text" 
              name="text" 
              rows={8} 
              required 
              placeholder="متن سند را اینجا قرار دهید..." 
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'در حال پردازش (توسط LLM محلی)...' : 'ثبت و استخراج دانش'}
          </Button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-muted rounded-md overflow-auto text-left text-sm dir-ltr">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
