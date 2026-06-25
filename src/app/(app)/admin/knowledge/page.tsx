'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Eye,
  Settings,
  Globe,
  Sparkles,
  Bold,
  Heading,
  List,
  Image,
  FileText,
  CheckCircle,
  AlertCircle,
  Award,
  Link2,
  Trash,
  Check,
  Clock,
  Settings2,
  ChevronUp,
  ChevronDown,
  XCircle,
  Video,
  FileCode,
  Undo2,
  EyeOff,
  BookOpen,
  Tag,
} from 'lucide-react'
import { toFa } from '@/lib/fa'

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

interface FormState {
  id: string | null
  title: string
  slug: string
  category: string
  tags: string
  body: string
}

export interface EditorBlock {
  id: string
  type: 'paragraph' | 'heading' | 'quote' | 'list' | 'image'
  content: string
  level?: 2 | 3
  caption?: string
}

const EMPTY_FORM: FormState = {
  id: null,
  title: '',
  slug: '',
  category: 'آموزش ایمنی',
  tags: '',
  body: '',
}

const KNOWLEDGE_CATEGORIES = [
  'آموزش ایمنی',
  'آشنایی با تجهیزات',
  'رویه‌های اضطراری',
  'نقشه‌خوانی مسیر',
  'مقررات عمومی سیر و حرکت',
  'دستورالعمل بایکوت قطار',
]

