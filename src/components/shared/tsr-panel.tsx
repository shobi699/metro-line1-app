'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'

interface TsrEntry {
  id: string
  section: string
  speedLimit: number
  reason: string
}

export function TsrPanel() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [entries, setEntries] = useState<TsrEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [section, setSection] = useState('')
  const [speedLimit, setSpeedLimit] = useState(30)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  async function loadTsr() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/tsr', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setEntries(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTsr()
  }, [accessToken])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!section || !reason) return
    setError(null)

    try {
      const res = await fetch('/api/tsr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ section, speedLimit: Number(speedLimit), reason }),
      })
      if (res.ok) {
        setIsAdding(false)
        setSection('')
        setSpeedLimit(30)
        setReason('')
        void loadTsr()
      } else {
        const json = await res.json()
        setError(json.error || 'خطا در ثبت محدودیت سرعت')
      }
    } catch {
      setError('خطای ارتباط با سرور')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/tsr/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        void loadTsr()
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-warning" />
          <span className="font-label-md text-foreground">
            {"\u0645\u062d\u062f\u0648\u062f\u06cc\u062a\u200c\u0647\u0627\u06cc \u0633\u0631\u0639\u062a \u0645\u0648\u0642\u062a (TSR)"}
          </span>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-[10px] font-semibold gap-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md cursor-pointer"
          >
            <Plus className="size-3" />
            <span>{"\u0627\u0641\u0632\u0648\u062f\u0646 \u0645\u062d\u062f\u0648\u062f\u06cc\u062a \u062c\u062f\u06cc\u062f"}</span>
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-inverse-surface/10 text-foreground-muted border-b border-outline-variant">
              <th className="p-2.5 text-start text-xs font-semibold">{"\u0642\u0637\u0639\u0647"}</th>
              <th className="p-2.5 text-start text-xs font-semibold">{"\u062d\u062f \u0633\u0631\u0639\u062a"}</th>
              <th className="p-2.5 text-start text-xs font-semibold">{"\u062f\u0644\u06cc\u0644"}</th>
              {isAdmin && <th className="p-2.5 text-center text-xs font-semibold w-16">{"\u0639\u0645\u0644\u06cc\u0627\u062a"}</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="p-4 text-center text-xs text-foreground-muted">
                  ...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="p-4 text-center text-xs text-foreground-muted">
                  {"\u0647\u06cc\u0686 \u0645\u062d\u062f\u0648\u062f\u06cc\u062a \u0633\u0631\u0639\u062a \u0645\u0648\u0642\u062a\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a"}
                </td>
              </tr>
            ) : (
              entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-outline-variant last:border-0 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-container-low'}`}
                >
                  <td className="p-2.5 font-data-mono text-xs text-foreground">{entry.section}</td>
                  <td className="p-2.5 font-data-mono text-xs font-bold text-critical">
                    {toFa(entry.speedLimit)} km/h
                  </td>
                  <td className="p-2.5 text-xs text-foreground-muted">{entry.reason}</td>
                  {isAdmin && (
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-critical/70 hover:text-critical p-1 rounded hover:bg-critical/10 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add TSR Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant w-full max-w-sm rounded-lg p-5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-4 left-4 text-foreground-muted hover:text-foreground p-1 rounded hover:bg-border/20 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-1.5 border-b border-outline-variant pb-2">
              <AlertTriangle className="size-4 text-warning" />
              <span>{"\u062b\u0628\u062a \u0645\u062d\u062f\u0648\u062f\u06cc\u062a \u0633\u0631\u0639\u062a \u0645\u0648\u0642\u062a"}</span>
            </h3>

            <form onSubmit={handleAdd} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] text-foreground-muted">{"\u0646\u0627\u0645 \u0642\u0637\u0639\u0647 (\u0645\u062b\u0627\u0644: T-104)"}</label>
                <input
                  type="text"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-background-subtle border border-outline-variant rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-foreground-muted">{"\u062d\u062f\u0627\u06a9\u062b\u0631 \u0633\u0631\u0639\u062a \u0645\u062c\u0627\u0632 (km/h)"}</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={120}
                  value={speedLimit}
                  onChange={(e) => setSpeedLimit(Number(e.target.value))}
                  className="w-full bg-background-subtle border border-outline-variant rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-foreground-muted">{"\u0639\u0644\u062a \u0645\u062d\u062f\u0648\u062f\u06cc\u062a (\u0645\u062b\u0627\u0644: \u062a\u0639\u0645\u06cc\u0631\u062a \u062e\u0637)"}</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-background-subtle border border-outline-variant rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {error && (
                <div className="text-[10px] text-critical bg-critical/10 border border-critical/20 rounded p-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  {"\u0627\u0646\u0635\u0631\u0627\u0641"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-8 cursor-pointer"
                >
                  {"\u062b\u0628\u062a"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
