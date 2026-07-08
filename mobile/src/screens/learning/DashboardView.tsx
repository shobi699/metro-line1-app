import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useTheme } from '../../shared/ThemeProvider'
import { BookOpen, GraduationCap, ChevronRight } from 'lucide-react-native'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

export function DashboardView({ onSelectCourse }: { onSelectCourse: (id: string) => void }) {
  const { theme, isDark } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_URL}/learning/courses`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        if (json.data) setCourses(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [accessToken])

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>مرکز آموزش</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          دوره‌های مرتبط با نقش سازمانی خود را مشاهده کنید.
        </Text>
      </View>

      <View style={styles.list}>
        {courses.map(course => (
          <TouchableOpacity 
            key={course.id} 
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => onSelectCourse(course.id)}
          >
            {course.coverUrl ? (
              <Image source={{ uri: course.coverUrl }} style={styles.cover} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
                <GraduationCap size={48} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {course.title}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {course.description || 'بدون توضیحات'}
              </Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                    قبولی: {course.passScore}٪
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 24 },
  title: { fontSize: 24, fontFamily: 'Vazirmatn-Bold', marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Vazirmatn' },
  list: { padding: 16, gap: 16 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cover: { width: '100%', height: 160 },
  coverPlaceholder: { width: '100%', height: 160, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Vazirmatn-Bold', marginBottom: 8, textAlign: 'right' },
  cardDesc: { fontSize: 12, fontFamily: 'Vazirmatn', marginBottom: 16, textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Vazirmatn-Bold' },
})
