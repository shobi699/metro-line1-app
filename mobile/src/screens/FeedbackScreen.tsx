import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { API_URL } from '../shared/config'
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Star, 
  AlertTriangle, 
  User, 
  Calendar, 
  MessageCircle, 
  Info, 
  Lock, 
  Share2, 
  Check, 
  ArrowRight,
  EyeOff,
  UserCheck
} from 'lucide-react-native'

interface Category {
  id: string
  key: string
  title: string
  icon?: string
  description?: string
  allowAnonymous: boolean
  forceAnonymous: boolean
  confidential: boolean
  ideaBoard: boolean
}

interface FeedbackMessage {
  id: string
  senderKind: 'submitter' | 'staff'
  senderId?: string | null
  body: string
  createdAt: string
  isInternal: boolean
  sender?: { name: string } | null
}

interface FeedbackLog {
  id: string
  action: string
  createdAt: string
  actor?: { name: string } | null
}

interface FeedbackItem {
  id: string
  feedbackNo: number
  type: string
  title: string
  body: string
  status: string
  isAnonymous: boolean
  anonToken?: string | null
  isPublicIdea: boolean
  ideaVotesCount: number
  createdAt: string
  reply?: string | null
  repliedAt?: string | null
  repliedBy?: string | null
  priority: string
  user?: { name: string } | null
  category?: { title: string; key: string } | null
  messages?: FeedbackMessage[]
  logs?: FeedbackLog[]
}

// Helper to format numbers to Farsi digits
const toFa = (numStr: string | number | null | undefined) => {
  if (numStr === undefined || numStr === null) return ''
  const str = numStr.toString()
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return str.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
}

