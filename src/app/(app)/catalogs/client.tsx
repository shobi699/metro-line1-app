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
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth'

export default function CatalogClient({ initialCatalogs }: { initialCatalogs: TechnicalCatalog[] }) {
  const [catalogs, setCatalogs] = useState<TechnicalCatalog[]>(initialCatalogs)
  const [activeId, setActiveId] = useState<string | null>(initialCatalogs.length > 0 ? initialCatalogs[0].id : null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const { user, accessToken } = useAuthStore()

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

            return (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ps-2">
                  {category}
                </h3>
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
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">REF: L1-BKS-{activeCatalog.id.substring(0,6).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative p-6 flex justify-center items-center">
              {/* Premium Glow Effect Wrapper */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              <Card className="w-full max-w-5xl max-h-full border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5 relative">
                {/* Accent line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
                
                <CardContent className="p-0 overflow-auto max-h-[calc(100vh-12rem)] relative custom-scrollbar">
                   <MermaidGraph chart={activeCatalog.content} className="p-8 min-h-[400px]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-3xl shadow-2xl border-primary/20 bg-surface-container flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-surface-container-low shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                تولید کاتالوگ با هوش مصنوعی
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAiModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!generatedGraph ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">شرح فرآیند یا سیستم</label>
                    <textarea 
                      className="w-full min-h-[150px] p-3 rounded-md bg-background border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="مثال: روند عیب یابی شامل بررسی سنسور A است. اگر سنسور فعال بود، بررسی شیر B انجام می‌شود وگرنه بررسی رله C..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                    تولید گراف
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 border border-primary/20 rounded-lg bg-black/40 overflow-auto max-h-[300px]">
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
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
