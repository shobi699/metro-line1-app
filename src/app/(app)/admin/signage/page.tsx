'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { jalali, faTime } from '@/lib/fa'
import { Tv, Plus, Trash, Play, Pause, Save, RefreshCw, Layers, MapPin, Eye } from 'lucide-react'

interface ScreenDef {
  id: string
  name: string
  location: string | null
  pairCode: string
  playlistId: string | null
  isOnline: boolean
  lastSeenAt: string | null
}

interface PlaylistDef {
  id: string
  name: string
  items: PlaylistItemDef[]
  isActive: boolean
}

interface PlaylistItemDef {
  type: 'post' | 'roster_today' | 'clock' | 'weather' | 'custom_html'
  seconds: number
  refId?: string
  customHtml?: string
}

export default function AdminSignagePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [screens, setScreens] = useState<ScreenDef[]>([])
  const [playlists, setPlaylists] = useState<PlaylistDef[]>([])
  const [loading, setLoading] = useState(true)

  // Tabs: 'screens' | 'playlists'
  const [activeTab, setActiveTab] = useState<'screens' | 'playlists'>('screens')

  // Screen creation state
  const [newScreenName, setNewScreenName] = useState('')
  const [newScreenLoc, setNewScreenLoc] = useState('')
  const [creatingScreen, setCreatingScreen] = useState(false)

  // Playlist builder state
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistDef | null>(null)
  const [selectedItems, setSelectedItems] = useState<PlaylistItemDef[]>([])
  const [playlistName, setPlaylistName] = useState('')
  const [postsList, setPostsList] = useState<any[]>([])

  const loadData = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const [resScreens, resPlaylists, resPosts] = await Promise.all([
        fetch('/api/admin/signage/screens', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/admin/signage/playlists', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/posts?scope=admin', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])

      if (resScreens.ok && resPlaylists.ok && resPosts.ok) {
        const dataScreens = await resScreens.json()
        const dataPlaylists = await resPlaylists.json()
        const dataPosts = await resPosts.json()

        setScreens(dataScreens.data || [])
        setPlaylists(dataPlaylists.data || [])
        setPostsList(dataPosts.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch signage data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [accessToken])

  // Create screen
  const handleCreateScreen = async () => {
    if (!newScreenName.trim() || !accessToken) return
    setCreatingScreen(true)
    try {
      const res = await fetch('/api/admin/signage/screens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newScreenName, location: newScreenLoc || null }),
      })

      if (res.ok) {
        setNewScreenName('')
        setNewScreenLoc('')
        loadData()
      }
    } catch (err) {
      console.error('Failed to create screen:', err)
    } finally {
      setCreatingScreen(false)
    }
  }

  // Update screen playlist
  const handleAssignPlaylist = async (screenId: string, playlistId: string | null) => {
    if (!accessToken) return
    try {
      const res = await fetch(`/api/admin/signage/screens/${screenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ playlistId }),
      })

      if (res.ok) {
        loadData()
      }
    } catch (err) {
      console.error('Failed to assign playlist:', err)
    }
  }

  // Delete screen
  const handleDeleteScreen = async (screenId: string) => {
    if (!confirm('آیا از حذف این نمایشگر مطمئن هستید؟') || !accessToken) return
    try {
      const res = await fetch(`/api/admin/signage/screens/${screenId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to delete screen:', err)
    }
  }

  // Playlist Editor
  const openPlaylistEditor = (pl: PlaylistDef | null) => {
    if (pl) {
      setEditingPlaylist(pl)
      setPlaylistName(pl.name)
      setSelectedItems(pl.items)
    } else {
      setEditingPlaylist(null)
      setPlaylistName('')
      setSelectedItems([{ type: 'clock', seconds: 15 }])
    }
  }

  const addPlaylistItem = (type: PlaylistItemDef['type']) => {
    setSelectedItems((prev) => [...prev, { type, seconds: 15 }])
  }

  const removePlaylistItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePlaylistItem = (index: number, fields: Partial<PlaylistItemDef>) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...fields } : item))
    )
  }

  const handleSavePlaylist = async () => {
    if (!playlistName.trim() || !accessToken) return
    try {
      const url = editingPlaylist
        ? `/api/admin/signage/playlists/${editingPlaylist.id}`
        : '/api/admin/signage/playlists'
      const method = editingPlaylist ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: playlistName, items: selectedItems }),
      })

      if (res.ok) {
        setEditingPlaylist(null)
        loadData()
      }
    } catch (err) {
      console.error('Failed to save playlist:', err)
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('آیا از حذف این پلی‌لیست مطمئن هستید؟') || !accessToken) return
    try {
      const res = await fetch(`/api/admin/signage/playlists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) loadData()
    } catch (err) {
      console.error('Failed to delete playlist:', err)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar title="مدیریت تلویزیون‌های دیجیتال (Signage)" subtitle="پیکربندی چرخه‌های پخش و پایش آنلاین مانیتورها" showHealth />

      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Button
            variant={activeTab === 'screens' ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTab('screens')
              setEditingPlaylist(null)
            }}
            className="text-xs font-semibold rounded-lg h-9"
          >
            <Tv className="size-4 shrink-0" />
            <span>مانیتورهای متصل ({screens.length})</span>
          </Button>
          <Button
            variant={activeTab === 'playlists' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('playlists')}
            className="text-xs font-semibold rounded-lg h-9"
          >
            <Layers className="size-4 shrink-0" />
            <span>پلی‌لیست‌های چرخشی ({playlists.length})</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            className="h-9 w-9 cursor-pointer"
            title="بروزرسانی وضعیت"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-foreground-muted text-xs">در حال بارگذاری اطلاعات...</div>
        ) : activeTab === 'screens' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Screen List (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              {screens.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center text-foreground-muted text-xs">
                  هیچ مانیتور فعالی ثبت نشده است. مانیتور جدیدی اضافه کنید.
                </div>
              ) : (
                screens.map((screen) => (
                  <Card key={screen.id} className="border-border hover:border-accent/30 transition-colors">
                    <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${screen.isOnline ? 'bg-success/10 text-success' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Tv className="size-5 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{screen.name}</span>
                            <Badge variant={screen.isOnline ? 'status-success' : 'outline'} className="text-[10px] py-0">
                              {screen.isOnline ? 'برخط' : 'آفلاین'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-muted mt-1">
                            <MapPin className="size-3 shrink-0" />
                            <span>موقعیت: {screen.location || 'ثبت نشده'}</span>
                            <span className="text-border">|</span>
                            <span>کد جفت‌سازی: </span>
                            <span className="font-mono text-foreground font-semibold tracking-wider select-all">{screen.pairCode}</span>
                          </div>
                          {screen.lastSeenAt && (
                            <p className="text-[10px] text-foreground-muted mt-0.5">
                              آخرین اتصال: {jalali(screen.lastSeenAt)} ساعت {faTime(screen.lastSeenAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <div className="flex flex-col gap-1 w-full md:w-48">
                          <label className="text-[10px] font-bold text-foreground-muted">پلی‌لیست چرخشی</label>
                          <select
                            value={screen.playlistId || ''}
                            onChange={(e) => handleAssignPlaylist(screen.id, e.target.value || null)}
                            className="bg-[#18181b] text-xs border border-border rounded-lg p-2 text-white outline-none cursor-pointer"
                          >
                            <option value="">پیش‌فرض (خالی)</option>
                            {playlists.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {pl.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteScreen(screen.id)}
                          className="hover:bg-destructive/10 hover:text-destructive text-foreground-muted cursor-pointer shrink-0"
                          title="حذف مانیتور"
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Screen Creator Form (1 Col) */}
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">ثبت مانیتور جدید</CardTitle>
                  <CardDescription className="text-xs">یک مانیتور جدید به مجموعه سیستم اعلانات فیزیکی اضافه کنید.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">نام مانیتور</Label>
                    <Input
                      value={newScreenName}
                      onChange={(e) => setNewScreenName(e.target.value)}
                      placeholder="مثال: مانیتور نگهبانی دپو"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">موقعیت فیزیکی</Label>
                    <Input
                      value={newScreenLoc}
                      onChange={(e) => setNewScreenLoc(e.target.value)}
                      placeholder="مثال: دپو مهرشهر - سالن ۱"
                    />
                  </div>
                  <Button
                    onClick={handleCreateScreen}
                    disabled={creatingScreen || !newScreenName.trim()}
                    className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>تولید کد جفت‌سازی</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playlist Editor (2 Cols) or Creator */}
            {editingPlaylist !== null || playlists.length === 0 ? (
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-border">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                    <div>
                      <CardTitle className="text-sm font-bold">
                        {editingPlaylist ? `ویرایش پلی‌لیست: ${editingPlaylist.name}` : 'ایجاد پلی‌لیست چرخشی جدید'}
                      </CardTitle>
                      <CardDescription className="text-xs">آیتم‌های پخش را بر اساس زمان اولویت‌بندی و زمان‌بندی کنید.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingPlaylist(null)} className="text-xs rounded-lg cursor-pointer">
                        انصراف
                      </Button>
                      <Button onClick={handleSavePlaylist} disabled={!playlistName.trim()} className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg cursor-pointer h-8">
                        <Save className="size-4 shrink-0" />
                        <span>ذخیره پلی‌لیست</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-1.5 max-w-sm">
                      <Label className="text-xs">نام پلی‌لیست</Label>
                      <Input
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder="مثال: پلی‌لیست اداری دپو"
                      />
                    </div>

                    {/* Build Playlist Item List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">آیتم‌های پخش چرخشی:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => addPlaylistItem('clock')} className="text-[10px] h-7 rounded">ساعت</Button>
                          <Button size="sm" variant="outline" onClick={() => addPlaylistItem('weather')} className="text-[10px] h-7 rounded">آب و هوا</Button>
                          <Button size="sm" variant="outline" onClick={() => addPlaylistItem('roster_today')} className="text-[10px] h-7 rounded">لوحه امروز</Button>
                          <Button size="sm" variant="outline" onClick={() => addPlaylistItem('post')} className="text-[10px] h-7 rounded">اطلاعیه</Button>
                          <Button size="sm" variant="outline" onClick={() => addPlaylistItem('custom_html')} className="text-[10px] h-7 rounded">HTML سفارشی</Button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        {selectedItems.map((item, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-zinc-900/20">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-bold text-red-500 font-mono">#{idx + 1}</span>
                              <Badge className="text-[10px]">
                                {item.type === 'clock' ? 'ساعت جلالی' :
                                 item.type === 'weather' ? 'وضعیت آب و هوا' :
                                 item.type === 'roster_today' ? 'لوحه و سفرهای امروز' :
                                 item.type === 'post' ? 'اطلاعیه / بخشنامه' : 'HTML سفارشی'}
                              </Badge>

                              {/* If type is 'post', select post */}
                              {item.type === 'post' && (
                                <select
                                  value={item.refId || ''}
                                  onChange={(e) => updatePlaylistItem(idx, { refId: e.target.value })}
                                  className="bg-black text-[11px] border border-border rounded p-1 text-white max-w-xs cursor-pointer outline-none"
                                >
                                  <option value="">انتخاب اطلاعیه...</option>
                                  {postsList
                                    .filter((p) => p.status === 'published' || p.published)
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.title}
                                      </option>
                                    ))}
                                </select>
                              )}

                              {/* If type is 'custom_html' */}
                              {item.type === 'custom_html' && (
                                <Input
                                  value={item.customHtml || ''}
                                  onChange={(e) => updatePlaylistItem(idx, { customHtml: e.target.value })}
                                  placeholder="<p>متن سفارشی با تگ‌های html</p>"
                                  className="h-7 text-[11px] bg-black border-zinc-800 text-white w-64"
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-auto">
                              <div className="flex items-center gap-1.5 text-xs text-foreground-muted shrink-0">
                                <span>مدت نمایش (ثانیه):</span>
                                <Input
                                  type="number"
                                  value={item.seconds}
                                  onChange={(e) => updatePlaylistItem(idx, { seconds: parseInt(e.target.value) || 5 })}
                                  className="w-14 h-7 text-center text-xs bg-black text-white p-0"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePlaylistItem(idx)}
                                className="h-7 w-7 text-foreground-muted hover:text-destructive cursor-pointer hover:bg-destructive/10"
                              >
                                <Trash className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="lg:col-span-2 space-y-4">
                {playlists.map((pl) => (
                  <Card key={pl.id} className="border-border hover:border-accent/20 transition-colors">
                    <CardContent className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-accent/10 text-accent">
                          <Layers className="size-5 shrink-0" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{pl.name}</h4>
                          <p className="text-xs text-foreground-muted mt-1">
                            شامل {pl.items.length} آیتم پخش چرخشی
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPlaylistEditor(pl)}
                          className="text-xs rounded-lg cursor-pointer h-8"
                        >
                          ویرایش آیتم‌ها
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePlaylist(pl.id)}
                          className="hover:bg-destructive/10 hover:text-destructive text-foreground-muted cursor-pointer shrink-0"
                          title="حذف پلی‌لیست"
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Playlist Sidebar Details */}
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">پلی‌لیست‌های پیش‌فرض</CardTitle>
                  <CardDescription className="text-xs">با کلیک روی دکمه زیر می‌توانید یک پلی‌لیست تبلیغاتی یا عمومی جدید ایجاد کنید.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPlaylist === null && (
                    <Button
                      onClick={() => openPlaylistEditor(null)}
                      className="w-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>ایجاد پلی‌لیست چرخشی</span>
                    </Button>
                  )}
                  <div className="bg-zinc-950 p-4 rounded-lg text-xs leading-relaxed text-zinc-400 space-y-2 border border-zinc-800">
                    <p className="font-bold text-white">💡 نحوه مدیریت تلویزیون‌ها:</p>
                    <p>۱. مانیتور ایستگاه را باز کرده و کد جفت‌سازی نمایش داده شده را کپی کنید.</p>
                    <p>۲. مانیتور را از زبانه اول همین پنل ثبت کنید.</p>
                    <p>۳. یک پلی‌لیست چرخشی بسازید و اسلایدها را در آن بچینید.</p>
                    <p>۴. پلی‌لیست را به مانیتور متصل کنید؛ مانیتور به صورت برخط و بدون نیاز به ورود محتوا را لوپ می‌کند.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
