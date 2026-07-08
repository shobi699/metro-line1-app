'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Loader2, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  userId: string
  points: number
  user?: {
    id: string
    name: string
  }
}

export default function LeaderboardPage() {
  const [dataAllTime, setDataAllTime] = useState<LeaderboardEntry[]>([])
  const [dataMonthly, setDataMonthly] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date()
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [allRes, monthRes] = await Promise.all([
          fetch('/api/learning/leaderboard'),
          fetch(`/api/learning/leaderboard?period=${period}`)
        ])

        const allData = await allRes.json()
        const monthData = await monthRes.json()

        setDataAllTime(allData.data || [])
        setDataMonthly(monthData.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>
  }

  const renderList = (items: LeaderboardEntry[]) => {
    if (items.length === 0) {
      return <div className="text-center p-8 text-muted-foreground">هیچ امتیازی ثبت نشده است.</div>
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.userId} 
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border bg-card transition-all hover:shadow-md",
              item.rank === 1 && "border-yellow-500/50 bg-yellow-500/5",
              item.rank === 2 && "border-slate-400/50 bg-slate-400/5",
              item.rank === 3 && "border-amber-600/50 bg-amber-600/5"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">
                {renderRankIcon(item.rank)}
              </div>
              
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {item.user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-semibold text-sm">
                  {item.user?.name}
                </h3>
                {item.rank <= 3 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3" /> برترین‌های آموزش
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-lg font-bold text-primary">{item.points}</span>
              <span className="text-xs text-muted-foreground">امتیاز</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl border border-primary/20">
        <div className="p-4 bg-primary/20 rounded-full">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">رده‌بندی آموزشی</h1>
        <p className="text-muted-foreground max-w-xl">
          با شرکت در دوره‌ها و قبولی در آزمون‌ها امتیاز کسب کنید و جایگاه خود را در سازمان ارتقا دهید.
        </p>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="monthly">برترین‌های این ماه</TabsTrigger>
            <TabsTrigger value="alltime">رکوردداران (کل دوره)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>جدول رده‌بندی ماهانه</CardTitle>
                <CardDescription>امتیازات کسب شده در ماه جاری</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  renderList(dataMonthly)
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alltime" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>قهرمانان آموزش</CardTitle>
                <CardDescription>مجموع امتیازات از ابتدا تاکنون</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  renderList(dataAllTime)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
