'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toFa, jalali } from '@/lib/fa'
import {
  MapPin,
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  checkInGeo: string | null
  checkInTime: string
  checkOutGeo: string | null
  checkOutTime: string | null
  method: string
}

export default function AttendancePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [todayRes, historyRes] = await Promise.all([
        fetch('/api/attendance/check-in', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/attendance/me?limit=14', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (todayRes.ok) {
        const todayData = await todayRes.json()
        setTodayRecord(todayData.data)
      }
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setHistory(historyData.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadData()
  }, [accessToken])

  async function handleCheckIn() {
    if (!accessToken) return
    setChecking(true)
    try {
      let geoLocation: string | undefined
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              }),
          )
          geoLocation = `${pos.coords.latitude},${pos.coords.longitude}`
        } catch {
          // geolocation not available
        }
      }

      await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkIn', geoLocation }),
      })
      loadData()
    } finally {
      setChecking(false)
    }
  }

  async function handleCheckOut() {
    if (!accessToken) return
    setChecking(true)
    try {
      let geoLocation: string | undefined
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              }),
          )
          geoLocation = `${pos.coords.latitude},${pos.coords.longitude}`
        } catch {
          // geolocation not available
        }
      }

      await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'checkOut', geoLocation }),
      })
      loadData()
    } finally {
      setChecking(false)
    }
  }

  const isCheckedIn = todayRecord && !todayRecord.checkOutTime

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <MapPin className="size-6 text-accent" />
          حضور و غیاب
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          ثبت ورود و خروج با موقعیت جغرافیایی
        </p>
      </div>

      {/* Check In/Out Card */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-full h-1 ${isCheckedIn ? 'bg-success' : 'bg-foreground-muted/30'}`} />
        <CardContent className="flex flex-col items-center gap-4 p-6 pt-8">
          <div
            className={`flex size-16 items-center justify-center rounded-full ${
              isCheckedIn ? 'bg-success/15 text-success' : 'bg-surface-container-high text-foreground-muted'
            }`}
          >
            {isCheckedIn ? (
              <CheckCircle className="size-8" />
            ) : (
              <Clock className="size-8" />
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">
              {isCheckedIn ? 'در حال خدمت' : 'خارج از خدمت'}
            </div>
            {todayRecord && (
              <div className="mt-1 text-xs text-foreground-muted">
                ورود: {toFa(new Date(todayRecord.checkInTime).toLocaleTimeString('fa-IR'))}
                {todayRecord.checkOutTime && (
                  <> — خروج: {toFa(new Date(todayRecord.checkOutTime).toLocaleTimeString('fa-IR'))}</>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {!isCheckedIn ? (
              <Button onClick={handleCheckIn} disabled={checking}>
                <LogIn className="size-4" />
                ثبت ورود
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleCheckOut} disabled={checking}>
                <LogOut className="size-4" />
                ثبت خروج
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">تاریخچه حضور</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-background-subtle"
                />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground-muted">
              سوابق حضوری ثبت نشده است
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-outline-variant p-3 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="size-4 text-foreground-muted" />
                    <div>
                      <div className="text-sm">
                        {jalali(r.checkInTime)}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {toFa(new Date(r.checkInTime).toLocaleTimeString('fa-IR'))}
                        {r.checkOutTime && (
                          <> — {toFa(new Date(r.checkOutTime).toLocaleTimeString('fa-IR'))}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      r.checkOutTime
                        ? 'bg-success/15 text-success'
                        : 'bg-warning/15 text-warning'
                    }
                  >
                    {r.checkOutTime ? 'تکمیل شده' : 'فعال'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
