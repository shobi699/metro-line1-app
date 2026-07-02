'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusCircle, Save, Trash2, ListChecks, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChecklistsAdminPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'templates' | 'records'>('templates')

  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  useEffect(() => {
    fetchTemplates()
    fetchRecords()
  }, [])

  async function fetchTemplates() {
    const res = await fetch('/api/checklists/templates')
    const json = await res.json()
    if (res.ok) setTemplates(json.data || [])
    setLoading(false)
  }

  async function fetchRecords() {
    const res = await fetch('/api/checklists/records')
    const json = await res.json()
    if (res.ok) setRecords(json.data || [])
  }

  function handleAddTemplate() {
    setEditingTemplate({
      name: '',
      description: '',
      isActive: true,
      items: [{ id: Date.now().toString(), label: '', required: true, type: 'boolean' }]
    })
    setIsEditing(true)
  }

  function handleAddItem() {
    setEditingTemplate({
      ...editingTemplate,
      items: [...editingTemplate.items, { id: Date.now().toString(), label: '', required: true, type: 'boolean' }]
    })
  }

  function handleRemoveItem(idx: number) {
    const newItems = [...editingTemplate.items]
    newItems.splice(idx, 1)
    setEditingTemplate({ ...editingTemplate, items: newItems })
  }

  function handleItemChange(idx: number, field: string, value: any) {
    const newItems = [...editingTemplate.items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    setEditingTemplate({ ...editingTemplate, items: newItems })
  }

  async function handleSaveTemplate() {
    const method = editingTemplate.id ? 'PUT' : 'POST'
    const url = editingTemplate.id ? `/api/checklists/templates/${editingTemplate.id}` : '/api/checklists/templates'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTemplate)
    })
    
    if (res.ok) {
      setIsEditing(false)
      fetchTemplates()
    } else {
      const json = await res.json()
      alert(json.error?.message || 'خطا در ذخیره‌سازی')
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('آیا از حذف این قالب اطمینان دارید؟')) return
    const res = await fetch(`/api/checklists/templates/${id}`, { method: 'DELETE' })
    if (res.ok) fetchTemplates()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">مدیریت چک‌لیست‌ها</h1>
          <p className="text-muted-foreground mt-1">
            ایجاد قالب‌های چک‌لیست و مشاهده فرم‌های پر شده توسط پرسنل
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border pb-px">
        <Button 
          variant={tab === 'templates' ? 'default' : 'ghost'} 
          onClick={() => setTab('templates')}
          className="rounded-b-none"
        >
          <ListChecks className="me-2 h-4 w-4" />
          قالب‌های چک‌لیست
        </Button>
        <Button 
          variant={tab === 'records' ? 'default' : 'ghost'} 
          onClick={() => setTab('records')}
          className="rounded-b-none"
        >
          <FileText className="me-2 h-4 w-4" />
          چک‌لیست‌های تکمیل شده
        </Button>
      </div>

      {tab === 'templates' && (
        <div className="space-y-4">
          {!isEditing ? (
            <>
              <Button onClick={handleAddTemplate}><PlusCircle className="w-4 h-4 me-2" /> افزودن قالب جدید</Button>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {templates.map(tpl => (
                  <Card key={tpl.id} className={cn(!tpl.isActive && 'opacity-50')}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-start">
                        <span>{tpl.name}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingTemplate(tpl); setIsEditing(true) }}>
                            <Save className="w-4 h-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(tpl.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tpl.description}</p>
                      <div className="mt-4 flex gap-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded-md">{tpl.items.length} آیتم</span>
                        {tpl.isActive ? 
                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-md flex items-center"><CheckCircle2 className="w-3 h-3 me-1"/> فعال</span> :
                          <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded-md flex items-center"><XCircle className="w-3 h-3 me-1"/> غیرفعال</span>
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {templates.length === 0 && !loading && <p className="text-muted-foreground">هیچ قالبی یافت نشد.</p>}
              </div>
            </>
          ) : (
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>{editingTemplate.id ? 'ویرایش قالب' : 'قالب جدید'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">عنوان چک‌لیست</label>
                  <Input value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} placeholder="مثال: چک‌لیست قبل از حرکت قطار" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">توضیحات</label>
                  <Input value={editingTemplate.description} onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})} placeholder="توضیحات تکمیلی" />
                </div>
                
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">آیتم‌های چک‌لیست ({editingTemplate.items.length})</h3>
                    <Button variant="outline" size="sm" onClick={handleAddItem}><PlusCircle className="w-4 h-4 me-2"/> افزودن سوال</Button>
                  </div>
                  
                  <div className="space-y-3">
                    {editingTemplate.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center bg-secondary/30 p-2 rounded-md">
                        <span className="text-xs text-muted-foreground w-6 text-center">{idx + 1}</span>
                        <Input 
                          value={item.label} 
                          onChange={e => handleItemChange(idx, 'label', e.target.value)} 
                          placeholder="متن سوال یا بررسی..." 
                          className="flex-1"
                        />
                        <select 
                          className="bg-background border border-input rounded-md px-2 py-1 text-sm h-10"
                          value={item.type}
                          onChange={e => handleItemChange(idx, 'type', e.target.value)}
                        >
                          <option value="boolean">تیک (بله/خیر)</option>
                          <option value="text">متن کوتاه</option>
                          <option value="number">عدد</option>
                        </select>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>انصراف</Button>
                  <Button onClick={handleSaveTemplate}><Save className="w-4 h-4 me-2"/> ذخیره قالب</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {records.map(rec => (
              <Card key={rec.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="text-lg">{rec.template?.name || 'چک‌لیست حذف شده'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">تکمیل کننده: {rec.user?.firstName} {rec.user?.lastName}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm">{new Date(rec.createdAt).toLocaleString('fa-IR')}</p>
                      {rec.trainId && <p className="text-xs text-muted-foreground mt-1">قطار: {rec.trainId}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/30 p-3 rounded-md space-y-2 text-sm mt-2">
                    {(rec.items as any[]).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span>{item.label}</span>
                        <div className="flex items-center gap-2">
                          {item.value ? <span className="font-semibold">{item.value}</span> : null}
                          {item.checked === true && <CheckCircle2 className="w-4 h-4 text-success" />}
                          {item.checked === false && <XCircle className="w-4 h-4 text-destructive" />}
                          {item.note && <span className="text-xs text-muted-foreground ms-2">({item.note})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {records.length === 0 && <p className="text-muted-foreground">هیچ رکوردی یافت نشد.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
