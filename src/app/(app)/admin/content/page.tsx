'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { jalali } from '@/lib/fa'
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Newspaper,
  ArrowRight,
  Settings,
  Globe,
  Sparkles,
  Bold,
  Heading,
  List,
  Image,
  FileText,
  AlertCircle,
  Award,
  Link2,
  Trash,
  Check,
  Clock,
  Settings2,
  ChevronUp,
  ChevronDown,
  Video,
  FileCode,
  EyeOff,
  Send,
  Download,
  Table as TableIcon,
  Code as CodeIcon,
  Minus as DividerIcon,
  AlertTriangle as AlertIcon,
  Paperclip,
  CheckSquare,
  FoldVertical,
  Headphones,
  Highlighter,
  Sigma,
  FileDown,
  MapPin,
  MousePointerClick,
  Images,
  GitCommit,
  ListOrdered,
  Megaphone,
  Terminal,
  Library,
  X,
} from 'lucide-react'
import { toFa } from '@/lib/fa'

interface AdminPost {
  id: string
  type: string
  title: string
  slug: string
  category: string | null
  tags: string | null
  published: boolean
  mandatory: boolean
  status: string
  publishAt: string | null
  nextReviewAt: string | null
  createdAt: string
  author: { name: string }
  _count: { reads: number }
}

interface FormState {
  id: string | null
  type: string
  title: string
  slug: string
  category: string
  tags: string[]
  excerpt: string
  body: string
  coverUrl: string
  mediaUrl: string
  mediaType: string
  published: boolean
  mandatory: boolean
  status: string
  targetRoles: string[]
  // New Announcement Platform fields
  kind: 'news' | 'notice' | 'must_read' | 'urgent_banner' | 'emergency'
  audience: {
    roles: string[]
    groups: string[]
    stations: string[]
    shiftCodes: string[]
    userIds: string[]
  }
  surfaces: string[]
  priority: number
  pinnedUntil: string
  expiresAt: string
  ackRequired: boolean
  ackDeadline: string
  bannerStyle: {
    color: 'red' | 'amber' | 'blue' | 'green'
    icon: string
    dismissible: boolean
  }
  notifyRuleKey: string
}

export interface QuizQuestionDef {
  q: string
  options: string[]
  answerIndex: number
}

export interface EditorBlock {
  id: string
  type: 'paragraph' | 'heading' | 'quote' | 'list' | 'video' | 'image' | 'table' | 'alert' | 'code' | 'divider' | 'file' | 'checklist' | 'accordion' | 'audio' | 'highlight' | 'math' | 'pdf' | 'map' | 'button' | 'gallery' | 'timeline' | 'steps' | 'notice' | 'terminal' | 'term'
  content: string
  level?: 2 | 3
  caption?: string
  alertType?: 'info' | 'warning' | 'critical'
  language?: string
  summary?: string
  href?: string
  termName?: string
}

const TYPE_LABELS: Record<string, string> = {
  news: 'اخبار خط ۱',
  blog: 'مقاله و وبلاگ',
  training: 'دوره آموزشی',
  circular: 'بخش‌نامه ایمنی',
  gallery: 'گالری چندرسانه‌ای',
  announcement: 'اطلاعیه اداری',
  directive: 'دستورالعمل عملیاتی',
  form: 'فرم و فایل',
}

const EMPTY_FORM: FormState = {
  id: null,
  type: 'news',
  title: '',
  slug: '',
  category: '',
  tags: [],
  excerpt: '',
  body: '',
  coverUrl: '',
  mediaUrl: '',
  mediaType: '',
  published: true,
  mandatory: false,
  status: 'draft',
  targetRoles: ['all'],
  kind: 'news',
  audience: {
    roles: ['all'],
    groups: [],
    stations: [],
    shiftCodes: [],
    userIds: [],
  },
  surfaces: ['feed'],
  priority: 0,
  pinnedUntil: '',
  expiresAt: '',
  ackRequired: false,
  ackDeadline: '',
  bannerStyle: {
    color: 'red',
    icon: '',
    dismissible: true,
  },
  notifyRuleKey: '',
}

const POPULAR_CATEGORIES = ['مقررات عمومی سیر و حرکت', 'عیب‌یابی فنی واگن', 'آموزش ایمنی ایستگاه', 'اطلاعیه‌های اداری', 'دستورالعمل OCC']

const TARGET_ROLES_OPTIONS = [
  { value: 'all', label: 'همه پرسنل خط ۱' },
  { value: 'driver', label: 'راهبران قطار' },
  { value: 'dispatcher', label: 'کنترلرهای OCC' },
  { value: 'technician', label: 'تکنسین‌های فنی دپو' },
  { value: 'station', label: 'ماموران ایستگاه و سکو' },
]

