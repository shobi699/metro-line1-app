'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/features/auth'
import { jalali } from '@/lib/fa'

interface Member {
  id: string
  personnelCode: string
  name: string
  status: string
  homeUnitId: string
  homeUnitTitle: string
  roleKey: string
  roleTitle: string
}

interface TransferRequest {
  id: string
  userId: string
  fromUnitId: string
  toUnitId: string
  effectiveDate: string
  status: string
  reason: string
  targetUser: { id: string; name: string; personnelCode: string }
  requestedBy: { id: string; name: string }
  approvedBy: { id: string; name: string } | null
  fromUnitTitle: string
  toUnitTitle: string
  createdAt: string
}

export default function MyUnitPage() {
  const accessToken = useAuthStore(state => state.accessToken)
  const user = useAuthStore(state => state.user)
  
  const [members, setMembers] = useState<Member[]>([])
  const [transfers, setTransfers] = useState<TransferRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [mRes, tRes] = await Promise.all([
        fetch('/api/admin/iam/my-unit/members', { headers }),
        fetch('/api/admin/iam/transfers', { headers })
      ])
      
      if (mRes.ok) {
        const mData = await mRes.json()
        setMembers(mData.data || [])
      }
      
      if (tRes.ok) {
        const tData = await tRes.json()
        setTransfers(tData.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [accessToken])

  const handleApproveTransfer = async (id: string, action: 'approved' | 'rejected') => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/admin/iam/transfers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: action })
      })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'خطا در انجام عملیات')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">واحد من (مدیریت زیرمجموعه)</h1>
        <p className="text-muted-foreground mt-2">
          مشاهده و مدیریت پرسنل شیفت، ایستگاه یا نواحی تحت مدیریت شما.
        </p>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">پرسنل زیرمجموعه</TabsTrigger>
          <TabsTrigger value="transfers">درخواست‌های انتقال</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>لیست پرسنل</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">در حال بارگذاری...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  هیچ کارمندی در زیرمجموعه شما یافت نشد.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کد پرسنلی</TableHead>
                      <TableHead>نام</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>محل شروع به کار (شیفت/ایستگاه)</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono">{member.personnelCode}</TableCell>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.roleTitle}</Badge>
                        </TableCell>
                        <TableCell>{member.homeUnitTitle}</TableCell>
                        <TableCell>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                            {member.status === 'active' ? 'فعال' : member.status === 'pending' ? 'در انتظار' : 'معلق'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/users?q=${member.personnelCode}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                            ویرایش
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>کارتابل انتقالات</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">در حال بارگذاری...</div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  هیچ درخواست انتقالی وجود ندارد.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>مبدأ</TableHead>
                      <TableHead>مقصد</TableHead>
                      <TableHead>تاریخ مؤثر</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map(tr => (
                      <TableRow key={tr.id}>
                        <TableCell>
                          <div className="font-medium">{tr.targetUser.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{tr.targetUser.personnelCode}</div>
                        </TableCell>
                        <TableCell>{tr.fromUnitTitle}</TableCell>
                        <TableCell>{tr.toUnitTitle}</TableCell>
                        <TableCell>{jalali(tr.effectiveDate)}</TableCell>
                        <TableCell>
                          <Badge variant={tr.status === 'approved' ? 'default' : tr.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {tr.status === 'approved' ? 'تایید شده' : tr.status === 'rejected' ? 'رد شده' : 'در انتظار'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tr.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleApproveTransfer(tr.id, 'approved')}
                              >
                                تایید
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleApproveTransfer(tr.id, 'rejected')}
                              >
                                رد
                              </Button>
                            </div>
                          )}
                        </TableCell>
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
