'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { Search, Heart, MessageSquare, CheckCircle2, ImageIcon, Video, Award, Newspaper, Lock } from 'lucide-react'

interface PostCard {
  id: string
  type: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  coverUrl: string | null
  mediaType: string | null
  mandatory: boolean
  createdAt: string
  authorName: string
  likeCount: number
  commentCount: number
  liked: boolean
  read: boolean
  prerequisiteId?: string | null
  prerequisiteTitle?: string | null
  prerequisiteSlug?: string | null
  prerequisiteCompleted?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  news: 'اخبار',
  blog: 'وبلاگ',
  training: 'آموزش',
  circular: 'بخش‌نامه',
  gallery: 'گالری',
}

const TYPE_FILTERS = ['', 'news', 'training', 'circular', 'blog', 'gallery']

export default function ContentPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [posts, setPosts] = useState<PostCard[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (typeFilter) params.set('type', typeFilter)
        if (q) params.set('q', q)
        const res = await fetch(`/api/posts?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setPosts(data.data as PostCard[])
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [accessToken, typeFilter, q])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground">
            اخبار و آموزش
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            آخرین اخبار، مقالات و محتوای آموزشی
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <Link href="/admin/content">
              <Button size="sm" className="h-9 text-xs gap-1.5 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded-lg shadow-md shadow-accent/15">
                <Newspaper className="size-4" />
                <span>مدیریت محتوا (ساخت نوشته)</span>
              </Button>
            </Link>
          )}
          <Link href="/learning/gallery">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 cursor-pointer">
              <Video className="size-4 text-accent" />
              <span>گالری ویدیوهای آموزشی</span>
            </Button>
          </Link>
          <Link href="/learning/exams">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 cursor-pointer border-accent/20 hover:bg-accent/5 text-accent">
              <Award className="size-4" />
              <span>کارنامه و گواهی‌نامه‌های من</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            placeholder="جستجو در محتوا..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs transition-colors',
                typeFilter === t
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-foreground-muted hover:bg-surface-hover',
              )}
            >
              {t ? TYPE_LABELS[t] : 'همه'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div role="status" className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">محتوایی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/content/${post.slug}`}>
              <Card className="h-full overflow-hidden transition-colors hover:border-accent/40">
                {post.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverUrl}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                )}
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <span className="rounded bg-background-subtle px-1.5 py-0.5">
                      {TYPE_LABELS[post.type] ?? post.type}
                    </span>
                    {post.mandatory && (
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                        خواندن اجباری
                      </span>
                    )}
                    {post.prerequisiteCompleted === false && user?.roleKey !== 'admin' && user?.roleKey !== 'super_admin' && (
                      <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive flex items-center gap-1 font-bold">
                        <Lock className="size-3" />
                        <span>قفل شده</span>
                      </span>
                    )}
                    {post.mediaType?.startsWith('video/') && (
                      <Video className="size-3.5" />
                    )}
                    {post.mediaType?.startsWith('image/') && (
                      <ImageIcon className="size-3.5" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1 text-xs text-foreground-muted">
                    <span>{jalali(post.createdAt)}</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart
                          className={cn('size-3.5', post.liked && 'fill-accent text-accent')}
                        />
                        {post.likeCount > 0 && post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3.5" />
                        {post.commentCount > 0 && post.commentCount}
                      </span>
                      {post.read && <CheckCircle2 className="size-3.5 text-success" />}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
