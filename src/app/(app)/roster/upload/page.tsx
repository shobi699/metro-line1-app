'use client'

import { useState } from 'react'
import { FileDrop } from '@/components/shared/file-drop'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/stores/auth'

interface ImportResult {
  successCount: number
  errorCount: number
  totalRows: number
  errors: Array<{ row: number; nationalId: string; reason: string }>
  needsReview: boolean
}

export default function RosterUploadPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleUpload(file: File) {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/roster/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const data = await res.json()
      setResult(data.data)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold tracking-tight">
        آپلود لیست شیفت
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            فایل شیفت را آپلود کنید
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDrop
            accept=".xlsx,.xls"
            onFile={handleUpload}
            disabled={loading}
          />
          {loading && (
            <p className="text-sm text-muted-foreground">
              در حال پردازش فایل...
            </p>
          )}
          {result && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="text-sm font-medium">نتیجه پردازش</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {toFa(result.totalRows)}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    کل ردیف‌ها
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-success">
                    {toFa(result.successCount)}
                  </div>
                  <div className="text-xs text-foreground-muted">موفق</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-destructive">
                    {toFa(result.errorCount)}
                  </div>
                  <div className="text-xs text-foreground-muted">خطا</div>
                </div>
              </div>

              {result.needsReview && (
                <div className="rounded-md bg-warning/10 p-3 text-sm text-warning">
                  برخی ردیف‌ها نیاز به بررسی دارند. لطفاً فایل را بررسی کنید.
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-foreground-muted">
                    جزئیات خطاها:
                  </h4>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="flex gap-2 text-xs text-destructive"
                      >
                        <span className="font-mono">ردیف {toFa(err.row)}</span>
                        <span>{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
