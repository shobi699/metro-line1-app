'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toFa, jalali, faTime } from '@/lib/fa'
import { FileText, RefreshCw, Check, X, AlertTriangle, MessageSquare, CornerDownLeft, ShieldAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InboxItem {
  id: string
  submissionNo: number
  status: string
  currentStage: string
  createdAt: string
  amount: number | null
  template: { title: string; key: string }
  submitter: { name: string; phone: string | null }
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'ثبت شده',
  in_review: 'در حال بررسی',
}

const REFERABLE_ROLES = [
  { value: 'safety', label: 'نقش ایمنی' },
  { value: 'dispatch_tech', label: 'تکنسین اعزام پذیرش' },
  { value: 'chief', label: 'رئیس خط' },
  { value: 'manager', label: 'مدیر ارشد' },
]

export default function ApprovalInboxPage() {
  const { accessToken } = useAuthStore()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  // Review Dialog States
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Action Inputs
  const [note, setNote] = useState('')
  const [referRole, setReferRole] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes' | 'refer' | null>(null)
  const [submittingAction, setSubmittingAction] = useState(false)

  useEffect(() => {
    loadInbox()
  }, [])

  async function loadInbox() {
    setLoading(true)
    try {
      const res = await fetch('/api/forms/inbox', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setItems(json.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenReview(item: InboxItem) {
    setLoadingDetails(true)
    setShowReviewModal(true)
    setNote('')
    setReferRole('')
    setActionType(null)
    
    try {
      const res = await fetch(`/api/forms/submissions/${item.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSelectedItem(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleSubmitAction() {
    if (!selectedItem || !actionType) return
    if (actionType === 'refer' && !referRole) {
      alert('لطفا نقش ارجاع‌شونده را انتخاب کنید.')
      return
    }

    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/forms/submissions/${selectedItem.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          decision: actionType,
          note: note.trim() || undefined,
          referTo: actionType === 'refer' ? referRole : undefined,
        }),
      })

      if (res.ok) {
        alert('اقدام شما با موفقیت ثبت و درخواست منتقل شد.')
        setShowReviewModal(false)
        loadInbox()
      } else {
        const json = await res.json()
        alert(json.error || 'خطا در ثبت اقدام بررسی.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-500" />
            کارتابل بررسی و تایید درخواست‌ها
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            اقدام روی درخواست‌های ارسالی پرسنل (تایید، رد، ارجاع، نیاز به تغییرات)
          </p>
        </div>
        <Button onClick={loadInbox} variant="outline" size="sm" className="h-8 text-xs cursor-pointer">
          <RefreshCw className="size-3.5 me-1" />
          به‌روزرسانی کارتابل
        </Button>
      </div>

      {/* Inbox List */}
      {loading ? (
        <span className="text-xs text-foreground-muted animate-pulse">در حال دریافت کارهای منتظر اقدام...</span>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-surface border border-border rounded-xl">
          <span className="text-xs text-foreground-muted">کارتابل شما خالی است. هیچ درخواست منتظر اقدامی وجود ندارد.</span>
        </div>
      ) : (
        <Card className="border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow className="text-xs font-bold text-foreground-muted">
                <TableHead className="text-right">شماره درخواست</TableHead>
                <TableHead className="text-right">عنوان فرم</TableHead>
                <TableHead className="text-right">فرستنده</TableHead>
                <TableHead className="text-right">تاریخ ارسال</TableHead>
                <TableHead className="text-right">وضعیت فعلی</TableHead>
                <TableHead className="text-left">اقدام</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="text-xs">
                  <TableCell className="font-mono font-bold">R-{item.submissionNo}</TableCell>
                  <TableCell className="font-bold">{item.template.title}</TableCell>
                  <TableCell>{item.submitter.name}</TableCell>
                  <TableCell className="text-foreground-muted">{jalali(item.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                      {STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(item)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold h-7 text-[10px] cursor-pointer"
                    >
                      بررسی پرونده
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          {loadingDetails ? (
            <div className="p-10 text-center text-xs text-foreground-muted animate-pulse">در حال بارگذاری مدارک پرونده...</div>
          ) : selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-right text-foreground flex items-center gap-2">
                  بررسی درخواست R-{selectedItem.submissionNo}
                </DialogTitle>
                <DialogDescription className="text-right text-[10px] text-foreground-muted mt-1">تایید یا تغییر وضعیت درخواست پرسنل به همراه یادداشت بررسی</DialogDescription>
              </DialogHeader>

              {/* Form specs */}
              <div className="space-y-2 border-b border-border/40 pb-4">
                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 p-3 rounded-lg border border-border/20 mb-3">
                  <div><strong className="text-zinc-500">فرم مربوطه:</strong> {selectedItem.template.title}</div>
                  <div><strong className="text-zinc-500">متقاضی:</strong> {selectedItem.submitter.name} ({selectedItem.submitter.role.name})</div>
                </div>

                <span className="text-xs font-bold text-foreground">داده‌های تکمیل‌شده فرم:</span>
                <div className="grid grid-cols-1 gap-2 bg-background/50 p-3 rounded-lg border border-border/40 text-xs">
                  {selectedItem.version.schema.fields.map((f: any) => (
                    <div key={f.name} className="flex justify-between border-b border-border/20 py-1.5">
                      <span className="text-foreground-muted">{f.label}:</span>
                      <span className="font-bold text-foreground">
                        {selectedItem.data[f.name] === true ? 'بله' : selectedItem.data[f.name] === false ? 'خیر' : String(selectedItem.data[f.name] ?? '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Selection */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-foreground">تصمیم و اقدام بررسی‌کننده:</span>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={actionType === 'approve' ? 'default' : 'outline'}
                    onClick={() => setActionType('approve')}
                    className={`text-xs h-8 gap-1 cursor-pointer font-bold ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  >
                    <Check className="size-4" />
                    تایید درخواست
                  </Button>

                  <Button
                    size="sm"
                    variant={actionType === 'reject' ? 'default' : 'outline'}
                    onClick={() => setActionType('reject')}
                    className={`text-xs h-8 gap-1 cursor-pointer font-bold ${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                  >
                    <X className="size-4" />
                    رد درخواست
                  </Button>

                  <Button
                    size="sm"
                    variant={actionType === 'request_changes' ? 'default' : 'outline'}
                    onClick={() => setActionType('request_changes')}
                    className={`text-xs h-8 gap-1 cursor-pointer font-bold ${actionType === 'request_changes' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                  >
                    <CornerDownLeft className="size-4" />
                    نیاز به اصلاح
                  </Button>

                  <Button
                    size="sm"
                    variant={actionType === 'refer' ? 'default' : 'outline'}
                    onClick={() => setActionType('refer')}
                    className={`text-xs h-8 gap-1 cursor-pointer font-bold ${actionType === 'refer' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                  >
                    <MessageSquare className="size-4" />
                    ارجاع جهت بررسی
                  </Button>
                </div>

                {actionType === 'refer' && (
                  <div className="space-y-1.5 text-xs">
                    <Label htmlFor="refer-role" className="font-semibold text-foreground">انتخاب نقش جهت ارجاع و دریافت بازخورد *</Label>
                    <Select value={referRole} onValueChange={(val) => setReferRole(val || '')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="نقش مورد نظر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value} className="text-xs">{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5 text-xs">
                  <Label htmlFor="note" className="font-semibold text-foreground">یادداشت بررسی و علت تصمیم:</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="علت رد، موارد اصلاحی یا بازخورد ارجاع را بنویسید..."
                    className="min-h-16 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowReviewModal(false)} className="text-xs h-8 cursor-pointer">انصراف</Button>
                <Button
                  onClick={handleSubmitAction}
                  disabled={submittingAction || !actionType}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 cursor-pointer"
                >
                  {submittingAction ? 'در حال ثبت...' : 'ثبت قطعی اقدام'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
