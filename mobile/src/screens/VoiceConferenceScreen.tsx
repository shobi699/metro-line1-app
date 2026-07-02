import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Vibration,
  TextInput,
  Modal,
  Switch,
  FlatList,
} from 'react-native'
import { useTheme } from '../shared/ThemeProvider'
import { useAuthStore } from '../stores/auth'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Users,
  Radio,
  Wifi,
  Lock,
  Plus,
  Trash2,
  X,
  Check,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native'

interface Participant {
  id: string
  name: string
  role: string
  isMuted: boolean
  isSpeaking: boolean
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

export function VoiceConferenceScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user)
  
  const [rooms, setRooms] = useState<VoiceRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [myMuted, setMyMuted] = useState(false)
  const [myDeaf, setMyDeaf] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const { theme } = useTheme()
  const styles = React.useMemo(() => getStyles(theme), [theme])

  // Room Creation Modal & Form States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomAccess, setNewRoomAccess] = useState<'public' | 'role' | 'shift' | 'manual'>('public')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isEmergency, setIsEmergency] = useState(false)
  const [isDefaultMuted, setIsDefaultMuted] = useState(false)

  // Speaking Pulse animation simulation
  const [pulseScale, setPulseScale] = useState(1)
  const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const mockPersonnel = [
    { id: 'u1', name: 'مهندس حسینی', role: 'کنترلر ارشد OCC' },
    { id: 'u2', name: 'حمید شریفی', role: 'راهبر قطار' },
    { id: 'u3', name: 'سارا احمدی', role: 'رئیس ایستگاه' },
    { id: 'u4', name: 'علی رضایی', role: 'تکنسین فنی ریل' },
    { id: 'u5', name: 'مریم محسنی', role: 'اپراتور سکو' }
  ]

  // Web Audio Context for Tone Synthesis (runs on React Native Web)
  const playSystemTone = (freq: number, duration: number) => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (AudioContextClass) {
        const ctx = new AudioContextClass()
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
      }
    } catch (e) {
      // ignore
    }
  }

  // Load mock data
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
      { id: '1', name: 'مهندس حسینی (OCC)', role: 'کنترلر ارشد دیسپاچینگ', isMuted: false, isSpeaking: false },
      { id: '2', name: 'حمید شریفی (راهبر)', role: 'راهبر رام ۱۰۴', isMuted: true, isSpeaking: false },
      { id: '3', name: 'سارا احمدی (ایستگاه)', role: 'رئیس ایستگاه دروازه دولت', isMuted: false, isSpeaking: false },
      { id: '4', name: 'علی رضایی (فنی)', role: 'تکنسین کشش ریل', isMuted: false, isSpeaking: false },
    ])
  }, [])

  // Speaker Simulating & pulsating ring
  useEffect(() => {
    if (!joined) {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current)
        pulseIntervalRef.current = null
      }
      return
    }

    const speakerInterval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isMuted) return { ...p, isSpeaking: false }
          const speak = Math.random() > 0.6
          return { ...p, isSpeaking: speak }
        })
      )
    }, 3000)

    pulseIntervalRef.current = setInterval(() => {
      setPulseScale((prev) => (prev === 1 ? 1.25 : 1))
    }, 800)

    return () => {
      clearInterval(speakerInterval)
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current)
    }
  }, [joined])

  const checkRoomPermission = (room: VoiceRoom): boolean => {
    if (!user) return false
    
    // Admin bypassing
    if (user.roleKey === 'super_admin' || user.roleKey === 'admin') return true

    if (room.allowedAccess === 'public') return true

    if (room.allowedAccess === 'role') {
      const userRole = user.roleKey || 'operator'
      return room.allowedRoles?.includes(userRole) ?? false
    }

    if (room.allowedAccess === 'shift') {
      const userShift = (user.customFields as any)?.workShiftGroup || 'A'
      return room.allowedShifts?.includes(userShift) ?? false
    }

    if (room.allowedAccess === 'manual') {
      const userName = user.name || ''
      return room.allowedUsers?.some(u => userName.includes(u) || u.includes(userName)) ?? false
    }

    return false
  }

  const handleJoin = (room: VoiceRoom) => {
    if (!checkRoomPermission(room)) {
      Vibration.vibrate([0, 150])
      alert('شما مجوز لازم برای ورود به این کانال صوتی را ندارید.')
      return
    }

    Vibration.vibrate(80)
    playSystemTone(440, 0.15)
    setTimeout(() => playSystemTone(880, 0.15), 150)
    
    setActiveRoomId(room.id)
    setJoined(true)
    setMyMuted(room.isDefaultMuted)
  }

  const handleLeave = () => {
    Vibration.vibrate(50)
    playSystemTone(330, 0.2)
    setJoined(false)
    setActiveRoomId(null)
  }

  const handleCreateRoom = () => {
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
    
    // Reset Form
    setNewRoomName('')
    setNewRoomAccess('public')
    setSelectedRoles([])
    setSelectedShifts([])
    setSelectedUsers([])
    setIsEmergency(false)
    setIsDefaultMuted(false)

    Vibration.vibrate(70)
    playSystemTone(600, 0.15)
  }

  const handleDeleteRoom = (roomId: string) => {
    if (activeRoomId === roomId) {
      handleLeave()
    }
    Vibration.vibrate(100)
    setRooms((prev) => prev.filter(r => r.id !== roomId))
    playSystemTone(250, 0.2)
  }

  const handleToggleMuteAll = () => {
    Vibration.vibrate(50)
    playSystemTone(400, 0.08)
    setParticipants((prev) => prev.map(p => ({ ...p, isMuted: true, isSpeaking: false })))
  }

  const formatFarsiNumber = (num: number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null
  const isCreatorOrAdmin = activeRoom ? (activeRoom.creatorId === user?.id || user?.roleKey === 'admin' || user?.roleKey === 'super_admin') : false

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (joined) handleLeave()
            navigation.goBack()
          }}
          style={styles.backButton}
        >
          <ChevronRight size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Radio size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>کنفرانس صوتی خط ۱</Text>
        </View>
        {joined && (
          <View style={styles.headerLeft}>
            <Wifi size={14} color={theme.colors.success} />
            <Text style={styles.pingText}>پینگ: {formatFarsiNumber(32)}ms</Text>
          </View>
        )}
      </View>

      {!joined ? (
        // ────────────────────────────────────────────────────────
        // LOBBY: Active Rooms List
        // ────────────────────────────────────────────────────────
        <View style={styles.lobbyContainer}>
          <View style={styles.lobbyTitleBox}>
            <Text style={styles.lobbyTitle}>کانال‌های صوتی فعال</Text>
            {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={styles.createRoomBtn}
                activeOpacity={0.8}
              >
                <Plus size={16} color={theme.colors.onPrimary} />
                <Text style={styles.createRoomBtnText}>ساخت اتاق</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView contentContainerStyle={styles.roomsList}>
            {rooms.map((room) => {
              const hasAccess = checkRoomPermission(room)
              return (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => hasAccess && handleJoin(room)}
                  style={[
                    styles.roomCard,
                    hasAccess ? styles.roomCardAccessible : styles.roomCardInaccessible,
                  ]}
                  activeOpacity={hasAccess ? 0.7 : 0.9}
                >
                  <View style={styles.roomCardHeader}>
                    <View style={styles.roomCardTitleRow}>
                      {!hasAccess && <Lock size={14} color={theme.colors.secondary} style={styles.lockIcon} />}
                      <Text style={styles.roomCardName}>{room.name}</Text>
                    </View>
                    {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
                      <TouchableOpacity
                        onPress={() => handleDeleteRoom(room.id)}
                        style={styles.deleteRoomBtn}
                      >
                        <Trash2 size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.roomCardFooter}>
                    <View style={styles.roomBadgeRow}>
                      {room.isEmergency && (
                        <View style={[styles.badge, styles.badgeEmergency]}>
                          <Text style={styles.badgeEmergencyText}>اضطراری</Text>
                        </View>
                      )}
                      {room.allowedAccess === 'public' && (
                        <View style={[styles.badge, styles.badgePublic]}>
                          <Text style={styles.badgePublicText}>عمومی</Text>
                        </View>
                      )}
                      {room.allowedAccess === 'role' && (
                        <View style={[styles.badge, styles.badgeRole]}>
                          <Text style={styles.badgeRoleText}>نقش سازمانی</Text>
                        </View>
                      )}
                      {room.allowedAccess === 'shift' && (
                        <View style={[styles.badge, styles.badgeShift]}>
                          <Text style={styles.badgeShiftText}>گروه شیفت</Text>
                        </View>
                      )}
                      {room.allowedAccess === 'manual' && (
                        <View style={[styles.badge, styles.badgeManual]}>
                          <Text style={styles.badgeManualText}>محدود (شخصی)</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.roomCardUsers}>
                      حاضرین: {formatFarsiNumber(room.participantsCount)} نفر
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>توضیحات و حریم امنیتی:</Text>
            <Text style={styles.disclaimerDesc}>
              مکالمات این کنفرانس‌ها ضبط و در سیستم بازرسی دیسپاچینگ مرکزی ذخیره می‌شوند. ورود تنها با فرکانس مجاز پرسنلی مقدور است.
            </Text>
          </View>
        </View>
      ) : (
        // ────────────────────────────────────────────────────────
        // CONFERENCE: Active Joined Room Grid
        // ────────────────────────────────────────────────────────
        <View style={styles.conferenceContainer}>
          <View style={styles.activeRoomTitleBar}>
            <Text style={styles.activeRoomNameText}>اتاق فعال: {activeRoom?.name}</Text>
            {isCreatorOrAdmin && (
              <TouchableOpacity
                onPress={handleToggleMuteAll}
                style={styles.muteAllBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.muteAllBtnText}>بی‌صدا کردن همه</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.gridContainer}>
            <View style={styles.grid}>
              {/* Mine Card */}
              <View
                style={[
                  styles.participantCard,
                  !myMuted && !myDeaf ? styles.activeSpeakingCard : null,
                ]}
              >
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, styles.myAvatar]}>
                    <Text style={styles.avatarText}>{user?.name?.substring(0, 1)}</Text>
                  </View>
                  {!myMuted && !myDeaf && (
                    <View
                      style={[
                        styles.pulseRing,
                        { transform: [{ scale: pulseScale }] },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.mineBadgeBox}>
                  <Sparkles size={10} color={theme.colors.primary} />
                  <Text style={styles.mineBadgeText}>شما</Text>
                </View>
                <Text style={styles.cardName}>{user?.name}</Text>
                <Text style={styles.cardRole}>
                  {user?.roleKey === 'admin' ? 'مدیر سامانه' : 'اپراتور'}
                </Text>

                <View style={styles.statusIcons}>
                  {myMuted || myDeaf ? (
                    <View style={styles.statusMuteBadge}>
                      <MicOff size={12} color={theme.colors.primary} />
                    </View>
                  ) : (
                    <View style={styles.statusActiveBadge}>
                      <Mic size={12} color={theme.colors.success} />
                    </View>
                  )}
                  {myDeaf && (
                    <View style={styles.statusMuteBadge}>
                      <VolumeX size={12} color={theme.colors.primary} />
                    </View>
                  )}
                </View>
              </View>

              {/* Other Participants */}
              {participants.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.participantCard,
                    p.isSpeaking && !myDeaf ? styles.activeSpeakingCard : null,
                  ]}
                >
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, styles.otherAvatar]}>
                      <Text style={styles.avatarText}>{p.name.substring(0, 1)}</Text>
                    </View>
                    {p.isSpeaking && !myDeaf && (
                      <View
                        style={[
                          styles.pulseRing,
                          { transform: [{ scale: pulseScale }] },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardRole}>{p.role}</Text>

                  <View style={styles.statusIcons}>
                    {p.isMuted ? (
                       <View style={styles.statusMuteBadge}>
                         <MicOff size={12} color={theme.colors.secondary} />
                       </View>
                    ) : (
                      <View
                        style={[
                          styles.statusActiveBadge,
                          p.isSpeaking && !myDeaf ? { backgroundColor: theme.colors.primaryContainer + '1D' } : null,
                        ]}
                      >
                        <Mic size={12} color={p.isSpeaking && !myDeaf ? theme.colors.primary : theme.colors.secondary} />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.controlBar}>
            <View style={styles.controlInfo}>
              <View style={styles.activeDot} />
              <Text style={styles.connectedCount}>
                تعداد حاضرین: {formatFarsiNumber(participants.length + 1)} نفر
              </Text>
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(30)
                  setMyMuted(!myMuted)
                }}
                style={[styles.circleButton, myMuted ? styles.buttonActiveRed : styles.buttonOutline]}
              >
                {myMuted ? <MicOff size={20} color="#ffffff" /> : <Mic size={20} color={theme.colors.secondary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(30)
                  setMyDeaf(!myDeaf)
                }}
                style={[styles.circleButton, myDeaf ? styles.buttonActiveRed : styles.buttonOutline]}
              >
                {myDeaf ? <VolumeX size={20} color="#ffffff" /> : <Volume2 size={20} color={theme.colors.secondary} />}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
                <PhoneOff size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────
      // MODAL: Create New Voice Room Form
      // ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color={theme.colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ساخت اتاق صوتی جدید</Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              {/* Room Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>نام اتاق صوتی:</Text>
                <TextInput
                  placeholder="مثال: هماهنگی عملیات تجریش"
                  placeholderTextColor="#555860"
                  value={newRoomName}
                  onChangeText={setNewRoomName}
                  style={styles.formInput}
                />
              </View>

              {/* Switches */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>وضعیت اضطراری (بحرانی):</Text>
                <Switch
                  value={isEmergency}
                  onValueChange={setIsEmergency}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.onSurface}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>بی‌صدا در بدو ورود:</Text>
                <Switch
                  value={isDefaultMuted}
                  onValueChange={setIsDefaultMuted}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.onSurface}
                />
              </View>

              {/* Access Level Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>سطح دسترسی و امنیت:</Text>
                <View style={styles.accessGrid}>
                  {[
                    { key: 'public', label: 'عمومی' },
                    { key: 'role', label: 'بر اساس نقش' },
                    { key: 'shift', label: 'بر اساس شیفت' },
                    { key: 'manual', label: 'شخصی' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setNewRoomAccess(item.key as any)}
                      style={[
                        styles.accessRadio,
                        newRoomAccess === item.key ? styles.accessRadioActive : null,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.accessRadioText,
                          newRoomAccess === item.key ? styles.accessRadioTextActive : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Conditional parameters */}
              {newRoomAccess === 'role' && (
                <View style={styles.optionsBlock}>
                  <Text style={styles.optionsBlockTitle}>انتخاب نقش‌های مجاز:</Text>
                  {[
                    { key: 'admin', label: 'مدیران سامانه' },
                    { key: 'operator', label: 'اپراتورها / راهبران' },
                  ].map((role) => {
                    const isSelected = selectedRoles.includes(role.key)
                    return (
                      <TouchableOpacity
                        key={role.key}
                        onPress={() => {
                          setSelectedRoles((prev) =>
                            isSelected ? prev.filter((r) => r !== role.key) : [...prev, role.key]
                          )
                        }}
                        style={styles.checkboxRow}
                      >
                        {isSelected ? <Check size={16} color={theme.colors.primary} /> : <View style={styles.checkboxBox} />}
                        <Text style={styles.checkboxLabel}>{role.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {newRoomAccess === 'shift' && (
                <View style={styles.optionsBlock}>
                  <Text style={styles.optionsBlockTitle}>انتخاب گروه‌های شیفت کاری مجاز:</Text>
                  <View style={styles.shiftsGrid}>
                    {['A', 'B', 'C', 'morning', 'evening', 'night'].map((shift) => {
                      const isSelected = selectedShifts.includes(shift)
                      return (
                        <TouchableOpacity
                          key={shift}
                          onPress={() => {
                            setSelectedShifts((prev) =>
                              isSelected ? prev.filter((s) => s !== shift) : [...prev, shift]
                            )
                          }}
                          style={[
                            styles.shiftSelectBtn,
                            isSelected ? styles.shiftSelectBtnActive : null,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.shiftSelectText,
                              isSelected ? styles.shiftSelectTextActive : null,
                            ]}
                          >
                            {shift}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )}

              {newRoomAccess === 'manual' && (
                <View style={styles.optionsBlock}>
                  <Text style={styles.optionsBlockTitle}>انتخاب پرسنل مجاز:</Text>
                  {mockPersonnel.map((person) => {
                    const isSelected = selectedUsers.includes(person.name)
                    return (
                      <TouchableOpacity
                        key={person.id}
                        onPress={() => {
                          setSelectedUsers((prev) =>
                            isSelected ? prev.filter((u) => u !== person.name) : [...prev, person.name]
                          )
                        }}
                        style={styles.personRow}
                        activeOpacity={0.8}
                      >
                        <View style={styles.personRight}>
                          {isSelected ? <Check size={16} color={theme.colors.primary} /> : <View style={styles.checkboxBox} />}
                          <Text style={styles.personName}>{person.name}</Text>
                        </View>
                        <Text style={styles.personRole}>{person.role}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              )}

              {/* Submit Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={handleCreateRoom}
                  disabled={!newRoomName.trim()}
                  style={[styles.modalSubmitBtn, !newRoomName.trim() ? styles.modalSubmitBtnDisabled : null]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalSubmitBtnText}>ایجاد اتاق صوتی</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.screenTitle.fontFamily,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  pingText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  ChevronLeft: {
    transform: [{ scaleX: -1 }],
  },
  lobbyContainer: {
    flex: 1,
    padding: 16,
  },
  lobbyTitleBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lobbyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    fontFamily: theme.typography.sectionTitle.fontFamily,
  },
  createRoomBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    ...theme.shadows.level1,
  },
  createRoomBtnText: {
    fontSize: 12,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  roomsList: {
    gap: 12,
  },
  roomCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
  },
  roomCardAccessible: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    ...theme.shadows.level1,
  },
  roomCardInaccessible: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.border,
    opacity: 0.55,
  },
  roomCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    marginLeft: 4,
  },
  roomCardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  deleteRoomBtn: {
    padding: 4,
  },
  roomCardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  roomBadgeRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeEmergency: {
    backgroundColor: theme.colors.primaryContainer + '10',
    borderColor: theme.colors.primaryContainer + '20',
  },
  badgeEmergencyText: {
    fontSize: 8.5,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  badgePublic: {
    backgroundColor: theme.colors.success + '10',
    borderColor: theme.colors.success + '20',
  },
  badgePublicText: {
    fontSize: 8.5,
    color: theme.colors.success,
  },
  badgeRole: {
    backgroundColor: theme.colors.warning + '10',
    borderColor: theme.colors.warning + '20',
  },
  badgeRoleText: {
    fontSize: 8.5,
    color: theme.colors.warning,
  },
  badgeShift: {
    backgroundColor: theme.colors.info + '10',
    borderColor: theme.colors.info + '20',
  },
  badgeShiftText: {
    fontSize: 8.5,
    color: theme.colors.info,
  },
  badgeManual: {
    backgroundColor: theme.colors.secondary + '10',
    borderColor: theme.colors.secondary + '20',
  },
  badgeManualText: {
    fontSize: 8.5,
    color: theme.colors.secondary,
  },
  roomCardUsers: {
    fontSize: 9.5,
    color: theme.colors.secondary,
  },
  disclaimerCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    marginTop: 20,
    ...theme.shadows.level1,
  },
  disclaimerTitle: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  disclaimerDesc: {
    fontSize: 10,
    color: theme.colors.secondary,
    textAlign: 'right',
    lineHeight: 16,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  conferenceContainer: {
    flex: 1,
  },
  activeRoomTitleBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeRoomNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'right',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  muteAllBtn: {
    backgroundColor: theme.colors.warning + '10',
    borderWidth: 1,
    borderColor: theme.colors.warning + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  muteAllBtnText: {
    fontSize: 9,
    color: theme.colors.warning,
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  participantCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 8,
    ...theme.shadows.level1,
  },
  activeSpeakingCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
  },
  myAvatar: {
    backgroundColor: theme.colors.primaryContainer + '10',
    borderColor: theme.colors.primary,
  },
  otherAvatar: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    opacity: 0.4,
    zIndex: 1,
  },
  mineBadgeBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer + '10',
    borderColor: theme.colors.primaryContainer + '20',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginBottom: 8,
    gap: 3,
  },
  mineBadgeText: {
    fontSize: 8,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  cardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  cardRole: {
    fontSize: 10,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  statusMuteBadge: {
    backgroundColor: theme.colors.primaryContainer + '10',
    borderWidth: 1,
    borderColor: theme.colors.primaryContainer + '20',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusActiveBadge: {
    backgroundColor: theme.colors.success + '10',
    borderWidth: 1,
    borderColor: theme.colors.success + '20',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  controlInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  connectedCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  buttonActiveRed: {
    backgroundColor: theme.colors.primary,
  },
  leaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  modalForm: {
    padding: 16,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    textAlign: 'right',
  },
  formInput: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: theme.colors.onSurface,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLabel: {
    fontSize: 11.5,
    color: theme.colors.onSurface,
  },
  accessGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessRadio: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  accessRadioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer + '10',
  },
  accessRadioText: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  accessRadioTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  optionsBlock: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: 12,
    gap: 10,
  },
  optionsBlockTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    textAlign: 'right',
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: 11.5,
    color: theme.colors.onSurface,
  },
  shiftsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  shiftSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shiftSelectBtnActive: {
    backgroundColor: theme.colors.primaryContainer + '10',
    borderColor: theme.colors.primary,
  },
  shiftSelectText: {
    fontSize: 10.5,
    color: theme.colors.secondary,
  },
  shiftSelectTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  personRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  personRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 11.5,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  personRole: {
    fontSize: 9.5,
    color: theme.colors.secondary,
  },
  formActions: {
    marginTop: 8,
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitBtnText: {
    color: theme.colors.onPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
})

export default VoiceConferenceScreen
