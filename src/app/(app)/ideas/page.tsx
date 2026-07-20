'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa } from '@/lib/fa'
import { jdate } from '@/lib/dayjs'
import { toast } from 'sonner'
import {
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Search,
  Plus,
  EyeOff,
  User,
  Copy,
  Info,
  Award,
  MessageCircle,
  Send,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Category {
  id: string
  title: string
  icon: string | null
  ideaBoard?: boolean
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
  isAnonymous: boolean
  user?: { name: string } | null
  formData?: any
  anonToken?: string | null
}

export default function IdeasPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  
  // Tabs: 'public' (تابلوی عمومی) or 'my' (ایده‌های من)
  const [activeViewTab, setActiveViewTab] = useState<'public' | 'my'>('public')

  // States
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [myIdeas, setMyIdeas] = useState<Idea[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMy, setLoadingMy] = useState(false)
  const [sort, setSort] = useState<'votes' | 'recent' | 'oldest'>('votes')
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Submit Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    body: '',
    categoryId: '',
    isAnonymous: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // Token Success Modal States
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [newAnonToken, setNewAnonToken] = useState('')
  const [newFeedbackNo, setNewFeedbackNo] = useState(0)

  // Detail Modal / Chat Thread States
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [threadMessages, setThreadMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessageText, setNewMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const fetchIdeas = useCallback(async () => {
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
    } catch {
      toast.error('خطای شبکه')
    } finally {
      setLoading(false)
    }
  }, [accessToken, sort])

  const fetchMyIdeas = useCallback(async () => {
    if (!accessToken) return
    setLoadingMy(true)
    try {
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const items = json.data?.items || []
        // Filter suggestions or ideas
        const userSuggestions = items.filter((item: any) => item.type === 'suggestion' || item.isPublicIdea === true)
        setMyIdeas(userSuggestions)
      } else {
        toast.error('خطا در دریافت ایده‌های من')
      }
    } catch {
      toast.error('خطای شبکه در دریافت ایده‌های من')
    } finally {
      setLoadingMy(false)
    }
  }, [accessToken])

  const fetchCategories = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/feedback/categories', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const cats = json.data || []
        // Filter categories that can have ideas, or keep all active ones
        const ideaCats = cats.filter((c: { ideaBoard?: boolean; key?: string }) => c.ideaBoard || c.key === 'suggestions' || c.key === 'suggestions-ideas')
        const activeCats = ideaCats.length > 0 ? ideaCats : cats
        setCategories(activeCats)
        if (activeCats.length > 0) {
          setForm(prev => ({ ...prev, categoryId: activeCats[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [accessToken])

  useEffect(() => {
    fetchIdeas()
    fetchCategories()
    if (accessToken) {
      fetchMyIdeas()
    }
  }, [fetchIdeas, fetchCategories, fetchMyIdeas, accessToken])

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
    } catch {
      toast.error('ثبت رای با خطا مواجه شد')
      fetchIdeas()
    }
  }

  async function handleSubmitIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('لطفاً عنوان و شرح ایده را وارد کنید')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'suggestion',
          title: form.title,
          body: form.body,
          categoryId: form.categoryId || undefined,
          isAnonymous: form.isAnonymous,
          isPublicIdea: true, // Mark it public so it can be shown on ideas board
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data?.anonToken) {
          setNewAnonToken(json.data.anonToken)
          setNewFeedbackNo(json.data.feedbackNo)
          setShowTokenModal(true)
        } else {
          toast.success(`ایده شما با شماره FB-${toFa(json.data?.feedbackNo)} با موفقیت ثبت شد و پس از تایید مدیریت نمایش داده می‌شود.`)
        }
        // Reset form
        setForm(prev => ({
          ...prev,
          title: '',
          body: '',
          isAnonymous: false
        }))
        setShowSubmitModal(false)
        fetchIdeas()
        fetchMyIdeas()
      } else {
        const json = await res.json()
        toast.error(json.error?.message || 'خطا در ثبت ایده')
      }
    } catch {
      toast.error('خطای شبکه در ثبت ایده')
    } finally {
      setSubmitting(false)
    }
  }

  async function openConversation(idea: Idea) {
    setSelectedIdea(idea)
    setThreadMessages([])
    setLoadingMessages(true)
    setNewMessageText('')
    
    const tokenParam = idea.isAnonymous && idea.anonToken ? `?anonToken=${idea.anonToken}` : ''
    try {
      const res = await fetch(`/api/feedback/${idea.id}${tokenParam}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setThreadMessages(json.data?.messages || [])
      }
    } catch {
      toast.error('خطا در دریافت پیام‌ها')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function handleSendMessage() {
    if (!selectedIdea || !newMessageText.trim() || sendingMessage) return
    setSendingMessage(true)
    const tokenParam = selectedIdea.isAnonymous && selectedIdea.anonToken ? `?anonToken=${selectedIdea.anonToken}` : ''
    try {
      const res = await fetch(`/api/feedback/${selectedIdea.id}/messages${tokenParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ body: newMessageText.trim() })
      })
      if (res.ok) {
        const json = await res.json()
        setThreadMessages(prev => [...prev, json.data])
        setNewMessageText('')
      } else {
        toast.error('خطا در ارسال پیام')
      }
    } catch {
      toast.error('خطای شبکه در ارسال پیام')
    } finally {
      setSendingMessage(false)
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
      case 'under_review':
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-warning/15 text-warning font-bold">
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

  // Filter ideas
  const filteredIdeas = (activeViewTab === 'public' ? ideas : myIdeas).filter(idea => {
    const matchesSearch = searchQuery.trim() === '' || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      idea.body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || idea.category?.id === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-surface px-4 py-6 border-b border-outline-variant shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Lightbulb className="size-6 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">تابلوی ایده‌ها و پیشنهادات</h1>
                <p className="text-xs text-foreground-muted mt-1 font-medium">
                  پیشنهادهای همکاران را بخوانید، رأی دهید و ایده خود را ثبت کنید.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowSubmitModal(true)}
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs gap-1.5 px-4 py-2 rounded-xl shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="size-4" />
              ثبت ایده جدید
            </Button>
          </div>
          
          {/* Main View Tabs (All / My Ideas) */}
          <div className="flex gap-1 border-b border-border/50 pb-px text-xs font-semibold mt-6">
            <button
              onClick={() => setActiveViewTab('public')}
              className={cn(
                'pb-2 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                activeViewTab === 'public'
                  ? 'border-accent text-accent font-extrabold'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
            >
              <Lightbulb className="size-3.5" />
              تابلوی عمومی ایده‌ها
            </button>
            <button
              onClick={() => setActiveViewTab('my')}
              className={cn(
                'pb-2 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                activeViewTab === 'my'
                  ? 'border-accent text-accent font-extrabold'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              )}
            >
              <User className="size-3.5" />
              ایده‌های من (پنل کاربری)
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSort('votes')}
                className={cn(
                  "rounded-full text-xs font-bold h-8 transition-colors cursor-pointer",
                  sort === 'votes' ? "bg-accent/15 text-accent border-accent/30" : "text-foreground-muted bg-surface-container"
                )}
              >
                <TrendingUp className="size-3.5 ms-1.5" />
                محبوب‌ترین‌ها
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSort('recent')}
                className={cn(
                  "rounded-full text-xs font-bold h-8 transition-colors cursor-pointer",
                  sort === 'recent' ? "bg-accent/15 text-accent border-accent/30" : "text-foreground-muted bg-surface-container"
                )}
              >
                <Clock className="size-3.5 ms-1.5" />
                جدیدترین‌ها
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی ایده..."
                  className="ps-9 bg-surface-container border-outline-variant text-xs h-9 rounded-xl w-full"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-surface-container border border-outline-variant text-xs h-9 px-3 rounded-xl focus:outline-none text-foreground font-medium cursor-pointer"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 pb-8">
          {(activeViewTab === 'public' ? loading : loadingMy) ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Loader2 className="size-8 animate-spin text-accent" />
              <p className="text-xs text-foreground-muted font-medium">در حال دریافت ایده‌ها...</p>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-surface border border-outline-variant rounded-2xl border-dashed">
              <Lightbulb className="size-10 text-foreground-muted/30 mb-3" />
              <p className="text-sm font-bold text-foreground">
                {activeViewTab === 'public' ? 'هیچ ایده‌ای یافت نشد.' : 'شما هنوز ایده‌ای ثبت نکرده‌اید.'}
              </p>
              <p className="text-xs text-foreground-muted mt-1">پیشنهادهای ثبت‌شده پس از بررسی و تایید مدیر منتشر می‌شوند.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIdeas.map((idea) => {
                const bScore = idea.formData?.baselineScore
                const mScore = idea.formData?.managerScore
                
                return (
                  <div 
                    key={idea.id} 
                    className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col transition-all hover:border-accent/40 group relative overflow-hidden"
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
                    
                    {/* Score Indicators - only for non-anonymous in user panel or ideas list */}
                    {(bScore || mScore) && !idea.isAnonymous && (
                      <div className="flex flex-wrap gap-1.5 py-2 border-t border-outline-variant/60 mb-3 select-none">
                        {bScore && (
                          <span className="text-[9px] bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded-full font-bold">
                            ثبت ایده: +{toFa(bScore)} امتیاز
                          </span>
                        )}
                        {mScore && (
                          <span className="text-[9px] bg-warning/15 text-warning border border-warning/20 px-2 py-0.5 rounded-full font-bold">
                            ارزیابی مدیر: +{toFa(mScore)} امتیاز
                          </span>
                        )}
                        {(bScore || mScore) && (
                          <span className="text-[9px] bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-bold ms-auto">
                            مجموع: +{toFa((bScore || 0) + (mScore || 0))} امتیاز
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant mt-auto">
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] text-foreground-muted font-medium">
                          {toFa(jdate(idea.createdAt).format('YYYY/MM/DD'))}
                        </div>
                        
                        {/* Submitter Name */}
                        <div className="flex items-center gap-1">
                          {idea.isAnonymous ? (
                            <span className="text-[9px] text-warning font-bold flex items-center gap-0.5">
                              <EyeOff className="size-2.5" />
                              همکار ناشناس
                            </span>
                          ) : (
                            <span className="text-[9px] text-accent font-bold flex items-center gap-0.5">
                              <User className="size-2.5" />
                              {idea.user?.name || 'همکار'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {activeViewTab === 'public' ? (
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
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openConversation(idea)}
                          className="h-8 text-xs gap-1 cursor-pointer font-bold border-outline-variant hover:bg-neutral-800"
                        >
                          <MessageCircle className="size-3.5" />
                          گفتگو با مدیر
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* dialog for submit new idea */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="bg-background border border-outline-variant max-w-md w-full p-6 rounded-2xl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Lightbulb className="size-5 text-accent" />
              ثبت ایده و پیشنهاد جدید
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted mt-1">
              پیشنهادات شما رمزنگاری شده و برای بررسی و انتشار به کارتابل مدیر ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitIdea} className="space-y-4 mt-3">
            {/* Category Select */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">دسته‌بندی مرتبط:</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full bg-surface-container border border-outline-variant p-2.5 rounded-xl text-xs focus:outline-none focus:border-accent text-foreground font-semibold cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">موضوع ایده:</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان ایده خود را وارد کنید..."
                className="bg-surface-container border-outline-variant text-xs h-10 rounded-xl"
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">شرح کامل ایده:</Label>
              <textarea
                value={form.body}
                onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="شرح دقیق، راه حل پیشنهادی و مزایای اجرای این ایده را بنویسید..."
                rows={4}
                className="w-full bg-surface-container border border-outline-variant rounded-xl p-3 text-xs focus:outline-none focus:border-accent resize-none text-foreground font-medium"
              />
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-outline-variant bg-surface-container/20 cursor-pointer w-full justify-between select-none">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <EyeOff className="size-4 text-warning" />
                <span>ثبت به صورت ناشناس</span>
              </span>
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="size-4 cursor-pointer accent-accent"
              />
            </label>

            {form.isAnonymous && (
              <div className="bg-warning/10 border border-warning/20 p-3 rounded-xl text-[10px] text-warning leading-relaxed flex items-start gap-1.5">
                <Info className="size-4 shrink-0 mt-0.5" />
                <span>
                  با ثبت ناشناس، ایده شما بدون نام منتشر می‌شود. توکن امنیتی پیگیری برای شما صادر خواهد شد تا بتوانید پاسخ‌های مدیریت را مشاهده کنید. حتماً آن توکن را ذخیره نمایید.
                </span>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {submitting ? 'در حال ثبت...' : 'ثبت ایده'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* dialog for success token (anonymous submission) */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="bg-background border border-outline-variant max-w-sm w-full p-6 rounded-2xl text-center">
          <DialogHeader className="text-center">
            <EyeOff className="size-10 text-warning mx-auto mb-2" />
            <DialogTitle className="text-sm font-black text-foreground">
              ایده ناشناس با موفقیت ثبت شد
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted mt-1">
              شماره پیگیری: <span className="font-mono text-accent">FB-{toFa(newFeedbackNo)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-surface-container border border-warning/30 rounded-xl p-4 my-4">
            <p className="text-[10px] text-foreground-muted mb-2">توکن امنیتی پیگیری شما:</p>
            <p className="font-mono text-base font-bold text-warning tracking-wider select-all">{newAnonToken}</p>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-[10px] text-warning text-right leading-relaxed mb-4">
            ⚠️ این توکن تنها یک‌بار نمایش داده می‌شود. جهت پیگیری پاسخ مدیریت، حتماً آن را کپی یا یادداشت نمایید.
            بدون این توکن، امکان پیگیری پرونده میسر نخواهد بود.
          </div>

          <DialogFooter className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl cursor-pointer gap-1"
              onClick={() => {
                navigator.clipboard.writeText(newAnonToken)
                toast.success('توکن امنیتی کپی شد!')
              }}
            >
              <Copy className="size-3" /> کپی توکن
            </Button>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white font-bold text-xs rounded-xl cursor-pointer"
              onClick={() => {
                setShowTokenModal(false)
              }}
            >
              تأیید و بازگشت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog for conversation/chat thread */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={() => setSelectedIdea(null)}>
          <div
            className="bg-background w-full md:w-[580px] md:max-h-[80vh] md:rounded-xl flex flex-col rounded-t-xl overflow-hidden border border-outline-variant shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-container-low">
              <button onClick={() => setSelectedIdea(null)} className="cursor-pointer p-1 hover:bg-neutral-800 rounded">
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold">
                <MessageCircle className="size-4 text-accent" />
                <span className="text-foreground">رشته گفتگو — {selectedIdea.title}</span>
              </div>
              <Badge variant="outline" className="text-[9px] font-extrabold bg-accent/10 border-accent/20 text-accent">
                FB-{toFa(selectedIdea.feedbackNo)}
              </Badge>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px] max-h-[50vh] bg-neutral-950/10">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-accent" /></div>
              ) : (
                <>
                  <div className="max-w-[85%] ms-auto bg-surface-container-high p-3 rounded-xl rounded-ee-sm text-xs text-right space-y-1">
                    <p className="text-[9px] font-bold text-accent">
                      {selectedIdea.isAnonymous ? '👤 شما (ناشناس)' : '👤 شما'}
                    </p>
                    <p className="leading-relaxed">{selectedIdea.body}</p>
                    <p className="text-[8px] text-foreground-muted text-start">{toFa(jdate(selectedIdea.createdAt).format('HH:mm YYYY/MM/DD'))}</p>
                  </div>

                  {threadMessages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'max-w-[85%] p-3 rounded-xl text-xs text-right space-y-1',
                        msg.senderKind === 'submitter'
                          ? 'ms-auto bg-surface-container-high rounded-ee-sm'
                          : 'me-auto bg-surface-container-lowest border border-border rounded-es-sm'
                      )}
                    >
                      <p className="text-[9px] font-bold text-accent">
                        {msg.senderKind === 'submitter'
                          ? (selectedIdea.isAnonymous ? '👤 فرستنده (ناشناس)' : '👤 شما')
                          : `🏢 مدیریت (${msg.sender?.name || 'مسئول رسیدگی'})`}
                      </p>
                      <p className="leading-relaxed">{msg.body}</p>
                      <p className="text-[8px] text-foreground-muted text-start">{toFa(jdate(msg.createdAt).format('HH:mm YYYY/MM/DD'))}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-border px-4 py-3 bg-surface-container-low flex items-center gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 bg-neutral-950/30 border border-border rounded-full h-9 px-4 text-xs outline-none focus:border-accent text-right text-foreground font-medium"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessageText.trim() || sendingMessage}
                className={cn(
                  'size-9 rounded-full bg-accent text-white flex items-center justify-center cursor-pointer transition',
                  (!newMessageText.trim() || sendingMessage) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Send className="size-3.5" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
