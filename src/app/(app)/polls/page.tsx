'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toFa, jalali } from '@/lib/fa'
import { Vote, CheckCircle } from 'lucide-react'

interface PollOption {
  id: string
  label: string
  _count: { votes: number }
}

interface Poll {
  id: string
  title: string
  description: string | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  options: PollOption[]
  creator?: { name: string }
  totalVotes: number
  userVote?: string | null
}

export default function PollsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadPolls()
  }, [accessToken])

  async function loadPolls() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/polls', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPolls(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    if (!accessToken) return
    const res = await fetch('/api/polls', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pollId, optionId }),
    })
    if (res.ok) loadPolls()
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
          <Vote className="size-6 text-accent" />
          نظرسنجی‌ها
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          مشارکت در نظرسنجی‌های فعال سازمان
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-border bg-background-subtle"
            />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Vote className="mb-3 size-10 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">نظرسنجی فعالی وجود ندارد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{poll.title}</CardTitle>
                {poll.description && (
                  <p className="text-xs text-foreground-muted">{poll.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {poll.options.map((opt) => {
                  const percentage =
                    poll.totalVotes > 0
                      ? Math.round((opt._count.votes / poll.totalVotes) * 100)
                      : 0
                  const isSelected = poll.userVote === opt.id

                  return (
                    <div key={opt.id}>
                      <button
                        onClick={() => !poll.userVote && handleVote(poll.id, opt.id)}
                        disabled={!!poll.userVote}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10'
                            : 'border-outline-variant hover:bg-surface-container-low'
                        } ${poll.userVote ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                      >
                        <div className="flex-1 text-start">{opt.label}</div>
                        {poll.userVote && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-container-high">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-10 text-center font-data-mono text-xs text-foreground-muted">
                              {toFa(percentage)}%
                            </span>
                            {isSelected && (
                              <CheckCircle className="size-4 text-accent" />
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>{toFa(poll.totalVotes)} رأی</span>
                  {poll.expiresAt && (
                    <span>پایان: {jalali(poll.expiresAt)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
