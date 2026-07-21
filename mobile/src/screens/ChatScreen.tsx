import React, { useEffect, useState, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  PanResponder
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useChatStore, ChatRoom, ChatMessage } from '../stores/chat'
import { useConfigStore } from '../stores/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { toFa } from '../shared/jalali'
import { pickAndUploadDocument } from '../shared/uploader'

export function ChatScreen({ route, navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const rooms = useChatStore((s) => s.rooms)
  const activeRoomId = useChatStore((s) => s.activeRoomId)
  const messagesByRoom = useChatStore((s) => s.messagesByRoom)
  const activeRoom = rooms.find(r => r.id === activeRoomId)
  const messages = activeRoomId ? messagesByRoom[activeRoomId] || [] : []
  const roomSettings = useChatStore((s) => s.roomSettings)
  const roomReactions = useChatStore((s) => s.roomReactions)
  const roomIsAdmin = useChatStore((s) => s.roomIsAdmin)
  const loadingRooms = useChatStore((s) => s.loadingRooms)
  const loadingMessages = useChatStore((s) => s.loadingMessages)
  const loadingOlderMessages = useChatStore((s) => s.loadingOlderMessages)
  const cursorsByRoom = useChatStore((s) => s.cursorsByRoom)
  const hasMoreByRoom = useChatStore((s) => s.hasMoreByRoom)
  
  const loadRooms = useChatStore((s) => s.loadRooms)
  const selectRoom = useChatStore((s) => s.selectRoom)
  const loadOlderMessages = useChatStore((s) => s.loadOlderMessages)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const toggleReaction = useChatStore((s) => s.toggleReaction)
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)

  const hasMore = activeRoomId ? hasMoreByRoom[activeRoomId] ?? false : false

  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false })
      }, 100)
    }
  }, [loadingMessages])

  const handleRetry = async (failedMsg: ChatMessage) => {
    if (!accessToken || !activeRoomId) return
    useChatStore.setState((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [activeRoomId]: (s.messagesByRoom[activeRoomId] ?? []).filter((m) => m.id !== failedMsg.id),
      },
    }))
    const ok = await sendMessage(
      accessToken,
      activeRoomId,
      failedMsg.body || '',
      failedMsg.attachmentUrl ? { url: failedMsg.attachmentUrl, type: failedMsg.attachmentType || '' } : undefined
    )
    if (ok) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const renderListHeader = () => {
    if (!hasMore) return null
    if (loadingOlderMessages) {
      return (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )
    }
    return (
      <TouchableOpacity
        onPress={() => accessToken && activeRoomId && loadOlderMessages(accessToken, activeRoomId)}
        style={{
          paddingVertical: 8,
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceContainerLow,
          borderRadius: theme.borderRadius.md,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: theme.colors.surfaceVariant,
        }}
      >
        <Text style={{ fontSize: 12, color: theme.colors.primary, fontFamily: theme.typography.bodyMd.fontFamily }}>
          بارگذاری پیام‌های قدیمی‌تر
        </Text>
      </TouchableOpacity>
    )
  }

  const config = useConfigStore((s) => s.config)
  const voiceChatEnabled = config?.comms?.voiceChatEnabled !== false
  const maxRecordingTime = config?.comms?.maxRecordingTime ?? 60
  const audioBitrate = config?.comms?.audioBitrate ?? '32kbps'

  const { theme } = useTheme()

  const [inputText, setInputText] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<{ url: string; type: string; name: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlayingMessageId, setIsPlayingMessageId] = useState<string | null>(null)
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current)
      }
    }
  }, [])

  const startRecording = () => {
    if (!voiceChatEnabled) return
    setIsRecording(true)
    setRecordingTime(0)
    recordIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= maxRecordingTime) {
          stopRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current)
      recordIntervalRef.current = null
    }
  }

  const cancelRecording = () => {
    stopRecording()
    setIsRecording(false)
    setRecordingTime(0)
  }

  const sendVoiceMessage = async () => {
    stopRecording()
    setIsRecording(false)
    if (!accessToken || !activeRoomId) return
    
    // Simulate sending a voice file
    const mockVoiceUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    const success = await sendMessage(accessToken, activeRoomId, '', {
      url: mockVoiceUrl,
      type: 'audio/mpeg',
    })
    
    setRecordingTime(0)
    if (success) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const activeSettings = activeRoomId ? roomSettings[activeRoomId] || { readOnly: false, blockAttachments: false, maxLength: 1000 } : { readOnly: false, blockAttachments: false, maxLength: 1000 }
  const isRoomAdmin = activeRoomId ? roomIsAdmin[activeRoomId] || false : false

  const handleReact = (messageId: string, emoji: string) => {
    if (accessToken && activeRoomId) {
      toggleReaction(accessToken, activeRoomId, messageId, emoji)
    }
  }

  // بارگذاری روم‌ها و اتصال بلادرنگ به سرور
  useEffect(() => {
    if (!accessToken) return
    loadRooms(accessToken)
    connect(accessToken)
    return () => disconnect()
  }, [accessToken])

  // مدیریت باز شدن مستقیم چت از تب‌های دیگر (مثلاً با دایرکت پارامتر)
  useEffect(() => {
    const dmUserId = route?.params?.dm
    if (dmUserId && accessToken) {
      useChatStore.getState().openDirect(accessToken, dmUserId).then((roomId) => {
        if (roomId) {
          selectRoom(accessToken, roomId)
          // پاک کردن پارامتر ناوبری
          navigation.setParams({ dm: undefined })
        }
      })
    }
  }, [route?.params?.dm])

  async function handleSend() {
    if (!activeRoomId || !accessToken) return
    const body = inputText.trim()
    if (!body && !attachment) return

    const ok = await sendMessage(
      accessToken, 
      activeRoomId, 
      body, 
      attachment ? { url: attachment.url, type: attachment.type } : undefined
    )
    if (ok) {
      setInputText('')
      setAttachment(null)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  const handlePickFile = async () => {
    if (!accessToken) return
    setIsUploading(true)
    try {
      const file = await pickAndUploadDocument()
      if (file) setAttachment({ ...file, name: file.url.split('/').pop() || 'file' })
    } catch (e) {
      console.error(e)
    } finally {
      setIsUploading(false)
    }
  }

  // خروج از روم فعال و بازگشت به لیست روم‌ها
  function handleBack() {
    useChatStore.setState({ activeRoomId: null })
  }

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    headerTitle: {
      fontSize: 15,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.screenTitle.fontFamily,
    },
    listPadding: {
      padding: 16,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    roomCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadows.level1,
    },
    roomLeft: {
      alignItems: 'flex-start',
      gap: 8,
    },
    roomRight: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 12,
    },
    roomName: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    lastMsgText: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginTop: 4,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    timeText: {
      fontSize: 11,
      color: theme.colors.secondary,
    },
    unreadBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: theme.colors.onPrimary,
      fontSize: 10,
      fontWeight: 'bold',
    },
    emptyText: {
      color: theme.colors.secondary,
      fontSize: 14,
      marginTop: 8,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    chatHeader: {
      height: 56,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    backButton: {
      padding: 8,
    },
    chatHeaderTitle: {
      fontSize: 15,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      marginRight: 12,
      textAlign: 'right',
      fontFamily: theme.typography.screenTitle.fontFamily,
    },
    messagesList: {
      padding: 16,
      paddingBottom: 24,
    },
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      marginBottom: 12,
      ...theme.shadows.level1,
    },
    myBubble: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 2,
    },
    theirBubble: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderBottomLeftRadius: 2,
    },
    senderName: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'right',
    },
    messageText: {
      fontSize: 13.5,
      lineHeight: 19,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    messageTime: {
      fontSize: 9.5,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    inputBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    messageInput: {
      flex: 1,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: 20,
      height: 40,
      paddingHorizontal: 16,
      fontSize: 13.5,
      marginRight: 8,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    sendIconFlipped: {
      transform: [{ scaleX: -1 }],
    },
    messageContainer: {
      marginVertical: 4,
      width: '100%',
    },
    reactionToolbar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: 22,
      paddingHorizontal: 10,
      paddingVertical: 5,
      position: 'absolute',
      top: -34,
      zIndex: 20,
      ...theme.shadows.level2,
    },
    toolbarEmojiBtn: {
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    reactionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 2,
      marginBottom: 6,
      gap: 4,
    },
    reactionBadge: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      gap: 2,
    },
    reactedBadgeActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    reactedBadgeInactive: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.surfaceVariant,
    },
    reactionCount: {
      color: theme.colors.onSurface,
      fontSize: 9,
      fontWeight: 'bold',
    },
    messageInputDisabled: {
      backgroundColor: theme.colors.surfaceContainer,
      color: theme.colors.secondary,
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    charCounter: {
      color: theme.colors.secondary,
      fontSize: 9,
      position: 'absolute',
      left: 70,
      bottom: 14,
    },
    micButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
    },
    recordBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    recordLeft: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    recordCancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    recordCancelText: {
      color: theme.colors.secondary,
      fontSize: 12,
      fontWeight: '500',
    },
    recordSendBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    recordSendText: {
      color: theme.colors.onPrimary,
      fontSize: 11,
      fontWeight: 'bold',
    },
    recordRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
    },
    recordTimer: {
      color: theme.colors.onSurface,
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginLeft: 8,
    },
    recordDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.error,
      marginLeft: 6,
    },
    recordLabel: {
      color: theme.colors.secondary,
      fontSize: 11,
    },
    waveformContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 2,
      marginLeft: 12,
    },
    waveformBar: {
      width: 2,
      backgroundColor: theme.colors.error,
      borderRadius: 1,
    },
    voicePlayerContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginVertical: 4,
      minWidth: 160,
      maxWidth: 240,
      gap: 8,
    },
    voicePlayBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    voiceProgressBar: {
      flex: 1,
      height: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 1.5,
    },
    voiceProgressFill: {
      height: '100%',
      backgroundColor: '#ffffff',
      borderRadius: 1.5,
    },
    voiceDurationText: {
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    playIconFlipped: {
      transform: [{ scaleX: -1 }],
    },
    attachmentPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerHighest,
      padding: 8,
      borderRadius: theme.borderRadius.md,
      marginBottom: 8,
      marginHorizontal: theme.spacing.containerMargin,
    },
    attachmentPreviewText: {
      flex: 1,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      color: theme.colors.onSurface,
      textAlign: 'right',
      marginRight: 8,
    },
  })

  // رندر لیست روم‌ها
  if (!activeRoomId) {
    return (
      <ScreenWrapper title="گفتگوها و اتاق‌ها" navigation={navigation}>
        <View style={styles.container}>

          {loadingRooms && rooms.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.roomCard}
                  onPress={() => accessToken && selectRoom(accessToken, item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.roomRight}>
                    <Text style={styles.roomName}>{item.name}</Text>
                    <Text style={styles.lastMsgText} numberOfLines={1}>
                      {item.lastMessage
                        ? `${item.lastMessage.senderName}: ${item.lastMessage.body}`
                        : 'پیامی در این اتاق وجود ندارد'}
                    </Text>
                  </View>
                  <View style={styles.roomLeft}>
                    <Text style={styles.timeText}>
                      {item.lastMessage ? toFa(new Date(item.lastMessage.createdAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})) : ''}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{toFa(item.unreadCount)}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.centerContainer}>
                  <MaterialIcons name="chat" size={40} color={theme.colors.secondary} />
                  <Text style={styles.emptyText}>اتاق گفتگویی یافت نشد.</Text>
                </View>
              }
            />
          )}
        </View>
      </ScreenWrapper>
    )
  }

  // رندر پیام‌های داخل یک روم
  return (
    <ScreenWrapper title={activeRoom?.name || 'گفتگو'} navigation={navigation} onBack={handleBack}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
        style={styles.container}
      >

        {loadingMessages && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderListHeader}
            renderItem={({ item }) => {
              const isMine = item.senderId === user?.id
              const isSelected = selectedMessageId === item.id

              const msgReactions = roomReactions[activeRoomId!]?.[item.id] || []
              const grouped = msgReactions.reduce((acc, curr) => {
                if (!acc[curr.emoji]) acc[curr.emoji] = []
                acc[curr.emoji].push(curr)
                return acc
              }, {} as Record<string, typeof msgReactions>)

              return (
                <View style={[styles.messageContainer, { alignSelf: isMine ? 'flex-end' : 'flex-start', alignItems: isMine ? 'flex-end' : 'flex-start' }]}>
                  {isSelected && (
                    <View style={[styles.reactionToolbar, isMine ? { right: 0 } : { left: 0 }]}>
                      {['👍', '❤️', '😂', '🔥', '🚨'].map((emoji) => (
                        <TouchableOpacity
                           key={emoji}
                           onPress={() => {
                             handleReact(item.id, emoji)
                             setSelectedMessageId(null)
                           }}
                           style={styles.toolbarEmojiBtn}
                        >
                          <Text style={{ fontSize: 16 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => setSelectedMessageId(isSelected ? null : item.id)}
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myBubble : styles.theirBubble,
                    ]}
                  >
                    {!isMine && <Text style={styles.senderName}>{item.senderName}</Text>}
                    
                    {item.attachmentType === 'audio/mpeg' ? (
                      <View style={styles.voicePlayerContainer}>
                        <TouchableOpacity
                          onPress={() => setIsPlayingMessageId(isPlayingMessageId === item.id ? null : item.id)}
                          style={styles.voicePlayBtn}
                        >
                          {isPlayingMessageId === item.id ? (
                            <MaterialIcons name="pause" size={16} color={isMine ? theme.colors.onPrimary : theme.colors.primary} />
                          ) : (
                            <MaterialIcons name="play-arrow" size={16} color={isMine ? theme.colors.onPrimary : theme.colors.primary} />
                          )}
                        </TouchableOpacity>
                        
                        <View style={[styles.voiceProgressBar, isMine ? { backgroundColor: theme.colors.onPrimary + '40' } : { backgroundColor: theme.colors.primary + '20' }]}>
                          <View style={[
                            styles.voiceProgressFill,
                            isPlayingMessageId === item.id ? { width: '70%' } : { width: '0%' },
                            isMine ? { backgroundColor: theme.colors.onPrimary } : { backgroundColor: theme.colors.primary }
                          ]} />
                        </View>
                        
                        <MaterialIcons name="mic" size={16} color={isMine ? theme.colors.onPrimary : theme.colors.secondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.voiceDurationText, isMine ? { color: theme.colors.onPrimary } : { color: theme.colors.secondary }]}>{toFa('0:08')}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.messageText, isMine ? { color: theme.colors.onPrimary } : { color: theme.colors.onSurface }]}>{item.body}</Text>
                    )}

                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Text style={[styles.messageTime, isMine ? { color: theme.colors.onPrimary + '90' } : { color: theme.colors.secondary }]}>
                        {toFa(new Date(item.createdAt).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }))}
                      </Text>
                      {item.status === 'sending' && (
                        <ActivityIndicator size="small" color={isMine ? theme.colors.onPrimary : theme.colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                      )}
                      {item.status === 'failed' && (
                        <TouchableOpacity onPress={() => handleRetry(item)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 2 }}>
                          <MaterialIcons name="error" size={14} color={theme.colors.error} />
                          <Text style={{ fontSize: 10, color: theme.colors.error, fontFamily: theme.typography.captionSm.fontFamily }}>ارسال نشد (تلاش مجدد)</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>

                  {Object.entries(grouped).length > 0 && (
                    <View style={[styles.reactionsContainer, { flexDirection: 'row-reverse' }]}>
                      {Object.entries(grouped).map(([emoji, users]) => {
                        const reactedByMe = users.some((u) => u.userId === user?.id)
                        return (
                          <TouchableOpacity
                            key={emoji}
                            onPress={() => handleReact(item.id, emoji)}
                            style={[
                              styles.reactionBadge,
                              reactedByMe ? styles.reactedBadgeActive : styles.reactedBadgeInactive
                            ]}
                          >
                            <Text style={{ fontSize: 10 }}>{emoji}</Text>
                            <Text style={styles.reactionCount}>{toFa(users.length)}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  )}
                </View>
              )
            }}
          />
        )}

        {isRecording ? (
          <View style={styles.recordBar}>
            <View style={styles.recordLeft}>
              <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
                <Text style={styles.recordCancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendVoiceMessage} style={styles.recordSendBtn}>
                <MaterialIcons name="mic" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.recordSendText}>ارسال ویس</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.recordRight}>
              <View style={styles.waveformContainer}>
                {[1, 2, 3, 2, 1, 2, 3, 2, 1].map((val, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.waveformBar,
                      { height: val * 4 }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.recordTimer}>
                {toFa(`${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60).toString().padStart(2, '0')}`)}
              </Text>
              <View style={styles.recordDot} />
              <Text style={styles.recordLabel}>در حال ضبط... ({audioBitrate})</Text>
            </View>
          </View>
        ) : (
          <View>
            {attachment && (
              <View style={styles.attachmentPreview}>
                <TouchableOpacity onPress={() => setAttachment(null)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={20} color={theme.colors.error} />
                </TouchableOpacity>
                <Text style={styles.attachmentPreviewText} numberOfLines={1}>{attachment.name}</Text>
                <MaterialIcons name="attach-file" size={20} color={theme.colors.secondary} />
              </View>
            )}
            <View style={styles.inputBar}>
              {voiceChatEnabled && !(activeSettings.readOnly && !isRoomAdmin) && (
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={startRecording}
                  disabled={isUploading}
                >
                  <MaterialIcons name="mic" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
              )}
              
              {!(activeSettings.readOnly && !isRoomAdmin) && !activeSettings.blockAttachments && (
                <TouchableOpacity
                  style={[styles.micButton, { marginRight: 4 }]}
                  onPress={async () => {
                    setIsUploading(true)
                    const res = await pickAndUploadDocument()
                    setIsUploading(false)
                    if (res) {
                      setAttachment({ url: res.url, type: res.type, name: res.url.split('/').pop() || 'file' })
                    }
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={theme.colors.secondary} />
                  ) : (
                    <MaterialIcons name="attach-file" size={24} color={theme.colors.secondary} />
                  )}
                </TouchableOpacity>
              )}

              <TextInput
                style={[
                  styles.messageInput,
                  (activeSettings.readOnly && !isRoomAdmin) && styles.messageInputDisabled
                ]}
                value={inputText}
                onChangeText={setInputText}
                editable={!(activeSettings.readOnly && !isRoomAdmin) && !isUploading}
                placeholder={activeSettings.readOnly && !isRoomAdmin ? "فقط مدیر گروه مجاز به ارسال پیام است." : "پیام خود را بنویسید..."}
                placeholderTextColor={theme.colors.secondary}
                textAlign="right"
                maxLength={activeSettings.maxLength || 1000}
                multiline
              />
              {inputText.length > 0 && !(activeSettings.readOnly && !isRoomAdmin) && (
                <Text style={styles.charCounter}>
                  {toFa(`${inputText.length}/${activeSettings.maxLength || 1000}`)}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() && !attachment) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={(!inputText.trim() && !attachment) || isUploading}
              >
                <MaterialIcons name="send" size={20} color={theme.colors.onPrimary} style={styles.sendIconFlipped} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default ChatScreen
