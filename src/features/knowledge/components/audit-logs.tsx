'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Shield, RefreshCw } from 'lucide-react'

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/audit-logs')
      const data = await res.json()
      setLogs(data.logs || [])
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              لاگ‌های سیستم (Audit Logs)
            </CardTitle>
            <CardDescription>ثبت فعالیت‌های حساس در موتور دانش (Ingest, Query, Merges) جهت مانیتورینگ امنیتی.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="text-destructive mb-4 text-sm">{error}</div>}
        
        {logs.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
            هیچ لاگی یافت نشد.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 items-start p-3 border rounded-md text-sm bg-muted/20">
                <div className="text-xs text-muted-foreground whitespace-nowrap pt-1 flex flex-col">
                  <span>{new Date(log.timestamp).toLocaleDateString('fa-IR')}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('fa-IR')}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-primary">{log.action}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{log.user}</span>
                  </div>
                  <p className="text-foreground">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
