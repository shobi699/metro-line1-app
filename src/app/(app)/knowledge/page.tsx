'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { jalali } from '@/lib/fa'
import { BookOpen, Search, FileText, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  body: string
  category: string | null
  tags: string | null
  createdAt: string
  author?: { name: string }
}

export default function KnowledgePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    void loadArticles()
  }, [accessToken, selectedCategory])

  async function loadArticles() {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      if (search) params.set('q', search)

      const res = await fetch(`/api/knowledge?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setArticles(data.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'آموزش ایمنی',
    'آشنایی با تجهیزات',
    'رویه‌های اضطراری',
    'نقشه‌خوانی مسیر',
    'مقررات عمومی سیر و حرکت',
    'دستورالعمل بایکوت قطار',
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <BookOpen className="size-6 text-accent" />
            دانش‌نامه خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مخزن جست‌وجوپذیر دستورالعمل‌ها، فرم‌های فنی، نقشه‌ها و رویه‌های عملیاتی خط ۱ مترو تهران
          </p>
        </div>
        {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
          <Link href="/admin/knowledge" className="shrink-0">
            <Button size="sm" className="h-9 text-xs gap-1.5 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded-lg shadow-md shadow-accent/15 font-semibold">
              <Plus className="size-4" />
              <span>مدیریت دانشنامه</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadArticles()}
          placeholder="جستجو در مقالات، تگ‌ها و متون دانشنامه..."
          className="pe-9 ps-9"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="h-8 text-xs cursor-pointer rounded-lg"
        >
          همه مقالات
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="h-8 text-xs cursor-pointer rounded-lg"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Articles Grid / List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-background-subtle"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-3 size-10 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">مقاله‌ای در این دسته‌بندی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <div key={article.id} className="relative group">
              <Link href={`/knowledge/${article.slug}`} className="block">
                <Card className="transition-all hover:bg-surface-hover hover:border-accent/30 bg-surface/40 backdrop-blur-md rounded-xl overflow-hidden shadow-sm h-full flex flex-col justify-between">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-accent shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate max-w-[85%]">
                        {article.title}
                      </span>
                    </div>
                    {article.category && (
                      <Badge className="w-fit bg-accent/10 text-accent text-[10px] font-semibold border-transparent select-none">
                        {article.category}
                      </Badge>
                    )}
                    <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-foreground-muted border-t border-border/20 pt-2">
                      <span>تاریخ ثبت: {jalali(article.createdAt)}</span>
                      {article.author && <span>نویسنده: {article.author.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              {/* Overlay Edit Button for Admins */}
              {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Link href={`/admin/knowledge?edit=${article.slug}`}>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="size-8 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg border border-border/60 bg-background/85 backdrop-blur shadow-sm cursor-pointer"
                      title="ویرایش مقاله دانشنامه"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
