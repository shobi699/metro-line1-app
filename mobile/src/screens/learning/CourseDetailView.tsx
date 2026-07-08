import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
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
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
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
    fetchCourse()
  }, [courseId, accessToken])

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

        <View style={styles.chaptersList}>
          {course.chapters?.map((chapter: any, index: number) => (
            <View key={chapter.id} style={styles.chapter}>
              <Text style={[styles.chapterTitle, { color: theme.colors.onBackground }]}>
                فصل {index + 1}: {chapter.title}
              </Text>
              
              <View style={[styles.lessons, { borderColor: theme.colors.border }]}>
                {chapter.lessons?.map((lesson: any) => {
                  const Icon = lesson.type === 'video' ? PlayCircle : FileText
                  return (
                    <TouchableOpacity 
                      key={lesson.id} 
                      style={[styles.lessonItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => onSelectLesson(lesson.id, course)}
                    >
                      <View style={styles.lessonRight}>
                        <Icon size={20} color={theme.colors.primary} />
                        <Text style={[styles.lessonTitle, { color: theme.colors.onBackground }]}>{lesson.title}</Text>
                      </View>
                      <ChevronRight size={16} color={theme.colors.textSecondary} />
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
            <TouchableOpacity 
              style={[styles.examBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => onStartExam(course.examId!)}
            >
              <Text style={styles.examBtnText}>شرکت در آزمون</Text>
            </TouchableOpacity>
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
})
