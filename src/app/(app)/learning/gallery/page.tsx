'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Video, Play, Search, Clock, Award, CheckCircle2, Bookmark, Pencil, Plus, Lock } from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface VideoItem {
  id: string
  title: string
  slug: string
  excerpt: string
  duration: string
  category: string
  coverUrl: string
  mediaUrl: string
  mandatory: boolean
  points: number
  isCompleted: boolean
  prerequisiteId?: string | null
  prerequisiteTitle?: string | null
  prerequisiteSlug?: string | null
  prerequisiteCompleted?: boolean
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'دستورالعمل بایکوت و ایزولاسیون ترمز واگن قطار سری ۱۰۰',
    slug: 'عیب‌یابی-سیستم-مکانیزم-درب-قطارهای-سری-۱۰۰',
    excerpt: 'آموزش گام‌به‌گام نحوه ایزولاسیون مکانیکی ترمز در زمان بروز نقص فنی حاد در حین سیر خط ۱.',
    duration: '۱۲:۴۵',
    category: 'عیب‌یابی فنی',
    coverUrl: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=600&q=80',
    mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    mandatory: true,
    points: 50,
    isCompleted: true,
  },
  {
    id: 'vid-2',
    title: 'پروتکل ایمنی تخلیه اضطراری مسافرین در داخل تونل خط ۱',
    slug: 'پروتکل-ایمنی-تخلیه-مسافرین-در-داخل-تونل-مترو',
    excerpt: 'رویه‌های هماهنگی با مرکز فرمان (OCC) و چگونگی هدایت امن مسافران به خارج از قطار در مواقع بحرانی.',
    duration: '۱۸:۲۰',
    category: 'ایمنی و بحران',
    coverUrl: 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?auto=format&fit=crop&w=600&q=80',
    mediaUrl: 'https://www.w3schools.com/html/movie.mp4',
    mandatory: true,
    points: 50,
    isCompleted: false,
  },
  {
    id: 'vid-3',
    title: 'سیگنال‌های ثابت و متغیر دیسپاچینگ و قوانین سوزن‌های تجریش',
    slug: 'مقررات-عمومی-سیر-و-حرکت-خط-۱-سیگنال‌ها',
    excerpt: 'آشنایی جامع با سیگنال‌های نوری ثابت و رفتارهای ایمن راهبران در محدوده بلاک‌های ورودی پایانه تجریش.',
    duration: '۰۹:۱۵',
    category: 'مقررات عمومی',
    coverUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80',
    mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    mandatory: false,
    points: 50,
    isCompleted: false,
  },
]

