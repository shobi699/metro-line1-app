'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, Network, Settings2, KeyRound } from 'lucide-react'

export default function IAMDashboardPage() {
  const [orgUnits, setOrgUnits] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgRes, rolesRes] = await Promise.all([
          fetch('/api/admin/iam/org-units'),
          fetch('/api/admin/iam/roles')
        ])
        
        if (orgRes.ok) {
          const data = await orgRes.json()
          setOrgUnits(data.data || [])
        }
        
        if (rolesRes.ok) {
          const data = await rolesRes.json()
          setRoles(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching IAM data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">مدیریت کاربران و سطوح دسترسی (IAM)</h1>
          <p className="text-muted-foreground mt-2">
            مدیریت یکپارچه نقش‌ها، محدوده‌های سازمانی، سیاست‌های امنیتی و کاربران
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-2">
          <TabsTrigger value="dashboard" className="gap-2">
            <Shield className="w-4 h-4" />
            داشبورد
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <KeyRound className="w-4 h-4" />
            نقش‌ها
          </TabsTrigger>
          <TabsTrigger value="org" className="gap-2">
            <Network className="w-4 h-4" />
            درخت سازمانی
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <Settings2 className="w-4 h-4" />
            سیاست‌های امنیتی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل نقش‌های سیستم</CardTitle>
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : roles.length}</div>
                <p className="text-xs text-muted-foreground">نقش‌های ترکیبی و پایه</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">واحدهای سازمانی</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : orgUnits.length}</div>
                <p className="text-xs text-muted-foreground">ایستگاه‌ها، شیفت‌ها و نواحی</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">---</div>
                <p className="text-xs text-muted-foreground">آمار برخط کاربران</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت نقش‌ها</CardTitle>
              <CardDescription>تعریف نقش‌های نامدار و دسترسی‌های ترکیبی</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">در حال بارگذاری...</div>
              ) : (
                <div className="space-y-4">
                  {roles.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-lg border bg-card flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{r.title}</h4>
                        <p className="text-sm text-muted-foreground">{r.key}</p>
                      </div>
                      <Button variant="outline" size="sm">ویرایش</Button>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <div className="text-muted-foreground">هیچ نقشی یافت نشد.</div>
                  )}
                  <Button className="mt-4">افزودن نقش جدید</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org">
          <Card>
            <CardHeader>
              <CardTitle>درخت سازمانی (Org Units)</CardTitle>
              <CardDescription>ساختار ایستگاه‌ها، نواحی و شیفت‌ها</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">در حال بارگذاری...</div>
              ) : (
                <div className="space-y-4">
                  {orgUnits.map((u: any) => (
                    <div key={u.id} className="p-4 rounded-lg border bg-card flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{u.title}</h4>
                        <p className="text-sm text-muted-foreground">{u.kind} | {u.key}</p>
                      </div>
                      <Button variant="outline" size="sm">مدیریت</Button>
                    </div>
                  ))}
                  {orgUnits.length === 0 && (
                    <div className="text-muted-foreground">ساختار سازمانی یافت نشد.</div>
                  )}
                  <Button className="mt-4">افزودن واحد سازمانی</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
