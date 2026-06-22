'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/shared/data-table'
import { FileDrop } from '@/components/shared/file-drop'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toFa } from '@/lib/fa'
import { Search, Download, Upload } from 'lucide-react'

interface UserRow {
  id: string
  nationalId: string
  name: string
  phone: string | null
  email: string | null
  status: string
  customFields: Record<string, unknown> | null
  role: { key: string; name: string }
  createdAt: string
}

interface ImportResult {
  successCount: number
  errorCount: number
  errors: Array<{ row: number; nationalId: string; reason: string }>
  totalRows: number
  errorReportUrl?: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار',
  active: 'فعال',
  suspended: 'معلق',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  suspended: 'bg-destructive/10 text-destructive',
}

export default function DirectoryPage() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (roleFilter) params.set('role', roleFilter)
        if (statusFilter) params.set('status', statusFilter)
        params.set('page', String(page))
        params.set('pageSize', '20')

        const res = await fetch(`/api/users?${params}`, {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
        })

        if (res.status === 401) {
          logout()
          router.push('/login')
          return
        }

        const data = await res.json()
        if (!cancelled && data.data) {
          setUsers(data.data.users)
          setTotal(data.data.total)
          setTotalPages(data.data.totalPages)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, q, roleFilter, statusFilter, page, logout, router, refreshKey])

  async function handleImport(file: File) {
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/import/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
        },
        body: formData,
      })

      const data = await res.json()
      setImportResult(data.data)
      setRefreshKey((k) => k + 1)
    } catch {
      setImportResult(null)
    } finally {
      setImportLoading(false)
    }
  }

  function handleDownloadErrorReport(errorReportUrl: string) {
    const link = document.createElement('a')
    link.href = errorReportUrl
    link.download = 'error-report.xlsx'
    link.click()
  }

  const columns = [
    { key: 'nationalId', header: 'کد ملی', mono: true },
    { key: 'name', header: 'نام' },
    { key: 'phone', header: 'موبایل', mono: true },
    { key: 'email', header: 'ایمیل' },
    {
      key: 'role',
      header: 'نقش',
      render: (item: UserRow) => item.role.name,
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (item: UserRow) => (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[item.status] ?? ''}`}
        >
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاریخ ایجاد',
      render: (item: UserRow) => (
        <span className="font-mono text-xs">
          {new Date(item.createdAt).toLocaleDateString('fa-IR')}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">دفتر تلفن</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/export/users', '_blank')}
          >
            <Download className="ms-2 size-4" />
            خروجی اکسل
          </Button>
          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger
                render={<Button size="sm" />}
              >
                <Upload className="ms-2 size-4" />
                وارد کردن اکسل
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>وارد کردن کاربران از اکسل</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <FileDrop
                    accept=".xlsx,.xls"
                    onFile={handleImport}
                    disabled={importLoading}
                  />
                  {importLoading && (
                    <p className="text-sm text-muted-foreground">
                      در حال پردازش فایل...
                    </p>
                  )}
                  {importResult && (
                    <div className="space-y-2 rounded-lg border border-border p-4">
                      <p className="text-sm">
                        کل ردیف‌ها: {toFa(importResult.totalRows)}
                      </p>
                      <p className="text-sm text-success">
                        موفق: {toFa(importResult.successCount)}
                      </p>
                      {importResult.errorCount > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-destructive">
                            خطا: {toFa(importResult.errorCount)}
                          </p>
                          {importResult.errorReportUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadErrorReport(
                                  importResult.errorReportUrl!,
                                )
                              }
                            >
                              <Download className="ms-2 size-4" />
                              دانلود گزارش خطا
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">جستجو و فیلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
              <Input
                placeholder="جستجو بر اساس نام، کد ملی، موبایل..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                className="ps-9"
              />
            </div>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              aria-label="فیلتر نقش"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">همه نقش‌ها</option>
              <option value="super_admin">مدیر ارشد</option>
              <option value="admin">مدیر</option>
              <option value="operator">اپراتور</option>
            </select>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              aria-label="فیلتر وضعیت"
              className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="pending">در انتظار</option>
              <option value="suspended">معلق</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div role="status" className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={users as never[]} />
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <span>
              کل: {toFa(total)} · صفحه {toFa(page)} از {toFa(totalPages)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                قبلی
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
