import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

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
  totalVotes: number
  userVote?: string | null
}

interface SurveyQuestion {
  id: string
  q: string
  type: 'multiple_choice' | 'rating' | 'text' | 'boolean'
  options?: string[]
  required?: boolean
}

interface Survey {
  id: string
  key: string
  title: string
  description: string | null
  status: string
  isAnonymous: boolean
  isMandatory: boolean
  schema: any // Array of SurveyQuestion
  creator?: { name: string }
}

export function PollsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [activeTab, setActiveTab] = useState<'polls' | 'surveys'>('polls')
  const [loading, setLoading] = useState(false)
  const [polls, setPolls] = useState<Poll[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])

  // Survey Answering Modal State
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, any>>({})
  const [surveyDuration, setSurveyDuration] = useState(0)
  const [submittingSurvey, setSubmittingSurvey] = useState(false)

  const timerRef = useRef<any>(null)

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchPolls(), fetchSurveys()])
    } finally {
      setLoading(false)
    }
  }

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API_URL}/polls`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPolls(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching polls:', err)
    }
  }

  const fetchSurveys = async () => {
    try {
      const res = await fetch(`${API_URL}/surveys/my-pending`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSurveys(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching surveys:', err)
    }
  }

  useEffect(() => {
    if (accessToken) {
      void fetchData()
    }
  }, [accessToken])

  // Handle Poll Vote
  const handlePollVote = async (pollId: string, optionId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/polls`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ pollId, optionId }),
      })
      if (res.ok) {
        await fetchPolls()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error || 'خطا در ثبت رای')
      }
    } catch (err) {
      console.error(err)
      Alert.alert('خطا', 'عدم ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  // Answering Survey logic
  const startAnsweringSurvey = (survey: Survey) => {
    setSelectedSurvey(survey)
    const questions = typeof survey.schema === 'string' ? JSON.parse(survey.schema) : survey.schema
    setSurveyQuestions(questions || [])
    setCurrentQuestionIdx(0)
    setSurveyAnswers({})
    setSurveyDuration(0)

    // Start timer
    timerRef.current = setInterval(() => {
      setSurveyDuration((d) => d + 1)
    }, 1000)
  };

  const closeSurveyModal = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setSelectedSurvey(null)
  }

  const handleNextQuestion = () => {
    const currentQ = surveyQuestions[currentQuestionIdx]
    const answer = surveyAnswers[currentQ.id]

    if (currentQ.required && (answer === undefined || answer === '')) {
      Alert.alert('خطا', 'پاسخ به این سوال الزامی است')
      return
    }

    if (currentQuestionIdx < surveyQuestions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1)
    } else {
      void submitSurveyAnswers()
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((i) => i - 1)
    }
  }

  const submitSurveyAnswers = async () => {
    if (!selectedSurvey) return
    setSubmittingSurvey(true)
    try {
      const res = await fetch(`${API_URL}/surveys/${selectedSurvey.key}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          answers: surveyAnswers,
          durationSec: surveyDuration,
        }),
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'پاسخ‌های شما با موفقیت ثبت شد. با تشکر از مشارکت شما.')
        closeSurveyModal()
        await fetchSurveys()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error || 'خطا در ثبت پاسخ‌ها')
      }
    } catch (err) {
      console.error(err)
      Alert.alert('خطا', 'عدم ارتباط با سرور')
    } finally {
      setSubmittingSurvey(false)
    }
  }

  const toFa = (num: number | string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return String(num).replace(/[0-9]/g, (w) => farsiDigits[parseInt(w, 10)])
  }

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'surveys' && styles.activeTabButton]}
        onPress={() => setActiveTab('surveys')}
      >
        <Text style={[styles.tabText, activeTab === 'surveys' && styles.activeTabText]}>
          پیمایش‌های سازمانی ({toFa(surveys.length)})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'polls' && styles.activeTabButton]}
        onPress={() => setActiveTab('polls')}
      >
        <Text style={[styles.tabText, activeTab === 'polls' && styles.activeTabText]}>
          نظرسنجی‌های سریع ({toFa(polls.length)})
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderPollsContent = () => (
    <FlatList
      data={polls}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={fetchPolls}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons name="poll" size={48} color={theme.colors.secondary + '70'} />
          <Text style={styles.emptyText}>هیچ نظرسنجی فعالی یافت نشد.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const hasVoted = !!item.userVote
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}

            <View style={styles.optionsContainer}>
              {item.options.map((opt) => {
                const percentage =
                  item.totalVotes > 0
                    ? Math.round((opt._count.votes / item.totalVotes) * 100)
                    : 0
                const isSelected = item.userVote === opt.id

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionButton,
                      isSelected && { borderColor: theme.colors.primary },
                    ]}
                    disabled={hasVoted}
                    onPress={() => handlePollVote(item.id, opt.id)}
                  >
                    {/* Background Progress Bar Fill */}
                    {hasVoted && (
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isSelected
                              ? theme.colors.primary + '1a'
                              : theme.colors.border + '15',
                          },
                        ]}
                      />
                    )}

                    <View style={styles.optionRow}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} />
                        )}
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && { color: theme.colors.primary, fontWeight: '700' },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </View>

                      {hasVoted && (
                        <Text
                          style={[
                            styles.percentageText,
                            isSelected && { color: theme.colors.primary, fontWeight: '700' },
                          ]}
                        >
                          {toFa(percentage)}٪ ({toFa(opt._count.votes)} رأی)
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.cardFooter}>
              <MaterialIcons name="people" size={14} color={theme.colors.secondary} />
              <Text style={styles.totalVotesText}>کل آرا: {toFa(item.totalVotes)} نفر</Text>
            </View>
          </View>
        )
      }}
    />
  )

  const renderSurveysContent = () => (
    <FlatList
      data={surveys}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={fetchSurveys}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={48} color={theme.colors.secondary + '70'} />
          <Text style={styles.emptyText}>هیچ پیمایش فعال معوقه‌ای ندارید.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.surveyTitleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 4 }}>
              {item.isMandatory && (
                <View style={[styles.badge, { backgroundColor: theme.colors.errorContainer }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.error }]}>الزامی</Text>
                </View>
              )}
              {item.isAnonymous && (
                <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.primary }]}>ناشناس</Text>
                </View>
              )}
            </View>
          </View>

          {item.description && <Text style={styles.cardDescription}>{item.description}</Text>}

          <View style={styles.surveyFooter}>
            <Text style={styles.totalVotesText}>سازنده: {item.creator?.name || 'سیستم'}</Text>
            <TouchableOpacity
              style={styles.startSurveyBtn}
              onPress={() => startAnsweringSurvey(item)}
            >
              <Text style={styles.startSurveyBtnText}>شروع پاسخ‌دهی</Text>
              <MaterialIcons name="chevron-left" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  )

  const renderRatingScale = (questionId: string) => {
    const selectedVal = surveyAnswers[questionId]
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((val) => {
            const isSelected = selectedVal === val
            return (
              <TouchableOpacity
                key={val}
                style={[
                  styles.ratingCircle,
                  isSelected && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setSurveyAnswers((a) => ({ ...a, [questionId]: val }))}
              >
                <Text
                  style={[
                    styles.ratingNumber,
                    isSelected && { color: '#fff', fontWeight: 'bold' },
                  ]}
                >
                  {toFa(val)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabelText}>بسیار ناراضی (۱)</Text>
          <Text style={styles.ratingLabelText}>بسیار راضی (۵)</Text>
        </View>
      </View>
    )
  }

  const renderBooleanButtons = (questionId: string) => {
    const selectedVal = surveyAnswers[questionId]
    return (
      <View style={styles.booleanRow}>
        <TouchableOpacity
          style={[
            styles.booleanButton,
            selectedVal === true && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSurveyAnswers((a) => ({ ...a, [questionId]: true }))}
        >
          <MaterialIcons
            name="check"
            size={18}
            color={selectedVal === true ? '#fff' : theme.colors.secondary}
          />
          <Text
            style={[
              styles.booleanBtnText,
              selectedVal === true && { color: '#fff', fontWeight: 'bold' },
            ]}
          >
            بله
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.booleanButton,
            selectedVal === false && {
              backgroundColor: theme.colors.error,
              borderColor: theme.colors.error,
            },
          ]}
          onPress={() => setSurveyAnswers((a) => ({ ...a, [questionId]: false }))}
        >
          <MaterialIcons
            name="close"
            size={18}
            color={selectedVal === false ? '#fff' : theme.colors.secondary}
          />
          <Text
            style={[
              styles.booleanBtnText,
              selectedVal === false && { color: '#fff', fontWeight: 'bold' },
            ]}
          >
            خیر
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderMultipleChoice = (q: SurveyQuestion) => {
    const selectedVal = surveyAnswers[q.id]
    const opts = q.options || []
    return (
      <View style={styles.mcContainer}>
        {opts.map((opt) => {
          const isSelected = selectedVal === opt
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.mcButton,
                isSelected && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.primary + '08',
                },
              ]}
              onPress={() => setSurveyAnswers((a) => ({ ...a, [q.id]: opt }))}
            >
              <MaterialIcons
                name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={isSelected ? theme.colors.primary : theme.colors.secondary}
              />
              <Text
                style={[
                  styles.mcLabelText,
                  isSelected && { color: theme.colors.primary, fontWeight: '700' },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  const renderActiveQuestion = () => {
    if (surveyQuestions.length === 0) return null
    const q = surveyQuestions[currentQuestionIdx]

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionTitleRow}>
          <Text style={styles.questionText}>{q.q}</Text>
          {q.required && <Text style={{ color: theme.colors.error, fontSize: 16 }}>*</Text>}
        </View>

        <View style={{ marginTop: 20 }}>
          {q.type === 'rating' && renderRatingScale(q.id)}
          {q.type === 'boolean' && renderBooleanButtons(q.id)}
          {q.type === 'multiple_choice' && renderMultipleChoice(q)}
          {q.type === 'text' && (
            <TextInput
              style={styles.textQuestionInput}
              multiline
              value={surveyAnswers[q.id] || ''}
              onChangeText={(val) => setSurveyAnswers((a) => ({ ...a, [q.id]: val }))}
              placeholder="پاسخ خود را در این بخش بنویسید..."
              placeholderTextColor={theme.colors.secondary + '70'}
            />
          )}
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    tabContainer: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 4,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 12,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
    },
    activeTabButton: {
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    tabText: {
      fontSize: 12,
      color: theme.colors.secondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 100,
    },
    emptyText: {
      fontSize: 12.5,
      color: theme.colors.secondary,
      marginTop: 12,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
      marginVertical: 5,
    },
    surveyTitleRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'right',
      flex: 1,
    },
    cardDescription: {
      fontSize: 11.5,
      color: theme.colors.secondary,
      textAlign: 'right',
      lineHeight: 16,
      marginTop: 4,
    },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 8.5,
      fontWeight: 'bold',
    },
    optionsContainer: {
      marginTop: 12,
      gap: 6,
    },
    optionButton: {
      borderWidth: 1,
      borderColor: theme.colors.border + '50',
      borderRadius: theme.borderRadius.md,
      padding: 11,
      position: 'relative',
      overflow: 'hidden',
    },
    progressFill: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
    },
    optionRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1,
    },
    optionLabel: {
      fontSize: 11.5,
      color: theme.colors.onSurface,
    },
    percentageText: {
      fontSize: 10.5,
      color: theme.colors.secondary,
    },
    cardFooter: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '15',
      gap: 4,
    },
    totalVotesText: {
      fontSize: 10.5,
      color: theme.colors.secondary,
    },
    surveyFooter: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '15',
    },
    startSurveyBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
    },
    startSurveyBtnText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
    },
    // Survey Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: Dimensions.get('window').width * 0.92,
      maxHeight: '85%',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
      paddingBottom: 10,
      marginBottom: 10,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 13.5,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'right',
      flex: 1,
      marginRight: 6,
    },
    anonBanner: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.primaryContainer + '08',
      borderColor: theme.colors.primary + '20',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: 8,
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    anonText: {
      fontSize: 10.5,
      color: theme.colors.primary,
      textAlign: 'right',
      flex: 1,
    },
    questionCard: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    questionTitleRow: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 4,
    },
    questionText: {
      fontSize: 12.5,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'right',
      lineHeight: 18,
    },
    // Rating scale styles
    ratingContainer: {
      alignItems: 'center',
      gap: 10,
    },
    ratingRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'center',
      gap: 8,
    },
    ratingCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    ratingNumber: {
      fontSize: 13.5,
      color: theme.colors.secondary,
    },
    ratingLabels: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 8,
    },
    ratingLabelText: {
      fontSize: 9.5,
      color: theme.colors.secondary,
    },
    // Boolean styles
    booleanRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'center',
      gap: 12,
    },
    booleanButton: {
      flex: 1,
      flexDirection: 'row-reverse',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    booleanBtnText: {
      fontSize: 13,
      color: theme.colors.secondary,
    },
    // Multiple Choice Styles
    mcContainer: {
      flexDirection: 'column',
      gap: 6,
    },
    mcButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.colors.border + '50',
      borderRadius: theme.borderRadius.md,
      padding: 11,
      backgroundColor: theme.colors.surfaceContainerLowest,
      gap: 8,
    },
    mcLabelText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    // Text question styles
    textQuestionInput: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      fontSize: 12.5,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surfaceContainerLowest,
      height: 90,
      textAlign: 'right',
      textAlignVertical: 'top',
    },
    // Progress indicator styles
    progressIndicatorBlock: {
      marginVertical: 16,
    },
    progressBarOuter: {
      height: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarInner: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    progressLabelRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    progressLabel: {
      fontSize: 10.5,
      color: theme.colors.secondary,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    prevBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtn: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  return (
    <ScreenWrapper title="نظرسنجی و پیمایش‌ها" navigation={navigation}>
      <View style={styles.container}>
        {renderTabs()}
        {activeTab === 'polls' ? renderPollsContent() : renderSurveysContent()}
      </View>

      {/* Survey Answering Modal */}
      <Modal
        visible={selectedSurvey !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSurveyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSurvey && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={closeSurveyModal}>
                    <MaterialIcons name="close" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedSurvey.title}</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }}>
                  {selectedSurvey.isAnonymous && (
                    <View style={styles.anonBanner}>
                      <MaterialIcons name="shield" size={16} color={theme.colors.primary} />
                      <Text style={styles.anonText}>
                        🛡️ پاسخ شما به صورت ناشناس و بدون ثبت مشخصات فردی ثبت خواهد شد.
                      </Text>
                    </View>
                  )}

                  {renderActiveQuestion()}

                  {/* Progress Indicator */}
                  {surveyQuestions.length > 0 && (
                    <View style={styles.progressIndicatorBlock}>
                      <View style={styles.progressBarOuter}>
                        <View
                          style={[
                            styles.progressBarInner,
                            {
                              width: `${((currentQuestionIdx + 1) / surveyQuestions.length) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.progressLabelRow}>
                        <Text style={styles.progressLabel}>
                          سوال {toFa(currentQuestionIdx + 1)} از {toFa(surveyQuestions.length)}
                        </Text>
                        <Text style={styles.progressLabel}>
                          مدت زمان: {toFa(surveyDuration)} ثانیه
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Navigation Buttons */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.prevBtn, currentQuestionIdx === 0 && { opacity: 0.4 }]}
                    disabled={currentQuestionIdx === 0 || submittingSurvey}
                    onPress={handlePrevQuestion}
                  >
                    <Text style={[styles.tabText, { color: theme.colors.secondary }]}>قبلی</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.nextBtn, submittingSurvey && { opacity: 0.7 }]}
                    disabled={submittingSurvey}
                    onPress={handleNextQuestion}
                  >
                    {submittingSurvey ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.startSurveyBtnText]}>
                        {currentQuestionIdx === surveyQuestions.length - 1 ? 'ارسال پاسخ‌ها' : 'بعدی'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default PollsScreen
