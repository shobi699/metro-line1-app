'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { jalali, faTime } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { Heart, ArrowRight, Send, CheckCircle2, AlertCircle, Award, Pencil, Lock } from 'lucide-react'

interface PostDetail {
  id: string
  type: string
  title: string
  body: string
  category: string | null
  coverUrl: string | null
  mediaUrl: string | null
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

interface CommentItem {
  id: string
  body: string
  createdAt: string
  userName: string
}

interface QuizQuestion {
  q: string
  options: string[]
  answerIndex: number
}

const TYPE_LABELS: Record<string, string> = {
  news: 'اخبار',
  blog: 'وبلاگ',
  training: 'آموزش',
  circular: 'بخش‌نامه',
  gallery: 'گالری',
  announcement: 'اطلاعیه اداری',
  directive: 'دستورالعمل',
  form: 'فرم و فایل',
}

function renderBody(body: string, handleVideoEnded: () => void) {
  // Remove quiz and prerequisite tags
  const cleanText = body
    .replace(/\[quiz\]([\s\S]*?)\[\/quiz\]/, '')
    .replace(/\[prerequisite\]([\s\S]*?)\[\/prerequisite\]/, '')
    .trim()

  if (!cleanText) return null

  // We can split the text by blocks (paragraphs separated by double newlines)
  const paragraphs = cleanText.split(/\n\s*\n/)

  return (
    <div className="space-y-6 text-foreground leading-relaxed text-right">
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim()
        if (!trimmed) return null

        // 1. Check if it is a video tag
        const videoMatch = trimmed.match(/\[video\]([\s\S]*?)\[\/video\]/)
        if (videoMatch) {
          let videoUrl = videoMatch[1].trim()
          // Ensure it starts with a slash if it's a relative path
          if (!videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
            videoUrl = `/${videoUrl}`
          }
          return (
            <div key={pIdx} className="my-6 space-y-2">
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-2xl mx-auto shadow-lg">
                <video
                  src={videoUrl}
                  controls
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )
        }

        // 2. Check if it is an image tag: ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (imgMatch) {
          let imgUrl = imgMatch[2].trim()
          if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
            imgUrl = `/${imgUrl}`
          }
          return (
            <div key={pIdx} className="my-6 space-y-2">
              <div className="rounded-lg overflow-hidden border border-border bg-neutral-950 flex items-center justify-center max-h-96 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={imgMatch[1] || ''} className="max-w-full max-h-full object-contain" />
              </div>
              {imgMatch[1] && (
                <p className="text-[11px] text-foreground-muted text-center italic">{imgMatch[1]}</p>
              )}
            </div>
          )
        }

        // 3. Check if it is a heading: ## or ###
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-extrabold text-foreground mt-8 mb-4 border-r-4 border-accent pr-3">
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-bold text-neutral-200 mt-6 mb-3">
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          )
        }

        // 4. Check if it is a blockquote: >
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.split('\n').map((line) => line.replace(/^>\s?/, '')).join('\n')
          return (
            <blockquote key={pIdx} className="border-r-4 border-accent/60 bg-accent/5 p-4 rounded-l-lg my-4 text-sm italic text-neutral-300">
              {quoteText}
            </blockquote>
          )
        }

        // 5. Check if it is a list: - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listItems = trimmed.split('\n').map((line) => line.replace(/^[-\*]\s+/, ''))
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-2 text-sm text-neutral-300 my-4 pr-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-right">
                  {item}
                </li>
              ))}
            </ul>
          )
        }

        // 6. Default paragraph
        return (
          <p key={pIdx} className="text-sm leading-7 text-neutral-300 text-right whitespace-pre-line">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}

