'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

// Types
export interface Rule {
  id: string
  key: string
  label: string
  description: string | null
  severity: 'error' | 'warning'
  isEnabled: boolean
}

export interface ValidationError {
  tripId?: string
  trainNumber?: string
  assignmentId?: string
  rawName?: string
  ruleKey: string
  message: string
  severity: 'error' | 'warning'
}

export function ValidationRulesPanel({ 
  versionId, 
  onValidationComplete 
}: { 
  versionId: string, 
  onValidationComplete?: (hasErrors: boolean) => void 
}) {
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (versionId) {
      runValidation()
    }
  }, [versionId])

  async function runValidation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/roster/validate/${versionId}`)
      const data = await res.json()
      if (data.success) {
        setErrors(data.errors)
        if (onValidationComplete) {
          onValidationComplete(data.errors.some((e: any) => e.severity === 'error'))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4 text-center">در حال اعتبارسنجی لوحه...</div>

  if (errors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-start gap-3">
        <CheckCircle className="h-5 w-5 mt-0.5" />
        <div>
          <h4 className="font-bold">تایید شد</h4>
          <p className="text-sm mt-1">لوحه با موفقیت از تمامی قواعد اعتبارسنجی عبور کرد و آماده انتشار است.</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader className="bg-red-50/50 pb-4">
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          گزارش خطاهای اعتبارسنجی
        </CardTitle>
        <CardDescription>موارد زیر پیش از انتشار لوحه نیاز به بررسی دارند.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
        <div className="space-y-3">
          {errors.map((error, idx) => (
            <div key={idx} className={`p-4 rounded-lg border flex items-start gap-3 ${error.severity === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {error.severity === 'error' ? <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" /> : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />}
              <div>
                <h4 className="font-bold">
                  {error.ruleKey === 'unresolved_alias' ? 'نام نامشخص' : 'تداخل / نقص'} (قطار {error.trainNumber || '—'})
                </h4>
                <p className="text-sm mt-1 opacity-90">
                  {error.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