export default function LearningGalleryPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [videos, setVideos] = useState<VideoItem[]>(SAMPLE_VIDEOS)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // لود ویدیوهای پویا از دیتابیس در صورت تمایل و ادغام با نمونه‌ها
  useEffect(() => {
    if (!accessToken) return
    async function fetchVideos() {
      try {
        const res = await fetch('/api/posts?type=gallery', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data && data.data.length > 0) {
            // انطباق دادن با ساختار ویدیو کارت
            const formatted = data.data.map((p: any) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              excerpt: p.excerpt || '',
              duration: '۱۰:۰۰', // فرضی
              category: p.category || 'آموزش عمومی',
              coverUrl: p.coverUrl || 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=600&q=80',
              mediaUrl: p.mediaUrl || '',
              mandatory: p.mandatory || false,
              points: 50,
              isCompleted: p.isCompleted || p.read || false,
              prerequisiteId: p.prerequisiteId || null,
              prerequisiteTitle: p.prerequisiteTitle || null,
              prerequisiteSlug: p.prerequisiteSlug || null,
              prerequisiteCompleted: p.prerequisiteCompleted !== undefined ? p.prerequisiteCompleted : true,
            }))
            // ادغام با سمپل‌ها بدون تکرار
            setVideos((prev) => {
              const ids = new Set(formatted.map((v: any) => v.id))
              const filteredPrev = prev.filter((v) => !ids.has(v.id))
              return [...formatted, ...filteredPrev]
            })
          }
        }
      } catch {
        // fall back to sample videos
      }
    }
    fetchVideos()
  }, [accessToken])

  const filteredVideos = videos.filter((vid) => {
    const matchesSearch = vid.title.includes(searchTerm) || vid.excerpt.includes(searchTerm)
    const matchesCategory = categoryFilter === 'all' || vid.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(videos.map((v) => v.category)))]

  const totalPoints = videos.filter((v) => v.isCompleted).reduce((sum, v) => sum + v.points, 0)
  const completedCount = videos.filter((v) => v.isCompleted).length

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="گالری ویدیوهای آموزشی"
        subtitle="ویدیوهای شبیه‌ساز و دستورالعمل‌های فنی راهبران خط ۱ مترو"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* Admin Quick Action Panel */}
        {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-accent/25 bg-accent/5 gap-3 select-none">
            <span className="text-xs font-semibold text-accent flex items-center gap-2">
              <Video className="size-4 animate-pulse shrink-0" />
              <span>شما به عنوان مدیر یا سرپرست وارد شده‌اید. می‌توانید ویدیوهای آموزشی گالری را در کارگاه وردپرس مدیریت کنید:</span>
            </span>
            <Link href="/admin/content" className="shrink-0 w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto h-8 text-xs gap-1 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded-lg font-bold shadow-sm">
                <Plus className="size-3.5" />
                <span>ساخت ویدیو آموزشی جدید</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Top learning statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="bg-success/5 border border-success/20 hover:border-success/30 hover:bg-success/10 transition-all duration-150 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">ویدیوهای تکمیل‌شده</p>
                <h3 className="text-base font-bold mt-1 text-foreground">
                  {toFa(completedCount)} از {toFa(videos.length)} ویدیو
                </h3>
              </div>
              <div className="bg-success/10 p-2.5 rounded-md text-success border border-success/20">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border border-accent/20 hover:border-accent/30 hover:bg-accent/10 transition-all duration-150 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">امتیاز آموزشی کسب‌شده</p>
                <h3 className="text-base font-bold mt-1 text-accent">
                  {toFa(totalPoints)} امتیاز
                </h3>
              </div>
              <div className="bg-accent/10 p-2.5 rounded-md text-accent border border-accent/20">
                <Award className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warning/5 border border-warning/20 hover:border-warning/30 hover:bg-warning/10 transition-all duration-150 rounded-lg">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground-muted">ویدیوهای اجباری باقیمانده</p>
                <h3 className="text-base font-bold mt-1 text-warning">
                  {toFa(videos.filter((v) => v.mandatory && !v.isCompleted).length)} ویدیو ارزیابی نشده
                </h3>
              </div>
              <div className="bg-warning/10 p-2.5 rounded-md text-warning border border-warning/20">
                <Bookmark className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="جستجو در عنوان یا متن ویدیوهای آموزشی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs shrink-0 cursor-pointer"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'all' ? 'همه دسته‌ها' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((vid) => {
            const isLocked = vid.prerequisiteCompleted === false && user?.roleKey !== 'admin' && user?.roleKey !== 'super_admin'
            return (
              <Card key={vid.id} className={cn(
                "overflow-hidden border border-border-subtle bg-surface/50 backdrop-blur-md flex flex-col h-full group transition-all duration-300 rounded-lg relative",
                isLocked ? "border-destructive/10" : "hover:border-accent/30"
              )}>
                {/* Thumbnail Container */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vid.coverUrl}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70"
                  />
                  
                  {isLocked ? (
                    /* Locked Glassmorphic Overlay */
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 select-none z-10">
                      <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3 rounded-full animate-pulse">
                        <Lock className="size-6" />
                      </div>
                      <span className="text-[11px] font-extrabold text-destructive tracking-wide">این دوره آموزشی قفل است</span>
                    </div>
                  ) : (
                    /* Hover Action Overlay */
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-3">
                        <Link href={`/content/${vid.slug}`}>
                          <Button size="icon" className="rounded-full bg-accent hover:bg-accent-hover text-white size-12 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300 cursor-pointer" title="مشاهده ویدیو و کوئیز">
                            <Play className="size-6 fill-current pr-0.5" />
                          </Button>
                        </Link>
                        {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                          <Link href={`/admin/content?edit=${vid.id}`}>
                            <Button size="icon" variant="outline" className="rounded-full bg-background/80 hover:bg-background border-border text-foreground size-12 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300 cursor-pointer" title="ویرایش ویدیو در کارگاه">
                              <Pencil className="size-5 text-accent" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1.5 border border-neutral-800">
                    <Clock className="size-3 text-neutral-400" />
                    <span>{toFa(vid.duration)}</span>
                  </div>

                  {/* Left Top Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end z-20">
                    {vid.mandatory && (
                      <Badge className="bg-critical/95 text-white border-transparent text-[9px] font-semibold rounded-md px-1.5 py-0.5">
                        آموزش اجباری
                      </Badge>
                    )}
                    {vid.isCompleted && (
                      <Badge className="bg-success/95 text-white border-transparent text-[9px] font-semibold rounded-md px-1.5 py-0.5 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        کوییز تایید شد
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <CardContent className="p-4 flex flex-col flex-1 gap-2">
                  <div className="text-[10px] text-accent font-semibold">{vid.category}</div>
                  <h4 className="text-sm font-bold text-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                    {vid.title}
                  </h4>
                  <p className="text-xs text-foreground-muted line-clamp-3 leading-relaxed">
                    {vid.excerpt}
                  </p>

                  {/* Points and Action Button */}
                  <div className="mt-auto pt-3 border-t border-border-subtle/50 flex flex-col gap-2.5">
                    {isLocked ? (
                      <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-2 flex flex-col gap-1.5 text-right">
                        <span className="text-[10px] text-destructive font-bold flex items-center gap-1">
                          <span>⚠️ نیاز به گذراندن دوره پیش‌نیاز:</span>
                        </span>
                        {vid.prerequisiteSlug ? (
                          <Link href={`/content/${vid.prerequisiteSlug}`} className="text-[11px] text-accent hover:underline font-semibold truncate">
                            {vid.prerequisiteTitle}
                          </Link>
                        ) : (
                          <span className="text-[11px] text-foreground-muted truncate">دوره پیش‌نیاز نامشخص</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-foreground-muted">
                          <Award className="size-3.5 text-accent animate-pulse" />
                          <span>امتیاز کوئیز: {toFa(vid.points)}</span>
                        </div>
                        <Link href={`/content/${vid.slug}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-accent hover:text-accent-hover hover:bg-transparent p-0 cursor-pointer gap-1 transition-transform group-hover:translate-x-[-2px]">
                            <span>مشاهده و کوئیز</span>
                            <span>←</span>
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
