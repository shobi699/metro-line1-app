'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Users,
  Radio,
  Wifi,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Shield,
  User,
  Info,
  Check,
  X
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Participant {
  id: string
  name: string
  role: string
  isMuted: boolean
  isSpeaking: boolean
  avatarColor: string
}

interface VoiceRoom {
  id: string
  name: string
  allowedAccess: 'public' | 'role' | 'shift' | 'manual'
  allowedRoles?: string[]
  allowedShifts?: string[]
  allowedUsers?: string[]
  isEmergency: boolean
  creatorName: string
  creatorId: string
  participantsCount: number
  isDefaultMuted: boolean
}

export default function AudioConferencePage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  
  const [rooms, setRooms] = useState<VoiceRoom[]>([])
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setConfig(data.data)
        }
      })
      .catch(() => {})
  }, [])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [myMuted, setMyMuted] = useState(false)
  const [myDeaf, setMyDeaf] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  
  // Room Creation Form States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomAccess, setNewRoomAccess] = useState<'public' | 'role' | 'shift' | 'manual'>('public')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isEmergency, setIsEmergency] = useState(false)
  const [isDefaultMuted, setIsDefaultMuted] = useState(false)

  // Simulation speaker states
  const [pulse, setPulse] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Mock list of database personnel for manual selection
  const mockPersonnel = [
    { id: 'u1', name: 'مهندس حسینی', role: 'کنترلر ارشد OCC' },
    { id: 'u2', name: 'حمید شریفی', role: 'راهبر قطار' },
    { id: 'u3', name: 'سارا احمدی', role: 'رئیس ایستگاه' },
    { id: 'u4', name: 'علی رضایی', role: 'تکنسین فنی ریل' },
    { id: 'u5', name: 'مریم محسنی', role: 'اپراتور سکو' }
  ]

  // Load Initial Rooms
  useEffect(() => {
    setRooms([
      {
        id: 'room-1',
        name: 'اتاق دیسپاچینگ مرکزی OCC',
        allowedAccess: 'public',
        isEmergency: true,
        creatorName: 'سیستم',
        creatorId: 'sys',
        participantsCount: 4,
        isDefaultMuted: false
      },
      {
        id: 'room-2',
        name: 'کمیته هماهنگی بحران و سوانح خط ۱',
        allowedAccess: 'role',
        allowedRoles: ['admin', 'super_admin'],
        isEmergency: true,
        creatorName: 'مهندس حسینی (OCC)',
        creatorId: 'u1',
        participantsCount: 1,
        isDefaultMuted: true
      },
      {
        id: 'room-3',
        name: 'راهبری و فنی دپوی کهریزک (گروه A)',
        allowedAccess: 'shift',
        allowedShifts: ['A', 'morning'],
        isEmergency: false,
        creatorName: 'علی رضایی (فنی)',
        creatorId: 'u4',
        participantsCount: 2,
        isDefaultMuted: false
      },
      {
        id: 'room-4',
        name: 'گروه گفت‌وگوی امن مدیران ارشد',
        allowedAccess: 'manual',
        allowedUsers: ['مدیر سامانه', 'مهندس حسینی'],
        isEmergency: false,
        creatorName: 'مدیر سامانه',
        creatorId: 'admin-id',
        participantsCount: 1,
        isDefaultMuted: true
      }
    ])

    setParticipants([
      { id: '1', name: 'مهندس حسینی (OCC)', role: 'کنترلر ارشد دیسپاچینگ', isMuted: false, isSpeaking: false, avatarColor: 'bg-accent/10 text-accent' },
      { id: '2', name: 'حمید شریفی (راهبر)', role: 'راهبر رام ۱۰۴', isMuted: true, isSpeaking: false, avatarColor: 'bg-warning/10 text-warning' },
      { id: '3', name: 'سارا احمدی (ایستگاه)', role: 'رئیس ایستگاه دروازه دولت', isMuted: false, isSpeaking: false, avatarColor: 'bg-success/10 text-success' },
      { id: '4', name: 'علی رضایی (فنی)', role: 'تکنسین کشش ریل', isMuted: false, isSpeaking: false, avatarColor: 'bg-info/10 text-info' },
    ])
  }, [])

  // Simulating active speakers
  useEffect(() => {
    if (!joined) return
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isMuted) return { ...p, isSpeaking: false }
          const speak = Math.random() > 0.6
          return { ...p, isSpeaking: speak }
        })
      )
    }, 2800)

    const pulseInterval = setInterval(() => {
      setPulse((p) => !p)
    }, 850)

    return () => {
      clearInterval(interval)
      clearInterval(pulseInterval)
    }
  }, [joined])

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  const playSystemTone = (freq: number, duration: number) => {
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // silent fallback
    }
  }

  const checkRoomPermission = (room: VoiceRoom): boolean => {
    if (!user) return false
    
    // Super admin bypassing
    if (user.roleKey === 'super_admin' || user.roleKey === 'admin') return true

    if (room.allowedAccess === 'public') return true

    if (room.allowedAccess === 'role') {
      const userRole = user.roleKey || 'operator'
      return room.allowedRoles?.includes(userRole) ?? false
    }

    if (room.allowedAccess === 'shift') {
      // user shift metadata checking
      const userShift = (user.customFields as any)?.workShiftGroup || 'A'
      return room.allowedShifts?.includes(userShift) ?? false
    }

    if (room.allowedAccess === 'manual') {
      const userName = user.name || ''
      return room.allowedUsers?.some(u => userName.includes(u) || u.includes(userName)) ?? false
    }

    return false
  }

  const handleJoinRoom = (room: VoiceRoom) => {
    if (!checkRoomPermission(room)) {
      alert('شما مجوز لازم برای ورود به این اتاق صوتی را ندارید.')
      return
    }

    const maxParticipants = config?.comms?.maxConferenceParticipants ?? 15
    if (room.participantsCount >= maxParticipants) {
      alert(`این کانال صوتی تکمیل ظرفیت شده است (حداکثر ظرفیت: ${toFa(maxParticipants)} نفر).`)
      return
    }

    if (activeRoomId === room.id && joined) return

    playSystemTone(440, 0.15)
    setTimeout(() => playSystemTone(880, 0.15), 150)
    
    setActiveRoomId(room.id)
    setJoined(true)
    setMyMuted(room.isDefaultMuted)
  }

  const handleLeave = () => {
    playSystemTone(330, 0.2)
    setJoined(false)
    setActiveRoomId(null)
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim() || !user) return

    const newRoom: VoiceRoom = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      allowedAccess: newRoomAccess,
      allowedRoles: newRoomAccess === 'role' ? selectedRoles : undefined,
      allowedShifts: newRoomAccess === 'shift' ? selectedShifts : undefined,
      allowedUsers: newRoomAccess === 'manual' ? selectedUsers : undefined,
      isEmergency: isEmergency,
      creatorName: user.name || 'مدیر',
      creatorId: user.id || 'admin',
      participantsCount: 0,
      isDefaultMuted: isDefaultMuted
    }

    setRooms((prev) => [...prev, newRoom])
    setShowCreateModal(false)
    
    // reset form
    setNewRoomName('')
    setNewRoomAccess('public')
    setSelectedRoles([])
    setSelectedShifts([])
    setSelectedUsers([])
    setIsEmergency(false)
    setIsDefaultMuted(false)

    playSystemTone(600, 0.1)
  }

  const handleDeleteRoom = (roomId: string) => {
    if (activeRoomId === roomId) {
      handleLeave()
    }
    setRooms((prev) => prev.filter(r => r.id !== roomId))
    playSystemTone(250, 0.2)
  }

  const handleToggleMuteAll = () => {
    playSystemTone(400, 0.08)
    setParticipants((prev) => prev.map(p => ({ ...p, isMuted: true, isSpeaking: false })))
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null
  const isCreatorOrAdmin = activeRoom ? (activeRoom.creatorId === user?.id || user?.roleKey === 'admin' || user?.roleKey === 'super_admin') : false

  if (config && config.comms?.conferenceEnabled === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center" dir="rtl">
        <div className="w-full max-w-md rounded-lg border border-critical/30 bg-surface-container-low/40 backdrop-blur-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-[3px] w-full bg-gradient-to-l from-critical via-transparent to-critical" />
          <div className="flex flex-col items-center gap-3 text-critical">
            <Shield className="size-12 animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">سیستم کنفرانس صوتی غیرفعال است</h1>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            امکان ارتباط صوتی گروهی و کنفرانس دیسپاچینگ در حال حاضر توسط مدیریت سامانه غیرفعال شده است. لطفاً از شبیه‌ساز بی‌سیم TETRA یا پیام‌رسان متنی استفاده کنید.
          </p>
          <div className="text-[10px] text-foreground-muted font-mono tracking-wider">
            AUDIO CONFERENCE SYSTEM OFF
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background text-foreground p-6 gap-6 text-right transition-colors duration-150" dir="rtl">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* RIGHT PANEL: Voice Channels List / Sidebar */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-96 flex flex-col border border-border p-4 bg-surface-container-low rounded-lg shrink-0 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Radio className="size-4 text-accent" />
              کانال‌های صوتی فعال
            </h2>
            <p className="text-[10px] text-foreground-muted mt-0.5 font-medium">اتاق صوتی مورد نظر را جهت ورود انتخاب کنید</p>
          </div>
          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-md px-2.5 h-8 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              ساخت اتاق
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {rooms.map((room) => {
            const hasAccess = checkRoomPermission(room)
            const isActive = activeRoomId === room.id

            return (
              <div
                key={room.id}
                onClick={() => hasAccess && handleJoinRoom(room)}
                className={`p-4 rounded-lg border transition-all text-right cursor-pointer flex flex-col justify-between relative ${
                  isActive
                    ? 'bg-accent/10 border-accent shadow-sm'
                    : hasAccess
                    ? 'bg-surface border-border hover:border-accent/40'
                    : 'bg-surface-container border-border-subtle opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Upper row: Name & Delete Option for Admins */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    {!hasAccess && <Lock className="size-3.5 text-foreground-muted shrink-0" />}
                    <h3 className={`text-xs font-semibold ${isActive ? 'text-accent' : 'text-foreground'}`}>
                      {room.name}
                    </h3>
                  </div>
                  {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteRoom(room.id)
                      }}
                      className="text-foreground-muted hover:text-accent p-1 rounded-md transition-colors"
                      title="حذف کانال صوتی"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Tags and Metadata */}
                <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-2 border-t border-border-subtle text-[10px] text-foreground-muted font-medium">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {room.isEmergency && (
                      <Badge variant="outline" className="bg-critical/10 text-critical border-critical/20 px-1.5 py-0.2 rounded-sm font-semibold text-[9px]">
                        اضطراری
                      </Badge>
                    )}
                    {room.allowedAccess === 'public' && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 px-1.5 py-0.2 rounded-sm text-[9px]">
                        عمومی
                      </Badge>
                    )}
                    {room.allowedAccess === 'role' && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 px-1.5 py-0.2 rounded-sm text-[9px]">
                        نقش سازمانی
                      </Badge>
                    )}
                    {room.allowedAccess === 'shift' && (
                      <Badge variant="outline" className="bg-info/10 text-info border-info/20 px-1.5 py-0.2 rounded-sm text-[9px]">
                        گروه شیفت
                      </Badge>
                    )}
                    {room.allowedAccess === 'manual' && (
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-1.5 py-0.2 rounded-sm text-[9px]">
                        محدود (شخصی)
                      </Badge>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground-muted">
                    <Users className="size-3 text-accent" />
                    {toFa(room.participantsCount.toString())} نفر حاضر
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* LEFT PANEL: Conference Room View */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[480px]">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Radio className={`size-5 text-accent ${joined ? 'animate-pulse' : ''}`} />
              کنفرانس صوتی خط ۱ مترو (OCC & Stations)
            </h1>
            <p className="text-xs text-foreground-muted mt-1 font-medium">
              اتاق صوتی رسمی ارتباطات لحظه‌ای دیسپاچینگ و فرماندهی عملیات
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-full shadow-sm">
              <Wifi className="size-3.5 text-success" />
              <span className="text-[10px] text-foreground-muted font-mono">RTT: {toFa('۳۲')}ms</span>
            </div>
            {joined && (
              <div className="flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full border border-success/20 text-success text-[10px] font-semibold">
                <span className="relative flex h-1.5 w-1.5 rounded-full bg-success">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                </span>
                اتصال برقرار است
              </div>
            )}
          </div>
        </div>

        {!joined ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto space-y-5 text-center">
            <div className="size-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm animate-pulse">
              <Users className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">پیوستن به کنفرانس فعال</h2>
              <p className="text-xs text-foreground-muted leading-relaxed font-medium">
                لطفاً از سایدبار سمت راست یکی از کانال‌های مجاز صوتی را انتخاب نمایید تا ارتباط زنده صوتی آغاز گردد.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-surface-container-low border border-border rounded-lg p-4 md:p-6 justify-between gap-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-2">
              <span className="text-xs font-semibold text-accent">
                اتاق فعال: {activeRoom?.name}
              </span>
              {isCreatorOrAdmin && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleToggleMuteAll}
                    className="bg-accent/10 border border-accent/20 text-accent text-xs h-8 px-3 rounded-md hover:bg-accent/15 font-semibold active:scale-95 transition-all cursor-pointer"
                  >
                    بی‌صدا کردن همه
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Current User Card */}
                <div className={`p-4 rounded-lg border transition-all flex flex-col justify-between items-center text-center gap-3 relative ${
                  !myMuted && !myDeaf ? 'bg-surface border-accent/40 shadow-sm' : 'bg-surface-container border-border-subtle/50'
                }`}>
                  {!myMuted && !myDeaf && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-[8px] font-semibold text-accent">
                      <Sparkles className="size-2.5" />
                      شما
                    </div>
                  )}
                  
                  <div className={`size-14 rounded-full flex items-center justify-center text-base font-semibold border transition-all ${
                    !myMuted && !myDeaf ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-container border-border text-foreground-muted'
                  }`}>
                    {user?.name?.substring(0, 1)}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">{user?.name} (شما)</span>
                    <span className="text-[10px] text-foreground-muted font-medium">{user?.roleKey === 'admin' ? 'مدیر سامانه' : 'اپراتور'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {myMuted || myDeaf ? (
                      <div className="bg-critical/10 p-1.5 rounded-full text-critical border border-critical/15">
                        <MicOff className="size-3.5" />
                      </div>
                    ) : (
                      <div className="bg-success/10 p-1.5 rounded-full text-success border border-success/15 animate-pulse">
                        <Mic className="size-3.5" />
                      </div>
                    )}
                    {myDeaf && (
                      <div className="bg-critical/10 p-1.5 rounded-full text-critical border border-critical/15">
                        <VolumeX className="size-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Participants */}
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-lg border transition-all flex flex-col justify-between items-center text-center gap-3 relative ${
                      p.isSpeaking && !myDeaf
                        ? 'bg-surface border-accent shadow-sm scale-[1.01]'
                        : 'bg-surface/60 border-border-subtle'
                    }`}
                  >
                    {p.isSpeaking && !myDeaf && (
                      <div className={`absolute inset-0 border border-accent/40 rounded-lg pointer-events-none transition-transform duration-300 ${pulse ? 'scale-103 opacity-20' : 'scale-100 opacity-40'}`} />
                    )}

                    <div className={`size-14 rounded-full flex items-center justify-center text-base font-semibold border transition-all ${
                      p.isSpeaking && !myDeaf
                        ? 'bg-accent/20 border-accent text-accent animate-pulse'
                        : 'bg-surface-container border-border-subtle text-foreground-muted'
                    }`}>
                      {p.name.substring(0, 1)}
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">{p.name}</span>
                      <span className="text-[10px] text-foreground-muted font-medium">{p.role}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.isMuted ? (
                        <div className="bg-surface-container p-1.5 rounded-full text-foreground-muted border border-border-subtle">
                          <MicOff className="size-3.5" />
                        </div>
                      ) : (
                        <div className={`p-1.5 rounded-full border ${p.isSpeaking && !myDeaf ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-container border-border-subtle text-foreground-muted'}`}>
                          <Mic className="size-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Control Toolbar */}
            <div className="bg-surface border border-border p-3.5 rounded-lg flex justify-between items-center flex-wrap gap-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-semibold text-foreground">
                  تعداد حاضرین: {toFa((participants.length + 1).toString())} نفر
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setMyMuted(!myMuted)}
                  variant={myMuted ? "default" : "outline"}
                  className={`size-10 rounded-full p-0 flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                    myMuted ? 'bg-critical hover:bg-critical/90 text-critical-foreground' : 'border-border hover:bg-surface-hover text-foreground'
                  }`}
                  title={myMuted ? "فعال کردن میکروفون" : "بی‌صدا کردن"}
                >
                  {myMuted ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                </Button>

                <Button
                  onClick={() => setMyDeaf(!myDeaf)}
                  variant={myDeaf ? "default" : "outline"}
                  className={`size-10 rounded-full p-0 flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                    myDeaf ? 'bg-critical hover:bg-critical/90 text-critical-foreground' : 'border-border hover:bg-surface-hover text-foreground'
                  }`}
                  title={myDeaf ? "شنیدن صداها" : "قطع صدای کنفرانس"}
                >
                  {myDeaf ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
                </Button>

                <Button
                  onClick={handleLeave}
                  className="bg-critical hover:bg-critical/90 text-critical-foreground size-10 rounded-full p-0 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="خروج از کنفرانس"
                >
                  <PhoneOff className="size-4.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAL: Create New Voice Room Form */}
      {/* ──────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg w-full max-w-lg p-6 space-y-5 shadow-xl animate-fade-in text-right">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">ساخت اتاق صوتی جدید</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-foreground-muted hover:text-foreground hover:bg-surface-hover p-1.5 rounded-md transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground-muted block">نام اتاق صوتی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: هماهنگی عملیات تجریش"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                  <label className="text-xs font-semibold text-foreground-muted">وضعیت اضطراری (بحرانی):</label>
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    className="accent-accent size-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                  <label className="text-xs font-semibold text-foreground-muted">بی‌صدا در بدو ورود:</label>
                  <input
                    type="checkbox"
                    checked={isDefaultMuted}
                    onChange={(e) => setIsDefaultMuted(e.target.checked)}
                    className="accent-accent size-4 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground-muted block">سطح دسترسی و امنیت:</label>
                <select
                  value={newRoomAccess}
                  onChange={(e) => setNewRoomAccess(e.target.value as any)}
                  className="h-9 w-full bg-surface border border-border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="public">عمومی (پیوستن آزاد برای همه)</option>
                  <option value="role">بر اساس نقش سازمانی (RBAC)</option>
                  <option value="shift">بر اساس گروه شیفت کاری</option>
                  <option value="manual">دسترسی محدود به افراد خاص</option>
                </select>
              </div>

              {/* Conditional permission parameters */}
              {newRoomAccess === 'role' && (
                <div className="space-y-2 bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                  <span className="text-[10px] font-semibold text-foreground-muted block">انتخاب نقش‌های مجاز:</span>
                  <div className="flex gap-4 flex-wrap">
                    {['admin', 'operator'].map((roleKey) => {
                      const label = roleKey === 'admin' ? 'مدیران سامانه' : 'اپراتورها / راهبران'
                      const isSelected = selectedRoles.includes(roleKey)
                      return (
                        <label key={roleKey} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedRoles(prev =>
                                isSelected ? prev.filter(r => r !== roleKey) : [...prev, roleKey]
                              )
                            }}
                            className="accent-accent"
                          />
                          <span className="text-foreground-muted font-medium">{label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {newRoomAccess === 'shift' && (
                <div className="space-y-2 bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                  <span className="text-[10px] font-semibold text-foreground-muted block">انتخاب گروه‌های شیفت مجاز:</span>
                  <div className="flex gap-4 flex-wrap">
                    {['A', 'B', 'C', 'morning', 'evening', 'night'].map((shift) => {
                      const isSelected = selectedShifts.includes(shift)
                      return (
                        <label key={shift} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedShifts(prev =>
                                isSelected ? prev.filter(s => s !== shift) : [...prev, shift]
                              )
                            }}
                            className="accent-accent"
                          />
                          <span className="text-foreground-muted font-medium">گروه {shift}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {newRoomAccess === 'manual' && (
                <div className="space-y-2 bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                  <span className="text-[10px] font-semibold text-foreground-muted block">انتخاب پرسنل مجاز:</span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {mockPersonnel.map((person) => {
                      const isSelected = selectedUsers.includes(person.name)
                      return (
                        <label key={person.id} className="flex items-center justify-between text-xs cursor-pointer p-1.5 hover:bg-surface-container rounded-md">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedUsers(prev =>
                                  isSelected ? prev.filter(u => u !== person.name) : [...prev, person.name]
                                )
                              }}
                              className="accent-accent"
                            />
                            <span className="text-foreground font-semibold">{person.name}</span>
                          </div>
                          <span className="text-[10px] text-foreground-muted font-medium">{person.role}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-border justify-end">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-transparent border border-border hover:bg-surface-hover text-foreground-muted hover:text-foreground rounded-md h-9 px-4 text-xs font-semibold transition-colors cursor-pointer"
                >
                  لغو
                </Button>
                <Button
                  type="submit"
                  disabled={!newRoomName.trim()}
                  className="bg-accent hover:bg-accent-hover text-accent-foreground rounded-md h-9 px-6 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  ایجاد اتاق صوتی
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
