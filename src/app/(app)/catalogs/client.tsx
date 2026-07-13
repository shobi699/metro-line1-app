'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MermaidGraph } from '@/components/shared/mermaid-graph'
import { TechnicalCatalog } from '@/generated/prisma/client'
import {
  Bot,
  GitMerge,
  Plus,
  Save,
  Search,
  Settings2,
  Cpu,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronLeft,
  Upload,
  FileText,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'

export default function CatalogClient({ initialCatalogs }: { initialCatalogs: TechnicalCatalog[] }) {
  const [catalogs, setCatalogs] = useState<TechnicalCatalog[]>(initialCatalogs)
  const [activeId, setActiveId] = useState<string | null>(initialCatalogs.length > 0 ? initialCatalogs[0].id : null)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const { user, accessToken } = useAuthStore()

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const activeCatalog = catalogs.find(c => c.id === activeId)

  // Group catalogs by category
  const categories = Array.from(new Set(catalogs.map(c => c.category)))

  // AI Modal State
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedGraph, setGeneratedGraph] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('سفارشی')
  const [isSaving, setIsSaving] = useState(false)

  // AI Document Agent State
  const [agentTab, setAgentTab] = useState<'upload' | 'text'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [agentText, setAgentText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState('')

  const handleAnalyzeDocument = async () => {
    if (agentTab === 'upload' && !selectedFile) {
      toast.error('لطفاً ابتدا فایلی را انتخاب کنید')
      return
    }
    if (agentTab === 'text' && !agentText.trim()) {
      toast.error('لطفاً متن مورد نظر را بنویسید')
      return
    }

    setIsAnalyzing(true)
    setAnalysisStage('در حال خواندن و استخراج محتوای سند...')

    try {
      const formData = new FormData()
      if (agentTab === 'upload' && selectedFile) {
        formData.append('file', selectedFile)
      } else {
        formData.append('text', agentText)
      }

      setAnalysisStage('در حال تحلیل فنی با هوش مصنوعی خط ۱...')
      const res = await fetch('/api/ai/catalogs/analyze-doc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      setAnalysisStage('در حال دریافت و پردازش نمودارها...')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در تحلیل سند')
      }

      if (data.catalogs && data.catalogs.length > 0) {
        setCatalogs(prev => [...prev, ...data.catalogs])
        setActiveId(data.catalogs[0].id)
        toast.success(`${data.catalogs.length} کاتالوگ جدید با موفقیت ایجاد و ثبت شد`)
        setIsAiModalOpen(false)
        setSelectedFile(null)
        setAgentText('')
      } else {
        toast.info('هیچ کاتالوگ یا دستورالعملی در این سند یافت نشد.')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStage('')
    }
  }

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    setGeneratedGraph(null)

    try {
      console.log('Sending request to /api/ai/catalogs/generate with prompt length:', aiPrompt.length)
      const res = await fetch('/api/ai/catalogs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to generate graph, API returned:', res.status, errorData)
        throw new Error('Failed to generate graph')
      }

      const data = await res.json()
      console.log('Successfully generated graph. Mermaid length:', data.mermaid?.length)
      setGeneratedGraph(data.mermaid)
    } catch (err) {
      console.error('Error generating graph:', err)
      toast.error('خطا در ارتباط با هوش مصنوعی')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedGraph || !newTitle.trim()) {
      toast.error('عنوان و گراف نمی‌تواند خالی باشد')
      return
    }

    setIsSaving(true)
    try {
      console.log('Saving catalog to /api/catalogs')
      const res = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: generatedGraph
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to save catalog, API returned:', res.status, errorData)
        throw new Error('Failed to save')
      }
      const savedCatalog = await res.json()

      setCatalogs([...catalogs, savedCatalog])
      setActiveId(savedCatalog.id)
      setIsAiModalOpen(false)
      toast.success('کاتالوگ جدید با موفقیت ذخیره شد')

      // Reset state
      setGeneratedGraph(null)
      setAiPrompt('')
      setNewTitle('')
    } catch (err) {
      console.error('Error saving catalog:', err)
      toast.error('خطا در ذخیره‌سازی کاتالوگ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0 border-e border-border/40 flex flex-col bg-surface-container-lowest">
        <div className="p-4 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              کاتالوگ فنی
            </h2>
            {(user?.roleKey === 'super_admin' || user?.roleKey === 'admin') && (
              <Button size="icon" variant="ghost" onClick={() => setIsAiModalOpen(true)}>
                <Plus className="w-5 h-5 text-primary" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-3 pr-9 h-9 bg-surface-container-low border-border/50 text-sm"
              placeholder="جستجوی کاتالوگ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map(category => {
            const catItems = catalogs.filter(c => c.category === category && c.title.includes(searchQuery))
            if (catItems.length === 0) return null

            const isCollapsed = collapsedCategories[category] === true

            return (
              <div key={category} className="space-y-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors duration-200"
                >
                  <span>{category}</span>
                  {isCollapsed ? (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {catItems.map(catalog => (
                      <button
                        key={catalog.id}
                        onClick={() => setActiveId(catalog.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-all duration-200",
                          activeId === catalog.id
                            ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm"
                            : "hover:bg-surface-container text-foreground/80 hover:text-foreground"
                        )}
                      >
                        <GitMerge className={cn("w-4 h-4 shrink-0", activeId === catalog.id ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm truncate">{catalog.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-[#0a0a0c]">
        {activeCatalog ? (
          <>
            <div className="h-14 border-b border-white/10 flex items-center px-6 bg-black/20 backdrop-blur-md z-10 shrink-0">
              <div className="flex flex-col">
                <h1 className="font-bold text-white/90">{activeCatalog.title}</h1>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">REF: L1-BKS-{activeCatalog.id.substring(0, 6).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative p-6 flex justify-center items-center">
              {/* Premium Glow Effect Wrapper */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

              <Card className="w-full max-w-5xl max-h-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5 relative">
                {/* Accent line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

                <CardContent className="p-0 overflow-auto max-h-[calc(100vh-12rem)] relative custom-scrollbar">
                  <MermaidGraph chart={activeCatalog.content} title={activeCatalog.title} className="p-8 min-h-[400px]" />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground space-y-4">
            <Cpu className="w-16 h-16 opacity-20" />
            <p>کاتالوگی انتخاب نشده است</p>
          </div>
        )}
      </div>

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl shadow-2xl border-primary/20 bg-surface-container flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/40 bg-gradient-to-r from-surface-container-low to-surface-container shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base">دستیار هوشمند کاتالوگ</h3>
                  <p className="text-xs text-muted-foreground">ساخت خودکار کاتالوگ فنی با هوش مصنوعی خط ۱</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => {
                setIsAiModalOpen(false)
                setGeneratedGraph(null)
                setAiPrompt('')
                setSelectedFile(null)
                setAgentText('')
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-border/40 bg-surface-container-low/50 shrink-0">
              <button
                onClick={() => { setGeneratedGraph(null); setAiPrompt('') }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-200 border-b-2",
                  !generatedGraph && agentTab === 'upload' || !generatedGraph && agentTab === 'text'
                    ? "hidden"
                    : "hidden"
                )}
              />
              {/* Tab: Document Agent */}
              <button
                onClick={() => { setGeneratedGraph(null) }}
                data-active={!generatedGraph || generatedGraph === null}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 border-b-2",
                  !generatedGraph
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="w-4 h-4" />
                ایجنت تحلیل سند
              </button>
              {/* Tab: Manual Prompt */}
              <button
                onClick={() => { }}
                data-active={!!generatedGraph}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 border-b-2",
                  generatedGraph
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Settings2 className="w-4 h-4" />
                ساخت دستی
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* ====== Document Agent Panel ====== */}
              {!generatedGraph && (
                <div className="p-6 space-y-5">
                  {/* Sub-tabs: File Upload / Raw Text */}
                  <div className="flex rounded-lg overflow-hidden border border-border/40 bg-background/30">
                    <button
                      onClick={() => setAgentTab('upload')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-all duration-200",
                        agentTab === 'upload'
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Upload className="w-4 h-4" />
                      بارگذاری فایل
                    </button>
                    <button
                      onClick={() => setAgentTab('text')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-all duration-200",
                        agentTab === 'text'
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      متن دستی
                    </button>
                  </div>

                  {/* File Drop Zone */}
                  {agentTab === 'upload' && (
                    <label
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 w-full min-h-[180px] rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group",
                        selectedFile
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      />
                      {selectedFile ? (
                        <>
                          <div className="p-3 rounded-full bg-primary/10">
                            <CheckCircle2 className="w-7 h-7 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground/90 text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'فایل متنی'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setSelectedFile(null) }}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> حذف فایل
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-full bg-surface-container-low group-hover:bg-primary/10 transition-colors">
                            <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-foreground/80 font-medium">فایل را اینجا رها کنید یا کلیک کنید</p>
                            <p className="text-xs text-muted-foreground mt-1">پشتیبانی از PDF، Word (.docx)، و متن ساده (.txt)</p>
                          </div>
                        </>
                      )}
                    </label>
                  )}

                  {/* Raw Text Input */}
                  {agentTab === 'text' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/80">متن مستند یا دستورالعمل فنی</label>
                      <textarea
                        className="w-full min-h-[180px] p-4 rounded-xl bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed placeholder:text-muted-foreground/50"
                        placeholder="متن دستورالعمل عیب‌یابی، روند عملیاتی یا محتوای فنی را اینجا وارد کنید...&#10;&#10;مثال: در صورت بروز خطا در سیستم ترمز، ابتدا فشار اتاق ترمز را بررسی کنید. اگر فشار کافی بود مرحله B را انجام دهید..."
                        value={agentText}
                        onChange={(e) => setAgentText(e.target.value)}
                        dir="rtl"
                      />
                      <p className="text-xs text-muted-foreground text-end">{agentText.length.toLocaleString('fa-IR')} کاراکتر</p>
                    </div>
                  )}

                  {/* Analysis Progress */}
                  {isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in">
                      <div className="relative shrink-0">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{analysisStage}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">لطفاً صبر کنید، این عملیات ممکن است چند ثانیه طول بکشد</p>
                      </div>
                    </div>
                  )}

                  {/* Info Banner */}
                  {!isAnalyzing && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low/60 border border-border/30 text-xs text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                      <span>
                        ایجنت هوشمند متن سند را تحلیل می‌کند، گام‌های عیب‌یابی را استخراج می‌کند و به‌صورت خودکار یک یا چند کاتالوگ فنی به همراه نمودار فلوچارت ایجاد می‌کند.
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full gap-2 h-11 text-sm font-semibold"
                    onClick={handleAnalyzeDocument}
                    disabled={isAnalyzing || (agentTab === 'upload' ? !selectedFile : !agentText.trim())}
                  >
                    {isAnalyzing
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال تحلیل...</>
                      : <><Sparkles className="w-4 h-4" /> تحلیل و ساخت کاتالوگ</>
                    }
                  </Button>
                </div>
              )}

              {/* ====== Manual Graph Panel ====== */}
              {generatedGraph && (
                <div className="p-6 space-y-6">
                  <div className="p-4 border border-primary/20 rounded-xl bg-black/40 overflow-auto max-h-[280px]">
                    <MermaidGraph chart={generatedGraph} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">عنوان کاتالوگ</label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="مثال: مدار ترمز واگن"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">دسته‌بندی</label>
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="مثال: پنوماتیک"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-border/40">
                    <Button variant="outline" onClick={() => setGeneratedGraph(null)}>
                      بازنویسی پرامپت
                    </Button>
                    <Button className="gap-2" onClick={handleSave} disabled={isSaving || !newTitle.trim()}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      ذخیره کاتالوگ
                    </Button>
                  </div>
                </div>
              )}

              {/* ====== Manual Prompt Input (below agent tabs, when no graph yet) ====== */}
              {!generatedGraph && (
                <div className="px-6 pb-6 border-t border-border/20 pt-5 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">یا ساخت دستی از توضیح متنی</p>
                  <div className="space-y-2">
                    <textarea
                      className="w-full min-h-[100px] p-3 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                      placeholder="شرح فرآیند یا سیستم را بنویسید تا یک گراف تولید شود..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    تولید گراف از توضیح
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
