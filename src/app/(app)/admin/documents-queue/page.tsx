'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { FileCheck, FileX, Calendar, User, ShieldAlert, Eye, CheckCircle2 } from 'lucide-react'

interface DocumentRequest {
  id: string
  userName: string
  personnelNo: string
  docType: string
  submissionDate: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
}

const INITIAL_REQUESTS: DocumentRequest[] = [
  {
    id: 'DOC-1021',
    userName: 'علی اصغری',
    personnelNo: '100234',
    docType: 'گواهی صلاحیت راهبری قطار شهری',
    submissionDate: '۱۴۰۵/۰۴/۰۱',
    fileUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80',
    status: 'pending',
  },
  {
    id: 'DOC-1022',
    userName: 'محمدرضا علوی',
    personnelNo: '100452',
    docType: 'گواهی معاینات سلامت طب کار (سالانه)',
    submissionDate: '۱۴۰۵/۰۳/۲۸',
    fileUrl: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=500&auto=format&fit=crop&q=80',
    status: 'pending',
  },
  {
    id: 'DOC-1023',
    userName: 'سهراب سپهری',
    personnelNo: '100109',
    docType: 'کارت بهداشت اختصاصی سیر و حرکت',
    submissionDate: '۱۴۰۵/۰۳/۲۵',
    fileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=80',
    status: 'pending',
  },
  {
    id: 'DOC-1024',
    userName: 'رضا حداد',
    personnelNo: '100366',
    docType: 'تعهدنامه ایمنی کار در حریم ریل سوم',
    submissionDate: '۱۴۰۵/۰۳/۲۴',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80',
    status: 'pending',
  },
]

export default function DocumentsQueuePage() {
  const [requests, setRequests] = useState<DocumentRequest[]>(INITIAL_REQUESTS)
  const [activeRequest, setActiveRequest] = useState<DocumentRequest | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    setSuccessMsg('سند با موفقیت تایید و لاگ ممیزی ثبت شد.')
    setPreviewOpen(false)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleReject = () => {
    if (!activeRequest || !rejectReason.trim()) return
    setRequests((prev) => prev.filter((r) => r.id !== activeRequest.id))
    setRejectOpen(false)
    setRejectReason('')
    setSuccessMsg('سند رد شد و دلیل رد مدارک برای کاربر ارسال گردید.')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <TopAppBar
        title="صف تایید مدارک رسمی"
        subtitle="بررسی صلاحیت‌های راهبری و استخدامی پرسنل"
      />

      <main className="flex-1 p-4 pt-16 md:p-6 space-y-6">
        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border-subtle pb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck className="size-4 text-accent" />
              مدارک معلق در انتظار بررسی ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-foreground-muted">
                <FileCheck className="size-10 mb-2 opacity-50" />
                <p className="text-sm">سند معلقی در صف تایید وجود ندارد.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-background-subtle">
                  <TableRow>
                    <TableHead className="text-right text-xs">شناسه درخواست</TableHead>
                    <TableHead className="text-right text-xs">نام پرسنل</TableHead>
                    <TableHead className="text-right text-xs">کد پرسنلی</TableHead>
                    <TableHead className="text-right text-xs">نوع مدرک</TableHead>
                    <TableHead className="text-right text-xs">تاریخ ارسال</TableHead>
                    <TableHead className="text-center text-xs">پیش‌نمایش</TableHead>
                    <TableHead className="text-center text-xs">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id} className="hover:bg-surface-hover">
                      <TableCell className="font-mono text-xs text-foreground-muted">{r.id}</TableCell>
                      <TableCell className="text-sm font-medium">{r.userName}</TableCell>
                      <TableCell className="font-mono text-sm">{r.personnelNo}</TableCell>
                      <TableCell className="text-sm text-foreground-muted">{r.docType}</TableCell>
                      <TableCell className="text-sm text-foreground-muted">{r.submissionDate}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setActiveRequest(r)
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-success/30 hover:bg-success/15 text-success"
                            onClick={() => handleApprove(r.id)}
                          >
                            تایید
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 hover:bg-critical/10 text-critical"
                            onClick={() => {
                              setActiveRequest(r)
                              setRejectOpen(true)
                            }}
                          >
                            رد مدرک
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">پیش‌نمایش مدرک پیوست شده</DialogTitle>
          </DialogHeader>
          {activeRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-background-subtle p-3 text-sm">
                <div>
                  <span className="text-foreground-muted">فرستنده:</span> {activeRequest.userName}
                </div>
                <div>
                  <span className="text-foreground-muted">کد پرسنلی:</span> {activeRequest.personnelNo}
                </div>
                <div className="col-span-2">
                  <span className="text-foreground-muted">نوع مدرک:</span> {activeRequest.docType}
                </div>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-surface-container-high flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeRequest.fileUrl}
                  alt="سند ارسالی"
                  className="max-h-full object-contain"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(false)}
            >
              بستن
            </Button>
            <Button
              size="sm"
              className="bg-success hover:bg-success/90 text-white"
              onClick={() => activeRequest && handleApprove(activeRequest.id)}
            >
              تایید صلاحیت و ثبت سند
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-critical">
              <ShieldAlert className="size-5" />
              رد صلاحیت و نقص مدرک
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason" className="text-right block">دلیل رد یا نقص مدرک (به اطلاع پرسنل خواهد رسید):</Label>
            <Textarea
              id="reject-reason"
              placeholder="مثلاً: کیفیت مدرک خوانا نیست یا تاریخ اعتبار منقضی شده است."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-right"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(false)}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-critical hover:bg-critical-600 text-critical-foreground"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              رد مدرک و ارسال اعلان نقص
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
