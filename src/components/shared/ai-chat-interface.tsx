'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Mic,
  AlertTriangle,
  Bot,
  Settings,
  X,
  Plus,
  FileText,
  HelpCircle,
  Terminal,
  Bookmark,
  ShieldAlert,
  ArrowLeftRight,
  ThumbsUp,
  FileCode,
  Gauge
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toFa } from '@/lib/fa'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  isBento?: boolean
  source?: string
  articles?: Array<{ slug: string; title: string }>
  confidence?: number       // درصد اطمینان هوش مصنوعی — بخش ۱۲.۷
  handbookSection?: string  // ارجاع به بند دقیق آیین‌نامه — بخش ۱۲.۷
  isCritical?: boolean      // آیا هشدار بحران است؟
}

interface CustomFieldDoc {
  id: string
  title: string
  slug: string
  category: string | null
  body: string
}

const FAQ_ITEMS = [
  { label: 'نقص فنی درب واگن (E102)', query: 'E102' },
  { label: 'صدای غیرعادی موتور (E205)', query: 'E205' },
  { label: 'سنسور حریق واگن (E303)', query: 'E303' },
  { label: 'افت کشش قطار (E404)', query: 'E404' },
  { label: 'خطای ATP سیگنالینگ (S301)', query: 'S301' },
  { label: 'وقوع حریق در تونل 🚨', query: 'حریق' },
  { label: 'خروج چرخ از ریل 🚨', query: 'خروج از ریل' }
]

const SAMPLE_AUDIT_LOGS = [
  { query: 'بررسی خطای E102 درب', count: 14, lastUsed: '۱۰ دقیقه پیش' },
  { query: 'رفع خطای ترمز اضطراری', count: 9, lastUsed: '۱ ساعت پیش' },
  { query: 'مقررات حریق داخل تونل', count: 6, lastUsed: '۴ ساعت پیش' },
  { query: 'کد خطای S301 سیگنالینگ', count: 5, lastUsed: 'دیروز' }
]

