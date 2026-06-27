import type { Metadata } from 'next'
import '@fontsource-variable/vazirmatn'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { ConfigLoader } from '@/components/shared/config-loader'

export const metadata: Metadata = {
  title: 'مترو خط ۱',
  description: 'سیستم مدیریت خط ۱ مترو تهران',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html dir="rtl" lang="fa" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ConfigLoader />
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
