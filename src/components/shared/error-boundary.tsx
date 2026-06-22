'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

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
      setErrorState({ error: event.error })
    }

    function handleRejection(event: PromiseRejectionEvent) {
      setErrorState({ error: new Error(String(event.reason)) })
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-destructive" />
              خطای سیستمی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground-muted">
              متأسفانه خطایی رخ داده است. لطفاً دوباره تلاش کنید.
            </p>
            <p className="rounded-md bg-background-subtle p-3 font-mono text-xs text-foreground-muted">
              {errorState.error.message}
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setErrorState({ error: null })
                window.location.reload()
              }}
            >
              بارگذاری مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
