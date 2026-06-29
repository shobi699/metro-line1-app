'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Mic, AlertTriangle, Bot, Settings, X, Plus, FileText, HelpCircle, Terminal } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  isBento?: boolean
  source?: string
  articles?: Array<{ slug: string; title: string }>
}

interface CustomFieldDoc {
  id: string
  title: string
  slug: string
  category: string | null
  body: string
}

export function AiChatInterface() {
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'سیستم دستیار هوشمند خط ۱ آماده پاسخگویی است. لطفا سوال فنی، کد خطا (مانند E102 یا E205) یا موضوع بررسی خود را وارد کنید.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // AI Configuration States
  const [showSettings, setShowSettings] = useState(false)
  const [aiModel, setAiModel] = useState('gemini-1.5-pro')
  const [temperature, setTemperature] = useState(0.3)
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
  const handleSend = async () => {
    if (!input.trim() || loading) return
    setLoading(true)

    const userText = input.trim()
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

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
        const isBento = data.data.source === 'rulebook'
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'ai',
            content: reply,
            isBento: isBento,
            source: data.data.source,
            articles: data.data.articles,
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
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* HEADER: AI Model status & Settings trigger */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="z-10 flex items-center justify-between border-b border-border-subtle bg-surface-container-low px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/25 animate-pulse">
            <Bot className="size-5 text-accent" />
          </div>
          <div>
            <span className="font-semibold text-sm text-foreground block">دستیار هوشمند خط ۱</span>
            <span className="text-[10px] text-foreground-muted block font-mono">
              MODEL: {aiModel.toUpperCase()} | TEMP: {formatFarsiNumber(temperature.toString())}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-transparent hover:bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors cursor-pointer"
          >
            <Settings className="size-4 text-accent" />
            تنظیمات هوش مصنوعی و RAG
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-critical text-critical-foreground hover:bg-critical/90 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer">
            <AlertTriangle className="size-4 animate-bounce" />
            پروتکل‌های اضطراری
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* CHAT THREAD AREA */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-32">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            /* User Message Bubble - Positioned to the Left (justify-end in RTL) */
            <div key={msg.id} className="flex items-start gap-3 justify-end animate-fade-in-up">
              <div className="rounded-lg rounded-tl-none border border-accent/15 bg-accent/5 px-4 py-3 text-sm max-w-[75%] shadow-sm">
                <p className="font-medium text-foreground leading-relaxed">{msg.content}</p>
              </div>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high border border-border">
                <span className="text-[10px] font-semibold text-foreground-muted">شما</span>
              </div>
            </div>
          ) : msg.isBento ? (
            /* AI Bento Response (Critical Analysis box style) */
            <div key={msg.id} className="flex items-start gap-3 justify-start animate-fade-in-up">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Bot className="size-4" />
              </div>
              <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-accent/20 shadow-md">
                <div className="flex items-center gap-2 border-b border-border-subtle bg-gradient-to-r from-accent/10 to-transparent px-4 py-2.5">
                  <span className="size-2 rounded-full bg-accent animate-ping" />
                  <span className="text-xs font-semibold tracking-wide text-accent">
                    تحلیل بحرانی عیب و دستورالعمل
                  </span>
                  <span className="me-auto font-mono text-[10px] text-foreground-muted">
                    RAG Rulebook
                  </span>
                </div>

                <div className="p-4 bg-surface-container-lowest/40 space-y-4">
                  <div className="rounded-lg border border-border-subtle bg-surface-container-low p-3.5">
                    <h4 className="mb-2 text-xs font-semibold text-foreground-muted">
                      پروتکل اقدامات و ایمنی استخراج شده:
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line font-medium font-sans">
                      {msg.content}
                    </p>
                  </div>

                  {msg.articles && msg.articles.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-container-low/50 p-3.5">
                      <h4 className="text-xs font-semibold text-foreground-muted flex items-center gap-1.5">
                        <FileText className="size-3.5 text-accent" />
                        بخش‌های مرجع در دانش‌نامه:
                      </h4>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {msg.articles.map(art => (
                          <Badge key={art.slug} variant="outline" className="text-[10px] border-border bg-surface text-accent hover:bg-surface-hover">
                            {art.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Simple AI Message Bubble - Positioned to the Right (justify-start in RTL) */
            <div key={msg.id} className="flex items-start gap-3 justify-start animate-fade-in-up">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border shadow-sm">
                <Bot className="size-4 text-accent" />
              </div>
              <div className="rounded-lg rounded-tr-none border border-border bg-surface-container-high px-4 py-3 text-sm max-w-[75%] shadow-sm">
                <p className="text-foreground leading-relaxed whitespace-pre-line font-medium">{msg.content}</p>
                {msg.source && msg.source !== 'fallback' && (
                  <span className="inline-flex mt-2.5 text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-md font-semibold">
                    منبع: {msg.source === 'knowledge' ? 'دانش‌نامه RAG' : msg.source === 'rulebook' ? 'کتابچه قوانین' : msg.source}
                  </span>
                )}
              </div>
            </div>
          )
        )}
        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border animate-pulse">
              <Bot className="size-4 text-foreground-muted" />
            </div>
            <div className="rounded-lg rounded-tr-none border border-border bg-surface-container px-4 py-3 text-sm text-foreground-muted animate-pulse">
              دستیار هوشمند در حال استخراج و تحلیل پروتکل‌های ایمنی...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* INPUT AREA: Floating Glassmorphism Container */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative rounded-lg border border-border bg-surface/85 backdrop-blur-md p-2 shadow-lg flex items-center gap-2">
            <button className="p-2 text-foreground-muted hover:text-foreground transition-colors hover:bg-surface-hover rounded-md">
              <Mic className="size-4" />
            </button>
            <input
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none text-right font-sans"
              placeholder="کد خطا (مانند E102) یا سوال فنی خود را بپرسید..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground transition-all hover:bg-accent-hover active:scale-95 cursor-pointer"
            >
              <Send className="size-4 -rotate-90" />
            </button>
          </div>
          <div className="mt-2 text-center flex items-center justify-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] text-foreground-muted font-mono tracking-wider uppercase">
              Secure Railway AI Network | Line 1 Core
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL: AI RAG & DOCUMENTATION SETTINGS */}
      {/* ──────────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-3xl p-6 space-y-5 shadow-xl animate-fade-in text-right">
            
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-accent animate-spin-slow" />
                <h3 className="text-sm font-semibold text-foreground">تنظیمات هوش مصنوعی و پایگاه دانش RAG</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover p-1.5 rounded-md transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[480px] overflow-y-auto px-1">
              
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
                      className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (پیشنهادی)</option>
                      <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (سریع)</option>
                      <option value="gpt-4o">OpenAI GPT-4o (جامع)</option>
                      <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">درجه خلاقیت (Temperature):</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">حداکثر طول کلمات (Tokens):</label>
                      <input
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center"
                      />
                    </div>
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
                      <div className="p-2.5 bg-critical/10 border border-critical/20 text-critical text-xs rounded-md">
                        {docError}
                      </div>
                    ) : null}
                    {docSuccess ? (
                      <div className="p-2.5 bg-success/10 border border-success/20 text-success text-xs rounded-md">
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
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-foreground-muted">دسته‌بندی محتوا:</label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value)}
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="technical">دستورالعمل فنی</option>
                          <option value="safety">آیین‌نامه ایمنی</option>
                          <option value="operation">راهنمای راهبری</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">کلمات کلیدی/تگ‌ها (با کاما):</label>
                      <input
                        type="text"
                        placeholder="مثال: درب, ترمز, پنوماتیک, e102"
                        value={docTags}
                        onChange={(e) => setDocTags(e.target.value)}
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">متن کامل دستورالعمل فنی (محتوای سند):</label>
                      <textarea
                        rows={4}
                        placeholder="متن کامل دستورالعمل را در این قسمت کپی کنید..."
                        value={docBody}
                        onChange={(e) => setDocBody(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none font-medium leading-relaxed"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={ingestionLoading}
                      className="w-full bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-semibold h-9 rounded-md transition-colors cursor-pointer"
                    >
                      {ingestionLoading ? 'در حال ثبت در پایگاه دانش...' : 'ثبت و بارگذاری در RAG'}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-accent/5 border border-accent/15 p-4 rounded-lg">
                    <p className="text-xs text-accent leading-relaxed font-medium">
                      تنها کاربران با نقش مدیریت امکان ثبت مستندات جدید در سیستم RAG را دارند. کاربران عادی می‌توانند کدهای خطا را جهت استخراج خودکار راهنما سرچ کنند.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Ingested Documents List & Explanations */}
              <div className="space-y-4">
                
                {/* How it works Box */}
                <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle space-y-3 text-xs leading-relaxed text-foreground-muted">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="size-4 text-accent" />
                    سیستم RAG چگونه کار می‌کند؟
                  </h4>
                  <p>
                    مستندات و آیین‌نامه‌های ثبت شده در جدول <code className="text-accent font-semibold font-mono">knowledgeArticle</code> دیتابیس به عنوان پایگاه دانش محلی هوش مصنوعی عمل می‌کنند.
                  </p>
                  <p>
                    هنگامی که راهبر سوالی را مطرح می‌کند یا کد خطایی را می‌فرستد، سیستم هوشمند سرور به طور خودکار فیلدهای عنوان و متنِ اسناد آپلود شده را جستجو می‌کند. اطلاعات مرتبط استخراج شده و به پرامپت هوش مصنوعی ضمیمه می‌شوند.
                  </p>
                  <p className="font-semibold text-foreground bg-accent/5 border border-accent/10 p-2.5 rounded-md mt-1">
                    💡 برای لود شدن مستندات، کافیست متن دستورالعمل‌های خود را در فرم سمت چپ ثبت کنید تا بلافاصله به پایگاه دانش متصل گردند.
                  </p>
                </div>

                {/* List of uploaded documents */}
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
                          <Badge variant="outline" className="text-[10px] border-border-subtle bg-surface-container-high text-foreground-muted">
                            {doc.category === 'technical' ? 'فنی' : doc.category === 'safety' ? 'ایمنی' : 'راهبری'}
                          </Badge>
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
