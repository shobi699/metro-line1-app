import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'مدار خط یک — سامانه سیر و حرکت مترو تهران',
  description:
    'سامانه یکپارچه مدیریت عملیات، شیفت‌ها، ایمنی و ارتباطات پرسنل خط ۱ مترو تهران',
}

export default function Home() {
  return <LandingPage />
}