export function AiChatInterface() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'سلام. دستیار هوشمند عملیاتی خط ۱ مترو تهران آماده است. لطفاً سوال فنی، کد خطای دیسپاچینگ یا شرایط اضطراری خود را وارد نمایید.',
      confidence: 100,
      handbookSection: 'دیباگر مرکزی خط ۱'
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // AI Configuration States
  const [showSettings, setShowSettings] = useState(false)
  const [aiModel, setAiModel] = useState('gemini-1.5-pro')
  const [temperature, setTemperature] = useState(0.2)
  const [maxTokens, setMaxTokens] = useState(1024)

  // Document Ingestion States
  const [docTitle, setDocTitle] = useState('')
  const [docSlug, setDocSlug] = useState('')
  const [docCategory, setDocCategory] = useState('technical')
  const [docTags, setDocTags] = useState('')
  const [docBody, setDocBody] = useState('')
  const [docError, setDocError] = useState('')
  const [docSuccess, setDocSuccess] = useState('')
  const [ingestionLoading, setIngestionLoading] = useState(false)
  const [knowledgeList, setKnowledgeList] = useState<CustomFieldDoc[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat area
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch registered knowledge articles
  const fetchKnowledgeBase = async () => {
    try {
      const res = await fetch('/api/knowledge?pageSize=50', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      })
      const data = await res.json()
      if (data.data && data.data.items) {
        setKnowledgeList(data.data.items)
      }
    } catch {}
  }

  useEffect(() => {
    fetchKnowledgeBase()
  }, [])

  // Send message to AI Route API
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim() || loading) return
    setLoading(true)

    const userText = textToSend.trim()
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({ prompt: userText }),
      })

      const data = await res.json()
      if (res.ok && data.data) {
        const reply = data.data.reply
        const isBento = data.data.source === 'rulebook' || data.data.source === 'OCC_EMERGENCY'
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: reply,
            isBento: isBento,
            source: data.data.source,
            articles: data.data.articles,
            confidence: data.data.confidence,
            handbookSection: data.data.handbookSection,
            isCritical: data.data.isCritical
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: data.error || 'متأسفانه در پردازش درخواست شما خطایی رخ داد.',
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'خطای شبکه در ارتباط با سرور هوش مصنوعی.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Handle Document Ingestion Submit
  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setDocError('')
    setDocSuccess('')

    if (!docTitle.trim() || !docSlug.trim() || !docBody.trim()) {
      setDocError('لطفاً عنوان، اسلاگ یکتا و متن دستورالعمل را پر کنید.')
      return
    }

    setIngestionLoading(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          title: docTitle.trim(),
          slug: docSlug.trim().toLowerCase(),
          body: docBody.trim(),
          category: docCategory,
          tags: docTags.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setDocSuccess('دستورالعمل فنی با موفقیت در پایگاه دانش RAG آپلود شد.')
        setDocTitle('')
        setDocSlug('')
        setDocTags('')
        setDocBody('')
        fetchKnowledgeBase()
      } else {
        setDocError(data.error || 'خطا در بارگذاری سند')
      }
    } catch {
      setDocError('خطای شبکه در بارگذاری فایل')
    } finally {
      setIngestionLoading(false)
    }
  }

  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  return (
    <section className="relative flex flex-1 flex-col bg-background text-right transition-colors duration-150" dir="rtl">
      
      {/* HEADER: AI Model status & Settings trigger */}
      <div className="z-10 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle bg-surface-container-low px-4 py-3 shadow-sm gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/25 animate-pulse">
            <Bot className="size-5 text-accent" />
          </div>
          <div>
            <span className="font-bold text-xs text-foreground block">دستیار هوشمند عملیاتی AI (بخش ۱۲.۷)</span>
            <span className="text-[10px] text-foreground-muted block font-mono">
              اسناد فعال: کتابچه راهبری خط ۱ - ویرایش خرداد ۱۴۰۵
            </span>
          </div>
        </div>

        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-transparent hover:bg-surface-hover px-2.5 py-1 text-[10px] font-bold text-foreground transition-colors cursor-pointer"
          >
            <Settings className="size-3.5 text-accent" />
            تنظیمات RAG و مدل
          </button>
        </div>
      </div>

      {/* Safety Notice Warning Banner — بخش ۱۲.۷ الزامات ایمنی */}
      <div className="bg-critical/10 border-b border-critical/20 p-2.5 flex items-center gap-2 text-[10px] text-critical justify-center font-bold">
        <ShieldAlert className="size-4 animate-bounce" />
        <span>⚠️ توجه مهم: پاسخ‌های هوش مصنوعی صرفاً کمکی و مشورتی بوده و تحت هیچ عنوان جایگزین تایید نهایی مرکز فرمان (OCC) یا کتب رسمی آیین‌نامه نمی‌شوند.</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Chat Thread Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-28">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                /* User Message Bubble */
                <div key={msg.id} className="flex items-start gap-3 justify-end">
                  <div className="rounded-lg rounded-tl-none border border-accent/15 bg-accent/5 px-4 py-3 text-xs max-w-[75%] shadow-sm font-bold">
                    <p className="text-foreground leading-relaxed">{msg.content}</p>
                  </div>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high border border-border text-[9px] font-bold">
                    راهبر
                  </div>
                </div>
              ) : (
                /* AI Bento & Normal Response with Telemetry */
                <div key={msg.id} className="flex items-start gap-3 justify-start">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border">
                    <Bot className="size-4 text-accent" />
                  </div>
                  
                  <div className={cn(
                    "w-full max-w-2xl overflow-hidden rounded-lg border text-xs",
                    msg.isCritical ? "border-critical/30 bg-critical/5" : "border-border bg-surface-container-low"
                  )}>
                    {/* Telemetry metadata block — بخش ۱۲.۷ */}
                    <div className="flex items-center justify-between border-b border-border-subtle bg-gradient-to-r from-accent/5 to-transparent px-3 py-1.5 font-bold text-[9px] text-foreground-muted font-mono">
                      <span className="flex items-center gap-1">
                        <Gauge className="size-3 text-accent" />
                        درصد اطمینان: {formatFarsiNumber(msg.confidence?.toString() || '۹۰')}٪
                      </span>
                      {msg.handbookSection && (
                        <span className="flex items-center gap-1">
                          <Bookmark className="size-3 text-accent" />
                          بند مرجع: {msg.handbookSection}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 space-y-3 font-bold text-right leading-relaxed">
                      <p className="text-foreground leading-relaxed whitespace-pre-line font-medium font-sans">
                        {msg.content}
                      </p>

                      {msg.articles && msg.articles.length > 0 && (
                        <div className="flex flex-col gap-1.5 rounded-lg border border-border-subtle bg-surface/30 p-2.5">
                          <h4 className="text-[10px] font-semibold text-foreground-muted flex items-center gap-1">
                            <FileText className="size-3.5 text-accent" />
                            بخش‌های مرجع در دانش‌نامه:
                          </h4>
                          <div className="flex gap-1.5 flex-wrap">
                            {msg.articles.map(art => (
                              <Badge key={art.slug} variant="outline" className="text-[9px] border-border bg-surface text-accent font-bold px-1.5 py-0.5">
                                {art.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
            {loading && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border animate-pulse">
                  <Bot className="size-3.5 text-foreground-muted" />
                </div>
                <div className="rounded-lg border border-border bg-surface-container px-3.5 py-2 text-xs text-foreground-muted animate-pulse font-bold">
                  دستیار هوشمند در حال انطباق سوال با کتابچه قوانین و استخراج بندهای ایمنی...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA: Floating Glassmorphism Container */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4">
            <div className="mx-auto max-w-2xl px-4">
              <div className="relative rounded-lg border border-border bg-surface/85 backdrop-blur-md p-2 shadow-lg flex items-center gap-2">
                <button className="p-2 text-foreground-muted hover:text-foreground transition-colors hover:bg-surface-hover rounded-md cursor-pointer">
                  <Mic className="size-4" />
                </button>
                <input
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none text-right font-bold"
                  placeholder="کد خطا (E102)، نقص ترمز یا سوال فنی خود را بنویسید..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={() => handleSend()}
                  className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground transition-all hover:bg-accent-hover active:scale-95 cursor-pointer animate-pulse"
                >
                  <Send className="size-4 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: FAQs & Log queries — بخش ۱۲.۷ */}
        <div className="w-full lg:w-72 border-r border-border/40 bg-surface-container-low p-4 space-y-4 overflow-y-auto text-right">
          {/* FAQ Area */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
              <HelpCircle className="size-4 text-accent" />
              پرسش‌های متداول راهبران
            </h4>
            <p className="text-[10px] text-foreground-muted leading-relaxed">برای پاسخ سریع روی موارد زیر ضربه بزنید:</p>
            <div className="flex flex-col gap-1.5 pt-1">
              {FAQ_ITEMS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(faq.query)}
                  className="text-right text-[10px] font-bold p-2 border border-border bg-surface hover:bg-surface-hover rounded-md transition text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  {faq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit query log — بخش ۱۲.۷ */}
          <div className="space-y-2 border-t border-border/20 pt-3">
            <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-warning" />
              سؤالات پرتکرار و نیازهای آموزشی
            </h4>
            <p className="text-[10px] text-foreground-muted leading-relaxed">
              تحلیل و استخراج لاگ‌ها برای پر کردن شکاف‌های آموزشی پرسنل خط ۱:
            </p>
            <div className="space-y-2 pt-1 font-mono">
              {SAMPLE_AUDIT_LOGS.map((log, idx) => (
                <div key={idx} className="p-2 border border-border/30 bg-neutral-950/20 rounded text-[9px] font-bold text-foreground flex justify-between items-center">
                  <span className="truncate max-w-[140px] font-sans">{log.query}</span>
                  <span className="text-accent">{toFa(log.count)} بار استعلام</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: AI RAG & DOCUMENTATION SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-3xl p-6 space-y-5 shadow-xl animate-fade-in text-right">
            
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-accent animate-spin-slow" />
                <h3 className="text-xs font-semibold text-foreground">تنظیمات هوش مصنوعی و پایگاه دانش RAG</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover p-1.5 rounded-md transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[420px] overflow-y-auto px-1">
              {/* Left Column: AI Config & Ingestion Form */}
              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle space-y-3">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Terminal className="size-4 text-accent" />
                    پارامترهای موتور تولید متن
                  </h4>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] text-foreground-muted">مدل هوش مصنوعی فعال:</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs focus:outline-none"
                    >
                      <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (پیشنهادی)</option>
                      <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (سریع)</option>
                    </select>
                  </div>
                </div>

                {/* Form to upload new documentation */}
                {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') ? (
                  <form onSubmit={handleIngestDocument} className="bg-surface-container-low p-4 rounded-lg border border-border-subtle space-y-3.5">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Plus className="size-4 text-accent" />
                      بارگذاری دستورالعمل/مستندات جدید (RAG)
                    </h4>

                    {docError ? (
                      <div className="p-2 bg-critical/10 border border-critical/20 text-critical text-xs rounded-md">
                        {docError}
                      </div>
                    ) : null}
                    {docSuccess ? (
                      <div className="p-2 bg-success/10 border border-success/20 text-success text-xs rounded-md">
                        {docSuccess}
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">عنوان سند فنی (فارسی):</label>
                      <input
                        type="text"
                        placeholder="مثال: آیین‌نامه علائم کابین"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-foreground-muted">اسلاگ یکتا (انگلیسی):</label>
                        <input
                          type="text"
                          placeholder="مثال: cabin-signaling"
                          value={docSlug}
                          onChange={(e) => setDocSlug(e.target.value)}
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-foreground-muted">دسته‌بندی محتوا:</label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value)}
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs"
                        >
                          <option value="technical">دستورالعمل فنی</option>
                          <option value="safety">آیین‌نامه ایمنی</option>
                          <option value="operation">راهنمای راهبری</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">متن کامل دستورالعمل فنی (محتوای سند):</label>
                      <textarea
                        rows={4}
                        placeholder="متن کامل..."
                        value={docBody}
                        onChange={(e) => setDocBody(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none font-bold"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={ingestionLoading}
                      className="w-full bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-semibold h-9 rounded-md transition-colors cursor-pointer"
                    >
                      {ingestionLoading ? 'در حال ثبت...' : 'ثبت و بارگذاری در RAG'}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-accent/5 border border-accent/15 p-4 rounded-lg">
                    <p className="text-xs text-accent leading-relaxed font-medium">
                      تنها کاربران با نقش مدیریت امکان ثبت مستندات جدید در سیستم RAG را دارند.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Ingested Documents List */}
              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle space-y-3">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-4 text-accent" />
                    لیست مستندات و منابع دانش‌نامه فعال
                  </h4>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {knowledgeList.length === 0 ? (
                      <p className="text-xs text-foreground-muted italic text-center py-6">هیچ سندی هنوز بارگذاری نشده است.</p>
                    ) : (
                      knowledgeList.map(doc => (
                        <div key={doc.id} className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between shadow-sm">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-foreground block">{doc.title}</span>
                            <span className="text-[10px] text-foreground-muted block font-mono">SLUG: {doc.slug}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3.5 border-t border-border">
              <Button
                onClick={() => setShowSettings(false)}
                className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-semibold rounded-md h-9 px-6 cursor-pointer"
              >
                بستن پنجره تنظیمات
              </Button>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}