export default function PostDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Quiz state variables
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [quizResult, setQuizResult] = useState<{ success: boolean; message: string } | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  useEffect(() => {
    if (!accessToken || !slug) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/posts/slug/${slug}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          const p = data.data as PostDetail
          setPost(p)
          setLiked(p.liked)
          setLikeCount(p.likeCount)

          // Parse quiz questions if exist in body
          const match = p.body.match(/\[quiz\]([\s\S]*?)\[\/quiz\]/)
          if (match) {
            try {
              const questions = JSON.parse(match[1].trim())
              setQuizQuestions(questions)
            } catch {
              // quiz JSON parse failed
            }
          }

          // Register view and load comments
          fetch(`/api/posts/${p.id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const cres = await fetch(`/api/posts/${p.id}/comments`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (!cancelled && cres.ok) {
            const cdata = await cres.json()
            setComments(cdata.data as CommentItem[])
          }
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
  }, [accessToken, slug])

  async function handleLike() {
    if (!post || !accessToken) return
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.data.liked)
        setLikeCount(data.data.likeCount)
      }
    } catch {
      // silent
    }
  }

  async function handleComment() {
    if (!post || !accessToken) return
    const body = commentText.trim()
    if (!body) return
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((c) => [...c, data.data as CommentItem])
        setCommentText('')
      }
    } catch {
      // silent
    }
  }

  // Quiz submission handler
  async function handleQuizSubmit() {
    if (!post || !accessToken || !quizQuestions) return
    setSubmittingQuiz(true)
    setQuizResult(null)

    // Format user answers as an array matching the index of questions
    const answersArray = quizQuestions.map((_, idx) => userAnswers[idx])

    try {
      const res = await fetch(`/api/posts/${post.id}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ answers: answersArray }),
      })

      const data = await res.json()

      if (res.ok) {
        setQuizResult({
          success: data.success,
          message: data.message,
        })
      } else {
        setQuizResult({
          success: false,
          message: data.error || 'خطا در ثبت و ارزیابی پاسخ‌های آزمون',
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setQuizResult({
        success: false,
        message: `خطا در اتصال به سرور: ${message}`,
      })
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const handleVideoEnded = () => {
    setVideoEnded(true)
    if (quizQuestions) {
      setShowQuiz(true)
    }
  }

  if (loading) {
    return (
      <div role="status" className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-foreground-muted">محتوا یافت نشد</p>
        <Link href="/content">
          <Button variant="outline" size="sm">
            بازگشت به فهرست
          </Button>
        </Link>
      </div>
    )
  }

  const isLocked = post.prerequisiteCompleted === false && user?.roleKey !== 'admin' && user?.roleKey !== 'super_admin'

  if (isLocked) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center select-none" dir="rtl">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-5 rounded-full animate-bounce mt-12">
          <Lock className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-extrabold text-foreground">این دوره آموزشی برای شما قفل است</h1>
          <p className="text-xs text-foreground-muted leading-6">
            برای دسترسی به محتوای این دوره، ابتدا باید دوره پیش‌نیاز را با موفقیت سپری کرده و آزمون آن را با موفقیت پشت سر بگذارید.
          </p>
        </div>
        
        <Card className="w-full border-border-subtle bg-surface-container-low/40">
          <CardContent className="p-4 flex flex-col gap-3 text-right">
            <span className="text-[11px] text-destructive font-bold">📚 دوره پیش‌نیاز مورد نیاز:</span>
            <span className="text-xs text-foreground font-semibold leading-relaxed">{post.prerequisiteTitle}</span>
          </CardContent>
        </Card>

        {post.prerequisiteSlug && (
          <Link href={`/content/${post.prerequisiteSlug}`} className="w-full">
            <Button className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg font-bold text-xs h-10 shadow-lg shadow-accent/15">
              ورود به دوره پیش‌نیاز
            </Button>
          </Link>
        )}
        
        <Link href="/learning/gallery" className="text-xs text-foreground-muted hover:text-foreground underline">
          بازگشت به گالری آموزش‌ها
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-4" dir="rtl">
      <div className="flex items-center justify-between gap-4 select-none">
        <Link href="/content" className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground">
          <ArrowRight className="size-3.5" />
          <span>بازگشت به اخبار و آموزش</span>
        </Link>
        {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && post && (
          <Link href={`/admin/content?edit=${post.id}`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer border-accent/30 text-accent hover:bg-accent/5 rounded-lg transition-all">
              <Pencil className="size-3.5" />
              <span>ویرایش این نوشته</span>
            </Button>
          </Link>
        )}
      </div>

      {post.mandatory && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          این محتوا «خواندن اجباری» است و رؤیت شما ثبت شد.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <span className="rounded bg-background-subtle px-1.5 py-0.5">
            {TYPE_LABELS[post.type] ?? post.type}
          </span>
          {post.category && <span>{post.category}</span>}
          <span>·</span>
          <span>{post.authorName}</span>
          <span>·</span>
          <span>{jalali(post.createdAt)}</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{post.title}</h1>
      </div>

      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt="" className="w-full rounded-lg object-cover" />
      )}

      {post.mediaUrl && post.mediaType?.startsWith('video/') && (
        <video
          src={post.mediaUrl}
          controls
          onEnded={handleVideoEnded}
          className="w-full rounded-lg"
        />
      )}
      {post.mediaUrl && post.mediaType?.startsWith('image/') && !post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrl} alt="" className="w-full rounded-lg object-cover" />
      )}

      {/* Quiz Section right under the video */}
      {quizQuestions && quizQuestions.length > 0 && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-accent">
              <Award className="size-5" />
              <span className="font-semibold text-sm">
                آزمون این دوره آموزشی (شامل {quizQuestions.length} سوال)
              </span>
            </div>
            {!videoEnded ? (
              <p className="text-xs text-foreground-muted">
                برای فعال شدن آزمون و دریافت ۵۰ امتیاز گیمیفیکیشن، لطفاً ویدیو را تا انتها مشاهده کنید.
              </p>
            ) : !showQuiz && !quizResult?.success ? (
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted">
                  ویدیو به پایان رسید. اکنون می‌توانید در آزمون شرکت کنید.
                </p>
                <Button size="sm" onClick={() => setShowQuiz(true)}>
                  شروع آزمون
                </Button>
              </div>
            ) : null}

            {showQuiz && !quizResult?.success && (
              <div className="flex flex-col gap-4 mt-2 border-t border-border pt-4">
                {quizQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="flex flex-col gap-2">
                    <p className="text-sm font-medium">
                      {qIdx + 1}. {q.q}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          className={cn(
                            'flex items-center justify-start rounded-lg border p-2.5 text-right text-xs transition-all hover:bg-surface-hover',
                            userAnswers[qIdx] === oIdx
                              ? 'border-accent bg-accent/10 text-accent font-semibold'
                              : 'border-border bg-background',
                          )}
                          onClick={() => {
                            setUserAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    disabled={
                      submittingQuiz ||
                      Object.keys(userAnswers).length !== quizQuestions.length
                    }
                    onClick={handleQuizSubmit}
                  >
                    {submittingQuiz ? 'در حال ثبت پاسخ‌ها...' : 'ثبت پاسخ‌ها و دریافت امتیاز'}
                  </Button>
                </div>
              </div>
            )}

            {quizResult && (
              <div
                className={cn(
                  'rounded-lg border p-3 text-xs flex items-start gap-2.5 mt-2',
                  quizResult.success
                    ? 'border-success/20 bg-success/10 text-success'
                    : 'border-critical/20 bg-critical/10 text-critical',
                )}
              >
                {quizResult.success ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">
                    {quizResult.success ? 'پاسخ صحیح' : 'پاسخ نادرست'}
                  </span>
                  <span>{quizResult.message}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {renderBody(post.body, handleVideoEnded)}

      <div className="flex items-center gap-3 border-y border-border py-3">
        <Button
          variant={liked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
        >
          <Heart className={cn('size-4', liked && 'fill-current')} />
          پسندیدم {likeCount > 0 && `(${likeCount})`}
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">نظرات</h2>

        <div className="flex items-center gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleComment()
            }}
            placeholder="نظر خود را بنویسید..."
            aria-label="متن نظر"
          />
          <Button size="icon-sm" aria-label="ارسال نظر" onClick={handleComment}>
            <Send className="size-4" />
          </Button>
        </div>

        {comments.length === 0 ? (
          <p className="text-xs text-foreground-muted">هنوز نظری ثبت نشده است</p>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-foreground-muted">
                    <span className="font-medium text-foreground">{c.userName}</span>
                    <span>
                      {jalali(c.createdAt)} · {faTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

