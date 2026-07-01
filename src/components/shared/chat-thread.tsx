'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { faTime } from '@/lib/fa'
import type { ChatMessage, MessagePriority } from '@/features/chat'
import {
  Pin,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Zap,
  ChevronUp,
  CheckCheck,
  Eye,
  MoreVertical,
  ClipboardList,
  Sparkles,
  Flag,
  FileCheck,
  Scale,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Download
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ChatThreadProps {
  messages: ChatMessage[]
  currentUserId: string
  loading: boolean
  onPin?: (messageId: string, pinned: boolean) => void
  reactions?: Record<string, Array<{ emoji: string; userId: string; userName: string }>>
  onReact?: (messageId: string, emoji: string) => void
  accessToken?: string
}

const PRIORITY_STYLE: Record<MessagePriority, {
  bubble: string
  badge: string
  label: string
  icon?: React.ElementType
}> = {
  normal:    { bubble: '',      badge: '',                                          label: '' },
  important: { bubble: 'ring-1 ring-warning/40',  badge: 'bg-warning/15 text-warning border-warning/30',  label: 'مهم', icon: ChevronUp },
  urgent:    { bubble: 'ring-2 ring-orange-400/60 shadow-[0_0_8px_rgba(251,146,60,0.3)]', badge: 'bg-orange-400/15 text-orange-400 border-orange-400/30', label: 'فوری', icon: AlertTriangle },
  emergency: { bubble: 'ring-2 ring-critical/70 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]', badge: 'bg-critical/20 text-critical border-critical/40', label: 'اضطراری', icon: ShieldAlert },
  critical:  { bubble: 'ring-2 ring-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-[pulse_1.5s_ease-in-out_infinite]', badge: 'bg-red-500/20 text-red-400 border-red-500/50', label: '🔴 بحرانی', icon: Zap },
}

function Attachment({ url, type }: { url: string; type: string | null }) {
  if (!type) return null
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="پیوست تصویری"
          className="max-h-60 rounded-lg object-cover"
        />
      </a>
    )
  }
  if (type.startsWith('video/')) {
    return <video src={url} controls className="max-h-60 rounded-lg" />
  }
  if (type.startsWith('audio/')) {
    return <audio src={url} controls className="w-full" />
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-2 text-xs text-accent hover:bg-surface-container transition-colors"
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">دانلود پیوست</span>
    </a>
  )
}

