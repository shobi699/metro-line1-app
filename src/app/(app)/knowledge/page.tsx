'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toFa, jalali } from '@/lib/fa'
import { BookOpen, Search, FileText, Pencil, Plus, Download, CheckCircle, Clock, Users } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  slug: string
  body: string
  category: string | null
  tags: string | null
  version: number
  validFrom: string | null
  validUntil: string | null
  confidentialityLevel: string
  relatedPostId: string | null
  createdAt: string
  author?: { name: string }
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string | null
  createdAt: string
}

interface OfficialDocument {
  id: string
  title: string
  filename: string
  category: 'rules' | 'bypass' | 'phone' | 'technical'
  size: string
  downloadCount: number
  acknowledgedUsers: Array<{ name: string; date: string }>
}

export default function KnowledgePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // FAQ state
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loadingFaqs, setLoadingFaqs] = useState(false)
  
  // Tab layout
  const [activeTab, setActiveTab] = useState<'articles' | 'official-docs' | 'faq'>('articles')

  // Official Documents States
  const [docsSearch, setDocsSearch] = useState('')
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all')
  const [documents, setDocuments] = useState<OfficialDocument[]>([])

  const defaultDocs: OfficialDocument[] = [
    {
      id: 'doc-1',
      title: 'آیین‌نامه رانندگی و علائم خط ۱ مترو',
      filename: 'metro-driving-rules-v2.pdf',
      category: 'rules',
      size: '۴.۸ مگابایت',
      downloadCount: 142,
      acknowledgedUsers: [
        { name: 'علیرضا کریمی', date: '۱۴۰۵/۰۴/۰۲' },
        { name: 'مجید رضایی', date: '۱۴۰۵/۰۴/۰۳' },
      ]
    },
    {
      id: 'doc-2',
      title: 'دستورالعمل بایکوت و عبور اضطراری از بلاک مسدود',
      filename: 'emergency-bypass-procedures.pdf',
      category: 'bypass',
      size: '۲.۱ مگابایت',
      downloadCount: 95,
      acknowledgedUsers: [
        { name: 'حمید ابراهیمی', date: '۱۴۰۵/۰۴/۰۵' },
      ]
    },
    {
      id: 'doc-3',
      title: 'دفترچه تلفن‌های اضطراری و دیسپاچینگ OCC',
      filename: 'occ-emergency-numbers-1405.pdf',
      category: 'phone',
      size: '۸۵۰ کیلوبایت',
      downloadCount: 210,
      acknowledgedUsers: [
        { name: 'سهراب مرادی', date: '۱۴۰۵/۰۴/۰۲' },
        { name: 'علیرضا کریمی', date: '۱۴۰۵/۰۴/۰۲' },
      ]
    },
    {
      id: 'doc-4',
      title: 'دستورالعمل فنی و کاتالوگ عیب‌یابی سیستم ترمز واگن‌ها',
      filename: 'technical-brake-manual.pdf',
      category: 'technical',
      size: '۱۲.۴ مگابایت',
      downloadCount: 64,
      acknowledgedUsers: []
    }
  ]

  useEffect(() => {
    void loadArticles()
    // Load official documents
    if (typeof window !== 'undefined') {
      const savedDocs = window.localStorage.getItem('metro_official_documents')
      if (savedDocs) setDocuments(JSON.parse(savedDocs))
      else {
        setDocuments(defaultDocs)
        window.localStorage.setItem('metro_official_documents', JSON.stringify(defaultDocs))
      }
    }
  }, [accessToken, selectedCategory])

  async function loadArticles() {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.set('category', selectedCategory)
      if (search) params.set('q', search)

      const res = await fetch(`/api/knowledge?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setArticles(data.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadFAQs() {
    if (!accessToken) return
    setLoadingFaqs(true)
    try {
      const res = await fetch('/api/knowledge?scope=faq', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.data ?? [])
      }
    } finally {
      setLoadingFaqs(false)
    }
  }

  const handleAcknowledgeDoc = (docId: string) => {
    if (!user) return
    const updated = documents.map(doc => {
      if (doc.id === docId) {
        const alreadySigned = doc.acknowledgedUsers.some(u => u.name === user.name)
        if (alreadySigned) return doc
        
        return {
          ...doc,
          acknowledgedUsers: [
            ...doc.acknowledgedUsers,
            { name: user.name, date: jalali(new Date().toISOString()).split(' ')[0] }
          ]
        }
      }
      return doc
    })
    setDocuments(updated)
    window.localStorage.setItem('metro_official_documents', JSON.stringify(updated))
  }

  const categories = [
    'خبر سازمانی',
    'اطلاعیه اداری',
    'بخشنامه ایمنی',
    'آموزش فنی',
    'دستورالعمل عملیاتی',
    'فرم و فایل',
    'مقاله',
    'ویدئوی آموزشی',
    'آزمون',
  ]

  const docCategories = [
    { value: 'all', label: 'همه اسناد' },
    { value: 'news', label: 'خبر سازمانی' },
    { value: 'notice', label: 'اطلاعیه اداری' },
    { value: 'safety', label: 'بخشنامه ایمنی' },
    { value: 'training', label: 'آموزش فنی' },
    { value: 'instruction', label: 'دستورالعمل عملیاتی' },
    { value: 'form', label: 'فرم و فایل' },
    { value: 'article', label: 'مقاله' },
    { value: 'video', label: 'ویدئوی آموزشی' },
    { value: 'exam', label: 'آزمون' },
  ]

  const getDocCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'rules': return 'آیین‌نامه‌ها'
      case 'bypass': return 'بایکوت‌ها'
      case 'phone': return 'تلفن‌های ضروری'
      case 'technical': return 'دفترچه فنی'
      default: return cat
    }
  }

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(docsSearch.toLowerCase()) || 
                          doc.filename.toLowerCase().includes(docsSearch.toLowerCase())
    const matchesCategory = selectedDocCategory === 'all' || doc.category === selectedDocCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4 select-none">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <BookOpen className="size-6 text-accent" />
            دانش‌نامه و اسناد رسمی خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مخزن دستورالعمل‌ها، آیین‌نامه‌ها، بایکوت‌ها و فایل‌های مرجع سیر و حرکت مترو تهران
          </p>
        </div>
        {activeTab === 'articles' && (user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
          <Link href="/admin/knowledge" className="shrink-0">
            <Button size="sm" className="h-9 text-xs gap-1.5 cursor-pointer bg-accent hover:bg-accent-hover text-white rounded-lg shadow-md shadow-accent/15 font-semibold">
              <Plus className="size-4" />
              <span>مدیریت دانشنامه</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'articles'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          مقالات دانشنامه
        </button>
        <button
          onClick={() => setActiveTab('official-docs')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'official-docs'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          اسناد رسمی و فایل‌ها
        </button>
        <button
          onClick={() => { setActiveTab('faq'); loadFAQs() }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'faq'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-foreground-muted hover:text-foreground'
          }`}
        >
          پرسش و پاسخ متداول
        </button>
      </div>

      {/* ARTICLES TAB */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadArticles()}
              placeholder="جستجو در مقالات، تگ‌ها و متون دانشنامه..."
              className="pe-9 ps-9"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-8 text-xs cursor-pointer rounded-lg"
            >
              همه مقالات
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="h-8 text-xs cursor-pointer rounded-lg"
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg border border-border bg-background-subtle"
                />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-3 size-10 text-foreground-muted" />
                <p className="text-sm text-foreground-muted">مقاله‌ای در این دسته‌بندی یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <div key={article.id} className="relative group">
                  <Link href={`/knowledge/${article.slug}`} className="block">
                    <Card className="transition-all hover:bg-surface-hover hover:border-accent/30 bg-surface/40 backdrop-blur-md rounded-xl overflow-hidden shadow-sm h-full flex flex-col justify-between">
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-accent shrink-0" />
                          <span className="text-sm font-semibold text-foreground truncate max-w-[85%]">
                            {article.title}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {article.category && (
                            <Badge className="bg-accent/10 text-accent text-[10px] font-semibold border-transparent select-none">
                              {article.category}
                            </Badge>
                          )}
                          <Badge className="bg-neutral-800 text-neutral-400 text-[9px] font-mono border-transparent">
                            v{article.version}
                          </Badge>
                          {article.confidentialityLevel !== 'internal' && (
                            <Badge className={
                              article.confidentialityLevel === 'confidential' ? 'bg-warning/15 text-warning text-[9px] border-transparent' :
                              article.confidentialityLevel === 'secret' ? 'bg-critical/15 text-critical text-[9px] border-transparent' :
                              'bg-success/15 text-success text-[9px] border-transparent'
                            }>
                              {article.confidentialityLevel === 'confidential' ? 'محرمانه' :
                               article.confidentialityLevel === 'secret' ? 'سری' : 'عمومی'}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-foreground-muted border-t border-border/20 pt-2">
                          <span>تاریخ ثبت: {jalali(article.createdAt)}</span>
                          {article.author && <span>نویسنده: {article.author.name}</span>}
                          {article.validUntil && (
                            <span className="text-warning">اعتبار تا: {jalali(article.validUntil)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  {/* Overlay Edit Button for Admins */}
                  {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Link href={`/admin/knowledge?edit=${article.slug}`}>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 text-foreground-muted hover:text-accent hover:bg-accent/5 rounded-lg border border-border/60 bg-background/85 backdrop-blur shadow-sm cursor-pointer"
                          title="ویرایش مقاله دانشنامه"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OFFICIAL DOCUMENTS TAB */}
      {activeTab === 'official-docs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-surface-container-low border border-border p-3 rounded-lg">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                value={docsSearch}
                onChange={(e) => setDocsSearch(e.target.value)}
                placeholder="جستجو در اسناد، آیین‌نامه‌ها و قوانین..."
                className="pe-9 ps-9 h-8 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground-muted">دسته‌بندی اسناد:</span>
              <select
                value={selectedDocCategory}
                onChange={(e) => setSelectedDocCategory(e.target.value)}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all">همه اسناد</option>
                <option value="rules">آیین‌نامه‌ها</option>
                <option value="bypass">دستورالعمل بایکوت</option>
                <option value="phone">تلفن‌های اضطراری</option>
                <option value="technical">فنی و مهندسی</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredDocs.map((doc) => {
              const alreadySigned = user ? doc.acknowledgedUsers.some(u => u.name === user.name) : false
              return (
                <Card key={doc.id} className="border-accent/10">
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 text-right">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-accent shrink-0" />
                        <span className="text-xs font-black text-foreground">{doc.title}</span>
                        <Badge variant="outline" className="text-[9px] bg-accent/5 text-accent">
                          {getDocCategoryLabel(doc.category)}
                        </Badge>
                      </div>
                      
                      <div className="text-[10px] text-foreground-muted font-data-mono flex flex-wrap gap-4">
                        <span>نام فایل: {doc.filename}</span>
                        <span>حجم فایل: {toFa(doc.size)}</span>
                        <span>تعداد دانلود: {toFa(doc.downloadCount)} بار</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                      {/* Acknowledge Button */}
                      {alreadySigned ? (
                        <Badge className="bg-success/15 text-success border border-success/30 text-[9px] px-2.5 py-1 rounded font-bold flex items-center gap-1">
                          <CheckCircle className="size-3.5" />
                          <span>تایید و مطالعه شده</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledgeDoc(doc.id)}
                          className="h-8 text-[10px] font-bold bg-accent hover:bg-accent-hover text-white cursor-pointer"
                        >
                          تأیید مطالعه و آگاهی
                        </Button>
                      )}

                      {/* Mock Download Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alert(`دانلود فایل ${doc.filename} شبیه‌سازی شد.`)}
                        className="h-8 text-[10px] font-bold border-border text-foreground-muted hover:text-foreground cursor-pointer"
                      >
                        <Download className="size-3.5 me-0.5" />
                        دانلود سند
                      </Button>
                    </div>
                  </CardContent>

                  {/* Read Receipts Stats section */}
                  <div className="px-4 py-2.5 bg-surface-container-low/50 border-t border-border/40 text-[10px] text-foreground-muted flex flex-col sm:flex-row justify-between gap-2">
                    <span className="font-bold flex items-center gap-1">
                      <Users className="size-3.5 text-accent" />
                      تعداد پرسنل مطالعه‌کننده: {toFa(doc.acknowledgedUsers.length)} نفر
                    </span>
                    {doc.acknowledgedUsers.length > 0 && (
                      <span className="truncate max-w-md">
                        امضا کنندگان اخیر: {doc.acknowledgedUsers.map(u => `${u.name} (${u.date})`).join(' ، ')}
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* FAQ TAB */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {loadingFaqs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-background-subtle" />
              ))}
            </div>
          ) : faqs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-3 size-10 text-foreground-muted" />
                <p className="text-sm text-foreground-muted">هنوز پرسش و پاسخی ثبت نشده است</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <Card key={faq.id} className="border-border-subtle">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 size-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">پ</span>
                      <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                    </div>
                    <div className="flex items-start gap-2 pe-8">
                      <span className="shrink-0 size-6 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center">ج</span>
                      <p className="text-xs text-foreground-muted leading-relaxed">{faq.answer}</p>
                    </div>
                    {faq.category && (
                      <div className="pe-8">
                        <Badge className="text-[9px] bg-background-subtle text-foreground-muted">{faq.category}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
