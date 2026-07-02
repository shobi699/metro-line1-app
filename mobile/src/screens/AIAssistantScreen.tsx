import React, { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface Message {
  id: number
  text: string
  isUser: boolean
  confidence?: number
  handbookSection?: string
  source?: string
  isCritical?: boolean
  backendId?: string
  feedback?: number
}

const FAQ_ITEMS = [
  { label: '🔧 E102 — درب واگن', query: 'E102' },
  { label: '⚙️ E205 — صدای موتور', query: 'E205' },
  { label: '🔥 E303 — سنسور حریق', query: 'E303' },
  { label: '⚡ E404 — افت کشش', query: 'E404' },
  { label: '❄️ V301 — تهویه', query: 'V301' },
  { label: '📡 S301 — ATP', query: 'S301' },
  { label: '🛑 ترمز اضطراری', query: 'ترمز' },
]

export function AIAssistantScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '🚇 سلام! من دستیار هوشمند عملیاتی خط ۱ مترو تهران هستم.\n\nمی‌توانم در موارد زیر کمکتان کنم:\n🔧 عیب‌یابی فنی و کدهای خطا\n📋 مقررات سیر و حرکت\n⚠️ پروتکل‌های اضطراری\n\nکد خطا یا سؤال خود را بنویسید یا از دکمه‌های سریع استفاده کنید.',
      isUser: false,
      confidence: 100,
      source: 'system',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const { theme } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  const typingDots = useRef(new Animated.Value(0)).current

  // Typing animation
  useEffect(() => {
    if (loading) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      )
      anim.start()
      return () => anim.stop()
    }
  }, [loading])

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, loading])

  async function aiAuthenticatedFetch(path: string, options: RequestInit = {}): Promise<any> {
    const authStore = useAuthStore.getState()
    const url = `${API_URL}${path}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`
    }

    let res = await fetch(url, { ...options, headers })

    if (res.status === 401 && authStore.refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: authStore.refreshToken })
      })

      if (refreshRes.ok) {
        const tokens = await refreshRes.json()
        if (authStore.user) {
          await authStore.setAuth(authStore.user, tokens.accessToken, tokens.refreshToken)
        }
        headers['Authorization'] = `Bearer ${tokens.accessToken}`
        res = await fetch(url, { ...options, headers })
      } else {
        await authStore.logout()
        throw new Error('UNAUTHORIZED')
      }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(errText || `HTTP_${res.status}`)
    }

    const data = await res.json()
    return data?.data ?? data
  }

  async function handleSend(customText?: string) {
    const textToSend = customText || inputText
    if (!textToSend.trim() || loading) return

    const userText = textToSend.trim()
    const userMsg: Message = {
      id: Date.now(),
      text: userText,
      isUser: true,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInputText('')
    setShowQuickActions(false)
    setLoading(true)

    try {
      const data = await aiAuthenticatedFetch('/ai', {
        method: 'POST',
        body: JSON.stringify({
          prompt: userText,
          conversationId,
        }),
      })

      if (data) {
        if (data.conversationId) {
          setConversationId(data.conversationId)
        }
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.reply,
            isUser: false,
            confidence: data.confidence,
            handbookSection: data.handbookSection,
            source: data.source,
            isCritical: data.isCritical,
            backendId: data.id,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: '⚠️ خطایی در پردازش درخواست رخ داد. لطفاً مجدداً تلاش کنید.',
            isUser: false,
          },
        ])
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        return
      }

      const isNetworkError = err.message && (
        err.message.includes('Network') || 
        err.message.includes('fetch') || 
        err.message.includes('Failed to fetch') ||
        err.message.includes('type')
      )

      if (isNetworkError) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: '🔌 خطا در ارتباط با سرور. لطفاً اتصال شبکه خود را بررسی کنید.',
            isUser: false,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: '⚠️ خطایی در پردازش درخواست رخ داد. لطفاً مجدداً تلاش کنید.',
            isUser: false,
          },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  function handleNewChat() {
    setMessages([
      {
        id: Date.now(),
        text: '🚇 مکالمه جدید آغاز شد. سؤال خود را مطرح کنید.',
        isUser: false,
        confidence: 100,
        source: 'system',
      },
    ])
    setConversationId(undefined)
    setShowQuickActions(true)
  }

  async function handleFeedback(messageId: number, backendId: string, feedbackValue: number) {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback: feedbackValue } : msg
      )
    )

    try {
      await aiAuthenticatedFetch('/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messageId: backendId,
          feedback: feedbackValue
        })
      })
    } catch (err) {
      console.warn('Failed to send feedback', err)
    }
  }

  function getSourceLabel(source?: string) {
    switch (source) {
      case 'rulebook': return '📖 کتابچه فنی'
      case 'gemini': return '🤖 هوش مصنوعی'
      case 'local-smart': return '💡 دستیار محلی'
      case 'knowledge': return '📚 دانش‌نامه'
      case 'OCC_EMERGENCY': return '🚨 هشدار اضطراری'
      case 'system': return '⚙️ سیستم'
      default: return '🤖 AI'
    }
  }

  function renderFormattedText(text: string) {
    // Simple markdown-like formatting for bold
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={{ fontWeight: '800', color: theme.colors.onSurface }}>
            {part.slice(2, -2)}
          </Text>
        )
      }
      return <Text key={i}>{part}</Text>
    })
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    messagesList: {
      padding: 16,
      paddingBottom: 100,
    },
    // User bubble
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '82%',
      backgroundColor: theme.colors.primary + '15',
      borderRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '25',
    },
    userText: {
      color: theme.colors.onSurface,
      fontSize: 13.5,
      lineHeight: 22,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    // Bot bubble
    botBubble: {
      alignSelf: 'flex-start',
      maxWidth: '90%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    criticalBubble: {
      borderColor: '#ef4444' + '40',
      backgroundColor: '#ef4444' + '08',
    },
    // Metadata bar
    metadataBar: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
      backgroundColor: theme.colors.primary + '08',
    },
    metadataText: {
      fontSize: 9,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '700',
    },
    botTextContainer: {
      padding: 14,
    },
    botText: {
      color: theme.colors.onSurface,
      fontSize: 13.5,
      lineHeight: 24,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    feedbackContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingHorizontal: 14,
      paddingBottom: 10,
      gap: 12,
    },
    feedbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      opacity: 0.6,
    },
    feedbackBtnActive: {
      opacity: 1,
    },
    // Source badge
    sourceBadge: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '12',
      alignSelf: 'flex-end',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginBottom: 8,
    },
    sourceBadgeText: {
      fontSize: 9.5,
      color: theme.colors.primary,
      fontWeight: '800',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Loading indicator
    typingContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      alignSelf: 'flex-start',
    },
    typingBubble: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    typingText: {
      fontSize: 11,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Quick actions
    quickActionsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
    },
    quickActionsTitle: {
      fontSize: 10.5,
      color: theme.colors.secondary,
      fontWeight: '700',
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      marginBottom: 8,
    },
    quickActionsRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 6,
    },
    quickActionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceContainer,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickActionText: {
      fontSize: 10.5,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '600',
    },
    // Input bar
    inputBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      gap: 8,
    },
    newChatBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageInput: {
      flex: 1,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 18,
      height: 38,
      paddingHorizontal: 14,
      fontSize: 13,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    sendButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    // Safety banner
    safetyBanner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#fbbf24' + '12',
      borderBottomWidth: 1,
      borderBottomColor: '#fbbf24' + '25',
    },
    safetyBannerText: {
      flex: 1,
      fontSize: 9,
      color: '#92400e',
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      fontWeight: '600',
    },
  })

  return (
    <ScreenWrapper title="دستیار هوشمند AI" navigation={navigation}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        {/* هشدار ایمنی */}
        <View style={styles.safetyBanner}>
          <MaterialIcons name="warning" size={14} color="#92400e" />
          <Text style={styles.safetyBannerText}>
            پاسخ‌های AI صرفاً مشورتی بوده و جایگزین تأیید مرکز فرمان (OCC) نمی‌شود.
          </Text>
        </View>

        {/* دکمه‌های سریع */}
        {showQuickActions && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>⚡ پرسش‌های سریع:</Text>
            <View style={styles.quickActionsRow}>
              {FAQ_ITEMS.map((faq, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickActionBtn}
                  activeOpacity={0.7}
                  onPress={() => handleSend(faq.query)}
                >
                  <Text style={styles.quickActionText}>{faq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* پیام‌ها */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((item) => (
            <View key={item.id}>
              {item.isUser ? (
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{item.text}</Text>
                </View>
              ) : (
                <View style={[styles.botBubble, item.isCritical && styles.criticalBubble]}>
                  {/* Metadata bar */}
                  {(item.confidence || item.source) && item.source !== 'system' && (
                    <View style={styles.metadataBar}>
                      <Text style={styles.metadataText}>
                        {getSourceLabel(item.source)}
                      </Text>
                      {item.confidence && (
                        <Text style={styles.metadataText}>
                          اطمینان: {item.confidence}٪
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.botTextContainer}>
                    {/* Handbook section badge */}
                    {item.handbookSection && item.source !== 'system' && (
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceBadgeText}>
                          📎 {item.handbookSection}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.botText}>
                      {renderFormattedText(item.text)}
                    </Text>
                  </View>

                  {/* Feedback buttons */}
                  {item.backendId && item.source !== 'system' && (
                    <View style={styles.feedbackContainer}>
                      <TouchableOpacity
                        style={[styles.feedbackBtn, item.feedback === 1 && styles.feedbackBtnActive]}
                        onPress={() => handleFeedback(item.id, item.backendId!, 1)}
                      >
                        <MaterialIcons
                          name="thumb-up"
                          size={14}
                          color={item.feedback === 1 ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.feedbackBtn, item.feedback === -1 && styles.feedbackBtnActive]}
                        onPress={() => handleFeedback(item.id, item.backendId!, -1)}
                      >
                        <MaterialIcons
                          name="thumb-down"
                          size={14}
                          color={item.feedback === -1 ? theme.colors.error : theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}

          {/* Typing indicator */}
          {loading && (
            <View style={styles.typingContainer}>
              <Animated.View style={[styles.typingBubble, { opacity: typingDots.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.typingText}>در حال پردازش...</Text>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* باکس ارسال پیام */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat} activeOpacity={0.7}>
            <MaterialIcons name="add" size={18} color={theme.colors.secondary} />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="کد خطا یا سؤال فنی..."
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={loading}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={18} color={theme.colors.onPrimary} style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default AIAssistantScreen
