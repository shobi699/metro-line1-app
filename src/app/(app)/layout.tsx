'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Sidebar, MobileHeader } from '@/components/shared/sidebar'
import { BulletinGuard } from '@/components/shared/bulletin-guard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[200] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        پرش به محتوا
      </a>
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <main id="main-content" className="flex flex-1 flex-col">
          <BulletinGuard>{children}</BulletinGuard>
        </main>
      </div>
    </div>
  )
}
