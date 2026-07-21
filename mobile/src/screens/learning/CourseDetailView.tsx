import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../shared/ThemeProvider'
import { ChevronRight, PlayCircle, FileText, Lock, CheckCircle, ArrowRight } from 'lucide-react-native'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

export function CourseDetailView({ 
  courseId, 
  onBack, 
  onSelectLesson,
  onStartExam 
}: { 
  courseId: string, 
  onBack: () => void,
  onSelectLesson: (lessonId: string, course: any) => void,
  onStartExam: (examId: string) => void
}) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`${API_URL}/learning/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const json = await res.json()
      if (json.data) setCourse(json.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken) return
    void fetchCourse()
  }, [courseId, accessToken])

  useEffect(() => {
    if (!user) return
    AsyncStorage.getItem(`completed_lessons_${user.id}`).then((stored) => {
      if (stored) {
        setCompletedLessons(JSON.parse(stored))
      }
    })
  }, [user, courseId])

  const handleEnroll = async () => {
    if (!accessToken) return
    setEnrolling(true)
    try {
      const res = await fetch(`${API_URL}/learning/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId,
          progressPct: 0,
        }),
      })
      if (res.ok) {
        void fetchCourse()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error?.message || 'خطا در ثبت‌نام در دوره')
      }
    } catch (e) {
      console.error(e)
      Alert.alert('خطا', 'خطا در ارتباط با سرور')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!course) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontFamily: 'Vazirmatn', color: theme.colors.onBackground }}>دوره یافت نشد.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary, fontFamily: 'Vazirmatn-Bold' }}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const enrollment = course.enrollments?.[0]
  const isEnrolled = !!enrollment
  const progressPct = enrollment?.progressPct || 0
  const isCompleted = enrollment?.status === 'completed'

  // Get all lessons in order
  const allLessons: any[] = []
  course.chapters?.forEach((chap: any) => {
    chap.lessons?.forEach((les: any) => {
      allLessons.push(les)
    })
  })

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowRight color={theme.colors.onBackground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]} numberOfLines={1}>
          {course.title}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>{course.title}</Text>
          <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>{course.description}</Text>
        </View>

        {isEnrolled ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: theme.colors.onBackground }]}>پیشرفت شما</Text>
              <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{progressPct}٪</Text>
            </View>
            <View style={[styles.progressBarOuter, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.progressBarInner, { width: `${progressPct}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.enrollBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.enrollBtnText}>شروع یادگیری (ثبت‌نام)</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.chaptersList}>
          {course.chapters?.map((chapter: any, index: number) => (
            <View key={chapter.id} style={styles.chapter}>
              <Text style={[styles.chapterTitle, { color: theme.colors.onBackground }]}>
                فصل {index + 1}: {chapter.title}
              </Text>
              
              <View style={[styles.lessons, { borderColor: theme.colors.border }]}>
                {chapter.lessons?.map((lesson: any) => {
                  const Icon = (lesson.kind === 'video' || lesson.type === 'video') ? PlayCircle : FileText
                  const lessonIndex = allLessons.findIndex(l => l.id === lesson.id)
                  const isLessonAccessible = isEnrolled && (
                    lessonIndex === 0 || 
                    completedLessons.includes(allLessons[lessonIndex - 1]?.id)
                  )
                  const isLessonCompleted = completedLessons.includes(lesson.id)

                  return (
                    <TouchableOpacity 
                      key={lesson.id} 
                      style={[
                        styles.lessonItem, 
                        { borderBottomColor: theme.colors.border },
                        !isLessonAccessible && { opacity: 0.5 }
                      ]}
                      onPress={() => {
                        if (isLessonAccessible) {
                          onSelectLesson(lesson.id, course)
                        } else {
                          Alert.alert('قفل است', 'لطفاً ابتدا ثبت‌نام کنید یا درس قبلی را کامل کنید.')
                        }
                      }}
                      disabled={!isLessonAccessible}
                    >
                      <View style={styles.lessonRight}>
                        {isLessonAccessible ? (
                          isLessonCompleted ? (
                            <CheckCircle size={20} color={theme.colors.success} />
                          ) : (
                            <Icon size={20} color={theme.colors.primary} />
                          )
                        ) : (
                          <Lock size={20} color={theme.colors.secondary} />
                        )}
                        <Text style={[
                          styles.lessonTitle, 
                          { color: isLessonAccessible ? theme.colors.onBackground : theme.colors.secondary }
                        ]}>{lesson.title}</Text>
                      </View>
                      {isLessonAccessible && <ChevronRight size={16} color={theme.colors.textSecondary} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </View>

        {course.examId && (
          <View style={[styles.examSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.examTitle, { color: theme.colors.onSurface }]}>آزمون پایان دوره</Text>
            <Text style={[styles.examDesc, { color: theme.colors.textSecondary }]}>
              برای دریافت گواهینامه باید در آزمون شرکت کنید و حداقل {course.passScore} درصد نمره کسب کنید.
            </Text>
            {isCompleted ? (
              <View style={styles.graduatedBox}>
                <Text style={styles.graduatedText}>شما با موفقیت در این دوره فارغ‌التحصیل شدید! 🎉</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.examBtn, 
                  { backgroundColor: theme.colors.primary },
                  progressPct < 100 && { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (progressPct === 100) {
                    onStartExam(course.examId!)
                  } else {
                    Alert.alert('آزمون قفل است', 'شرکت در آزمون پس از تکمیل تمام درس‌های دوره امکان‌پذیر است.')
                  }
                }}
                disabled={progressPct < 100}
              >
                <Text style={styles.examBtnText}>
                  {progressPct === 100 ? 'شرکت در آزمون' : 'شرکت در آزمون (پس از تکمیل درس‌ها)'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Vazirmatn-Bold', textAlign: 'right' },
  content: { flex: 1 },
  infoSection: { padding: 16 },
  title: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', marginBottom: 8, textAlign: 'right' },
  desc: { fontSize: 14, fontFamily: 'Vazirmatn', textAlign: 'right', lineHeight: 22 },
  chaptersList: { padding: 16 },
  chapter: { marginBottom: 24 },
  chapterTitle: { fontSize: 16, fontFamily: 'Vazirmatn-Bold', marginBottom: 12, textAlign: 'right' },
  lessons: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  lessonRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonTitle: { fontSize: 14, fontFamily: 'Vazirmatn' },
  examSection: { margin: 16, padding: 16, borderWidth: 1, borderRadius: 8 },
  examTitle: { fontSize: 16, fontFamily: 'Vazirmatn-Bold', marginBottom: 8, textAlign: 'right' },
  examDesc: { fontSize: 12, fontFamily: 'Vazirmatn', marginBottom: 16, textAlign: 'right' },
  examBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  examBtnText: { color: 'white', fontFamily: 'Vazirmatn-Bold', fontSize: 14 },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Vazirmatn-Bold',
  },
  progressValue: {
    fontSize: 13,
    fontFamily: 'Vazirmatn-Bold',
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
  },
  enrollBtn: {
    marginHorizontal: 16,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  enrollBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Vazirmatn-Bold',
  },
  graduatedBox: {
    backgroundColor: '#10b98115',
    borderColor: '#10b98140',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  graduatedText: {
    color: '#10b981',
    fontSize: 13,
    fontFamily: 'Vazirmatn-Bold',
    textAlign: 'center',
  },
})
