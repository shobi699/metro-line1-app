'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import { jdate } from '@/lib/dayjs'
import { toast } from 'sonner'
import {
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
  Loader2,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  title: string
  icon: string | null
}

interface Idea {
  id: string
  title: string
  body: string
  status: string
  type: string
  ideaVotesCount: number
  hasVoted: boolean
  createdAt: string
  category: Category | null
  feedbackNo: number
}

export default function IdeasPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'votes' | 'recent' | 'oldest'>('votes')

  useEffect(() => {
    fetchIdeas()
  }, [sort, accessToken])

  async function fetchIdeas() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feedback/ideas?sort=${sort}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setIdeas(json.data || [])
      } else {
        toast.error('خطا در دریافت لیست ایده‌ها')
      }
    } catch (error) {
      toast.error('خطای شبکه')
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(ideaId: string, currentlyVoted: boolean) {
    if (!accessToken) return

    // Optimistic update
    setIdeas(prev => prev.map(idea => {
      if (idea.id === ideaId) {
        return {
          ...idea,
          hasVoted: !currentlyVoted,
          ideaVotesCount: idea.ideaVotesCount + (currentlyVoted ? -1 : 1)
        }
      }
      return idea
    }))

    try {
      // The vote API usually toggles the vote
      const res = await fetch(`/api/feedback/${ideaId}/vote`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        throw new Error('Vote failed')
      }
    } catch (error) {
      // Revert on error
      toast.error('ثبت رای با خطا مواجه شد')
      fetchIdeas()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-success/15 text-success font-bold">
            <CheckCircle2 className="size-3" />
            اجرا شده
          </span>
        )
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-info/15 text-info font-bold">
            <Loader2 className="size-3 animate-spin" />
            در دست بررسی
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-foreground-muted font-bold">
            ثبت شده
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-surface px-4 py-6 border-b border-outline-variant shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Lightbulb className="size-6 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">تابلوی ایده‌ها</h1>
                <p className="text-xs text-foreground-muted mt-1 font-medium">
                  پیشنهادهای همکاران را بخوانید و به بهترین‌ها رأی دهید.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSort('votes')}
              className={cn(
                "rounded-full text-xs font-bold h-8 transition-colors",
                sort === 'votes' ? "bg-accent/15 text-accent border-accent/30" : "text-foreground-muted bg-surface-container"
              )}
            >
              <TrendingUp className="size-3.5 ms-1.5" />
              پربحث‌ترین‌ها
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSort('recent')}
              className={cn(
                "rounded-full text-xs font-bold h-8 transition-colors",
                sort === 'recent' ? "bg-accent/15 text-accent border-accent/30" : "text-foreground-muted bg-surface-container"
              )}
            >
              <Clock className="size-3.5 ms-1.5" />
              جدیدترین‌ها
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Loader2 className="size-8 animate-spin text-accent" />
              <p className="text-xs text-foreground-muted font-medium">در حال دریافت ایده‌ها...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-surface border border-outline-variant rounded-2xl border-dashed">
              <Lightbulb className="size-10 text-foreground-muted/30 mb-3" />
              <p className="text-sm font-bold text-foreground">هیچ ایده عمومی یافت نشد.</p>
              <p className="text-xs text-foreground-muted mt-1">پیشنهادهای ثبت‌شده پس از تایید مدیر عمومی می‌شوند.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ideas.map((idea, index) => (
                <div 
                  key={idea.id} 
                  className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col transition-all hover:border-accent/40 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-foreground-muted bg-surface-container px-1.5 py-0.5 rounded">
                        FB-{toFa(idea.feedbackNo)}
                      </span>
                      {idea.category?.title && (
                        <span className="text-[10px] font-bold text-foreground-muted">
                          {idea.category.title}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(idea.status)}
                  </div>
                  
                  <h3 className="text-sm font-bold text-foreground leading-tight mb-2">
                    {idea.title}
                  </h3>
                  
                  <p className="text-xs text-foreground-muted leading-relaxed line-clamp-3 mb-4 flex-1">
                    {idea.body}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div className="text-[10px] text-foreground-muted font-medium">
                      {toFa(jdate(idea.createdAt).format('YYYY/MM/DD'))}
                    </div>
                    
                    <button
                      onClick={() => handleVote(idea.id, idea.hasVoted)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer",
                        idea.hasVoted 
                          ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20" 
                          : "bg-surface-container text-foreground-muted hover:bg-neutral-800"
                      )}
                    >
                      <ThumbsUp className={cn("size-3.5", idea.hasVoted && "fill-current")} />
                      {toFa(idea.ideaVotesCount)} رأی
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
