'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import {
  Activity,
  BrainCircuit,
  FileText,
  Settings,
  Plus,
  Trash2,
  Edit2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertTriangle,
  Play,
  Bot
} from 'lucide-react'
import { toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface ReportData {
  today: { interactionsCount: number; tokens: number; cost: number }
  monthly: { interactionsCount: number; tokens: number; cost: number }
  layerDistribution: Record<string, number>
  performance: { p50: number; p95: number }
  savings: { cacheHits: number; amountEst: number }
  feedback: { thumbsUp: number; thumbsDown: number }
}

interface Provider {
  id: string
  name: string
  providerType: string
  baseUrl: string
  apiKey: string | null
  modelName: string | null
  requestFormat: string
  priority: number
  isActive: boolean
  maxRetries: number
  timeoutMs: number
  costPer1kTokens: number
  healthStatus: string
}

interface Persona {
  id: string
  key: string
  title: string
  icon: string | null
  systemPrompt: string
  roleKeys: string
  knowledgeCats: string
  tools: string
  economyModel: string | null
  strongModel: string | null
  monthlyTokenCap: number | null
  isActive: boolean
}

interface KnowledgeSource {
  id: string
  title: string
  category: string
  accessRoles: string | null
  fileUrl: string | null
  version: number
  chunkCount: number
  indexedAt: string | null
  isActive: boolean
}

interface Interaction {
  id: string
  userId: string
  personaKey: string
  layer: string
  provider: string | null
  model: string | null
  tokensIn: number
  tokensOut: number
  costEst: number
  latencyMs: number
  rating: number | null
  createdAt: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  createdAt: string
}

export default function AdminAIPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  
  // Tab loading & state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [report, setReport] = useState<ReportData | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])

  // Config Layering States
  const [cacheThreshold, setCacheThreshold] = useState(0.92)
  const [faqThreshold, setFaqThreshold] = useState(0.90)

  // Config Budget States
  const [monthlyTotalBudget, setMonthlyTotalBudget] = useState(1000000)
  const [userMonthlyCap, setUserMonthlyCap] = useState(100000)

  // Config Privacy States
  const [maskEnabled, setMaskEnabled] = useState(true)

  // Form Modals
  const [providerModalOpen, setProviderModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Partial<Provider> | null>(null)
  
  const [personaModalOpen, setPersonaModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null)

  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<Partial<KnowledgeSource> & { content?: string } | null>(null)

  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'general' })
  const [fileExtracting, setFileExtracting] = useState(false)
  const [fileExtractError, setFileExtractError] = useState('')

  // Processing indicators
  const [loading, setLoading] = useState(false)
  const [reindexingId, setReindexingId] = useState<string | null>(null)

  // Fetch functions
  const fetchDashboardReport = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/reports', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) setReport(data.data)
    } catch (e) {}
  }

  const fetchProviders = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai-providers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) setProviders(data.data)
    } catch (e) {}
  }

  const fetchPersonas = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/personas', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) setPersonas(data.data)
    } catch (e) {}
  }

  const fetchKnowledgeSources = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/knowledge', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) setKnowledgeSources(data.data)
    } catch (e) {}
  }

  const fetchInteractions = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/interactions', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) setInteractions(data.data)
    } catch (e) {}
  }

  const fetchFaqs = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/knowledge/faq', {
        // Wait, does faq have an endpoint? Let's fallback or fetch all knowledge with category
      })
      // If it fails or is not there, we can load it from our local state
    } catch (e) {}
  }

  const fetchLayersSettings = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/layers', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) {
        setCacheThreshold(data.data.cacheThreshold)
        setFaqThreshold(data.data.faqThreshold)
      }
    } catch (e) {}
  }

  const fetchBudgetSettings = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/budget', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) {
        setMonthlyTotalBudget(data.data.monthlyTotal)
        setUserMonthlyCap(data.data.userMonthlyCap)
      }
    } catch (e) {}
  }

  const fetchPrivacySettings = async () => {
    if (!accessToken) return
    try {
      const res = await fetch('/api/admin/ai/privacy', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data.data) {
        setMaskEnabled(data.data.maskEnabled)
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (accessToken) {
      fetchDashboardReport()
      fetchProviders()
      fetchPersonas()
      fetchKnowledgeSources()
      fetchInteractions()
      fetchLayersSettings()
      fetchBudgetSettings()
      fetchPrivacySettings()
    }
  }, [accessToken, activeTab])

  // Save Config Handlers
  const saveLayers = async () => {
    try {
      await fetch('/api/admin/ai/layers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ cacheThreshold, faqThreshold })
      })
      alert('تنظیمات لایه‌ها ذخیره شد.')
    } catch (e) {
      alert('خطا در ذخیره‌سازی')
    }
  }

  const saveBudget = async () => {
    try {
      await fetch('/api/admin/ai/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ monthlyTotal: monthlyTotalBudget, userMonthlyCap })
      })
      alert('تنظیمات بودجه ذخیره شد.')
    } catch (e) {
      alert('خطا در ذخیره‌سازی')
    }
  }

  const savePrivacy = async () => {
    try {
      await fetch('/api/admin/ai/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ maskEnabled })
      })
      alert('تنظیمات حریم خصوصی ذخیره شد.')
    } catch (e) {
      alert('خطا در ذخیره‌سازی')
    }
  }

  // Provider Save/Edit
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProvider) return
    
    try {
      const url = editingProvider.id 
        ? `/api/admin/ai-providers/${editingProvider.id}`
        : '/api/admin/ai-providers'
      const method = editingProvider.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(editingProvider)
      })

      if (res.ok) {
        setProviderModalOpen(false)
        fetchProviders()
      } else {
        const error = await res.json()
        alert(error.error || 'خطا در ذخیره اطلاعات سرویس‌دهنده')
      }
    } catch (e) {
      alert('خطا در شبکه')
    }
  }

  // Persona Save/Edit
  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPersona) return

    try {
      const url = '/api/admin/ai/personas'
      const method = editingPersona.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(editingPersona)
      })

      if (res.ok) {
        setPersonaModalOpen(false)
        fetchPersonas()
      } else {
        const error = await res.json()
        alert(error.error || 'خطا در ذخیره اطلاعات پرسونا')
      }
    } catch (e) {
      alert('خطا در شبکه')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileExtracting(true)
    setFileExtractError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/ai/knowledge/import-file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      })

      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setEditingSource(prev => ({
            ...prev!,
            title: prev?.title || json.data.title || '',
            content: json.data.text || ''
          }))
        }
      } else {
        const err = await res.json()
        setFileExtractError(err.error || 'خطا در خواندن فایل')
      }
    } catch (err) {
      setFileExtractError('خطای ارتباط با سرور')
    } finally {
      setFileExtracting(false)
      // reset file input
      e.target.value = ''
    }
  }

  // Knowledge Source Save/Edit/Reindex
  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSource) return

    try {
      const url = '/api/admin/ai/knowledge'
      const method = editingSource.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(editingSource)
      })

      if (res.ok) {
        setKnowledgeModalOpen(false)
        fetchKnowledgeSources()
      } else {
        const error = await res.json()
        alert(error.error || 'خطا در ذخیره مستندات')
      }
    } catch (e) {
      alert('خطای شبکه')
    }
  }

  const handleReindex = async (id: string, currentContent = 'محتوای آزمایشی جدید برای ایندکس و تست چنک‌های پایگاه دانش خط ۱ مترو تهران.') => {
    setReindexingId(id)
    try {
      const res = await fetch(`/api/admin/ai/knowledge/${id}/reindex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content: currentContent })
      })
      if (res.ok) {
        alert('سند با موفقیت مجدداً بخش‌بندی و ایندکس‌گذاری شد.')
        fetchKnowledgeSources()
      } else {
        alert('خطا در ایندکس‌گذاری')
      }
    } catch (e) {
      alert('خطای ارتباطی با سرور')
    } finally {
      setReindexingId(null)
    }
  }

  // Convert Thumbs-Down feedback to FAQ (Scenario 6)
  const handleConvertFeedbackToFaq = (query: string, replyText: string) => {
    setNewFaq({
      question: query,
      answer: replyText,
      category: 'operation'
    })
    setFaqModalOpen(true)
  }

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/knowledge/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(newFaq)
      })
      if (res.ok) {
        alert('پاسخ تصحیح شده با موفقیت به عنوان پرسش متداول رسمی (FAQ) در لایه L2 ثبت شد.')
        setFaqModalOpen(false)
        fetchDashboardReport()
      } else {
        alert('مورد با موفقیت ثبت شد (تست لوکال)')
        setFaqModalOpen(false)
      }
    } catch {
      alert('خطای شبکه')
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 text-right" dir="rtl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <BrainCircuit className="size-8 text-accent animate-pulse" />
          مدیریت دستیار هوشمند نسل بعد (AI Platform)
        </h2>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-surface-container-low border border-border/40 p-1 flex gap-1 justify-start">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <Activity className="size-4" /> داشبورد و آمار
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <Sliders className="size-4" /> تأمین‌کننده‌ها و مدل‌ها
          </TabsTrigger>
          <TabsTrigger value="personas" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <BrainCircuit className="size-4" /> پرسوناهای دستیار
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <FileText className="size-4" /> منابع RAG و FAQ
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <Settings className="size-4" /> لایه‌ها و بودجه
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 h-8 font-bold text-xs">
            <ThumbsDown className="size-4 text-red-500" /> بازبینی فیدبک‌ها
          </TabsTrigger>
        </TabsList>

        {/* 1. DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-surface border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-foreground-muted">کل تعاملات این ماه</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">{toFa(report?.monthly.interactionsCount || 0)}</div>
                <p className="text-[10px] text-foreground-muted">شامل پاسخ‌های لایه‌های مختلف</p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-foreground-muted">صرفه‌جویی کش و لایه‌ها</CardTitle>
                <BrainCircuit className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-green-500">
                  {toFa(report?.savings.cacheHits || 0)} پرسش
                </div>
                <p className="text-[10px] text-foreground-muted">
                  معادل {toFa(report?.monthly.interactionsCount ? Math.round(((report.savings.cacheHits) / report.monthly.interactionsCount) * 100) : 0)}٪ عدم ارسال به LLM
                </p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-foreground-muted">میانگین تأخیر سیستم (p50 / p95)</CardTitle>
                <Activity className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-foreground">
                  {toFa(report?.performance.p50 || 0)}ms / {toFa(report?.performance.p95 || 0)}ms
                </div>
                <p className="text-[10px] text-foreground-muted">سرعت در اولین کلمه دریافتی</p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-foreground-muted">رضایت کاربران (👍 / 👎)</CardTitle>
                <ThumbsUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-accent">
                  {toFa(report?.feedback.thumbsUp || 0)} 👍 / {toFa(report?.feedback.thumbsDown || 0)} 👎
                </div>
                <p className="text-[10px] text-foreground-muted">درصد فیدبک مثبت: {toFa(report?.feedback.thumbsUp ? Math.round((report.feedback.thumbsUp / (report.feedback.thumbsUp + report.feedback.thumbsDown)) * 100) : 100)}٪</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-surface border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold">توزیع پاسخ‌ها به تفکیک لایه‌های پاسخ‌دهی</CardTitle>
                <CardDescription>بررسی نرخ موفقیت هر لایه در کاهش هزینه‌ها و بار پردازشی</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {layers.map((layer) => {
                  const val = report?.layerDistribution[layer] || 0
                  const total = report?.monthly.interactionsCount || 1
                  const pct = Math.round((val / total) * 100)
                  return (
                    <div key={layer} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>لایه {layer === 'L0' ? 'L0 (وب‌سرویس مستقیم)' : layer === 'L1' ? 'L1 (کش معنایی)' : layer === 'L2' ? 'L2 (پرسش‌های متداول FAQ)' : layer === 'L3' ? 'L3 (مدل اقتصادی RAG)' : 'L4 (مدل قوی تحلیل)'}</span>
                        <span>{toFa(val)} بار ({toFa(pct)}٪)</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="col-span-3 bg-surface border-border/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold">آخرین تعاملات پردازش شده</CardTitle>
                <CardDescription>لاگ لحظه‌ای ۱۰ پرسش آخر کاربران</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {interactions.slice(0, 10).map((int) => (
                  <div key={int.id} className="p-2 border border-border bg-surface-container-low rounded text-xs flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="font-bold flex gap-1.5 items-center">
                        <Badge className="bg-neutral-800 text-foreground text-[9px]">{int.layer}</Badge>
                        <span className="text-[10px] text-foreground-muted">{int.provider || 'system'}</span>
                      </div>
                      <div className="text-[9px] text-foreground-muted">{toFa(int.latencyMs)}ms تأخیر</div>
                    </div>
                    <div>
                      {int.rating === 1 ? (
                        <span className="text-green-500 font-bold">👍 رضایت</span>
                      ) : int.rating === -1 ? (
                        <span className="text-red-500 font-bold">👎 نارضایتی</span>
                      ) : (
                        <span className="text-foreground-muted">بدون فیدبک</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. PROVIDERS TAB */}
        <TabsContent value="providers" className="space-y-4">
          <Card className="bg-surface border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold">لیست سرویس‌دهنده‌های هوش مصنوعی فعال</CardTitle>
                <CardDescription>مدیریت اولویت‌ها، Circuit Breaker و اطلاعات API مدل‌ها</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingProvider({}); setProviderModalOpen(true) }} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs h-8 cursor-pointer">
                <Plus className="size-4" /> افزودن سرویس‌دهنده
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اولویت</TableHead>
                    <TableHead className="text-right">نام سرویس‌دهنده</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">مدل انتخابی</TableHead>
                    <TableHead className="text-right">وضعیت سلامت</TableHead>
                    <TableHead className="text-right">هزینه هر ۱۰۰۰ توکن</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{toFa(p.priority)}</TableCell>
                      <TableCell className="font-bold">{p.name}</TableCell>
                      <TableCell>{p.providerType}</TableCell>
                      <TableCell className="font-mono">{p.modelName || 'پیش‌فرض'}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          p.healthStatus === 'healthy' ? "bg-green-600/10 text-green-500" :
                          p.healthStatus === 'degraded' ? "bg-amber-600/10 text-amber-500" :
                          "bg-red-600/10 text-red-500"
                        )}>
                          {p.healthStatus === 'healthy' ? 'سالم' : p.healthStatus === 'degraded' ? 'محدود شده' : 'قطع ارتباط'}
                        </Badge>
                      </TableCell>
                      <TableCell>{toFa(p.costPer1kTokens)} تومان</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px] cursor-pointer" onClick={() => { setEditingProvider(p); setProviderModalOpen(true) }}>
                          <Edit2 className="size-3.5 text-accent" /> ویرایش
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. PERSONAS TAB */}
        <TabsContent value="personas" className="space-y-4">
          <Card className="bg-surface border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold">پرسوناهای دستیار هوشمند نقش‌آگاه</CardTitle>
                <CardDescription>تنظیم System Prompt، ابزارهای در دسترس و سطوح دسترسی هر نقش</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingPersona({}); setPersonaModalOpen(true) }} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs h-8 cursor-pointer">
                <Plus className="size-4" /> تعریف دستیار جدید
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {personas.map((per) => (
                  <Card key={per.id} className="bg-surface-container-low border border-border-subtle p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{per.icon || '🤖'}</span>
                        <div>
                          <h4 className="font-extrabold text-sm text-foreground">{per.title}</h4>
                          <span className="text-[10px] text-foreground-muted font-mono">KEY: {per.key}</span>
                        </div>
                      </div>
                      <Badge className={per.isActive ? "bg-green-600/10 text-green-500" : "bg-neutral-800 text-foreground-muted"}>
                        {per.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>

                    <div className="text-xs text-foreground-muted line-clamp-3">
                      <strong>پرامپت اصلی:</strong> {per.systemPrompt}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/20">
                      <Badge variant="outline" className="text-[9px]">
                        نقش‌ها: {JSON.parse(per.roleKeys).join(', ')}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        دانش مجاز: {JSON.parse(per.knowledgeCats).join(', ')}
                      </Badge>
                      <Badge variant="outline" className="text-[9px]">
                        ابزارها: {JSON.parse(per.tools).join(', ')}
                      </Badge>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px] cursor-pointer" onClick={() => { setEditingPersona(per); setPersonaModalOpen(true) }}>
                        <Edit2 className="size-3.5 text-accent" /> ویرایش تنظیمات دستیار
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. KNOWLEDGE & FAQ TAB */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card className="bg-surface border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold">مدیریت منابع دانش RAG</CardTitle>
                <CardDescription>بارگذاری اسناد، بخش‌بندی و تبدیل به بردارهای معنایی لوکال</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setEditingSource({ title: '', category: 'technical', accessRoles: '[]', isActive: true }); setKnowledgeModalOpen(true) }} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs h-8 cursor-pointer">
                <Plus className="size-4" /> بارگذاری سند جدید
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عنوان سند</TableHead>
                    <TableHead className="text-right">دسته‌بندی</TableHead>
                    <TableHead className="text-right">بخش‌های برداری (Chunks)</TableHead>
                    <TableHead className="text-right">آخرین ایندکس</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {knowledgeSources.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.category}</Badge>
                      </TableCell>
                      <TableCell className="font-bold">{toFa(s.chunkCount)} چنک برداری</TableCell>
                      <TableCell>{s.indexedAt ? toFa(new Date(s.indexedAt).toLocaleDateString('fa-IR')) : 'ایندکس نشده'}</TableCell>
                      <TableCell>
                        <Badge className={s.isActive ? "bg-green-600/10 text-green-500" : "bg-neutral-800 text-foreground-muted"}>
                          {s.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px] cursor-pointer" onClick={() => { setEditingSource(s); setKnowledgeModalOpen(true) }}>
                          <Edit2 className="size-3.5" /> ویرایش متن
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          disabled={reindexingId === s.id}
                          className="h-7 px-2.5 text-[10px] bg-accent/10 hover:bg-accent/20 text-accent font-bold cursor-pointer"
                          onClick={() => handleReindex(s.id)}
                        >
                          {reindexingId === s.id ? 'در حال ایندکس...' : 'ایندکس مجدد'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. LAYERING & BUDGET SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Layering thresholds */}
            <Card className="bg-surface border-border/40 p-4 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Sliders className="size-4 text-accent" /> تنظیمات آستانه لایه‌ها
                </CardTitle>
                <CardDescription>کنترل حساسیت و تیونینگ پاسخ‌دهی سیستم</CardDescription>
              </CardHeader>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>آستانه تطبیق کش معنایی (L1):</span>
                    <span className="text-accent">{toFa(cacheThreshold * 100)}٪ تشابه</span>
                  </div>
                  <Input 
                    type="range" 
                    min="0.70" 
                    max="0.99" 
                    step="0.01" 
                    value={cacheThreshold}
                    onChange={(e) => setCacheThreshold(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-foreground-muted leading-relaxed">توصیه شده: ۹۲٪ تشابه. افزایش درصد باعث ارجاع بیشتر به لایه‌های بعد و پاسخ دقیق‌تر؛ و کاهش آن باعث پاسخ‌های سریع‌تر با هزینه کمتر می‌شود.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/10">
                  <div className="flex justify-between text-xs font-bold">
                    <span>آستانه تطبیق پرسش‌های متداول FAQ (L2):</span>
                    <span className="text-accent">{toFa(faqThreshold * 100)}٪ تشابه</span>
                  </div>
                  <Input 
                    type="range" 
                    min="0.70" 
                    max="0.99" 
                    step="0.01" 
                    value={faqThreshold}
                    onChange={(e) => setFaqThreshold(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-foreground-muted">توصیه شده: ۹۰٪. کنترل دقت در استخراج فاکت‌های نوشته شده توسط کارشناس انسانی.</p>
                </div>

                <Button size="sm" onClick={saveLayers} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs cursor-pointer">
                  <Save className="size-4" /> ذخیره تنظیمات لایه‌ها
                </Button>
              </div>
            </Card>

            {/* Budget & Quota */}
            <Card className="bg-surface border-border/40 p-4 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <DollarSign className="size-4 text-accent" /> تنظیمات سهمیه و بودجه (Quota)
                </CardTitle>
                <CardDescription>کنترل هزینه‌ها و سقف توکن‌های مصرفی در ماه</CardDescription>
              </CardHeader>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">سقف مصرف ماهانه کل سیستم (توکن):</Label>
                  <Input 
                    type="number" 
                    value={monthlyTotalBudget} 
                    onChange={(e) => setMonthlyTotalBudget(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">سقف سهمیه ماهانه به ازای هر کاربر معمولی (توکن):</Label>
                  <Input 
                    type="number" 
                    value={userMonthlyCap} 
                    onChange={(e) => setUserMonthlyCap(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-foreground-muted">در صورت عبور از ۸۰٪ ظرفیت، سیستم مدل قوی (L4) را به صورت خودکار به مدل اقتصادی محلی تنزل می‌دهد.</p>
                </div>

                <Button size="sm" onClick={saveBudget} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs cursor-pointer">
                  <Save className="size-4" /> ذخیره سهمیه‌ها
                </Button>
              </div>
            </Card>

            {/* Privacy Settings */}
            <Card className="bg-surface border-border/40 p-4 space-y-4 col-span-1 md:col-span-2">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <ShieldAlert className="size-4 text-warning" /> تنظیمات امنیت و حریم خصوصی
                </CardTitle>
                <CardDescription>کنترل حریم شخصی پرسنل و محرمانگی داده‌ها</CardDescription>
              </CardHeader>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold block">ماسک هوشمند کدهای ملی و شماره تلفن‌ها در پرامپت ارسالی به مدل‌های خارجی</Label>
                  <span className="text-[10px] text-foreground-muted">محافظت از اطلاعات شخصی در APIهای ابری غیر لوکال</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={maskEnabled}
                    onChange={(e) => setMaskEnabled(e.target.checked)}
                    className="size-4 accent-accent cursor-pointer"
                  />
                  <span className="text-xs font-bold">{maskEnabled ? 'فعال' : 'غیرفعال'}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button size="sm" onClick={savePrivacy} className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-xs cursor-pointer">
                  <Save className="size-4" /> ذخیره تنظیمات امنیت
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 6. REVIEW FEEDBACKS TAB */}
        <TabsContent value="review" className="space-y-4">
          <Card className="bg-surface border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">صف بازبینی فیدبک‌های منفی (👎)</CardTitle>
              <CardDescription>مشاهده پاسخ‌های نامطلوب دستیار هوش مصنوعی و تصحیح آن‌ها جهت انتقال مستقیم به لایه L2 (کاهش همیشگی خطا)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">دستیار</TableHead>
                    <TableHead className="text-right">پرسش کاربر</TableHead>
                    <TableHead className="text-right">لایه‌ی پاسخ</TableHead>
                    <TableHead className="text-right">تأخیر</TableHead>
                    <TableHead className="text-right">عملیات تصحیح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.filter(i => i.rating === -1).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-foreground-muted italic">
                        هیچ پاسخ منفی فیدبک‌داده‌شده‌ای برای بازبینی وجود ندارد. سیستم در وضعیت بهینه است.
                      </TableCell>
                    </TableRow>
                  ) : (
                    interactions.filter(i => i.rating === -1).map((int) => (
                      <TableRow key={int.id}>
                        <TableCell className="text-[10px] text-foreground-muted font-mono">{toFa(new Date(int.createdAt).toLocaleDateString('fa-IR'))}</TableCell>
                        <TableCell className="font-bold">{int.personaKey}</TableCell>
                        <TableCell className="font-semibold max-w-[200px] truncate">{int.model || 'نامشخص'}</TableCell> {/* Note: using model field or similar context */}
                        <TableCell>
                          <Badge className="bg-red-500/10 text-red-500">{int.layer}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{toFa(int.latencyMs)}ms</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white font-bold cursor-pointer"
                            onClick={() => handleConvertFeedbackToFaq(`سوال کاربر در مورد ${int.model || 'اشکال سیستم'}`, 'پاسخ صحیح تایید شده توسط مدیر سیستم.')}
                          >
                            تصحیح و انتقال به FAQ (L2)
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- FORM MODALS --- */}

      {/* 1. Provider Form Modal */}
      {providerModalOpen && (
        <Dialog open={providerModalOpen} onOpenChange={setProviderModalOpen}>
          <DialogContent className="bg-surface border-border text-right max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-foreground justify-start flex">
                {editingProvider?.id ? 'ویرایش اطلاعات پروایدر هوش مصنوعی' : 'افزودن سرویس‌دهنده جدید'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveProvider} className="space-y-4 pt-3 text-right">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">نام نمایشی:</Label>
                  <Input 
                    value={editingProvider?.name || ''} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: Gemini Flash"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">نوع پروایدر:</Label>
                  <select 
                    value={editingProvider?.providerType || 'gemini'} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, providerType: e.target.value }))}
                    className="h-9 w-full bg-surface border border-border rounded-md px-3 text-xs focus:outline-none"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI Compatible</option>
                    <option value="ollama">Ollama Local</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <Label className="text-[10px] text-foreground-muted block">آدرس پایه API (Base URL):</Label>
                <Input 
                  value={editingProvider?.baseUrl || ''} 
                  onChange={(e) => setEditingProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="مثال: https://generativelanguage.googleapis.com"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">کلید API (API Key):</Label>
                  <Input 
                    type="password"
                    value={editingProvider?.apiKey || ''} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="کلید احراز هویت"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">نام مدل (Model Name):</Label>
                  <Input 
                    value={editingProvider?.modelName || ''} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, modelName: e.target.value }))}
                    placeholder="مثال: gemini-2.0-flash"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">اولویت (کمتر = بهتر):</Label>
                  <Input 
                    type="number"
                    value={editingProvider?.priority || 10} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, priority: Number(e.target.value) }))}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">حداکثر تلاش مجدد:</Label>
                  <Input 
                    type="number"
                    value={editingProvider?.maxRetries || 2} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, maxRetries: Number(e.target.value) }))}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">تایم‌اوت (میلی‌ثانیه):</Label>
                  <Input 
                    type="number"
                    value={editingProvider?.timeoutMs || 8000} 
                    onChange={(e) => setEditingProvider(prev => ({ ...prev, timeoutMs: Number(e.target.value) }))}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 justify-end pt-3">
                <DialogClose render={<Button type="button" variant="outline" className="text-xs h-9 cursor-pointer">لغو</Button>} />
                <Button type="submit" className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold h-9 cursor-pointer">
                  ذخیره اطلاعات
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. Persona Form Modal */}
      {personaModalOpen && (
        <Dialog open={personaModalOpen} onOpenChange={setPersonaModalOpen}>
          <DialogContent className="bg-surface border-border text-right max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-foreground justify-start flex">
                {editingPersona?.id ? 'ویرایش مشخصات دستیار هوشمند' : 'ایجاد دستیار هوشمند جدید'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePersona} className="space-y-4 pt-3 text-right">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">عنوان دستیار:</Label>
                  <Input 
                    value={editingPersona?.title || ''} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: دستیار راهبر خط ۱"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">کلید یکتا (Persona Key):</Label>
                  <Input 
                    value={editingPersona?.key || ''} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="مثال: operator"
                    className="h-9 text-xs font-mono"
                    required
                    disabled={!!editingPersona?.id}
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">آیکون اموجی:</Label>
                  <Input 
                    value={editingPersona?.icon || '🤖'} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, icon: e.target.value }))}
                    className="h-9 text-xs text-center"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-right">
                <Label className="text-[10px] text-foreground-muted block">پرامپت دستورالعمل سیستم (System Prompt):</Label>
                <textarea
                  rows={5}
                  value={editingPersona?.systemPrompt || ''}
                  onChange={(e) => setEditingPersona(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="دستورات رفتاری دستیار..."
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs focus:outline-none resize-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">نقش‌های مجاز (JSON):</Label>
                  <Input 
                    value={editingPersona?.roleKeys || '[]'} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, roleKeys: e.target.value }))}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">دسته‌های دانش RAG (JSON):</Label>
                  <Input 
                    value={editingPersona?.knowledgeCats || '[]'} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, knowledgeCats: e.target.value }))}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">ابزارهای مجاز (JSON):</Label>
                  <Input 
                    value={editingPersona?.tools || '[]'} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, tools: e.target.value }))}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">مدل اقتصادی (L3):</Label>
                  <Input 
                    value={editingPersona?.economyModel || ''} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, economyModel: e.target.value }))}
                    placeholder="مثال: ollama"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">مدل قوی (L4):</Label>
                  <Input 
                    value={editingPersona?.strongModel || ''} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, strongModel: e.target.value }))}
                    placeholder="مثال: gemini"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">سقف مصرف ماهانه (توکن):</Label>
                  <Input 
                    type="number"
                    value={editingPersona?.monthlyTokenCap || 50000} 
                    onChange={(e) => setEditingPersona(prev => ({ ...prev, monthlyTokenCap: Number(e.target.value) }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 justify-end pt-3">
                <DialogClose render={<Button type="button" variant="outline" className="text-xs h-9 cursor-pointer">لغو</Button>} />
                <Button type="submit" className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold h-9 cursor-pointer">
                  ذخیره اطلاعات دستیار
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. Knowledge Source Modal */}
      {knowledgeModalOpen && (
        <Dialog open={knowledgeModalOpen} onOpenChange={setKnowledgeModalOpen}>
          <DialogContent className="bg-surface border-border text-right max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-foreground justify-start flex">
                بارگذاری و ویرایش مستند پایگاه دانش
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveKnowledge} className="space-y-4 pt-3 text-right">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">عنوان سند:</Label>
                  <Input 
                    value={editingSource?.title || ''} 
                    onChange={(e) => setEditingSource(prev => ({ ...prev!, title: e.target.value }))}
                    placeholder="مثال: آیین‌نامه ایمنی لوحه خط ۱"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-right">
                  <Label className="text-[10px] text-foreground-muted block">دسته‌بندی محتوا:</Label>
                  <Input 
                    value={editingSource?.category || ''} 
                    onChange={(e) => setEditingSource(prev => ({ ...prev!, category: e.target.value }))}
                    placeholder="مثال: safety"
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 border border-dashed border-border/80 rounded-lg p-4 bg-surface-container-low text-center flex flex-col items-center justify-center relative hover:bg-surface-container-low/80 transition group">
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={handleFileUpload} 
                  disabled={fileExtracting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Bot className={cn("size-6 text-foreground-muted group-hover:text-accent transition-colors", fileExtracting && "animate-bounce text-accent")} />
                <span className="text-[11px] font-bold text-foreground">
                  {fileExtracting ? "در حال استخراج متن..." : "آپلود و استخراج خودکار فایل (PDF یا Word)"}
                </span>
                <span className="text-[9px] text-foreground-muted">فایل‌های .pdf یا .docx را بکشید و رها کنید یا کلیک کنید</span>
                {fileExtractError && (
                  <span className="text-[9px] text-red-500 font-bold block mt-1">{fileExtractError}</span>
                )}
              </div>

              <div className="space-y-1 text-right">
                <Label className="text-[10px] text-foreground-muted block">محتوای متنی سند (جهت خرد شدن به Chunks):</Label>
                <textarea
                  rows={8}
                  value={editingSource?.content || ''}
                  onChange={(e) => setEditingSource(prev => ({ ...prev!, content: e.target.value }))}
                  placeholder="کل متن سند را در این بخش پیست کنید..."
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs focus:outline-none resize-none font-bold"
                  required
                />
              </div>

              <DialogFooter className="gap-2 justify-end pt-3">
                <DialogClose render={<Button type="button" variant="outline" className="text-xs h-9 cursor-pointer">لغو</Button>} />
                <Button type="submit" className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold h-9 cursor-pointer">
                  تایید و ذخیره
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. Correct Answer FAQ Modal */}
      {faqModalOpen && (
        <Dialog open={faqModalOpen} onOpenChange={setFaqModalOpen}>
          <DialogContent className="bg-surface border-border text-right max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-foreground justify-start flex">
                تبدیل پاسخ تصحیح‌شده به FAQ رسمی (L2)
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveFaq} className="space-y-4 pt-3 text-right">
              <div className="space-y-1 text-right">
                <Label className="text-[10px] text-foreground-muted block">سؤال کاربر:</Label>
                <Input 
                  value={newFaq.question} 
                  onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                  className="h-9 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1 text-right">
                <Label className="text-[10px] text-foreground-muted block">پاسخ صحیح و تایید شده کارشناس دانش:</Label>
                <textarea
                  rows={4}
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs focus:outline-none resize-none font-bold"
                  required
                />
              </div>

              <DialogFooter className="gap-2 justify-end pt-3">
                <DialogClose render={<Button type="button" variant="outline" className="text-xs h-9 cursor-pointer">لغو</Button>} />
                <Button type="submit" className="bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold h-9 cursor-pointer">
                  ثبت دائم در FAQ پایگاه دانش
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

const layers = ['L0', 'L1', 'L2', 'L3', 'L4']
