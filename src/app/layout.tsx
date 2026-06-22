import type { Metadata } from 'next'
import '@fontsource-variable/vazirmatn'
import './globals.css'

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
    <html dir="rtl" lang="fa" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
