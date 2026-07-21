import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useTheme } from '../../shared/ThemeProvider'
import { ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react-native'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

export function ExamRunnerView({ examId, onBack }: { examId: string, onBack: () => void }) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [exam, setExam] = useState<any>(null)
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!accessToken) return
    const fetchExam = async () => {
      try {
        const res = await fetch(`${API_URL}/learning/exams/${examId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.data) setExam(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId, accessToken])

  const handleStart = async () => {
    setStarting(true)
    try {
      const res = await fetch(`${API_URL}/learning/exams/${examId}/attempt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const json = await res.json()
      if (json.data) {
        let parsedQuestions = []
        try {
          if (json.data.snapshot) {
            parsedQuestions = JSON.parse(json.data.snapshot)
          }
        } catch (e) {
          console.error('Error parsing snapshot:', e)
        }
        setAttempt({ ...json.data, questions: parsedQuestions })
      } else {
        Alert.alert('خطا', json.error?.message || 'شروع آزمون با خطا مواجه شد.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setStarting(false)
    }
  }

  const handleSubmit = async () => {
    if (!attempt) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/learning/exams/attempt/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      })
      const json = await res.json()
      if (json.data) {
        setResult(json.data)
      } else {
        Alert.alert('خطا', json.error?.message || 'خطا در ثبت آزمون')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!exam) return null

  if (result) {
    const passed = result.score >= exam.passScore
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        {passed ? (
          <CheckCircle size={64} color={theme.colors.success} />
        ) : (
          <XCircle size={64} color={theme.colors.error} />
        )}
        <Text style={[styles.resultTitle, { color: theme.colors.onBackground }]}>
          {passed ? 'تبریک! شما در آزمون قبول شدید.' : 'متاسفانه نمره قبولی کسب نشد.'}
        </Text>
        <Text style={[styles.resultScore, { color: theme.colors.textSecondary }]}>
          نمره شما: {result.score} از ۱۰۰
        </Text>
        <TouchableOpacity onPress={onBack} style={[styles.btn, { backgroundColor: theme.colors.primary, marginTop: 24 }]}>
          <Text style={styles.btnText}>بازگشت به دوره‌ها</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!attempt) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowRight color={theme.colors.onBackground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]} numberOfLines={1}>
            آزمون: {exam.title}
          </Text>
        </View>
        <View style={styles.startSection}>
          <Text style={[styles.examTitle, { color: theme.colors.onBackground }]}>شرایط آزمون</Text>
          <Text style={[styles.examDetail, { color: theme.colors.textSecondary }]}>تعداد سوالات: {exam.questionCount}</Text>
          <Text style={[styles.examDetail, { color: theme.colors.textSecondary }]}>زمان: {exam.durationMin} دقیقه</Text>
          <Text style={[styles.examDetail, { color: theme.colors.textSecondary }]}>حدنصاب قبولی: {exam.passScore}٪</Text>
          
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.colors.primary, marginTop: 32 }]}
            onPress={handleStart}
            disabled={starting}
          >
            {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>شروع آزمون</Text>}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground, textAlign: 'center' }]}>
          در حال برگزاری...
        </Text>
      </View>
      <ScrollView style={styles.content}>
        {attempt.questions?.map((q: any, i: number) => (
          <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.questionText, { color: theme.colors.onSurface }]}>
              {i + 1}. {q.text}
            </Text>
            {(() => {
              let parsedOptions: any[] = []
              try {
                if (q.options) {
                  parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                }
              } catch (e) {
                console.error(e)
              }
              return parsedOptions?.map((opt: any) => {
                const isSelected = answers[q.id] === String(opt.id)
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.option, 
                      { 
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent'
                      }
                    ]}
                    onPress={() => setAnswers(prev => ({ ...prev, [q.id]: String(opt.id) }))}
                  >
                    <View style={[styles.radio, { borderColor: isSelected ? theme.colors.primary : theme.colors.textSecondary }]}>
                      {isSelected && <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />}
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.onSurface }]}>{opt.text}</Text>
                  </TouchableOpacity>
                )
              })
            })()}
          </View>
        ))}
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: theme.colors.primary, marginVertical: 24 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ثبت نهایی</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Vazirmatn-Bold', textAlign: 'right' },
  content: { flex: 1, padding: 16 },
  startSection: { padding: 24, alignItems: 'center' },
  examTitle: { fontSize: 24, fontFamily: 'Vazirmatn-Bold', marginBottom: 16 },
  examDetail: { fontSize: 16, fontFamily: 'Vazirmatn', marginBottom: 8 },
  btn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnText: { color: 'white', fontFamily: 'Vazirmatn-Bold', fontSize: 16 },
  questionCard: { borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  questionText: { fontSize: 16, fontFamily: 'Vazirmatn-Bold', marginBottom: 16, textAlign: 'right' },
  option: { flexDirection: 'row-reverse', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  optionText: { flex: 1, fontSize: 14, fontFamily: 'Vazirmatn', textAlign: 'right' },
  resultTitle: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', marginTop: 16, textAlign: 'center' },
  resultScore: { fontSize: 16, fontFamily: 'Vazirmatn', marginTop: 8, textAlign: 'center' },
})