function AdminKnowledgePageContent() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Query Parameter Direct Edit Listener
  const searchParams = useSearchParams()
  const editSlug = searchParams.get('edit')

  // Block Editor States
  const [editorTab, setEditorTab] = useState<'visual' | 'code'>('visual')
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: 'initial-1', type: 'paragraph', content: '' },
  ])
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  // SEO Analyzer States
  const [seoFocusKeyword, setSeoFocusKeyword] = useState('')

  // Autosave notification state
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null)
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false)

  // Markdown to Blocks Parser
  const markdownToBlocks = (markdown: string): EditorBlock[] => {
    if (!markdown.trim()) {
      return [{ id: Math.random().toString(36).slice(2, 9), type: 'paragraph', content: '' }]
    }

    const paragraphs = markdown.trim().split(/\n\s*\n/)
    const parsedBlocks: EditorBlock[] = []

    paragraphs.forEach((p) => {
      const trimmed = p.trim()
      if (!trimmed) return

      const blockId = Math.random().toString(36).slice(2, 9)

      if (trimmed.startsWith('## ')) {
        parsedBlocks.push({ id: blockId, type: 'heading', level: 2, content: trimmed.replace(/^##\s+/, '') })
      } else if (trimmed.startsWith('### ')) {
        parsedBlocks.push({ id: blockId, type: 'heading', level: 3, content: trimmed.replace(/^###\s+/, '') })
      } else if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.split('\n').map((line) => line.replace(/^>\s?/, '')).join('\n')
        parsedBlocks.push({ id: blockId, type: 'quote', content: quoteText })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const listItems = trimmed.split('\n').map((line) => line.replace(/^[-\*]\s+/, '')).join('\n')
        parsedBlocks.push({ id: blockId, type: 'list', content: listItems })
      } else if (trimmed.startsWith('![') && trimmed.includes('](')) {
        const match = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (match) {
          parsedBlocks.push({ id: blockId, type: 'image', content: match[2], caption: match[1] })
        } else {
          parsedBlocks.push({ id: blockId, type: 'paragraph', content: trimmed })
        }
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
          case 'list':
            return content.split('\n').map((line) => `- ${line}`).join('\n')
          case 'image':
            return `![${b.caption || ''}](${content})`
          case 'paragraph':
          default:
            return content
        }
      })
      .filter(Boolean)
      .join('\n\n')
  }

  // Load articles
  async function load() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/knowledge?pageSize=100', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setArticles(data.data?.items ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const draft = localStorage.getItem('wordpress_draft_knowledge')
    if (draft) {
      setHasRecoverableDraft(true)
    }
  }, [accessToken])

  // Listen to editSlug from URL
  useEffect(() => {
    if (editSlug && articles.length > 0) {
      const matched = articles.find((a) => a.slug === editSlug || a.id === editSlug)
      if (matched) {
        openEdit(matched)
      }
    }
  }, [editSlug, articles])

  // Autosave
  useEffect(() => {
    if (!isWorkspaceOpen || form.id) return

    const interval = setInterval(() => {
      const finalBody = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
      if (form.title.trim() || finalBody.trim()) {
        localStorage.setItem(
          'wordpress_draft_knowledge',
          JSON.stringify({
            form,
            blocks,
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
  }, [isWorkspaceOpen, form, blocks, seoFocusKeyword, editorTab])

  const recoverDraft = () => {
    try {
      const saved = localStorage.getItem('wordpress_draft_knowledge')
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm(parsed.form)
        setBlocks(parsed.blocks)
        setSeoFocusKeyword(parsed.seoFocusKeyword || '')
        setLastAutosaved(null)
        setHasRecoverableDraft(false)
        setIsWorkspaceOpen(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const discardDraft = () => {
    localStorage.removeItem('wordpress_draft_knowledge')
    setHasRecoverableDraft(false)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setBlocks([{ id: 'new-1', type: 'paragraph', content: '' }])
    setSeoFocusKeyword('')
    setLastAutosaved(null)
    setEditorTab('visual')
    setIsWorkspaceOpen(true)
  }

  async function openEdit(art: Article) {
    setForm({
      id: art.id,
      title: art.title,
      slug: art.slug,
      category: art.category ?? 'آموزش ایمنی',
      tags: art.tags ?? '',
      body: art.body,
    })
    setLastAutosaved(null)
    setEditorTab('visual')

    const parsedBlocks = markdownToBlocks(art.body)
    setBlocks(parsedBlocks)
    setIsWorkspaceOpen(true)
  }

  async function handleSave() {
    if (!accessToken || !form.title.trim()) return
    setSaving(true)

    const finalBody = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        category: form.category,
        tags: form.tags,
        body: finalBody,
      }
      
      const url = form.id ? `/api/knowledge/${form.slug}` : '/api/knowledge'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        localStorage.removeItem('wordpress_draft_knowledge')
        setIsWorkspaceOpen(false)
        load()
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!accessToken) return
    if (!confirm('آیا از حذف این مقاله دانشنامه مطمئن هستید؟')) return
    try {
      const res = await fetch(`/api/knowledge/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) load()
    } catch {
      // silent
    }
  }

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

  const handleTabChange = (newTab: 'visual' | 'code') => {
    if (newTab === 'code') {
      const md = blocksToMarkdown(blocks)
      setForm((f) => ({ ...f, body: md }))
    } else {
      const parsed = markdownToBlocks(form.body)
      setBlocks(parsed)
    }
    setEditorTab(newTab)
  }

  const updateBlockContent = (id: string, newContent: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content: newContent } : b)))
  }

  const updateBlockMeta = (id: string, key: 'level' | 'caption', val: any) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [key]: val } : b)))
  }

  const addBlock = (type: EditorBlock['type'], afterId?: string) => {
    const newBlock: EditorBlock = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      content: '',
      ...(type === 'heading' ? { level: 2 } : {}),
      ...(type === 'image' ? { caption: '' } : {}),
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

  const getWordCount = () => {
    const textStr = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
    return textStr ? textStr.trim().split(/\s+/).filter(Boolean).length : 0
  }

  const getSeoAnalysis = () => {
    const keyword = seoFocusKeyword.trim().toLowerCase()
    const textStr = editorTab === 'visual' ? blocksToMarkdown(blocks) : form.body
    const titleLower = form.title.toLowerCase()
    const slugLower = form.slug.toLowerCase()

    return [
      {
        id: 'kw-title',
        label: 'کلمه کلیدی در عنوان مقاله',
        passed: keyword ? titleLower.includes(keyword) : null,
        desc: 'عبارت کلیدی کانونی باید در عنوان دانشنامه گنجانده شده باشد.',
      },
      {
        id: 'kw-slug',
        label: 'کلمه کلیدی در پیوند یکتا',
        passed: keyword ? slugLower.includes(keyword) : null,
        desc: 'آدرس اینترنتی یا اسلاگ مقاله باید شامل کلمه کلیدی باشد.',
      },
      {
        id: 'len-title',
        label: 'طول عنوان دانشنامه',
        passed: form.title.trim().length >= 15 && form.title.trim().length <= 60,
        desc: `طول بهینه عنوان بین ۱۵ تا ۶۰ کاراکتر است. (طول فعلی: ${toFa(form.title.trim().length)})`,
      },
      {
        id: 'len-words',
        label: 'تعداد کلمات مقاله',
        passed: getWordCount() >= 100,
        desc: `برای مقالات دانشنامه حداقل ۱۰۰ کلمه توصیه می‌شود. (کلمات فعلی: ${toFa(getWordCount())})`,
      },
    ]
  }

  if (isWorkspaceOpen) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground" dir="rtl">
        {/* Header bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsWorkspaceOpen(false)}
              className="text-foreground-muted hover:text-foreground cursor-pointer rounded-lg"
            >
              <ArrowRight className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-accent animate-pulse" />
              <span className="text-sm font-bold tracking-tight">
                {form.id ? 'ویرایشگر بلاک‌محور مقاله دانشنامه' : 'ایجاد مقاله دانشنامه جدید (کارگاه وردپرس)'}
              </span>
            </div>
            {lastAutosaved && (
              <Badge variant="outline" className="text-[10px] bg-neutral-900 text-neutral-400 border-neutral-800 gap-1 select-none">
                <Clock className="size-3" />
                <span>ذخیره خودکار: {lastAutosaved}</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5">
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
              size="sm"
              disabled={saving || !form.title.trim()}
              onClick={handleSave}
              className="bg-accent hover:bg-accent-hover text-white font-semibold h-8 text-xs px-4 gap-1.5 cursor-pointer shadow-lg shadow-accent/20 rounded-lg transition-all"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-4" />}
              <span>{form.id ? 'بروزرسانی مقاله' : 'انتشار در دانشنامه'}</span>
            </Button>
          </div>
        </header>

        {/* Layout */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* Title & Slug */}
            <div className="space-y-3 bg-surface-container-low/20 p-4 rounded-xl border border-border-subtle">
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="عنوان مقاله تخصصی دانشنامه را وارد کنید..."
                className="w-full bg-transparent border-none text-2xl font-extrabold focus:outline-none focus:ring-0 placeholder:text-foreground-muted text-foreground text-right"
              />

              <div className="flex items-center gap-1.5 text-xs text-foreground-muted bg-surface/50 px-3 py-1.5 rounded-lg border border-border/40 w-fit">
                <Link2 className="size-3.5 text-neutral-500" />
                <span className="font-semibold">پیوند یکتا (Permalink):</span>
                <span className="font-mono text-neutral-400 select-none">
                  /knowledge/
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

            {/* Visual Blocks */}
            {editorTab === 'visual' && (
              <div className="space-y-4">
                <div className="space-y-3 min-h-[300px]">
                  {blocks.map((block, index) => {
                    const isActive = activeBlockId === block.id
                    return (
                      <div
                        key={block.id}
                        onFocus={() => setActiveBlockId(block.id)}
                        className={`group relative p-3 rounded-lg border transition-all duration-150 ${
                          isActive ? 'bg-surface border-accent shadow-sm' : 'bg-surface/45 hover:bg-surface border-border-subtle hover:border-border'
                        }`}
                      >
                        {/* Controls */}
                        <div className={`absolute left-2 top-2 flex items-center gap-1 bg-surface-container-low/95 border border-border rounded-md p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isActive ? 'opacity-100' : ''}`}>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                          >
                            <ChevronUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(block.id, 'down')}
                            disabled={index === blocks.length - 1}
                            className="p-1 text-foreground-muted hover:text-foreground disabled:opacity-30 rounded cursor-pointer"
                          >
                            <ChevronDown className="size-3.5" />
                          </button>
                          <div className="w-[1px] h-3 bg-border mx-1" />
                          <span className="text-[9px] font-bold text-accent px-1">
                            {block.type === 'paragraph' && 'پاراگراف'}
                            {block.type === 'heading' && `سربرگ H${block.level}`}
                            {block.type === 'quote' && 'نقل قول'}
                            {block.type === 'list' && 'فهرست'}
                            {block.type === 'image' && 'تصویر'}
                          </span>
                          <div className="w-[1px] h-3 bg-border mx-1" />
                          <button
                            type="button"
                            onClick={() => addBlock('paragraph', block.id)}
                            className="p-1 text-foreground-muted hover:text-success rounded cursor-pointer"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-critical hover:bg-critical/10 rounded cursor-pointer"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="pl-32">
                          {block.type === 'paragraph' && (
                            <textarea
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              placeholder="متن پاراگراف دانشنامه را بنویسید..."
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
                                placeholder="عنوان سربرگ دانشنامه..."
                                className={`w-full bg-transparent border-none p-0 font-extrabold focus:ring-0 focus:outline-none text-right ${
                                  block.level === 3 ? 'text-sm text-neutral-200' : 'text-base text-foreground'
                                }`}
                              />
                            </div>
                          )}

                          {block.type === 'quote' && (
                            <div className="border-r-4 border-accent bg-accent/5 p-3 rounded-l-md">
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="توضیح ویژه یا هشدار مقررات..."
                                rows={Math.max(2, block.content.split('\n').length)}
                                className="w-full bg-transparent border-none p-0 text-sm italic text-neutral-300 placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none font-medium"
                              />
                            </div>
                          )}

                          {block.type === 'list' && (
                            <div className="space-y-1">
                              <textarea
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="- مورد اول دستورالعمل&#10;- مورد دوم..."
                                rows={Math.max(3, block.content.split('\n').length)}
                                className="w-full bg-transparent border-none p-0 text-sm text-foreground placeholder:text-foreground-muted focus:ring-0 focus:outline-none leading-7 text-right resize-none font-mono"
                              />
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-3">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="آدرس مستقیم تصویر شماتیک فنی..."
                                className="h-8 text-xs font-mono text-left dir-ltr"
                              />
                              {block.content.trim() && (
                                <div className="rounded-lg overflow-hidden border border-border bg-neutral-950 max-h-48 max-w-sm mx-auto flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={block.content} alt="پیش‌نمایش" className="max-w-full max-h-full object-cover" />
                                </div>
                              )}
                              <Input
                                value={block.caption || ''}
                                onChange={(e) => updateBlockMeta(block.id, 'caption', e.target.value)}
                                placeholder="زیرنویس تصویر..."
                                className="h-8 text-xs text-right"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add Block Panel */}
                <div className="p-4 rounded-xl border border-dashed border-border bg-surface-container-low/10 flex flex-col items-center justify-center gap-3 select-none">
                  <span className="text-xs font-semibold text-foreground-muted">افزودن بلاک جدید به سند دانشنامه:</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => addBlock('paragraph')} className="h-8 text-xs gap-1 cursor-pointer rounded-lg">
                      <FileText className="size-3.5 text-neutral-400" />
                      <span>پاراگراف جدید</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('heading')} className="h-8 text-xs gap-1 cursor-pointer rounded-lg">
                      <Heading className="size-3.5 text-accent" />
                      <span>سربرگ فنی</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('quote')} className="h-8 text-xs gap-1 cursor-pointer rounded-lg">
                      <Bold className="size-3.5 text-amber-500" />
                      <span>نکته / نقل‌قول</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('list')} className="h-8 text-xs gap-1 cursor-pointer rounded-lg">
                      <List className="size-3.5 text-success" />
                      <span>لیست دستورالعمل</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('image')} className="h-8 text-xs gap-1 cursor-pointer rounded-lg">
                      <Image className="size-3.5 text-sky-500" />
                      <span>تصویر دیاگرام</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Markdown Code */}
            {editorTab === 'code' && (
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="متن مقاله را به صورت مارک‌داون خام بنویسید..."
                rows={15}
                className="w-full rounded-lg border border-border bg-surface-container-low/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border leading-7 text-right resize-y min-h-[350px] font-mono"
              />
            )}

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Category and Tags */}
            <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45">
                <CardTitle className="text-xs font-bold text-foreground">تنظیمات و دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                
                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground-muted font-semibold">دسته‌بندی مقاله:</Label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs outline-none focus:border-accent cursor-pointer font-semibold text-foreground"
                  >
                    {KNOWLEDGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-foreground-muted font-semibold">برچسب‌ها (تگ‌ها با کاما جدا شوند):</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="مثال: ترمز، بوژی، سری۱۰۰..."
                    className="h-8 text-xs text-right font-semibold"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Assistant */}
            <Card className="border border-border bg-surface shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3 border-b border-border/50 bg-neutral-900/45">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="size-4 text-amber-500" />
                  دستیار سئو دانشنامه
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] text-foreground-muted font-semibold">کلمه کلیدی کانونی:</Label>
                  <Input
                    value={seoFocusKeyword}
                    onChange={(e) => setSeoFocusKeyword(e.target.value)}
                    placeholder="مثال: ترمز واگن..."
                    className="h-8 text-xs text-right"
                  />
                </div>

                <div className="h-[1px] bg-border" />

                <div className="space-y-2">
                  <Label className="text-[10px] text-foreground-muted font-semibold block">پیش‌نمایش نتایج گوگل:</Label>
                  <div className="rounded-lg bg-black/50 border border-neutral-800 p-3 space-y-1 text-right leading-relaxed font-sans select-none">
                    <span className="text-[9px] text-neutral-400 block font-mono">/knowledge/{form.slug || 'slug'}</span>
                    <span className="text-xs text-sky-400 font-bold hover:underline block truncate leading-tight">{form.title || 'عنوان مقاله دانشنامه'}</span>
                    <p className="text-[9px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {form.body.substring(0, 100) || 'متن پیش‌نمایش در این بخش قرار می‌گیرد...'}
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-border" />

                <div className="space-y-2">
                  <Label className="text-[10px] text-foreground-muted font-semibold block">تحلیل زنده سئو:</Label>
                  <div className="space-y-2">
                    {getSeoAnalysis().map((chk) => (
                      <div key={chk.id} className="flex gap-2 items-start text-[10px] text-foreground-muted leading-relaxed">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${chk.passed === true ? 'bg-success' : chk.passed === false ? 'bg-critical' : 'bg-neutral-600'}`} />
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block">{chk.label}</span>
                          <span>{chk.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4" dir="rtl">
      
      {hasRecoverableDraft && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-500">پیش‌نویس ذخیره‌شده دانشنامه</h4>
              <p className="text-[11px] text-foreground-muted">یک مقاله دانشنامه منتشر نشده در مرورگر شما یافت شد. بازیابی می‌کنید؟</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={recoverDraft} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-[11px] font-bold rounded-lg cursor-pointer">
              <span>بازیابی نوشته</span>
            </Button>
            <Button onClick={discardDraft} variant="ghost" size="sm" className="h-8 text-[11px] text-foreground-muted hover:text-foreground border border-border/65 rounded-lg">
              <span>حذف پیش‌نویس</span>
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2 select-none">
            <BookOpen className="size-6 text-accent" />
            مدیریت مقالات دانشنامه خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            ایجاد، ویرایش و مدیریت دستورالعمل‌های فنی، نقشه‌خوانی مسیر و رویه‌های عملیاتی خط ۱ مترو تهران
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="w-full md:w-auto bg-accent hover:bg-accent-hover text-white h-10 text-xs gap-1.5 cursor-pointer rounded-lg shadow-lg shadow-accent/15 font-semibold transition-all"
        >
          <Plus className="size-4" />
          <span>ایجاد مقاله دانشنامه جدید</span>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low/20">
          <Loader2 className="size-7 animate-spin text-accent" />
          <p className="text-xs text-foreground-muted">در حال بارگذاری دانشنامه...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center bg-surface-container-low/10 border-dashed">
          <BookOpen className="size-8 mx-auto opacity-30 text-foreground-muted mb-2" />
          <p className="text-xs text-foreground-muted">هیچ مقاله‌ای در دانشنامه ثبت نشده است. اولین مقاله علمی را ایجاد کنید!</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-surface-container-low/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/75 text-foreground-muted text-xs font-semibold select-none">
                  <th className="p-4">عنوان مقاله</th>
                  <th className="p-4">دسته‌بندی</th>
                  <th className="p-4">برچسب‌ها</th>
                  <th className="p-4">نویسنده</th>
                  <th className="p-4">تاریخ انتشار</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-surface-hover/30 transition-colors duration-150">
                    <td className="p-4 font-semibold text-foreground max-w-xs truncate">
                      <div className="flex flex-col gap-1">
                        <span>{art.title}</span>
                        <span className="text-[10px] text-foreground-muted font-mono tracking-tight dir-ltr text-end">/knowledge/{art.slug}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] bg-background border-border text-foreground-muted font-semibold select-none">
                        {art.category || 'عمومی'}
                      </Badge>
                    </td>
                    <td className="p-4 text-foreground-muted">
                      <div className="flex flex-wrap gap-1">
                        {art.tags ? art.tags.split(',').map((t, i) => (
                          <span key={i} className="text-[9px] bg-neutral-900 px-1 py-0.5 rounded text-neutral-400">#{t.trim()}</span>
                        )) : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-foreground-muted">{art.author?.name || 'مدیر سیستم'}</td>
                    <td className="p-4 font-mono text-foreground-muted">{jalali(art.createdAt)}</td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(art)}
                          className="size-8 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg cursor-pointer transition-all"
                          title="ویرایش مقاله"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(art.slug)}
                          className="size-8 text-critical hover:bg-critical/10 rounded-lg cursor-pointer transition-all"
                          title="حذف مقاله"
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

export default function AdminKnowledgePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 flex-col items-center justify-center p-12 min-h-screen bg-background" dir="rtl">
        <Loader2 className="size-7 animate-spin text-accent animate-bounce" />
        <p className="text-xs text-foreground-muted mt-2 font-semibold">در حال بارگذاری کارگاه دانشنامه...</p>
      </div>
    }>
      <AdminKnowledgePageContent />
    </Suspense>
  )
}
