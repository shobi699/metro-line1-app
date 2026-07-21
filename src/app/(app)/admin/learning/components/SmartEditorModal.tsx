'use client'

import { useState, useEffect } from 'react'
import { 
  Sparkles, X, Layers, AlertCircle, FileText, Upload, Plus, Trash2, ArrowUp, ArrowDown, Eye, Save, Video, Table, Loader2, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { toFa } from '@/lib/fa'
import { uploadFileWithProgress } from '@/lib/upload'
import { useAuthStore } from '@/features/auth'

interface SmartEditorModalProps {
  isOpen: boolean
  onClose: () => void
  lessonTitle: string
  lessonKind: string
  contentRef: string
  onSave: (contentString: string) => void
}

export function SmartEditorModal({ isOpen, onClose, lessonTitle, lessonKind, contentRef, onSave }: SmartEditorModalProps) {
  const [blocks, setBlocks] = useState<any[]>([])
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [previewMode, setPreviewMode] = useState<'edit' | 'split' | 'preview'>('split')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  
  // AI Import simulation
  const [isAiImporting, setIsAiImporting] = useState(false)
  const [aiImportProgress, setAiImportProgress] = useState(0)
  const [aiImportStep, setAiImportStep] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (lessonKind === 'quiz') {
      let initialQuestions = []
      try {
        const trimmed = (contentRef || '').trim()
        if (trimmed.startsWith('[')) {
          initialQuestions = JSON.parse(trimmed)
        }
      } catch (e) {
        console.error(e)
      }
      setQuizQuestions(Array.isArray(initialQuestions) ? initialQuestions : [])
    } else {
      let initialBlocks = []
      try {
        const trimmed = (contentRef || '').trim()
        if (trimmed.startsWith('[')) {
          initialBlocks = JSON.parse(trimmed)
        } else if (trimmed) {
          initialBlocks = [{ type: 'paragraph', paragraphText: trimmed }]
        }
      } catch {
        initialBlocks = [{ type: 'paragraph', paragraphText: contentRef || '' }]
      }
      setBlocks(initialBlocks)
    }
  }, [isOpen, contentRef, lessonKind])

  if (!isOpen) return null

  const handleAddBlock = (type: string) => {
    const newBlock: any = { type }
    if (type === 'heading') {
      newBlock.headingLevel = 'h2'
      newBlock.headingText = 'عنوان جدید'
    } else if (type === 'paragraph') {
      newBlock.paragraphText = 'متن پاراگراف...'
    } else if (type === 'table') {
      newBlock.tableRows = 3
      newBlock.tableCols = 3
      newBlock.tableData = [
        ['سرستون ۱', 'سرستون ۲', 'سرستون ۳'],
        ['', '', ''],
        ['', '', '']
      ]
    } else if (type === 'alert') {
      newBlock.alertType = 'warning'
      newBlock.alertTitle = 'توجه مهم'
      newBlock.alertText = 'محتوای هشدار...'
    } else if (type === 'chart') {
      newBlock.chartTitle = 'نمودار آماری جدید'
      newBlock.chartType = 'vertical'
      newBlock.chartPoints = [
        { label: 'دی', value: 10 },
        { label: 'بهمن', value: 25 },
        { label: 'اسفند', value: 40 }
      ]
    } else if (type === 'diagram') {
      newBlock.diagramSteps = ['مرحله اول', 'مرحله دوم', 'مرحله سوم']
    } else if (type === 'media') {
      newBlock.mediaType = 'video'
      newBlock.mediaUrl = ''
    } else if (type === 'image') {
      newBlock.imageUrl = ''
      newBlock.imageCaption = 'توضیح تصویر'
    } else if (type === 'html') {
      newBlock.htmlContent = '<div class="p-2 border rounded">کد HTML سفارشی</div>'
    } else if (type === 'quiz') {
      newBlock.quizQuestions = [
        {
          id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7),
          type: 'multiple',
          text: 'سوال تستی جدید؟',
          options: [
            { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۱', isCorrect: true },
            { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۲', isCorrect: false }
          ]
        }
      ]
    }
    setBlocks([...blocks, newBlock])
  }

  const handleUpdateBlock = (idx: number, fields: any) => {
    const updated = [...blocks]
    updated[idx] = { ...updated[idx], ...fields }
    setBlocks(updated)
  }

  const handleMoveBlock = (idx: number, dir: 'up' | 'down') => {
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= blocks.length) return
    const updated = [...blocks]
    const temp = updated[idx]
    updated[idx] = updated[nextIdx]
    updated[nextIdx] = temp
    setBlocks(updated)
  }

  const handleDeleteBlock = (idx: number) => {
    setBlocks(blocks.filter((_, i) => i !== idx))
  }

  const handleFileUpload = async (idx: number, file: File, field: 'mediaUrl' | 'imageUrl') => {
    setUploadingIdx(idx)
    setUploadProgress(0)
    try {
      const url = await uploadFileWithProgress({
        file,
        token: useAuthStore.getState().accessToken || undefined,
        onProgress: (p) => setUploadProgress(p)
      })
      handleUpdateBlock(idx, { [field]: url })
      toast.success('فایل با موفقیت آپلود شد')
    } catch (err: any) {
      toast.error(err.message || 'خطا در آپلود فایل')
    } finally {
      setUploadingIdx(null)
    }
  }

  const handleSaveVisualContent = () => {
    if (lessonKind === 'quiz') {
      onSave(JSON.stringify(quizQuestions))
    } else {
      onSave(JSON.stringify(blocks))
    }
  }

  const handleAddQuizQuestion = (type: 'multiple' | 'essay') => {
    const newQuestion = {
      id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7),
      type,
      text: type === 'multiple' ? 'متن سوال چندگزینه‌ای ریلی جدید؟' : 'متن سوال تشریحی ریلی جدید؟',
      options: type === 'multiple' ? [
        { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۱', isCorrect: true },
        { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۲', isCorrect: false }
      ] : []
    }
    setQuizQuestions([...quizQuestions, newQuestion])
  }

  const handleUpdateQuizQuestion = (qIdx: number, fields: any) => {
    const updated = [...quizQuestions]
    updated[qIdx] = { ...updated[qIdx], ...fields }
    setQuizQuestions(updated)
  }

  const handleUpdateQuizOption = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...quizQuestions]
    updated[qIdx].options[optIdx].text = text
    setQuizQuestions(updated)
  }

  const handleSetQuizCorrectOption = (qIdx: number, optId: string) => {
    const updated = [...quizQuestions]
    updated[qIdx].options = updated[qIdx].options.map((opt: any) => ({
      ...opt,
      isCorrect: opt.id === optId
    }))
    setQuizQuestions(updated)
  }

  const handleAddQuizOption = (qIdx: number) => {
    const updated = [...quizQuestions]
    updated[qIdx].options = [
      ...(updated[qIdx].options || []),
      { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: `گزینه جدید`, isCorrect: false }
    ]
    setQuizQuestions(updated)
  }

  const handleDeleteQuizOption = (qIdx: number, optIdx: number) => {
    const updated = [...quizQuestions]
    updated[qIdx].options = updated[qIdx].options.filter((_: any, idx: number) => idx !== optIdx)
    setQuizQuestions(updated)
  }

  const handleMoveQuizQuestion = (qIdx: number, dir: 'up' | 'down') => {
    const nextIdx = dir === 'up' ? qIdx - 1 : qIdx + 1
    if (nextIdx < 0 || nextIdx >= quizQuestions.length) return
    const updated = [...quizQuestions]
    const temp = updated[qIdx]
    updated[qIdx] = updated[nextIdx]
    updated[nextIdx] = temp
    setQuizQuestions(updated)
  }

  const handleDeleteQuizQuestion = (qIdx: number) => {
    setQuizQuestions(quizQuestions.filter((_, idx) => idx !== qIdx))
  }

  const handleAiImport = () => {
    setIsAiImporting(true)
    setAiImportProgress(0)
    setAiImportStep('در حال خواندن ساختار فایل...')
    
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setAiImportProgress(progress)
      
      if (progress === 30) {
        setAiImportStep('تحلیل متون و استخراج کلمات کلیدی خط ۱...')
      } else if (progress === 60) {
        setAiImportStep('شناسایی و بخش‌بندی جدول‌ها و محدودیت‌ها...')
      } else if (progress === 80) {
        setAiImportStep('ساخت خودکار المان‌های تصویری و توالی...')
      } else if (progress >= 100) {
        clearInterval(interval)
        setIsAiImporting(false)
        
        // Mock premium parsed content
        const parsed = [
          { type: 'heading', headingLevel: 'h1', headingText: 'آیین‌نامه ایمنی و پیشگیری از حوادث ریلی' },
          { type: 'paragraph', paragraphText: 'این مستند شامل مقررات ایمنی راهبری قطارها در بلاک‌های میانی و پایانه‌ها می‌باشد که به منظور جلوگیری از بروز تصادفات ریلی تدوین شده است.' },
          { type: 'alert', alertType: 'warning', alertTitle: 'رعایت احتیاط واجب', alertText: 'در شرایط قرمز هواشناسی و وزش باد شدید، حداکثر سرعت در بلاک‌های روزمینی ۳۰ کیلومتر بر ساعت است.' },
          {
            type: 'table',
            tableRows: 3,
            tableCols: 3,
            tableData: [
              ['شرایط جوی', 'بلاک‌های سرپوشیده', 'بلاک‌های روزمینی'],
              ['عادی', '۸۰ km/h', '۷۰ km/h'],
              ['برفی / طوفان', '۶۰ km/h', '۳۰ km/h']
            ]
          },
          {
            type: 'chart',
            chartTitle: 'آمار حوادث ریلی برحسب عدم رعایت سرعت TSR (سال گذشته)',
            chartType: 'vertical',
            chartPoints: [
              { label: 'سهل‌انگاری راهبر', value: 12 },
              { label: 'عدم تایید پیام OCC', value: 8 },
              { label: 'نقص ترمز دستی', value: 3 }
            ]
          },
          {
            type: 'diagram',
            diagramSteps: ['شنیدن آلارم محدودیت', 'کاهش پله‌ای دور ترمز قطار', 'گزارش رادیویی توقف به OCC']
          }
        ]
        setBlocks(parsed)
        toast.success('سند با موفقیت تحلیل و به المان‌های هوشمند تبدیل شد.')
      }
    }, 200)
  }

  const renderBlockElement = (b: any, idx: number) => {
    if (b.type === 'heading') {
      const Tag = b.headingLevel || 'h2'
      const className = Tag === 'h1' ? 'text-xl font-extrabold text-white mt-4 mb-2' : Tag === 'h2' ? 'text-lg font-bold text-white mt-3 mb-2' : 'text-md font-bold text-white mt-2 mb-1'
      return <Tag key={idx} className={className}>{b.headingText}</Tag>
    }
    if (b.type === 'paragraph') {
      return <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-2 whitespace-pre-line text-right">{b.paragraphText}</p>
    }
    if (b.type === 'table') {
      const rows = b.tableRows || 3
      const cols = b.tableCols || 3
      const data = b.tableData || []
      return (
        <table key={idx} className="w-full border-collapse border border-border/40 text-right text-[10px] my-3">
          <thead>
            <tr className="bg-muted/40 text-white">
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="border border-border/40 p-1.5">{data[0]?.[c] || ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows - 1 }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="border border-border/40 p-1.5">{data[r + 1]?.[c] || ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (b.type === 'alert') {
      const colors = {
        warning: { bg: 'bg-yellow-950/20', border: 'border-yellow-500', text: 'text-yellow-500', icon: '⚠️' },
        danger: { bg: 'bg-red-950/20', border: 'border-red-500', text: 'text-red-500', icon: '🚨' },
        success: { bg: 'bg-emerald-950/20', border: 'border-emerald-500', text: 'text-emerald-500', icon: '✅' },
        info: { bg: 'bg-blue-950/20', border: 'border-blue-500', text: 'text-blue-500', icon: 'ℹ️' }
      }
      const style = colors[b.alertType as 'warning' | 'danger' | 'success' | 'info'] || colors.warning
      return (
        <div key={idx} className={`p-3 ${style.bg} border-r-4 ${style.border} rounded my-2 text-[10px] leading-relaxed text-right`}>
          <strong className={`${style.text} block mb-0.5`}>{style.icon} {b.alertTitle}:</strong>
          {b.alertText}
        </div>
      )
    }
    if (b.type === 'chart') {
      const pts = b.chartPoints || []
      const maxVal = Math.max(...pts.map((p: any) => Number(p.value) || 1), 1)
      const width = 300
      const height = 120
      return (
        <div key={idx} className="my-3 bg-muted/10 border border-border/30 rounded p-3 flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground mb-1.5">{b.chartTitle}</span>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[240px] h-auto">
            {b.chartType === 'vertical' ? (
              (() => {
                const colWidth = Math.max(Math.floor((width - 40) / Math.max(pts.length, 1)), 10)
                return pts.map((p: any, pIdx: number) => {
                  const val = Number(p.value) || 0
                  const barHeight = Math.floor((val / maxVal) * 80)
                  const x = 30 + pIdx * colWidth
                  const y = 90 - barHeight
                  return (
                    <g key={pIdx}>
                      <rect x={x} y={y} width={Math.max(colWidth - 8, 4)} height={barHeight} fill="#ef4444" rx="1.5" />
                      <text x={x + Math.max(colWidth - 8, 4)/2} y="105" fontSize="7" fill="#888" textAnchor="middle">{p.label}</text>
                      <text x={x + Math.max(colWidth - 8, 4)/2} y={y - 4} fontSize="6" fill="#fff" textAnchor="middle">{val}</text>
                    </g>
                  )
                })
              })()
            ) : (
              (() => {
                const rowHeight = Math.max(Math.floor((height - 20) / Math.max(pts.length, 1)), 10)
                return pts.map((p: any, pIdx: number) => {
                  const val = Number(p.value) || 0
                  const barWidth = Math.floor((val / maxVal) * 180)
                  const y = 10 + pIdx * rowHeight
                  return (
                    <g key={pIdx}>
                      <text x="5" y={y + 8} fontSize="7" fill="#888" textAnchor="start">{p.label}</text>
                      <rect x={60} y={y} width={barWidth} height={Math.max(rowHeight - 6, 3)} fill="#ef4444" rx="1.5" />
                      <text x={65 + barWidth} y={y + 8} fontSize="6" fill="#fff" textAnchor="start">{val}</text>
                    </g>
                  )
                })
              })()
            )}
          </svg>
        </div>
      )
    }
    if (b.type === 'diagram') {
      const steps = b.diagramSteps || []
      const height = 60
      const boxWidth = 70
      const boxHeight = 25
      const gap = 15
      const totalWidth = 20 + steps.length * boxWidth + (steps.length - 1) * gap
      return (
        <div key={idx} className="my-3 bg-muted/10 border border-border/30 rounded p-3 flex flex-col items-center overflow-x-auto">
          <span className="text-[10px] text-muted-foreground mb-1">توالی گام‌ها</span>
          <svg viewBox={`0 0 ${totalWidth} ${height}`} className="w-full max-w-[280px] h-auto">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>
            {steps.map((step: string, sIdx: number) => {
              const x = 10 + sIdx * (boxWidth + gap)
              const y = 15
              const isLast = sIdx === steps.length - 1
              const fillColor = isLast ? '#ef4444' : '#1e293b'
              const strokeColor = isLast ? 'none' : '#ef4444'
              return (
                <g key={sIdx}>
                  <rect x={x} y={y} width={boxWidth} height={boxHeight} fill={fillColor} stroke={strokeColor} strokeWidth="0.8" rx="3" />
                  <text x={x + boxWidth/2} y={y + 15} fontSize="6" fill="#fff" textAnchor="middle">{step}</text>
                  {!isLast && (
                    <line x1={x + boxWidth} y1={y + boxHeight/2} x2={x + boxWidth + gap} y2={y + boxHeight/2} stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrow)" />
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )
    }
    if (b.type === 'media') {
      if (!b.mediaUrl) return <p key={idx} className="text-xs text-muted-foreground italic text-center py-2">رسانه‌ای انتخاب نشده است.</p>
      if (b.mediaType === 'video') {
        return (
          <div key={idx} className="my-3 flex justify-center">
            <video controls className="w-full max-w-[240px] rounded shadow bg-black aspect-video" src={b.mediaUrl} />
          </div>
        )
      }
      return (
        <div key={idx} className="flex items-center justify-between p-2 bg-muted/10 border border-border/20 rounded my-2 text-[10px]">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-white block">سند ضمیمه: {b.mediaType === 'pdf' ? 'فایل PDF' : 'Word'}</span>
          </div>
          <a href={b.mediaUrl} target="_blank" rel="noreferrer" className="px-2 py-0.5 bg-primary text-white rounded text-[8px] font-bold">دانلود</a>
        </div>
      )
    }
    if (b.type === 'image') {
      if (!b.imageUrl) return <p key={idx} className="text-xs text-muted-foreground italic text-center py-2">تصویری انتخاب نشده است.</p>
      return (
        <div key={idx} className="my-3 flex flex-col items-center gap-1">
          <img src={b.imageUrl} className="rounded max-w-full h-auto shadow border border-border/20 max-h-[140px] object-cover" />
          {b.imageCaption && <span className="text-[8px] text-muted-foreground">{b.imageCaption}</span>}
        </div>
      )
    }
    if (b.type === 'html') {
      return <div key={idx} className="text-[10px] font-mono my-2 border border-border/10 p-1.5 rounded bg-muted/5 text-right" dangerouslySetInnerHTML={{ __html: b.htmlContent || '' }} />
    }
    if (b.type === 'quiz') {
      const questions = b.quizQuestions || []
      return (
        <div key={idx} className="my-3 bg-muted/20 border border-primary/30 rounded p-2.5 space-y-2 text-right">
          <span className="text-[9px] font-bold text-primary flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>آزمونک خودارزیابی درون‌درسی</span>
          </span>
          {questions.map((q: any, qIdx: number) => (
            <div key={q.id || qIdx} className="space-y-1 text-[8px] border-b border-border/10 pb-1.5 last:border-0 last:pb-0">
              <p className="font-semibold text-white">{toFa(qIdx + 1)}. {q.text}</p>
              {q.type === 'multiple' ? (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {q.options?.map((opt: any) => (
                    <div key={opt.id} className={`p-1 rounded border text-center ${opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold' : 'bg-muted/10 border-border/20 text-muted-foreground'}`}>
                      {opt.text} {opt.isCorrect && '✅'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-1 bg-muted/10 border border-border/10 rounded text-muted-foreground italic mt-0.5">
                  پاسخ تشریحی کوتاه
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/80 rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0 font-fa">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white">ویرایشگر پیشرفته و هوشمند محتوا</h3>
              <p className="text-[10px] text-muted-foreground">ساخت محتوای درس: {lessonTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-lg text-xs gap-1 border border-border/40">
              <button
                type="button"
                onClick={() => setPreviewMode('edit')}
                className={`px-3 py-1 rounded cursor-pointer transition ${previewMode === 'edit' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-white'}`}
              >
                کد/ویرایش
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('split')}
                className={`px-3 py-1 rounded cursor-pointer transition ${previewMode === 'split' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-white'}`}
              >
                نمای دوگانه
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1 rounded cursor-pointer transition ${previewMode === 'preview' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-white'}`}
              >
                پیش‌نمایش
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
          {/* Left Panel: Toolbox */}
          <div className="border-b lg:border-b-0 lg:border-l border-border/40 p-4 bg-muted/5 space-y-4 overflow-y-auto lg:col-span-1 flex flex-col h-full font-fa">
            {lessonKind === 'quiz' ? (
              <div className="space-y-3 shrink-0">
                <h4 className="text-xs font-bold text-white border-b border-border/20 pb-2">سؤالات آزمونک ریلی</h4>
                <button
                  type="button"
                  onClick={() => handleAddQuizQuestion('multiple')}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition shadow-sm border border-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سؤال تستی (چندگزینه‌ای)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuizQuestion('essay')}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold transition shadow-sm border border-blue-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن سؤال تشریحی کوتاه</span>
                </button>
                <div className="p-3 bg-card border border-border/40 rounded text-[10px] text-muted-foreground leading-normal mt-4">
                  <span className="text-white block font-bold mb-1">راهنمای آزمون:</span>
                  هر درس از نوع آزمونک ارزیابی مستقل باید حداقل شامل ۱ سؤال باشد. پس از طراحی سؤالات، دکمه تایید محتوا را در پایین صفحه فشار دهید. حد نصاب قبولی در آزمونک‌ها ۷۰٪ است.
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 shrink-0">
                  <h4 className="text-xs font-bold text-white border-b border-border/20 pb-2">۱. ابزارهای هوش مصنوعی (AI)</h4>
                  <button
                    type="button"
                    disabled={isAiImporting}
                    onClick={handleAiImport}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white rounded text-xs font-bold transition shadow-sm border border-red-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تبدیل فایل و استخراج با AI</span>
                  </button>
                  {isAiImporting && (
                    <div className="p-2.5 bg-muted/40 border border-border/40 rounded space-y-1.5">
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        <span>{aiImportStep}</span>
                        <span className="font-mono">{toFa(aiImportProgress)}٪</span>
                      </div>
                      <div className="w-full bg-muted/70 h-1 rounded overflow-hidden">
                        <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${aiImportProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 shrink-0">
                  <h4 className="text-xs font-bold text-white border-b border-border/20 pb-2 font-fa">۲. افزودن المان‌های جدید</h4>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('heading')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-blue-400" />
                      <span>تیتر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('paragraph')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>پاراگراف</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('table')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Table className="w-3 h-3 text-yellow-400" />
                      <span>جدول</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('alert')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span>هشدار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('chart')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      <span>نمودار</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('diagram')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>دیاگرام</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('media')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Video className="w-3 h-3 text-purple-400" />
                      <span>فایل/ویدئو</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <Upload className="w-3 h-3 text-cyan-400" />
                      <span>تصویر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('html')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span>کد سفارشی HTML</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('quiz')}
                      className="p-1.5 bg-muted/40 hover:bg-primary/20 hover:border-primary/50 border border-border/30 rounded text-center cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-emerald-400" />
                      <span>آزمونک درون‌درسی</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="p-3 bg-card border border-border/40 rounded text-[10px] text-muted-foreground leading-normal shrink-0">
                  <span className="text-white block font-bold mb-1">راهنمای چینش:</span>
                  تغییرات شما در المان‌ها به صورت آنی در پیش‌نمایش قابل مشاهده است. با کلیدهای جابه‌جایی می‌توانید ترتیب آن‌ها را تنظیم کنید.
                </div>
              </>
            )}
          </div>

          {/* Central Panel: Content block editors */}
          <div className={`overflow-y-auto p-4 space-y-4 ${previewMode === 'split' ? 'lg:col-span-2' : previewMode === 'edit' ? 'lg:col-span-3' : 'hidden'}`}>
            {lessonKind === 'quiz' ? (
              quizQuestions.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-xs italic font-fa">
                  هیچ سؤالی برای این آزمونک ریلی طراحی نشده است. برای شروع، دکمه افزودن سؤال را از پنل سمت راست فشار دهید.
                </div>
              ) : (
                quizQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="bg-muted/15 border border-border/30 rounded-lg p-3 space-y-3 relative group font-fa">
                    <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>سؤال {toFa(qIdx + 1)} ({q.type === 'multiple' ? 'تستی چندگزینه‌ای' : 'تشریحی کوتاه'})</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuizQuestion(qIdx, 'up')}
                          disabled={qIdx === 0}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuizQuestion(qIdx, 'down')}
                          disabled={qIdx === quizQuestions.length - 1}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuizQuestion(qIdx)}
                          className="p-1 hover:bg-red-500/10 rounded text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <select
                        value={q.type || 'multiple'}
                        onChange={(e) => {
                          const val = e.target.value as 'multiple' | 'essay'
                          const fields: any = { type: val }
                          if (val === 'multiple' && (!q.options || q.options.length === 0)) {
                            fields.options = [
                              { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۱', isCorrect: true },
                              { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۲', isCorrect: false }
                            ]
                          }
                          handleUpdateQuizQuestion(qIdx, fields)
                        }}
                        className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                      >
                        <option value="multiple">تستی</option>
                        <option value="essay">تشریحی کوتاه</option>
                      </select>
                      <input
                        type="text"
                        value={q.text || ''}
                        onChange={(e) => handleUpdateQuizQuestion(qIdx, { text: e.target.value })}
                        className="col-span-3 p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                        placeholder="متن سوال..."
                      />
                    </div>

                    {q.type === 'multiple' && (
                      <div className="space-y-2 border border-border/10 rounded p-2.5 bg-black/5">
                        <span className="text-[10px] text-muted-foreground block font-bold mb-1">گزینه‌های پاسخ (گزینه صحیح را تیک بزنید):</span>
                        {q.options?.map((opt: any, optIdx: number) => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <input
                              type="radio"
                              name={`quiz-correct-${q.id || qIdx}`}
                              checked={!!opt.isCorrect}
                              onChange={() => handleSetQuizCorrectOption(qIdx, opt.id)}
                              className="accent-primary cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt.text || ''}
                              onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 p-1 bg-muted border border-border/40 rounded text-xs text-white font-fa"
                              placeholder={`گزینه ${toFa(optIdx + 1)}...`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteQuizOption(qIdx, optIdx)}
                              className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddQuizOption(qIdx)}
                          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-transparent cursor-pointer mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن گزینه جدید</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : blocks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground text-xs italic font-fa">
                هیچ المانی ایجاد نشده است. برای شروع، المانی از منوی سمت راست بسازید یا از ابزار هوش مصنوعی استفاده کنید.
              </div>
            ) : (
              blocks.map((block, idx) => (
                <div key={idx} className="bg-muted/15 border border-border/30 rounded-lg p-3 space-y-3 relative group font-fa">
                  {/* Block Header Controls */}
                  <div className="flex items-center justify-between border-b border-border/10 pb-1.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                      {block.type === 'heading' ? 'تیتر' : block.type === 'paragraph' ? 'پاراگراف' : block.type === 'table' ? 'جدول داده' : block.type === 'alert' ? 'باکس هشدار' : block.type === 'chart' ? 'نمودار' : block.type === 'diagram' ? 'دیاگرام توالی' : block.type === 'media' ? 'ضمیمه رسانه‌ای' : block.type === 'image' ? 'تصویر' : 'HTML سفارشی'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(idx)}
                        className="p-1 hover:bg-red-500/10 rounded text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Form inputs depending on block type */}
                  {block.type === 'heading' && (
                    <div className="grid grid-cols-4 gap-2">
                      <select
                        value={block.headingLevel || 'h2'}
                        onChange={(e) => handleUpdateBlock(idx, { headingLevel: e.target.value })}
                        className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                      >
                        <option value="h1">تیتر اصلی H1</option>
                        <option value="h2">تیتر فرعی H2</option>
                        <option value="h3">تیتر کوچک H3</option>
                      </select>
                      <input
                        type="text"
                        value={block.headingText || ''}
                        onChange={(e) => handleUpdateBlock(idx, { headingText: e.target.value })}
                        className="col-span-3 p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                        placeholder="متن تیتر..."
                      />
                    </div>
                  )}

                  {block.type === 'paragraph' && (
                    <textarea
                      value={block.paragraphText || ''}
                      onChange={(e) => handleUpdateBlock(idx, { paragraphText: e.target.value })}
                      className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white focus:outline-none h-20 resize-y"
                      placeholder="متن پاراگراف را در اینجا وارد کنید..."
                    />
                  )}

                  {block.type === 'alert' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={block.alertType || 'warning'}
                          onChange={(e) => handleUpdateBlock(idx, { alertType: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                        >
                          <option value="warning">هشدار (⚠️)</option>
                          <option value="danger">خطر حیاتی (🚨)</option>
                          <option value="success">انطباق مثبت (✅)</option>
                          <option value="info">توضیح عمومی (ℹ️)</option>
                        </select>
                        <input
                          type="text"
                          value={block.alertTitle || ''}
                          onChange={(e) => handleUpdateBlock(idx, { alertTitle: e.target.value })}
                          className="col-span-2 p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                          placeholder="عنوان باکس هشدار..."
                        />
                      </div>
                      <textarea
                        value={block.alertText || ''}
                        onChange={(e) => handleUpdateBlock(idx, { alertText: e.target.value })}
                        className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white focus:outline-none h-16 resize-y"
                        placeholder="شرح پیام هشدار..."
                      />
                    </div>
                  )}

                  {block.type === 'table' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">سطرها:</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={block.tableRows || 3}
                            onChange={(e) => {
                              const r = parseInt(e.target.value) || 1
                              const cols = block.tableCols || 3
                              const oldData = block.tableData || []
                              const newData = Array.from({ length: r }, (_, ri) => 
                                Array.from({ length: cols }, (_, ci) => oldData[ri]?.[ci] || '')
                              )
                              handleUpdateBlock(idx, { tableRows: r, tableData: newData })
                            }}
                            className="w-10 p-1 bg-muted border border-border/40 rounded text-xs text-white text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">ستون‌ها:</span>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={block.tableCols || 3}
                            onChange={(e) => {
                              const c = parseInt(e.target.value) || 1
                              const rows = block.tableRows || 3
                              const oldData = block.tableData || []
                              const newData = Array.from({ length: rows }, (_, ri) => 
                                Array.from({ length: c }, (_, ci) => oldData[ri]?.[ci] || '')
                              )
                              handleUpdateBlock(idx, { tableCols: c, tableData: newData })
                            }}
                            className="w-10 p-1 bg-muted border border-border/40 rounded text-xs text-white text-center"
                          />
                        </div>
                      </div>
                      <div className="overflow-x-auto border border-border/20 rounded p-1 bg-black/10">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${block.tableCols || 3}, minmax(80px, 1fr))` }}>
                          {Array.from({ length: block.tableRows || 3 }).map((_, rIdx) => 
                            Array.from({ length: block.tableCols || 3 }).map((_, cIdx) => (
                              <input
                                key={`${rIdx}-${cIdx}`}
                                type="text"
                                value={block.tableData?.[rIdx]?.[cIdx] || ''}
                                onChange={(e) => {
                                  const updatedData = [...(block.tableData || [])]
                                  if (!updatedData[rIdx]) updatedData[rIdx] = []
                                  updatedData[rIdx][cIdx] = e.target.value
                                  handleUpdateBlock(idx, { tableData: updatedData })
                                }}
                                className={`p-1 bg-muted/65 border border-border/30 rounded text-[10px] text-white text-center ${rIdx === 0 ? 'bg-primary/10 border-primary/20 font-bold' : ''}`}
                                placeholder={rIdx === 0 ? 'عنوان...' : ''}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {block.type === 'chart' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={block.chartTitle || ''}
                          onChange={(e) => handleUpdateBlock(idx, { chartTitle: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                          placeholder="عنوان نمودار..."
                        />
                        <select
                          value={block.chartType || 'vertical'}
                          onChange={(e) => handleUpdateBlock(idx, { chartType: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                        >
                          <option value="vertical">نمودار ستونی عمودی</option>
                          <option value="horizontal">نمودار نواری افقی</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 border border-border/20 rounded p-2.5">
                        <span className="text-[10px] text-muted-foreground block font-bold mb-1">نقاط داده (آیتم‌ها):</span>
                        {block.chartPoints?.map((pt: any, ptIdx: number) => (
                          <div key={ptIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={pt.label || ''}
                              onChange={(e) => {
                                const updatedPts = [...block.chartPoints]
                                updatedPts[ptIdx].label = e.target.value
                                handleUpdateBlock(idx, { chartPoints: updatedPts })
                              }}
                              className="flex-1 p-1 bg-muted border border-border/40 rounded text-[10px] text-white"
                              placeholder="عنوان دسته..."
                            />
                            <input
                              type="number"
                              value={pt.value}
                              onChange={(e) => {
                                const updatedPts = [...block.chartPoints]
                                updatedPts[ptIdx].value = parseFloat(e.target.value) || 0
                                handleUpdateBlock(idx, { chartPoints: updatedPts })
                              }}
                              className="w-16 p-1 bg-muted border border-border/40 rounded text-[10px] text-white text-center"
                              placeholder="مقدار"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPts = block.chartPoints.filter((_: any, pI: number) => pI !== ptIdx)
                                handleUpdateBlock(idx, { chartPoints: updatedPts })
                              }}
                              className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPts = [...(block.chartPoints || []), { label: 'دسته‌بندی جدید', value: 10 }]
                            handleUpdateBlock(idx, { chartPoints: updatedPts })
                          }}
                          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold mt-1 bg-transparent cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن نقطه داده جدید</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'diagram' && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-muted-foreground block font-bold">مراحل و گام‌های متوالی:</span>
                      <div className="space-y-1.5">
                        {block.diagramSteps?.map((step: string, sIdx: number) => (
                          <div key={sIdx} className="flex gap-2 items-center">
                            <span className="text-[10px] text-muted-foreground">{toFa(sIdx + 1)}.</span>
                            <input
                              type="text"
                              value={step}
                              onChange={(e) => {
                                const updatedSteps = [...block.diagramSteps]
                                updatedSteps[sIdx] = e.target.value
                                handleUpdateBlock(idx, { diagramSteps: updatedSteps })
                              }}
                              className="flex-1 p-1 bg-muted border border-border/40 rounded text-[10px] text-white"
                              placeholder="توضیح این مرحله..."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSteps = block.diagramSteps.filter((_: any, sI: number) => sI !== sIdx)
                                handleUpdateBlock(idx, { diagramSteps: updatedSteps })
                              }}
                              className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSteps = [...(block.diagramSteps || []), 'گام جدید']
                            handleUpdateBlock(idx, { diagramSteps: updatedSteps })
                          }}
                          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold mt-1 bg-transparent cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن مرحله جدید</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'media' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={block.mediaType || 'video'}
                          onChange={(e) => handleUpdateBlock(idx, { mediaType: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                        >
                          <option value="video">ویدئو آموزشی (.mp4)</option>
                          <option value="pdf">فایل PDF ضمیمه</option>
                          <option value="word">سند Word ضمیمه</option>
                        </select>
                        <input
                          type="text"
                          value={block.mediaUrl || ''}
                          onChange={(e) => handleUpdateBlock(idx, { mediaUrl: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white font-mono dir-ltr text-left"
                          placeholder="آدرس اینترنتی یا مسیر فایل..."
                        />
                      </div>
                      <div className="border border-dashed border-border/40 rounded p-3 flex flex-col items-center justify-center gap-2 bg-black/5 hover:bg-black/10 transition relative">
                        <input
                          type="file"
                          id={`media-file-up-${idx}`}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleFileUpload(idx, f, 'mediaUrl')
                          }}
                        />
                        <label
                          htmlFor={`media-file-up-${idx}`}
                          className="flex flex-col items-center gap-1.5 cursor-pointer w-full"
                        >
                          {uploadingIdx === idx ? (
                            <div className="text-center space-y-2 w-full px-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                              <span className="text-[10px] text-muted-foreground block font-fa">در حال آپلود و پردازش قطعات ({toFa(uploadProgress)}٪)</span>
                              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground hover:text-white" />
                              <span className="text-[10px] text-muted-foreground font-fa">بارگذاری و آپلود مستقیم فایل رسانه‌ای (نامحدود)</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {block.type === 'image' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={block.imageUrl || ''}
                          onChange={(e) => handleUpdateBlock(idx, { imageUrl: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white font-mono dir-ltr text-left"
                          placeholder="مسیر یا آدرس تصویر..."
                        />
                        <input
                          type="text"
                          value={block.imageCaption || ''}
                          onChange={(e) => handleUpdateBlock(idx, { imageCaption: e.target.value })}
                          className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                          placeholder="توضیح زیر تصویر (کپشن)..."
                        />
                      </div>
                      <div className="border border-dashed border-border/40 rounded p-3 flex flex-col items-center justify-center gap-2 bg-black/5 hover:bg-black/10 transition relative">
                        <input
                          type="file"
                          id={`img-file-up-${idx}`}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) handleFileUpload(idx, f, 'imageUrl')
                          }}
                        />
                        <label
                          htmlFor={`img-file-up-${idx}`}
                          className="flex flex-col items-center gap-1.5 cursor-pointer w-full"
                        >
                          {uploadingIdx === idx ? (
                            <div className="text-center space-y-2 w-full px-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                              <span className="text-[10px] text-muted-foreground block font-fa">در حال آپلود و پردازش تصویر ({toFa(uploadProgress)}٪)</span>
                              <div className="w-full bg-muted/30 h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground hover:text-white" />
                              <span className="text-[10px] text-muted-foreground font-fa">آپلود مستقیم تصویر جدید</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {block.type === 'html' && (
                    <textarea
                      value={block.htmlContent || ''}
                      onChange={(e) => handleUpdateBlock(idx, { htmlContent: e.target.value })}
                      className="w-full p-2 bg-muted border border-border/40 rounded text-xs text-white font-mono dir-ltr text-left h-24 resize-y"
                      placeholder="<div>کد HTML سفارشی</div>"
                    />
                  )}

                  {block.type === 'quiz' && (
                    <div className="space-y-3.5 border border-border/20 rounded p-2.5 bg-black/5 font-fa">
                      <span className="text-[10px] text-muted-foreground block font-bold mb-1">سوالات آزمونک خودارزیابی درون‌درسی:</span>
                      {block.quizQuestions?.map((q: any, qIdx: number) => (
                        <div key={q.id || qIdx} className="space-y-2 border border-border/10 rounded p-2 bg-muted/10">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={q.text || ''}
                              onChange={(e) => {
                                const updatedQs = [...block.quizQuestions]
                                updatedQs[qIdx].text = e.target.value
                                handleUpdateBlock(idx, { quizQuestions: updatedQs })
                              }}
                              className="flex-1 p-1.5 bg-muted border border-border/40 rounded text-xs text-white font-fa"
                              placeholder="صورت سوال..."
                            />
                            <select
                              value={q.type || 'multiple'}
                              onChange={(e) => {
                                const val = e.target.value
                                const updatedQs = [...block.quizQuestions]
                                updatedQs[qIdx].type = val
                                if (val === 'multiple' && (!updatedQs[qIdx].options || updatedQs[qIdx].options.length === 0)) {
                                  updatedQs[qIdx].options = [
                                    { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۱', isCorrect: true },
                                    { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۲', isCorrect: false }
                                  ]
                                }
                                handleUpdateBlock(idx, { quizQuestions: updatedQs })
                              }}
                              className="p-1.5 bg-muted border border-border/40 rounded text-xs text-white"
                            >
                              <option value="multiple">تستی</option>
                              <option value="essay">تشریحی کوتاه</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedQs = block.quizQuestions.filter((_: any, qI: number) => qI !== qIdx)
                                handleUpdateBlock(idx, { quizQuestions: updatedQs })
                              }}
                              className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {q.type === 'multiple' && (
                            <div className="space-y-1.5 ps-4 border-r border-border/20">
                              {q.options?.map((opt: any, optIdx: number) => (
                                <div key={opt.id} className="flex gap-2 items-center">
                                  <input
                                    type="radio"
                                    name={`q-block-correct-${idx}-${q.id || qIdx}`}
                                    checked={!!opt.isCorrect}
                                    onChange={() => {
                                      const updatedQs = [...block.quizQuestions]
                                      updatedQs[qIdx].options = updatedQs[qIdx].options.map((o: any) => ({
                                        ...o,
                                        isCorrect: o.id === opt.id
                                      }))
                                      handleUpdateBlock(idx, { quizQuestions: updatedQs })
                                    }}
                                    className="accent-primary cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={opt.text || ''}
                                    onChange={(e) => {
                                      const updatedQs = [...block.quizQuestions]
                                      updatedQs[qIdx].options[optIdx].text = e.target.value
                                      handleUpdateBlock(idx, { quizQuestions: updatedQs })
                                    }}
                                    className="flex-1 p-1 bg-muted border border-border/40 rounded text-[10px] text-white"
                                    placeholder={`گزینه ${toFa(optIdx + 1)}...`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedQs = [...block.quizQuestions]
                                      updatedQs[qIdx].options = updatedQs[qIdx].options.filter((_: any, oI: number) => oI !== optIdx)
                                      handleUpdateBlock(idx, { quizQuestions: updatedQs })
                                    }}
                                    className="p-1 hover:bg-red-500/10 text-red-500 rounded text-xs cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedQs = [...block.quizQuestions]
                                  updatedQs[qIdx].options = [
                                    ...(updatedQs[qIdx].options || []),
                                    { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه جدید', isCorrect: false }
                                  ]
                                  handleUpdateBlock(idx, { quizQuestions: updatedQs })
                                }}
                                className="flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 font-bold bg-transparent cursor-pointer mt-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>افزودن گزینه جدید</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedQs = [
                            ...(block.quizQuestions || []),
                            {
                              id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7),
                              type: 'multiple',
                              text: 'سوال تستی جدید؟',
                              options: [
                                { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۱', isCorrect: true },
                                { id: typeof window !== 'undefined' ? window.crypto.randomUUID() : Math.random().toString(36).substring(7), text: 'گزینه ۲', isCorrect: false }
                              ]
                            }
                          ]
                          handleUpdateBlock(idx, { quizQuestions: updatedQs })
                        }}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold bg-transparent cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن سوال جدید به آزمونک</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right Panel: Live Preview */}
          <div className={`overflow-y-auto p-5 bg-card/60 border-t lg:border-t-0 lg:border-r border-border/40 ${previewMode === 'split' ? 'lg:col-span-1' : previewMode === 'preview' ? 'lg:col-span-3' : 'hidden'}`}>
            <h4 className="text-xs font-bold text-white border-b border-border/20 pb-2 mb-4 flex items-center gap-1 font-fa">
              <Eye className="w-3.5 h-3.5 text-accent" />
              <span>پیش‌نمایش زنده آزمونک</span>
            </h4>
            <div className="space-y-4 max-w-sm mx-auto font-fa">
              {lessonKind === 'quiz' ? (
                quizQuestions.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground text-xs italic">
                    پیش‌نمایشی برای نمایش وجود ندارد. سؤالی طراحی نشده است.
                  </div>
                ) : (
                  quizQuestions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="bg-card p-4 border border-border/40 rounded-lg space-y-3.5 text-right">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>سؤال {toFa(qIdx + 1)}:</span>
                      </span>
                      <p className="text-xs font-bold text-white leading-relaxed">{q.text}</p>
                      {q.type === 'multiple' ? (
                        <div className="grid grid-cols-1 gap-2">
                          {q.options?.map((opt: any) => (
                            <div key={opt.id} className={`p-2.5 rounded border text-xs text-right transition flex items-center justify-between ${opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold' : 'bg-muted/10 border-border/20 text-muted-foreground'}`}>
                              <span>{opt.text}</span>
                              {opt.isCorrect && <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-bold font-fa">پاسخ صحیح</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-muted/10 border border-border/10 rounded text-muted-foreground text-xs italic">
                          پاسخ تشریحی کوتاه (توسط راهبر نوشته می‌شود)
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : blocks.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-xs italic">
                  پیش‌نمایشی برای نمایش وجود ندارد.
                </div>
              ) : (
                blocks.map((block, idx) => renderBlockElement(block, idx))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between shrink-0 font-fa">
          <div className="text-[10px] text-muted-foreground leading-normal max-w-md">
            توجه: برای نهایی شدن تغییرات در سرور، پس از فشردن دکمه تایید زیر، دکمه ذخیره ساختار دوره را در پنل قبلی فشار دهید.
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer text-xs"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSaveVisualContent}
              className="bg-primary hover:bg-primary-hover text-white cursor-pointer text-xs font-bold gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>تایید محتوا و ثبت موقت</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
