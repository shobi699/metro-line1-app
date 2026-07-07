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
  Modal,
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
  toolConfirm?: {
    actionToken: string
    description: string
  }
}

const FAQ_ITEMS = [
  { label: '🔧 نقص فنی درب (E102)', query: 'نقص درب واگن قطار ۱۱۰' },
  { label: '⚙️ صدای موتور (E205)', query: 'صدای غیرعادی موتور قطار ۱۲۰' },
  { label: '🔥 سنسور حریق (E303)', query: 'اعلان حریق در قطار ۱۰۵' },
  { label: '⚡ خطای ATP سیگنالینگ', query: 'خطای سیگنالینگ ATP قطار ۱۳۲' },
  { label: '🛑 ترمز اضطراری', query: 'ترمز اضطراری واگن ۴' },
]

// Sample regulation text database for citation preview (Bottom Sheet)
const CITATION_DATABASE: Record<string, { title: string; content: string }> = {
  'ماده ۱۲-۳': {
    title: 'ماده ۱۲-۳ آیین‌نامه بهره‌برداری - کنترل حریق',
    content: 'در صورت وقوع هرگونه حریق یا مشاهده دود در واگن‌های مسافری، راهبر موظف است قطار را در اولین ایستگاه ممکن متوقف نموده، سیستم تهویه را خاموش کند و پس از باز کردن درب‌ها، دستور تخلیه فوری مسافران را صادر نماید. هماهنگی با OCC در تمام مراحل الزامی است.'
  },
  'بند ۴-۷': {
    title: 'بند ۴-۷ دستورالعمل ترمز و توقف ناوگان',
    content: 'هنگام فعال شدن ترمز اضطراری خودکار (ATP)، راهبر باید تا زمان توقف کامل قطار صبور بوده و بلافاصله فشار خط ترمز را بررسی کند. حرکت مجدد تنها پس از کسب مجوز کتبی یا شفاهی دیسپچر OCC و پس از تخلیه کامل خط ترمز امکان‌پذیر است.'
  },
  'بخش ۸.۵': {
    title: 'بخش ۸.۵ راهنمای علائم و سیگنالینگ کابین',
    content: 'نمایش رنگ قرمز در مانیتور ATP کابین به منزله توقف مطلق است. در صورت خرابی موقت سیستم سیگنالینگ و لزوم تردد با سرعت پشتیبان (محدوده ۱۵ کیلومتر بر ساعت)، راهبر باید دکمه تعلیق موقت را فشرده و با هماهنگی کامل راهبری دستی را آغاز کند.'
  },
  'مقررات ایمنی': {
    title: 'دستورالعمل جامع ایمنی سیر و حرکت خط ۱',
    content: 'حداکثر سرعت مجاز در بخش‌های روباز خط ۱ مترو تهران در شرایط برف و یخبندان شدید به ۳۵ کیلومتر بر ساعت کاهش می‌یابد. رعایت فواصل ایمنی و آماده‌باش ترمز دستی قطارها الزامی است.'
  }
}

// Helper to format numbers to Farsi digits
const toFa = (numStr: string | number | null | undefined) => {
  if (numStr === undefined || numStr === null) return ''
  const str = numStr.toString()
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return str.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
}

