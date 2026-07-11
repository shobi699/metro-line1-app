'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/features/auth'
import { jalali, faTime } from '@/lib/fa'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

export default function IamReportsPage() {
  const accessToken = useAuthStore(state => state.accessToken)
  
  const [effectiveAccess, setEffectiveAccess] = useState<any[]>([])
  const [hygiene, setHygiene] = useState<any>({ expiredAssignments: [], suspendedUsers: [] })
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [eaRes, hyRes, auRes] = await Promise.all([
        fetch('/api/admin/iam/reports/effective-access', { headers }),
        fetch('/api/admin/iam/reports/hygiene', { headers }),
        fetch('/api/admin/iam/reports/audit', { headers })
      ])
      
      if (eaRes.ok) setEffectiveAccess((await eaRes.json()).data || [])
      if (hyRes.ok) setHygiene((await hyRes.json()).data || { expiredAssignments: [], suspendedUsers: [] })
      if (auRes.ok) setAuditLogs((await auRes.json()).data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [accessToken])

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">مرکز گزارشات و ممیزی دسترسی</h1>
        <p className="text-muted-foreground mt-2">
          گزارش کامل از دسترسی‌ها، لاگ‌های امنیتی و بهداشت دسترسی سیستم.
        </p>
      </div>

      <Tabs defaultValue="access" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="access">دسترسی‌های موثر</TabsTrigger>
          <TabsTrigger value="hygiene">بهداشت دسترسی (Hygiene)</TabsTrigger>
          <TabsTrigger value="audit">لاگ حسابرسی (Audit Log)</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>گزارش نقش‌ها و محدوده‌ها</CardTitle>
              <Button onClick={() => exportToExcel(effectiveAccess, 'effective-access')} variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" /> خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-4">در حال بارگذاری...</div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد پرسنلی</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>نقش انتسابی</TableHead>
                      <TableHead>محدوده (Scope)</TableHead>
                      <TableHead>تاریخ انقضا</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectiveAccess.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono">{row.personnelCode}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell><Badge variant="secondary">{row.roleTitle}</Badge></TableCell>
                        <TableCell>{row.scopeType === 'all' ? 'کل سیستم' : `${row.scopeType}: ${row.scopeKey}`}</TableCell>
                        <TableCell>
                          {row.validTo ? `${jalali(row.validTo)} ${faTime(row.validTo)}` : 'دائمی'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hygiene">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>انتساب‌های منقضی شده</CardTitle>
              <Button onClick={() => exportToExcel(hygiene.expiredAssignments, 'expired-assignments')} variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" /> خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-4">در حال بارگذاری...</div> : hygiene.expiredAssignments.length === 0 ? (
                <div className="text-center py-4 text-emerald-600">هیچ انتساب منقضی شده‌ای یافت نشد. سیستم سالم است.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد پرسنلی</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>تاریخ انقضا</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hygiene.expiredAssignments.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono">{row.personnelCode}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.roleTitle}</TableCell>
                        <TableCell className="text-destructive font-medium">
                          {`${jalali(row.validTo)} ${faTime(row.validTo)}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>کاربران معلق (Suspended)</CardTitle>
              <Button onClick={() => exportToExcel(hygiene.suspendedUsers, 'suspended-users')} variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" /> خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-4">در حال بارگذاری...</div> : hygiene.suspendedUsers.length === 0 ? (
                <div className="text-center py-4">کاربر معلقی یافت نشد.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد پرسنلی</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>تاریخ آخرین تغییر وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hygiene.suspendedUsers.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono">{row.personnelCode}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{jalali(row.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>لاگ حسابرسی و تغییرات دسترسی</CardTitle>
              <Button onClick={() => exportToExcel(auditLogs, 'audit-logs')} variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" /> خروجی اکسل
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-4">در حال بارگذاری...</div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ عملیات</TableHead>
                      <TableHead>کاربر هدف</TableHead>
                      <TableHead>نوع اقدام</TableHead>
                      <TableHead>اقدام کننده</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{`${jalali(log.createdAt)} ${faTime(log.createdAt)}`}</TableCell>
                        <TableCell>
                          <div className="font-medium">{log.targetName}</div>
                          <div className="text-xs text-muted-foreground">{log.personnelCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.kind}</Badge>
                        </TableCell>
                        <TableCell>{log.actorName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
