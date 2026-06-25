'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { jalali } from '@/lib/fa'
import { ArrowRight, BookOpen, Tag, Pencil } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  body: string
  category: string | null
  tags: string | null
  attachments: Array<{ url: string; name: string; type: string }> | null
  createdAt: string
  author?: { name: string }
}

export default function KnowledgeArticlePage() {
  const params = useParams()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadArticle() {
    if (!accessToken || !params.slug) return
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge/${params.slug}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setArticle(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadArticle()
  }, [accessToken, params.slug])

  if (loading) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center p-8">
        <div className="size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 select-none">
        <BookOpen className="size-12 text-foreground-muted opacity-45 animate-pulse" />
        <p className="text-sm text-foreground-muted">مقاله دانشنامه یافت نشد</p>
        <Link href="/knowledge">
          <Button variant="outline" size="sm">
            <ArrowRight className="size-4" />
            <span>بازگشت به دانشنامه</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4" dir="rtl">
      {/* Back Link & Edit button header */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3 select-none">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground font-semibold"
        >
          <ArrowRight className="size-4" />
          <span>بازگشت به دانش‌نامه خط ۱</span>
        </Link>
        {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
          <Link href={`/admin/knowledge?edit=${article.slug}`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer border-accent/30 text-accent hover:bg-accent/5 rounded-lg transition-all font-semibold shadow-sm">
              <Pencil className="size-3.5" />
              <span>ویرایش این مقاله دانشنامه</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Article Header */}
      <div className="space-y-3 bg-surface-container-low/25 p-4 rounded-xl border border-border-subtle">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground leading-relaxed">{article.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-foreground-muted font-mono border-t border-border/20 pt-2">
          <span>تاریخ صدور مقاله: {jalali(article.createdAt)}</span>
          {article.author && <span>نویسنده: {article.author.name}</span>}
          {article.category && (
            <Badge className="bg-accent/15 border-transparent text-accent text-[9px] font-bold select-none">
              {article.category}
            </Badge>
          )}
        </div>
        {article.tags && (
          <div className="flex flex-wrap gap-1 pt-1">
            {article.tags.split(',').map((tag, i) => (
              <Badge key={i} className="bg-neutral-900 border-neutral-800 text-[9px] text-neutral-400 font-medium select-none">
                <Tag className="size-2.5" />
                <span>{tag.trim()}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Article Body */}
      <Card className="border border-border-subtle bg-surface/30 backdrop-blur-md rounded-xl overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="prose prose-invert max-w-none text-sm leading-8 text-foreground text-right whitespace-pre-line">
            {article.body}
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {article.attachments && article.attachments.length > 0 && (
        <Card className="border border-border-subtle bg-surface/35 backdrop-blur shadow-sm rounded-xl">
          <CardHeader className="py-3 border-b border-border/20 bg-neutral-900/10">
            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-4 text-accent" />
              <span>پیوست‌ها و فایل‌های ضمیمه فنی</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {article.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/75 p-3 text-xs font-semibold transition-all hover:bg-surface-hover hover:border-accent/30"
                >
                  <span className="truncate max-w-[70%]">{att.name}</span>
                  <span className="text-[9px] text-foreground-muted font-mono uppercase bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">{att.type}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