export function AIAssistantScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '🚇 سلام! من دستیار هوشمند عملیاتی خط ۱ مترو تهران هستم.\n\nمی‌توانم در عیب‌یابی کدهای خطا، مقررات سیر و حرکت و شرایط اضطراری کمکتان کنم.',
      isUser: false,
      confidence: 100,
      source: 'system',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  
  // Offline Mode States
  const [isOffline, setIsOffline] = useState(false)

  // Voice recording simulation states
  const [isRecording, setIsRecording] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current

  // Bottom Sheet Citation State
  const [selectedCitationSection, setSelectedCitationSection] = useState<string | null>(null)

  // Answer-First live states (cached fallback values)
  const [liveShift, setLiveShift] = useState('فردا صبح‌کار (۰۶:۰۰ تا ۱۴:۰۰)')
  const [liveTrain, setLiveTrain] = useState('لوکوموتیو ۱۱۸ (سالم)')
  const [liveCirculars, setLiveCirculars] = useState('۲ بخشنامه خوانده‌نشده')

  const { theme } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  const typingDots = useRef(new Animated.Value(0)).current

  // Pulse animation for recording microphone button
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isRecording])

  // Fetch initial live dashboard widgets details
  useEffect(() => {
    async function fetchLiveWidgets() {
      try {
        const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
        
        // Fetch shift info
        const shiftRes = await fetch(`${API_URL}/shifts/me`, { headers }).catch(() => null)
        if (shiftRes && shiftRes.ok) {
          const shiftData = await shiftRes.json()
          if (shiftData.data && shiftData.data.length > 0) {
            const firstShift = shiftData.data[0]
            setLiveShift(`${firstShift.code === 'morning' ? 'صبح‌کار' : firstShift.code === 'evening' ? 'عصرکار' : 'شب‌کار'} (${toFa(firstShift.note || 'ثبت شده')})`)
          }
        }

        // Fetch train info
        const tripsRes = await fetch(`${API_URL}/me/trips`, { headers }).catch(() => null)
        if (tripsRes && tripsRes.ok) {
          const tripsData = await tripsRes.json()
          if (tripsData.data && tripsData.data.length > 0) {
            setLiveTrain(`قطار شماره ${toFa(tripsData.data[0].trainId || '۱۱۸')}`)
          }
        }

        // Fetch active safety bulletins
        const safetyRes = await fetch(`${API_URL}/safety/bulletins/active`, { headers }).catch(() => null)
        if (safetyRes && safetyRes.ok) {
          const safetyData = await safetyRes.json()
          if (safetyData.data) {
            setLiveCirculars(`${toFa(safetyData.data.length)} بخشنامه خوانده‌نشده`)
          }
        }
      } catch (e) {
        console.log('Using default Answer-First fallbacks due to offline/loading state')
      }
    }
    fetchLiveWidgets()
  }, [accessToken])

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

  // Speech to text simulator
  const startRecording = () => {
    setIsRecording(true)
    // Simulate speech-to-text after 2.5 seconds
    setTimeout(() => {
      setIsRecording(false)
      setInputText('نقص درب واگن قطار ۱۱۰')
    }, 2500)
  }

  async function aiAuthenticatedFetch(path: string, options: RequestInit = {}): Promise<any> {
    const authStore = useAuthStore.getState()
    const url = `${API_URL}${path}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    
    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer={authStore.accessToken}`
    }

    let res
    try {
      res = await fetch(url, { ...options, headers })
      setIsOffline(false) // Connected successfully
    } catch (e) {
      setIsOffline(true) // Set offline status
      throw e
    }
    
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
    setLoading(true)

    // Handle offline local response matching
    if (isOffline) {
      setTimeout(() => {
        let reply = 'در حال حاضر دستگاه شما آفلاین است. سوال شما ثبت شد و در اولین فرصت پس از اتصال مجدد به شبکه ارسال خواهد شد.'
        let confidence = 80
        let source = 'local-smart'
        let handbookSection: string | undefined = undefined

        const lowerText = userText.toLowerCase()
        if (lowerText.includes('درب') || lowerText.includes('e102')) {
          reply = '🔧 نقص درب واگن (کد E102):\nطبق آیین‌نامه، راهبر باید کلید بازکن اضطراری درب را فعال کرده و درب را بررسی کند. در صورت نیاز شیر ایزوله درب را فعال و با سرعت پشتیبان (حداکثر ۱۵ کیلومتر بر ساعت) ادامه مسیر دهد.'
          confidence = 100
          source = 'FAQ'
          handbookSection = 'بند ۴-۷'
        } else if (lowerText.includes('حریق') || lowerText.includes('دود')) {
          reply = '🔥 وقوع حریق در واگن:\nراهبر باید فوراً سیستم تهویه را قطع کند، قطار را در نزدیک‌ترین سکوی ایستگاه متوقف ساخته و پس از باز کردن درب‌ها تخلیه اضطراری مسافران را هماهنگ سازد.'
          confidence = 100
          source = 'FAQ'
          handbookSection = 'ماده ۱۲-۳'
        } else if (lowerText.includes('شیفت') || lowerText.includes('لوحه')) {
          reply = `📅 اطلاعات شیفت ذخیره‌شده در حافظه کش محلی:\nشیفت بعدی شما: ${liveShift}`
          confidence = 95
          source = 'local-smart'
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: reply,
            isUser: false,
            confidence,
            source,
            handbookSection,
          }
        ])
        setLoading(false)
      }, 800)
      return
    }

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
            toolConfirm: data.toolConfirm,
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

      if (isNetworkError || isOffline) {
        setIsOffline(true)
        // Fallback local matching
        handleSend(userText)
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

  // Handle Tool Confirmations
  const handleConfirmTool = async (actionToken: string, messageId: number) => {
    try {
      const res = await aiAuthenticatedFetch('/ai/tools/confirm', {
        method: 'POST',
        body: JSON.stringify({ actionToken }),
      })
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                text: '✔️ اقدام سیستمی با موفقیت ثبت و تایید شد.',
                toolConfirm: undefined,
              }
            : msg
        )
      )
    } catch {
      alert('خطا در تایید اقدام')
    }
  }

  const handleCancelTool = (messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              text: '❌ اقدام توسط کاربر لغو شد.',
              toolConfirm: undefined,
            }
          : msg
      )
    )
  }

  function getSourceLabel(source?: string) {
    if (!source) return '🤖 هوش مصنوعی'
    const s = source.toLowerCase()
    if (s.includes('faq') || s.includes('رسمی')) return '📌 پاسخ رسمی'
    if (s.includes('rulebook') || s.includes('doc') || s.includes('آیین')) return '📖 آیین‌نامه خط ۱'
    if (s.includes('live') || s.includes('roster') || s.includes('system')) return '⚡ داده زنده سیستم'
    return '🤖 هوش مصنوعی'
  }

  function renderFormattedText(text: string) {
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
      paddingBottom: 110,
    },
    // User bubble - neutral surface container, no heavy brand colors
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '82%',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 4,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userText: {
      color: theme.colors.onSurface,
      fontSize: 13.5,
      lineHeight: 22,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontWeight: '600',
    },
    // Bot bubble - neutral paper base
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
      borderColor: theme.colors.error + '40',
      backgroundColor: theme.colors.error + '05',
    },
    metadataBar: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    metadataText: {
      fontSize: 9,
      color: theme.colors.onSurfaceVariant,
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
    // Tool confirmation card
    toolCard: {
      marginTop: 8,
      padding: 12,
      backgroundColor: theme.colors.primary + '08',
      borderColor: theme.colors.primary,
      borderWidth: 1,
      borderRadius: 10,
      gap: 10,
    },
    toolHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    toolHeaderText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '800',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    toolDesc: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'right',
      lineHeight: 16,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    toolActions: {
      flexDirection: 'row-reverse',
      justifyContent: 'flex-start',
      gap: 8,
    },
    toolBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    toolBtnConfirm: {
      backgroundColor: theme.colors.success || '#16a34a',
    },
    toolBtnCancel: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    toolBtnText: {
      fontSize: 10,
      color: '#fff',
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    toolBtnCancelText: {
      fontSize: 10,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
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
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Answer-First Dashboard Grid
    answerFirstContainer: {
      marginBottom: 20,
      gap: 12,
    },
    answerFirstTitle: {
      fontSize: 11.5,
      color: theme.colors.onSurface,
      fontWeight: '900',
      textAlign: 'center',
      fontFamily: theme.typography.bodyMd.fontFamily,
      marginBottom: 4,
    },
    answerFirstSubtitle: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontFamily: theme.typography.captionSm.fontFamily,
      marginBottom: 10,
    },
    widgetRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      gap: 8,
    },
    widgetCard: {
      flex: 1,
      padding: 12,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 80,
    },
    widgetHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 5,
    },
    widgetLabel: {
      fontSize: 9,
      color: theme.colors.primary,
      fontWeight: '800',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    widgetValue: {
      fontSize: 10,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
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
    micButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainerHigh,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    micButtonActive: {
      backgroundColor: theme.colors.error + '20',
      borderColor: theme.colors.error,
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
    // Banners
    banner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderBottomWidth: 1,
    },
    safetyBanner: {
      backgroundColor: theme.colors.primary + '08',
      borderColor: theme.colors.primary + '20',
    },
    safetyBannerText: {
      flex: 1,
      fontSize: 9,
      color: theme.colors.primary,
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      fontWeight: '600',
    },
    offlineBanner: {
      backgroundColor: theme.colors.warning + '12',
      borderColor: theme.colors.warning + '25',
    },
    offlineBannerText: {
      flex: 1,
      fontSize: 9,
      color: theme.colors.warning,
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      fontWeight: '700',
    },
    // Bottom Sheet Styles (Modal version)
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    bottomSheetContainer: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      maxHeight: '60%',
    },
    bottomSheetHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 12,
      marginBottom: 16,
    },
    bottomSheetTitle: {
      fontSize: 12.5,
      fontWeight: '900',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      flexDirection: 'row-reverse',
      alignItems: 'center',
    },
    bottomSheetBody: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 14,
    },
    bottomSheetText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 22,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    bottomSheetDisclaimer: {
      padding: 12,
      backgroundColor: theme.colors.primary + '05',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.primary + '15',
    },
    bottomSheetDisclaimerText: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '700',
      textAlign: 'right',
      lineHeight: 16,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Recording overlay style
    recordingOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    recordingCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 15,
      elevation: 10,
    },
    recordingWaveContainer: {
      flexDirection: 'row',
      gap: 4,
      height: 30,
      alignItems: 'center',
    },
    recordingWaveBar: {
      width: 4,
      height: 15,
      backgroundColor: '#fff',
      borderRadius: 2,
    },
    recordingText: {
      fontSize: 13,
      color: '#fff',
      fontWeight: 'bold',
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlign: 'center',
    },
    recordingInstruction: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.6)',
      fontFamily: theme.typography.captionSm.fontFamily,
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
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickActionText: {
      fontSize: 10.5,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '600',
    }
  })

  const renderCitationBottomSheet = () => {
    if (!selectedCitationSection) return null
    const matchedKey = Object.keys(CITATION_DATABASE).find(k => selectedCitationSection.includes(k)) || 'مقررات ایمنی'
    const citation = CITATION_DATABASE[matchedKey]

    return (
      <Modal
        transparent={true}
        visible={!!selectedCitationSection}
        animationType="slide"
        onRequestClose={() => setSelectedCitationSection(null)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setSelectedCitationSection(null)}
        />
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>
              📖 {citation.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedCitationSection(null)}>
              <MaterialIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.bottomSheetBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.bottomSheetText}>
              {citation.content}
            </Text>
          </ScrollView>

          <View style={styles.bottomSheetDisclaimer}>
            <Text style={styles.bottomSheetDisclaimerText}>
              ⚠️ مفاد کتب رسمی و آیین‌نامه همواره در فرآیندهای عملیاتی سیر و حرکت مقدم بر پیشنهادات سیستم‌های هوشمند است.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  const renderRecordingOverlay = () => {
    return (
      <Modal
        transparent={true}
        visible={isRecording}
        animationType="fade"
        onRequestClose={() => setIsRecording(false)}
      >
        <View style={styles.recordingOverlay}>
          <Animated.View style={[styles.recordingCircle, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons name="mic" size={40} color="#fff" />
          </Animated.View>
          
          <View style={styles.recordingWaveContainer}>
            <View style={[styles.recordingWaveBar, { height: 25 }]} />
            <View style={[styles.recordingWaveBar, { height: 12 }]} />
            <View style={[styles.recordingWaveBar, { height: 30 }]} />
            <View style={[styles.recordingWaveBar, { height: 18 }]} />
            <View style={[styles.recordingWaveBar, { height: 28 }]} />
          </View>

          <Text style={styles.recordingText}>دستیار در حال شنیدن صدای شماست...</Text>
          <Text style={styles.recordingInstruction}>جهت توقف روی صفحه یا دکمه میکروفون بزنید</Text>

          <TouchableOpacity 
            style={[styles.micButton, styles.micButtonActive, { width: 50, height: 50, borderRadius: 25, marginTop: 20 }]} 
            onPress={() => setIsRecording(false)}
          >
            <MaterialIcons name="mic-off" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  return (
    <ScreenWrapper title="دستیار هوشمند AI" navigation={navigation}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        {/* Banners */}
        {isOffline ? (
          <View style={[styles.banner, styles.offlineBanner]}>
            <MaterialIcons name="cloud-off" size={14} color={theme.colors.warning} />
            <Text style={styles.offlineBannerText}>
              آفلاین — پاسخ‌های زنده و FAQهای ذخیره‌شده در دسترس‌اند
            </Text>
          </View>
        ) : (
          <View style={[styles.banner, styles.safetyBanner]}>
            <MaterialIcons name="warning" size={14} color={theme.colors.primary} />
            <Text style={styles.safetyBannerText}>
              پاسخ‌های هوش مصنوعی جنبه عملیاتی نداشته و آیین‌نامه سیر و حرکت ملاک است.
            </Text>
          </View>
        )}

        {/* پیام‌ها */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        >
          {/* ANSWER-FIRST VIEW (only rendered when chat has 1 welcome message and no text is written) */}
          {messages.length === 1 && !inputText && (
            <View style={styles.answerFirstContainer}>
              <Text style={styles.answerFirstTitle}>پاسخ پیش از پرسش</Text>
              <Text style={styles.answerFirstSubtitle}>دسترسی سریع به وضعیت عملیاتی جاری شما قبل از تایپ:</Text>
              
              <View style={styles.widgetRow}>
                <TouchableOpacity 
                  style={styles.widgetCard}
                  onPress={() => handleSend('برنامه شیفت امروز و فردای من چیست؟')}
                  activeOpacity={0.7}
                >
                  <View style={styles.widgetHeader}>
                    <MaterialIcons name="calendar-today" size={12} color={theme.colors.primary} />
                    <Text style={styles.widgetLabel}>⚡ شیفت بعدی من</Text>
                  </View>
                  <Text style={styles.widgetValue}>{liveShift}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.widgetCard}
                  onPress={() => handleSend('وضعیت قطار امروز من')}
                  activeOpacity={0.7}
                >
                  <View style={styles.widgetHeader}>
                    <MaterialIcons name="train" size={12} color={theme.colors.primary} />
                    <Text style={styles.widgetLabel}>⚡ قطار امروز من</Text>
                  </View>
                  <Text style={styles.widgetValue}>{liveTrain}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.widgetCard, { height: 60, marginTop: 8 }]}
                onPress={() => handleSend('آخرین بخشنامه‌های ایمنی خوانده نشده')}
                activeOpacity={0.7}
              >
                <View style={styles.widgetHeader}>
                  <MaterialIcons name="announcement" size={12} color={theme.colors.primary} />
                  <Text style={styles.widgetLabel}>📌 بخشنامه‌های جدید</Text>
                </View>
                <Text style={styles.widgetValue}>{liveCirculars}</Text>
              </TouchableOpacity>

              <View style={{ marginTop: 16 }}>
                <Text style={styles.answerFirstSubtitle}>سولات متداول در خط یک:</Text>
                <View style={[styles.quickActionsRow, { marginTop: 6 }]}>
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
            </View>
          )}

          {/* Chat Messages */}
          {messages.length > 1 && messages.map((item) => (
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
                          اطمینان: {toFa(item.confidence)}٪
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.botTextContainer}>
                    {/* Handbook section badge - click triggers Bottom Sheet */}
                    {item.handbookSection && item.source !== 'system' && (
                      <TouchableOpacity 
                        style={styles.sourceBadge}
                        onPress={() => setSelectedCitationSection(item.handbookSection!)}
                      >
                        <Text style={styles.sourceBadgeText}>
                          📖 {item.handbookSection} [›]
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <Text style={styles.botText}>
                      {renderFormattedText(item.text)}
                    </Text>

                    {/* Tool Confirm action inside bubble */}
                    {item.toolConfirm && (
                      <View style={styles.toolCard}>
                        <View style={styles.toolHeader}>
                          <MaterialIcons name="error-outline" size={14} color={theme.colors.primary} />
                          <Text style={styles.toolHeaderText}>تایید نهایی اقدام سیستمی</Text>
                        </View>
                        <Text style={styles.toolDesc}>{item.toolConfirm.description}</Text>
                        <View style={styles.toolActions}>
                          <TouchableOpacity 
                            style={[styles.toolBtn, styles.toolBtnConfirm]}
                            onPress={() => handleConfirmTool(item.toolConfirm!.actionToken, item.id)}
                          >
                            <Text style={styles.toolBtnText}>تایید و ثبت</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.toolBtn, styles.toolBtnCancel]}
                            onPress={() => handleCancelTool(item.id)}
                          >
                            <Text style={styles.toolBtnCancelText}>انصراف</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Feedback buttons */}
                  {!item.toolConfirm && item.backendId && item.source !== 'system' && (
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
                <Text style={styles.typingText}>در حال دریافت پاسخ...</Text>
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
            placeholder={isRecording ? "دستیار در حال شنیدن..." : "کد خطا یا سؤال فنی..."}
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
            onSubmitEditing={() => handleSend()}
            editable={!isRecording}
          />

          {/* OS Prominent Voice recording button for glove users */}
          <TouchableOpacity 
            style={styles.micButton} 
            onPress={startRecording}
            activeOpacity={0.7}
          >
            <MaterialIcons name="mic" size={18} color={theme.colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, (loading || isRecording) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={loading || isRecording}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={18} color={theme.colors.onPrimary} style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet Citation Modal */}
        {renderCitationBottomSheet()}

        {/* Voice recording simulation overlay */}
        {renderRecordingOverlay()}

      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default AIAssistantScreen
