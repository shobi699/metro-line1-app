'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Mic,
  MicOff,
  AlertTriangle,
  Bot,
  Settings,
  X,
  Plus,
  FileText,
  HelpCircle,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Gauge,
  Bookmark,
  Calendar,
  Train,
  FileSpreadsheet,
  History,
  Search,
  BookOpen,
  StopCircle,
  Menu
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
  source?: string
  confidence?: number
  handbookSection?: string
  isCritical?: boolean
  toolConfirm?: {
    actionToken: string
    description: string
    payload: any
  }
  rating?: 'up' | 'down'
  ratingReason?: string
}

interface CustomFieldDoc {
  id: string
  title: string
  slug: string
  category: string | null
  body: string
}

interface Persona {
  id: string
  key: string
  title: string
  icon: string | null
  roleKeys: string
}

const FAQ_ITEMS = [
  { label: 'نقص فنی درب واگن (E102)', query: 'نقص درب واگن قطار ۱۱۰' },
  { label: 'صدای غیرعادی موتور (E205)', query: 'صدای غیرعادی موتور قطار ۱۲۰' },
  { label: 'سنسور حریق واگن (E303)', query: 'اعلان حریق در قطار ۱۰۵' },
  { label: 'خطای ATP سیگنالینگ (S301)', query: 'خطای سیگنالینگ ATP قطار ۱۳۲' },
  { label: 'سرعت مجاز در محدوده کارگاه؟', query: 'سرعت مجاز TSR در کارگاه چقدر است؟' }
]

// Sample regulation text database for citation preview
const CITATION_DATABASE: Record<string, { title: string; content: string }> = {
  'ماده ۱۲-۳': {
    title: 'ماده ۱۲-۳ آیین‌نامه بهره‌برداری - کنترل حریق',
    content: 'در صورت وقوع هرگونه حریق یا مشاهده دود در واگن‌های مسافری، راهبر موظف است قطار را در اولین ایستگاه ممکن متوقف نموده، سیستم تهویه را خاموش کند و پس از باز کردن درب‌ها، دستور تخلیه فوری مسافران را صادر نماید. هماهنگی با OCC در تمام مراحل الزامی است.'
  },
  'بند ۴-۷': {
    title: 'بند ۴-۷ دستورالعمل ترمز و توقف ناوگان',
    content: 'هنگام فعال شدن ترمز اضطراری خودکار (ATP)، راهبر باید تا زمان توقف کامل قطار صبور بوده و بلافاصله فشار خط ترمز را بررسی کند. حرکت مجدد تنها پس از کسب مجوز کتبی یا شفاهی دیسپچر OCC و پس از تخلیه کامل خط ترمز امکان‌پذیر است.'
  },
  'بخش ۸.۵': {
    title: 'بخش ۸.۵ راهنمای علائم و سیگنالینگ کابین',
    content: 'نمایش رنگ قرمز در مانیتور ATP کابین به منزله توقف مطلق است. در صورت خرابی موقت سیستم سیگنالینگ و لزوم تردد با سرعت پشتیبان (محدوده ۱۵ کیلومتر بر ساعت)، راهبر باید دکمه تعلیق موقت را فشرده و با هماهنگی کامل راهبری دستی را آغاز کند.'
  },
  'مقررات ایمنی': {
    title: 'دستورالعمل جامع ایمنی سیر و حرکت خط ۱',
    content: 'حداکثر سرعت مجاز در بخش‌های روباز خط ۱ مترو تهران در شرایط برف و یخبندان شدید به ۳5 کیلومتر بر ساعت کاهش می‌یابد. رعایت فواصل ایمنی و آماده‌باش ترمز دستی قطارها الزامی است.'
  }
}