export function FeedbackScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const { theme } = useTheme()

  // Tabs: 'my' (My Feedbacks), 'track' (Anonymous Tracking), 'ideas' (Idea Board)
  const [activeTab, setActiveTab] = useState<'my' | 'track' | 'ideas'>('my')

  // Data Loading States
  const [myFeedbacks, setMyFeedbacks] = useState<FeedbackItem[]>([])
  const [ideas, setIdeas] = useState<FeedbackItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Feedback Submission Form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'suggestion',
    categoryId: '',
    title: '',
    body: '',
    isAnonymous: false,
    priority: 'normal',
    isPublicIdea: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // Tracking Anonymous States
  const [anonTokenSearch, setAnonTokenSearch] = useState('')
  const [trackedFeedback, setTrackedFeedback] = useState<FeedbackItem | null>(null)
  const [trackedLoading, setTrackedLoading] = useState(false)

  // Success Modal for newly created anonymous ticket
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [newAnonToken, setNewAnonToken] = useState('')
  const [newFeedbackNo, setNewFeedbackNo] = useState('')

  // Conversation Detail Modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [threadMessages, setThreadMessages] = useState<FeedbackMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessageText, setNewMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  const messagesScrollRef = useRef<ScrollView>(null)

  const statusLabel: Record<string, string> = { 
    submitted: 'دریافت شد', 
    under_review: 'در حال بررسی', 
    responded: 'پاسخ داده شد',
    resolved: 'حل شده',
    closed: 'بسته شده'
  }
  const statusColor: Record<string, string> = { 
    submitted: theme.colors.info, 
    under_review: theme.colors.warning, 
    responded: theme.colors.success,
    resolved: theme.colors.success,
    closed: theme.colors.secondary
  }

  useEffect(() => {
    loadCategories()
    if (activeTab === 'my') {
      loadMyFeedbacks()
    } else if (activeTab === 'ideas') {
      loadIdeas()
    }
  }, [accessToken, activeTab])

  // Load active feedback categories
  async function loadCategories() {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_URL}/feedback/categories`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setCategories(json.data || [])
        if (json.data && json.data.length > 0 && !form.categoryId) {
          setForm((prev) => ({ ...prev, categoryId: json.data[0].id }))
        }
      }
    } catch (e) {
      console.warn('Failed to load categories', e)
    }
  }

  // Load feedbacks submitted by the logged-in user
  async function loadMyFeedbacks() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setMyFeedbacks(json.data?.items ?? [])
      }
    } catch (e) {
      console.warn('Failed to load my feedbacks', e)
    } finally {
      setLoading(false)
    }
  }

  // Load public ideas
  async function loadIdeas() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/feedback?isPublicIdea=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setIdeas(json.data?.items ?? [])
      }
    } catch (e) {
      console.warn('Failed to load ideas', e)
    } finally {
      setLoading(false)
    }
  }

  // Track anonymous feedback by token
  async function handleTrackAnonymous() {
    if (!anonTokenSearch.trim()) return
    setTrackedLoading(true)
    setTrackedFeedback(null)
    try {
      const res = await fetch(`${API_URL}/feedback/track/${anonTokenSearch.trim()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok) {
        setTrackedFeedback(json.data)
      } else {
        Alert.alert('خطا', json.error?.message || 'بازخوردی با این توکن یافت نشد.')
      }
    } catch {
      Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور.')
    } finally {
      setTrackedLoading(false)
    }
  }

  // Handle feedback submission
  async function handleSubmit() {
    if (!accessToken || !form.title || !form.body) return
    setSubmitting(true)
    try {
      // Find active category configuration
      const selectedCat = categories.find((c) => c.id === form.categoryId)
      const isAnon = selectedCat?.forceAnonymous ? true : form.isAnonymous

      const body = {
        type: form.type,
        title: form.title,
        body: form.body,
        isAnonymous: isAnon,
        categoryId: form.categoryId,
        priority: form.priority,
        isPublicIdea: selectedCat?.ideaBoard ? form.isPublicIdea : false,
      }

      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const json = await res.json()
        setForm({
          type: 'suggestion',
          categoryId: categories[0]?.id || '',
          title: '',
          body: '',
          isAnonymous: false,
          priority: 'normal',
          isPublicIdea: false,
        })
        setShowForm(false)

        if (json.data?.anonToken) {
          setNewAnonToken(json.data.anonToken)
          setNewFeedbackNo(`FB-${json.data.feedbackNo}`)
          setShowTokenModal(true)
        } else {
          Alert.alert('ثبت شد', `پیام شما با شماره پرونده FB-${json.data?.feedbackNo} با موفقیت ثبت شد.`)
          loadMyFeedbacks()
        }
      } else {
        const errJson = await res.json()
        Alert.alert('خطا در ثبت', errJson.error?.message || 'ثبت با شکست مواجه شد.')
      }
    } catch {
      Alert.alert('خطا', 'خطای شبکه در ارسال پیام.')
    } finally {
      setSubmitting(false)
    }
  }

  // Vote or Unvote on public idea
  async function handleVoteIdea(ideaId: string) {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_URL}/feedback/${ideaId}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        // Toggle client-side votes locally
        if (activeTab === 'ideas') {
          setIdeas((prev) =>
            prev.map((i) => {
              if (i.id === ideaId) {
                // Since vote API toggles, we re-query or adjust count
                const wasVoted = i.ideaVotesCount > 0 // simple toggle mock
                return {
                  ...i,
                  ideaVotesCount: wasVoted ? i.ideaVotesCount - 1 : i.ideaVotesCount + 1,
                }
              }
              return i
            })
          )
        } else {
          loadMyFeedbacks()
        }
      }
    } catch (e) {
      console.warn('Failed to vote', e)
    }
  }

  // Fetch messages thread for a feedback
  async function openConversation(feedback: FeedbackItem) {
    setSelectedFeedback(feedback)
    setThreadMessages([])
    setLoadingMessages(true)
    
    // Check if anonymous token is available
    const tokenParam = feedback.anonToken ? `?anonToken=${feedback.anonToken}` : ''
    
    try {
      const res = await fetch(`${API_URL}/feedback/${feedback.id}${tokenParam}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setThreadMessages(json.data?.messages ?? [])
      }
    } catch (e) {
      console.warn('Failed to load thread messages', e)
    } finally {
      setLoadingMessages(false)
      setTimeout(() => {
        messagesScrollRef.current?.scrollToEnd({ animated: true })
      }, 200)
    }
  }

  // Send a message inside conversation thread
  async function handleSendMessage() {
    if (!selectedFeedback || !newMessageText.trim() || sendingMessage) return
    setSendingMessage(true)

    const tokenParam = selectedFeedback.anonToken ? `?anonToken=${selectedFeedback.anonToken}` : ''
    
    try {
      const res = await fetch(`${API_URL}/feedback/${selectedFeedback.id}/messages${tokenParam}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: newMessageText.trim(),
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setThreadMessages((prev) => [...prev, json.data])
        setNewMessageText('')
        setTimeout(() => {
          messagesScrollRef.current?.scrollToEnd({ animated: true })
        }, 100)
      } else {
        const errJson = await res.json()
        Alert.alert('خطا', errJson.error?.message || 'ارسال پیام با خطا مواجه شد.')
      }
    } catch {
      Alert.alert('خطا', 'خطای ارتباط با سرور.')
    } finally {
      setSendingMessage(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 12,
    },
    // Tabs Header styling
    tabsContainer: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.lg,
      padding: 4,
      marginBottom: 14,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
    },
    tabButtonActive: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    tabText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    tabTextActive: {
      color: theme.colors.onSurface,
      fontWeight: '900',
    },
    newButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      height: 40,
      marginBottom: 12,
    },
    newButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 12.5,
      fontWeight: '800',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    // Dynamic Form styling
    formCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.xl,
      padding: 14,
      marginBottom: 16,
    },
    formTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: theme.colors.onSurface,
      textAlign: 'right',
      marginBottom: 10,
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    formRow: {
      marginBottom: 10,
    },
    formLabel: {
      fontSize: 11,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginBottom: 4,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    dropdown: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      height: 40,
      color: theme.colors.onSurface,
      paddingHorizontal: 10,
      fontSize: 12.5,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    input: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      height: 40,
      color: theme.colors.onSurface,
      paddingHorizontal: 10,
      fontSize: 12.5,
      marginBottom: 10,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 8,
    },
    anonymousToggle: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    anonymousToggleLabel: {
      fontSize: 11,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    toggleInfo: {
      fontSize: 9,
      color: theme.colors.warning,
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      marginBottom: 10,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitText: {
      color: theme.colors.onPrimary,
      fontSize: 12.5,
      fontWeight: '800',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    // Cards rendering
    listContainer: {
      paddingBottom: 24,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.xl,
      padding: 12,
      marginBottom: 10,
    },
    cardHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.onSurface,
      textAlign: 'right',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    statusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '900',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    cardBody: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'right',
      lineHeight: 18,
      fontFamily: theme.typography.bodyMd.fontFamily,
      marginBottom: 8,
    },
    cardFooter: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border + '50',
      paddingTop: 8,
    },
    cardMetaRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    metaLabel: {
      fontSize: 9.5,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: 'bold',
    },
    cardTime: {
      fontSize: 9.5,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    voteButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    voteButtonActive: {
      backgroundColor: theme.colors.primary + '10',
      borderColor: theme.colors.primary,
    },
    voteText: {
      fontSize: 10,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Anonymous Search View
    searchContainer: {
      flexDirection: 'row-reverse',
      gap: 8,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      height: 40,
      paddingHorizontal: 12,
      fontSize: 12.5,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    searchButton: {
      backgroundColor: theme.colors.primary,
      width: 80,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 11.5,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    // Chat Modal layout
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    chatModalContainer: {
      backgroundColor: theme.colors.background,
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: Platform.OS === 'ios' ? 60 : 40,
      overflow: 'hidden',
    },
    chatHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    chatHeaderTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    closeButton: {
      padding: 4,
    },
    chatScroll: {
      flex: 1,
      padding: 14,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 10,
      borderRadius: 12,
      marginBottom: 10,
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderBottomRightRadius: 2,
    },
    staffMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 2,
    },
    messageBody: {
      fontSize: 12,
      color: theme.colors.onSurface,
      lineHeight: 18,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    messageSender: {
      fontSize: 8.5,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 3,
      textAlign: 'right',
    },
    messageTime: {
      fontSize: 8.5,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'left',
    },
    chatInputBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceContainerLow,
      gap: 8,
    },
    chatInput: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      height: 36,
      paddingHorizontal: 12,
      fontSize: 12.5,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    chatSendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatSendBtnDisabled: {
      opacity: 0.5,
    },
    // New anonymous token success modal
    tokenModalContainer: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: 20,
      padding: 20,
      width: '85%',
      alignSelf: 'center',
      marginTop: '40%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    tokenTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.cardTitle.fontFamily,
      marginBottom: 10,
    },
    tokenValueBox: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.warning,
      borderRadius: 10,
      padding: 12,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    tokenText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.warning,
      fontFamily: theme.typography.bodyMd.fontFamily,
      letterSpacing: 1,
    },
    tokenWarning: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 16,
      fontFamily: theme.typography.captionSm.fontFamily,
      marginBottom: 16,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 8,
      fontFamily: theme.typography.bodyMd.fontFamily,
    }
  })

  // Check category anonymous constraints
  const getActiveCategoryInfo = () => {
    return categories.find((c) => c.id === form.categoryId)
  }

  const categoryInfo = getActiveCategoryInfo()

  return (
    <ScreenWrapper title="صدای کارکنان (بازخوردها)" navigation={navigation}>
      <View style={styles.container}>
        
        {/* TABS SELECTOR */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              مکاتبات من
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'track' && styles.tabButtonActive]}
            onPress={() => setActiveTab('track')}
          >
            <Text style={[styles.tabText, activeTab === 'track' && styles.tabTextActive]}>
              پیگیری ناشناس
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'ideas' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ideas')}
          >
            <Text style={[styles.tabText, activeTab === 'ideas' && styles.tabTextActive]}>
              تابلوی ایده‌ها
            </Text>
          </TouchableOpacity>
        </View>

        {/* WRITE NEW FEEDBACK BTN (only for my feedbacks tab) */}
        {activeTab === 'my' && (
          <TouchableOpacity 
            style={styles.newButton} 
            onPress={() => setShowForm(!showForm)} 
            activeOpacity={0.7}
          >
            <Send size={15} color={theme.colors.onPrimary} style={{ transform: [{ scaleX: -1 }] }} />
            <Text style={styles.newButtonText}>ثبت پیشنهاد یا بازخورد جدید</Text>
          </TouchableOpacity>
        )}

        {/* DYNAMIC SUBMISSION FORM CARD */}
        {showForm && activeTab === 'my' && (
          <ScrollView style={styles.formCard} showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>ارسال پیشنهاد یا انتقاد جدید</Text>
            
            {/* Category Dropdown */}
            {categories.length > 0 && (
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>دسته‌بندی بازخورد</Text>
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    const cat = categories.find(c => c.id === e.target.value)
                    setForm({
                      ...form,
                      categoryId: e.target.value,
                      isAnonymous: cat?.forceAnonymous ? true : false
                    })
                  }}
                  style={styles.dropdown}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </View>
            )}

            {/* Type selector */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>نوع پیام</Text>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={styles.dropdown}
              >
                <option value="suggestion">💡 پیشنهاد بهبود</option>
                <option value="criticism">⚠️ انتقاد سازنده</option>
                <option value="complaint">💬 شکایت اداری / پرسنلی</option>
                <option value="appreciation">⭐️ تقدیر و تشکر</option>
              </select>
            </View>

            {/* Subject Input */}
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
              placeholder="موضوع پیام..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              textAlign="right"
            />

            {/* Body TextArea */}
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.body}
              onChangeText={(t) => setForm({ ...form, body: t })}
              placeholder="متن پیام شما..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              textAlign="right"
              multiline
              numberOfLines={4}
            />

            {/* Anonymous Toggle (True Anonymity) */}
            {categoryInfo?.allowAnonymous && !categoryInfo.forceAnonymous && (
              <View style={styles.anonymousToggle}>
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                />
                <Text style={styles.anonymousToggleLabel}>ارسال به صورت ناشناس واقعی</Text>
              </View>
            )}

            {categoryInfo?.forceAnonymous && (
              <View style={[styles.anonymousToggle, { borderColor: theme.colors.warning }]}>
                <EyeOff size={16} color={theme.colors.warning} />
                <Text style={[styles.anonymousToggleLabel, { color: theme.colors.warning }]}>
                  این دسته طبق مقررات الزاما ناشناس ثبت می‌شود
                </Text>
              </View>
            )}

            {/* Idea Board Toggle */}
            {categoryInfo?.ideaBoard && (
              <View style={styles.anonymousToggle}>
                <input
                  type="checkbox"
                  checked={form.isPublicIdea}
                  onChange={(e) => setForm({ ...form, isPublicIdea: e.target.checked })}
                />
                <Text style={styles.anonymousToggleLabel}>انتشار روی تابلوی ایده‌های عمومی</Text>
              </View>
            )}

            {form.isAnonymous && (
              <Text style={styles.toggleInfo}>
                ⚠️ در صورت ثبت ناشناس، توکن پیگیری امن برای شما صادر خواهد شد تا بتوانید بدون ثبت هویت، پاسخ‌ها را پیگیری نمایید.
              </Text>
            )}

            {/* Priority Selector */}
            <View style={[styles.formRow, { marginTop: 4 }]}>
              <Text style={styles.formLabel}>اولویت پیشنهادی</Text>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={styles.dropdown}
              >
                <option value="normal">عادی</option>
                <option value="high">بالا / فوری</option>
                <option value="critical">بحرانی / نیازمند اقدام OCC</option>
              </select>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 12, marginBottom: 20 }}>
              <TouchableOpacity 
                style={[styles.submitButton, { flex: 1 }]} 
                onPress={handleSubmit} 
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>ارسال پیام رسمی</Text>}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]} 
                onPress={() => setShowForm(false)}
              >
                <Text style={[styles.submitText, { color: theme.colors.onSurface }]}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* TAB Content 1: My Feedbacks */}
        {activeTab === 'my' && (
          loading ? (
            <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : (
            <FlatList
              data={myFeedbacks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.card}
                  onPress={() => openConversation(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor[item.status]}1A` }]}>
                      <Text style={[styles.statusText, { color: statusColor[item.status] }]}>{statusLabel[item.status]}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.cardMetaRow}>
                      {item.isAnonymous ? (
                        <Text style={[styles.metaLabel, { color: theme.colors.warning }]}>🔒 ناشناس</Text>
                      ) : (
                        <Text style={styles.metaLabel}>👤 {item.user?.name || 'پرسنل'}</Text>
                      )}
                      <Text style={styles.cardTime}>• {toFa(new Date(item.createdAt).toLocaleDateString('fa-IR'))}</Text>
                    </View>
                    
                    {item.isPublicIdea && (
                      <TouchableOpacity 
                        style={[styles.voteButton, item.ideaVotesCount > 0 && styles.voteButtonActive]}
                        onPress={() => handleVoteIdea(item.id)}
                      >
                        <ThumbsUp size={11} color={theme.colors.primary} />
                        <Text style={styles.voteText}>{toFa(item.ideaVotesCount)} رأی</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <MessageSquare size={40} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyText}>مکاتبه‌ای یافت نشد.</Text>
                </View>
              }
            />
          )
        )}

        {/* TAB Content 2: Anonymous Tracking */}
        {activeTab === 'track' && (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={anonTokenSearch}
                onChangeText={setAnonTokenSearch}
                placeholder="توکن امنیتی پیگیری ناشناس را وارد کنید..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                textAlign="right"
              />
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={handleTrackAnonymous}
                disabled={trackedLoading}
              >
                {trackedLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>پیگیری</Text>}
              </TouchableOpacity>
            </View>

            {trackedFeedback && (
              <TouchableOpacity 
                style={[styles.card, { borderColor: theme.colors.warning }]}
                onPress={() => openConversation(trackedFeedback)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{trackedFeedback.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor[trackedFeedback.status]}1A` }]}>
                    <Text style={[styles.statusText, { color: statusColor[trackedFeedback.status] }]}>{statusLabel[trackedFeedback.status]}</Text>
                  </View>
                </View>
                <Text style={styles.cardBody}>{trackedFeedback.body}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.metaLabel, { color: theme.colors.warning }]}>🔒 کانال ناشناس فعال</Text>
                  <Text style={styles.cardTime}>{toFa(new Date(trackedFeedback.createdAt).toLocaleDateString('fa-IR'))}</Text>
                </View>
                
                {/* Visual Status Indicator */}
                <View style={{ marginTop: 12, padding: 8, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 8, flexDirection: 'row-reverse', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Check size={14} color={theme.colors.success} />
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: theme.colors.success }}>ثبت شد</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Check size={14} color={trackedFeedback.status !== 'submitted' ? theme.colors.success : theme.colors.onSurfaceVariant} />
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: trackedFeedback.status !== 'submitted' ? theme.colors.success : theme.colors.onSurfaceVariant }}>بررسی</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Check size={14} color={(trackedFeedback.status === 'responded' || trackedFeedback.status === 'resolved' || trackedFeedback.status === 'closed') ? theme.colors.success : theme.colors.onSurfaceVariant} />
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: (trackedFeedback.status === 'responded' || trackedFeedback.status === 'resolved' || trackedFeedback.status === 'closed') ? theme.colors.success : theme.colors.onSurfaceVariant }}>پاسخ</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB Content 3: Idea Board */}
        {activeTab === 'ideas' && (
          loading ? (
            <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
          ) : (
            <FlatList
              data={ideas}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary + '10' }]}>
                      <Text style={[styles.statusText, { color: theme.colors.primary }]}>پیشنهاد عمومی</Text>
                    </View>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>ثبت: {toFa(new Date(item.createdAt).toLocaleDateString('fa-IR'))}</Text>
                    
                    <TouchableOpacity 
                      style={[styles.voteButton, item.ideaVotesCount > 0 && styles.voteButtonActive]}
                      onPress={() => handleVoteIdea(item.id)}
                    >
                      <ThumbsUp size={12} color={theme.colors.primary} />
                      <Text style={styles.voteText}>{toFa(item.ideaVotesCount)} موافق</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Star size={40} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.emptyText}>پیشنهاد عمومی فعالی یافت نشد.</Text>
                </View>
              }
            />
          )
        )}

        {/* 1. CHAT MESSAGE THREAD MODAL */}
        {selectedFeedback && (
          <Modal
            transparent={true}
            visible={!!selectedFeedback}
            animationType="slide"
            onRequestClose={() => setSelectedFeedback(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.chatModalContainer}>
                
                {/* Chat Modal Header */}
                <View style={styles.chatHeader}>
                  <TouchableOpacity 
                    onPress={() => setSelectedFeedback(null)}
                    style={styles.closeButton}
                  >
                    <ArrowRight size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                  <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                    💬 {selectedFeedback.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor[selectedFeedback.status]}1A` }]}>
                    <Text style={[styles.statusText, { color: statusColor[selectedFeedback.status] }]}>
                      {statusLabel[selectedFeedback.status]}
                    </Text>
                  </View>
                </View>

                {/* Messages List Area */}
                {loadingMessages ? (
                  <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
                ) : (
                  <ScrollView 
                    ref={messagesScrollRef}
                    style={styles.chatScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Render original ticket body as first message */}
                    <View style={[styles.messageBubble, styles.myMessage]}>
                      <Text style={styles.messageSender}>
                        {selectedFeedback.isAnonymous ? '👤 فرستنده (ناشناس)' : `👤 ${selectedFeedback.user?.name || 'فرستنده'}`}
                      </Text>
                      <Text style={styles.messageBody}>{selectedFeedback.body}</Text>
                      <Text style={styles.messageTime}>
                        {toFa(new Date(selectedFeedback.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
                      </Text>
                    </View>

                    {/* Thread messages */}
                    {threadMessages.map((msg) => (
                      <View 
                        key={msg.id}
                        style={[
                          styles.messageBubble, 
                          msg.senderKind === 'submitter' ? styles.myMessage : styles.staffMessage
                        ]}
                      >
                        <Text style={styles.messageSender}>
                          {msg.senderKind === 'submitter' 
                            ? (selectedFeedback.isAnonymous ? '👤 فرستنده (ناشناس)' : `👤 ${msg.sender?.name || 'فرستنده'}`)
                            : `🏢 مسئول رسیدگی (${msg.sender?.name || 'مدیریت'})`}
                        </Text>
                        <Text style={styles.messageBody}>{msg.body}</Text>
                        <Text style={styles.messageTime}>
                          {toFa(new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Reply Input Area */}
                <View style={styles.chatInputBar}>
                  <TextInput
                    style={styles.chatInput}
                    value={newMessageText}
                    onChangeText={setNewMessageText}
                    placeholder="پاسخ خود را بنویسید..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    textAlign="right"
                  />
                  <TouchableOpacity 
                    style={[styles.chatSendBtn, !newMessageText.trim() && styles.chatSendBtnDisabled]}
                    onPress={handleSendMessage}
                    disabled={!newMessageText.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Send size={15} color="#fff" style={{ transform: [{ scaleX: -1 }] }} />
                    )}
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </Modal>
        )}

        {/* 2. SUCCESS TOKEN SHOW MODAL FOR ANONYMOUS FEEDBACKS */}
        {showTokenModal && (
          <Modal
            transparent={true}
            visible={showTokenModal}
            animationType="fade"
            onRequestClose={() => setShowTokenModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.tokenModalContainer}>
                <EyeOff size={32} color={theme.colors.warning} style={{ marginBottom: 12 }} />
                
                <Text style={styles.tokenTitle}>بازخورد ناشناس با موفقیت ثبت شد</Text>
                <Text style={{ fontSize: 11.5, color: theme.colors.onSurface, marginBottom: 8, fontWeight: 'bold' }}>
                  شماره پیگیری: {newFeedbackNo}
                </Text>
                
                <View style={styles.tokenValueBox}>
                  <Text style={styles.tokenText}>{newAnonToken}</Text>
                </View>
                
                <Text style={styles.tokenWarning}>
                  ⚠️ توجه بسیار مهم: مشخصات هویتی شما به هیچ وجه ذخیره نشده است. جهت پیگیری پاسخ مدیریت، حتماً توکن امنیتی بالا را یادداشت یا کپی کنید. بدون داشتن این توکن، بازیابی این بازخورد امکان‌پذیر نخواهد بود.
                </Text>

                <TouchableOpacity 
                  style={[styles.submitButton, { width: '100%' }]}
                  onPress={() => {
                    setShowTokenModal(false)
                    setActiveTab('track')
                    setAnonTokenSearch(newAnonToken)
                  }}
                >
                  <Text style={styles.submitText}>تایید و پیگیری پرونده</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      </View>
    </ScreenWrapper>
  )
}

export default FeedbackScreen
