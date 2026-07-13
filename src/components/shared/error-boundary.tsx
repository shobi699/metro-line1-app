'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logToServer } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorState {
  error: Error | null
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({ error: null })

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      const err = event.error || new Error(event.message || 'Unknown error event')
      setErrorState({ error: err })
      logToServer({
        level: 'error',
        category: 'client-crash',
        message: err.message,
        stack: err.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      })
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason
      const err = reason instanceof Error ? reason : new Error(String(reason))
      setErrorState({ error: err })
      logToServer({
        level: 'error',
        category: 'client-unhandled-rejection',
        message: err.message,
        stack: err.stack,
        metadata: {
          reason: typeof reason === 'object' ? JSON.stringify(reason) : String(reason),
        }
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (errorState.error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-[fadeInUp_0.4s_ease-out]">
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="rounded-xl border border-critical/30 bg-surface-container shadow-lg p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-critical/10">
              <AlertTriangle className="size-7 text-critical" />
            </div>
            <h2 className="font-headline-md text-foreground mb-2">
              خطای سیستمی
            </h2>
            <p className="text-sm text-foreground-muted mb-4">
              متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.
            </p>
            <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <p className="font-data-mono text-xs text-foreground-muted leading-relaxed" dir="ltr">
                {errorState.error.message}
              </p>
            </div>
            <Button
              className="w-full h-11 gap-2"
              onClick={() => {
                setErrorState({ error: null })
                window.location.reload()
              }}
            >
              <RefreshCw className="size-4" />
              بارگذاری مجدد
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
