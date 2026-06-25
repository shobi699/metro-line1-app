import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { ConfigLoader } from '@/components/shared/config-loader'

const vazirmatn = localFont({
  src: [
    {
      path: '../../public/fonts/Vazirmatn-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Vazirmatn-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Vazirmatn-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-vazirmatn',
})

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
      <body className={`${vazirmatn.variable} min-h-full flex flex-col`}>
        <ThemeProvider>
          <ConfigLoader />
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