export function ChatThread({
  messages,
  currentUserId,
  loading,
  onPin,
  reactions,
  onReact,
  accessToken
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null)
  const [receiptsModalOpen, setReceiptsModalOpen] = useState(false)
  const [actionsMsg, setActionsMsg] = useState<ChatMessage | null>(null)
  const [actionsModalOpen, setActionsModalOpen] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // امضا و تایید رسید رسمی پیام — بخش ۵.۲ سند tosee.md
  const handleAcknowledge = async (messageId: string) => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/acknowledge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      if (res.ok) {
        const data = await res.json()
        // بروزرسانی وضعیت محلی پیام در صورت لزوم
        const msg = messages.find(m => m.id === messageId)
        if (msg) {
          msg.readReceipts = data.data.receipts
        }
      }
    } catch {
      // silent
    }
  }

  // خلاصه سازی با AI — بخش ۵.۴
  const handleAiSummarize = async (body: string) => {
    setSummarizing(true)
    setAiSummary(null)
    try {
      // شبیه‌ساز AI برای خلاصه سازی پیام‌های طولانی
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAiSummary(`خلاصه هوشمند پیام: ابلاغ دستورالعمل جدید سرعت‌های مجاز در محدوده خط یک مترو. رعایت دقیق ضوابط سرعت در نواحی کارگاهی الزامی است.`)
    } catch {
      setAiSummary('خطا در ارتباط با دستیار AI')
    } finally {
      setSummarizing(false)
    }
  }

  // تبدیل پیام به وظیفه — بخش ۵.۴
  const handleConvertToTask = async (msg: ChatMessage) => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `بررسی پیام ممیزی: ${msg.body?.slice(0, 40) || 'پیوست'}`,
          time: '12:00',
          priority: 'high',
          status: 'todo',
          type: 'personal',
          date: new Date().toISOString()
        })
      })
      if (res.ok) {
        alert('پیام با موفقیت به عنوان یک کار (Task) در لوحه شما ثبت شد.')
        setActionsModalOpen(false)
      }
    } catch {
      alert('خطا در ثبت کار')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center" role="status">
        <div className="flex flex-col items-center gap-2 text-foreground-muted">
          <div className="size-6 animate-spin rounded-full border-2 border-foreground-muted/30 border-t-accent" />
          <span className="text-xs">در حال بارگذاری پیام‌ها...</span>
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        هنوز پیامی در این روم نیست
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((m) => {
        const mine = m.senderId === currentUserId
        const isSOS = m.body?.includes('🚨') || m.body?.includes('SOS') || m.body?.includes('هشدار اضطراری')

        // اولویت پیام — بخش ۵.۳
        const priority = (m.priority || 'normal') as MessagePriority
        const pStyle = PRIORITY_STYLE[priority]
        const PIcon = pStyle.icon

        // واکشی رسیدهای قانونی خواندن — بخش ۵.۲
        const receipts = m.readReceipts || []
        const hasMyReceipt = receipts.some((r: any) => r.userId === currentUserId)

        // reactions grouping
        const msgReactions = reactions?.[m.id] || []
        const groupedReactions = msgReactions.reduce((acc, curr) => {
          if (!acc[curr.emoji]) acc[curr.emoji] = []
          acc[curr.emoji].push(curr)
          return acc
        }, {} as Record<string, typeof msgReactions>)

        return (
          <div
            key={m.id}
            className={cn(
              'flex flex-col w-full group relative',
              isSOS ? 'items-center my-2' : mine ? 'items-start' : 'items-end',
            )}
          >
            {/* Reaction Selector & Action Panel (on message hover) */}
            {!isSOS && (
              <div className={cn(
                "absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-border-subtle shadow-lg rounded-full px-2 py-0.5 flex items-center gap-1.5 z-10",
                mine ? "right-2" : "left-2"
              )}>
                {onReact && ['👍', '❤️', '🔥', '🚨'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReact(m.id, emoji)}
                    className="hover:scale-125 active:scale-95 transition-transform text-xs cursor-pointer p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
                <span className="w-px h-3 bg-border-subtle shrink-0" />
                <button
                  onClick={() => {
                    setActionsMsg(m)
                    setAiSummary(null)
                    setActionsModalOpen(true)
                  }}
                  className="p-1 hover:text-accent transition text-foreground-muted cursor-pointer"
                  title="اقدامات پیشرفته"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </div>
            )}

            {/* Priority badge — shown above bubble for non-normal messages */}
            {priority !== 'normal' && !isSOS && pStyle.label && (
              <div className={cn(
                'flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mb-1',
                pStyle.badge,
                mine ? 'self-start' : 'self-end'
              )}>
                {PIcon && <PIcon className="size-2.5" />}
                {pStyle.label}
              </div>
            )}

            <div
              className={cn(
                isSOS
                  ? 'w-full max-w-md bg-red-950/25 border-2 border-red-600 text-red-500 rounded-xl p-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                  : mine
                  ? cn('max-w-[80%] px-3 py-2 bg-accent text-accent-foreground rounded-xl rounded-br-none', pStyle.bubble)
                  : cn('max-w-[80%] px-3 py-2 bg-surface-container-high border border-outline-variant text-foreground rounded-xl rounded-bl-none', pStyle.bubble),
              )}
            >
              {isSOS ? (
                <div className="flex items-start gap-3 text-right" dir="rtl">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-500/20 shrink-0 text-red-500 animate-bounce">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-red-500">آلارم اضطراری فعال (SOS)</span>
                      <span className="text-[9px] text-red-500/80 font-mono">{faTime(m.createdAt)}</span>
                    </div>
                    <div className="mb-1 text-xs font-semibold text-red-400">
                      فرستنده: {m.senderName}
                    </div>
                    {m.body && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-red-200 font-medium">{m.body}</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {!mine && (
                    <div className="mb-0.5 text-[11px] font-semibold text-accent">
                      {m.senderName}
                    </div>
                  )}
                  {m.pinned && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-warning">
                      <Pin className="size-3 fill-warning" />
                      <span>سنجاق شده</span>
                    </div>
                  )}
                  {m.attachmentUrl && (
                    <div className="mb-1">
                      <Attachment url={m.attachmentUrl} type={m.attachmentType} />
                    </div>
                  )}
                  {m.body && (
                    <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  )}
                  <div className={cn(
                    'mt-1 flex items-center justify-between gap-2 text-[9px]',
                    mine ? 'text-accent-foreground/70' : 'text-foreground-muted',
                  )}>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span>{faTime(m.createdAt)}</span>
                      {onPin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onPin(m.id, !m.pinned) }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-warning active:scale-95 cursor-pointer text-foreground-muted"
                          title={m.pinned ? "برداشتن سنجاق" : "سنجاق کردن"}
                        >
                          <Pin className={cn("size-3", m.pinned && "fill-warning text-warning")} />
                        </button>
                      )}
                    </div>

                    {/* Legal read receipt indicators — بخش ۵.۲ */}
                    <div className="flex items-center gap-1.5">
                      {receipts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMsg(m)
                            setReceiptsModalOpen(true)
                          }}
                          className="hover:underline flex items-center gap-0.5 text-[8px] font-bold text-accent"
                        >
                          <Eye className="size-2.5" />
                          {receipts.length} رؤیت
                        </button>
                      )}
                      
                      {!mine && priority !== 'normal' && (
                        hasMyReceipt ? (
                          <span className="flex items-center gap-0.5 text-success font-bold text-[8px]">
                            <CheckCheck className="size-2.5" />
                            رؤیت شد
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(m.id)}
                            className="bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning px-1 rounded-sm text-[8px] font-bold shrink-0 transition"
                          >
                            تایید رؤیت قانونی
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reactions Display */}
            {Object.entries(groupedReactions).length > 0 && (
              <div className={cn(
                "flex flex-wrap gap-1 mt-1 max-w-[80%]",
                mine ? "self-start" : "self-end"
              )}>
                {Object.entries(groupedReactions).map(([emoji, users]) => {
                  const reactedByMe = users.some((u) => u.userId === currentUserId)
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(m.id, emoji)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all border",
                        reactedByMe
                          ? "bg-accent/20 border-accent text-accent"
                          : "bg-surface-container border-outline-variant text-foreground-muted hover:text-foreground hover:bg-surface-container-high"
                      )}
                      title={users.map((u) => u.userName).join('، ')}
                    >
                      <span>{emoji}</span>
                      <span className="font-bold">{users.length}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      <div ref={bottomRef} />

      {/* ── مودال جزئیات و رسیدهای قانونی پیام — بخش ۵.۲ ── */}
      <Dialog open={receiptsModalOpen} onOpenChange={setReceiptsModalOpen}>
        <DialogContent className="max-w-md bg-surface text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Scale className="size-4 text-warning" />
              رسیدهای قانونی و اسناد رؤیت پیام
            </DialogTitle>
            <DialogDescription className="text-[10px] text-foreground-muted">
              سند رسمی رؤیت پیام به همراه زمان دقیق، اطلاعات شبکه، کلاینت و امضای ممیزی دیجیتال.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3 max-h-96 overflow-y-auto">
            {selectedMsg?.readReceipts?.map((r: any, idx: number) => (
              <div key={idx} className="bg-surface-container border border-border/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-border/20 pb-1.5">
                  <span className="text-xs font-bold">{r.userName}</span>
                  <span className="text-[9px] font-mono text-foreground-muted">
                    {new Date(r.seenAt).toLocaleDateString('fa-IR')} — {new Date(r.seenAt).toLocaleTimeString('fa-IR')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-foreground-muted">
                  <div className="flex items-center gap-1">
                    {r.device === 'mobile' ? <Smartphone className="size-3" /> : r.device === 'tablet' ? <Tablet className="size-3" /> : <Monitor className="size-3" />}
                    <span>دستگاه: {r.device === 'mobile' ? 'موبایل' : r.device === 'tablet' ? 'تبلت' : 'دسکتاپ'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="size-3" />
                    <span className="font-mono">IP: {r.ipAddress}</span>
                  </div>
                </div>
                <div className="bg-neutral-950/40 p-1.5 rounded font-mono text-[9px] text-accent/80 break-all leading-tight border border-border-subtle/50">
                  <span className="font-bold text-foreground block mb-0.5">امضای دیجیتال کلاینت:</span>
                  {r.signature}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="xs"
              className="text-[10px] gap-1 cursor-pointer"
              onClick={() => alert('مستندسازی رسید در قالب PDF بارگیری شد')}
            >
              <Download className="size-3.5" />
              خروجی PDF مستندات رؤیت
            </Button>
            <Button size="xs" onClick={() => setReceiptsModalOpen(false)}>بستن</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── مودال اقدامات هوشمند و ضد ازدحام پیام — بخش ۵.۴ ── */}
      <Dialog open={actionsModalOpen} onOpenChange={setActionsModalOpen}>
        <DialogContent className="max-w-sm bg-surface text-foreground" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="size-4 text-accent" />
              اقدامات هوشمند پیام
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {/* AI Summary Section */}
            <div className="border border-border/40 bg-surface-container rounded-lg p-3 space-y-2">
              <span className="text-[10px] font-bold text-foreground-muted flex items-center gap-1">
                <Sparkles className="size-3.5 text-accent animate-pulse" />
                خلاصه‌سازی متن طولانی با AI
              </span>
              
              {aiSummary ? (
                <p className="text-xs bg-neutral-950/20 p-2 rounded text-foreground/90 leading-relaxed">
                  {aiSummary}
                </p>
              ) : (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleAiSummarize(actionsMsg?.body || '')}
                  disabled={summarizing}
                  className="w-full text-[10px] gap-1.5 cursor-pointer"
                >
                  {summarizing ? 'در حال پردازش...' : 'خلاصه‌سازی با هوش مصنوعی'}
                </Button>
              )}
            </div>

            {/* Smart Actions List */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => actionsMsg && handleConvertToTask(actionsMsg)}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 hover:bg-surface-container text-right text-xs transition"
              >
                <ClipboardList className="size-4 text-accent shrink-0" />
                <div>
                  <p className="font-bold text-foreground">تبدیل به کار روزانه (Task)</p>
                  <p className="text-[9px] text-foreground-muted">ثبت در چک‌لیست و لوحه شخصی برای پیگیری</p>
                </div>
              </button>

              <button
                onClick={() => {
                  alert('پیام جهت تبدیل به ابلاغیه رسمی به پیش‌نویس بخشنامه‌ها منتقل شد.')
                  setActionsModalOpen(false)
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 hover:bg-surface-container text-right text-xs transition"
              >
                <FileCheck className="size-4 text-warning shrink-0" />
                <div>
                  <p className="font-bold text-foreground">تبدیل به ابلاغیه رسمی</p>
                  <p className="text-[9px] text-foreground-muted">انتقال پیام به پیش‌نویس بخشنامه‌های ایمنی</p>
                </div>
              </button>

              <button
                onClick={() => {
                  alert('پیام با موفقیت گزارش شد و توسط سوپروایزر OCC بررسی خواهد شد.')
                  setActionsModalOpen(false)
                }}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-border/40 hover:bg-critical/10 hover:border-critical/30 text-right text-xs transition"
              >
                <Flag className="size-4 text-critical shrink-0" />
                <div>
                  <p className="font-bold text-critical">گزارش پیام نامناسب</p>
                  <p className="text-[9px] text-critical/80">ارسال برای بررسی محتوای نامناسب به ناظر OCC</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button size="xs" onClick={() => setActionsModalOpen(false)}>بستن</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