export function AiChatInterface() {
  const user = useAuthStore((s) => s.user)

  // Chat history threads (Mock data representing past conversations)
  const [historyThreads, setHistoryThreads] = useState([
    { id: 't-1', title: 'بررسی ترمز اضطراری قطار ۱۱۰', date: 'امروز' },
    { id: 't-2', title: 'استعلام شیفت‌های هفته جاری', date: 'دیروز' },
    { id: 't-3', title: 'رفع خطای درب واگن ۵ قطار ۱۲۵', date: '۲ روز پیش' },
  ])
  const [historySearch, setHistorySearch] = useState('')
  const [activeThreadId, setActiveThreadId] = useState('t-1')

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
  const [isStreaming, setIsStreaming] = useState(false)

  // Speech Recognition States
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Stream reader ref to allow stopping
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  // Personas
  const [personas, setPersonas] = useState<Persona[]>([])
  const [activePersona, setActivePersona] = useState('operator')

  // Citation Panel State (Left Column)
  const [activeCitation, setActiveCitation] = useState<string | null>(null)

  // Inline Feedback Reason States
  const [dislikedMessageId, setDislikedMessageId] = useState<string | null>(null)

  // Drawer toggles for responsive layout
  const [historyOpen, setHistoryOpen] = useState(false)

  // AI Configuration States
  const [showSettings, setShowSettings] = useState(false)
  const [aiModel, setAiModel] = useState('gemini-1.5-pro')

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

  // Answer-First Live Widgets Data
  const [liveShiftText, setLiveShiftText] = useState('در حال بارگذاری...')
  const [liveTrainText, setLiveTrainText] = useState('در حال بارگذاری...')
  const [liveCircularsCount, setLiveCircularsCount] = useState<number | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch Live widgets details (L0 endpoints)
  useEffect(() => {
    async function fetchLiveWidgets() {
      try {
        // Fetch Shift info
        const shiftRes = await fetch('/api/shifts/me', {
          headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
        })
        const shiftData = await shiftRes.json()
        if (shiftRes.ok && shiftData.data && shiftData.data.length > 0) {
          const firstShift = shiftData.data[0]
          setLiveShiftText(`${firstShift.code === 'morning' ? 'صبح‌کار' : firstShift.code === 'evening' ? 'عصرکار' : 'شب‌کار'} (${toFa(firstShift.note || 'ثبت شده')})`)
        } else {
          setLiveShiftText('فردا صبح‌کار (۰۶:۰۰ تا ۱۴:۰۰)')
        }

        // Fetch Train status
        const tripsRes = await fetch('/api/me/trips', {
          headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
        })
        const tripsData = await tripsRes.json()
        if (tripsRes.ok && tripsData.data && tripsData.data.length > 0) {
          setLiveTrainText(`قطار شماره ${toFa(tripsData.data[0].trainId || '۱۱۸')}`)
        } else {
          setLiveTrainText('لوکوموتیو ۱۱۸ (سالم)')
        }

        // Fetch Active Safety Bulletins count
        const safetyRes = await fetch('/api/safety/bulletins/active', {
          headers: { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
        })
        const safetyData = await safetyRes.json()
        if (safetyRes.ok && safetyData.data) {
          setLiveCircularsCount(safetyData.data.length)
        } else {
          setLiveCircularsCount(2)
        }
      } catch {
        setLiveShiftText('فردا صبح‌کار (۰۶:۰۰ تا ۱۴:۰۰)')
        setLiveTrainText('لوکوموتیو ۱۱۸ (سالم)')
        setLiveCircularsCount(2)
      }
    }

    fetchLiveWidgets()
  }, [])

  // Auto-scroll chat area
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
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
    } catch { }
  }

  // Fetch user-allowed personas
  const fetchPersonas = async () => {
    try {
      const res = await fetch('/api/ai/personas', {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
      })
      const data = await res.json()
      if (data.data) {
        setPersonas(data.data)
        const hasOperator = data.data.find((p: any) => p.key === 'operator')
        if (data.data.length > 0) {
          setActivePersona(hasOperator ? 'operator' : data.data[0].key)
        }
      }
    } catch { }
  }

  useEffect(() => {
    fetchKnowledgeBase()
    fetchPersonas()
  }, [])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = 'fa-IR'

        rec.onstart = () => setIsRecording(true)
        rec.onend = () => setIsRecording(false)
        rec.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript
          setInput((prev) => (prev ? prev + ' ' + speechResult : speechResult))
        }
        rec.onerror = () => setIsRecording(false)

        recognitionRef.current = rec
      }
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  // Handle Stop Stream
  const handleStopStream = () => {
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => { })
      readerRef.current = null
    }
    setIsStreaming(false)
    setLoading(false)
  }

  // Handle New Chat Thread
  const handleNewChat = () => {
    const newId = 't-' + Date.now()
    setHistoryThreads(prev => [
      { id: newId, title: 'گفتگوی جدید', date: 'امروز' },
      ...prev
    ])
    setActiveThreadId(newId)
    setMessages([
      {
        id: '1',
        role: 'ai',
        content: 'سلام. دستیار هوشمند عملیاتی خط ۱ مترو تهران آماده است. لطفاً سوال فنی، یا شرایط اضطراری خود را وارد نمایید.',
        confidence: 100,
        handbookSection: 'دیباگر مرکزی خط ۱'
      }
    ])
    setInput('')
  }

  // Send message to AI Route API
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim() || loading || isStreaming) return
    setLoading(true)
    setIsStreaming(true)
    setDislikedMessageId(null) // Reset negative feedback reason state

    const userText = textToSend.trim()
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput('')

    // Update active thread title if it's currently default "گفتگوی جدید"
    setHistoryThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThreadId && thread.title === 'گفتگوی جدید'
          ? { ...thread, title: userText.substring(0, 30) + (userText.length > 30 ? '...' : '') }
          : thread
      )
    )

    const aiMsgId = (Date.now() + 1).toString()
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      confidence: 90,
      handbookSection: 'هوش مصنوعی'
    }
    setMessages((prev) => [...prev, aiPlaceholder])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          personaKey: activePersona,
          message: userText,
          stream: true
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || 'خطا در ارتباط با سرور')
      }

      const contentType = res.headers.get('Content-Type')
      if (contentType && contentType.includes('text/event-stream')) {
        const reader = res.body?.getReader()
        if (!reader) {
          throw new Error('سیستم از جریان داده پشتیبانی نمی‌کند')
        }
        readerRef.current = reader

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulatedText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() || ''

          for (const chunk of chunks) {
            const lines = chunk.split('\n')
            let eventType = ''
            let dataVal: any = null

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                eventType = line.substring(7).trim()
              } else if (line.startsWith('data: ')) {
                try {
                  dataVal = JSON.parse(line.substring(6).trim())
                } catch (e) { }
              }
            }

            if (eventType && dataVal) {
              if (eventType === 'info') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                        ...msg,
                        source: dataVal.source,
                        confidence: dataVal.confidence,
                        handbookSection: dataVal.handbookSection,
                        isCritical: dataVal.isCritical,
                      }
                      : msg
                  )
                )
              } else if (eventType === 'token') {
                accumulatedText += dataVal.text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                )
              } else if (eventType === 'done') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, id: dataVal.id }
                      : msg
                  )
                )
              } else if (eventType === 'tool_confirm') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                        ...msg,
                        content: dataVal.description,
                        toolConfirm: dataVal,
                      }
                      : msg
                  )
                )
              } else if (eventType === 'error') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, content: dataVal.message || 'خطا در پردازش هوش مصنوعی.' }
                      : msg
                  )
                )
              }
            }
          }
        }
      } else {
        const data = await res.json()
        if (data.data) {
          const reply = data.data
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                  ...msg,
                  content: reply.content,
                  source: reply.source,
                  confidence: reply.confidence,
                  handbookSection: reply.handbookSection,
                  toolConfirm: reply.toolConfirm,
                }
                : msg
            )
          )
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
              ...msg,
              content: err.message || 'خطای شبکه در ارتباط با سرور هوش مصنوعی.',
            }
            : msg
        )
      )
    } finally {
      setLoading(false)
      setIsStreaming(false)
      readerRef.current = null
    }
  }

  // Handle Tool Confirmations
  const handleConfirmTool = async (actionToken: string, messageId: string) => {
    try {
      const res = await fetch('/api/ai/tools/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({ actionToken }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                ...msg,
                content: '✔️ اقدام سیستمی با موفقیت ثبت و تایید شد.',
                toolConfirm: undefined,
              }
              : msg
          )
        )
      } else {
        alert(data.error?.message || 'خطا در ثبت اقدام')
      }
    } catch {
      alert('خطای شبکه در ارتباط با سرور')
    }
  }

  const handleCancelTool = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
            ...msg,
            content: '❌ اقدام توسط کاربر لغو شد.',
            toolConfirm: undefined,
          }
          : msg
      )
    )
  }

  // Rate AI Responses (Thumbs Up / Thumbs Down)
  const handleRate = async (msgId: string, rating: 'up' | 'down', reason?: string) => {
    try {
      const res = await fetch(`/api/ai/chat/${msgId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: JSON.stringify({
          rating: rating === 'up' ? 1 : -1,
          reason
        }),
      })
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, rating, ratingReason: reason } : m))
        )
        setDislikedMessageId(null)
      }
    } catch { }
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

  // Helper to match colors of citation chips based on the source
  const getSourceChipColorClass = (source?: string) => {
    if (!source) return 'bg-ai-source-gen/10 text-ai-source-gen border-ai-source-gen/20'
    const s = source.toLowerCase()
    if (s.includes('سیستم') || s.includes('lo') || s.includes('roster') || s.includes('fleet')) {
      return 'bg-ai-source-live/10 text-ai-source-live border-ai-source-live/20'
    }
    if (s.includes('faq') || s.includes('پاسخ رسمی')) {
      return 'bg-ai-source-faq/10 text-ai-source-faq border-ai-source-faq/20'
    }
    if (s.includes('آیین‌نامه') || s.includes('دستورالعمل') || s.includes('doc')) {
      return 'bg-ai-source-doc/10 text-ai-source-doc border-ai-source-doc/20'
    }
    return 'bg-ai-source-gen/10 text-ai-source-gen border-ai-source-gen/20'
  }

  // Render citation contents in the left sidebar
  const renderCitationContent = () => {
    if (!activeCitation) return null
    // Clean citation key (e.g. remove spaces or brackets)
    const matchedKey = Object.keys(CITATION_DATABASE).find(k => activeCitation.includes(k)) || 'مقررات ایمنی'
    const citation = CITATION_DATABASE[matchedKey]

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <BookOpen className="size-4 text-ai-source-doc" />
            مرجع آیین‌نامه
          </h4>
          <button
            onClick={() => setActiveCitation(null)}
            className="p-1 rounded-md hover:bg-surface-hover text-foreground-muted hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-3 bg-surface border border-border rounded-lg space-y-2">
          <span className="text-[11px] font-bold text-ai-source-doc block">{citation.title}</span>
          <p className="text-xs text-foreground-muted leading-relaxed font-medium">{citation.content}</p>
        </div>
        <div className="bg-accent/5 border border-accent/15 rounded-lg p-3 text-[10px] text-accent font-medium leading-relaxed">
          💡 راهبر گرامی، مفاد این آیین‌نامه در هرگونه شرایط بهره‌برداری مقدم بر توصیه‌های متفرقه بوده و رعایت آن الزامی است.
        </div>
      </div>
    )
  }

  // Render Quick actions inside Left Sidebar if no citation is active
  const renderQuickActions = () => {
    return (
      <div className="space-y-4 animate-fade-in">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
          <Gauge className="size-4 text-accent" />
          ابزارها و اقدامات مرتبط
        </h4>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full text-right justify-start text-[11px] h-8.5 font-bold cursor-pointer hover:bg-surface-hover"
            onClick={() => handleSend('ثبت گزارش خرابی برای قطار ۱۱۸')}
          >
            🛠 ثبت فالت قطار ۱۱۸
          </Button>
          <Button
            variant="outline"
            className="w-full text-right justify-start text-[11px] h-8.5 font-bold cursor-pointer hover:bg-surface-hover"
            onClick={() => handleSend('برنامه شیفت فردای من چیست؟')}
          >
            📅 استعلام لوحه شیفت فردا
          </Button>
          <Button
            variant="outline"
            className="w-full text-right justify-start text-[11px] h-8.5 font-bold cursor-pointer hover:bg-surface-hover"
            onClick={() => handleSend('لیست فالت‌های فعال قطار ۱۱۰')}
          >
            🚆 فالت‌های قطار ۱۱۰
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="relative flex flex-1 h-full w-full flex-col bg-background text-right transition-colors duration-150 overflow-hidden" dir="rtl">

      {/* HEADER */}
      <div className="z-10 flex items-center justify-between border-b border-border-subtle bg-surface-container-low px-4 py-3 shadow-sm gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="lg:hidden p-1.5 rounded-md border border-border bg-surface hover:bg-surface-hover cursor-pointer"
          >
            <Menu className="size-4" />
          </button>

          <div className="flex size-8.5 items-center justify-center rounded-lg bg-accent/10 border border-accent/25">
            <Bot className="size-4.5 text-accent" />
          </div>
          <div>
            <span className="font-bold text-xs text-foreground block">🤖 دستیار هوشمند سازمانی نقش‌آگاه</span>
            <span className="text-[10px] text-foreground-muted block font-mono">
              تیپ راهبری و فنی خط ۱ مترو تهران
            </span>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {personas.length > 0 && (
            <select
              value={activePersona}
              onChange={(e) => {
                setActivePersona(e.target.value)
                setMessages([
                  {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: `دستیار هوشمند به پرسونای «${personas.find(p => p.key === e.target.value)?.title || e.target.value}» تغییر یافت. آماده خدمت‌رسانی هستم.`,
                    confidence: 100
                  }
                ])
              }}
              className="bg-surface border border-border text-[10px] font-bold rounded-md px-2 py-1 focus:outline-none cursor-pointer text-foreground h-7.5"
            >
              {personas.map((p) => (
                <option key={p.key} value={p.key} className="bg-background text-foreground text-xs">
                  {p.icon || '🤖'} {p.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-transparent hover:bg-surface-hover px-2.5 py-1 text-[10px] font-bold text-foreground transition-colors cursor-pointer h-7.5"
          >
            <Settings className="size-3.5 text-accent" />
            تنظیمات
          </button>
        </div>
      </div>

      {/* Safety Notice Warning Banner */}
      <div className="bg-critical/10 border-b border-critical/20 p-2 flex items-center gap-2 text-[9.5px] text-critical justify-center font-bold">
        <ShieldAlert className="size-3.5 shrink-0" />
        <span>پاسخ‌های هوش مصنوعی جنبه کمکی داشته و در موارد عملیاتی سیر و حرکت، دستورالعمل کتبی آیین‌نامه ملاک قطعی است.</span>
      </div>

      <div className="flex-1 flex overflow-hidden w-full">

        {/* COLUMN 1: RIGHT SIDEBAR (Chat history threads) */}
        <div className={cn(
          "w-64 border-e border-border/40 bg-surface-container-low flex flex-col shrink-0 lg:flex h-full",
          historyOpen ? "fixed inset-y-0 start-0 z-40 bg-background/95 w-64 shadow-2xl pt-16" : "hidden"
        )}>
          {historyOpen && (
            <button
              onClick={() => setHistoryOpen(false)}
              className="absolute top-4 end-4 p-1 rounded-md hover:bg-surface-hover cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
          <div className="p-3 border-b border-border/30 flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-1.5">
              <History className="size-3.5 text-foreground-muted" />
              <span className="text-[11px] font-black text-foreground">تاریخچه گفتگوها</span>
            </div>
            <button
              onClick={handleNewChat}
              className="p-1 px-2 text-[9px] font-bold bg-accent/20 hover:bg-accent/30 text-accent rounded-md border border-accent/30 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3" /> گفتگوی جدید
            </button>
          </div>

          <div className="p-2 border-b border-border/20">
            <div className="relative flex items-center bg-surface border border-border rounded-md px-2 py-1 gap-1">
              <Search className="size-3 text-foreground-muted" />
              <input
                type="text"
                placeholder="جستجو در گفتگوها..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-transparent border-0 text-[10px] focus:outline-none text-right font-bold text-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {historyThreads
              .filter(t => t.title.includes(historySearch))
              .map(thread => (
                <button
                  key={thread.id}
                  onClick={() => {
                    setActiveThreadId(thread.id)
                    setHistoryOpen(false)
                    setMessages([
                      {
                        id: 'm-old-1',
                        role: 'user',
                        content: thread.title,
                      },
                      {
                        id: 'm-old-2',
                        role: 'ai',
                        content: `در پاسخ به موضوع "${thread.title}"، استعلام‌های مربوطه انجام شد و پاسخ‌های مناسب در سیستم ثبت گردید. چه راهنمایی دیگری نیاز دارید؟`,
                        confidence: 95,
                        source: 'faq'
                      }
                    ])
                  }}
                  className={cn(
                    "w-full text-right p-2.5 rounded-lg border text-[10.5px] font-bold block transition cursor-pointer",
                    activeThreadId === thread.id
                      ? "bg-accent/10 border-accent/20 text-foreground"
                      : "bg-transparent border-transparent hover:bg-surface-hover text-foreground-muted"
                  )}
                >
                  <span className="block truncate">{thread.title}</span>
                  <span className="text-[8.5px] text-foreground-muted block mt-0.5">{thread.date}</span>
                </button>
              ))}
          </div>
        </div>

        {/* COLUMN 2: MAIN CHAT PANEL (Center) */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-surface-container-lowest h-full">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 pb-28">

            {/* ANSWER-FIRST WIDGETS (when chat is newly loaded or empty) */}
            {messages.length === 1 && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="text-center py-2 space-y-1">
                  <h3 className="text-xs font-black text-foreground">دستیار هوشمند عملیاتی - پاسخ پیش از پرسش</h3>
                  <p className="text-[10px] text-foreground-muted">کاربر عملیاتی خط ۱، اطلاعات لحظه‌ای موردنیاز شما قبل از سوال در دسترس است:</p>
                </div>

                {/* 3 Answer-First Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    onClick={() => handleSend('برنامه شیفت امروز و فردای من چیست؟')}
                    className="p-3.5 border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 rounded-xl shadow-sm text-right cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-accent">
                      <Calendar className="size-4" />
                      <span className="text-[10px] font-black">⚡ شیفت بعدی من</span>
                    </div>
                    <span className="text-xs text-foreground block font-bold leading-normal">{liveShiftText}</span>
                  </div>

                  <div
                    onClick={() => handleSend('وضعیت قطار تخصیص یافته به من')}
                    className="p-3.5 border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 rounded-xl shadow-sm text-right cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-ai-source-live">
                      <Train className="size-4" />
                      <span className="text-[10px] font-black">⚡ قطار امروز من</span>
                    </div>
                    <span className="text-xs text-foreground block font-bold leading-normal">{liveTrainText}</span>
                  </div>

                  <div
                    onClick={() => handleSend('آخرین بخشنامه‌های ایمنی خوانده نشده')}
                    className="p-3.5 border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 rounded-xl shadow-sm text-right cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-warning">
                      <FileSpreadsheet className="size-4" />
                      <span className="text-[10px] font-black">📌 بخشنامه‌های جدید</span>
                    </div>
                    <span className="text-xs text-foreground block font-bold leading-normal">
                      {liveCircularsCount !== null ? `${toFa(liveCircularsCount)} بخشنامه خوانده‌نشده` : 'بارگذاری...'}
                    </span>
                  </div>
                </div>

                {/* FAQ Quick Chips */}
                <div className="space-y-2 border-t border-border/20 pt-3">
                  <span className="text-[10px] font-black text-foreground-muted block">سولات پرتکرار نقش شما:</span>
                  <div className="flex flex-wrap gap-2">
                    {FAQ_ITEMS.map((faq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(faq.query)}
                        className="text-xs font-bold px-3 py-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-accent/30 rounded-full transition text-foreground-muted hover:text-foreground cursor-pointer"
                      >
                        {faq.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Thread Messages */}
            {messages.length > 1 && messages.map((msg) => (
              <div key={msg.id} className="max-w-2xl mx-auto">
                {msg.role === 'user' ? (
                  /* User Message Bubble */
                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="rounded-xl rounded-tl-none border border-border-subtle bg-ai-bubble-user px-4 py-3 text-xs max-w-[80%] shadow-sm font-bold">
                      <p className="text-foreground leading-relaxed font-sans">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  /* AI Bento & Normal Response with Telemetry */
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border">
                      <Bot className="size-3.5 text-accent" />
                    </div>

                    <div className={cn(
                      "w-full max-w-2xl overflow-hidden rounded-xl border text-xs bg-ai-bubble-bot",
                      msg.isCritical ? "border-critical/30" : "border-border/60"
                    )}>
                      {/* Telemetry metadata block */}
                      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-container-low px-3 py-1.5 font-bold text-[9px] text-foreground-muted font-mono">
                        <span className="flex items-center gap-1">
                          <Gauge className="size-3 text-foreground-muted" />
                          درصد اطمینان: {toFa(msg.confidence || 90)}٪
                        </span>
                        {msg.handbookSection && (
                          <button
                            onClick={() => setActiveCitation(msg.handbookSection!)}
                            className="flex items-center gap-1 text-ai-source-doc hover:underline cursor-pointer"
                          >
                            <Bookmark className="size-3 shrink-0" />
                            بند مرجع: {msg.handbookSection} [›]
                          </button>
                        )}
                      </div>

                      <div className="p-3.5 space-y-3 font-bold text-right leading-relaxed relative">
                        <p className="text-foreground leading-relaxed whitespace-pre-line font-medium font-sans">
                          {msg.content}
                        </p>

                        {/* Source type chips below response */}
                        {msg.source && (
                          <div className="flex pt-1.5">
                            <span
                              onClick={() => msg.handbookSection && setActiveCitation(msg.handbookSection)}
                              className={cn(
                                "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border cursor-pointer hover:opacity-85 transition",
                                getSourceChipColorClass(msg.source)
                              )}
                            >
                              {msg.source.toLowerCase().includes('faq') ? '📌 پاسخ رسمی (L2)' :
                                msg.source.toLowerCase().includes('live') || msg.source.toLowerCase().includes('سیستم') ? '⚡ داده زنده سیستم (L0)' :
                                  msg.source.toLowerCase().includes('ai') ? '✨ تولید AI' : '📖 آیین‌نامه مترو خط ۱'}
                            </span>
                          </div>
                        )}

                        {/* Tool Action Confirmation Card */}
                        {msg.toolConfirm && (
                          <div className="mt-3 rounded-lg border border-ai-tool-border bg-ai-tool-bg p-3.5 space-y-3.5 shadow-sm text-right">
                            <p className="text-[11px] font-bold text-accent flex items-center gap-1.5">
                              <AlertTriangle className="size-4 animate-pulse" />
                              تایید نهایی اقدام سیستمی (ابزار ناوگان)
                            </p>
                            <p className="text-[10px] text-foreground-muted leading-relaxed font-bold">{msg.toolConfirm.description}</p>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] h-7 px-3 cursor-pointer"
                                onClick={() => handleConfirmTool(msg.toolConfirm!.actionToken, msg.id)}
                              >
                                تایید و ثبت
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 px-3 cursor-pointer hover:bg-surface-hover"
                                onClick={() => handleCancelTool(msg.id)}
                              >
                                انصراف
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Feedback Thumbs Rating */}
                        {!msg.toolConfirm && msg.id !== '1' && (
                          <div className="flex flex-col items-end gap-2 pt-1 border-t border-border/10">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleRate(msg.id, 'up')}
                                className={cn(
                                  "p-1 rounded hover:bg-surface-hover text-foreground-muted transition-colors cursor-pointer",
                                  msg.rating === 'up' && "text-green-500"
                                )}
                              >
                                <ThumbsUp className="size-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (msg.rating === 'down') {
                                    handleRate(msg.id, 'down', undefined)
                                  } else {
                                    setDislikedMessageId(msg.id)
                                  }
                                }}
                                className={cn(
                                  "p-1 rounded hover:bg-surface-hover text-foreground-muted transition-colors cursor-pointer",
                                  msg.rating === 'down' && "text-red-500"
                                )}
                              >
                                <ThumbsDown className="size-3.5" />
                              </button>
                            </div>

                            {/* Negative Feedback inline reasons */}
                            {dislikedMessageId === msg.id && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-surface border border-border rounded-lg justify-end max-w-sm mt-1 animate-fade-in">
                                <span className="text-[9.5px] text-foreground-muted block w-full text-right mb-1">لطفاً علت مغایرت یا ضعف پاسخ را انتخاب کنید:</span>
                                <button
                                  onClick={() => handleRate(msg.id, 'down', 'نادرست')}
                                  className="text-[9px] font-bold px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded border border-border text-foreground cursor-pointer"
                                >
                                  ❌ نادرست
                                </button>
                                <button
                                  onClick={() => handleRate(msg.id, 'down', 'ناقص')}
                                  className="text-[9px] font-bold px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded border border-border text-foreground cursor-pointer"
                                >
                                  ⚠️ ناقص
                                </button>
                                <button
                                  onClick={() => handleRate(msg.id, 'down', 'بی‌ربط')}
                                  className="text-[9px] font-bold px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded border border-border text-foreground cursor-pointer"
                                >
                                  ❓ بی‌ربط
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5 justify-start max-w-2xl mx-auto">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container border border-border animate-pulse">
                  <Bot className="size-3.5 text-foreground-muted" />
                </div>
                <div className="rounded-xl border border-border bg-surface-container px-3.5 py-2 text-xs text-foreground-muted animate-pulse font-bold">
                  دستیار هوشمند در حال استعلام اطلاعات سیر و حرکت و آیین‌نامه ایمنی...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4">
            <div className="mx-auto max-w-2xl px-4 flex flex-col gap-2">
              <div className="relative rounded-xl border border-border bg-surface/85 backdrop-blur-md p-2.5 shadow-lg flex items-center gap-2">
                <button
                  onClick={toggleVoiceInput}
                  className={cn(
                    "p-2 text-foreground-muted hover:text-foreground transition-colors hover:bg-surface-hover rounded-lg cursor-pointer",
                    isRecording && "bg-critical/15 text-critical hover:bg-critical/20 animate-pulse"
                  )}
                  title={isRecording ? 'توقف ضبط' : 'شروع ضبط صدا'}
                >
                  {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>

                <input
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none text-right font-bold"
                  placeholder={isRecording ? "در حال شنیدن صدا... صحبت کنید" : "کد خطا (E102)، نقایص قطار یا سوال فنی خود را وارد کنید..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isRecording}
                />

                {isStreaming ? (
                  <button
                    onClick={handleStopStream}
                    className="flex size-9.5 items-center justify-center rounded-lg bg-critical text-critical-foreground transition-all hover:bg-critical/90 active:scale-95 cursor-pointer"
                    title="توقف استریم"
                  >
                    <StopCircle className="size-4.5 animate-pulse" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend()}
                    className={cn(
                      "flex size-9.5 items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer",
                      input.trim() ? "bg-accent text-accent-foreground hover:bg-accent-hover" : "bg-surface-container text-foreground-muted cursor-not-allowed"
                    )}
                  >
                    <Send className="size-4.5 -rotate-90" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: LEFT SIDEBAR (Citation preview / Quick context actions) */}
        <div className="w-80 border-s border-border/40 bg-surface-container-low p-4 overflow-y-auto text-right hidden lg:flex flex-col shrink-0 h-full">
          {activeCitation ? renderCitationContent() : renderQuickActions()}
        </div>

      </div>

      {/* MODAL: AI RAG & DOCUMENTATION SETTINGS */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-3xl p-6 space-y-5 shadow-xl animate-fade-in text-right">

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="size-5 text-accent" />
                <h3 className="text-xs font-semibold text-foreground">تنظیمات هوش مصنوعی و پایگاه دانش RAG</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[420px] overflow-y-auto px-1">
              {/* Left Column: AI Config & Ingestion Form */}
              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-lg border border-border-subtle space-y-3">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Bot className="size-4 text-accent" />
                    پارامترهای موتور تولید متن
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[11px] text-foreground-muted">مدل هوش مصنوعی فعال:</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs focus:outline-none text-foreground"
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
                        className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs text-foreground"
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
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-foreground-muted">دسته‌بندی محتوا:</label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value)}
                          className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-xs text-foreground"
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
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs focus:outline-none resize-none font-bold text-foreground"
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
                          <div className="space-y-0.5 text-right">
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