function AdminContentPageContent() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [contentCategories, setContentCategories] = useState<{ id: string; title: string; slug: string; color: string | null }[]>([])

  
  // Query Parameter Direct Edit Listener
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [loading, setLoading] = useState(true)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const renderFileUpload = (block: EditorBlock, accept: string, placeholder: string, labelTitle: string = "آدرس فایل (لینک مستقیم):", updateBlockContent: (id: string, content: string) => void) => {
    return (
      <div className="flex flex-col gap-1.5">
        <Label className="text-[10px] text-foreground-muted">{labelTitle}</Label>
        <div className="flex gap-2">
          <Input
            value={block.content}
            onChange={(e) => updateBlockContent(block.id, e.target.value)}
            placeholder={placeholder}
            className="h-8 text-xs font-mono text-left dir-ltr flex-1"
          />
          <input
            type="file"
            accept={accept}
            className="hidden"
            id={`upload-${block.id}`}
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file || !accessToken) return
              if (file.size > 100 * 1024 * 1024) {
                alert('حجم فایل بیش از ۱۰۰ مگابایت است')
                return
              }
              const fd = new FormData()
              fd.append('file', file)
              try {
                const res = await fetch('/api/uploads', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${accessToken}` },
                  body: fd,
                })
                let data: any = null
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                  data = await res.json()
                }
                if (res.ok && data?.data?.url) {
                  updateBlockContent(block.id, data.data.url)
                } else {
                  alert(data?.error || `خطا در بارگذاری فایل (${res.status})`)
                }
              } catch {
                alert('خطا در ارتباط با سرور')
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs shrink-0 cursor-pointer"
            onClick={() => document.getElementById(`upload-${block.id}`)?.click()}
          >
            <Upload className="size-3.5 text-accent me-1" />
            <span>آپلود فایل</span>
          </Button>
        </div>
      </div>
    )
  }

  // Block Editor States
  const [editorTab, setEditorTab] = useState<'visual' | 'code'>('visual')
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: 'initial-1', type: 'paragraph', content: '' },
  ])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  // Quiz Builder States
  const [builtQuestions, setBuiltQuestions] = useState<QuizQuestionDef[]>([])
  const [quizQ, setQuizQ] = useState('')
  const [quizO1, setQuizO1] = useState('')
  const [quizO2, setQuizO2] = useState('')
  const [quizO3, setQuizO3] = useState('')
  const [quizO4, setQuizO4] = useState('')
  const [quizCorrect, setQuizCorrect] = useState(0)

  // SEO Analyzer States
  const [seoFocusKeyword, setSeoFocusKeyword] = useState('')

  // Prerequisite State
  const [prerequisiteId, setPrerequisiteId] = useState<string | null>(null)

  // Autosave notification state
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null)
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false)

  // Tracking Stats State
  const [trackingStats, setTrackingStats] = useState<any | null>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)

  useEffect(() => {
    fetch('/api/content/categories')
      .then(res => res.json())
      .then(json => {
        if (json.data) setContentCategories(json.data)
      })
      .catch(err => console.error(err))
  }, [])

  const loadTracking = useCallback(async (postId: string) => {
    if (!accessToken) return
    setLoadingTracking(true)
    try {
      const res = await fetch(`/api/admin/announcements/${postId}/tracking`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTrackingStats(data.data)
      }
    } catch (err) {
      console.error('Failed to load tracking stats:', err)
    } finally {
      setLoadingTracking(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (form.id && isWorkspaceOpen) {
      loadTracking(form.id)
    } else {
      setTrackingStats(null)
    }
  }, [form.id, isWorkspaceOpen, loadTracking])

  const handleSendReminder = async (postId: string) => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/admin/announcements/${postId}/remind`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        alert('یادآوری مجدد با موفقیت ارسال شد.')
        loadTracking(postId)
      }
    } catch {}
  }

  const markdownToBlocks = (markdown: string): EditorBlock[] => {
    if (!markdown.trim()) {
      return [{ id: Math.random().toString(36).slice(2, 9), type: 'paragraph', content: '' }]
    }

    // Strip quiz tags
    let textToParse = markdown.replace(/\[quiz\]([\s\S]*?)\[\/quiz\]/, '').trim()

    // Extract Accordions before splitting by paragraph
    const accordions: { id: string, summary: string, content: string }[] = []
    textToParse = textToParse.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/g, (match, summary, content) => {
      const id = `accordion_${Math.random().toString(36).slice(2, 9)}`
      accordions.push({ id, summary: summary.trim(), content: content.trim() })
      return `\n[accordion_placeholder_${id}]\n`
    })

    const paragraphs = textToParse.split(/\n\s*\n/)
    const parsedBlocks: EditorBlock[] = []

    paragraphs.forEach((p) => {
      const trimmed = p.trim()
      if (!trimmed) return

      const blockId = Math.random().toString(36).slice(2, 9)

      if (trimmed.startsWith('[accordion_placeholder_')) {
        const idMatch = trimmed.match(/\[accordion_placeholder_(.*?)\]/)
        if (idMatch) {
          const acc = accordions.find((a) => a.id === idMatch[1])
          if (acc) {
            parsedBlocks.push({ id: blockId, type: 'accordion', summary: acc.summary, content: acc.content })
            return
          }
        }
      }

      if (trimmed.startsWith('## ')) {
        parsedBlocks.push({ id: blockId, type: 'heading', level: 2, content: trimmed.replace(/^##\s+/, '') })
      } else if (trimmed.startsWith('### ')) {
        parsedBlocks.push({ id: blockId, type: 'heading', level: 3, content: trimmed.replace(/^###\s+/, '') })
      } else if (trimmed.startsWith('> [!')) {
        const typeMatch = trimmed.match(/^>\s+\[!(.*?)\]/)
        let alertType: 'info' | 'warning' | 'critical' = 'info'
        if (typeMatch) {
          const t = typeMatch[1].toUpperCase()
          if (t === 'WARNING') alertType = 'warning'
          if (t === 'CAUTION' || t === 'IMPORTANT') alertType = 'critical'
        }
        const text = trimmed.split('\n').slice(1).map(line => line.replace(/^>\s?/, '')).join('\n')
        parsedBlocks.push({ id: blockId, type: 'alert', alertType, content: text })
      } else if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.split('\n').map((line) => line.replace(/^>\s?/, '')).join('\n')
        parsedBlocks.push({ id: blockId, type: 'quote', content: quoteText })
      } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
        parsedBlocks.push({ id: blockId, type: 'checklist', content: trimmed })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const listItems = trimmed.split('\n').map((line) => line.replace(/^[-\*]\s+/, '')).join('\n')
        parsedBlocks.push({ id: blockId, type: 'list', content: listItems })
      } else if (trimmed.startsWith('[video]') && trimmed.endsWith('[/video]')) {
        const videoUrl = trimmed.replace(/^\[video\]/, '').replace(/\[\/video\]$/, '')
        parsedBlocks.push({ id: blockId, type: 'video', content: videoUrl })
      } else if (trimmed.startsWith('[audio]') && trimmed.endsWith('[/audio]')) {
        const audioUrl = trimmed.replace(/^\[audio\]/, '').replace(/\[\/audio\]$/, '')
        parsedBlocks.push({ id: blockId, type: 'audio', content: audioUrl })
      } else if (trimmed.startsWith('==') && trimmed.endsWith('==')) {
        const highlightText = trimmed.replace(/^==/, '').replace(/==$/, '')
        parsedBlocks.push({ id: blockId, type: 'highlight', content: highlightText })
      } else if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        const mathText = trimmed.replace(/^\$\$/, '').replace(/\$\$$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'math', content: mathText })
      } else if (trimmed.startsWith('[pdf]') && trimmed.endsWith('[/pdf]')) {
        const pdfUrl = trimmed.replace(/^\[pdf\]/, '').replace(/\[\/pdf\]$/, '')
        parsedBlocks.push({ id: blockId, type: 'pdf', content: pdfUrl })
      } else if (trimmed.startsWith('[map') && trimmed.endsWith('[/map]')) {
        const contentMatch = trimmed.match(/\]([\s\S]*?)\[\/map\]/)
        const captionMatch = trimmed.match(/caption="(.*?)"/)
        parsedBlocks.push({ id: blockId, type: 'map', content: contentMatch ? contentMatch[1].trim() : '', caption: captionMatch ? captionMatch[1] : '' })
      } else if (trimmed.startsWith('[button') && trimmed.endsWith('[/button]')) {
        const contentMatch = trimmed.match(/\]([\s\S]*?)\[\/button\]/)
        const hrefMatch = trimmed.match(/href="(.*?)"/)
        parsedBlocks.push({ id: blockId, type: 'button', content: contentMatch ? contentMatch[1].trim() : '', href: hrefMatch ? hrefMatch[1] : '' })
      } else if (trimmed.startsWith('[gallery]') && trimmed.endsWith('[/gallery]')) {
        const galleryContent = trimmed.replace(/^\[gallery\]/, '').replace(/\[\/gallery\]$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'gallery', content: galleryContent })
      } else if (trimmed.startsWith('[timeline]') && trimmed.endsWith('[/timeline]')) {
        const timelineContent = trimmed.replace(/^\[timeline\]/, '').replace(/\[\/timeline\]$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'timeline', content: timelineContent })
      } else if (trimmed.startsWith('[steps]') && trimmed.endsWith('[/steps]')) {
        const stepsContent = trimmed.replace(/^\[steps\]/, '').replace(/\[\/steps\]$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'steps', content: stepsContent })
      } else if (trimmed.startsWith('[notice]') && trimmed.endsWith('[/notice]')) {
        const noticeContent = trimmed.replace(/^\[notice\]/, '').replace(/\[\/notice\]$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'notice', content: noticeContent })
      } else if (trimmed.startsWith('[terminal]') && trimmed.endsWith('[/terminal]')) {
        const termContent = trimmed.replace(/^\[terminal\]/, '').replace(/\[\/terminal\]$/, '').trim()
        parsedBlocks.push({ id: blockId, type: 'terminal', content: termContent })
      } else if (trimmed.startsWith('[term') && trimmed.endsWith('[/term]')) {
        const contentMatch = trimmed.match(/\]([\s\S]*?)\[\/term\]/)
        const nameMatch = trimmed.match(/name="(.*?)"/)
        parsedBlocks.push({ id: blockId, type: 'term', content: contentMatch ? contentMatch[1].trim() : '', termName: nameMatch ? nameMatch[1] : '' })
      } else if (trimmed.startsWith('![') && trimmed.includes('](')) {
        const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (match) {
          parsedBlocks.push({ id: blockId, type: 'image', content: match[2], caption: match[1] })
        } else {
          parsedBlocks.push({ id: blockId, type: 'paragraph', content: trimmed })
        }
      } else if (trimmed.startsWith('[') && trimmed.includes('](')) {
        const match = trimmed.match(/^\[(.*?)\]\((.*?)\)$/)
        if (match) {
          parsedBlocks.push({ id: blockId, type: 'file', content: match[2], caption: match[1] })
        } else {
          parsedBlocks.push({ id: blockId, type: 'paragraph', content: trimmed })
        }
      } else if (trimmed.startsWith('```')) {
        const lines = trimmed.split('\n')
        const language = lines[0].replace(/```/, '').trim()
        const codeContent = lines.slice(1, lines.length - 1).join('\n')
        parsedBlocks.push({ id: blockId, type: 'code', language: language || 'bash', content: codeContent })
      } else if (trimmed.startsWith('---')) {
        parsedBlocks.push({ id: blockId, type: 'divider', content: '' })
      } else if (trimmed.startsWith('|') && trimmed.includes('-|-')) {
        parsedBlocks.push({ id: blockId, type: 'table', content: trimmed })
      } else {
        parsedBlocks.push({ id: blockId, type: 'paragraph', content: trimmed })
      }
    })

    return parsedBlocks.length > 0 ? parsedBlocks : [{ id: 'empty-1', type: 'paragraph', content: '' }]
  }

  // Blocks to Markdown Serializer
  const blocksToMarkdown = (editorBlocks: EditorBlock[]): string => {
    return editorBlocks
      .map((b) => {
        const content = b.content.trim()
        switch (b.type) {
          case 'heading':
            return b.level === 3 ? `### ${content}` : `## ${content}`
          case 'quote':
            return content.split('\n').map((line) => `> ${line}`).join('\n')
          case 'alert':
            return `> [!${b.alertType === 'warning' ? 'WARNING' : b.alertType === 'critical' ? 'IMPORTANT' : 'NOTE'}]\n` + content.split('\n').map((line) => `> ${line}`).join('\n')
          case 'code':
            return `\`\`\`${b.language || 'text'}\n${b.content}\n\`\`\``
          case 'divider':
            return `---`
          case 'table':
            return content
          case 'list':
            return content.split('\n').map((line) => `- ${line}`).join('\n')
          case 'checklist':
            return content
          case 'video':
            return `[video]${content}[/video]`
          case 'audio':
            return `[audio]${content}[/audio]`
          case 'highlight':
            return `==${content}==`
          case 'math':
            return `$$\n${content}\n$$`
          case 'pdf':
            return `[pdf]${content}[/pdf]`
          case 'map':
            return `[map caption="${b.caption || ''}"]\n${content}\n[/map]`
          case 'button':
            return `[button href="${b.href || '#'}"]\n${content}\n[/button]`
          case 'gallery':
            return `[gallery]\n${content}\n[/gallery]`
          case 'timeline':
            return `[timeline]\n${content}\n[/timeline]`
          case 'steps':
            return `[steps]\n${content}\n[/steps]`
          case 'notice':
            return `[notice]\n${content}\n[/notice]`
          case 'terminal':
            return `[terminal]\n${content}\n[/terminal]`
          case 'term':
            return `[term name="${b.termName || ''}"]\n${content}\n[/term]`
          case 'image':
            return `![${b.caption || ''}](${content})`
          case 'file':
            return `[${b.caption || 'دانلود فایل ضمیمه'}](${content})`
          case 'accordion':
            return `<details>\n<summary>${b.summary || 'نمایش جزئیات'}</summary>\n${content}\n</details>`
          case 'paragraph':
          default:
            return content
        }
      })
      .filter(Boolean)
      .join('\n\n')
  }

  // Load drafts and posts
  async function load() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/posts?scope=admin', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPosts(data.data as AdminPost[])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Check for localStorage drafts on mount
    const draft = localStorage.getItem('wordpress_draft_post')
    if (draft) {
      setHasRecoverableDraft(true)
    }
  }, [accessToken])

  // Listen to editId from query parameters to automatically open the editor
  useEffect(() => {
    if (editId && posts.length > 0) {
      const matched = posts.find((p) => p.id === editId)
      if (matched) {
        openEdit(matched)
      }
    }
  }, [editId, posts])

  // Periodic Autosave every 30 seconds
  useEffect(() => {
    if (!isWorkspaceOpen || form.id) return // Don't autosave when editing existing DB posts to avoid overwriting

    const interval = setInterval(() => {
      const finalBody = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
      if (form.title.trim() || finalBody.trim()) {
        localStorage.setItem(
          'wordpress_draft_post',
          JSON.stringify({
            form,
            blocks,
            builtQuestions,
            seoFocusKeyword,
            timestamp: new Date().toISOString(),
          })
        )
        const now = new Date()
        const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setLastAutosaved(timeStr)
        setHasRecoverableDraft(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isWorkspaceOpen, form, blocks, builtQuestions, seoFocusKeyword, editorTab])

  // Recover Draft Action
  const recoverDraft = () => {
    try {
      const saved = localStorage.getItem('wordpress_draft_post')
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(parsed.form)
        setBlocks(parsed.blocks)
        setBuiltQuestions(parsed.builtQuestions || [])
        setSeoFocusKeyword(parsed.seoFocusKeyword || '')
        setLastAutosaved(null)
        setHasRecoverableDraft(false)
        setIsWorkspaceOpen(true)
      }
    } catch {
      // draft recovery failed silently
    }
  }

  // Discard Draft Action
  const discardDraft = () => {
    localStorage.removeItem('wordpress_draft_post')
    setHasRecoverableDraft(false)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setBlocks([{ id: 'new-1', type: 'paragraph', content: '' }])
    setBuiltQuestions([])
    setSeoFocusKeyword('')
    setPrerequisiteId(null)
    setLastAutosaved(null)
    setEditorTab('visual')
    setIsWorkspaceOpen(true)
  }

  async function openEdit(post: AdminPost) {
    if (!accessToken) return
    setBuiltQuestions([])
    setForm({
      ...EMPTY_FORM,
      id: post.id,
      type: post.type,
      title: post.title,
      slug: post.slug,
      category: post.category ?? '',
      tags: post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      published: post.published,
      mandatory: post.mandatory,
      status: post.status ?? 'draft',
    })
    setLastAutosaved(null)
    setEditorTab('visual')

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fullPost = data.data

        let cleanBody = fullPost.body || ''

        let prereqId: string | null = null
        const prereqMatch = cleanBody.match(/\[prerequisite\]([\s\S]*?)\[\/prerequisite\]/)
        if (prereqMatch) {
          prereqId = prereqMatch[1].trim()
          cleanBody = cleanBody.replace(/\[prerequisite\]([\s\S]*?)\[\/prerequisite\]/, '').trim()
        }
        setPrerequisiteId(prereqId)

        const match = cleanBody.match(/\[quiz\]([\s\S]*?)\[\/quiz\]/)
        if (match) {
          try {
            const parsedQuestions = JSON.parse(match[1].trim())
            setBuiltQuestions(parsedQuestions)
            cleanBody = cleanBody.replace(/\[quiz\]([\s\S]*?)\[\/quiz\]/, '').trim()
          } catch {
            // quiz JSON parse failed
          }
        }

        setForm((f) => ({
          ...f,
          body: cleanBody,
          slug: fullPost.slug || '',
          excerpt: fullPost.excerpt || '',
          coverUrl: fullPost.coverUrl || '',
          mediaUrl: fullPost.mediaUrl || '',
          mediaType: fullPost.mediaType || '',
          kind: fullPost.kind || 'news',
          audience: fullPost.audience || EMPTY_FORM.audience,
          surfaces: fullPost.surfaces || EMPTY_FORM.surfaces,
          priority: fullPost.priority || 0,
          pinnedUntil: fullPost.pinnedUntil ? new Date(fullPost.pinnedUntil).toISOString().split('T')[0] : '',
          expiresAt: fullPost.expiresAt ? new Date(fullPost.expiresAt).toISOString().split('T')[0] : '',
          ackRequired: fullPost.ackRequired || false,
          ackDeadline: fullPost.ackDeadline ? new Date(fullPost.ackDeadline).toISOString().split('T')[0] : '',
          bannerStyle: fullPost.bannerStyle || EMPTY_FORM.bannerStyle,
          notifyRuleKey: fullPost.notifyRuleKey || '',
        }))

        // Parse markdown text back to visual blocks
        const parsedBlocks = markdownToBlocks(cleanBody)
        setBlocks(parsedBlocks)
      }
    } catch {
      // silent
    }
    setIsWorkspaceOpen(true)
  }

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !accessToken) return
    if (file.size > 100 * 1024 * 1024) {
      alert('حجم فایل بیش از ۱۰۰ مگابایت است')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      })
      
      let data: any = null
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      }
      
      if (res.ok && data?.data?.url) {
        setForm((f) => ({
          ...f,
          coverUrl: data.data.url,
          mediaUrl: data.data.url,
          mediaType: data.data.type,
        }))
      } else {
        alert(data?.error || `خطا در آپلود فایل (${res.status})`)
      }
    } catch {
      alert('خطا در ارتباط با سرور')
    } finally {
      setUploading(false)
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  async function handleSave() {
    if (!accessToken || !form.title.trim()) return
    setSaving(true)

    // Sync active blocks back to markdown body before submitting
    let finalBody = form.body
    if (editorTab === 'visual') {
      finalBody = blocksToMarkdown(blocks)
    }

    if ((form.type === 'training' || form.type === 'gallery') && builtQuestions.length > 0) {
      finalBody = `${finalBody}\n\n[quiz]\n${JSON.stringify(builtQuestions, null, 2)}\n[/quiz]`
    }

    if (prerequisiteId) {
      finalBody = `${finalBody}\n\n[prerequisite]${prerequisiteId}[/prerequisite]`
    }

    try {
      const payload = {
        type: form.type,
        title: form.title,
        category: form.category,
        tags: form.tags,
        excerpt: form.excerpt,
        body: finalBody,
        coverUrl: form.coverUrl,
        mediaUrl: form.mediaUrl,
        mediaType: form.mediaType,
        published: form.status === 'published' || form.published,
        mandatory: form.mandatory,
        status: form.status,
        kind: form.kind,
        audience: form.audience,
        surfaces: form.surfaces,
        priority: form.priority,
        pinnedUntil: form.pinnedUntil || null,
        expiresAt: form.expiresAt || null,
        ackRequired: form.ackRequired,
        ackDeadline: form.ackDeadline || null,
        bannerStyle: form.bannerStyle,
        notifyRuleKey: form.notifyRuleKey || null,
      }
      const url = form.id ? `/api/posts/${form.id}` : '/api/posts'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        localStorage.removeItem('wordpress_draft_post') // Clear autosaved draft on successful publish
        setIsWorkspaceOpen(false)
        load()
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return
    if (!confirm('آیا از حذف این محتوا و سوابق آن مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) load()
    } catch {
      // silent
    }
  }

  // Title changes slug automatically for new posts
  const handleTitleChange = (val: string) => {
    const autoSlug = val
      .trim()
      .toLowerCase()
      .replace(/[\s‌]+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    setForm((f) => ({
      ...f,
      title: val,
      slug: f.id ? f.slug : autoSlug,
    }))
  }

  // Category selection handler
  // Handle Tab Switch (Visual Blocks <-> Markdown)
  const handleTabChange = (newTab: 'visual' | 'code') => {
    if (newTab === 'code') {
      // visual to code: serialize blocks to markdown string
      const md = blocksToMarkdown(blocks)
      setForm((f) => ({ ...f, body: md }))
    } else {
      // code to visual: parse markdown string back to blocks
      const parsed = markdownToBlocks(form.body)
      setBlocks(parsed)
    }
    setEditorTab(newTab)
  }

  // Block Controls Actions
  const updateBlockContent = (id: string, newContent: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: newContent } : b)))
  };

  const updateBlockMeta = (id: string, key: 'level' | 'caption' | 'alertType' | 'language' | 'summary' | 'href' | 'termName', val: any) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: val } : b)))
  };

  const addBlock = (type: EditorBlock['type'], afterId?: string) => {
    const newBlock: EditorBlock = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      content: '',
      ...(type === 'heading' ? { level: 2 } : {}),
      ...(type === 'image' || type === 'video' ? { caption: '' } : {}),
    }

    if (!afterId) {
      setBlocks((prev) => [...prev, newBlock])
    } else {
      const idx = blocks.findIndex((b) => b.id === afterId)
      if (idx !== -1) {
        const copy = [...blocks]
        copy.splice(idx + 1, 0, newBlock)
        setBlocks(copy)
      }
    }
    setActiveBlockId(newBlock.id)
  }

  const removeBlock = (id: string) => {
    if (blocks.length === 1) {
      setBlocks([{ id: 'fallback-1', type: 'paragraph', content: '' }])
      return
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === blocks.length - 1) return

    const copy = [...blocks]
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = copy[idx]
    copy[idx] = copy[targetIdx]
    copy[targetIdx] = temp
    setBlocks(copy)
  }

  // Quiz helper functions
  const addQuizQuestion = () => {
    if (!quizQ.trim() || !quizO1.trim() || !quizO2.trim() || !quizO3.trim() || !quizO4.trim()) return
    const newQ: QuizQuestionDef = {
      q: quizQ.trim(),
      options: [quizO1.trim(), quizO2.trim(), quizO3.trim(), quizO4.trim()],
      answerIndex: quizCorrect,
    }
    setBuiltQuestions((prev) => [...prev, newQ])
    setQuizQ('')
    setQuizO1('')
    setQuizO2('')
    setQuizO3('')
    setQuizO4('')
    setQuizCorrect(0)
  }

  const removeQuizQuestion = (idx: number) => {
    setBuiltQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  // Realtime Word Count & SEO checks
  const getWordCount = () => {
    const textStr = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
    return textStr ? textStr.trim().split(/\s+/).filter(Boolean).length : 0
  }

  const getSeoAnalysis = () => {
    const keyword = seoFocusKeyword.trim().toLowerCase()
    const textStr = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
    const titleLower = form.title.toLowerCase()
    const slugLower = form.slug.toLowerCase()

    const results = [
      {
        id: 'kw-title',
        label: 'عبارت کلیدی در عنوان نوشته',
        passed: keyword ? titleLower.includes(keyword) : null,
        desc: 'عبارت کلیدی باید در عنوان اصلی مقاله شما استفاده شده باشد.',
      },
      {
        id: 'kw-slug',
        label: 'عبارت کلیدی در پیوند یکتا (Slug)',
        passed: keyword ? slugLower.includes(keyword) : null,
        desc: 'آدرس اینترنتی یا اسلاگ نوشته باید شامل کلمه کلیدی کانونی باشد.',
      },
      {
        id: 'kw-body',
        label: 'عبارت کلیدی در متن اصلی',
        passed: keyword ? textStr.toLowerCase().includes(keyword) : null,
        desc: 'برای کسب رتبه بهتر، عبارت کلیدی باید حداقل یک‌بار در کل متن تکرار شود.',
      },
      {
        id: 'len-title',
        label: 'طول عنوان نوشته',
        passed: form.title.trim().length >= 20 && form.title.trim().length <= 70,
        desc: `طول عنوان باید بین ۲۰ تا ۷۰ کاراکتر باشد. (طول فعلی: ${toFa(form.title.trim().length)} کاراکتر)`,
      },
      {
        id: 'len-excerpt',
        label: 'طول خلاصه و چکیده سند',
        passed: form.excerpt.trim().length >= 50 && form.excerpt.trim().length <= 180,
        desc: `خلاصه ایده آل بین ۵۰ تا ۱۸۰ کاراکتر است تا در موتورها عالی دیده شود. (طول فعلی: ${toFa(form.excerpt.trim().length)} کاراکتر)`,
      },
      {
        id: 'len-words',
        label: 'تعداد کل کلمات نوشته',
        passed: getWordCount() >= 150,
        desc: `حداقل کلمات توصیه شده برای مطالب آموزشی ۱۵۰ کلمه است. (تعداد کلمات فعلی: ${toFa(getWordCount())} کلمه)`,
      },
    ]

    return results
  }

  // Insert markdown helpers in raw code tab
  const insertMarkup = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = before + selected + after

    const newBody = text.substring(0, start) + replacement + text.substring(end)
    setForm((f) => ({ ...f, body: newBody }))

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 10)
  }

  const readingTime = Math.max(1, Math.round((editorTab === 'visual' ? blocksToMarkdown(blocks).length : form.body.length) / 400))

  if (isWorkspaceOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground" dir="rtl">
        {/* WordPress Premium Sticky Header Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsWorkspaceOpen(false)}
              className="text-foreground-muted hover:text-foreground cursor-pointer rounded-lg transition-all"
              title="بازگشت به انتشارات"
            >
              <ArrowRight className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-bold tracking-tight">
                {form.id ? 'ویرایشگر بلاک‌محور گوتنبرگ (ویرایش نوشته)' : 'کارگاه پیشرفته نویسندگی وردپرس (طرح خط ۱)'}
              </span>
            </div>
            {lastAutosaved && (
              <Badge variant="outline" className="text-[10px] bg-neutral-900 text-neutral-400 border-neutral-800 gap-1 select-none">
                <Clock className="size-3" />
                <span>آخرین ذخیره خودکار: {lastAutosaved}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Switching Tabs (Visual / Code) */}
            <div className="flex items-center bg-surface-container-low border border-border rounded-lg p-0.5 select-none">
              <button
                type="button"
                onClick={() => handleTabChange('visual')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  editorTab === 'visual' ? 'bg-accent text-white shadow-sm' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <Settings2 className="size-3.5" />
                <span>ویرایشگر بصری بلاک‌ها</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('code')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  editorTab === 'code' ? 'bg-accent text-white shadow-sm' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <FileCode className="size-3.5" />
                <span>کد مارک‌داون خام</span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForm((f) => ({
                ...f,
                status: f.status === 'published' ? 'draft' : 'published',
                published: f.status !== 'published',
              }))}
              className="h-8 text-xs gap-1.5 cursor-pointer text-foreground-muted hover:bg-surface-hover hover:text-foreground border border-transparent hover:border-border rounded-lg"
            >
              {form.status === 'published' ? (
                <>
                  <Globe className="size-3.5 text-success" />
                  <span>انتشار عمومی زنده</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-3.5 text-amber-500" />
                  <span>ذخیره در پیش‌نویس</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              disabled={saving || !form.title.trim()}
              onClick={handleSave}
              className="bg-accent hover:bg-accent-hover text-white font-semibold h-8 text-xs px-4 gap-1.5 cursor-pointer shadow-lg shadow-accent/20 rounded-lg transition-all active:scale-95"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              <span>{form.id ? 'بروزرسانی تغییرات' : 'انتشار نهایی'}</span>
            </Button>
          </div>
        </header>

        {/* Workspace Layout */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Writing Area (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Post Title & Slug Editor */}
            <div className="space-y-3 bg-surface-container-low/20 p-4 rounded-xl border border-border-subtle">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="عنوان نوشته یا مقاله آموزشی را اینجا بنویسید..."
                className="w-full bg-transparent border-none text-2xl md:text-3xl font-extrabold focus:outline-none focus:ring-0 placeholder:text-foreground-muted text-foreground text-right"
              />

              <div className="flex items-center gap-1.5 text-xs text-foreground-muted bg-surface/50 px-3 py-1.5 rounded-lg border border-border/40 w-fit">
                <Link2 className="size-3.5 text-neutral-500" />
                <span className="font-semibold">پیوند یکتا (Permalink):</span>
                <span className="font-mono text-neutral-400 select-none">
                  http://localhost:3000/content/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="bg-transparent border-none p-0 text-xs font-mono text-accent focus:outline-none focus:ring-0 w-44"
                  placeholder="slug-url"
                />
              </div>
            </div>

            {/* PDF Upload for Form Type */}
            {form.type === 'form' ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-8 text-center space-y-3">
                  <FileText className="size-10 mx-auto text-accent/60" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">بارگذاری فایل PDF فرم یا مستند</h3>
                    <p className="text-xs text-foreground-muted">فایل PDF فرم مورد نظر را آپلود کنید تا پرسنل بتوانند آن را مشاهده و دانلود کنند.</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    id="pdf-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !accessToken) return
                      if (file.size > 100 * 1024 * 1024) {
                        alert('حجم فایل بیش از ۱۰۰ مگابایت است')
                        return
                      }
                      const fd = new FormData()
                      fd.append('file', file)
                      try {
                        const res = await fetch('/api/uploads', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${accessToken}` },
                          body: fd,
                        })
                        
                        let data: any = null
                        const contentType = res.headers.get('content-type')
                        if (contentType && contentType.includes('application/json')) {
                          data = await res.json()
                        }
                        
                        if (res.ok && data?.data?.url) {
                          setForm((f) => ({
                            ...f,
                            mediaUrl: data.data.url,
                            mediaType: 'application/pdf',
                            body: `دانلود فایل: ${file.name}`,
                          }))
                        } else {
                          alert(data?.error || `خطا در بارگذاری فایل (${res.status})`)
                        }
                      } catch {
                        alert('خطا در ارتباط با سرور')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                    className="h-9 text-xs gap-1.5 cursor-pointer border-accent/30 hover:bg-accent/10 text-accent"
                  >
                    <Upload className="size-4" />
                    <span>انتخاب فایل PDF</span>
                  </Button>
                </div>

                {form.mediaUrl && form.mediaType === 'application/pdf' && (
                  <Card className="border border-border bg-surface">
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileText className="size-8 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{form.mediaUrl.split('/').pop()}</p>
                        <p className="text-[10px] text-foreground-muted">فایل PDF بارگذاری شده</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setForm((f) => ({ ...f, mediaUrl: '', mediaType: '', body: '' }))}
                        className="size-8 text-critical hover:bg-critical/10 rounded-lg cursor-pointer"
                      >
                        <Trash className="size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
            <>
            {/* TAB CONTENT 1: VISUAL BLOCK EDITOR (Gutenberg) */}
            {editorTab === 'visual' && (
              <div className="space-y-4">
                <div className="text-xs text-foreground-muted select-none flex items-center justify-between border-b border-border pb-2 px-1">
                  <span>برای شروع، روی متن هر بلاک کلیک کرده و بنویسید.</span>
                  <span className="font-semibold">ترتیب قرارگیری بلاک‌ها از بالا به پایین است.</span>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {blocks.map((block, index) => {
                    const isActive = activeBlockId === block.id
                    return (
                      <div
                        key={block.id}
                        onFocus={() => setActiveBlockId(block.id)}
                        className={`group relative p-3 rounded-lg border transition-all duration-150 ${
                          isActive
                            ? 'bg-surface border-accent shadow-sm'
                            : 'bg-surface/45 hover:bg-surface border-border-subtle hover:border-border'
                        }`}
                      >
                        {/* Block Action Controls (Hover & Focus overlay) */}
                        <div className={`absolute left-2 top-2 flex items-center gap-1 bg-surface-container-low/95 border border-border rounded-md p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isActive ? 'opacity-100' : ''}`}>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                            title="انتقال به بالا"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, 'down')}
                            disabled={index === blocks.length - 1}
                            className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                            title="انتقال به پایین"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                          <div className="w-[1px] h-3 bg-border mx-1" />
                          <span className="text-[9px] font-bold text-accent px-1">
                            {block.type === 'paragraph' && 'پاراگراف'}
                            {block.type === 'heading' && `سربرگ H${block.level}`}
                            {block.type === 'quote' && 'نقل قول'}
                            {block.type === 'list' && 'فهرست'}
                            {block.type === 'video' && 'ویدیو'}
                            {block.type === 'image' && 'تصویر'}
                            {block.type === 'table' && 'جدول'}
                            {block.type === 'alert' && 'هشدار'}
                            {block.type === 'code' && 'کد'}
                            {block.type === 'divider' && 'جداکننده'}
                            {block.type === 'file' && 'فایل'}
                            {block.type === 'checklist' && 'چک لیست'}
                            {block.type === 'accordion' && 'آکاردئون'}
                            {block.type === 'audio' && 'فایل صوتی'}
                            {block.type === 'highlight' && 'متن برجسته'}
                            {block.type === 'math' && 'فرمول'}
                            {block.type === 'pdf' && 'فایل PDF'}
                            {block.type === 'map' && 'نقشه'}
                            {block.type === 'button' && 'دکمه لینک'}
                            {block.type === 'gallery' && 'گالری'}
                            {block.type === 'timeline' && 'تایم‌لاین'}
                            {block.type === 'steps' && 'مراحل'}
                            {block.type === 'notice' && 'بنر اطلاعیه'}
                            {block.type === 'terminal' && 'ترمینال'}
                            {block.type === 'term' && 'واژه‌نامه'}
                          </span>
                          <div className="w-[1px] h-3 bg-border mx-1" />
                          <button
                            type="button"
                            onClick={() => addBlock('paragraph', block.id)}
                            className="p-1 text-foreground-muted hover:text-success rounded cursor-pointer"
                            title="افزودن بلاک بعد از این"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-critical hover:bg-critical/10 rounded cursor-pointer"
                            title="حذف این بلاک"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>

                        {/* Rendering Blocks dynamically based on type */}
                        <div className="pl-32">
                          {block.type === 'paragraph' && (
                            <textarea
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              placeholder="متن پاراگراف را بنویسید..."
                              rows={Math.max(2, block.content.split('\n').length)}
                              className="w-full bg-transparent border-none p-0 text-sm text-foreground placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none"
                            />
                          )}

                          {block.type === 'heading' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateBlockMeta(block.id, 'level', 2)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                    block.level === 2 ? 'bg-accent/15 border-accent/30 text-accent' : 'border-border text-foreground-muted'
                                  }`}
                                >
                                  سربرگ H2
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateBlockMeta(block.id, 'level', 3)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                    block.level === 3 ? 'bg-accent/15 border-accent/30 text-accent' : 'border-border text-foreground-muted'
                                  }`}
                                >
                                  سربرگ H3
                                </button>
                              </div>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="عنوان سربرگ..."
                                className={`w-full bg-transparent border-none p-0 font-extrabold focus:ring-0 focus:outline-none text-right ${
                                  block.level === 3 ? 'text-base text-neutral-200' : 'text-lg text-foreground'
                                }`}
                              />
                            </div>
                          )}

                          {block.type === 'quote' && (
                            <div className="border-r-4 border-accent bg-accent/5 p-3 rounded-l-md space-y-1">
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="متن نقل قول یا تذکر مهم ایمنی قطار..."
                                rows={Math.max(2, block.content.split('\n').length)}
                                className="w-full bg-transparent border-none p-0 text-sm italic text-neutral-300 placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none font-medium"
                              />
                            </div>
                          )}

                          {block.type === 'list' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">هر خط را به عنوان یک آیتم فهرست بنویسید (با اینتر جدا کنید)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="- آیتم اول دستورالعمل&#10;- آیتم دوم..."
                                rows={Math.max(3, block.content.split('\n').length)}
                                className="w-full bg-transparent border-none p-0 text-sm text-foreground placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none font-mono"
                              />
                            </div>
                          )}

                          {block.type === 'video' && (
                            <div className="space-y-3">
                              {renderFileUpload(block, "video/*", "https://example.com/videos/train-brake-tutorial.mp4", "آدرس مستقیم ویدیو آموزشی (فرمت MP4):", updateBlockContent)}
                              {block.content.trim() && (
                                <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video max-w-md mx-auto">
                                  <video src={block.content} controls className="w-full h-full object-contain" />
                                </div>
                              )}
                              <Input
                                value={block.caption || ''}
                                onChange={(e) => updateBlockMeta(block.id, 'caption', e.target.value)}
                                placeholder="توضیح کوتاه زیر ویدیو..."
                                className="h-8 text-xs text-right"
                              />
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-3">
                              {renderFileUpload(block, "image/*", "https://example.com/images/schematic.png", "آدرس مستقیم تصویر شاخص:", updateBlockContent)}
                              {block.content.trim() && (
                                <div className="rounded-lg overflow-hidden border border-border bg-neutral-950 max-h-56 max-w-sm mx-auto flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={block.content} alt="پیش‌نمایش بلاک تصویر" className="max-w-full max-h-full object-cover" />
                                </div>
                              )}
                              <Input
                                value={block.caption || ''}
                                onChange={(e) => updateBlockMeta(block.id, 'caption', e.target.value)}
                                placeholder="کپشن و زیرنویس تصویر..."
                                className="h-8 text-xs text-right"
                              />
                            </div>
                          )}

                          {block.type === 'alert' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-foreground-muted">نوع هشدار:</span>
                                <select
                                  value={block.alertType || 'info'}
                                  onChange={(e) => updateBlockMeta(block.id, 'alertType', e.target.value as any)}
                                  className="h-7 text-xs bg-surface border border-border rounded px-2 outline-none"
                                >
                                  <option value="info">اطلاعات (آبی)</option>
                                  <option value="warning">اخطار (زرد)</option>
                                  <option value="critical">مهم/خطر (قرمز)</option>
                                </select>
                              </div>
                              <div className={`border-r-4 p-3 rounded-l-md ${
                                block.alertType === 'warning' ? 'border-amber-500 bg-amber-500/10 text-amber-200' :
                                block.alertType === 'critical' ? 'border-red-500 bg-red-500/10 text-red-200' :
                                'border-blue-500 bg-blue-500/10 text-blue-200'
                              }`}>
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="متن پیام مهم یا هشدار..."
                                  rows={Math.max(2, block.content.split('\n').length)}
                                  className="w-full bg-transparent border-none p-0 text-sm placeholder:text-current/50 focus:ring-0 focus:outline-none leading-7 text-right resize-none font-medium"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'code' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-foreground-muted">زبان کد:</span>
                                <Input
                                  value={block.language || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'language', e.target.value)}
                                  placeholder="مثلاً bash یا json"
                                  className="h-7 text-xs w-32 font-mono"
                                />
                              </div>
                              <div className="bg-neutral-950 rounded-md border border-neutral-800 p-3">
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="قطعه کد را اینجا قرار دهید..."
                                  rows={Math.max(3, block.content.split('\n').length)}
                                  className="w-full bg-transparent border-none p-0 text-xs text-neutral-300 placeholder:text-neutral-600 focus:ring-0 focus:outline-none leading-relaxed text-left dir-ltr resize-none font-mono"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'divider' && (
                            <div className="py-4 flex items-center justify-center">
                              <div className="w-full h-px bg-border max-w-sm"></div>
                              <span className="absolute bg-surface px-2 text-[10px] text-foreground-muted">خط جداکننده</span>
                            </div>
                          )}

                          {block.type === 'table' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">جدول مارک‌داون (با | ستون‌ها را جدا کنید)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="| عنوان ۱ | عنوان ۲ |\n|---|---|\n| مقدار ۱ | مقدار ۲ |"
                                rows={Math.max(4, block.content.split('\n').length)}
                                className="w-full bg-surface border border-border rounded-md p-3 text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none font-mono"
                              />
                            </div>
                          )}

                          {block.type === 'file' && (
                            <div className="space-y-3">
                              {renderFileUpload(block, "*/*", "https://example.com/file.pdf", "لینک فایل ضمیمه (PDF، تصاویر و ...):", updateBlockContent)}
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">عنوان فایل برای نمایش به کاربر:</Label>
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'caption', e.target.value)}
                                  placeholder="دانلود فایل پیوست دستورالعمل (مثلا)"
                                  className="h-8 text-xs text-right"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'checklist' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">چک لیست عملیاتی (با - [ ] یا - [x] شروع کنید)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="- [ ] بررسی چراغ سیگنال\n- [x] روشن کردن سیستم تهویه\n- [ ] کنترل ارتباط رادیویی"
                                rows={Math.max(3, block.content.split('\n').length)}
                                className="w-full bg-transparent border-none p-0 text-sm text-foreground placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none"
                              />
                            </div>
                          )}

                          {block.type === 'accordion' && (
                            <div className="space-y-3 p-3 bg-surface-container-low/20 rounded-lg border border-border">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">عنوان آکاردئون (بخش بازشونده):</Label>
                                <Input
                                  value={block.summary || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'summary', e.target.value)}
                                  placeholder="برای مشاهده جزئیات فنی کلیک کنید"
                                  className="h-8 text-xs font-bold bg-surface"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">محتوای داخل آکاردئون:</Label>
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="متن کامل را اینجا بنویسید..."
                                  rows={Math.max(3, block.content.split('\n').length)}
                                  className="w-full bg-surface border border-border p-2 rounded-md text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'audio' && (
                            <div className="space-y-3">
                              {renderFileUpload(block, "audio/*", "https://example.com/audio.mp3", "لینک فایل صوتی (بی‌سیم / پادکست):", updateBlockContent)}
                            </div>
                          )}

                          {block.type === 'highlight' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">متن برجسته (Highlight)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="متن مهمی که می‌خواهید به شکل برجسته نمایش داده شود..."
                                rows={Math.max(2, block.content.split('\n').length)}
                                className="w-full bg-accent/10 border border-accent/20 rounded-md p-3 text-sm text-accent placeholder:text-accent/50 focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none"
                              />
                            </div>
                          )}

                          {block.type === 'math' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">فرمول ریاضی / فیزیک (Latex)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="E = mc^2"
                                rows={Math.max(2, block.content.split('\n').length)}
                                className="w-full bg-surface border border-border rounded-md p-3 text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-left dir-ltr resize-none font-mono"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {block.type === 'pdf' && (
                            <div className="space-y-3">
                              {renderFileUpload(block, "application/pdf", "https://example.com/document.pdf", "لینک فایل PDF برای نمایش زنده:", updateBlockContent)}
                            </div>
                          )}

                          {block.type === 'map' && (
                            <div className="space-y-3 p-3 bg-surface-container-low/20 rounded-lg border border-border">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">نام ایستگاه / مکان:</Label>
                                <Input
                                  value={block.caption || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'caption', e.target.value)}
                                  placeholder="ایستگاه تجریش"
                                  className="h-8 text-xs bg-surface"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">مختصات (Lat,Lng):</Label>
                                <Input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="35.8048, 51.4283"
                                  className="h-8 text-xs text-left dir-ltr font-mono"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'button' && (
                            <div className="space-y-3 p-3 bg-surface-container-low/20 rounded-lg border border-border">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">متن دکمه:</Label>
                                <Input
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="ورود به سامانه"
                                  className="h-8 text-xs bg-surface"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">لینک مقصد (URL):</Label>
                                <Input
                                  type="text"
                                  value={block.href || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'href', e.target.value)}
                                  placeholder="https://example.com/login"
                                  className="h-8 text-xs text-left dir-ltr font-mono"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          )}

                          {block.type === 'gallery' && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-foreground-muted select-none">گالری تصاویر (لینک هر تصویر در یک خط جدا)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="https://example.com/img1.jpg\nhttps://example.com/img2.jpg"
                                rows={Math.max(4, block.content.split('\n').length)}
                                className="w-full bg-surface border border-border rounded-md p-3 text-xs text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-left dir-ltr resize-none font-mono"
                                dir="ltr"
                              />
                              <div className="flex justify-end">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  id={`gallery-upload-${block.id}`}
                                  onChange={async (e) => {
                                    const files = Array.from(e.target.files || [])
                                    if (!files.length || !accessToken) return
                                    let newContent = block.content.trim() ? block.content.trim() + '\n' : ''
                                    for (const file of files) {
                                      const fd = new FormData()
                                      fd.append('file', file)
                                      try {
                                        const res = await fetch('/api/uploads', {
                                          method: 'POST',
                                          headers: { Authorization: `Bearer ${accessToken}` },
                                          body: fd,
                                        })
                                        if (res.ok) {
                                          const data = await res.json()
                                          newContent += data.data.url + '\n'
                                        }
                                      } catch {
                                        // ignore
                                      }
                                    }
                                    updateBlockContent(block.id, newContent.trim())
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs cursor-pointer"
                                  onClick={() => document.getElementById(`gallery-upload-${block.id}`)?.click()}
                                >
                                  <Upload className="size-3.5 text-accent me-1" />
                                  <span>آپلود تصاویر و افزودن به گالری</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {block.type === 'timeline' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">تایم‌لاین عملیاتی (قالب: زمان | رویداد) در هر خط</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="12:00 | شروع حادثه\n12:15 | حضور تیم امداد"
                                rows={Math.max(4, block.content.split('\n').length)}
                                className="w-full bg-surface border border-border rounded-md p-3 text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none font-mono"
                              />
                            </div>
                          )}

                          {block.type === 'steps' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">مراحل اجرایی (هر خط یک مرحله)</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="ابتدا سیستم را خاموش کنید.\nسپس دکمه ریست را بزنید."
                                rows={Math.max(4, block.content.split('\n').length)}
                                className="w-full bg-surface border border-border rounded-md p-3 text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none"
                              />
                            </div>
                          )}

                          {block.type === 'notice' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">بنر اطلاعیه مهم</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="اطلاعیه مهم: لطفاً تا اطلاع ثانوی..."
                                rows={Math.max(3, block.content.split('\n').length)}
                                className="w-full bg-warning/10 border border-warning/30 rounded-md p-3 text-sm text-warning-strong placeholder:text-warning/50 focus:ring-1 focus:ring-warning outline-none leading-7 text-right resize-none"
                              />
                            </div>
                          )}

                          {block.type === 'terminal' && (
                            <div className="space-y-1">
                              <div className="text-[10px] text-foreground-muted select-none">شبیه‌ساز محیط ترمینال/دستورات</div>
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="$ ping 192.168.1.1\nReply from 192.168.1.1"
                                rows={Math.max(4, block.content.split('\n').length)}
                                className="w-full bg-black border border-neutral-800 rounded-md p-3 text-sm text-emerald-500 placeholder:text-emerald-900 focus:ring-1 focus:ring-emerald-500 outline-none leading-7 text-left dir-ltr resize-none font-mono"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {block.type === 'term' && (
                            <div className="space-y-3 p-3 bg-surface-container-low/20 rounded-lg border border-border">
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">نام اصطلاح (Term):</Label>
                                <Input
                                  value={block.termName || ''}
                                  onChange={(e) => updateBlockMeta(block.id, 'termName', e.target.value)}
                                  placeholder="ATC (Automatic Train Control)"
                                  className="h-8 text-xs font-bold bg-surface"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-[10px] text-foreground-muted">تعریف کامل واژه:</Label>
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="سیستم کنترل اتوماتیک قطار که وظیفه ایمنی و..."
                                  rows={Math.max(3, block.content.split('\n').length)}
                                  className="w-full bg-surface border border-border p-2 rounded-md text-sm text-foreground placeholder:text-foreground-muted focus:ring-1 focus:ring-accent outline-none leading-7 text-right resize-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Block Library Adder Panel */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-surface-container-low/10 flex flex-col items-center justify-center gap-3">
                  <span className="text-xs font-semibold text-foreground-muted">اضافه کردن بخش یا بلاک جدید به سند نوشته:</span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('paragraph')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <FileText className="size-3.5 text-neutral-400" />
                      <span>پارگراف جدید</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('heading')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Heading className="size-3.5 text-accent" />
                      <span>سربرگ فنی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('quote')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Bold className="size-3.5 text-amber-500" />
                      <span>نقل قول / تذکر</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('list')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <List className="size-3.5 text-success" />
                      <span>لیست نشانه‌دار</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('video')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Video className="size-3.5 text-red-500" />
                      <span>ویدیو دوره آموزشی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('image')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Image className="size-3.5 text-sky-500" />
                      <span>تصویر دیاگرام فنی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('table')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <TableIcon className="size-3.5 text-indigo-400" />
                      <span>جدول اطلاعات</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('alert')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <AlertIcon className="size-3.5 text-orange-500" />
                      <span>پیام هشدار</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('code')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <CodeIcon className="size-3.5 text-slate-400" />
                      <span>قطعه کد</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('divider')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <DividerIcon className="size-3.5 text-neutral-500" />
                      <span>خط جداکننده</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('file')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Paperclip className="size-3.5 text-blue-500" />
                      <span>فایل ضمیمه</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('checklist')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <CheckSquare className="size-3.5 text-emerald-500" />
                      <span>چک لیست</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('accordion')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <FoldVertical className="size-3.5 text-purple-500" />
                      <span>آکاردئون</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('audio')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Headphones className="size-3.5 text-pink-500" />
                      <span>پخش صوتی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('highlight')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Highlighter className="size-3.5 text-yellow-500" />
                      <span>متن برجسته</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('math')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Sigma className="size-3.5 text-blue-400" />
                      <span>فرمول ریاضی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('pdf')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <FileDown className="size-3.5 text-red-400" />
                      <span>نمایش PDF</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('map')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <MapPin className="size-3.5 text-emerald-400" />
                      <span>نقشه/مختصات</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('button')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <MousePointerClick className="size-3.5 text-indigo-400" />
                      <span>دکمه لینک</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('gallery')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Images className="size-3.5 text-sky-400" />
                      <span>گالری تصاویر</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('timeline')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <GitCommit className="size-3.5 text-purple-400" />
                      <span>تایم‌لاین</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('steps')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <ListOrdered className="size-3.5 text-amber-500" />
                      <span>مراحل اجرایی</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('notice')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Megaphone className="size-3.5 text-orange-500" />
                      <span>بنر اطلاعیه</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('terminal')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Terminal className="size-3.5 text-zinc-400" />
                      <span>ترمینال قطار</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock('term')}
                      className="h-8 text-xs gap-1 cursor-pointer border-border hover:bg-surface-hover rounded-lg"
                    >
                      <Library className="size-3.5 text-rose-400" />
                      <span>واژه‌نامه</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: RAW MARKDOWN EDITOR */}
            {editorTab === 'code' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-surface border border-border rounded-t-lg border-b-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('**', '**')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer"
                    title="بولد (برجسته)"
                  >
                    <Bold className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('## ')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer text-xs font-bold"
                    title="سربرگ ۲"
                  >
                    H2
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('### ')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer text-[10px] font-bold"
                    title="سربرگ ۳"
                  >
                    H3
                  </Button>
                  <div className="h-4 w-[1px] bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('- ')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer"
                    title="لیست نشانه‌دار"
                  >
                    <List className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('> ')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer"
                    title="نقل قول"
                  >
                    <FileText className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => insertMarkup('[video]', '[/video]')}
                    className="size-8 text-foreground-muted hover:text-foreground rounded cursor-pointer"
                    title="ویدیو"
                  >
                    <Video className="size-4" />
                  </Button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="محتوای مقاله یا نوشته را اینجا به صورت مارک‌داون خام بنویسید..."
                  rows={14}
                  className="w-full rounded-b-lg border border-border bg-surface-container-low/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border leading-7 text-right resize-y min-h-[350px] font-mono"
                />
              </div>
            )}
            </>
            )}

            {/* Excerpt Section (WordPress Style Summary) */}
            <Card className="border border-border-subtle bg-surface-container-low/30">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold text-foreground">خلاصه نوشته (Excerpt)</CardTitle>
                <CardDescription className="text-[10px]">
                  خلاصه‌ای کوتاه که در ویترین‌های اخبار و ماژول کارتابل پرسنل نمایش داده می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="توضیحی کوتاه، صریح و ترغیب‌کننده برای جلب توجه همکاران بنویسید..."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:border-accent leading-5 text-right resize-none"
                />
              </CardContent>
            </Card>

            {/* Featured Image & Cover Uploader */}
            <Card className="border border-border-subtle bg-surface-container-low/30">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold text-foreground">تصویر شاخص نوشته</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0 space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative aspect-video w-full md:w-56 bg-neutral-950 rounded-lg border border-border overflow-hidden flex items-center justify-center">
                    {form.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.coverUrl}
                        alt="کاور تصویر شاخص"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-foreground-muted text-[10px] select-none">
                        <Image className="size-6 opacity-40" />
                        <span>تصویر شاخصی بارگذاری نشده است</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        ref={coverRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCover}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => coverRef.current?.click()}
                        className="h-9 text-xs gap-1.5 border-border-subtle hover:bg-surface-hover cursor-pointer rounded-lg"
                      >
                        {uploading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4 text-accent" />
                        )}
                        <span>بارگذاری پرونده چندرسانه‌ای</span>
                      </Button>
                      {form.coverUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm((f) => ({ ...f, coverUrl: '' }))}
                          className="h-9 text-xs text-critical hover:bg-critical/5 gap-1.5 cursor-pointer rounded-lg"
                        >
                          <Trash className="size-4" />
                          <span>حذف تصویر شاخص</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-foreground-muted">یا آدرس مستقیم تصویر را اینجا وارد کنید:</Label>
                      <Input
                        value={form.coverUrl}
                        onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
                        placeholder="https://example.com/images/cover.jpg"
                        className="h-8 text-xs font-mono dir-ltr text-left"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Educational Quiz Builder (Only visible when type is 'training' or 'gallery') */}
            {(form.type === 'training' || form.type === 'gallery') && (
              <Card className="border border-accent/25 bg-accent/5 rounded-xl overflow-hidden shadow-sm">
                <CardHeader className="py-3 border-b border-accent/15 bg-accent/10">
                  <CardTitle className="text-xs font-bold text-accent flex items-center gap-2">
                    <Award className="size-4 animate-bounce" />
                    سازنده کوئیز و سوالات آزمون دوره آموزشی
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Question form */}
                  <div className="space-y-3 bg-background/60 p-3.5 rounded-lg border border-border/40 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-bold text-foreground">متن صورت سوال آزمون:</Label>
                      <Input
                        placeholder="مثال: دکمه استپ اضطراری سکو (ESD) در کدام بخش مستقر است؟"
                        value={quizQ}
                        onChange={(e) => setQuizQ(e.target.value)}
                        className="h-9 text-xs text-right"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-foreground-muted">گزینه ۱ (پاسخ اول):</Label>
                        <Input
                          placeholder="مثال: در هر دو انتهای سکو"
                          value={quizO1}
                          onChange={(e) => setQuizO1(e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-foreground-muted">گزینه ۲ (پاسخ دوم):</Label>
                        <Input
                          placeholder="مثال: فقط در اتاق محلی سیگنالینگ"
                          value={quizO2}
                          onChange={(e) => setQuizO2(e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-foreground-muted">گزینه ۳ (پاسخ سوم):</Label>
                        <Input
                          placeholder="مثال: زیر صندلی‌های وسط سکو"
                          value={quizO3}
                          onChange={(e) => setQuizO3(e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-foreground-muted">گزینه ۴ (پاسخ چهارم):</Label>
                        <Input
                          placeholder="مثال: روی شیشه جلوی لکوموتیو"
                          value={quizO4}
                          onChange={(e) => setQuizO4(e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border/20">
                      <div className="flex items-center gap-2">
                        <Label className="text-[11px] font-bold text-foreground-muted shrink-0">گزینه صحیح و کلید سوال:</Label>
                        <select
                          value={quizCorrect}
                          onChange={(e) => setQuizCorrect(Number(e.target.value))}
                          className="h-8 rounded-lg border border-border bg-surface text-xs px-3 cursor-pointer outline-none font-semibold text-accent focus:border-accent"
                        >
                          <option value={0}>گزینه ۱</option>
                          <option value={1}>گزینه ۲</option>
                          <option value={2}>گزینه ۳</option>
                          <option value={3}>گزینه ۴</option>
                        </select>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={addQuizQuestion}
                        className="h-8 text-[11px] font-bold gap-1.5 px-4 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded-lg transition-all"
                      >
                        <Plus className="size-3.5" />
                        <span>افزودن این سوال به آزمون دوره</span>
                      </Button>
                    </div>
                  </div>

                  {/* List of currently built questions */}
                  {builtQuestions.length > 0 ? (
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-bold text-foreground block">سوالات ثبت شده برای ارزیابی پایانی ({toFa(builtQuestions.length)} سوال):</Label>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {builtQuestions.map((q, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border text-xs shadow-sm hover:border-accent/30 transition-all">
                            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                              <span className="font-semibold text-foreground truncate">{toFa(idx + 1)}. {q.q}</span>
                              <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                                <Check className="size-3" />
                                <span>پاسخ صحیح: گزینه {toFa(q.answerIndex + 1)} ({q.options[q.answerIndex]})</span>
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuizQuestion(idx)}
                              className="size-8 text-critical hover:bg-critical/10 rounded-lg shrink-0 cursor-pointer transition-colors"
                            >
                              <Trash className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-foreground-muted border border-dashed border-border rounded-xl bg-background/15 select-none">
                      کوئیز آزمونی برای این دوره آموزشی ثبت نشده است. برای اعطای گواهینامه پایان دوره به پرسنل، حتما چند سوال طراحی کنید.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* WordPress Settings & SEO Sidebar Panel (1 Column) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Sidebar Module 1: Publish Settings */}
            <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45 select-none">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Settings className="size-4 text-accent" />
                  تنظیمات انتشار سند
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                
                {/* Workflow Status Selector */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground-muted font-semibold">وضعیت انتشار:</Label>
                  <select
                    value={form.status ?? 'draft'}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      setForm((f) => ({
                        ...f,
                        status: newStatus,
                        published: newStatus === 'published',
                      }))
                    }}
                    className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent cursor-pointer font-semibold"
                  >
                    <option value="draft">پیش‌نویس</option>
                    <option value="review">در بازبینی</option>
                    <option value="approved">تأیید شده</option>
                    <option value="published">انتشار</option>
                    <option value="archived">آرشیو</option>
                  </select>
                </div>

                {/* Estimate time */}
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted">مدت زمان مطالعه:</span>
                  <span className="font-bold font-mono text-accent">{toFa(readingTime)} دقیقه</span>
                </div>

                <div className="h-[1px] bg-border" />

                {/* Document Type Selector */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground-muted font-semibold">نوع و قالب نوشته:</Label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const newType = e.target.value
                      setForm((f) => ({
                        ...f,
                        type: newType,
                        // اطلاعیه اداری همیشه خواندن اجباری است
                        mandatory: newType === 'announcement' ? true : f.mandatory,
                      }))
                    }}
                    className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent cursor-pointer font-semibold"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prerequisite Course Selection */}
                {(form.type === 'training' || form.type === 'gallery') && (
                  <>
                    <div className="h-[1px] bg-border my-2" />
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground-muted font-semibold">پست پیش‌نیاز (قفل دوره):</Label>
                      <select
                        value={prerequisiteId || ''}
                        onChange={(e) => setPrerequisiteId(e.target.value || null)}
                        className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent cursor-pointer font-semibold"
                      >
                        <option value="">-- بدون پیش‌نیاز (بدون قفل) --</option>
                        {posts
                          .filter((p) => p.id !== form.id && (p.type === 'training' || p.type === 'gallery'))
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {TYPE_LABELS[p.type] || p.type}: {p.title}
                            </option>
                          ))}
                      </select>
                      <p className="text-[10px] text-foreground-muted leading-relaxed">
                        راهبران موظفند ابتدا دوره پیش‌نیاز را به اتمام برسانند (ویدیو را دیده و آزمون را پاس کنند) تا این دوره برایشان باز شود.
                      </p>
                    </div>
                  </>
                )}

                <div className="h-[1px] bg-border" />

                {/* Mandatory Checkbox */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={form.mandatory}
                      onChange={(e) => setForm((f) => ({ ...f, mandatory: e.target.checked }))}
                      className="size-4 rounded border-border text-accent focus:ring-accent accent-accent"
                    />
                    <span>خواندن و مطالعه اجباری است</span>
                  </label>
                  
                  {form.mandatory && (
                    <div className="space-y-2 bg-background/50 p-2.5 rounded-lg border border-border-subtle">
                      <Label className="text-[10px] text-foreground-muted block">جامعه هدف مطالعه اجباری:</Label>
                      <div className="space-y-1.5">
                        {TARGET_ROLES_OPTIONS.map((role) => (
                          <label key={role.value} className="flex items-center gap-2 text-[10px] text-foreground-muted cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={form.targetRoles.includes(role.value)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                if (role.value === 'all') {
                                  setForm((f) => ({ ...f, targetRoles: checked ? ['all'] : [] }))
                                } else {
                                  setForm((f) => {
                                    const filtered = f.targetRoles.filter((r) => r !== 'all')
                                    const next = checked ? [...filtered, role.value] : filtered.filter((r) => r !== role.value)
                                    return { ...f, targetRoles: next.length === 0 ? ['all'] : next }
                                  })
                                }
                              }}
                              className="size-3.5 rounded border-border accent-accent"
                            />
                            <span>{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Announcements Custom Settings Card */}
            {form.type === 'announcement' && (
              <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45 select-none">
                  <CardTitle className="text-xs font-bold text-foreground">تنظیمات اعلانات سازمانی</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* kind */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground-muted font-semibold">قالب نمایش اطلاعیه:</Label>
                    <select
                      value={form.kind}
                      onChange={(e) => {
                        const val = e.target.value as any
                        setForm((f) => ({
                          ...f,
                          kind: val,
                          ackRequired: (val === 'must_read' || val === 'emergency') ? true : f.ackRequired,
                        }))
                      }}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none cursor-pointer"
                    >
                      <option value="news">اخبار و رویدادهای عمومی</option>
                      <option value="notice">ابلاغیه اداری عادی</option>
                      <option value="must_read">دستورالعمل الزامی (قفل کل صفحه)</option>
                      <option value="urgent_banner">بنر فوری بالا فید</option>
                      <option value="emergency">اعلان بحران تمام‌صفحه مانیتورها</option>
                    </select>
                  </div>

                  {/* surfaces */}
                  <div className="space-y-2">
                    <Label className="text-foreground-muted font-semibold">بخش‌های نمایش (Surfaces):</Label>
                    <div className="space-y-1.5">
                      {[
                        { key: 'feed', label: 'فید اصلی نوشته‌ها' },
                        { key: 'dashboard', label: 'داشبورد پرسنلی' },
                        { key: 'banner', label: 'نوار اعلان متحرک بالا' },
                        { key: 'modal', label: 'مودال الزامی غیرقابل رد شدن' },
                        { key: 'signage', label: 'تلویزیون‌های دپو/ایستگاه' },
                      ].map((surface) => (
                        <label key={surface.key} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form.surfaces.includes(surface.key)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setForm((f) => ({
                                ...f,
                                surfaces: checked
                                  ? [...f.surfaces, surface.key]
                                  : f.surfaces.filter((s) => s !== surface.key),
                              }))
                            }}
                            className="size-3.5 rounded border-border accent-accent"
                          />
                          <span>{surface.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority & Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground-muted font-semibold">اولویت نمایش:</Label>
                      <Input
                        type="number"
                        value={form.priority}
                        onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                        className="h-8 text-xs text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground-muted font-semibold">انقضا (Expires):</Label>
                      <Input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                        className="h-8 text-xs text-center"
                      />
                    </div>
                  </div>

                  {/* Acknowledgment settings */}
                  <div className="space-y-3 border-t border-border pt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.ackRequired}
                        onChange={(e) => setForm((f) => ({ ...f, ackRequired: e.target.checked }))}
                        className="size-3.5 rounded border-border accent-accent"
                      />
                      <span className="font-semibold">نیاز به ثبت تاییدخوانی و امضا</span>
                    </label>

                    {form.ackRequired && (
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-foreground-muted font-semibold">مهلت تاییدخوانی:</Label>
                        <Input
                          type="date"
                          value={form.ackDeadline}
                          onChange={(e) => setForm((f) => ({ ...f, ackDeadline: e.target.value }))}
                          className="h-8 text-xs text-center"
                        />
                      </div>
                    )}
                  </div>

                  {/* Banner Styles */}
                  {(form.kind === 'urgent_banner' || form.surfaces.includes('banner')) && (
                    <div className="space-y-3 border-t border-border pt-3 bg-[#18181b]/30 p-2.5 rounded-lg">
                      <Label className="text-[10px] font-bold text-accent">سبک نمایش بنر فوری:</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-[10px]">رنگ بنر:</Label>
                          <select
                            value={form.bannerStyle.color}
                            onChange={(e) => setForm((f) => ({ ...f, bannerStyle: { ...f.bannerStyle, color: e.target.value as any } }))}
                            className="h-7 rounded border border-border bg-background px-1 text-[11px] outline-none"
                          >
                            <option value="red">قرمز (بحرانی)</option>
                            <option value="amber">نارنجی (هشدار)</option>
                            <option value="blue">آبی (اطلاعیه)</option>
                            <option value="green">سبز (عادی)</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none mt-4 text-[10px]">
                          <input
                            type="checkbox"
                            checked={form.bannerStyle.dismissible}
                            onChange={(e) => setForm((f) => ({ ...f, bannerStyle: { ...f.bannerStyle, dismissible: e.target.checked } }))}
                            className="size-3.5 rounded border-border accent-accent"
                          />
                          <span>قابل بستن</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Notify key & Audience Builder */}
                  <div className="space-y-3 border-t border-border pt-3">
                    <Label className="text-foreground-muted font-bold text-[10px] uppercase">مخاطبین هدف (Audience Builder)</Label>
                    <div className="space-y-2">
                      <Label className="text-[10px]">نقش‌های هدف:</Label>
                      <div className="flex flex-wrap gap-2">
                        {TARGET_ROLES_OPTIONS.map((role) => (
                          <label key={role.value} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.audience.roles.includes(role.value)}
                              onChange={(e) => {
                                const checked = e.target.checked
                                setForm((f) => {
                                  let nextRoles = f.audience.roles
                                  if (role.value === 'all') {
                                    nextRoles = checked ? ['all'] : []
                                  } else {
                                    const filtered = f.audience.roles.filter((r) => r !== 'all')
                                    nextRoles = checked ? [...filtered, role.value] : filtered.filter((r) => r !== role.value)
                                    if (nextRoles.length === 0) nextRoles = ['all']
                                  }
                                  return {
                                    ...f,
                                    audience: { ...f.audience, roles: nextRoles },
                                  }
                                })
                              }}
                              className="size-3 rounded border-border accent-accent"
                            />
                            <span>{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">کدهای شیفت (جدا با کاما):</Label>
                      <Input
                        value={form.audience.shiftCodes.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          setForm((f) => ({ ...f, audience: { ...f.audience, shiftCodes: val } }))
                        }}
                        placeholder="A, B, C"
                        className="h-7 text-[11px] text-right bg-zinc-950/20"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px]">نام ایستگاه‌ها (جدا با کاما):</Label>
                      <Input
                        value={form.audience.stations.join(', ')}
                        onChange={(e) => {
                          const val = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          setForm((f) => ({ ...f, audience: { ...f.audience, stations: val } }))
                        }}
                        placeholder="تجریش، کهریزک"
                        className="h-7 text-[11px] text-right bg-zinc-950/20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Report and Tracking Dashboard */}
            {form.id && form.type === 'announcement' && trackingStats && (
              <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="py-3 border-b border-border/50 bg-[#8b0000]/10 select-none">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold text-foreground">گزارش انطباق و تاییدخوانی</CardTitle>
                    <Badge variant="outline" className="text-[10px] py-0 font-mono text-accent">
                      {toFa(trackingStats.complianceRate)}٪
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Progress Ring / Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-foreground-muted">
                      <span>درصد تاییدخوانی کل جامعه هدف</span>
                      <span>{toFa(trackingStats.acknowledgedCount)} از {toFa(trackingStats.totalTargetCount)} نفر</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500 rounded-full"
                        style={{ width: `${trackingStats.complianceRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-foreground-muted bg-[#18181b]/20 p-2 rounded border border-border/40">
                    <div>
                      تایید شده: <span className="font-bold text-success">{toFa(trackingStats.acknowledgedCount)}</span>
                    </div>
                    <div>
                      باقی‌مانده: <span className="font-bold text-destructive">{toFa(trackingStats.remainingCount)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/api/admin/announcements/${form.id}/acks/export`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-white rounded px-2.5 py-1.5 text-[10px] font-semibold text-center cursor-pointer"
                    >
                      <Download className="size-3" />
                      <span>دانلود اکسل</span>
                    </a>
                    <Button
                      onClick={() => handleSendReminder(form.id!)}
                      disabled={trackingStats.remainingCount === 0}
                      className="bg-destructive hover:bg-destructive-hover text-white text-[10px] font-semibold py-1.5 h-auto rounded cursor-pointer gap-1"
                    >
                      <Send className="size-3" />
                      <span>ارسال یادآوری</span>
                    </Button>
                  </div>

                  {/* Quick lists */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <Label className="text-[10px] text-foreground-muted">لیست پرسنل باقی‌مانده ({toFa(trackingStats.remainingCount)} نفر):</Label>
                    <div className="max-h-28 overflow-y-auto space-y-1 bg-zinc-950/20 p-2 rounded text-[10px]">
                      {trackingStats.remainingList.map((user: any) => (
                        <div key={user.userId} className="flex justify-between border-b border-zinc-800/40 pb-0.5 last:border-0">
                          <span className="font-medium text-foreground">{user.name}</span>
                          <span className="text-[9px] text-foreground-muted font-mono">{user.role}</span>
                        </div>
                      ))}
                      {trackingStats.remainingList.length === 0 && (
                        <p className="text-center text-success text-[9px] py-2">تمامی پرسنل تایید کرده‌اند ✓</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sidebar Module 2: Category Manager */}
            <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45 select-none">
                <CardTitle className="text-xs font-bold text-foreground">دسته‌بندی و برچسب‌ها</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground-muted font-semibold">دسته‌بندی اصلی (یک مورد):</Label>
                    <Link href="/admin/content/categories" className="text-[10px] text-accent hover:underline flex items-center gap-1">
                      <Settings2 className="size-3" />
                      مدیریت دسته‌بندی‌ها
                    </Link>
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent cursor-pointer font-semibold"
                  >
                    <option value="">انتخاب دسته‌بندی اصلی...</option>
                    {contentCategories.map((cat) => (
                      <option key={cat.id} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-[1px] bg-border my-2" />

                <div className="flex flex-col gap-2">
                  <Label className="text-foreground-muted font-semibold">برچسب‌ها (تگ‌ها):</Label>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] p-1.5 border border-border rounded-lg bg-surface">
                    {(form.tags || []).map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-accent/15 text-accent border border-accent/20 px-2 py-1 rounded text-[10px]">
                        <span>{tag}</span>
                        <X
                          className="size-3 cursor-pointer opacity-70 hover:opacity-100"
                          onClick={() => setForm(f => ({ ...f, tags: (f.tags || []).filter((_, i) => i !== idx) }))}
                        />
                      </div>
                    ))}
                    <Input
                      placeholder="افزودن برچسب (Enter)..."
                      className="h-6 text-[10px] bg-transparent border-none shadow-none flex-1 min-w-[100px] px-1 focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = e.currentTarget.value.trim()
                          const currentTags = form.tags || []
                          if (val && !currentTags.includes(val)) {
                            setForm(f => ({ ...f, tags: [...currentTags, val] }))
                            e.currentTarget.value = ''
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-foreground-muted font-semibold block">برچسب‌های محبوب خط ۱:</span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_CATEGORIES.map((cat) => {
                      const currentTags = form.tags || []
                      const isIncluded = currentTags.includes(cat)
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (!isIncluded) {
                              setForm(f => ({ ...f, tags: [...(f.tags || []), cat] }))
                            }
                          }}
                          className={`px-2 py-1 rounded text-[10px] border transition-all cursor-pointer ${
                            isIncluded ? 'bg-accent/15 border-accent text-accent' : 'bg-background hover:bg-surface-hover border-border text-foreground-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Module 3: Yoast SEO Assistant & Google Snippet Simulator */}
            <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45 select-none">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="size-4 text-amber-500" />
                  دستیار پیشرفته سئو (OCC-SEO)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                
                {/* Focus keyword input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] text-foreground-muted font-semibold">عبارت کلیدی کانونی:</Label>
                  <Input
                    value={seoFocusKeyword}
                    onChange={(e) => setSeoFocusKeyword(e.target.value)}
                    placeholder="کلمه کلیدی مقاله برای رتبه‌بندی..."
                    className="h-8 text-xs text-right"
                  />
                </div>

                <div className="h-[1px] bg-border" />

                {/* Google Snippet Simulator */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-foreground-muted font-semibold block">پیش‌نمایش در نتایج جستجوی گوگل:</Label>
                  <div className="rounded-lg bg-black/50 border border-neutral-800 p-3 space-y-1 text-right leading-relaxed font-sans select-none">
                    <span className="text-[9px] text-neutral-400 block font-mono">http://localhost:3000 › content › {form.slug || 'slug'}</span>
                    <span className="text-xs text-sky-400 font-bold hover:underline block truncate leading-tight">{form.title || 'عنوان نمونه مقاله آموزشی شما'}</span>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {form.excerpt || 'برای پیش‌نمایش در نتایج گوگل، خلاصه‌ای در بخش خلاصه نوشته وارد کنید...'}
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-border" />

                {/* Live SEO checklist */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-foreground-muted font-semibold block">چک‌لیست سلامت سئو نوشته:</Label>
                  <div className="space-y-2">
                    {getSeoAnalysis().map((chk) => {
                      let statusIcon = <div className="w-2.5 h-2.5 rounded-full bg-neutral-600 shrink-0" />
                      if (chk.passed === true) {
                        statusIcon = <div className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                      } else if (chk.passed === false) {
                        statusIcon = <div className="w-2.5 h-2.5 rounded-full bg-critical shrink-0" />
                      }
                      
                      return (
                        <div key={chk.id} className="flex gap-2 items-start text-[10px] text-foreground-muted leading-relaxed">
                          {statusIcon}
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground block">{chk.label}</span>
                            <span>{chk.desc}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    )
  }

  // LIST VIEW: DASHBOARD TABLE OF PUBLICATIONS
  return (
    <div className="flex flex-1 flex-col gap-6 p-4" dir="rtl">
      
      {/* Recovery Banner if localstorage draft exists */}
      {hasRecoverableDraft && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-500">پیش‌نویس ذخیره‌شده خودکار یافت شد</h4>
              <p className="text-[11px] text-foreground-muted">یک نوشته منتشر نشده در مروگر شما از قبل ذخیره شده است. آیا می‌خواهید آن را بازیابی کنید?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={recoverDraft}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-[11px] font-bold rounded-lg cursor-pointer transition-all"
            >
              <Plus className="size-3.5" />
              <span>بازیابی نوشته</span>
            </Button>
            <Button
              onClick={discardDraft}
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-foreground-muted hover:text-foreground cursor-pointer rounded-lg border border-border/65"
            >
              <Trash className="size-3.5" />
              <span>حذف پیش‌نویس</span>
            </Button>
          </div>
        </div>
      )}

      {/* List View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2 select-none">
            <Newspaper className="size-6 text-accent" />
            مدیریت محتوا و مقالات خط ۱ مترو
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            ایجاد مقالات فنی، دوره‌های آموزشی با کوئیزهای هوشمند، بخشنامه‌های ایمنی و اخبار بهره‌برداری خط یک
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white h-10 text-xs gap-1.5 cursor-pointer rounded-lg shadow-lg shadow-accent/15 transition-all font-semibold active:scale-95"
        >
          <Plus className="size-4" />
          <span>ایجاد نوشته جدید (طرح وردپرس)</span>
        </Button>
      </div>

      {loading ? (
        <div role="status" className="rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low/20">
          <Loader2 className="size-7 animate-spin text-accent" />
          <p className="text-xs text-foreground-muted">در حال بارگذاری انتشارات سامانه...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-surface-container-low/10 border-dashed select-none">
          <Newspaper className="size-8 mx-auto opacity-30 text-foreground-muted mb-2" />
          <p className="text-xs text-foreground-muted">هنوز هیچ محتوایی در سیستم ثبت نشده است. همین حالا اولین مقاله یا دوره آموزشی را بنویسید!</p>
        </div>
      ) : (
        /* Publication Management Table */
        <div className="border border-border rounded-xl bg-surface-container-low/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/75 text-foreground-muted text-xs font-semibold select-none">
                  <th className="p-4">عنوان نوشته</th>
                  <th className="p-4">نوع محتوا</th>
                  <th className="p-4">دسته‌بندی اصلی</th>
                  <th className="p-4">نویسنده</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">آمار مطالعه</th>
                  <th className="p-4">تاریخ انتشار</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-hover/30 transition-colors duration-150">
                    <td className="p-4 font-semibold text-foreground max-w-xs truncate">
                      <div className="flex flex-col gap-1">
                        <span>{post.title}</span>
                        <span className="text-[10px] text-foreground-muted font-mono tracking-tight dir-ltr text-end select-all">/{post.slug}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] bg-background border-border text-foreground-muted font-semibold select-none">
                        {TYPE_LABELS[post.type] || post.type}
                      </Badge>
                    </td>
                    <td className="p-4 text-foreground-muted">{post.category || 'بدون دسته'}</td>
                    <td className="p-4 text-foreground-muted">{post.author?.name || 'مدیر سیستم'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Badge className={
                          post.status === 'published' ? 'bg-success/15 text-success border-transparent text-[10px] font-semibold' :
                          post.status === 'review' ? 'bg-warning/15 text-warning border-transparent text-[10px] font-semibold' :
                          post.status === 'approved' ? 'bg-info/15 text-info border-transparent text-[10px] font-semibold' :
                          post.status === 'archived' ? 'bg-neutral-700 text-neutral-400 border-transparent text-[10px] font-semibold' :
                          'bg-neutral-800 text-neutral-400 text-[10px] font-semibold'
                        }>
                          {post.status === 'published' ? 'منتشر شده' :
                           post.status === 'review' ? 'در بازبینی' :
                           post.status === 'approved' ? 'تأیید شده' :
                           post.status === 'archived' ? 'آرشیو' :
                           'پیش‌نویس'}
                        </Badge>
                        {post.mandatory && (
                          <Badge className="bg-critical/15 text-critical border-transparent text-[10px] font-bold animate-pulse">
                            مطالعه اجباری
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-foreground-muted">{toFa(post._count.reads)} بار دیده شده</td>
                    <td className="p-4 font-mono text-foreground-muted">{jalali(post.createdAt)}</td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(post)}
                          className="size-8 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg cursor-pointer transition-all"
                          title="ویرایش در کارگاه بلاک وردپرس"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(post.id)}
                          className="size-8 text-critical hover:bg-critical/10 rounded-lg cursor-pointer transition-all"
                          title="حذف دائمی نوشته"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminContentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col items-center justify-center p-12 min-h-screen bg-background" dir="rtl">
        <Loader2 className="size-7 animate-spin text-accent animate-bounce" />
        <p className="text-xs text-foreground-muted mt-2 font-semibold">در حال بارگذاری کارگاه تولید محتوای وردپرس...</p>
      </div>
    }>
      <AdminContentPageContent />
    </Suspense>
  )
}
