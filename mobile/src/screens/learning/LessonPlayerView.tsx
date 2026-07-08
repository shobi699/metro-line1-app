import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '../../shared/ThemeProvider'
import { ArrowRight, PlayCircle, FileText } from 'lucide-react-native'

export function LessonPlayerView({ 
  course, 
  lessonId, 
  onBack 
}: { 
  course: any, 
  lessonId: string, 
  onBack: () => void 
}) {
  const { theme } = useTheme()

  let selectedLesson = null
  for (const chapter of course.chapters || []) {
    const found = chapter.lessons?.find((l: any) => l.id === lessonId)
    if (found) {
      selectedLesson = found
      break
    }
  }

  if (!selectedLesson) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontFamily: 'Vazirmatn', color: theme.colors.onBackground }}>درس یافت نشد.</Text>
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
          {selectedLesson.title}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {selectedLesson.type === 'video' && selectedLesson.videoUrl && (
          <View style={styles.videoPlaceholder}>
            <PlayCircle size={48} color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8, fontFamily: 'Vazirmatn' }}>پخش ویدئو (موبایل)</Text>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>{selectedLesson.title}</Text>
          <Text style={[styles.textContent, { color: theme.colors.textSecondary }]}>
            {selectedLesson.content || 'محتوایی برای این درس ثبت نشده است.'}
          </Text>
        </View>
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
  videoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { padding: 16 },
  title: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', marginBottom: 16, textAlign: 'right' },
  textContent: { fontSize: 16, fontFamily: 'Vazirmatn', textAlign: 'right', lineHeight: 28 },
})
