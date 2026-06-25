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
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { useChatStore, ChatRoom, ChatMessage } from '../stores/chat'
import { useConfigStore } from '../stores/config'
import { Send, ArrowRight, MessageCircle, Mic, MicOff, Play, Pause } from 'lucide-react-native'
import { toFa } from '../shared/jalali'

export function ChatScreen({ route, navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const rooms = useChatStore((s) => s.rooms)
  const activeRoomId = useChatStore((s) => s.activeRoomId)
  const messagesByRoom = useChatStore((s) => s.messagesByRoom)
  const roomSettings = useChatStore((s) => s.roomSettings)
  const roomReactions = useChatStore((s) => s.roomReactions)
  const roomIsAdmin = useChatStore((s) => s.roomIsAdmin)
  const loadingRooms = useChatStore((s) => s.loadingRooms)
  const loadingMessages = useChatStore((s) => s.loadingMessages)
  
  const loadRooms = useChatStore((s) => s.loadRooms)
  const selectRoom = useChatStore((s) => s.selectRoom)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const toggleReaction = useChatStore((s) => s.toggleReaction)
  const connect = useChatStore((s) => s.connect)
  const disconnect = useChatStore((s) => s.disconnect)

  const config = useConfigStore((s) => s.config)
  const voiceChatEnabled = config?.comms?.voiceChatEnabled !== false
  const maxRecordingTime = config?.comms?.maxRecordingTime ?? 60
  const audioBitrate = config?.comms?.audioBitrate ?? '32kbps'

  const [inputText, setInputText] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
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
    if (!inputText.trim() || !accessToken || !activeRoomId) return
    const success = await sendMessage(accessToken, activeRoomId, inputText.trim())
    if (success) {
      setInputText('')
      // اسکرول به انتهای پیام‌ها
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  // خروج از روم فعال و بازگشت به لیست روم‌ها
  function handleBack() {
    useChatStore.setState({ activeRoomId: null })
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null
  const messages = activeRoomId ? messagesByRoom[activeRoomId] ?? [] : []

  // رندر لیست روم‌ها
  if (!activeRoomId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>گفتگوها و اتاق‌ها</Text>
        </View>

        {loadingRooms ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e53935" />
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
                {/* بخش راست: نام اتاق و پیام آخر */}
                <View style={styles.roomRight}>
                  <Text style={styles.roomName}>{item.name}</Text>
                  <Text style={styles.lastMsgText} numberOfLines={1}>
                    {item.lastMessage
                      ? `${item.lastMessage.senderName}: ${item.lastMessage.body}`
                      : 'پیامی در این اتاق وجود ندارد'}
                  </Text>
                </View>

                {/* بخش چپ: زمان و نشان پیام‌های خوانده‌نشده */}
                <View style={styles.roomLeft}>
                  <Text style={styles.timeText}>
                    {item.lastMessage ? toFa(new Date(item.lastMessage.createdAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})) : ''}
                  </Text>
                  {item.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{toFa(item.unreadCount)}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <MessageCircle size={40} color="#555860" />
                <Text style={styles.emptyText}>اتاق گفتگویی یافت نشد.</Text>
              </View>
            }
          />
        )}
      </View>
    )
  }

  // رندر پیام‌های داخل یک روم
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      {/* سربرگ روم چت */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowRight size={20} color="#f2f2f7" />
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>{activeRoom?.name}</Text>
      </View>

      {/* لیست پیام‌ها */}
      {loadingMessages ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e53935" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.id
            const isSelected = selectedMessageId === item.id

            // Group reactions
            const msgReactions = roomReactions[activeRoomId!]?.[item.id] || []
            const grouped = msgReactions.reduce((acc, curr) => {
              if (!acc[curr.emoji]) acc[curr.emoji] = []
              acc[curr.emoji].push(curr)
              return acc
            }, {} as Record<string, typeof msgReactions>)

            return (
              <View style={[styles.messageContainer, { alignSelf: isMine ? 'flex-end' : 'flex-start', alignItems: isMine ? 'flex-end' : 'flex-start' }]}>
                {/* Reaction Quick Picker on Long Press */}
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
                  {!isMine ? <Text style={styles.senderName}>{item.senderName}</Text> : null}
                  
                  {item.attachmentType === 'audio/mpeg' ? (
                    <View style={styles.voicePlayerContainer}>
                      <TouchableOpacity
                        onPress={() => setIsPlayingMessageId(isPlayingMessageId === item.id ? null : item.id)}
                        style={styles.voicePlayBtn}
                      >
                        {isPlayingMessageId === item.id ? (
                          <Pause size={16} color={isMine ? '#e53935' : '#ffffff'} />
                        ) : (
                          <Play size={16} color={isMine ? '#e53935' : '#ffffff'} style={styles.playIconFlipped} />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.voiceProgressBar}>
                        <View style={[
                          styles.voiceProgressFill,
                          isPlayingMessageId === item.id ? { width: '70%' } : { width: '0%' }
                        ]} />
                      </View>
                      
                      <Mic size={14} color={isMine ? '#ffffff' : '#a0a3b0'} style={{ marginRight: 6 }} />
                      <Text style={[styles.voiceDurationText, isMine ? { color: '#ffffff' } : { color: '#a0a3b0' }]}>{toFa('0:08')}</Text>
                    </View>
                  ) : (
                    <Text style={styles.messageText}>{item.body}</Text>
                  )}

                  <Text style={styles.messageTime}>
                    {toFa(new Date(item.createdAt).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }))}
                  </Text>
                </TouchableOpacity>

                {/* Reaction badges */}
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

      {/* باکس ارسال پیام */}
      {isRecording ? (
        <View style={styles.recordBar}>
          <View style={styles.recordLeft}>
            <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
              <Text style={styles.recordCancelText}>لغو</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendVoiceMessage} style={styles.recordSendBtn}>
              <Mic size={14} color="#ffffff" />
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
        <View style={styles.inputBar}>
          {voiceChatEnabled && !(activeSettings.readOnly && !isRoomAdmin) && (
            <TouchableOpacity
              style={styles.micButton}
              onPress={startRecording}
            >
              <Mic size={18} color="#a0a3b0" />
            </TouchableOpacity>
          )}
          
          <TextInput
            style={[
              styles.messageInput,
              (activeSettings.readOnly && !isRoomAdmin) && styles.messageInputDisabled
            ]}
            value={inputText}
            onChangeText={setInputText}
            editable={!(activeSettings.readOnly && !isRoomAdmin)}
            placeholder={activeSettings.readOnly && !isRoomAdmin ? "فقط مدیر گروه مجاز به ارسال پیام است." : "پیام خود را بنویسید..."}
            placeholderTextColor="#555860"
            textAlign="right"
            maxLength={activeSettings.maxLength || 1000}
          />
          {inputText.length > 0 && !(activeSettings.readOnly && !isRoomAdmin) && (
            <Text style={styles.charCounter}>
              {toFa(`${inputText.length}/${activeSettings.maxLength || 1000}`)}
            </Text>
          )}
          <TouchableOpacity
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d12', // Deep dark layout background
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e222d',
    backgroundColor: '#151821', // Dark surface
  },
  headerTitle: {
    fontSize: 15,
    color: '#f2f2f7',
    fontWeight: 'bold',
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
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Premium iOS shadow/Android elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#ffffff',
    fontWeight: 'bold',
  },
  lastMsgText: {
    fontSize: 12,
    color: '#8c91a5',
    marginTop: 4,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 11,
    color: '#5b6175',
  },
  unreadBadge: {
    backgroundColor: '#e53935', // Metro Line 1 Red
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#8c91a5',
    fontSize: 14,
    marginTop: 8,
  },
  chatHeader: {
    height: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e222d',
    paddingHorizontal: 16,
    backgroundColor: '#151821',
  },
  backButton: {
    padding: 8,
  },
  chatHeaderTitle: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: 'bold',
    marginRight: 12,
    textAlign: 'right',
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
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#e53935', // Line 1 Red Accent
    borderBottomRightRadius: 2,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 2,
  },
  senderName: {
    color: '#e53935',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  messageText: {
    color: '#f2f2f7',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  messageTime: {
    color: 'rgba(242, 242, 247, 0.45)',
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
    borderTopColor: '#1e222d',
    backgroundColor: '#151821',
  },
  messageInput: {
    flex: 1,
    color: '#ffffff',
    backgroundColor: '#0c0d12',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 13.5,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e53935',
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
    backgroundColor: '#1c1f2b',
    borderColor: '#2b3147',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    top: -34,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
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
    backgroundColor: 'rgba(229, 57, 53, 0.15)',
    borderColor: '#e53935',
  },
  reactedBadgeInactive: {
    backgroundColor: '#151821',
    borderColor: '#212533',
  },
  reactionCount: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  messageInputDisabled: {
    backgroundColor: '#151821',
    color: '#5b6175',
  },
  sendButtonDisabled: {
    backgroundColor: '#212533',
  },
  charCounter: {
    color: '#5b6175',
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
    borderTopColor: '#1e222d',
    backgroundColor: '#151821',
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
    color: '#8c91a5',
    fontSize: 12,
    fontWeight: '500',
  },
  recordSendBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  recordSendText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  recordRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  recordTimer: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 8,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginLeft: 6,
  },
  recordLabel: {
    color: '#8c91a5',
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
    backgroundColor: '#ef4444',
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
})
export default ChatScreen
